package com.eventvenue.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vendor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String businessName;

    private String businessPhone;
    private String businessAddress;
    private String city;
    private String state;
    private String pincode;
    
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isVerified;

    private String verificationToken;

    @Column(columnDefinition = "DECIMAL(3, 2) DEFAULT 0.00")
    private Double rating;

    @Column(columnDefinition = "INT DEFAULT 0")
    private Integer totalVenues;

    @Column(name = "points", columnDefinition = "BIGINT DEFAULT 0")
    private Long points;

    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        status = "PENDING";
        isVerified = false;
        isActive = true;
        totalVenues = 0;
        rating = 0.0;
        points = 200L; // Welcome bonus - same as users
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
