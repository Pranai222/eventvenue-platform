package com.eventvenue.controller;

import com.eventvenue.dto.ApiResponse;
import com.eventvenue.entity.Venue;
import com.eventvenue.service.VenueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/venues")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8000"})
public class VenueController {

    @Autowired
    private VenueService venueService;

    
    // SPECIFIC PATHS FIRST
    @GetMapping("/vendor/my-venues")
    public ResponseEntity<ApiResponse> getMyVenues(Authentication authentication) {
        try {
            Long vendorId = Long.parseLong(authentication.getPrincipal().toString());
            List<Venue> venues = venueService.getVenuesByVendor(vendorId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Your venues retrieved successfully")
                    .data(venues)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error getting vendor venues: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse> getFeaturedVenues() {
        try {
            List<Venue> venues = venueService.getFeaturedVenues();
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Featured venues retrieved successfully")
                    .data(venues)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse> searchVenues(@RequestParam String q) {
        try {
            List<Venue> venues = venueService.searchVenues(q);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Venues search results")
                    .data(venues)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error searching venues: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/{id}/check-availability")
    public ResponseEntity<ApiResponse> checkAvailability(
            @PathVariable Long id,
            @RequestParam String date) {
        try {
            java.time.LocalDate bookingDate = java.time.LocalDate.parse(date);
            boolean isAvailable = venueService.checkAvailability(id, bookingDate);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message(isAvailable ? "Venue is available" : "Venue is not available for this date")
                    .data(java.util.Map.of("available", isAvailable))
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error checking availability: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/filter")
    public ResponseEntity<ApiResponse> filterVenues(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) Double rating) {
        try {
            List<Venue> venues = venueService.filterVenues(city, category, minPrice, maxPrice, capacity, rating);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Venues filter results")
                    .data(venues)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error filtering venues: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<ApiResponse> getVenuesByCity(@PathVariable String city) {
        try {
            List<Venue> venues = venueService.getVenuesByCity(city);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Venues retrieved successfully")
                    .data(venues)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    // GENERIC PATHS LAST
    @PostMapping
    public ResponseEntity<ApiResponse> createVenue(@RequestBody Venue venue, Authentication authentication) {
        try {
            Long vendorId = Long.parseLong(authentication.getPrincipal().toString());
            venue.setVendorId(vendorId);
            Venue createdVenue = venueService.createVenue(venue);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Venue created successfully")
                    .data(createdVenue)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error creating venue: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getVenue(@PathVariable Long id) {
        try {
            Optional<Venue> venueOptional = venueService.getVenueById(id);
            
            if (venueOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("Venue not found")
                        .build());
            }

            // Get venue with vendor info for user display
            Venue venue = venueOptional.get();
            com.eventvenue.dto.VenueDTO venueDTO = venueService.getVenueWithVendorInfo(venue);

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Venue retrieved successfully")
                    .data(venueDTO)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllVenues() {
        try {
            List<Venue> venues = venueService.getAllVenues();
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Venues retrieved successfully")
                    .data(venues)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateVenue(@PathVariable Long id, @RequestBody Venue venueDetails) {
        try {
            Venue updatedVenue = venueService.updateVenue(id, venueDetails);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Venue updated successfully")
                    .data(updatedVenue)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error updating venue: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteVenue(@PathVariable Long id) {
        try {
            venueService.deleteVenue(id);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Venue deleted successfully")
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error deleting venue: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<ApiResponse> publishVenue(@PathVariable Long id) {
        try {
            Venue venue = venueService.getVenueById(id)
                    .orElseThrow(() -> new RuntimeException("Venue not found"));
            
            venue.setIsAvailable(true);
            Venue updatedVenue = venueService.updateVenue(id, venue);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Venue published successfully")
                    .data(updatedVenue)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse> unpublishVenue(@PathVariable Long id) {
        try {
            Venue venue = venueService.getVenueById(id)
                    .orElseThrow(() -> new RuntimeException("Venue not found"));
            
            venue.setIsAvailable(false);
            Venue updatedVenue = venueService.updateVenue(id, venue);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Venue unpublished successfully")
                    .data(updatedVenue)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}
