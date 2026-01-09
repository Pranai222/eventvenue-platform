package com.eventvenue.controller;

import com.eventvenue.dto.ApiResponse;
import com.eventvenue.entity.Vendor;
import com.eventvenue.entity.User;
import com.eventvenue.entity.Booking;
import com.eventvenue.service.VendorService;
import com.eventvenue.service.AdminService;
import com.eventvenue.service.BookingService;
import com.eventvenue.repository.UserRepository;
import com.eventvenue.repository.VendorRepository;
import com.eventvenue.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8000"})
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse> getStats() {
        try {
            long totalUsers = userRepository.count();
            long totalVendors = vendorRepository.count();
            long totalBookings = bookingRepository.count();
            long pendingVendors = vendorRepository.countByStatus("PENDING");
            long activeBookings = bookingRepository.countByStatus("CONFIRMED");
            
            List<Booking> allBookings = bookingRepository.findAll();
            double totalRevenue = allBookings.stream()
                    .mapToDouble(booking -> booking.getTotalAmount() != null ? booking.getTotalAmount().doubleValue() : 0.0)
                    .sum();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", totalUsers);
            stats.put("totalVendors", totalVendors);
            stats.put("totalBookings", totalBookings);
            stats.put("pendingVendors", pendingVendors);
            stats.put("activeBookings", activeBookings);
            stats.put("totalRevenue", totalRevenue);

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Stats retrieved successfully")
                    .data(stats)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to retrieve stats: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse> getAllUsers() {
        try {
            List<User> users = adminService.getAllUsers();
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Users retrieved successfully")
                    .data(users)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to retrieve users: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse> getUserById(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("User not found")
                        .build());
            }
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("User retrieved successfully")
                    .data(userOpt.get())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to retrieve user: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/users/{id}/bookings")
    public ResponseEntity<ApiResponse> getUserBookings(@PathVariable Long id) {
        try {
            List<Booking> bookings = bookingRepository.findByUserId(id);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("User bookings retrieved successfully")
                    .data(bookings)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to retrieve user bookings: " + e.getMessage())
                    .build());
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse> updateUser(@PathVariable Long id, @RequestBody User userUpdate) {
        try {
            Optional<User> userOptional = userRepository.findById(id);
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("User not found")
                        .build());
            }

            User user = userOptional.get();
            if (userUpdate.getFirstName() != null) user.setFirstName(userUpdate.getFirstName());
            if (userUpdate.getLastName() != null) user.setLastName(userUpdate.getLastName());
            if (userUpdate.getPhone() != null) user.setPhone(userUpdate.getPhone());
            if (userUpdate.getIsVerified() != null) user.setIsVerified(userUpdate.getIsVerified());
            
            User savedUser = userRepository.save(user);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("User updated successfully")
                    .data(savedUser)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to update user: " + e.getMessage())
                    .build());
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long id) {
        try {
            adminService.deleteUser(id);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("User deleted successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to delete user: " + e.getMessage())
                    .build());
        }
    }

    @PutMapping("/users/{userId}/points")
    public ResponseEntity<ApiResponse> adjustUserPoints(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {
        try {
            Long pointsChange = ((Number) request.get("pointsChange")).longValue();
            String reason = (String) request.get("reason");
            
            User user = adminService.adjustUserPoints(userId, pointsChange, reason);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("User points adjusted successfully")
                    .data(user)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to adjust user points: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/vendors")
    public ResponseEntity<ApiResponse> getAllVendors() {
        try {
            List<Vendor> vendors = vendorService.getAllVendors();
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Vendors retrieved successfully")
                    .data(vendors)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to retrieve vendors: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/vendors/pending")
    public ResponseEntity<ApiResponse> getPendingVendors() {
        try {
            List<Vendor> pendingVendors = vendorService.getPendingVendors();
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Pending vendors retrieved successfully")
                    .data(pendingVendors)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to retrieve pending vendors: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/vendors/by-email")
    public ResponseEntity<ApiResponse> getVendorByEmail(@RequestParam String email) {
        try {
            Optional<Vendor> vendor = vendorRepository.findByEmail(email);
            if (vendor.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("Vendor not found with email: " + email)
                        .build());
            }
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Vendor retrieved successfully")
                    .data(vendor.get())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to retrieve vendor: " + e.getMessage())
                    .build());
        }
    }

    @PutMapping("/vendors/{vendorId}/approve")
    public ResponseEntity<ApiResponse> approveVendor(@PathVariable Long vendorId) {
        try {
            Vendor vendor = vendorService.approveVendor(vendorId);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Vendor approved successfully")
                    .data(vendor)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to approve vendor: " + e.getMessage())
                    .build());
        }
    }

    @PutMapping("/vendors/{vendorId}/reject")
    public ResponseEntity<ApiResponse> rejectVendor(
            @PathVariable Long vendorId,
            @RequestParam String reason) {
        try {
            Vendor vendor = vendorService.rejectVendor(vendorId, reason);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Vendor rejected successfully")
                    .data(vendor)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to reject vendor: " + e.getMessage())
                    .build());
        }
    }

    @DeleteMapping("/vendors/{id}")
    public ResponseEntity<ApiResponse> deleteVendor(@PathVariable Long id) {
        try {
            vendorService.deleteVendor(id);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Vendor deleted successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to delete vendor: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse> getAllBookings() {
        try {
            List<Booking> bookings = bookingRepository.findAll();
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Bookings retrieved successfully")
                    .data(bookings)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to retrieve bookings: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<ApiResponse> getBookingById(@PathVariable Long id) {
        try {
            Optional<Booking> booking = bookingRepository.findById(id);
            if (booking.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("Booking not found")
                        .build());
            }
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Booking retrieved successfully")
                    .data(booking.get())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to retrieve booking: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/settings/conversion-rate")
    public ResponseEntity<ApiResponse> getConversionRate() {
        try {
            AdminService.ConversionRateResponse rate = adminService.getConversionRate();
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Conversion rate retrieved successfully")
                    .data(rate)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to retrieve conversion rate: " + e.getMessage())
                    .build());
        }
    }

    @PutMapping("/settings/conversion-rate")
    public ResponseEntity<ApiResponse> updateConversionRate(@RequestBody Map<String, Integer> request) {
        try {
            int pointsPerDollar = request.get("pointsPerDollar");
            AdminService.ConversionRateResponse rate = adminService.updateConversionRate(pointsPerDollar);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Conversion rate updated successfully")
                    .data(rate)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to update conversion rate: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/settings/platform-fees")
    public ResponseEntity<ApiResponse> getPlatformFees() {
        try {
            AdminService.PlatformFeesResponse fees = adminService.getPlatformFees();
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Platform fees retrieved successfully")
                    .data(fees)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to retrieve platform fees: " + e.getMessage())
                    .build());
        }
    }

    @PutMapping("/settings/platform-fees")
    public ResponseEntity<ApiResponse> updatePlatformFees(@RequestBody Map<String, Integer> request) {
        try {
            int userFee = request.getOrDefault("userPlatformFeePoints", 2);
            int venueCreation = request.getOrDefault("venueCreationPoints", 10);
            int eventQuantity = request.getOrDefault("eventCreationPointsQuantity", 10);
            int eventSeat = request.getOrDefault("eventCreationPointsSeat", 20);
            
            AdminService.PlatformFeesResponse fees = adminService.updatePlatformFees(
                userFee, venueCreation, eventQuantity, eventSeat);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Platform fees updated successfully")
                    .data(fees)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to update platform fees: " + e.getMessage())
                    .build());
        }
    }

    @Autowired
    private com.eventvenue.repository.ReviewRepository reviewRepository;

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse> deleteReview(@PathVariable Long reviewId) {
        try {
            if (!reviewRepository.existsById(reviewId)) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("Review not found with ID: " + reviewId)
                        .build());
            }
            reviewRepository.deleteById(reviewId);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Review deleted successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("Failed to delete review: " + e.getMessage())
                    .build());
        }
    }
}
