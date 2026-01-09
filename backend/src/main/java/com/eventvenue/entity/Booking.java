package com.eventvenue.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    // Store user name at booking time for display
    private String userName;

    private Long venueId;
    private Long eventId;

    @Column(nullable = false)
    private LocalDate bookingDate;
    
    // For multi-day venue bookings
    private LocalDate startDate;
    private LocalDate endDate;

    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private Integer durationHours;
    
    // Number of tickets for events
    private Integer quantity;

    // For seat-selection events: JSON array of seat IDs
    @Column(columnDefinition = "TEXT")
    private String seatIds; // "[1, 2, 3]"

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Column(columnDefinition = "INT DEFAULT 0")
    private Integer pointsUsed;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, CONFIRMED, COMPLETED, CANCELLED

    @Column(nullable = false)
    private String paymentStatus = "PENDING"; // PENDING, COMPLETED, FAILED

    // Refund tracking for cancellations
    private BigDecimal refundAmount;
    private Integer refundPercentage;
    private LocalDateTime cancelledAt;
    
    // Hybrid payment: PayPal transaction for remaining amount
    @Column(name = "paypal_transaction_id")
    private String paypalTransactionId;
    
    @Column(name = "remaining_amount")
    private BigDecimal remainingAmount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        // Only set defaults if not already set (allows CONFIRMED from service)
        if (status == null) status = "PENDING";
        if (paymentStatus == null) paymentStatus = "PENDING";
        if (pointsUsed == null) pointsUsed = 0;
        if (quantity == null) quantity = 1;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
