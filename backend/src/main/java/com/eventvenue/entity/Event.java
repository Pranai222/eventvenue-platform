package com.eventvenue.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long vendorId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    @Column(nullable = false)
    private LocalDateTime eventDate;

    private LocalTime eventTime;

    @Column(nullable = false)
    private String location;

    private Integer maxAttendees;

    @Column(nullable = false)
    private BigDecimal pricePerTicket;

    @Column(nullable = false)
    private Integer totalTickets;

    @Column(nullable = false)
    private Integer ticketsAvailable;

    @Column(length = 20)
    private String bookingType = "QUANTITY"; // QUANTITY or SEAT_SELECTION

    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive;

    @Column(columnDefinition = "TEXT")
    private String images;

    // Reschedule tracking fields
    @Column(columnDefinition = "INT DEFAULT 0")
    private Integer rescheduleCount = 0;

    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean wasRescheduled = false;

    @Column(name = "last_rescheduled_at")
    private LocalDateTime lastRescheduledAt;

    @Column(columnDefinition = "TEXT")
    private String rescheduleReason;

    // Original values for reference
    @Column(name = "original_event_date")
    private LocalDateTime originalEventDate;

    @Column(name = "original_location")
    private String originalLocation;

    // Rating fields (calculated from reviews)
    @Column(columnDefinition = "DECIMAL(3, 2) DEFAULT 0.00")
    private Double rating;

    @Column(columnDefinition = "INT DEFAULT 0")
    private Integer reviewCount;

    // Cancellation tracking
    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isCancelled = false;

    @Column(columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    // Vendor contact phone (mandatory for user contact info)
    @Column(nullable = false)
    private String vendorPhone;

    // Edit limit tracking - only 2 edits allowed for location/time changes
    @Column(columnDefinition = "INT DEFAULT 0")
    private Integer editCount;

    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isEditLocked;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        isActive = true;
        ticketsAvailable = totalTickets;
        rescheduleCount = 0;
        wasRescheduled = false;
        isCancelled = false;
        rating = 0.0;
        reviewCount = 0;
        editCount = 0;
        isEditLocked = false;
        // Store original values
        originalEventDate = eventDate;
        originalLocation = location;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

