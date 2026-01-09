package com.eventvenue.dto;

import com.eventvenue.entity.Booking;
import com.eventvenue.entity.EventSeat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDTO {
    private Long id;
    private Long userId;
    private String userName;
    private Long venueId;
    private Long eventId;
    private LocalDate bookingDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private Integer durationHours;
    private Integer quantity;
    private BigDecimal totalAmount;
    private Integer pointsUsed;
    private String status;
    private String paymentStatus;
    private BigDecimal refundAmount;
    private Integer refundPercentage;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Seat info for seat-selection events
    private String seatLabels;  // e.g., "A1, A2, B3"
    private Integer seatCount;  // Number of seats booked

    /**
     * Creates a BookingDTO from a Booking entity
     */
    public static BookingDTO fromBooking(Booking booking) {
        return BookingDTO.builder()
                .id(booking.getId())
                .userId(booking.getUserId())
                .userName(booking.getUserName())
                .venueId(booking.getVenueId())
                .eventId(booking.getEventId())
                .bookingDate(booking.getBookingDate())
                .startDate(booking.getStartDate())
                .endDate(booking.getEndDate())
                .checkInTime(booking.getCheckInTime())
                .checkOutTime(booking.getCheckOutTime())
                .durationHours(booking.getDurationHours())
                .quantity(booking.getQuantity())
                .totalAmount(booking.getTotalAmount())
                .pointsUsed(booking.getPointsUsed())
                .status(booking.getStatus())
                .paymentStatus(booking.getPaymentStatus())
                .refundAmount(booking.getRefundAmount())
                .refundPercentage(booking.getRefundPercentage())
                .cancelledAt(booking.getCancelledAt())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    /**
     * Creates a BookingDTO enriched with seat information
     */
    public static BookingDTO fromBookingWithSeats(Booking booking, List<EventSeat> seats) {
        BookingDTO dto = fromBooking(booking);
        
        if (seats != null && !seats.isEmpty()) {
            // Build seat labels like "A1, A2, B3"
            String labels = seats.stream()
                    .map(seat -> seat.getRowLabel() + seat.getSeatNumber())
                    .sorted()
                    .collect(Collectors.joining(", "));
            dto.setSeatLabels(labels);
            dto.setSeatCount(seats.size());
        }
        
        return dto;
    }
}
