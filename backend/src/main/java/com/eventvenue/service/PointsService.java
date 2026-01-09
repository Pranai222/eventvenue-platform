package com.eventvenue.service;

import com.eventvenue.entity.PointHistory;
import com.eventvenue.entity.User;
import com.eventvenue.repository.PointHistoryRepository;
import com.eventvenue.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PointsService {

    @Autowired
    private PointHistoryRepository pointHistoryRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AdminService adminService;
    
    @Autowired
    private EmailService emailService;

    @Transactional
    public boolean deductPoints(Long userId, Long points, String reason, Long bookingId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();
        if (user.getPoints() < points) {
            return false;
        }

        Long previousPoints = user.getPoints();
        Long newPoints = previousPoints - points;
        user.setPoints(newPoints);
        userRepository.save(user);

        PointHistory history = PointHistory.builder()
                .userId(userId)
                .pointsChanged(-points) // Negative for deduction, using EXACT DB field name
                .reason(reason)
                .previousPoints(previousPoints)
                .newPoints(newPoints)
                .build();
        pointHistoryRepository.save(history);
        
        // NOTE: Individual email DISABLED for booking-related deductions
        // BookingService now sends consolidated invoice email with all details
        // Only send email for non-booking related deductions (when bookingId is null)
        if (bookingId == null) {
            sendPointsEmail(user, -points.intValue(), "Redeemed", reason, newPoints.intValue());
        }

        return true;
    }

    @Transactional
    public void addPoints(Long userId, Long points, String reason, Long bookingId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();
        Long previousPoints = user.getPoints();
        Long newPoints = previousPoints + points;
        user.setPoints(newPoints);
        userRepository.save(user);

        PointHistory history = PointHistory.builder()
                .userId(userId)
                .pointsChanged(points) // Positive for addition, using EXACT DB field name
                .reason(reason)
                .previousPoints(previousPoints)
                .newPoints(newPoints)
                .build();
        pointHistoryRepository.save(history);
        
        // NOTE: Only send email for non-booking related additions (welcome bonus, etc.)
        if (bookingId == null) {
            sendPointsEmail(user, points.intValue(), "Earned", reason, newPoints.intValue());
        }
    }

    @Transactional
    public void refundPoints(Long userId, Long points, String reason, Long bookingId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();
        Long previousPoints = user.getPoints();
        Long newPoints = previousPoints + points;
        user.setPoints(newPoints);
        userRepository.save(user);

        PointHistory history = PointHistory.builder()
                .userId(userId)
                .pointsChanged(points) // Using EXACT DB field name
                .reason(reason)
                .previousPoints(previousPoints)
                .newPoints(newPoints)
                .build();
        pointHistoryRepository.save(history);
        
        // NOTE: Individual email DISABLED for booking cancellation refunds
        // BookingService sends consolidated cancellation invoice email instead
    }

    @Transactional
    public User purchasePoints(Long userId, Long pointsAmount, String paymentMethod, String transactionId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();
        Long previousPoints = user.getPoints();
        Long newPoints = previousPoints + pointsAmount;
        user.setPoints(newPoints);
        user = userRepository.save(user);

        PointHistory history = PointHistory.builder()
                .userId(userId)
                .pointsChanged(pointsAmount) // Using correct DB field name
                .reason("Purchased via " + paymentMethod + " (Transaction: " + transactionId + ")")
                .previousPoints(previousPoints)
                .newPoints(newPoints)
                .build();
        pointHistoryRepository.save(history);

        return user;
    }

    public List<PointHistory> getUserPointsHistory(Long userId) {
        return pointHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Long getUserPoints(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        return userOpt.map(User::getPoints).orElse(0L);
    }

    public int getPointsPerDollar() {
        return adminService.getConversionRate().getPointsPerDollar();
    }

    public Long calculatePointsForAmount(Double dollarAmount) {
        int conversionRate = adminService.getConversionRate().getPointsPerDollar();
        return Math.round(dollarAmount * conversionRate);
    }
    
    /**
     * Send points notification email
     */
    private void sendPointsEmail(User user, int points, String action, String reason, int newBalance) {
        try {
            String userName = user.getFirstName() != null ? user.getFirstName() : user.getUsername();
            emailService.sendPointsNotification(
                user.getEmail(),
                userName,
                points,
                action,
                reason,
                newBalance
            );
            System.out.println("[EMAIL] Sent points notification to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("[EMAIL] Failed to send points notification: " + e.getMessage());
        }
    }
}
