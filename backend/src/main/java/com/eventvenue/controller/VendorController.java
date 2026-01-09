package com.eventvenue.controller;

import com.eventvenue.dto.ApiResponse;
import com.eventvenue.entity.Vendor;
import com.eventvenue.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/vendor")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8000"})
public class VendorController {

    @Autowired
    private VendorService vendorService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse> getVendorProfile(Authentication authentication) {
        try {
            Long vendorId = Long.parseLong(authentication.getPrincipal().toString());
            Optional<Vendor> vendorOptional = vendorService.findById(vendorId);
            
            if (vendorOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("Vendor not found")
                        .build());
            }

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Vendor profile retrieved successfully")
                    .data(vendorOptional.get())
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse> updateVendorProfile(Authentication authentication, @RequestBody Vendor vendorDetails) {
        try {
            Long vendorId = Long.parseLong(authentication.getPrincipal().toString());
            Vendor updatedVendor = vendorService.updateVendor(vendorId, vendorDetails);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Vendor profile updated successfully")
                    .data(updatedVendor)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/points/purchase")
    public ResponseEntity<ApiResponse> purchaseVendorPoints(
            @RequestBody java.util.Map<String, Object> request,
            Authentication authentication) {
        try {
            Long vendorId = Long.parseLong(authentication.getPrincipal().toString());
            Long points = Long.parseLong(request.get("points").toString());
            String paymentMethod = request.getOrDefault("paymentMethod", "PAYPAL").toString();
            String transactionId = request.getOrDefault("transactionId", "").toString();
            
            Vendor updatedVendor = vendorService.purchasePoints(vendorId, points, paymentMethod, transactionId);
            
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("points", updatedVendor.getPoints());
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

    @GetMapping("/transactions/{vendorId}")
    public ResponseEntity<ApiResponse> getVendorTransactions(
            @PathVariable Long vendorId,
            Authentication authentication) {
        try {
            Long authVendorId = Long.parseLong(authentication.getPrincipal().toString());
            
            // Verify vendor is accessing their own transactions
            if (!authVendorId.equals(vendorId)) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("Unauthorized to view these transactions")
                        .build());
            }
            
            java.util.List<java.util.Map<String, Object>> transactions = vendorService.getVendorTransactions(vendorId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Transactions retrieved successfully")
                    .data(transactions)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}
