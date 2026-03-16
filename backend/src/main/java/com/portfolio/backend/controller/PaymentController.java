package com.portfolio.backend.controller;

import com.portfolio.backend.model.User;
import com.portfolio.backend.repository.UserRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Razorpay payment flow:
 *  1. POST /api/payment/create-order  → returns { orderId, amount, currency, keyId }
 *  2. Frontend opens Razorpay checkout with those params
 *  3. On success, frontend calls POST /api/payment/verify  → unlocks version
 */
@RestController
@RequestMapping("/api/payment")
@CrossOrigin("*")
public class PaymentController {

    private final UserRepository userRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    public PaymentController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ─── CREATE ORDER ────────────────────────────────────────────────────
    // POST /api/payment/create-order
    // Body: { "version": 1 }  or  { "version": 2 }
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        int version = ((Number) body.getOrDefault("version", 1)).intValue();
        // Premium 1 = ₹50 (5000 paise), Premium 2 = ₹100 (10000 paise)
        int amountPaise = version == 2 ? 10000 : 5000;

        try {
            // Build Razorpay order via their REST API
            String credentials = razorpayKeyId + ":" + razorpayKeySecret;
            String basicAuth = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "portfolio_v" + version + "_" + System.currentTimeMillis());

            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.razorpay.com/v1/orders"))
                    .header("Authorization", "Basic " + basicAuth)
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(orderRequest.toString()))
                    .build();

            java.net.http.HttpResponse<String> resp =
                    client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());

            JSONObject rzpOrder = new JSONObject(resp.body());

            Map<String, Object> result = new HashMap<>();
            result.put("orderId", rzpOrder.getString("id"));
            result.put("amount", amountPaise);
            result.put("currency", "INR");
            result.put("keyId", razorpayKeyId);
            result.put("version", version);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Order creation failed: " + e.getMessage());
        }
    }

    // ─── VERIFY PAYMENT & UNLOCK VERSION ────────────────────────────────
    // POST /api/payment/verify
    // Body: { "razorpay_order_id", "razorpay_payment_id", "razorpay_signature", "version" }
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> body) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        String orderId    = body.get("razorpay_order_id");
        String paymentId  = body.get("razorpay_payment_id");
        String signature  = body.get("razorpay_signature");
        int version       = Integer.parseInt(body.getOrDefault("version", "1"));

        if (orderId == null || paymentId == null || signature == null) {
            return ResponseEntity.badRequest().body("Missing payment fields");
        }

        try {
            // ─── Verify HMAC-SHA256 signature ───────────────────────────
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexHash = new StringBuilder();
            for (byte b : hash) hexHash.append(String.format("%02x", b));

            if (!hexHash.toString().equals(signature)) {
                return ResponseEntity.status(400).body("Payment verification failed");
            }

            // ─── Unlock version in DB ────────────────────────────────────
            String username = auth.getName();
            User user = userRepository.findByUsernameIgnoreCase(username.toLowerCase())
                    .orElse(null);

            if (user == null) {
                return ResponseEntity.status(404).body("User not found");
            }

            if (version == 1) {
                user.setHasPremium1(true);
            } else if (version == 2) {
                user.setHasPremium2(true);
            }

            userRepository.save(user);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("version", version);
            result.put("hasPremium1", user.isHasPremium1());
            result.put("hasPremium2", user.isHasPremium2());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Verification error: " + e.getMessage());
        }
    }

    // ─── CHECK STATUS (used on load to know which versions are unlocked) ─
    // GET /api/payment/status
    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        User user = userRepository.findByUsernameIgnoreCase(auth.getName().toLowerCase())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("hasPremium1", user.isHasPremium1());
        result.put("hasPremium2", user.isHasPremium2());
        return ResponseEntity.ok(result);
    }
}