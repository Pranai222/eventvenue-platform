package com.eventvenue.service;

import com.eventvenue.dto.AuthResponse;
import com.eventvenue.dto.SignupRequest;
import com.eventvenue.entity.Vendor;
import com.eventvenue.entity.User;
import com.eventvenue.entity.WithdrawalRequest;
import com.eventvenue.repository.VendorRepository;
import com.eventvenue.repository.UserRepository;
import com.eventvenue.repository.WithdrawalRequestRepository;
import com.eventvenue.repository.CreditTransactionRepository;
import com.eventvenue.entity.CreditTransaction;
import com.eventvenue.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.List;

@Service
public class VendorService {

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WithdrawalRequestRepository withdrawalRequestRepository;

    @Autowired
    private CreditTransactionRepository creditTransactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Autowired
    private EmailService emailService;

    public AuthResponse registerVendorResponse(SignupRequest request) {
        // Check if email already registered as VENDOR
        Optional<Vendor> existingVendor = vendorRepository.findByEmail(request.getEmail());
        if (existingVendor.isPresent()) {
            Vendor vendor = existingVendor.get();
            // If unverified, delete and allow re-registration
            if (!vendor.getIsVerified()) {
                vendorRepository.delete(vendor);
                // Also delete the corresponding user entry
                Optional<User> existingUser = userRepository.findByEmailAndRole(request.getEmail(), "VENDOR");
                if (existingUser.isPresent()) {
                    userRepository.delete(existingUser.get());
                }
                System.out.println("[pranai] Deleted unverified vendor for re-registration: " + request.getEmail());
            } else {
                throw new RuntimeException("Email already registered as a verified vendor");
            }
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role("VENDOR")
                .points(200L)  // Vendors get 200 welcome points
                .isVerified(false)
                .build();

        user = userRepository.save(user);

        Vendor vendor = Vendor.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .businessName(request.getBusinessName())
                .description(request.getBusinessDescription())
                .businessPhone(request.getBusinessPhone())
                .businessAddress(request.getBusinessAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .status("PENDING")
                .isVerified(false)
                .isActive(true)
                .rating(0.0)
                .totalVenues(0)
                .build();

        vendor = vendorRepository.save(vendor);
        
        // Audit log vendor registration
        auditLogService.log("VENDOR_REGISTERED", "VENDOR", vendor.getId(), 
            "New vendor registered: " + vendor.getBusinessName() + " (" + vendor.getEmail() + ")");

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), "VENDOR");

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role("VENDOR")
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .businessName(vendor.getBusinessName())
                .businessDescription(vendor.getDescription())
                .message("Vendor registered successfully. Pending admin approval")
                .build();
    }

    public Vendor registerVendor(String businessName, String email, String password) {
        if (vendorRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        Vendor vendor = Vendor.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .businessName(businessName)
                .status("PENDING")
                .isVerified(false)
                .isActive(true)
                .rating(0.0)
                .totalVenues(0)
                .build();

        return vendorRepository.save(vendor);
    }

    public Optional<Vendor> findByEmail(String email) {
        return vendorRepository.findByEmail(email);
    }

    public Optional<Vendor> findById(Long id) {
        return vendorRepository.findById(id);
    }

    public List<Vendor> getAllPendingVendors() {
        return vendorRepository.findByStatus("PENDING");
    }

    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    public List<Vendor> getPendingVendors() {
        return vendorRepository.findByStatus("PENDING");
    }

    public void deleteVendor(Long vendorId) {
        if (!vendorRepository.existsById(vendorId)) {
            throw new RuntimeException("Vendor not found");
        }
        vendorRepository.deleteById(vendorId);
    }

    public Vendor approveVendor(Long vendorId) {
        Optional<Vendor> vendorOptional = vendorRepository.findById(vendorId);
        if (vendorOptional.isPresent()) {
            Vendor vendor = vendorOptional.get();
            vendor.setStatus("APPROVED");
            vendor.setIsVerified(true);
            Vendor saved = vendorRepository.save(vendor);
            
            // IMPORTANT: Also update the User entity's isVerified field
            // This is needed because User Management page loads from User table
            Optional<User> userOptional = userRepository.findByEmailAndRole(vendor.getEmail(), "VENDOR");
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                user.setIsVerified(true);
                userRepository.save(user);
                System.out.println("[EventVenue] Updated User.isVerified to true for vendor: " + vendor.getEmail());
            }
            
            // Audit log vendor approval
            auditLogService.log("VENDOR_APPROVED", "VENDOR", vendor.getId(), 
                "Vendor approved: " + vendor.getBusinessName(), "ADMIN", "ADMIN", null);
            
            // Send approval email with login link
            emailService.sendVendorApprovalEmail(vendor.getEmail(), vendor.getBusinessName());
            System.out.println("[EventVenue] Approval email sent to vendor: " + vendor.getEmail());
            
            return saved;
        }
        throw new RuntimeException("Vendor not found");
    }

    public Vendor rejectVendor(Long vendorId, String reason) {
        Optional<Vendor> vendorOptional = vendorRepository.findById(vendorId);
        if (vendorOptional.isPresent()) {
            Vendor vendor = vendorOptional.get();
            vendor.setStatus("REJECTED");
            Vendor saved = vendorRepository.save(vendor);
            
            // Audit log vendor rejection
            auditLogService.log("VENDOR_REJECTED", "VENDOR", vendor.getId(), 
                "Vendor rejected: " + vendor.getBusinessName() + ". Reason: " + reason, "ADMIN", "ADMIN", null);
            
            // Send rejection email with reason
            emailService.sendVendorRejectionEmail(vendor.getEmail(), vendor.getBusinessName(), reason);
            System.out.println("[EventVenue] Rejection email sent to vendor: " + vendor.getEmail());
            
            return saved;
        }
        throw new RuntimeException("Vendor not found");
    }

    public Vendor updateVendor(Long vendorId, Vendor vendorDetails) {
        Optional<Vendor> vendorOptional = vendorRepository.findById(vendorId);
        if (vendorOptional.isPresent()) {
            Vendor vendor = vendorOptional.get();
            if (vendorDetails.getBusinessPhone() != null) {
                vendor.setBusinessPhone(vendorDetails.getBusinessPhone());
            }
            if (vendorDetails.getBusinessAddress() != null) {
                vendor.setBusinessAddress(vendorDetails.getBusinessAddress());
            }
            if (vendorDetails.getCity() != null) {
                vendor.setCity(vendorDetails.getCity());
            }
            if (vendorDetails.getState() != null) {
                vendor.setState(vendorDetails.getState());
            }
            if (vendorDetails.getPincode() != null) {
                vendor.setPincode(vendorDetails.getPincode());
            }
            if (vendorDetails.getDescription() != null) {
                vendor.setDescription(vendorDetails.getDescription());
            }
            return vendorRepository.save(vendor);
        }
        throw new RuntimeException("Vendor not found");
    }

    // Overloaded method for updating vendor directly (used by OTP verification)
    public Vendor updateVendor(Vendor vendor) {
        return vendorRepository.save(vendor);
    }

    /**
     * Purchase points for a vendor
     */
    public Vendor purchasePoints(Long vendorId, Long points, String paymentMethod, String transactionId) {
        Optional<Vendor> vendorOptional = vendorRepository.findById(vendorId);
        if (vendorOptional.isPresent()) {
            Vendor vendor = vendorOptional.get();
            Long currentPoints = vendor.getPoints() != null ? vendor.getPoints() : 0L;
            vendor.setPoints(currentPoints + points);
            Vendor saved = vendorRepository.save(vendor);
            
            // Create a credit transaction record for the purchase
            // Note: credit_transactions.user_id FK references users table, so we need to find the user by vendor email
            Optional<User> userOptional = userRepository.findByEmailAndRole(vendor.getEmail(), "VENDOR");
            if (userOptional.isPresent()) {
                CreditTransaction transaction = new CreditTransaction();
                transaction.setUserId(userOptional.get().getId()); // Use user ID, not vendor ID
                transaction.setTransactionType("VENDOR_PURCHASE");
                transaction.setPointsAmount(points.intValue());
                transaction.setStripePaymentIntentId(transactionId); // Using this field for PayPal transaction ID
                transaction.setStatus("COMPLETED");
                transaction.setReason("Vendor points purchase via " + paymentMethod);
                creditTransactionRepository.save(transaction);
            }
            
            System.out.println("[VendorService] Points purchased - Vendor: " + vendor.getBusinessName() + 
                              ", Points: " + points + ", Method: " + paymentMethod + ", Tx: " + transactionId);
            
            return saved;
        }
        throw new RuntimeException("Vendor not found");
    }

    /**
 * Get vendor transaction history
 */
public java.util.List<java.util.Map<String, Object>> getVendorTransactions(Long vendorId) {
    java.util.List<java.util.Map<String, Object>> transactions = new java.util.ArrayList<>();
    
    // Fetch real withdrawal requests from database
    List<WithdrawalRequest> withdrawals = withdrawalRequestRepository.findByUserIdOrderByCreatedAtDesc(vendorId);
    
    for (WithdrawalRequest w : withdrawals) {
        java.util.Map<String, Object> tx = new java.util.HashMap<>();
        tx.put("id", w.getId());
        tx.put("type", "WITHDRAWAL");
        tx.put("points", -w.getPointsAmount()); // Negative for withdrawal
        tx.put("amount", w.getAmountUsd());
        tx.put("description", "Withdrawal to PayPal: " + (w.getPaypalEmail() != null ? w.getPaypalEmail() : "N/A"));
        tx.put("status", w.getStatus());
        tx.put("createdAt", w.getCreatedAt() != null ? w.getCreatedAt().toString() : "");
        transactions.add(tx);
    }
    
    // Also add vendor activity (welcome bonus, purchases)
    Optional<Vendor> vendorOptional = vendorRepository.findById(vendorId);
    if (vendorOptional.isPresent()) {
        Vendor vendor = vendorOptional.get();
        
        // Welcome bonus transaction
        java.util.Map<String, Object> welcomeTx = new java.util.HashMap<>();
        welcomeTx.put("id", "welcome");
        welcomeTx.put("type", "CREDIT");
        welcomeTx.put("points", 200);
        welcomeTx.put("description", "Welcome bonus - New vendor registration");
        welcomeTx.put("status", "COMPLETED");
        welcomeTx.put("createdAt", vendor.getCreatedAt() != null ? vendor.getCreatedAt().toString() : java.time.LocalDateTime.now().minusDays(30).toString());
        transactions.add(welcomeTx);
        
        // Fetch PURCHASE transactions from CreditTransaction table
        // Note: credit_transactions uses user_id FK, so find user by vendor email
        Optional<User> userOptional = userRepository.findByEmailAndRole(vendor.getEmail(), "VENDOR");
        if (userOptional.isPresent()) {
            Long userId = userOptional.get().getId();
            List<CreditTransaction> purchases = creditTransactionRepository.findByUserIdAndTransactionType(userId, "VENDOR_PURCHASE");
            for (CreditTransaction purchase : purchases) {
                java.util.Map<String, Object> tx = new java.util.HashMap<>();
                tx.put("id", purchase.getId());
                tx.put("type", "PURCHASE");
                tx.put("points", purchase.getPointsAmount());
                tx.put("amount", purchase.getAmountUsd());
                tx.put("description", purchase.getReason() != null ? purchase.getReason() : "Points purchase via PayPal");
                tx.put("status", purchase.getStatus());
                tx.put("createdAt", purchase.getCreatedAt() != null ? purchase.getCreatedAt().toString() : "");
                transactions.add(tx);
            }
        }
    }  
    // Sort by createdAt descending
    transactions.sort((a, b) -> {
        String dateA = (String) a.getOrDefault("createdAt", "");
        String dateB = (String) b.getOrDefault("createdAt", "");
        return dateB.compareTo(dateA);
    });
    
    return transactions;
}
}
