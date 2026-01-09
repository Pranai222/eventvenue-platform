package com.eventvenue.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import com.eventvenue.entity.CreditTransaction;
import com.eventvenue.entity.User;
import com.eventvenue.entity.Vendor;
import com.eventvenue.repository.CreditTransactionRepository;
import com.eventvenue.repository.UserRepository;
import com.eventvenue.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@Service
public class StripePaymentService {

    @Value("${stripe.api.secret-key:}")
    private String stripeSecretKey;

    @Value("${points.to.dollar.ratio:0.01}")
    private BigDecimal pointsToDollarRatio;

    private final CreditTransactionRepository creditTransactionRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;

    public StripePaymentService(
            CreditTransactionRepository creditTransactionRepository,
            UserRepository userRepository,
            VendorRepository vendorRepository) {
        this.creditTransactionRepository = creditTransactionRepository;
        this.userRepository = userRepository;
        this.vendorRepository = vendorRepository;
    }

    /**
     * Create a Stripe Payment Intent for credit purchase
     * @param userId User making the purchase
     * @param amountUsd Amount in USD
     * @return Map with client_secret and payment_intent_id
     */
    public Map<String, String> createPaymentIntent(Long userId, BigDecimal amountUsd) throws StripeException {
        Stripe.apiKey = stripeSecretKey;

        // Calculate points to be credited
        Integer pointsAmount = calculatePointsFromUsd(amountUsd);

        // Amount in cents (Stripe requires smallest currency unit)
        long amountInCents = amountUsd.multiply(new BigDecimal("100")).longValue();

        // Create payment intent with metadata
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency("usd")
                .addPaymentMethodType("card")
                .putMetadata("user_id", String.valueOf(userId))
                .putMetadata("points_amount", String.valueOf(pointsAmount))
                .putMetadata("transaction_type", "credit_purchase")
                .setDescription("Credit purchase - " + pointsAmount + " points")
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);

        // Create pending transaction record
        CreditTransaction transaction = CreditTransaction.createPurchase(
                userId, amountUsd, pointsAmount, paymentIntent.getId()
        );
        creditTransactionRepository.save(transaction);

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", paymentIntent.getClientSecret());
        response.put("paymentIntentId", paymentIntent.getId());
        response.put("pointsAmount", String.valueOf(pointsAmount));

        return response;
    }

    /**
     * Confirm payment and credit points to user
     * @param paymentIntentId Stripe payment intent ID
     * @return Success status
     */
    @Transactional
    public Map<String, Object> confirmPayment(String paymentIntentId) throws Exception {
        Stripe.apiKey = stripeSecretKey;

        // Retrieve payment intent from Stripe
        PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

        // Find transaction record
        CreditTransaction transaction = creditTransactionRepository
                .findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new Exception("Transaction not found for payment intent: " + paymentIntentId));

        // Verify payment succeeded
        if ("succeeded".equals(paymentIntent.getStatus())) {
            // Update transaction status
            transaction.setStatus("COMPLETED");
            creditTransactionRepository.save(transaction);

            // Credit points to user
            User user = userRepository.findById(transaction.getUserId())
                    .orElseThrow(() -> new Exception("User not found: " + transaction.getUserId()));

            Long currentPoints = user.getPoints() != null ? user.getPoints() : 0L;
            user.setPoints(currentPoints + transaction.getPointsAmount());
            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment successful! " + transaction.getPointsAmount() + " points added.");
            response.put("pointsAdded", transaction.getPointsAmount());
            response.put("newBalance", user.getPoints());
            return response;

        } else {
            // Payment failed
            transaction.setStatus("FAILED");
            transaction.setAdminNotes("Payment status: " + paymentIntent.getStatus());
            creditTransactionRepository.save(transaction);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Payment failed or pending. Status: " + paymentIntent.getStatus());
            return response;
        }
    }
    
    /**
     * Create a Stripe Payment Intent for VENDOR credit purchase
     * @param vendorId Vendor making the purchase
     * @param amountUsd Amount in USD
     * @return Map with client_secret and payment_intent_id
     */
    public Map<String, String> createVendorPaymentIntent(Long vendorId, BigDecimal amountUsd) throws StripeException {
        Stripe.apiKey = stripeSecretKey;

        // Calculate points to be credited
        Integer pointsAmount = calculatePointsFromUsd(amountUsd);

        // Amount in cents (Stripe requires smallest currency unit)
        long amountInCents = amountUsd.multiply(new BigDecimal("100")).longValue();

        // Create payment intent with metadata for vendor
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency("usd")
                .addPaymentMethodType("card")
                .putMetadata("vendor_id", String.valueOf(vendorId))
                .putMetadata("points_amount", String.valueOf(pointsAmount))
                .putMetadata("transaction_type", "vendor_credit_purchase")
                .putMetadata("is_vendor", "true")
                .setDescription("Vendor Credit purchase - " + pointsAmount + " points")
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);

        System.out.println("[VENDOR PAYMENT] Created payment intent for vendor " + vendorId + 
            ", amount: " + amountUsd + ", points: " + pointsAmount);

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", paymentIntent.getClientSecret());
        response.put("paymentIntentId", paymentIntent.getId());
        response.put("pointsAmount", String.valueOf(pointsAmount));

        return response;
    }

    /**
     * Confirm vendor payment and credit points to vendor
     * @param paymentIntentId Stripe payment intent ID
     * @return Success status
     */
    @Transactional
    public Map<String, Object> confirmVendorPayment(String paymentIntentId) throws Exception {
        Stripe.apiKey = stripeSecretKey;

        // Retrieve payment intent from Stripe
        PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);

        Map<String, String> metadata = paymentIntent.getMetadata();
        String vendorIdStr = metadata.get("vendor_id");
        String pointsAmountStr = metadata.get("points_amount");

        if (vendorIdStr == null || pointsAmountStr == null) {
            throw new Exception("Invalid vendor payment intent - missing metadata");
        }

        Long vendorId = Long.valueOf(vendorIdStr);
        Integer pointsAmount = Integer.valueOf(pointsAmountStr);

        // Verify payment succeeded
        if ("succeeded".equals(paymentIntent.getStatus())) {
            // Credit points to vendor
            Vendor vendor = vendorRepository.findById(vendorId)
                    .orElseThrow(() -> new Exception("Vendor not found: " + vendorId));

            Long currentPoints = vendor.getPoints() != null ? vendor.getPoints() : 0L;
            vendor.setPoints(currentPoints + pointsAmount);
            vendorRepository.save(vendor);

            System.out.println("[VENDOR PAYMENT] Credited " + pointsAmount + 
                " points to vendor " + vendorId + ", new balance: " + vendor.getPoints());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment successful! " + pointsAmount + " points added.");
            response.put("pointsAdded", pointsAmount);
            response.put("newBalance", vendor.getPoints());
            return response;

        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Payment failed or pending. Status: " + paymentIntent.getStatus());
            return response;
        }
    }

    /**
     * Calculate points from USD amount
     * @param amountUsd Amount in USD
     * @return Points amount
     */
    public Integer calculatePointsFromUsd(BigDecimal amountUsd) {
        // Default: 100 points = $1, so multiply USD by 100
        // If ratio is 0.01, then points = USD / 0.01 = USD * 100
        return amountUsd.divide(pointsToDollarRatio, 0, RoundingMode.HALF_UP).intValue();
    }

    /**
     * Calculate USD from points
     * @param points Points amount
     * @return USD amount
     */
    public BigDecimal calculateUsdFromPoints(Integer points) {
        // Points * ratio = USD
        return new BigDecimal(points).multiply(pointsToDollarRatio).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Get current conversion ratio
     */
    public Map<String, Object> getConversionRatio() {
        Map<String, Object> response = new HashMap<>();
        response.put("ratio", pointsToDollarRatio);
        response.put("pointsPerDollar", calculatePointsFromUsd(BigDecimal.ONE));
        response.put("dollarPerPoint", pointsToDollarRatio);
        return response;
    }
}

