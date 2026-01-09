package com.eventvenue.controller;

import com.eventvenue.dto.ApiResponse;
import com.eventvenue.entity.User;
import com.eventvenue.entity.PointHistory;
import com.eventvenue.service.UserService;
import com.eventvenue.service.PointsService;
import com.eventvenue.repository.PointHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8000"})
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private PointHistoryRepository pointHistoryRepository;
    
    @Autowired
    private PointsService pointsService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse> getUserProfile(Authentication authentication) {
        try {
            Long userId = Long.parseLong(authentication.getPrincipal().toString());
            
            Optional<User> userOptional = userService.findById(userId);
            
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("User not found")
                        .build());
            }

            User user = userOptional.get();

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("User profile retrieved successfully")
                    .data(user)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse> updateUserProfile(Authentication authentication, @RequestBody User userDetails) {
        try {
            Long userId = Long.parseLong(authentication.getPrincipal().toString());
            User updatedUser = userService.updateUser(userId, userDetails);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("User profile updated successfully")
                    .data(updatedUser)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/points/history")
    public ResponseEntity<ApiResponse> getPointsHistory(Authentication authentication) {
        try {
            Long userId = Long.parseLong(authentication.getPrincipal().toString());
            List<PointHistory> history = pointHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Points history retrieved successfully")
                    .data(history)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/points/{userId}")
    public ResponseEntity<ApiResponse> getUserPoints(@PathVariable Long userId) {
        try {
            Optional<User> userOptional = userService.findById(userId);
            
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("User not found")
                        .build());
            }

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("User points retrieved")
                    .data(userOptional.get().getPoints())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    @PostMapping("/points/purchase")
    public ResponseEntity<ApiResponse> purchasePoints(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            Long userId = Long.parseLong(authentication.getPrincipal().toString());
            Long points = Long.parseLong(request.get("points").toString());
            String paymentMethod = request.getOrDefault("paymentMethod", "PAYPAL").toString();
            String transactionId = request.getOrDefault("transactionId", "").toString();
            
            User updatedUser = pointsService.purchasePoints(userId, points, paymentMethod, transactionId);
            
            Map<String, Object> data = new HashMap<>();
            data.put("points", updatedUser.getPoints());
            data.put("pointsPurchased", points);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Points purchased successfully")
                    .data(data)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}
