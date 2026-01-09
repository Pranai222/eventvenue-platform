package com.eventvenue.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "withdrawal_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "points_amount", nullable = false)
    private Integer pointsAmount;

    @Column(name = "amount_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountUsd;

    @Column(name = "status", length = 50)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, COMPLETED

    @Column(name = "stripe_payout_id")
    private String stripePayoutId;

    @Column(name = "admin_id")
    private Long adminId;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "requires_approval")
    private Boolean requiresApproval = false;

    @Column(name = "card_last4", length = 4)
    private String cardLast4;

    @Column(name = "paypal_email")
    private String paypalEmail;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
        if (requiresApproval == null) {
            requiresApproval = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Business logic methods
    public boolean requiresAdminApproval() {
        // If points amount is > 10,000, requires admin approval
        return pointsAmount != null && pointsAmount > 10000;
    }

    public boolean isPending() {
        return "PENDING".equals(status);
    }

    public boolean isApproved() {
        return "APPROVED".equals(status);
    }

    public boolean isRejected() {
        return "REJECTED".equals(status);
    }

    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }

    public void approve(Long adminId, String notes) {
        this.status = "APPROVED";
        this.adminId = adminId;
        this.adminNotes = notes;
    }

    public void reject(Long adminId, String notes) {
        this.status = "REJECTED";
        this.adminId = adminId;
        this.adminNotes = notes;
    }

    public void complete(String payoutId) {
        this.status = "COMPLETED";
        this.stripePayoutId = payoutId;
    }
}
