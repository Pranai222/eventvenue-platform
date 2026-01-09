package com.eventvenue.service;

import com.eventvenue.dto.ReviewDTO;
import com.eventvenue.entity.Review;
import com.eventvenue.entity.Venue;
import com.eventvenue.entity.Event;
import com.eventvenue.entity.Booking;
import com.eventvenue.entity.User;
import com.eventvenue.entity.Vendor;
import com.eventvenue.repository.ReviewRepository;
import com.eventvenue.repository.VenueRepository;
import com.eventvenue.repository.EventRepository;
import com.eventvenue.repository.BookingRepository;
import com.eventvenue.repository.UserRepository;
import com.eventvenue.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private VendorRepository vendorRepository;

    // Check if user has booked the venue
    public boolean hasUserBookedVenue(Long userId, Long venueId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        return bookings.stream()
                .anyMatch(b -> venueId.equals(b.getVenueId()) && 
                         ("CONFIRMED".equals(b.getStatus()) || "COMPLETED".equals(b.getStatus())));
    }

    // Check if user has booked the event
    public boolean hasUserBookedEvent(Long userId, Long eventId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        return bookings.stream()
                .anyMatch(b -> eventId.equals(b.getEventId()) && 
                         ("CONFIRMED".equals(b.getStatus()) || "COMPLETED".equals(b.getStatus())));
    }

    // Check if user already reviewed
    public boolean hasUserReviewedVenue(Long userId, Long venueId) {
        return reviewRepository.findByUserIdAndVenueId(userId, venueId).isPresent();
    }

    public boolean hasUserReviewedEvent(Long userId, Long eventId) {
        return reviewRepository.findByUserIdAndEventId(userId, eventId).isPresent();
    }

    public Review createReview(Review review) {
        // Validate booking exists
        if (review.getVenueId() != null) {
            if (!hasUserBookedVenue(review.getUserId(), review.getVenueId())) {
                throw new RuntimeException("You can only review venues you have booked");
            }
            if (hasUserReviewedVenue(review.getUserId(), review.getVenueId())) {
                throw new RuntimeException("You have already reviewed this venue");
            }
        }
        
        if (review.getEventId() != null) {
            if (!hasUserBookedEvent(review.getUserId(), review.getEventId())) {
                throw new RuntimeException("You can only review events you have booked");
            }
            if (hasUserReviewedEvent(review.getUserId(), review.getEventId())) {
                throw new RuntimeException("You have already reviewed this event");
            }
        }
        
        // Validate rating
        if (review.getRating() < 1 || review.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }
        
        Review saved = reviewRepository.save(review);
        
        // Update venue/event rating
        if (review.getVenueId() != null) {
            updateVenueRating(review.getVenueId());
        }
        if (review.getEventId() != null) {
            updateEventRating(review.getEventId());
        }
        
        return saved;
    }

    public Optional<Review> getReviewById(Long id) {
        return reviewRepository.findById(id);
    }

    public List<Review> getVenueReviews(Long venueId) {
        return reviewRepository.findByVenueIdOrderByCreatedAtDesc(venueId);
    }

    public List<Review> getEventReviews(Long eventId) {
        return reviewRepository.findByEventIdOrderByCreatedAtDesc(eventId);
    }

    public List<Review> getUserReviews(Long userId) {
        return reviewRepository.findByUserId(userId);
    }

    // Get all reviews for a vendor's venues and events
    public List<Review> getVendorReviews(Long vendorId) {
        List<Review> allReviews = new ArrayList<>();
        allReviews.addAll(reviewRepository.findVenueReviewsByVendorId(vendorId));
        allReviews.addAll(reviewRepository.findEventReviewsByVendorId(vendorId));
        allReviews.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return allReviews;
    }

    public Double getVenueAverageRating(Long venueId) {
        List<Review> reviews = reviewRepository.findByVenueId(venueId);
        if (reviews.isEmpty()) return 0.0;
        return reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
    }

    public Double getEventAverageRating(Long eventId) {
        List<Review> reviews = reviewRepository.findByEventId(eventId);
        if (reviews.isEmpty()) return 0.0;
        return reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
    }

    // Update review - only owner can update
    public Review updateReviewByOwner(Long userId, Long reviewId, Review reviewDetails) {
        Optional<Review> reviewOptional = reviewRepository.findById(reviewId);
        if (reviewOptional.isEmpty()) {
            throw new RuntimeException("Review not found");
        }
        
        Review review = reviewOptional.get();
        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("You can only edit your own reviews");
        }
        
        if (reviewDetails.getRating() != null) {
            if (reviewDetails.getRating() < 1 || reviewDetails.getRating() > 5) {
                throw new RuntimeException("Rating must be between 1 and 5");
            }
            review.setRating(reviewDetails.getRating());
        }
        if (reviewDetails.getComment() != null) {
            review.setComment(reviewDetails.getComment());
        }
        
        Review updated = reviewRepository.save(review);
        
        // Recalculate ratings
        if (review.getVenueId() != null) {
            updateVenueRating(review.getVenueId());
        }
        if (review.getEventId() != null) {
            updateEventRating(review.getEventId());
        }
        
        return updated;
    }

    // Delete review by owner
    public void deleteReviewByOwner(Long userId, Long reviewId) {
        Optional<Review> reviewOptional = reviewRepository.findById(reviewId);
        if (reviewOptional.isEmpty()) {
            throw new RuntimeException("Review not found");
        }
        
        Review review = reviewOptional.get();
        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own reviews");
        }
        
        reviewRepository.deleteById(reviewId);
        
        // Recalculate ratings
        if (review.getVenueId() != null) {
            updateVenueRating(review.getVenueId());
        }
        if (review.getEventId() != null) {
            updateEventRating(review.getEventId());
        }
    }

    // Vendor can delete reviews for their venues/events
    public void deleteReviewByVendor(Long vendorId, Long reviewId) {
        Optional<Review> reviewOptional = reviewRepository.findById(reviewId);
        if (reviewOptional.isEmpty()) {
            throw new RuntimeException("Review not found");
        }
        
        Review review = reviewOptional.get();
        boolean isVendorOwner = false;
        
        if (review.getVenueId() != null) {
            Optional<Venue> venue = venueRepository.findById(review.getVenueId());
            if (venue.isPresent() && venue.get().getVendorId().equals(vendorId)) {
                isVendorOwner = true;
            }
        }
        
        if (review.getEventId() != null) {
            Optional<Event> event = eventRepository.findById(review.getEventId());
            if (event.isPresent() && event.get().getVendorId().equals(vendorId)) {
                isVendorOwner = true;
            }
        }
        
        if (!isVendorOwner) {
            throw new RuntimeException("You can only delete reviews for your own venues/events");
        }
        
        reviewRepository.deleteById(reviewId);
        
        // Recalculate ratings
        if (review.getVenueId() != null) {
            updateVenueRating(review.getVenueId());
        }
        if (review.getEventId() != null) {
            updateEventRating(review.getEventId());
        }
    }

    // Admin can delete any review
    public void deleteReviewByAdmin(Long reviewId) {
        Optional<Review> reviewOptional = reviewRepository.findById(reviewId);
        if (reviewOptional.isEmpty()) {
            throw new RuntimeException("Review not found");
        }
        
        Review review = reviewOptional.get();
        reviewRepository.deleteById(reviewId);
        
        // Recalculate ratings
        if (review.getVenueId() != null) {
            updateVenueRating(review.getVenueId());
        }
        if (review.getEventId() != null) {
            updateEventRating(review.getEventId());
        }
    }

    private void updateVenueRating(Long venueId) {
        Optional<Venue> venueOptional = venueRepository.findById(venueId);
        if (venueOptional.isPresent()) {
            Double avgRating = getVenueAverageRating(venueId);
            Venue venue = venueOptional.get();
            venue.setRating(avgRating);
            venueRepository.save(venue);
        }
    }

    private void updateEventRating(Long eventId) {
        Optional<Event> eventOptional = eventRepository.findById(eventId);
        if (eventOptional.isPresent()) {
            Double avgRating = getEventAverageRating(eventId);
            List<Review> reviews = reviewRepository.findByEventId(eventId);
            Event event = eventOptional.get();
            event.setRating(avgRating);
            event.setReviewCount(reviews.size());
            eventRepository.save(event);
        }
    }

    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }
    
    // Convert single review to DTO with all details
    public ReviewDTO convertToDTO(Review review) {
        ReviewDTO dto = ReviewDTO.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .userId(review.getUserId())
                .venueId(review.getVenueId())
                .eventId(review.getEventId())
                .build();
        
        // Get user info
        if (review.getUserId() != null) {
            userRepository.findById(review.getUserId()).ifPresent(user -> {
                String userName = user.getFirstName() != null ? 
                    user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : "") :
                    user.getEmail();
                dto.setUserName(userName.trim());
                dto.setUserEmail(user.getEmail());
            });
        }
        
        // Get venue info and vendor
        if (review.getVenueId() != null) {
            venueRepository.findById(review.getVenueId()).ifPresent(venue -> {
                dto.setVenueName(venue.getName());
                dto.setVendorId(venue.getVendorId());
                
                // Get vendor info
                vendorRepository.findById(venue.getVendorId()).ifPresent(vendor -> {
                    dto.setVendorName(vendor.getBusinessName());
                });
            });
        }
        
        // Get event info and vendor
        if (review.getEventId() != null) {
            eventRepository.findById(review.getEventId()).ifPresent(event -> {
                dto.setEventName(event.getName());
                dto.setVendorId(event.getVendorId());
                
                // Get vendor info
                vendorRepository.findById(event.getVendorId()).ifPresent(vendor -> {
                    dto.setVendorName(vendor.getBusinessName());
                });
            });
        }
        
        return dto;
    }
    
    // Get all reviews with detailed info
    public List<ReviewDTO> getAllReviewsDetailed() {
        return reviewRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    // Get vendor reviews with detailed info
    public List<ReviewDTO> getVendorReviewsDetailed(Long vendorId) {
        List<Review> allReviews = getVendorReviews(vendorId);
        return allReviews.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
}
