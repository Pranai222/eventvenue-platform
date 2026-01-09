package com.eventvenue.dto;

import com.eventvenue.entity.Venue;
import com.eventvenue.entity.Vendor;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for Venue with vendor contact information
 * Used to display venue details to users with vendor business info
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VenueDTO {
    // Venue fields
    private Long id;
    private Long vendorId;
    private String name;
    private String description;
    private String category;
    private String city;
    private String address;
    private Integer capacity;
    private BigDecimal pricePerHour;
    private String amenities;
    private String images;
    private Boolean isAvailable;
    private Double rating;
    private Integer totalBookings;
    private String vendorPhone;
    private Integer editCount;
    private Boolean isEditLocked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Vendor business info (dynamic from vendor settings)
    private String vendorBusinessName;
    private String vendorBusinessPhone;
    private String vendorEmail;
    
    /**
     * Create DTO from Venue entity with vendor info
     */
    public static VenueDTO fromVenue(Venue venue, Vendor vendor) {
        VenueDTOBuilder builder = VenueDTO.builder()
            .id(venue.getId())
            .vendorId(venue.getVendorId())
            .name(venue.getName())
            .description(venue.getDescription())
            .category(venue.getCategory())
            .city(venue.getCity())
            .address(venue.getAddress())
            .capacity(venue.getCapacity())
            .pricePerHour(venue.getPricePerHour())
            .amenities(venue.getAmenities())
            .images(venue.getImages())
            .isAvailable(venue.getIsAvailable())
            .rating(venue.getRating())
            .totalBookings(venue.getTotalBookings())
            .vendorPhone(venue.getVendorPhone())
            .editCount(venue.getEditCount())
            .isEditLocked(venue.getIsEditLocked())
            .createdAt(venue.getCreatedAt())
            .updatedAt(venue.getUpdatedAt());
        
        // Add vendor business info if available
        if (vendor != null) {
            builder.vendorBusinessName(vendor.getBusinessName())
                   .vendorBusinessPhone(vendor.getBusinessPhone())
                   .vendorEmail(vendor.getEmail());
        }
        
        return builder.build();
    }
    
    /**
     * Create DTO from Venue entity without vendor info
     */
    public static VenueDTO fromVenue(Venue venue) {
        return fromVenue(venue, null);
    }
}
