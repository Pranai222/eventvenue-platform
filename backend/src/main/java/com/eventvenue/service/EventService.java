package com.eventvenue.service;

import com.eventvenue.entity.Event;
import com.eventvenue.entity.Booking;
import com.eventvenue.entity.User;
import com.eventvenue.entity.Vendor;
import com.eventvenue.repository.EventRepository;
import com.eventvenue.repository.BookingRepository;
import com.eventvenue.repository.UserRepository;
import com.eventvenue.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class EventService {

    // Platform fees for event creation
    private static final Long EVENT_QUANTITY_PLATFORM_FEE = 10L;  // Quantity-based events
    private static final Long EVENT_SEAT_PLATFORM_FEE = 20L;       // Seat-selection events

    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private VendorRepository vendorRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private PointsService pointsService;
    
    @Autowired
    private AuditLogService auditLogService;

    /**
     * Create event and deduct platform fee from vendor
     * - Quantity-based: 10 points
     * - Seat-selection: 20 points
     */
    @Transactional
    public Event createEvent(Event event) {
        // Determine platform fee based on booking type
        String bookingType = event.getBookingType() != null ? event.getBookingType() : "QUANTITY";
        Long platformFee = "SEAT_SELECTION".equals(bookingType) ? EVENT_SEAT_PLATFORM_FEE : EVENT_QUANTITY_PLATFORM_FEE;
        
        // Deduct platform fee from vendor
        Optional<Vendor> vendorOpt = vendorRepository.findById(event.getVendorId());
        if (vendorOpt.isPresent()) {
            Vendor vendor = vendorOpt.get();
            Long currentPoints = vendor.getPoints() != null ? vendor.getPoints() : 0L;
            
            if (currentPoints < platformFee) {
                throw new RuntimeException("Insufficient points. You need " + platformFee + 
                    " points to create a " + bookingType.toLowerCase().replace("_", "-") + 
                    " event but have " + currentPoints);
            }
            
            vendor.setPoints(currentPoints - platformFee);
            vendorRepository.save(vendor);
            
            System.out.println("[PLATFORM FEE] Deducted " + platformFee + 
                " points from vendor " + vendor.getId() + " for " + bookingType + " event creation");
        }
        
        Event saved = eventRepository.save(event);
        
        // Audit log event creation
        auditLogService.log("EVENT_CREATED", "EVENT", saved.getId(), 
            "Event created: " + saved.getName() + " by vendor " + saved.getVendorId());
        
        return saved;
    }

    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }

    public List<Event> getEventsByVendor(Long vendorId) {
        return eventRepository.findByVendorId(vendorId);
    }

    public List<Event> getActiveEvents() {
        return eventRepository.findByIsActive(true);
    }

    public List<Event> searchEvents(String query) {
        return eventRepository.search(query);
    }

    public List<Event> filterEvents(String category, String city, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, LocalDate dateFrom, LocalDate dateTo) {
        return eventRepository.filter(category, city, minPrice, maxPrice, dateFrom, dateTo);
    }

    public boolean buyEventTickets(Long eventId, Integer quantity) {
        Optional<Event> eventOptional = eventRepository.findById(eventId);
        if (eventOptional.isPresent()) {
            Event event = eventOptional.get();
            if (event.getTicketsAvailable() >= quantity) {
                event.setTicketsAvailable(event.getTicketsAvailable() - quantity);
                eventRepository.save(event);
                return true;
            }
        }
        return false;
    }

    public Event updateEvent(Long id, Event eventDetails) {
        Optional<Event> eventOptional = eventRepository.findById(id);
        if (eventOptional.isPresent()) {
            Event event = eventOptional.get();
            
            // Check if location/time is being changed - these have 2-edit limit
            boolean locationTimeChanged = false;
            if (eventDetails.getLocation() != null && !eventDetails.getLocation().equals(event.getLocation())) {
                locationTimeChanged = true;
            }
            if (eventDetails.getEventTime() != null && !eventDetails.getEventTime().equals(event.getEventTime())) {
                locationTimeChanged = true;
            }
            
            // Enforce 2-edit limit for location/time changes
            if (locationTimeChanged) {
                if (event.getIsEditLocked() != null && event.getIsEditLocked()) {
                    throw new RuntimeException("Location/Time editing is locked. Maximum 2 edits allowed.");
                }
                
                Integer currentEditCount = event.getEditCount() != null ? event.getEditCount() : 0;
                if (currentEditCount >= 2) {
                    event.setIsEditLocked(true);
                    eventRepository.save(event);
                    throw new RuntimeException("Location/Time editing is locked. Maximum 2 edits allowed.");
                }
                
                // Increment edit count
                event.setEditCount(currentEditCount + 1);
                
                // Lock after 2nd edit
                if (currentEditCount + 1 >= 2) {
                    event.setIsEditLocked(true);
                }
                
                System.out.println("[EVENT EDIT] Event " + id + " location/time edit count: " + (currentEditCount + 1) + "/2");
            }
            
            // Apply updates
            if (eventDetails.getName() != null) {
                event.setName(eventDetails.getName());
            }
            if (eventDetails.getDescription() != null) {
                event.setDescription(eventDetails.getDescription());
            }
            if (eventDetails.getEventDate() != null) {
                event.setEventDate(eventDetails.getEventDate());
            }
            if (eventDetails.getLocation() != null) {
                event.setLocation(eventDetails.getLocation());
            }
            if (eventDetails.getPricePerTicket() != null) {
                event.setPricePerTicket(eventDetails.getPricePerTicket());
            }
            if (eventDetails.getIsActive() != null) {
                event.setIsActive(eventDetails.getIsActive());
            }
            if (eventDetails.getTotalTickets() != null) {
                event.setTotalTickets(eventDetails.getTotalTickets());
                event.setTicketsAvailable(eventDetails.getTotalTickets());
            }
            if (eventDetails.getTicketsAvailable() != null) {
                event.setTicketsAvailable(eventDetails.getTicketsAvailable());
            }
            if (eventDetails.getVendorPhone() != null) {
                event.setVendorPhone(eventDetails.getVendorPhone());
            }
            if (eventDetails.getEventTime() != null) {
                event.setEventTime(eventDetails.getEventTime());
            }
            Event saved = eventRepository.save(event);
            
            // Audit log event update
            auditLogService.log("EVENT_UPDATED", "EVENT", saved.getId(), 
                "Event updated: " + saved.getName());
            
            return saved;
        }
        throw new RuntimeException("Event not found");
    }

    public void deleteEvent(Long id) {
        Optional<Event> eventOpt = eventRepository.findById(id);
        String eventName = eventOpt.map(Event::getName).orElse("Unknown");
        
        eventRepository.deleteById(id);
        
        // Audit log event deletion
        auditLogService.log("EVENT_DELETED", "EVENT", id, 
            "Event deleted: " + eventName);
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }
    
    /**
     * Reschedule an event (max 2 times)
     * Updates location and/or time and notifies all booked users
     */
    @Transactional
    public Event rescheduleEvent(Long eventId, Long vendorId, LocalDateTime newEventDate, 
                                  LocalTime newEventTime, String newLocation, String reason) {
        Optional<Event> eventOptional = eventRepository.findById(eventId);
        if (!eventOptional.isPresent()) {
            throw new RuntimeException("Event not found");
        }
        
        Event event = eventOptional.get();
        
        // Verify vendor owns this event
        if (!event.getVendorId().equals(vendorId)) {
            throw new RuntimeException("You are not authorized to reschedule this event");
        }
        
        // Check reschedule limit (max 2 times)
        Integer currentCount = event.getRescheduleCount() != null ? event.getRescheduleCount() : 0;
        if (currentCount >= 2) {
            throw new RuntimeException("Event can only be rescheduled a maximum of 2 times. Limit reached.");
        }
        
        // Store old values for notification
        LocalDateTime oldEventDate = event.getEventDate();
        LocalTime oldEventTime = event.getEventTime();
        String oldLocation = event.getLocation();
        
        // Update event
        if (newEventDate != null) {
            event.setEventDate(newEventDate);
        }
        if (newEventTime != null) {
            event.setEventTime(newEventTime);
        }
        if (newLocation != null && !newLocation.isEmpty()) {
            event.setLocation(newLocation);
        }
        
        // Update reschedule tracking
        event.setRescheduleCount(currentCount + 1);
        event.setWasRescheduled(true);
        event.setLastRescheduledAt(LocalDateTime.now());
        event.setRescheduleReason(reason);
        
        Event savedEvent = eventRepository.save(event);
        
        // Notify all booked users
        notifyBookedUsersOfReschedule(eventId, event.getName(), oldEventDate, oldEventTime, 
                                       oldLocation, newEventDate, newEventTime, newLocation, reason);
        
        // Audit log event reschedule
        auditLogService.log("EVENT_RESCHEDULED", "EVENT", savedEvent.getId(), 
            "Event rescheduled: " + savedEvent.getName() + ". Reason: " + reason);
        
        return savedEvent;
    }
    
    /**
     * Cancel an event and refund all booked users 100%
     */
    @Transactional
    public Event cancelEvent(Long eventId, Long vendorId, String reason) {
        Optional<Event> eventOptional = eventRepository.findById(eventId);
        if (!eventOptional.isPresent()) {
            throw new RuntimeException("Event not found");
        }
        
        Event event = eventOptional.get();
        
        // Verify vendor owns this event
        if (!event.getVendorId().equals(vendorId)) {
            throw new RuntimeException("You are not authorized to cancel this event");
        }
        
        // Update event status
        event.setIsCancelled(true);
        event.setIsActive(false);
        event.setCancellationReason(reason);
        event.setCancelledAt(LocalDateTime.now());
        
        Event savedEvent = eventRepository.save(event);
        
        // Refund all booked users 100%
        refundAllBookedUsers(eventId, event.getName(), reason);
        
        // Audit log event cancellation
        auditLogService.log("EVENT_CANCELLED", "EVENT", savedEvent.getId(), 
            "Event cancelled: " + savedEvent.getName() + ". Reason: " + reason);
        
        return savedEvent;
    }
    
    /**
     * Notify all users who booked this event about the reschedule
     */
    private void notifyBookedUsersOfReschedule(Long eventId, String eventName, 
                                                LocalDateTime oldDate, LocalTime oldTime, String oldLocation,
                                                LocalDateTime newDate, LocalTime newTime, String newLocation,
                                                String reason) {
        try {
            List<Booking> bookings = bookingRepository.findByEventId(eventId);
            
            for (Booking booking : bookings) {
                if (!"CANCELLED".equals(booking.getStatus())) {
                    Optional<User> userOpt = userRepository.findById(booking.getUserId());
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        String userName = user.getFirstName() != null ? user.getFirstName() : user.getUsername();
                        
                        emailService.sendEventRescheduleNotification(
                            user.getEmail(),
                            userName,
                            eventName,
                            oldDate != null ? oldDate.toString() : "N/A",
                            oldTime != null ? oldTime.toString() : "N/A",
                            oldLocation,
                            newDate != null ? newDate.toString() : "N/A",
                            newTime != null ? newTime.toString() : "N/A",
                            newLocation != null ? newLocation : oldLocation,
                            reason
                        );
                        
                        System.out.println("[EMAIL] Sent reschedule notification to: " + user.getEmail());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[EMAIL] Failed to send reschedule notifications: " + e.getMessage());
        }
    }
    
    /**
     * Refund all booked users 100% when event is cancelled
     */
    private void refundAllBookedUsers(Long eventId, String eventName, String reason) {
        try {
            List<Booking> bookings = bookingRepository.findByEventId(eventId);
            
            for (Booking booking : bookings) {
                if (!"CANCELLED".equals(booking.getStatus())) {
                    // Refund 100% of points
                    if (booking.getPointsUsed() != null && booking.getPointsUsed() > 0) {
                        pointsService.refundPoints(
                            booking.getUserId(),
                            booking.getPointsUsed().longValue(),
                            "Event cancelled by vendor: " + reason,
                            booking.getId()
                        );
                    }
                    
                    // Update booking status
                    booking.setStatus("CANCELLED");
                    booking.setCancelledAt(LocalDateTime.now());
                    booking.setRefundPercentage(100);
                    booking.setRefundAmount(booking.getTotalAmount());
                    bookingRepository.save(booking);
                    
                    // Send cancellation email
                    Optional<User> userOpt = userRepository.findById(booking.getUserId());
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        String userName = user.getFirstName() != null ? user.getFirstName() : user.getUsername();
                        
                        emailService.sendEventCancellationNotification(
                            user.getEmail(),
                            userName,
                            eventName,
                            reason,
                            booking.getPointsUsed() != null ? booking.getPointsUsed() : 0
                        );
                        
                        System.out.println("[EMAIL] Sent cancellation notification to: " + user.getEmail());
                    }
                    
                    // Restore ticket count
                    Integer quantity = booking.getQuantity() != null ? booking.getQuantity() : 1;
                    Optional<Event> eventOpt = eventRepository.findById(eventId);
                    if (eventOpt.isPresent()) {
                        Event event = eventOpt.get();
                        event.setTicketsAvailable(event.getTicketsAvailable() + quantity);
                        eventRepository.save(event);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[REFUND] Failed to refund users: " + e.getMessage());
            throw new RuntimeException("Failed to process refunds: " + e.getMessage());
        }
    }
    
    /**
     * Get event with vendor business info (for user display)
     * Returns EventDTO with vendor businessName, businessPhone, and email
     */
    public com.eventvenue.dto.EventDTO getEventWithVendorInfo(Event event) {
        Vendor vendor = null;
        if (event.getVendorId() != null) {
            Optional<Vendor> vendorOpt = vendorRepository.findById(event.getVendorId());
            vendor = vendorOpt.orElse(null);
        }
        return com.eventvenue.dto.EventDTO.fromEvent(event, vendor);
    }
}

