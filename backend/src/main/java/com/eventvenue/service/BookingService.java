package com.eventvenue.service;

import com.eventvenue.dto.BookingDTO;
import com.eventvenue.entity.Booking;
import com.eventvenue.entity.Venue;
import com.eventvenue.entity.Event;
import com.eventvenue.entity.Vendor;
import com.eventvenue.entity.User;
import com.eventvenue.entity.EventSeat;
import com.eventvenue.repository.BookingRepository;
import com.eventvenue.repository.VenueRepository;
import com.eventvenue.repository.EventRepository;
import com.eventvenue.repository.VendorRepository;
import com.eventvenue.repository.EventSeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PointsService pointsService;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private AdminService adminService;
    
    @Autowired
    private VendorRepository vendorRepository;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private com.eventvenue.repository.UserRepository userRepository;
    
    @Autowired
    private SeatService seatService;
    
    @Autowired
    private EventSeatRepository eventSeatRepository;
    
    @Autowired
    private ObjectMapper objectMapper;

    public Booking createBooking(Booking booking) {
        Booking saved = bookingRepository.save(booking);
        auditLogService.log("BOOKING_CREATED", "BOOKING", saved.getId(), 
            "Booking created for user " + saved.getUserId());
        return saved;
    }

    @Transactional
    public Booking createBookingWithPoints(Long userId, Long venueId, Long eventId, 
                                          String bookingDate, String checkInTime, 
                                          String checkOutTime, Integer durationHours, Integer quantity,
                                          Integer pointsToUse, String paypalTransactionId, Double remainingAmount,
                                          Double totalAmount) {
        int conversionRate = adminService.getConversionRate().getPointsPerDollar();
        Long fullPointsNeeded = calculatePointsNeeded(venueId, eventId, durationHours, quantity);
        final Long PLATFORM_FEE_POINTS = 2L;
        
        // If pointsToUse is null, use full points (backward compatibility)
        Long actualPointsToUse = pointsToUse != null ? Long.valueOf(pointsToUse) : fullPointsNeeded;
        Long totalPointsRequired = actualPointsToUse + PLATFORM_FEE_POINTS;
        
        Long userPoints = pointsService.getUserPoints(userId);
        if (userPoints < totalPointsRequired) {
            throw new RuntimeException("Insufficient points. You need " + totalPointsRequired + " points (including 2 points platform fee) but have " + userPoints);
        }

        if (eventId != null) {
            Optional<Event> eventOpt = eventRepository.findById(eventId);
            if (eventOpt.isPresent()) {
                Event event = eventOpt.get();
                Integer ticketsNeeded = quantity != null ? quantity : 1;
                if (event.getTicketsAvailable() < ticketsNeeded) {
                    throw new RuntimeException("Not enough tickets available");
                }
                event.setTicketsAvailable(event.getTicketsAvailable() - ticketsNeeded);
                eventRepository.save(event);
            }
        }
        
        // IMPORTANT: Use totalAmount from frontend if provided to maintain consistency
        // with what the user saw during booking. Fall back to calculation for backward compatibility.
        double totalBookingAmount;
        if (totalAmount != null && totalAmount > 0) {
            totalBookingAmount = totalAmount;  // Use frontend-calculated amount
        } else {
            totalBookingAmount = fullPointsNeeded / (double)conversionRate;  // Fallback calculation
        }
        
        // Remaining amount is what's paid via PayPal
        java.math.BigDecimal remainingAmountBD = remainingAmount != null ? 
            java.math.BigDecimal.valueOf(remainingAmount) : java.math.BigDecimal.ZERO;

        Booking bookingObj = Booking.builder()
                .userId(userId)
                .venueId(venueId)
                .eventId(eventId)
                .bookingDate(java.time.LocalDate.parse(bookingDate))
                .checkInTime(checkInTime != null ? java.time.LocalTime.parse(checkInTime) : null)
                .checkOutTime(checkOutTime != null ? java.time.LocalTime.parse(checkOutTime) : null)
                .durationHours(durationHours)
                .quantity(quantity)
                .totalAmount(java.math.BigDecimal.valueOf(totalBookingAmount))
                .pointsUsed(actualPointsToUse.intValue())
                .paypalTransactionId(paypalTransactionId)
                .remainingAmount(remainingAmountBD)
                .status("CONFIRMED")
                .paymentStatus("COMPLETED")
                .build();

        
        // Capture user name for display in vendor bookings
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String displayName = user.getFirstName() != null && !user.getFirstName().isEmpty() 
                ? user.getFirstName() + (user.getLastName() != null ? " " + user.getLastName() : "")
                : user.getUsername();
            bookingObj.setUserName(displayName);
        }
        
        bookingObj = bookingRepository.save(bookingObj);

        // Deduct points user wants to use (can be 0 if full PayPal payment)
        if (actualPointsToUse > 0) {
            pointsService.deductPoints(userId, actualPointsToUse, "Booking payment", bookingObj.getId());
        }
        
        // Deduct 2 points platform fee
        if (userPoints >= totalPointsRequired) {
            pointsService.deductPoints(userId, PLATFORM_FEE_POINTS, "Platform fee", bookingObj.getId());
        }
        
        // Transfer points to vendor
        Long vendorId = null;
        if (venueId != null) {
            Optional<Venue> venueOpt = venueRepository.findById(venueId);
            if (venueOpt.isPresent()) {
                vendorId = venueOpt.get().getVendorId();
            }
        } else if (eventId != null) {
            Optional<Event> eventOpt = eventRepository.findById(eventId);
            if (eventOpt.isPresent()) {
                vendorId = eventOpt.get().getVendorId();
            }
        }
        
        if (vendorId != null) {
            Optional<Vendor> vendorOpt = vendorRepository.findById(vendorId);
            if (vendorOpt.isPresent()) {
                Vendor vendor = vendorOpt.get();
                vendor.setPoints((vendor.getPoints() != null ? vendor.getPoints() : 0L) + fullPointsNeeded);
                vendorRepository.save(vendor);
            }
        }

        // Send booking confirmation email
        sendBookingConfirmationEmail(bookingObj);

        return bookingObj;
    }

    private Long calculatePointsNeeded(Long venueId, Long eventId, Integer durationHours, Integer quantity) {
        int conversionRate = adminService.getConversionRate().getPointsPerDollar();
        java.math.BigDecimal amount = java.math.BigDecimal.ZERO;

        if (venueId != null) {
            Optional<Venue> venueOpt = venueRepository.findById(venueId);
            if (venueOpt.isPresent()) {
                java.math.BigDecimal pricePerHour = venueOpt.get().getPricePerHour();
                amount = pricePerHour.multiply(new java.math.BigDecimal(durationHours != null ? durationHours : 1));
            }
        }

        if (eventId != null) {
            Optional<Event> eventOpt = eventRepository.findById(eventId);
            if (eventOpt.isPresent()) {
                java.math.BigDecimal pricePerTicket = eventOpt.get().getPricePerTicket();
                amount = pricePerTicket.multiply(new java.math.BigDecimal(quantity != null ? quantity : 1));
            }
        }

        return Math.round(amount.doubleValue() * conversionRate);
    }

    public Optional<Booking> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }
    
    /**
     * Get booking by ID with seat information enriched
     */
    public BookingDTO getBookingByIdWithSeatInfo(Long id) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return null;
        }
        
        Booking booking = bookingOpt.get();
        
        if (booking.getEventId() != null) {
            // Priority 1: Check if this booking has associated seats in the EventSeat table (linked via FK)
            List<EventSeat> seats = eventSeatRepository.findByBookingId(booking.getId());
            
            // Priority 2: Fallback to parsing seatIds JSON if no FK link found (supports legacy bookings)
            if (seats.isEmpty() && booking.getSeatIds() != null && !booking.getSeatIds().isEmpty()) {
                List<Long> seatIds = new ArrayList<>();
                try {
                    // Try JSON parsing first
                    seatIds = objectMapper.readValue(booking.getSeatIds(), new TypeReference<List<Long>>(){});
                } catch (Exception e) {
                    log.warn("Failed to parse seat IDs as JSON for booking {}: {}, trying CSV", booking.getId(), e.getMessage());
                    // Try simple CSV parsing as backup (handles "1,2,3" or "[1,2,3]")
                    try {
                        String cleaned = booking.getSeatIds().replaceAll("[\\[\\]\\s]", "");
                        if (!cleaned.isEmpty()) {
                            for (String part : cleaned.split(",")) {
                                if (!part.isEmpty()) seatIds.add(Long.parseLong(part));
                            }
                        }
                    } catch (Exception ex) {
                        log.error("Failed to parse seat IDs as CSV for booking {}", booking.getId(), ex);
                    }
                }
                
                if (!seatIds.isEmpty()) {
                    seats = eventSeatRepository.findAllById(seatIds);
                }
            }

            if (!seats.isEmpty()) {
                return BookingDTO.fromBookingWithSeats(booking, seats);
            }
        }
        
        return BookingDTO.fromBooking(booking);
    }

    public List<Booking> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId);
    }
    
    /**
     * Get user bookings with seat information enriched
     */
    public List<BookingDTO> getBookingsByUserWithSeatInfo(Long userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        List<BookingDTO> dtos = new ArrayList<>();
        
        for (Booking booking : bookings) {
            boolean isEventBooking = booking.getEventId() != null;
            if (isEventBooking) {
                // Priority 1: Check by FK
                List<EventSeat> seats = eventSeatRepository.findByBookingId(booking.getId());
                
                // Priority 2: Fallback to parsing seatIds JSON
                if (seats.isEmpty() && booking.getSeatIds() != null && !booking.getSeatIds().isEmpty()) {
                    List<Long> seatIds = new ArrayList<>();
                    try {
                        // Try JSON parsing first
                        seatIds = objectMapper.readValue(booking.getSeatIds(), new TypeReference<List<Long>>(){});
                    } catch (Exception e) {
                        log.warn("Failed to parse seat IDs as JSON for booking {}: {}, trying CSV", booking.getId(), e.getMessage());
                        // Try simple CSV parsing as backup (handles "1,2,3" or "[1,2,3]")
                        try {
                            String cleaned = booking.getSeatIds().replaceAll("[\\[\\]\\s]", "");
                            if (!cleaned.isEmpty()) {
                                for (String part : cleaned.split(",")) {
                                    if (!part.isEmpty()) seatIds.add(Long.parseLong(part));
                                }
                            }
                        } catch (Exception ex) {
                            log.error("Failed to parse seat IDs as CSV for booking {}", booking.getId(), ex);
                        }
                    }
                    
                    if (!seatIds.isEmpty()) {
                        seats = eventSeatRepository.findAllById(seatIds);
                    }
                }

                if (!seats.isEmpty()) {
                    dtos.add(BookingDTO.fromBookingWithSeats(booking, seats));
                    continue;
                }
            }
            
            // Fallback for non-seat bookings or if no seats found
            dtos.add(BookingDTO.fromBooking(booking));
        }
        
        return dtos;
    }

    public List<Booking> getBookingsByVenue(Long venueId) {
        return bookingRepository.findByVenueId(venueId);
    }

    public List<Booking> getBookingsByEvent(Long eventId) {
        return bookingRepository.findByEventId(eventId);
    }

    public List<Booking> getBookingsByVendor(Long vendorId) {
        List<Venue> vendorVenues = venueRepository.findByVendorId(vendorId);
        List<Long> venueIds = vendorVenues.stream()
                .map(Venue::getId)
                .collect(Collectors.toList());
        
        List<Booking> vendorBookings = new ArrayList<>();
        for (Long venueId : venueIds) {
            vendorBookings.addAll(bookingRepository.findByVenueId(venueId));
        }
        
        return vendorBookings;
    }

    public Booking updateBooking(Long id, Booking bookingDetails) {
        Optional<Booking> bookingOptional = bookingRepository.findById(id);
        if (bookingOptional.isPresent()) {
            Booking booking = bookingOptional.get();
            if (bookingDetails.getStatus() != null) {
                booking.setStatus(bookingDetails.getStatus());
            }
            if (bookingDetails.getPaymentStatus() != null) {
                booking.setPaymentStatus(bookingDetails.getPaymentStatus());
            }
            return bookingRepository.save(booking);
        }
        throw new RuntimeException("Booking not found");
    }

    @Transactional
    public Booking confirmBooking(Long id) {
        Optional<Booking> bookingOptional = bookingRepository.findById(id);
        if (bookingOptional.isPresent()) {
            Booking booking = bookingOptional.get();
            booking.setStatus("CONFIRMED");
            booking.setPaymentStatus("COMPLETED");
            return bookingRepository.save(booking);
        }
        throw new RuntimeException("Booking not found");
    }

    @Transactional
    public CancellationResult cancelBooking(Long id) {
        Optional<Booking> bookingOptional = bookingRepository.findById(id);
        if (!bookingOptional.isPresent()) {
            throw new RuntimeException("Booking not found");
        }
        
        Booking booking = bookingOptional.get();
        
        // Get admin-set conversion rate for points calculation
        int conversionRate = adminService.getConversionRate().getPointsPerDollar();
        
        // Calculate refund based on cancellation policy
        CancellationResult result = calculateRefund(booking);
        
        // Update booking with cancellation info
        booking.setStatus("CANCELLED");
        booking.setCancelledAt(LocalDateTime.now());
        booking.setRefundAmount(result.refundAmount);
        booking.setRefundPercentage(result.refundPercentage);
        bookingRepository.save(booking);
        
        // ==========================================
        // NEW REFUND LOGIC FOR HYBRID PAYMENTS:
        // Refund percentage of TOTAL booking amount as POINTS
        // NO money refund at all
        // ==========================================
        // Example: Booking ₹100 (paid with 50 points + ₹50 cash)
        // Cancel within 2 days (75% refund):
        // - Refund = 75% of ₹100 = ₹75 worth of points
        // - Points to refund = ₹75 × conversionRate = 75 points (if rate = 1)
        // - NO PayPal/cash refund
        
        BigDecimal totalBookingAmount = booking.getTotalAmount();
        BigDecimal refundValueInRupees = totalBookingAmount
            .multiply(new BigDecimal(result.refundPercentage))
            .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
        
        // Convert rupee refund value to points using admin conversion rate
        Long pointsToRefund = Math.round(refundValueInRupees.doubleValue() * conversionRate);
        
        if (pointsToRefund > 0) {
            pointsService.refundPoints(
                booking.getUserId(), 
                pointsToRefund, 
                String.format("Booking cancelled - %d%% refund (₹%.2f = %d points)", 
                    result.refundPercentage, refundValueInRupees.doubleValue(), pointsToRefund), 
                booking.getId()
            );
            result.pointsRefunded = pointsToRefund.intValue();
            log.info("[REFUND] Booking {} cancelled. Refunded {} points ({}% of ₹{} total)", 
                booking.getId(), pointsToRefund, result.refundPercentage, totalBookingAmount);
        }
        
        // Deduct points from vendor (they received points when booking was created)
        Long vendorId = null;
        if (booking.getVenueId() != null) {
            Optional<Venue> venueOpt = venueRepository.findById(booking.getVenueId());
            if (venueOpt.isPresent()) {
                vendorId = venueOpt.get().getVendorId();
            }
        } else if (booking.getEventId() != null) {
            Optional<Event> eventOpt = eventRepository.findById(booking.getEventId());
            if (eventOpt.isPresent()) {
                vendorId = eventOpt.get().getVendorId();
            }
        }
        
        if (vendorId != null && pointsToRefund > 0) {
            Optional<Vendor> vendorOpt = vendorRepository.findById(vendorId);
            if (vendorOpt.isPresent()) {
                Vendor vendor = vendorOpt.get();
                Long currentPoints = vendor.getPoints() != null ? vendor.getPoints() : 0L;
                // Ensure vendor points don't go negative
                vendor.setPoints(Math.max(0L, currentPoints - pointsToRefund));
                vendorRepository.save(vendor);
            }
        }

        if (booking.getEventId() != null) {
            Optional<Event> eventOpt = eventRepository.findById(booking.getEventId());
            if (eventOpt.isPresent()) {
                Event event = eventOpt.get();
                // Use quantity field if available, otherwise fallback to durationHours for backwards compatibility
                Integer quantity = booking.getQuantity() != null ? booking.getQuantity() : 
                                 (booking.getDurationHours() != null ? booking.getDurationHours() : 1);
                event.setTicketsAvailable(event.getTicketsAvailable() + quantity);
                eventRepository.save(event);
                
                // Release seats for seat-selection events
                if ("SEAT_SELECTION".equals(event.getBookingType()) && booking.getSeatIds() != null) {
                    seatService.releaseSeats(booking.getId());
                    log.info("Released seats for cancelled seat booking {}", booking.getId());
                }
            }
        }
        
        // Send cancellation email with refund details
        sendBookingCancellationEmail(booking, result);
        
        // Audit log the cancellation
        auditLogService.log("BOOKING_CANCELLED", "BOOKING", booking.getId(), 
            String.format("Booking cancelled. Refund: %d%% (%d points, NO money refund)", 
                result.refundPercentage, result.pointsRefunded));
        
        return result;
    }
    
    /**
     * Calculate refund based on cancellation policy:
     * - 2+ days before event/booking: 100% refund
     * - Within 2 days: 75% refund (updated from 25%)
     * - After vendor reschedule: 95% refund
     * - Vendor cancelled event: 100% refund
     */
    private CancellationResult calculateRefund(Booking booking) {
        BigDecimal totalAmount = booking.getTotalAmount();
        LocalDate today = LocalDate.now();
        long daysUntil;
        boolean isVenueBooking = booking.getVenueId() != null;
        
        if (isVenueBooking) {
            // For venue bookings, use the booking date
            daysUntil = ChronoUnit.DAYS.between(today, booking.getBookingDate());
            
            if (daysUntil >= 2) {
                // 100% refund for cancellation 2+ days in advance
                return new CancellationResult(totalAmount, 100, "Venue cancellation 2+ days in advance: Full refund");
            } else {
                // 75% refund for late cancellation (updated from 25%)
                BigDecimal refundAmount = totalAmount.multiply(new BigDecimal("0.75")).setScale(2, RoundingMode.HALF_UP);
                return new CancellationResult(refundAmount, 75, "Venue cancellation less than 2 days before booking: 75% refund");
            }
        } else {
            // For event bookings, get the event date
            Optional<Event> eventOpt = eventRepository.findById(booking.getEventId());
            if (eventOpt.isPresent()) {
                Event event = eventOpt.get();
                LocalDate eventDate = event.getEventDate().toLocalDate();
                daysUntil = ChronoUnit.DAYS.between(today, eventDate);
                
                // Check if event was cancelled by vendor - 100% refund
                if (event.getIsCancelled() != null && event.getIsCancelled()) {
                    return new CancellationResult(totalAmount, 100, "Event cancelled by vendor: Full refund");
                }
                
                // Check if event was rescheduled - 95% refund for user cancellation
                if (event.getWasRescheduled() != null && event.getWasRescheduled()) {
                    BigDecimal refundAmount = totalAmount.multiply(new BigDecimal("0.95")).setScale(2, RoundingMode.HALF_UP);
                    return new CancellationResult(refundAmount, 95, "Event was rescheduled by vendor: 95% refund");
                }
                
                if (daysUntil >= 2) {
                    // 100% refund for cancellation 2+ days in advance
                    return new CancellationResult(totalAmount, 100, "Event cancellation 2+ days in advance: Full refund");
                } else {
                    // 75% refund for late cancellation (updated from 25%)
                    BigDecimal refundAmount = totalAmount.multiply(new BigDecimal("0.75")).setScale(2, RoundingMode.HALF_UP);
                    return new CancellationResult(refundAmount, 75, "Event cancellation less than 2 days before event: 75% refund");
                }
            }
            // If event not found, no refund
            return new CancellationResult(BigDecimal.ZERO, 0, "Event not found");
        }
    }
    
    // Inner class to hold cancellation result
    public static class CancellationResult {
        public BigDecimal refundAmount;
        public Integer refundPercentage;
        public String message;
        public Integer pointsRefunded = 0;
        
        public CancellationResult(BigDecimal refundAmount, Integer refundPercentage, String message) {
            this.refundAmount = refundAmount;
            this.refundPercentage = refundPercentage;
            this.message = message;
        }
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public BookingCalculationResult calculateBookingCost(Long venueId, Long eventId, Integer durationHours, 
                                                         Integer quantity, Integer pointsToUse) {
        int conversionRate = adminService.getConversionRate().getPointsPerDollar();
        BigDecimal subtotal = BigDecimal.ZERO;

        if (venueId != null) {
            Optional<Venue> venueOpt = venueRepository.findById(venueId);
            if (venueOpt.isPresent()) {
                BigDecimal pricePerHour = venueOpt.get().getPricePerHour();
                subtotal = pricePerHour.multiply(new BigDecimal(durationHours != null ? durationHours : 1));
            }
        }

        if (eventId != null) {
            Optional<Event> eventOpt = eventRepository.findById(eventId);
            if (eventOpt.isPresent()) {
                BigDecimal pricePerTicket = eventOpt.get().getPricePerTicket();
                subtotal = pricePerTicket.multiply(new BigDecimal(quantity != null ? quantity : 1));
            }
        }

        // Calculate points discount using admin's conversion rate
        BigDecimal pointsDiscount = new BigDecimal(pointsToUse != null ? pointsToUse : 0)
                .divide(new BigDecimal(conversionRate), 2, java.math.RoundingMode.HALF_UP);

        BigDecimal totalAmount = subtotal.subtract(pointsDiscount);
        if (totalAmount.signum() < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        return new BookingCalculationResult(subtotal, pointsDiscount, totalAmount, pointsToUse != null ? pointsToUse : 0);
    }

    public static class BookingCalculationResult {
        public BigDecimal subtotal;
        public BigDecimal pointsDiscount;
        public BigDecimal totalAmount;
        public Integer pointsUsed;

        public BookingCalculationResult(BigDecimal subtotal, BigDecimal pointsDiscount, BigDecimal totalAmount, Integer pointsUsed) {
            this.subtotal = subtotal;
            this.pointsDiscount = pointsDiscount;
            this.totalAmount = totalAmount;
            this.pointsUsed = pointsUsed;
        }
    }
    
    /**
     * Send booking confirmation email with full details
     */
    private void sendBookingConfirmationEmail(Booking booking) {
        try {
            // Get user information from database
            Optional<User> userOpt = userRepository.findById(booking.getUserId());
            if (userOpt.isEmpty()) {
                log.warn("Cannot send booking confirmation email - user {} not found", booking.getUserId());
                return;
            }
            
            User user = userOpt.get();
            String userEmail = user.getEmail();
            String userName = user.getFirstName() != null ? user.getFirstName() : user.getUsername();
            
            // Get conversion rate and calculate points earned (5% of totalAmount as points)
            int conversionRate = adminService.getConversionRate().getPointsPerDollar();
            int pointsEarned = (int) Math.round(booking.getTotalAmount().doubleValue() * conversionRate * 0.05);
            int pointsUsed = booking.getPointsUsed() != null ? booking.getPointsUsed() : 0;
            double pointsValue = pointsUsed / (double) conversionRate;
            double cashPaid = booking.getRemainingAmount() != null ? booking.getRemainingAmount().doubleValue() : 0;
            
            // Send email based on booking type
            if (booking.getEventId() != null) {
                // Event booking
                Optional<Event> eventOpt = eventRepository.findById(booking.getEventId());
                if (eventOpt.isPresent()) {
                    Event event = eventOpt.get();
                    emailService.sendBookingConfirmationInvoice(
                        userEmail,
                        userName,
                        booking.getId(),
                        event.getName(),
                        "EVENT",
                        event.getEventDate().toString(),
                        event.getEventTime() != null ? event.getEventTime().toString() : "TBA",
                        event.getLocation(),
                        booking.getQuantity() != null ? booking.getQuantity() : 1,
                        booking.getTotalAmount().doubleValue(),
                        pointsUsed,
                        pointsValue,
                        cashPaid,
                        2, // Platform fee
                        booking.getTotalAmount().doubleValue(),
                        pointsEarned,
                        conversionRate
                    );
                    log.info("[EMAIL] Sent event booking invoice to: {}", userEmail);
                }
            } else if (booking.getVenueId() != null) {
                // Venue booking
                Optional<Venue> venueOpt = venueRepository.findById(booking.getVenueId());
                if (venueOpt.isPresent()) {
                    Venue venue = venueOpt.get();
                    String checkInTime = booking.getCheckInTime() != null ? booking.getCheckInTime().toString() : "TBA";
                    emailService.sendBookingConfirmationInvoice(
                        userEmail,
                        userName,
                        booking.getId(),
                        venue.getName(),
                        "VENUE",
                        booking.getBookingDate().toString(),
                        checkInTime,
                        venue.getAddress(),
                        booking.getDurationHours() != null ? booking.getDurationHours() : 1,
                        booking.getTotalAmount().doubleValue(),
                        pointsUsed,
                        pointsValue,
                        cashPaid,
                        2, // Platform fee
                        booking.getTotalAmount().doubleValue(),
                        pointsEarned,
                        conversionRate
                    );
                    log.info("[EMAIL] Sent venue booking invoice to: {}", userEmail);
                }
            }
        } catch (Exception e) {
            log.error("[EMAIL] Failed to send booking confirmation for booking {}: {}", booking.getId(), e.getMessage());
            e.printStackTrace();
            // Don't fail the booking if email fails
        }
    }
    
    /**
     * Send booking cancellation email with refund details (invoice style)
     */
    private void sendBookingCancellationEmail(Booking booking, CancellationResult result) {
        try {
            // Get user information
            Optional<User> userOpt = userRepository.findById(booking.getUserId());
            if (userOpt.isEmpty()) {
                log.warn("Cannot send cancellation email - user {} not found", booking.getUserId());
                return;
            }
            
            User user = userOpt.get();
            String userEmail = user.getEmail();
            String userName = user.getFirstName() != null ? user.getFirstName() : user.getUsername();
            
            // Get booking item name
            String itemName = "Booking";
            String itemType = "VENUE";
            String bookingDate = booking.getBookingDate() != null ? booking.getBookingDate().toString() : "";
            
            if (booking.getEventId() != null) {
                Optional<Event> eventOpt = eventRepository.findById(booking.getEventId());
                if (eventOpt.isPresent()) {
                    itemName = eventOpt.get().getName();
                    itemType = "EVENT";
                    if (eventOpt.get().getEventDate() != null) {
                        bookingDate = eventOpt.get().getEventDate().toString();
                    }
                }
            } else if (booking.getVenueId() != null) {
                Optional<Venue> venueOpt = venueRepository.findById(booking.getVenueId());
                if (venueOpt.isPresent()) {
                    itemName = venueOpt.get().getName();
                }
            }
            
            // Get conversion rate
            int conversionRate = adminService.getConversionRate().getPointsPerDollar();
            
            // Send cancellation email
            emailService.sendBookingCancellationInvoice(
                userEmail,
                userName,
                booking.getId(),
                itemName,
                itemType,
                bookingDate,
                booking.getTotalAmount().doubleValue(),
                booking.getPointsUsed() != null ? booking.getPointsUsed() : 0,
                booking.getRemainingAmount() != null ? booking.getRemainingAmount().doubleValue() : 0,
                result.refundPercentage,
                result.pointsRefunded,
                result.message,
                conversionRate
            );
            
            System.out.println("[EMAIL] Sent booking cancellation email to: " + userEmail);
        } catch (Exception e) {
            System.err.println("[EMAIL] Failed to send cancellation email for booking " + booking.getId() + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
