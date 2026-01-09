package com.eventvenue.controller;

import com.eventvenue.dto.ApiResponse;
import com.eventvenue.entity.Booking;
import com.eventvenue.service.BookingService;
import com.eventvenue.service.BookingService.BookingCalculationResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8000"})
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @GetMapping("/calculate-cost")
    public ResponseEntity<ApiResponse> calculateCost(
            @RequestParam(required = false) Long venueId,
            @RequestParam(required = false) Long eventId,
            @RequestParam(required = false) Integer durationHours,
            @RequestParam(required = false) Integer quantity,
            @RequestParam(defaultValue = "0") Integer pointsToUse) {
        try {
            BookingCalculationResult result = bookingService.calculateBookingCost(
                    venueId, eventId, durationHours, quantity, pointsToUse);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Cost calculated successfully")
                    .data(result)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse> createBooking(@RequestBody Booking booking, Authentication authentication) {
        try {
            // The JWT filter sets userId as the principal (via getName())
            Long userId = Long.parseLong(authentication.getName());
            booking.setUserId(userId);
            Booking createdBooking = bookingService.createBooking(booking);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Booking created successfully")
                    .data(createdBooking)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/with-points")
    public ResponseEntity<ApiResponse> createBookingWithPoints(
            @RequestBody Map<String, Object> bookingRequest,
            Authentication authentication) {
        try {
            Long userId = Long.parseLong(authentication.getName());
            
            Long venueId = bookingRequest.get("venueId") != null ? 
                Long.valueOf(bookingRequest.get("venueId").toString()) : null;
            Long eventId = bookingRequest.get("eventId") != null ? 
                Long.valueOf(bookingRequest.get("eventId").toString()) : null;
            String bookingDate = bookingRequest.get("bookingDate").toString();
            String checkInTime = bookingRequest.get("checkInTime") != null ? 
                bookingRequest.get("checkInTime").toString() : null;
            String checkOutTime = bookingRequest.get("checkOutTime") != null ? 
                bookingRequest.get("checkOutTime").toString() : null;
            Integer durationHours = bookingRequest.get("durationHours") != null ? 
                Integer.valueOf(bookingRequest.get("durationHours").toString()) : null;
            Integer quantity = bookingRequest.get("quantity") != null ? 
                Integer.valueOf(bookingRequest.get("quantity").toString()) : 1;
            
            // Hybrid payment support
            Integer pointsToUse = bookingRequest.get("pointsToUse") != null ? 
                Integer.valueOf(bookingRequest.get("pointsToUse").toString()) : null;
            String paypalTransactionId = bookingRequest.get("paypalTransactionId") != null ? 
                bookingRequest.get("paypalTransactionId").toString() : null;
            Double remainingAmount = bookingRequest.get("remainingAmount") != null ? 
                Double.valueOf(bookingRequest.get("remainingAmount").toString()) : 0.0;
            
            // IMPORTANT: Use totalAmount from frontend to maintain consistency with what user saw
            Double totalAmount = bookingRequest.get("totalAmount") != null ? 
                Double.valueOf(bookingRequest.get("totalAmount").toString()) : null;
            
            Booking createdBooking = bookingService.createBookingWithPoints(
                userId, venueId, eventId, bookingDate, checkInTime, checkOutTime, durationHours, quantity,
                pointsToUse, paypalTransactionId, remainingAmount, totalAmount
            );

            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Booking created successfully using points")
                    .data(createdBooking)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse> confirmBooking(@PathVariable Long id) {
        try {
            Booking confirmedBooking = bookingService.confirmBooking(id);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Booking confirmed successfully")
                    .data(confirmedBooking)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getBooking(@PathVariable Long id) {
        try {
            // Use enriched method that includes seat info for seat-based bookings
            var bookingDTO = bookingService.getBookingByIdWithSeatInfo(id);
            
            if (bookingDTO == null) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("Booking not found")
                        .build());
            }

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Booking retrieved successfully")
                    .data(bookingDTO)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<ApiResponse> getMyBookings(Authentication authentication) {
        try {
            Long userId = Long.parseLong(authentication.getName());
            // Use enriched method that includes seat info for seat-based bookings
            var bookings = bookingService.getBookingsByUserWithSeatInfo(userId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Your bookings retrieved successfully")
                    .data(bookings)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/user/my-bookings")
    public ResponseEntity<ApiResponse> getUserMyBookings(Authentication authentication) {
        return getMyBookings(authentication);
    }

    @GetMapping("/vendor/my-bookings")
    public ResponseEntity<ApiResponse> getVendorBookings(Authentication authentication) {
        try {
            Long vendorId = Long.parseLong(authentication.getName());
            List<Booking> bookings = bookingService.getBookingsByVendor(vendorId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Your bookings retrieved successfully")
                    .data(bookings)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllBookings() {
        try {
            List<Booking> bookings = bookingService.getAllBookings();
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Bookings retrieved successfully")
                    .data(bookings)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateBooking(@PathVariable Long id, @RequestBody Booking bookingDetails) {
        try {
            Booking updatedBooking = bookingService.updateBooking(id, bookingDetails);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Booking updated successfully")
                    .data(updatedBooking)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse> cancelBooking(@PathVariable Long id) {
        try {
            BookingService.CancellationResult result = bookingService.cancelBooking(id);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message(result.message)
                    .data(java.util.Map.of(
                        "refundAmount", result.refundAmount,
                        "refundPercentage", result.refundPercentage,
                        "pointsRefunded", result.pointsRefunded,
                        "message", result.message
                    ))
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    // Keep DELETE endpoint for backwards compatibility
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteBooking(@PathVariable Long id) {
        return cancelBooking(id);
    }
}
