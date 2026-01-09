package com.eventvenue.service;

import com.eventvenue.entity.WithdrawalRequest;
import com.eventvenue.entity.User;
import com.eventvenue.entity.Vendor;
import com.eventvenue.entity.CreditTransaction;
import com.eventvenue.entity.SystemSettings;
import com.eventvenue.repository.WithdrawalRequestRepository;
import com.eventvenue.repository.UserRepository;
import com.eventvenue.repository.VendorRepository;
import com.eventvenue.repository.CreditTransactionRepository;
import com.eventvenue.repository.SystemSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class WithdrawalService {

    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final CreditTransactionRepository creditTransactionRepository;
    private final StripePaymentService stripePaymentService;
    private final SystemSettingsRepository systemSettingsRepository;
    
    @Autowired
    private EmailService emailService;

    public WithdrawalService(
            WithdrawalRequestRepository withdrawalRequestRepository,
            UserRepository userRepository,
            VendorRepository vendorRepository,
            CreditTransactionRepository creditTransactionRepository,
            StripePaymentService stripePaymentService,
            SystemSettingsRepository systemSettingsRepository) {
        this.withdrawalRequestRepository = withdrawalRequestRepository;
        this.userRepository = userRepository;
        this.vendorRepository = vendorRepository;
        this.creditTransactionRepository = creditTransactionRepository;
        this.stripePaymentService = stripePaymentService;
        this.systemSettingsRepository = systemSettingsRepository;
    }

    /**
     * Submit a withdrawal request
     */
    @Transactional
    public WithdrawalRequest submitWithdrawal(Long userId, Integer pointsAmount, String paypalEmail) throws Exception {
        // Try to find as User first, then Vendor
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Vendor> vendorOpt = vendorRepository.findById(userId);
        
        Long currentPoints = 0L;
        boolean isVendor = false;
        User user = null;
        Vendor vendor = null;
        
        if (userOpt.isPresent()) {
            user = userOpt.get();
            currentPoints = user.getPoints() != null ? user.getPoints() : 0L;
        } else if (vendorOpt.isPresent()) {
            vendor = vendorOpt.get();
            currentPoints = vendor.getPoints() != null ? vendor.getPoints() : 0L;
            isVendor = true;
        } else {
            throw new Exception("User/Vendor not found with ID: " + userId);
        }

        // Check if has enough points
        if (currentPoints < pointsAmount) {
            throw new Exception("Insufficient points. Available: " + currentPoints + ", Requested: " + pointsAmount);
        }

        // Get dynamic conversion rate from admin settings
        BigDecimal conversionRate = getConversionRate();
        // Calculate INR amount (points / conversionRate = INR)
        BigDecimal amountInr = new BigDecimal(pointsAmount).divide(conversionRate, 2, RoundingMode.HALF_UP);

        // DEDUCT POINTS from user/vendor
        if (isVendor && vendor != null) {
            vendor.setPoints(currentPoints - pointsAmount);
            vendorRepository.save(vendor);
            System.out.println("[Withdrawal] Deducted " + pointsAmount + " points from vendor " + userId + ". New balance: " + vendor.getPoints());
        } else if (user != null) {
            user.setPoints(currentPoints - pointsAmount);
            userRepository.save(user);
            System.out.println("[Withdrawal] Deducted " + pointsAmount + " points from user " + userId + ". New balance: " + user.getPoints());
        }

        // Create withdrawal request
        WithdrawalRequest request = new WithdrawalRequest();
        request.setUserId(userId);
        request.setPointsAmount(pointsAmount);
        request.setAmountUsd(amountInr); // Storing INR in this field
        request.setStatus("PENDING");
        request.setPaypalEmail(paypalEmail);

        // Check if requires approval (> 10000 points)
        boolean requiresApproval = request.requiresAdminApproval();
        request.setRequiresApproval(requiresApproval);

        return withdrawalRequestRepository.save(request);
    }
    
    /**
     * Get dynamic conversion rate from admin settings
     */
    private BigDecimal getConversionRate() {
        Optional<SystemSettings> setting = systemSettingsRepository.findBySettingKey("points_per_dollar");
        if (setting.isPresent()) {
            try {
                return new BigDecimal(setting.get().getSettingValue());
            } catch (Exception e) {
                return new BigDecimal("100"); // Default
            }
        }
        return new BigDecimal("100"); // Default: 100 points = 1 INR
    }

    /**
     * Get all withdrawal requests for a user
     */
    public List<WithdrawalRequest> getUserWithdrawals(Long userId) {
        return withdrawalRequestRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get pending withdrawals that require approval (for admin)
     */
    public List<WithdrawalRequest> getPendingApprovals() {
        return withdrawalRequestRepository.findByRequiresApprovalTrueAndStatusOrderByCreatedAtDesc("PENDING");
    }

    /**
     * Approve a withdrawal request
     */
    @Transactional
    public WithdrawalRequest approveWithdrawal(Long withdrawalId, Long adminId, String notes) throws Exception {
        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new Exception("Withdrawal request not found: " + withdrawalId));

        if (!request.isPending()) {
            throw new Exception("Withdrawal is not pending. Current status: " + request.getStatus());
        }

        request.approve(adminId, notes);
        WithdrawalRequest savedRequest = withdrawalRequestRepository.save(request);
        
        // Send email notification to user
        try {
            User user = userRepository.findById(request.getUserId()).orElse(null);
            if (user != null && user.getEmail() != null) {
                String subject = "Withdrawal Request Approved";
                String body = String.format(
                    "Dear %s,\n\n" +
                    "Your withdrawal request has been approved!\n\n" +
                    "Details:\n" +
                    "- Points: %d\n" +
                    "- Amount: $%.2f USD\n\n" +
                    "The amount will be credited to your account shortly.\n\n" +
                    "Thank you for using EventVenue!\n\n" +
                    "Best regards,\nEventVenue Team",
                    user.getFirstName() != null ? user.getFirstName() : "Vendor",
                    request.getPointsAmount(),
                    request.getAmountUsd()
                );
                emailService.sendSimpleEmail(user.getEmail(), subject, body);
            }
        } catch (Exception e) {
            // Log but don't fail the approval
            System.err.println("Failed to send withdrawal approval email: " + e.getMessage());
        }
        
        return savedRequest;
    }

    /**
     * Reject a withdrawal request
     */
    @Transactional
    public WithdrawalRequest rejectWithdrawal(Long withdrawalId, Long adminId, String notes) throws Exception {
        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new Exception("Withdrawal request not found: " + withdrawalId));

        if (!request.isPending()) {
            throw new Exception("Withdrawal is not pending. Current status: " + request.getStatus());
        }

        request.reject(adminId, notes);
        return withdrawalRequestRepository.save(request);
    }

    /**
     * Process a withdrawal (deduct points and create transaction)
     * Can be called directly for <$1000 or after admin approval
     */
    @Transactional
    public WithdrawalRequest processWithdrawal(Long withdrawalId, String cardLast4) throws Exception {
        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new Exception("Withdrawal request not found: " + withdrawalId));

        // Check status - must be PENDING (for <$1000) or APPROVED (for >=$1000)
        if (request.getRequiresApproval() && !request.isApproved()) {
            throw new Exception("Withdrawal requires admin approval first");
        }

        if (!request.isPending() && !request.isApproved()) {
            throw new Exception("Invalid withdrawal status: " + request.getStatus());
        }

        // Deduct points from user
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new Exception("User not found: " + request.getUserId()));

        Long currentPoints = user.getPoints() != null ? user.getPoints() : 0L;
        if (currentPoints < request.getPointsAmount()) {
            throw new Exception("Insufficient points");
        }

        user.setPoints(currentPoints - request.getPointsAmount());
        userRepository.save(user);

        // Create transaction record
        CreditTransaction transaction = CreditTransaction.createWithdrawal(
                request.getUserId(),
                request.getAmountUsd(),
                request.getPointsAmount()
        );
        transaction.setStatus("COMPLETED");
        transaction.setAdminNotes("Withdrawal processed. Card: ****" + cardLast4);
        creditTransactionRepository.save(transaction);

        // Update withdrawal request
        request.setStatus("COMPLETED");
        request.setCardLast4(cardLast4);
        // TODO: In production, integrate with actual Stripe payout/transfer
        request.setStripePayoutId("simulated_payout_" + System.currentTimeMillis());

        return withdrawalRequestRepository.save(request);
    }
}
