package com.eventvenue.controller;

import com.eventvenue.dto.ApiResponse;
import com.eventvenue.entity.Event;
import com.eventvenue.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8000"})
public class EventController {

    @Autowired
    private EventService eventService;

    @PostMapping
    public ResponseEntity<ApiResponse> createEvent(@RequestBody Event event, Authentication authentication) {
        try {
            Long vendorId = Long.parseLong(authentication.getPrincipal().toString());
            event.setVendorId(vendorId);
            Event createdEvent = eventService.createEvent(event);
            
            System.out.println("[pranai] Event created successfully: " + createdEvent.getId());
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Event created successfully")
                    .data(createdEvent)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error creating event: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getEvent(@PathVariable Long id) {
        try {
            Optional<Event> eventOptional = eventService.getEventById(id);
            
            if (eventOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("Event not found")
                        .build());
            }

            // Get event with vendor info for user display
            Event event = eventOptional.get();
            com.eventvenue.dto.EventDTO eventDTO = eventService.getEventWithVendorInfo(event);

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Event retrieved successfully")
                    .data(eventDTO)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllEvents() {
        try {
            List<Event> events = eventService.getAllEvents();
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Events retrieved successfully")
                    .data(events)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse> getActiveEvents() {
        try {
            List<Event> events = eventService.getActiveEvents();
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Active events retrieved successfully")
                    .data(events)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/vendor/my-events")
    public ResponseEntity<ApiResponse> getMyEvents(Authentication authentication) {
        try {
            Long vendorId = Long.parseLong(authentication.getPrincipal().toString());
            List<Event> events = eventService.getEventsByVendor(vendorId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Your events retrieved successfully")
                    .data(events)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error getting vendor events: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateEvent(@PathVariable Long id, @RequestBody Event eventDetails) {
        System.out.println("[pranai] EventController.updateEvent called for event ID: " + id);
        try {
            Event updatedEvent = eventService.updateEvent(id, eventDetails);
            
            System.out.println("[pranai] Event updated successfully: " + id);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Event updated successfully")
                    .data(updatedEvent)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error updating event: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteEvent(@PathVariable Long id) {
        try {
            eventService.deleteEvent(id);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Event deleted successfully")
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error deleting event: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<ApiResponse> publishEvent(@PathVariable Long id) {
        try {
            Event event = eventService.getEventById(id)
                    .orElseThrow(() -> new RuntimeException("Event not found"));
            
            event.setIsActive(true);
            Event updatedEvent = eventService.updateEvent(id, event);
            
            System.out.println("[pranai] Event published successfully: " + id);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Event published successfully")
                    .data(updatedEvent)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error publishing event: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse> unpublishEvent(@PathVariable Long id) {
        try {
            Event event = eventService.getEventById(id)
                    .orElseThrow(() -> new RuntimeException("Event not found"));
            
            event.setIsActive(false);
            Event updatedEvent = eventService.updateEvent(id, event);
            
            System.out.println("[pranai] Event unpublished successfully: " + id);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Event unpublished successfully")
                    .data(updatedEvent)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error unpublishing event: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Reschedule an event - max 2 times allowed
     * Notifies all booked users via email
     */
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<ApiResponse> rescheduleEvent(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            Long vendorId = Long.parseLong(authentication.getPrincipal().toString());
            
            // Parse request parameters
            LocalDateTime newEventDate = request.get("newEventDate") != null 
                ? LocalDateTime.parse(request.get("newEventDate").toString()) : null;
            LocalTime newEventTime = request.get("newEventTime") != null 
                ? LocalTime.parse(request.get("newEventTime").toString()) : null;
            String newLocation = request.get("newLocation") != null 
                ? request.get("newLocation").toString() : null;
            String reason = request.get("reason") != null 
                ? request.get("reason").toString() : "No reason provided";
            
            Event rescheduledEvent = eventService.rescheduleEvent(
                id, vendorId, newEventDate, newEventTime, newLocation, reason
            );
            
            System.out.println("[pranai] Event rescheduled successfully: " + id + 
                ", Count: " + rescheduledEvent.getRescheduleCount());
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Event rescheduled successfully. All booked users have been notified.")
                    .data(rescheduledEvent)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error rescheduling event: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Cancel an event - refunds all users 100%
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse> cancelEvent(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            Long vendorId = Long.parseLong(authentication.getPrincipal().toString());
            String reason = request.getOrDefault("reason", "No reason provided");
            
            Event cancelledEvent = eventService.cancelEvent(id, vendorId, reason);
            
            System.out.println("[pranai] Event cancelled successfully: " + id);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Event cancelled successfully. All booked users have been refunded 100%.")
                    .data(cancelledEvent)
                    .build());
        } catch (Exception e) {
            System.out.println("[pranai] Error cancelling event: " + e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}

