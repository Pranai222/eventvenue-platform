package com.eventvenue.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "venues")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Venue {
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
    private String city;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private BigDecimal pricePerHour;

    @Column(columnDefinition = "TEXT")
    private String amenities;

    @Column(columnDefinition = "TEXT")
    private String images;

    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isAvailable;

    @Column(columnDefinition = "DECIMAL(3, 2) DEFAULT 0.00")
    private Double rating;

    @Column(columnDefinition = "INT DEFAULT 0")
    private Integer totalBookings;

    // Vendor contact phone (mandatory for user contact info)
    @Column(nullable = false)
    private String vendorPhone;

    // Edit limit tracking - only 2 edits allowed for address/location
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
        isAvailable = true;
        rating = 0.0;
        totalBookings = 0;
        editCount = 0;
        isEditLocked = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
