package com.eventvenue.dto;

import com.eventvenue.entity.Event;
import com.eventvenue.entity.Vendor;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO for Event with vendor contact information
 * Used to display event details to users with vendor business info
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventDTO {
    // Event fields
    private Long id;
    private Long vendorId;
    private String name;
    private String description;
    private String category;
    private LocalDateTime eventDate;
    private LocalTime eventTime;
    private String location;
    private Integer maxAttendees;
    private BigDecimal pricePerTicket;
    private Integer totalTickets;
    private Integer ticketsAvailable;
    private String bookingType;
    private Boolean isActive;
    private String images;
    private Integer rescheduleCount;
    private Boolean wasRescheduled;
    private LocalDateTime lastRescheduledAt;
    private String rescheduleReason;
    private LocalDateTime originalEventDate;
    private String originalLocation;
    private Double rating;
    private Integer reviewCount;
    private Boolean isCancelled;
    private String cancellationReason;
    private LocalDateTime cancelledAt;
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
     * Create DTO from Event entity with vendor info
     */
    public static EventDTO fromEvent(Event event, Vendor vendor) {
        EventDTOBuilder builder = EventDTO.builder()
            .id(event.getId())
            .vendorId(event.getVendorId())
            .name(event.getName())
            .description(event.getDescription())
            .category(event.getCategory())
            .eventDate(event.getEventDate())
            .eventTime(event.getEventTime())
            .location(event.getLocation())
            .maxAttendees(event.getMaxAttendees())
            .pricePerTicket(event.getPricePerTicket())
            .totalTickets(event.getTotalTickets())
            .ticketsAvailable(event.getTicketsAvailable())
            .bookingType(event.getBookingType())
            .isActive(event.getIsActive())
            .images(event.getImages())
            .rescheduleCount(event.getRescheduleCount())
            .wasRescheduled(event.getWasRescheduled())
            .lastRescheduledAt(event.getLastRescheduledAt())
            .rescheduleReason(event.getRescheduleReason())
            .originalEventDate(event.getOriginalEventDate())
            .originalLocation(event.getOriginalLocation())
            .rating(event.getRating())
            .reviewCount(event.getReviewCount())
            .isCancelled(event.getIsCancelled())
            .cancellationReason(event.getCancellationReason())
            .cancelledAt(event.getCancelledAt())
            .vendorPhone(event.getVendorPhone())
            .editCount(event.getEditCount())
            .isEditLocked(event.getIsEditLocked())
            .createdAt(event.getCreatedAt())
            .updatedAt(event.getUpdatedAt());
        
        // Add vendor business info if available
        if (vendor != null) {
            builder.vendorBusinessName(vendor.getBusinessName())
                   .vendorBusinessPhone(vendor.getBusinessPhone())
                   .vendorEmail(vendor.getEmail());
        }
        
        return builder.build();
    }
    
    /**
     * Create DTO from Event entity without vendor info
     */
    public static EventDTO fromEvent(Event event) {
        return fromEvent(event, null);
    }
}
