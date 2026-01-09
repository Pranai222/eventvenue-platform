package com.eventvenue.repository;

import com.eventvenue.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByVenueId(Long venueId);
    List<Booking> findByEventId(Long eventId);
    List<Booking> findByStatus(String status);
    
    long countByStatus(String status);
    
    // Find active bookings (not cancelled) for a venue on a specific date
    List<Booking> findByVenueIdAndBookingDateAndStatusNot(Long venueId, LocalDate bookingDate, String status);
    
    // Find active bookings with time overlap for a venue on a specific date
    @Query("SELECT b FROM Booking b WHERE b.venueId = :venueId AND b.bookingDate = :bookingDate " +
           "AND b.status != 'CANCELLED' " +
           "AND ((b.checkInTime <= :checkOutTime AND b.checkOutTime >= :checkInTime) OR " +
           "(b.checkInTime IS NULL AND b.checkOutTime IS NULL))")
    List<Booking> findConflictingBookings(
        @Param("venueId") Long venueId, 
        @Param("bookingDate") LocalDate bookingDate,
        @Param("checkInTime") LocalTime checkInTime,
        @Param("checkOutTime") LocalTime checkOutTime
    );
}

