package com.eventvenue.controller;

import com.eventvenue.entity.CreditRequest;
import com.eventvenue.service.CreditRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/credit-requests")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8000"})
public class CreditRequestController {

    private final CreditRequestService creditRequestService;

    public CreditRequestController(CreditRequestService creditRequestService) {
        this.creditRequestService = creditRequestService;
    }

    /**
     * Submit a credit request
     * POST /api/credit-requests/submit
     * Body: { "userId": 1, "pointsRequested": 5000, "reason": "Need credits for event booking" }
     */
    @PostMapping("/submit")
    public ResponseEntity<?> submitRequest(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("[CreditRequest] Received request: " + request);
            
            Long userId = Long.valueOf(request.get("userId").toString());
            Integer pointsRequested = Integer.valueOf(request.get("pointsRequested").toString());
            String reason = request.get("reason").toString();

            System.out.println("[CreditRequest] userId: " + userId + ", points: " + pointsRequested + ", reason: " + reason);

            if (pointsRequested <= 0) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Points requested must be greater than 0");
                return ResponseEntity.badRequest().body(error);
            }

            if (reason == null || reason.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Reason is required");
                return ResponseEntity.badRequest().body(error);
            }

            CreditRequest creditRequest = creditRequestService.submitRequest(userId, pointsRequested, reason);
            System.out.println("[CreditRequest] Request saved with ID: " + creditRequest.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Credit request submitted successfully");
            response.put("request", creditRequest);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get user's credit requests
     * GET /api/credit-requests/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserRequests(@PathVariable Long userId) {
        try {
            System.out.println("[CreditRequest] GET /user/" + userId + " called");
            List<CreditRequest> requests = creditRequestService.getUserRequests(userId);
            System.out.println("[CreditRequest] Found " + requests.size() + " requests for user " + userId);
            for (CreditRequest r : requests) {
                System.out.println("[CreditRequest]   - ID: " + r.getId() + ", Points: " + r.getPointsRequested() + ", Status: " + r.getStatus());
            }
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            System.out.println("[CreditRequest] ERROR: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get all pending requests (admin)
     * GET /api/credit-requests/admin/pending
     */
    @GetMapping("/admin/pending")
    public ResponseEntity<?> getPendingRequests() {
        try {
            List<CreditRequest> requests = creditRequestService.getPendingRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get all requests (admin)
     * GET /api/credit-requests/admin/all
     */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllRequests() {
        try {
            List<CreditRequest> requests = creditRequestService.getAllRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Approve a credit request (admin)
     * POST /api/credit-requests/admin/approve/{requestId}
     * Body: { "adminId": 1, "notes": "Approved for legitimate reason" }
     */
    @PostMapping("/admin/approve/{requestId}")
    public ResponseEntity<?> approveRequest(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> request) {
        try {
            Long adminId = Long.valueOf(request.get("adminId").toString());
            String notes = request.getOrDefault("notes", "").toString();

            CreditRequest creditRequest = creditRequestService.approveRequest(requestId, adminId, notes);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Credit request approved and points credited");
            response.put("request", creditRequest);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Reject a credit request (admin)
     * POST /api/credit-requests/admin/reject/{requestId}
     * Body: { "adminId": 1, "notes": "Insufficient justification" }
     */
    @PostMapping("/admin/reject/{requestId}")
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> request) {
        try {
            Long adminId = Long.valueOf(request.get("adminId").toString());
            String notes = request.getOrDefault("notes", "").toString();

            CreditRequest creditRequest = creditRequestService.rejectRequest(requestId, adminId, notes);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Credit request rejected");
            response.put("request", creditRequest);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
