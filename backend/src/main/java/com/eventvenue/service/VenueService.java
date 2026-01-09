package com.eventvenue.service;

import com.eventvenue.entity.Booking;
import com.eventvenue.entity.Venue;
import com.eventvenue.entity.Vendor;
import com.eventvenue.repository.BookingRepository;
import com.eventvenue.repository.VenueRepository;
import com.eventvenue.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class VenueService {

    private static final Long VENUE_CREATION_PLATFORM_FEE = 10L;

    @Autowired
    private VenueRepository venueRepository;
    
    @Autowired
    private VendorRepository vendorRepository;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private AuditLogService auditLogService;

    /**
     * Create venue and deduct platform fee (10 points) from vendor
     */
    @Transactional
    public Venue createVenue(Venue venue) {
        // Deduct platform fee from vendor
        Optional<Vendor> vendorOpt = vendorRepository.findById(venue.getVendorId());
        if (vendorOpt.isPresent()) {
            Vendor vendor = vendorOpt.get();
            Long currentPoints = vendor.getPoints() != null ? vendor.getPoints() : 0L;
            
            if (currentPoints < VENUE_CREATION_PLATFORM_FEE) {
                throw new RuntimeException("Insufficient points. You need " + VENUE_CREATION_PLATFORM_FEE + 
                    " points to create a venue but have " + currentPoints);
            }
            
            vendor.setPoints(currentPoints - VENUE_CREATION_PLATFORM_FEE);
            vendorRepository.save(vendor);
            
            System.out.println("[PLATFORM FEE] Deducted " + VENUE_CREATION_PLATFORM_FEE + 
                " points from vendor " + vendor.getId() + " for venue creation");
        }
        
        Venue saved = venueRepository.save(venue);
        
        // Audit log venue creation
        auditLogService.log("VENUE_CREATED", "VENUE", saved.getId(), 
            "Venue created: " + saved.getName() + " by vendor " + saved.getVendorId());
        
        return saved;
    }

    public Optional<Venue> getVenueById(Long id) {
        return venueRepository.findById(id);
    }

    public List<Venue> getVenuesByVendor(Long vendorId) {
        return venueRepository.findByVendorId(vendorId);
    }

    public List<Venue> getVenuesByCity(String city) {
        return venueRepository.findByCity(city);
    }

    public List<Venue> getAvailableVenues() {
        return venueRepository.findByIsAvailable(true);
    }

    public List<Venue> searchVenues(String query) {
        return venueRepository.search(query);
    }

    public List<Venue> filterVenues(String city, String category, BigDecimal minPrice, BigDecimal maxPrice, Integer capacity, Double rating) {
        return venueRepository.filter(city, category, minPrice, maxPrice, capacity, rating);
    }

    public List<Venue> getFeaturedVenues() {
        return venueRepository.findFeatured();
    }

    public Venue updateVenue(Long id, Venue venueDetails) {
        Optional<Venue> venueOptional = venueRepository.findById(id);
        if (venueOptional.isPresent()) {
            Venue venue = venueOptional.get();
            
            // Check if address/city is being changed - these have 2-edit limit
            boolean addressCityChanged = false;
            if (venueDetails.getAddress() != null && !venueDetails.getAddress().equals(venue.getAddress())) {
                addressCityChanged = true;
            }
            if (venueDetails.getCity() != null && !venueDetails.getCity().equals(venue.getCity())) {
                addressCityChanged = true;
            }
            
            // Enforce 2-edit limit for address/city changes
            if (addressCityChanged) {
                if (venue.getIsEditLocked() != null && venue.getIsEditLocked()) {
                    throw new RuntimeException("Location/Address editing is locked. Maximum 2 edits allowed.");
                }
                
                Integer currentEditCount = venue.getEditCount() != null ? venue.getEditCount() : 0;
                if (currentEditCount >= 2) {
                    venue.setIsEditLocked(true);
                    venueRepository.save(venue);
                    throw new RuntimeException("Location/Address editing is locked. Maximum 2 edits allowed.");
                }
                
                // Increment edit count
                venue.setEditCount(currentEditCount + 1);
                
                // Lock after 2nd edit
                if (currentEditCount + 1 >= 2) {
                    venue.setIsEditLocked(true);
                }
                
                System.out.println("[VENUE EDIT] Venue " + id + " address/city edit count: " + (currentEditCount + 1) + "/2");
            }
            
            // Apply updates
            if (venueDetails.getName() != null) {
                venue.setName(venueDetails.getName());
            }
            if (venueDetails.getDescription() != null) {
                venue.setDescription(venueDetails.getDescription());
            }
            if (venueDetails.getCity() != null) {
                venue.setCity(venueDetails.getCity());
            }
            if (venueDetails.getAddress() != null) {
                venue.setAddress(venueDetails.getAddress());
            }
            if (venueDetails.getCapacity() != null) {
                venue.setCapacity(venueDetails.getCapacity());
            }
            if (venueDetails.getPricePerHour() != null) {
                venue.setPricePerHour(venueDetails.getPricePerHour());
            }
            if (venueDetails.getIsAvailable() != null) {
                venue.setIsAvailable(venueDetails.getIsAvailable());
            }
            if (venueDetails.getVendorPhone() != null) {
                venue.setVendorPhone(venueDetails.getVendorPhone());
            }
            Venue saved = venueRepository.save(venue);
            
            // Audit log venue update
            auditLogService.log("VENUE_UPDATED", "VENUE", saved.getId(), 
                "Venue updated: " + saved.getName());
            
            return saved;
        }
        throw new RuntimeException("Venue not found");
    }

    public void deleteVenue(Long id) {
        Optional<Venue> venueOpt = venueRepository.findById(id);
        String venueName = venueOpt.map(Venue::getName).orElse("Unknown");
        
        venueRepository.deleteById(id);
        
        // Audit log venue deletion
        auditLogService.log("VENUE_DELETED", "VENUE", id, 
            "Venue deleted: " + venueName);
    }

    public List<Venue> getAllVenues() {
        return venueRepository.findAll();
    }
    
    /**
     * Check if a venue is available for booking on a specific date.
     * - First checks if the venue's general isAvailable flag is true
     * - Then checks for existing non-cancelled bookings on that date
     * - Single-use venue booking: one venue can only be booked once per date
     */
    public boolean checkAvailability(Long venueId, LocalDate date) {
        Optional<Venue> venueOpt = venueRepository.findById(venueId);
        if (venueOpt.isEmpty()) {
            return false;
        }
        
        Venue venue = venueOpt.get();
        // First check if venue is generally available (not unpublished by vendor)
        if (venue.getIsAvailable() == null || !venue.getIsAvailable()) {
            return false;
        }
        
        // Check for existing non-cancelled bookings on this date
        // Single-use venue booking: one venue can only be booked once per date
        List<Booking> existingBookings = bookingRepository.findByVenueIdAndBookingDateAndStatusNot(
            venueId, date, "CANCELLED"
        );
        
        // If there are any existing bookings on this date, venue is not available
        return existingBookings.isEmpty();
    }
    
    /**
     * Check if a venue has any time slot conflicts for a specific date and time range.
     * Returns true if NO conflicts exist (slot is available).
     */
    public boolean checkTimeSlotAvailability(Long venueId, LocalDate date, LocalTime checkInTime, LocalTime checkOutTime) {
        Optional<Venue> venueOpt = venueRepository.findById(venueId);
        if (venueOpt.isEmpty()) {
            return false;
        }
        
        Venue venue = venueOpt.get();
        // First check if venue is generally available
        if (venue.getIsAvailable() == null || !venue.getIsAvailable()) {
            return false;
        }
        
        // Check for conflicting bookings (overlapping time slots)
        List<Booking> conflicts = bookingRepository.findConflictingBookings(venueId, date, checkInTime, checkOutTime);
        return conflicts.isEmpty();
    }
    
    /**
     * Get venue with vendor business info (for user display)
     * Returns VenueDTO with vendor businessName, businessPhone, and email
     */
    public com.eventvenue.dto.VenueDTO getVenueWithVendorInfo(Venue venue) {
        Vendor vendor = null;
        if (venue.getVendorId() != null) {
            Optional<Vendor> vendorOpt = vendorRepository.findById(venue.getVendorId());
            vendor = vendorOpt.orElse(null);
        }
        return com.eventvenue.dto.VenueDTO.fromVenue(venue, vendor);
    }
}
