package com.eventvenue.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.name}")
    private String appName;

    @Value("${app.email}")
    private String fromEmail;

    @Value("${app.url}")
    private String appUrl;

    /**
     * Send OTP verification email with welcome message
     */
    @Async
    public void sendOtpEmail(String toEmail, String otp, String role) {
        try {
            String subject = "Welcome to " + appName + " - Verify Your Email";
            String htmlContent = buildOtpEmailTemplate(toEmail, otp, role);
            
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("OTP email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", toEmail, e);
            // Fallback to console for development
            System.out.println("========================================");
            System.out.println("EMAIL NOT CONFIGURED - OTP CODE");
            System.out.println("To: " + toEmail);
            System.out.println("OTP: " + otp);
            System.out.println("========================================");
        }
    }

    // Backward compatibility
    public void sendOtpEmail(String email, String otp) {
        sendOtpEmail(email, otp, "USER");
    }

    /**
     * Build professional OTP email HTML template
     */
    private String buildOtpEmailTemplate(String email, String otp, String role) {
        String roleDisplay = role.equals("VENDOR") ? "Vendor" : "Member";
        
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .welcome-text { color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .otp-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; text-align: center; }
        .otp-label { color: #666; font-size: 14px; margin-bottom: 10px; }
        .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace; }
        .expiry { color: #999; font-size: 12px; margin-top: 10px; }
        .info-box { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-box h3 { color: #1976d2; margin-top: 0; }
        .info-box p { color: #555; margin: 10px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .footer a { color: #667eea; text-decoration: none; }
        .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
        .highlight { color: #667eea; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to %s!</h1>
        </div>
        
        <div class="content">
            <p class="welcome-text">
                Hello and welcome! 👋
            </p>
            
            <p class="welcome-text">
                Thank you for registering with <strong>%s</strong>! We're excited to have you with us 
                and can't wait for you to explore amazing events and venues. Your journey to unforgettable 
                experiences starts here! 🌟
            </p>
            
            <div class="otp-box">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">%s</div>
                <div class="expiry">⏱️ Valid for 10 minutes</div>
            </div>
            
            <p class="welcome-text">
                Enter this code on the verification page to complete your registration and unlock:
            </p>
            
            <div class="info-box">
                <h3>✨ What's waiting for you:</h3>
                <p>📅 <strong>Browse Events:</strong> Discover exciting events happening near you</p>
                <p>🏢 <strong>Book Venues:</strong> Find and reserve the perfect venue for your needs</p>
                <p>🎁 <strong>Earn Points:</strong> Get rewards with every booking</p>
                <p>💳 <strong>Secure Payments:</strong> Safe and easy checkout process</p>
            </div>
            
            <div class="divider"></div>
            
            <p style="color: #999; font-size: 13px;">
                <strong>🔒 Security Note:</strong> If you didn't request this code, please ignore this email. 
                Your account is safe and no action is needed.
            </p>
            
            <p style="color: #999; font-size: 13px; margin-top: 20px;">
                Need help? Contact us at <a href="mailto:pranaib20@gmail.com">pranaib20@gmail.com</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 %s. All rights reserved.</p>
            <p>
                <a href="%s">Visit Website</a> | 
                <a href="%s/about">About Us</a> | 
                <a href="%s/contact">Contact</a>
            </p>
        </div>
    </div>
</body>
</html>
""".formatted(appName, appName, otp, appName, appUrl, appUrl, appUrl);
    }

    /**
     * Send HTML email
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true); // true = HTML
        
        mailSender.send(message);
    }

    /**
     * Send simple text email (public method)
     */
    @Async
    public void sendSimpleEmail(String to, String subject, String textContent) {
        try {
            // Convert plain text to simple HTML with line breaks
            String htmlContent = "<html><body style='font-family: Arial, sans-serif; line-height: 1.6;'>" +
                    "<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>" +
                    textContent.replace("\n", "<br>") +
                    "</div></body></html>";
            sendHtmlEmail(to, subject, htmlContent);
            log.info("Simple email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send simple email to: {}", to, e);
            // Console fallback for development
            System.out.println("========================================");
            System.out.println("EMAIL: " + subject);
            System.out.println("To: " + to);
            System.out.println("Content: " + textContent);
            System.out.println("========================================");
        }
    }

    // Keep existing methods for compatibility
    /**
     * Send event booking confirmation email
     */
    @Async
    public void sendEventBookingConfirmation(
            String toEmail, 
            String userName,
            Long bookingId,
            String eventName,
            String eventDate,
            String eventTime,
            String location,
            int quantity,
            double totalAmount,
            int pointsEarned
    ) {
        try {
            String subject = "Booking Confirmed - " + eventName;
            String htmlContent = buildEventBookingTemplate(
                userName, bookingId, eventName, eventDate, eventTime, 
                location, quantity, totalAmount, pointsEarned
            );
            
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Event booking confirmation sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send booking confirmation to: {}", toEmail, e);
        }
    }

    /**
     * Send venue booking confirmation email
     */
    @Async
    public void sendVenueBookingConfirmation(
            String toEmail,
            String userName,
            Long bookingId,
            String venueName,
            String bookingDate,
            String location,
            int capacity,
            double totalAmount,
            int pointsEarned
    ) {
        try {
            String subject = "Venue Reservation Confirmed - " + venueName;
            String htmlContent = buildVenueBookingTemplate(
                userName, bookingId, venueName, bookingDate, 
                location, capacity, totalAmount, pointsEarned
            );
            
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Venue booking confirmation sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send venue booking confirmation to: {}", toEmail, e);
        }
    }

    /**
     * Send points notification email
     */
    @Async
    public void sendPointsNotification(
            String toEmail,
            String userName,
            int points,
            String action,
            String description,
            int newBalance
    ) {
        try {
            String subject = "Points " + action + " - " + Math.abs(points) + " Points";
            String htmlContent = buildPointsNotificationTemplate(
                userName, points, action, description, newBalance
            );
            
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Points notification sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send points notification to: {}", toEmail, e);
        }
    }

    /**
     * Build event booking confirmation template
     */
    private String buildEventBookingTemplate(
            String userName, Long bookingId, String eventName, 
            String eventDate, String eventTime, String location,
            int quantity, double totalAmount, int pointsEarned
    ) {
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .success-badge { background: #ffffff; color: #10b981; padding: 10px 20px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; }
        .content { padding: 40px 30px; }
        .booking-box { background: #f8fafb; border-radius: 12px; padding: 25px; margin: 20px 0; border: 2px solid #e5e7eb; }
        .booking-id { font-size: 14px; color: #6b7280; margin-bottom: 10px; }
        .event-name { font-size: 24px; font-weight: bold; color: #1f2937; margin: 10px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { color: #6b7280; font-weight: 500; }
        .detail-value { color: #1f2937; font-weight: 600; }
        .total-box { background: #10b981; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .total-amount { font-size: 32px; font-weight: bold; }
        .points-badge { background: #fbbf24; color: #78350f; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <div class="success-badge">✓ Successfully Booked</div>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; color: #333;">Hi %s,</p>
            
            <p style="font-size: 16px; color: #333;">
                Great news! Your booking has been confirmed. Get ready for an amazing experience!
            </p>
            
            <div class="booking-box">
                <div class="booking-id">Booking ID: #%d</div>
                <div class="event-name">%s</div>
                
                <div style="margin-top: 20px;">
                    <div class="detail-row">
                        <span class="detail-label">📅 Date</span>
                        <span class="detail-value">%s</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">🕐 Time</span>
                        <span class="detail-value">%s</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">📍 Location</span>
                        <span class="detail-value">%s</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">🎫 Tickets</span>
                        <span class="detail-value">%d</span>
                    </div>
                </div>
            </div>
            
            <div class="total-box">
                <div style="font-size: 14px; margin-bottom: 5px;">Total Amount Paid</div>
                <div class="total-amount">₹%.2f</div>
                <div class="points-badge">🎁 +%d Points Earned!</div>
            </div>
            
            <p style="color: #333; font-size: 14px;">
                <strong>What's Next?</strong><br>
                • Save this confirmation email<br>
                • Arrive 15 minutes before the event<br>
                • Bring a valid ID<br>
                • Show this email at the venue
            </p>
            
            <div style="text-align: center;">
                <a href="%s/user/bookings" class="button">View My Bookings</a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Need help? Contact us at <a href="mailto:pranaib20@gmail.com">pranaib20@gmail.com</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 %s. All rights reserved.</p>
            <p>This is an automated confirmation email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
""".formatted(userName, bookingId, eventName, eventDate, eventTime, location, 
              quantity, totalAmount, pointsEarned, appUrl, appName);
    }

    /**
     * Build venue booking confirmation template
     */
    private String buildVenueBookingTemplate(
            String userName, Long bookingId, String venueName,
            String bookingDate, String location, int capacity,
            double totalAmount, int pointsEarned
    ) {
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #3b82f6 0%%, #1d4ed8 100%%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .success-badge { background: #ffffff; color: #3b82f6; padding: 10px 20px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; }       
        .content { padding: 40px 30px; }
        .venue-box { background: #f8fafb; border-radius: 12px; padding: 25px; margin: 20px 0; border: 2px solid #e5e7eb; }
        .venue-name { font-size: 24px; font-weight: bold; color: #1f2937; margin: 10px 0; }
        .detail-row { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { color: #6b7280; font-weight: 500; display: block; margin-bottom: 5px; }
        .detail-value { color: #1f2937; font-weight: 600; }
        .total-box { background: #3b82f6; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .total-amount { font-size: 32px; font-weight: bold; }
        .points-badge { background: #fbbf24; color: #78350f; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏢 Venue Reserved!</h1>
            <div class="success-badge">✓ Reservation Confirmed</div>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; color: #333;">Hi %s,</p>
            
            <p style="font-size: 16px; color: #333;">
                Your venue has been successfully reserved! We look forward to hosting your event.
            </p>
            
            <div class="venue-box">
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Booking ID: #%d</div>
                <div class="venue-name">%s</div>
                
                <div style="margin-top: 20px;">
                    <div class="detail-row">
                        <span class="detail-label">📅 Booking Date</span>
                        <span class="detail-value">%s</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">📍 Location</span>
                        <span class="detail-value">%s</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">👥 Capacity</span>
                        <span class="detail-value">Up to %d people</span>
                    </div>
                </div>
            </div>
            
            <div class="total-box">
                <div style="font-size: 14px; margin-bottom: 5px;">Total Amount Paid</div>
                <div class="total-amount">₹%.2f</div>
                <div class="points-badge">🎁 +%d Points Earned!</div>
            </div>
            
            <p style="color: #333; font-size: 14px;">
                <strong>Important Information:</strong><br>
                • Venue access will be provided 1 hour before your booking time<br>
                • Please bring this confirmation and valid ID<br>
                • Contact venue staff for setup assistance<br>
                • Review venue rules and regulations
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Questions? Reach out to us at <a href="mailto:pranaib20@gmail.com">pranaib20@gmail.com</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 %s. All rights reserved.</p>
            <p>This is an automated confirmation email.</p>
        </div>
    </div>
</body>
</html>
""".formatted(userName, bookingId, venueName, bookingDate, location, capacity, totalAmount, pointsEarned, appName);
    }

    /**
     * Build points notification template
     */
    private String buildPointsNotificationTemplate(
            String userName, int points, String action,
            String description, int newBalance
    ) {
        boolean isEarned = points > 0;
        String color = isEarned ? "#10b981" : "#ef4444";
        String icon = isEarned ? "🎁" : "💳";
        String actionText = isEarned ? "Earned" : "Redeemed";
        
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: %s; padding: 40px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .points-box { background: #f8fafb; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; border: 3px dashed %s; }
        .points-amount { font-size: 48px; font-weight: bold; color: %s; }
        .balance-box { background: #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .balance-row { display: flex; justify-content: space-between; padding: 10px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { background: %s; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>%s Points %s!</h1>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; color: #333;">Hi %s,</p>
            
            <div class="points-box">
                <div style="font-size: 18px; color: #6b7280; margin-bottom: 10px;">%s</div>
                <div class="points-amount">%+d</div>
                <div style="font-size: 16px; color: #6b7280; margin-top: 10px;">%s</div>
            </div>
            
            <div class="balance-box">
                <div class="balance-row">
                    <span style="font-weight: 600; color: #1f2937;">Transaction:</span>
                    <span style="color: #6b7280;">%s</span>
                </div>
                <div class="balance-row" style="border-top: 2px solid #d1d5db; margin-top: 10px; padding-top: 10px;">
                    <span style="font-weight: bold; color: #1f2937; font-size: 18px;">New Balance:</span>
                    <span style="font-weight: bold; color: %s; font-size: 18px;">%d Points</span>
                </div>
            </div>
            
            <p style="color: #333; font-size: 14px;">
                %s
            </p>
            
            <div style="text-align: center;">
                <a href="%s/user/profile" class="button">View Points History</a>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2025 %s. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
""".formatted(
    color, color, color, color, icon, actionText, userName,
    actionText, points, description, description, color, newBalance,
    isEarned ? "Keep earning points with every booking! Redeem them for discounts on your next reservation." 
             : "Thank you for using your points! Continue earning more with every booking.",
    appUrl, appName
);
    }

    // Keep existing compatibility methods
    public void sendBookingConfirmation(String email, String bookingDetails) {
        log.info("Legacy booking confirmation call for: {}", email);
    }

    public void sendBookingCancellation(String email, String bookingDetails) {
        log.info("Booking cancellation email placeholder for: {}", email);
    }

    public void sendVendorApproval(String email, String vendorName) {
        log.info("Vendor approval email placeholder for: {}", email);
    }

    public void sendVendorRejection(String email, String vendorName, String reason) {
        log.info("Vendor rejection email placeholder for: {}", email);
    }
    
    /**
     * Send event reschedule notification to booked users
     */
    @Async
    public void sendEventRescheduleNotification(
            String toEmail,
            String userName,
            String eventName,
            String oldDate,
            String oldTime,
            String oldLocation,
            String newDate,
            String newTime,
            String newLocation,
            String reason
    ) {
        try {
            String subject = "⚠️ Event Rescheduled - " + eventName;
            String htmlContent = buildEventRescheduleTemplate(
                userName, eventName, oldDate, oldTime, oldLocation,
                newDate, newTime, newLocation, reason
            );
            
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Event reschedule notification sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send reschedule notification to: {}", toEmail, e);
            System.out.println("[EMAIL] Reschedule notification - User: " + userName + 
                ", Event: " + eventName + ", New Date: " + newDate + ", Reason: " + reason);
        }
    }
    
    /**
     * Send event cancellation notification to booked users
     */
    @Async
    public void sendEventCancellationNotification(
            String toEmail,
            String userName,
            String eventName,
            String reason,
            int pointsRefunded
    ) {
        try {
            String subject = "❌ Event Cancelled - " + eventName;
            String htmlContent = buildEventCancellationTemplate(
                userName, eventName, reason, pointsRefunded
            );
            
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Event cancellation notification sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send cancellation notification to: {}", toEmail, e);
            System.out.println("[EMAIL] Cancellation notification - User: " + userName + 
                ", Event: " + eventName + ", Points Refunded: " + pointsRefunded);
        }
    }
    
    /**
     * Build event reschedule notification template
     */
    private String buildEventRescheduleTemplate(
            String userName, String eventName,
            String oldDate, String oldTime, String oldLocation,
            String newDate, String newTime, String newLocation,
            String reason
    ) {
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #f59e0b 0%%, #d97706 100%%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .warning-badge { background: #ffffff; color: #d97706; padding: 10px 20px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; }
        .content { padding: 40px 30px; }
        .event-name { font-size: 24px; font-weight: bold; color: #1f2937; margin: 20px 0; }
        .changes-box { background: #fef3c7; border-radius: 12px; padding: 25px; margin: 20px 0; border: 2px solid #f59e0b; }
        .change-section { margin: 15px 0; }
        .change-label { font-weight: bold; color: #92400e; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .old-value { color: #6b7280; text-decoration: line-through; }
        .new-value { color: #059669; font-weight: bold; font-size: 18px; }
        .reason-box { background: #f3f4f6; border-left: 4px solid #d97706; padding: 15px 20px; margin: 20px 0; }
        .reason-label { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
        .reason-text { color: #4b5563; }
        .action-box { background: #e0f2fe; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .action-text { color: #0369a1; font-weight: 600; margin-bottom: 10px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 10px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Event Rescheduled</h1>
            <div class="warning-badge">⚠️ Important Update</div>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; color: #333;">Hi %s,</p>
            
            <p style="font-size: 16px; color: #333;">
                We're writing to inform you that an event you've booked has been rescheduled.
            </p>
            
            <div class="event-name">%s</div>
            
            <div class="changes-box">
                <div class="change-section">
                    <div class="change-label">📅 Date Changed</div>
                    <div><span class="old-value">%s</span> → <span class="new-value">%s</span></div>
                </div>
                <div class="change-section">
                    <div class="change-label">🕐 Time Changed</div>
                    <div><span class="old-value">%s</span> → <span class="new-value">%s</span></div>
                </div>
                <div class="change-section">
                    <div class="change-label">📍 Location</div>
                    <div><span class="old-value">%s</span> → <span class="new-value">%s</span></div>
                </div>
            </div>
            
            <div class="reason-box">
                <div class="reason-label">Reason for Reschedule:</div>
                <div class="reason-text">%s</div>
            </div>
            
            <div class="action-box">
                <div class="action-text">🎫 Your ticket is still valid for the new date!</div>
                <p style="color: #0369a1; margin: 0;">If you cannot attend on the new date, you can cancel your booking and receive a <strong>95%% refund</strong>.</p>
                <a href="%s/user/bookings" class="button">Manage My Booking</a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Need help? Contact us at <a href="mailto:pranaib20@gmail.com">pranaib20@gmail.com</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 %s. All rights reserved.</p>
            <p>This is an automated notification email.</p>
        </div>
    </div>
</body>
</html>
""".formatted(userName, eventName, oldDate, newDate, oldTime, newTime, 
              oldLocation, newLocation, reason, appUrl, appName);
    }
    
    /**
     * Build event cancellation notification template
     */
    private String buildEventCancellationTemplate(
            String userName, String eventName, String reason, int pointsRefunded
    ) {
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #ef4444 0%%, #dc2626 100%%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .cancel-badge { background: #ffffff; color: #dc2626; padding: 10px 20px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; }
        .content { padding: 40px 30px; }
        .event-name { font-size: 24px; font-weight: bold; color: #1f2937; margin: 20px 0; }
        .reason-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 20px 0; }
        .refund-box { background: #dcfce7; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; border: 2px solid #22c55e; }
        .refund-label { color: #166534; font-weight: bold; margin-bottom: 10px; }
        .refund-amount { font-size: 36px; font-weight: bold; color: #22c55e; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Event Cancelled</h1>
            <div class="cancel-badge">Booking Cancelled</div>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; color: #333;">Hi %s,</p>
            
            <p style="font-size: 16px; color: #333;">
                We regret to inform you that the following event has been cancelled by the vendor:
            </p>
            
            <div class="event-name">%s</div>
            
            <div class="reason-box">
                <div style="font-weight: bold; color: #991b1b; margin-bottom: 5px;">Reason for Cancellation:</div>
                <div style="color: #7f1d1d;">%s</div>
            </div>
            
            <div class="refund-box">
                <div class="refund-label">🎁 Full Refund Processed</div>
                <div class="refund-amount">+%d Points</div>
                <p style="color: #166534; margin-top: 10px;">Your points have been fully refunded to your account.</p>
            </div>
            
            <p style="color: #333; font-size: 14px;">
                We apologize for any inconvenience this may have caused. Feel free to browse other amazing events on our platform!
            </p>
            
            <div style="text-align: center;">
                <a href="%s/events" class="button">Browse Events</a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Need help? Contact us at <a href="mailto:pranaib20@gmail.com">pranaib20@gmail.com</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 %s. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
""".formatted(userName, eventName, reason, pointsRefunded, appUrl, appName);
    }
    
    /**
     * Send vendor email verification success notification
     * Called when vendor verifies their email via OTP
     */
    @Async
    public void sendVendorVerificationSuccess(String toEmail, String businessName) {
        try {
            String subject = "🎉 Email Verified Successfully - " + appName;
            String htmlContent = buildVendorVerificationSuccessTemplate(businessName);
            
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Vendor verification success email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send vendor verification email to: {}", toEmail, e);
            System.out.println("[EMAIL] Vendor Verification Success - " + businessName + " (" + toEmail + ")");
        }
    }
    
    /**
     * Send vendor approval notification with login link
     * Called when admin approves vendor application
     */
    @Async
    public void sendVendorApprovalEmail(String toEmail, String businessName) {
        try {
            String subject = "✅ Congratulations! Your Vendor Application is Approved - " + appName;
            String htmlContent = buildVendorApprovalTemplate(businessName);
            
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Vendor approval email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send vendor approval email to: {}", toEmail, e);
            System.out.println("[EMAIL] Vendor Approved - " + businessName + " (" + toEmail + ")");
        }
    }
    
    /**
     * Send vendor rejection notification with reason
     * Called when admin rejects vendor application
     */
    @Async
    public void sendVendorRejectionEmail(String toEmail, String businessName, String reason) {
        try {
            String subject = "Vendor Application Update - " + appName;
            String htmlContent = buildVendorRejectionTemplate(businessName, reason);
            
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Vendor rejection email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send vendor rejection email to: {}", toEmail, e);
            System.out.println("[EMAIL] Vendor Rejected - " + businessName + " (" + toEmail + ") Reason: " + reason);
        }
    }
    
    /**
     * Build vendor verification success email template
     */
    private String buildVendorVerificationSuccessTemplate(String businessName) {
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .success-icon { font-size: 60px; margin-bottom: 10px; }
        .content { padding: 40px 30px; }
        .status-box { background: #dcfce7; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; border: 2px solid #22c55e; }
        .status-title { font-size: 20px; font-weight: bold; color: #166534; margin-bottom: 10px; }
        .status-desc { color: #15803d; }
        .next-steps { background: #f0f9ff; border-radius: 12px; padding: 25px; margin: 20px 0; }
        .next-steps h3 { color: #0369a1; margin-top: 0; }
        .step { display: flex; align-items: flex-start; margin: 15px 0; }
        .step-num { background: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
        .step-text { color: #1e40af; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Email Verified!</h1>
        </div>
        
        <div class="content">
            <p style="font-size: 18px; color: #333;">Hello <strong>%s</strong>,</p>
            
            <div class="status-box">
                <div class="status-title">🎉 Your email has been verified successfully!</div>
                <div class="status-desc">
                    Your vendor account is now under review by our admin team.
                </div>
            </div>
            
            <div class="next-steps">
                <h3>📋 What happens next?</h3>
                <div class="step">
                    <div class="step-num">1</div>
                    <div class="step-text"><strong>Admin Review:</strong> Our team will review your business details within 24-48 hours.</div>
                </div>
                <div class="step">
                    <div class="step-num">2</div>
                    <div class="step-text"><strong>Approval Notification:</strong> You'll receive an email once your account is approved.</div>
                </div>
                <div class="step">
                    <div class="step-num">3</div>
                    <div class="step-text"><strong>Start Earning:</strong> List your venues and events to start earning!</div>
                </div>
            </div>
            
            <p style="color: #333; font-size: 14px; margin-top: 20px;">
                While you wait, you can explore our platform and prepare your venue/event details.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Questions? Contact us at <a href="mailto:pranaib20@gmail.com">pranaib20@gmail.com</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 %s. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
""".formatted(businessName, appName);
    }
    
    /**
     * Build vendor approval email template with login link
     */
    private String buildVendorApprovalTemplate(String businessName) {
        String vendorLoginUrl = appUrl + "/login?role=vendor";
        String vendorDashboardUrl = appUrl + "/vendor/dashboard";
        
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%%, #6d28d9 100%%); padding: 50px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 32px; }
        .confetti { font-size: 50px; margin-bottom: 10px; }
        .congrats-badge { background: #fbbf24; color: #78350f; padding: 12px 24px; border-radius: 25px; display: inline-block; margin-top: 15px; font-weight: bold; font-size: 14px; }
        .content { padding: 40px 30px; }
        .welcome-text { font-size: 18px; color: #333; line-height: 1.6; }
        .points-box { background: linear-gradient(135deg, #fef3c7 0%%, #fde68a 100%%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; border: 2px solid #f59e0b; }
        .points-title { color: #92400e; font-size: 16px; margin-bottom: 5px; }
        .points-amount { font-size: 48px; font-weight: bold; color: #d97706; }
        .points-label { color: #b45309; font-size: 14px; }
        .features-grid { display: grid; gap: 15px; margin: 25px 0; }
        .feature { background: #f8fafc; border-radius: 10px; padding: 20px; border-left: 4px solid #8b5cf6; }
        .feature-icon { font-size: 24px; margin-bottom: 8px; }
        .feature-title { color: #1f2937; font-weight: bold; margin-bottom: 5px; }
        .feature-desc { color: #6b7280; font-size: 14px; }
        .login-section { background: #8b5cf6; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; }
        .login-title { color: #ffffff; font-size: 18px; margin-bottom: 20px; }
        .login-button { background: #ffffff; color: #8b5cf6; padding: 18px 40px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .login-url { color: #c4b5fd; font-size: 12px; margin-top: 15px; word-break: break-all; }
        .footer { background: #f8f9fa; padding: 25px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="confetti">🎊</div>
            <h1>Congratulations!</h1>
            <div class="congrats-badge">✓ VENDOR APPROVED</div>
        </div>
        
        <div class="content">
            <p class="welcome-text">
                Hello <strong>%s</strong>,
            </p>
            
            <p class="welcome-text">
                Great news! 🎉 Your vendor application has been <strong>approved</strong> by our team. 
                You can now start listing your venues and events on our platform!
            </p>
            
            <div class="points-box">
                <div class="points-title">🎁 Welcome Bonus</div>
                <div class="points-amount">200</div>
                <div class="points-label">Points Added to Your Account!</div>
            </div>
            
            <div class="features-grid">
                <div class="feature">
                    <div class="feature-icon">🏢</div>
                    <div class="feature-title">List Your Venues</div>
                    <div class="feature-desc">Add your venue with photos, amenities, and pricing</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">🎪</div>
                    <div class="feature-title">Create Events</div>
                    <div class="feature-desc">Host events with ticket booking or seat selection</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">💰</div>
                    <div class="feature-title">Earn Money</div>
                    <div class="feature-desc">Get paid directly through our secure payment system</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <div class="feature-title">Track Analytics</div>
                    <div class="feature-desc">View bookings, earnings, and performance insights</div>
                </div>
            </div>
            
            <div class="login-section">
                <div class="login-title">Ready to get started? Login to your Vendor Dashboard!</div>
                <a href="%s" class="login-button">🚀 Login as Vendor</a>
                <div class="login-url">%s</div>
            </div>
            
            <p style="color: #333; font-size: 14px;">
                <strong>Quick Start Guide:</strong><br>
                1. Login with your email and password<br>
                2. Complete your business profile<br>
                3. Add your first venue or event<br>
                4. Start accepting bookings!
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Need help getting started? Contact us at <a href="mailto:pranaib20@gmail.com">pranaib20@gmail.com</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 %s. All rights reserved.</p>
            <p style="margin-top: 10px;">
                <a href="%s" style="color: #8b5cf6; text-decoration: none;">Vendor Dashboard</a> | 
                <a href="%s/help" style="color: #8b5cf6; text-decoration: none;">Help Center</a>
            </p>
        </div>
    </div>
</body>
</html>
""".formatted(businessName, vendorLoginUrl, vendorLoginUrl, appName, vendorDashboardUrl, appUrl);
    }
    
    /**
     * Build vendor rejection email template
     */
    private String buildVendorRejectionTemplate(String businessName, String reason) {
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #64748b 0%%, #475569 100%%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .reason-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
        .reason-title { color: #991b1b; font-weight: bold; margin-bottom: 10px; }
        .reason-text { color: #7f1d1d; }
        .help-box { background: #f0f9ff; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .help-title { color: #0369a1; font-weight: bold; margin-bottom: 15px; }
        .help-text { color: #0c4a6e; font-size: 14px; line-height: 1.8; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Application Update</h1>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; color: #333;">Hello <strong>%s</strong>,</p>
            
            <p style="font-size: 16px; color: #333;">
                Thank you for your interest in becoming a vendor on our platform. After careful review, 
                we regret to inform you that your application was not approved at this time.
            </p>
            
            <div class="reason-box">
                <div class="reason-title">📋 Reason:</div>
                <div class="reason-text">%s</div>
            </div>
            
            <div class="help-box">
                <div class="help-title">💡 What can you do?</div>
                <div class="help-text">
                    • Review the reason above and address any issues<br>
                    • Update your business information if needed<br>
                    • Contact our support team for clarification<br>
                    • You may reapply with updated information
                </div>
            </div>
            
            <p style="color: #333; font-size: 14px;">
                We appreciate your understanding and encourage you to reach out if you have any questions 
                or would like to discuss your application further.
            </p>
            
            <div style="text-align: center;">
                <a href="mailto:pranaib20@gmail.com" class="button">Contact Support</a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Email: <a href="mailto:pranaib20@gmail.com">pranaib20@gmail.com</a>
            </p>
        </div>
        
        <div class="footer">
            <p>© 2025 %s. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
""".formatted(businessName, reason, appName);
    }
    
    /**
     * Send booking cancellation email with invoice-style refund breakdown
     */
    @Async
    public void sendBookingCancellationInvoice(
            String toEmail,
            String userName,
            Long bookingId,
            String itemName,
            String itemType,
            String bookingDate,
            double originalAmount,
            int pointsUsed,
            double cashPaid,
            int refundPercentage,
            int pointsRefunded,
            String cancellationReason,
            int conversionRate
    ) {
        try {
            String subject = "❌ Booking Cancelled - Invoice #" + bookingId;
            String htmlContent = buildCancellationInvoiceTemplate(
                userName, bookingId, itemName, itemType, bookingDate,
                originalAmount, pointsUsed, cashPaid, refundPercentage, 
                pointsRefunded, cancellationReason, conversionRate
            );
            
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Booking cancellation invoice sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send cancellation invoice to: {}", toEmail, e);
        }
    }
    
    /**
     * Build beautiful industrial invoice template for booking cancellation
     */
    private String buildCancellationInvoiceTemplate(
            String userName, Long bookingId, String itemName, String itemType,
            String bookingDate, double originalAmount, int pointsUsed, double cashPaid,
            int refundPercentage, int pointsRefunded, String cancellationReason, int conversionRate
    ) {
        double pointsValue = pointsUsed / (double) conversionRate;
        String itemIcon = itemType.equals("EVENT") ? "🎪" : "🏢";
        String refundMessage = refundPercentage == 100 ? 
            "Full refund - Cancelled 2+ days in advance" :
            (refundPercentage == 75 ? "75% refund - Cancelled within 2 days" : 
             (refundPercentage == 95 ? "95% refund - Event was rescheduled" : cancellationReason));
        
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; }
        .invoice { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%%, #b91c1c 100%%); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .cancelled-badge { background: #ffffff; color: #dc2626; padding: 8px 20px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; font-size: 13px; }
        .invoice-info { background: #fef2f2; padding: 20px 30px; border-bottom: 2px dashed #e5e7eb; }
        .invoice-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .invoice-label { color: #6b7280; font-size: 13px; }
        .invoice-value { color: #1f2937; font-weight: 600; font-size: 13px; }
        .content { padding: 30px; }
        .item-box { background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
        .item-icon { font-size: 32px; margin-bottom: 10px; }
        .item-name { font-size: 18px; font-weight: bold; color: #1f2937; }
        .item-type { color: #6b7280; font-size: 12px; text-transform: uppercase; }
        .breakdown { margin: 25px 0; }
        .breakdown-title { font-weight: bold; color: #1f2937; font-size: 14px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .breakdown-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
        .breakdown-row:last-child { border-bottom: none; }
        .breakdown-label { color: #6b7280; }
        .breakdown-value { color: #1f2937; font-weight: 600; }
        .refund-box { background: linear-gradient(135deg, #dcfce7 0%%, #bbf7d0 100%%); border-radius: 12px; padding: 20px; margin: 20px 0; border: 2px solid #22c55e; }
        .refund-title { color: #166534; font-weight: bold; font-size: 14px; margin-bottom: 10px; }
        .refund-amount { font-size: 36px; font-weight: bold; color: #22c55e; text-align: center; }
        .refund-note { color: #15803d; font-size: 12px; text-align: center; margin-top: 5px; }
        .reason-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .reason-title { color: #92400e; font-weight: bold; font-size: 13px; margin-bottom: 5px; }
        .reason-text { color: #78350f; font-size: 13px; }
        .policy-note { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px; }
        .policy-title { font-weight: bold; color: #374151; font-size: 12px; margin-bottom: 8px; }
        .policy-text { color: #6b7280; font-size: 11px; line-height: 1.6; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px 30px; font-size: 11px; text-align: center; }
        .footer a { color: #93c5fd; text-decoration: none; }
        .strikethrough { text-decoration: line-through; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <h1>❌ Booking Cancelled</h1>
            <div class="cancelled-badge">CANCELLED & REFUNDED</div>
        </div>
        
        <div class="invoice-info">
            <div class="invoice-row">
                <span class="invoice-label">Invoice Number</span>
                <span class="invoice-value">#INV-%d</span>
            </div>
            <div class="invoice-row">
                <span class="invoice-label">Cancelled On</span>
                <span class="invoice-value">%s</span>
            </div>
            <div class="invoice-row">
                <span class="invoice-label">Customer</span>
                <span class="invoice-value">%s</span>
            </div>
        </div>
        
        <div class="content">
            <div class="item-box">
                <div class="item-icon">%s</div>
                <div class="item-type">%s BOOKING</div>
                <div class="item-name">%s</div>
                <div style="color: #6b7280; font-size: 13px; margin-top: 5px;">📅 %s</div>
            </div>
            
            <div class="breakdown">
                <div class="breakdown-title">💰 Original Payment Breakdown</div>
                <div class="breakdown-row">
                    <span class="breakdown-label">Original Total</span>
                    <span class="breakdown-value strikethrough">₹%.2f</span>
                </div>
                <div class="breakdown-row">
                    <span class="breakdown-label">Points Used</span>
                    <span class="breakdown-value">%d pts (≈ ₹%.2f)</span>
                </div>
                <div class="breakdown-row">
                    <span class="breakdown-label">Cash Paid (PayPal)</span>
                    <span class="breakdown-value">₹%.2f</span>
                </div>
                <div class="breakdown-row">
                    <span class="breakdown-label">Platform Fee</span>
                    <span class="breakdown-value">2 pts</span>
                </div>
            </div>
            
            <div class="reason-box">
                <div class="reason-title">📋 Cancellation Policy Applied</div>
                <div class="reason-text">%s</div>
            </div>
            
            <div class="refund-box">
                <div class="refund-title">🎁 Your Refund (%d%%)</div>
                <div class="refund-amount">+%d Points</div>
                <div class="refund-note">Points added to your account • NO cash refund</div>
            </div>
            
            <div class="policy-note">
                <div class="policy-title">ℹ️ Refund Policy</div>
                <div class="policy-text">
                    • 2+ days before: 100%% refund as points<br>
                    • Within 2 days: 75%% refund as points<br>
                    • Event rescheduled by vendor: 95%% refund<br>
                    • Event cancelled by vendor: 100%% refund<br>
                    <strong>Note:</strong> All refunds are processed as points based on the total booking value. Cash payments are not refundable.
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2025 %s. All rights reserved.</p>
            <p>Questions? <a href="mailto:pranaib20@gmail.com">Contact Support</a></p>
        </div>
    </div>
</body>
</html>
""".formatted(
    bookingId, 
    java.time.LocalDate.now().toString(), 
    userName,
    itemIcon,
    itemType,
    itemName,
    bookingDate,
    originalAmount,
    pointsUsed,
    pointsValue,
    cashPaid,
    refundMessage,
    refundPercentage,
    pointsRefunded,
    appName
);
    }
    
    /**
     * Send booking confirmation email with invoice-style details
     */
    @Async
    public void sendBookingConfirmationInvoice(
            String toEmail,
            String userName,
            Long bookingId,
            String itemName,
            String itemType,
            String bookingDate,
            String bookingTime,
            String location,
            int quantity,
            double subtotal,
            int pointsUsed,
            double pointsValue,
            double cashPaid,
            int platformFee,
            double totalAmount,
            int pointsEarned,
            int conversionRate
    ) {
        try {
            String subject = "✅ Booking Confirmed - Invoice #" + bookingId;
            String htmlContent = buildConfirmationInvoiceTemplate(
                userName, bookingId, itemName, itemType, bookingDate, bookingTime,
                location, quantity, subtotal, pointsUsed, pointsValue, cashPaid,
                platformFee, totalAmount, pointsEarned, conversionRate
            );
            
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Booking confirmation invoice sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send confirmation invoice to: {}", toEmail, e);
        }
    }
    
    /**
     * Build beautiful industrial invoice template for booking confirmation
     */
    private String buildConfirmationInvoiceTemplate(
            String userName, Long bookingId, String itemName, String itemType,
            String bookingDate, String bookingTime, String location, int quantity,
            double subtotal, int pointsUsed, double pointsValue, double cashPaid,
            int platformFee, double totalAmount, int pointsEarned, int conversionRate
    ) {
        String itemIcon = itemType.equals("EVENT") ? "🎪" : "🏢";
        String quantityLabel = itemType.equals("EVENT") ? "Tickets" : "Hours";
        
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4; }
        .invoice { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .confirmed-badge { background: #ffffff; color: #10b981; padding: 8px 20px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; font-size: 13px; }
        .invoice-info { background: #ecfdf5; padding: 20px 30px; border-bottom: 2px dashed #e5e7eb; }
        .invoice-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .invoice-label { color: #6b7280; font-size: 13px; }
        .invoice-value { color: #1f2937; font-weight: 600; font-size: 13px; }
        .content { padding: 30px; }
        .item-box { background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
        .item-icon { font-size: 32px; margin-bottom: 10px; }
        .item-name { font-size: 18px; font-weight: bold; color: #1f2937; }
        .item-type { color: #6b7280; font-size: 12px; text-transform: uppercase; }
        .item-details { margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
        .detail-row { display: flex; align-items: center; margin: 8px 0; color: #4b5563; font-size: 13px; }
        .detail-row span { margin-left: 8px; }
        .breakdown { margin: 25px 0; }
        .breakdown-title { font-weight: bold; color: #1f2937; font-size: 14px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .breakdown-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
        .breakdown-row.total { border-top: 2px solid #1f2937; border-bottom: none; padding-top: 15px; margin-top: 10px; }
        .breakdown-label { color: #6b7280; }
        .breakdown-value { color: #1f2937; font-weight: 600; }
        .breakdown-value.discount { color: #22c55e; }
        .breakdown-value.total { font-size: 20px; color: #10b981; }
        .points-box { background: linear-gradient(135deg, #fef3c7 0%%, #fde68a 100%%); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; border: 2px solid #f59e0b; }
        .points-title { color: #92400e; font-size: 14px; margin-bottom: 5px; }
        .points-amount { font-size: 28px; font-weight: bold; color: #d97706; }
        .points-note { color: #b45309; font-size: 11px; margin-top: 5px; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px 30px; font-size: 11px; text-align: center; }
        .footer a { color: #93c5fd; text-decoration: none; }
        .button { background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 15px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <h1>✅ Booking Confirmed</h1>
            <div class="confirmed-badge">PAYMENT SUCCESSFUL</div>
        </div>
        
        <div class="invoice-info">
            <div class="invoice-row">
                <span class="invoice-label">Invoice Number</span>
                <span class="invoice-value">#INV-%d</span>
            </div>
            <div class="invoice-row">
                <span class="invoice-label">Booking Date</span>
                <span class="invoice-value">%s</span>
            </div>
            <div class="invoice-row">
                <span class="invoice-label">Customer</span>
                <span class="invoice-value">%s</span>
            </div>
        </div>
        
        <div class="content">
            <div class="item-box">
                <div class="item-icon">%s</div>
                <div class="item-type">%s</div>
                <div class="item-name">%s</div>
                <div class="item-details">
                    <div class="detail-row">📅 <span>%s</span></div>
                    <div class="detail-row">🕐 <span>%s</span></div>
                    <div class="detail-row">📍 <span>%s</span></div>
                    <div class="detail-row">🎫 <span>%d %s</span></div>
                </div>
            </div>
            
            <div class="breakdown">
                <div class="breakdown-title">💰 Payment Breakdown</div>
                <div class="breakdown-row">
                    <span class="breakdown-label">Subtotal</span>
                    <span class="breakdown-value">₹%.2f</span>
                </div>
                <div class="breakdown-row">
                    <span class="breakdown-label">Points Discount (%d pts)</span>
                    <span class="breakdown-value discount">-₹%.2f</span>
                </div>
                <div class="breakdown-row">
                    <span class="breakdown-label">Platform Fee</span>
                    <span class="breakdown-value">%d pts</span>
                </div>
                <div class="breakdown-row">
                    <span class="breakdown-label">Cash Paid (PayPal)</span>
                    <span class="breakdown-value">₹%.2f</span>
                </div>
                <div class="breakdown-row total">
                    <span class="breakdown-label" style="font-weight: bold; color: #1f2937;">Total Paid</span>
                    <span class="breakdown-value total">₹%.2f + %d pts</span>
                </div>
            </div>
            
            <div class="points-box">
                <div class="points-title">🎁 Points Earned</div>
                <div class="points-amount">+%d Points</div>
                <div class="points-note">Added to your account • Use on your next booking!</div>
            </div>
            
            <div style="text-align: center;">
                <a href="%s/user/bookings" class="button">View My Bookings</a>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2025 %s. All rights reserved.</p>
            <p>Questions? <a href="mailto:pranaib20@gmail.com">Contact Support</a></p>
        </div>
    </div>
</body>
</html>
""".formatted(
    bookingId,
    java.time.LocalDate.now().toString(),
    userName,
    itemIcon,
    itemType,
    itemName,
    bookingDate,
    bookingTime != null ? bookingTime : "TBA",
    location != null ? location : "See booking details",
    quantity,
    quantityLabel,
    subtotal,
    pointsUsed,
    pointsValue,
    platformFee,
    cashPaid,
    totalAmount,
    pointsUsed + platformFee,
    pointsEarned,
    appUrl,
    appName
);
    }
}
