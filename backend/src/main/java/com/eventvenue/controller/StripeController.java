package com.eventvenue.controller;

import com.eventvenue.service.StripePaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8000"})
public class StripeController {

    private final StripePaymentService stripePaymentService;

    public StripeController(StripePaymentService stripePaymentService) {
        this.stripePaymentService = stripePaymentService;
    }

    /**
     * Create payment intent for credit purchase
     * POST /api/stripe/create-payment-intent
     * Body: { "userId": 1, "amountUsd": 50.00 }
     */
    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            BigDecimal amountUsd = new BigDecimal(request.get("amountUsd").toString());

            if (amountUsd.compareTo(BigDecimal.ZERO) <= 0) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Amount must be greater than 0");
                return ResponseEntity.badRequest().body(error);
            }

            Map<String, String> response = stripePaymentService.createPaymentIntent(userId, amountUsd);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Confirm payment and credit points
     * POST /api/stripe/confirm-payment
     * Body: { "paymentIntentId": "pi_xxx" }
     */
    @PostMapping("/confirm-payment")
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, String> request) {
        try {
            String paymentIntentId = request.get("paymentIntentId");
            
            if (paymentIntentId == null || paymentIntentId.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Payment intent ID is required");
                return ResponseEntity.badRequest().body(error);
            }

            Map<String, Object> response = stripePaymentService.confirmPayment(paymentIntentId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Get conversion ratio
     * GET /api/stripe/conversion-ratio
     */
    @GetMapping("/conversion-ratio")
    public ResponseEntity<?> getConversionRatio() {
        try {
            Map<String, Object> response = stripePaymentService.getConversionRatio();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Calculate points from USD
     * GET /api/stripe/calculate-points?amount=50.00
     */
    @GetMapping("/calculate-points")
    public ResponseEntity<?> calculatePoints(@RequestParam BigDecimal amount) {
        try {
            Integer points = stripePaymentService.calculatePointsFromUsd(amount);
            Map<String, Object> response = new HashMap<>();
            response.put("amountUsd", amount);
            response.put("points", points);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Calculate USD from points
     * GET /api/stripe/calculate-usd?points=5000
     */
    @GetMapping("/calculate-usd")
    public ResponseEntity<?> calculateUsd(@RequestParam Integer points) {
        try {
            BigDecimal amountUsd = stripePaymentService.calculateUsdFromPoints(points);
            Map<String, Object> response = new HashMap<>();
            response.put("points", points);
            response.put("amountUsd", amountUsd);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    /**
     * Create payment intent for vendor credit purchase
     * POST /api/stripe/vendor/create-payment-intent
     * Body: { "vendorId": 1, "amountUsd": 50.00 }
     */
    @PostMapping("/vendor/create-payment-intent")
    public ResponseEntity<?> createVendorPaymentIntent(@RequestBody Map<String, Object> request) {
        try {
            Long vendorId = Long.valueOf(request.get("vendorId").toString());
            BigDecimal amountUsd = new BigDecimal(request.get("amountUsd").toString());

            if (amountUsd.compareTo(BigDecimal.ZERO) <= 0) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Amount must be greater than 0");
                return ResponseEntity.badRequest().body(error);
            }

            // Use vendor-specific payment intent creation
            Map<String, String> response = stripePaymentService.createVendorPaymentIntent(vendorId, amountUsd);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Confirm vendor payment and credit points
     * POST /api/stripe/vendor/confirm-payment
     * Body: { "paymentIntentId": "pi_xxx", "vendorId": 1 }
     */
    @PostMapping("/vendor/confirm-payment")
    public ResponseEntity<?> confirmVendorPayment(@RequestBody Map<String, Object> request) {
        try {
            String paymentIntentId = request.get("paymentIntentId").toString();
            
            if (paymentIntentId == null || paymentIntentId.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Payment intent ID is required");
                return ResponseEntity.badRequest().body(error);
            }

            Map<String, Object> response = stripePaymentService.confirmVendorPayment(paymentIntentId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}

