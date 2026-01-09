package com.eventvenue.controller;

import com.eventvenue.entity.WithdrawalRequest;
import com.eventvenue.service.WithdrawalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/withdrawals")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8000"})
public class WithdrawalController {

    private final WithdrawalService withdrawalService;

    public WithdrawalController(WithdrawalService withdrawalService) {
        this.withdrawalService = withdrawalService;
    }

    /**
     * Submit a withdrawal request
     * POST /api/withdrawals/submit
     * Body: { "userId": 1, "pointsAmount": 50000 }
     */
    @PostMapping("/submit")
    public ResponseEntity<?> submitWithdrawal(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            Integer pointsAmount = Integer.valueOf(request.get("pointsAmount").toString());
            String paypalEmail = request.getOrDefault("paypalEmail", "").toString();

            if (pointsAmount <= 0) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Points amount must be greater than 0");
                return ResponseEntity.badRequest().body(error);
            }

            System.out.println("[Withdrawal] Submitting withdrawal for userId: " + userId + 
                              ", points: " + pointsAmount + ", PayPal: " + paypalEmail);

            WithdrawalRequest withdrawal = withdrawalService.submitWithdrawal(userId, pointsAmount, paypalEmail);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("withdrawal", withdrawal);
            
            if (withdrawal.getRequiresApproval()) {
                response.put("message", "Withdrawal request submitted. Admin approval required for amounts >= ₹10,000");
            } else {
                response.put("message", "Withdrawal request submitted. Ready to process");
            }
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get user's withdrawal requests
     * GET /api/withdrawals/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserWithdrawals(@PathVariable Long userId) {
        try {
            List<WithdrawalRequest> withdrawals = withdrawalService.getUserWithdrawals(userId);
            return ResponseEntity.ok(withdrawals);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get pending withdrawals requiring approval (admin)
     * GET /api/withdrawals/admin/pending-approvals
     */
    @GetMapping("/admin/pending-approvals")
    public ResponseEntity<?> getPendingApprovals() {
        try {
            List<WithdrawalRequest> withdrawals = withdrawalService.getPendingApprovals();
            return ResponseEntity.ok(withdrawals);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Approve a withdrawal request (admin)
     * POST /api/withdrawals/admin/approve/{withdrawalId}
     * Body: { "adminId": 1, "notes": "Approved" }
     */
    @PostMapping("/admin/approve/{withdrawalId}")
    public ResponseEntity<?> approveWithdrawal(
            @PathVariable Long withdrawalId,
            @RequestBody Map<String, Object> request) {
        try {
            Long adminId = Long.valueOf(request.get("adminId").toString());
            String notes = request.getOrDefault("notes", "").toString();

            WithdrawalRequest withdrawal = withdrawalService.approveWithdrawal(withdrawalId, adminId, notes);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Withdrawal approved. User can now process the withdrawal");
            response.put("withdrawal", withdrawal);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Reject a withdrawal request (admin)
     * POST /api/withdrawals/admin/reject/{withdrawalId}
     * Body: { "adminId": 1, "notes": "Reason for rejection" }
     */
    @PostMapping("/admin/reject/{withdrawalId}")
    public ResponseEntity<?> rejectWithdrawal(
            @PathVariable Long withdrawalId,
            @RequestBody Map<String, Object> request) {
        try {
            Long adminId = Long.valueOf(request.get("adminId").toString());
            String notes = request.getOrDefault("notes", "").toString();

            WithdrawalRequest withdrawal = withdrawalService.rejectWithdrawal(withdrawalId, adminId, notes);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Withdrawal rejected");
            response.put("withdrawal", withdrawal);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Process a withdrawal (deduct points and payout)
     * POST /api/withdrawals/process/{withdrawalId}
     * Body: { "cardLast4": "4242" }
     */
    @PostMapping("/process/{withdrawalId}")
    public ResponseEntity<?> processWithdrawal(
            @PathVariable Long withdrawalId,
            @RequestBody Map<String, String> request) {
        try {
            String cardLast4 = request.getOrDefault("cardLast4", "****");

            WithdrawalRequest withdrawal = withdrawalService.processWithdrawal(withdrawalId, cardLast4);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Withdrawal processed successfully. Funds transferred");
            response.put("withdrawal", withdrawal);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
