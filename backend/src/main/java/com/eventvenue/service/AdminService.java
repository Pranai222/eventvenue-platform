package com.eventvenue.service;

import com.eventvenue.entity.User;
import com.eventvenue.entity.PointHistory;
import com.eventvenue.entity.SystemSettings;
import com.eventvenue.repository.UserRepository;
import com.eventvenue.repository.PointHistoryRepository;
import com.eventvenue.repository.SystemSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PointHistoryRepository pointHistoryRepository;
    
    @Autowired
    private SystemSettingsRepository systemSettingsRepository;
    
    @Autowired
    private AuditLogService auditLogService;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(userId);
    }

    @Transactional
    public User adjustUserPoints(Long userId, Long pointsChange, String reason) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (!userOptional.isPresent()) {
            throw new RuntimeException("User not found");
        }

        User user = userOptional.get();
        Long previousPoints = user.getPoints();
        Long newPoints = previousPoints + pointsChange;

        if (newPoints < 0) {
            throw new RuntimeException("Cannot reduce points below zero");
        }

        user.setPoints(newPoints);
        userRepository.save(user);

        PointHistory history = PointHistory.builder()
                .userId(userId)
                .pointsChanged(pointsChange) // Using correct DB field name
                .reason(reason)
                .previousPoints(previousPoints)
                .newPoints(newPoints)
                .build();
        pointHistoryRepository.save(history);

        return user;
    }

    public ConversionRateResponse getConversionRate() {
        Optional<SystemSettings> setting = systemSettingsRepository
                .findBySettingKey(SystemSettings.CONVERSION_RATE_KEY);
        
        int rate = 1; // Default: 1 point = $1
        if (setting.isPresent()) {
            try {
                rate = Integer.parseInt(setting.get().getSettingValue());
            } catch (NumberFormatException e) {
                rate = 1;
            }
        }
        
        return new ConversionRateResponse(rate);
    }

    @Transactional
    public ConversionRateResponse updateConversionRate(int pointsPerDollar) {
        if (pointsPerDollar < 1) {
            throw new RuntimeException("Conversion rate must be at least 1");
        }
        
        Optional<SystemSettings> settingOptional = systemSettingsRepository
                .findBySettingKey(SystemSettings.CONVERSION_RATE_KEY);
        
        SystemSettings setting;
        if (settingOptional.isPresent()) {
            setting = settingOptional.get();
            setting.setSettingValue(String.valueOf(pointsPerDollar));
        } else {
            setting = new SystemSettings(
                SystemSettings.CONVERSION_RATE_KEY,
                String.valueOf(pointsPerDollar)
            );
        }
        
        systemSettingsRepository.save(setting);
        
        // Audit log settings update
        auditLogService.log("SETTINGS_UPDATED", "SETTINGS", null, 
            "Conversion rate updated to: " + pointsPerDollar + " points per dollar", "ADMIN", "ADMIN", null);
        
        return new ConversionRateResponse(pointsPerDollar);
    }

    public static class ConversionRateResponse {
        private int pointsPerDollar;

        public ConversionRateResponse(int pointsPerDollar) {
            this.pointsPerDollar = pointsPerDollar;
        }

        public int getPointsPerDollar() {
            return pointsPerDollar;
        }

        public void setPointsPerDollar(int pointsPerDollar) {
            this.pointsPerDollar = pointsPerDollar;
        }
    }

    // Platform fees constants
    public static final String USER_PLATFORM_FEE_POINTS = "user_platform_fee_points";
    public static final String VENUE_CREATION_POINTS = "venue_creation_points";
    public static final String EVENT_CREATION_POINTS_QUANTITY = "event_creation_points_quantity";
    public static final String EVENT_CREATION_POINTS_SEAT = "event_creation_points_seat";

    /**
     * Get all platform fee settings
     */
    public PlatformFeesResponse getPlatformFees() {
        int userFee = getSettingAsInt(USER_PLATFORM_FEE_POINTS, 2);
        int venueCreation = getSettingAsInt(VENUE_CREATION_POINTS, 10);
        int eventQuantity = getSettingAsInt(EVENT_CREATION_POINTS_QUANTITY, 10);
        int eventSeat = getSettingAsInt(EVENT_CREATION_POINTS_SEAT, 20);
        
        return new PlatformFeesResponse(userFee, venueCreation, eventQuantity, eventSeat);
    }

    /**
     * Update platform fee settings
     */
    @Transactional
    public PlatformFeesResponse updatePlatformFees(int userFee, int venueCreation, int eventQuantity, int eventSeat) {
        updateSetting(USER_PLATFORM_FEE_POINTS, String.valueOf(userFee));
        updateSetting(VENUE_CREATION_POINTS, String.valueOf(venueCreation));
        updateSetting(EVENT_CREATION_POINTS_QUANTITY, String.valueOf(eventQuantity));
        updateSetting(EVENT_CREATION_POINTS_SEAT, String.valueOf(eventSeat));
        
        auditLogService.log("SETTINGS_UPDATED", "SETTINGS", null, 
            "Platform fees updated: user=" + userFee + ", venue=" + venueCreation + 
            ", eventQty=" + eventQuantity + ", eventSeat=" + eventSeat, "ADMIN", "ADMIN", null);
        
        return new PlatformFeesResponse(userFee, venueCreation, eventQuantity, eventSeat);
    }

    private int getSettingAsInt(String key, int defaultValue) {
        Optional<SystemSettings> setting = systemSettingsRepository.findBySettingKey(key);
        if (setting.isPresent()) {
            try {
                return Integer.parseInt(setting.get().getSettingValue());
            } catch (NumberFormatException e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    private void updateSetting(String key, String value) {
        Optional<SystemSettings> settingOpt = systemSettingsRepository.findBySettingKey(key);
        SystemSettings setting;
        if (settingOpt.isPresent()) {
            setting = settingOpt.get();
            setting.setSettingValue(value);
        } else {
            setting = new SystemSettings(key, value);
        }
        systemSettingsRepository.save(setting);
    }

    public static class PlatformFeesResponse {
        private int userPlatformFeePoints;
        private int venueCreationPoints;
        private int eventCreationPointsQuantity;
        private int eventCreationPointsSeat;

        public PlatformFeesResponse(int userFee, int venue, int eventQty, int eventSeat) {
            this.userPlatformFeePoints = userFee;
            this.venueCreationPoints = venue;
            this.eventCreationPointsQuantity = eventQty;
            this.eventCreationPointsSeat = eventSeat;
        }

        public int getUserPlatformFeePoints() { return userPlatformFeePoints; }
        public void setUserPlatformFeePoints(int v) { this.userPlatformFeePoints = v; }
        public int getVenueCreationPoints() { return venueCreationPoints; }
        public void setVenueCreationPoints(int v) { this.venueCreationPoints = v; }
        public int getEventCreationPointsQuantity() { return eventCreationPointsQuantity; }
        public void setEventCreationPointsQuantity(int v) { this.eventCreationPointsQuantity = v; }
        public int getEventCreationPointsSeat() { return eventCreationPointsSeat; }
        public void setEventCreationPointsSeat(int v) { this.eventCreationPointsSeat = v; }
    }
}
