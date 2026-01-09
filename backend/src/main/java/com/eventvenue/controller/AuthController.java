package com.eventvenue.controller;

import com.eventvenue.dto.AuthRequest;
import com.eventvenue.dto.AuthResponse;
import com.eventvenue.dto.ApiResponse;
import com.eventvenue.dto.SignupRequest;
import com.eventvenue.dto.OtpRequest;
import com.eventvenue.dto.OtpVerifyRequest;
import com.eventvenue.entity.User;
import com.eventvenue.entity.Vendor;
import com.eventvenue.entity.AdminUser;
import com.eventvenue.security.JwtTokenProvider;
import com.eventvenue.service.UserService;
import com.eventvenue.service.VendorService;
import com.eventvenue.service.AdminUserService;
import com.eventvenue.service.OtpService;
import com.eventvenue.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8000"})
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OtpService otpService;
    
    @Autowired
    private EmailService emailService;

    // USER AUTHENTICATION
    @PostMapping("/user/signup")
    public ResponseEntity<ApiResponse> userSignup(@RequestBody SignupRequest request) {
        try {
            AuthResponse authResponse = userService.registerUserResponse(
                request.getEmail(), 
                request.getPassword(), 
                request.getFirstName(),
                request.getLastName(),
                request.getPhone(),
                request.getUsername()
            );
            
            otpService.sendOtp(request.getEmail(), "USER");
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("User registered. Please verify OTP sent to your email")
                    .data(authResponse)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/user/login")
    public ResponseEntity<ApiResponse> userLogin(@RequestBody AuthRequest request) {
        try {
            // Find user by email AND role to support same email with different roles
            Optional<User> userOptional = userService.findByEmailAndRole(request.getEmail(), "USER");
            
            if (userOptional.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOptional.get().getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.builder()
                        .success(false)
                        .message("Invalid email or password")
                        .build());
            }

            User user = userOptional.get();
            
            if (!user.getIsVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.builder()
                        .success(false)
                        .message("Please verify your email first")
                        .build());
            }
            
            String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
            
            AuthResponse authResponse = AuthResponse.builder()
                    .token(token)
                    .role(user.getRole())
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .points(user.getPoints())
                    .isVerified(user.getIsVerified())
                    .message("Login successful")
                    .build();

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Login successful")
                    .data(authResponse)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    // VENDOR AUTHENTICATION
    @PostMapping("/vendor/signup")
    public ResponseEntity<ApiResponse> vendorSignup(@RequestBody SignupRequest request) {
        try {
            AuthResponse authResponse = vendorService.registerVendorResponse(request);
            
            otpService.sendOtp(request.getEmail(), "VENDOR");
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Vendor registered. Please verify OTP sent to your email")
                    .data(authResponse)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/vendor/login")
    public ResponseEntity<ApiResponse> vendorLogin(@RequestBody AuthRequest request) {
        try {
            Optional<Vendor> vendorOptional = vendorService.findByEmail(request.getEmail());
            
            if (vendorOptional.isEmpty() || !passwordEncoder.matches(request.getPassword(), vendorOptional.get().getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.builder()
                        .success(false)
                        .message("Invalid email or password")
                        .build());
            }

            Vendor vendor = vendorOptional.get();
            
            if (!vendor.getIsVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.builder()
                        .success(false)
                        .message("Please verify your email first")
                        .build());
            }
            
            if (!vendor.getStatus().equals("APPROVED")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.builder()
                        .success(false)
                        .message("Your vendor account is " + vendor.getStatus().toLowerCase() + ". Please wait for admin approval")
                        .build());
            }

            String token = jwtTokenProvider.generateToken(vendor.getId(), vendor.getEmail(), "VENDOR");
            
            AuthResponse authResponse = AuthResponse.builder()
                    .token(token)
                    .role("VENDOR")
                    .userId(vendor.getId())
                    .email(vendor.getEmail())
                    .firstName(vendor.getUsername())
                    .businessName(vendor.getBusinessName())
                    .businessDescription(vendor.getDescription())
                    .message("Login successful")
                    .build();

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Login successful")
                    .data(authResponse)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    // OTP VERIFICATION
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(@RequestBody OtpVerifyRequest request) {
        try {
            boolean isValid = otpService.verifyOtp(request.getEmail(), request.getOtp(), request.getRole());
            
            if (!isValid) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("Invalid or expired OTP")
                        .build());
            }

            // Mark user/vendor as verified
            if ("USER".equals(request.getRole())) {
                Optional<User> userOpt = userService.findByEmailAndRole(request.getEmail(), "USER");
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    user.setIsVerified(true);
                    userService.updateUser(user);
                    
                    // Generate token
                    String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
                    AuthResponse authResponse = AuthResponse.builder()
                            .token(token)
                            .role(user.getRole())
                            .userId(user.getId())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .firstName(user.getFirstName())
                            .points(user.getPoints())
                            .isVerified(true)
                            .message("Account verified successfully")
                            .build();
                    
                    return ResponseEntity.ok(ApiResponse.builder()
                            .success(true)
                            .message("Account verified successfully")
                            .data(authResponse)
                            .build());
                }
            } else if ("VENDOR".equals(request.getRole())) {
                Optional<Vendor> vendorOpt = vendorService.findByEmail(request.getEmail());
                if (vendorOpt.isPresent()) {
                    Vendor vendor = vendorOpt.get();
                    vendor.setIsVerified(true);
                    vendorService.updateVendor(vendor);
                    
                    // Send vendor verification success email
                    emailService.sendVendorVerificationSuccess(vendor.getEmail(), vendor.getBusinessName());
                    System.out.println("[EventVenue] Vendor verification success email sent to: " + vendor.getEmail());
                    
                    // Generate token even though vendor is awaiting approval
                    String token = jwtTokenProvider.generateToken(vendor.getId(), vendor.getEmail(), "VENDOR");
                    AuthResponse authResponse = AuthResponse.builder()
                            .token(token)
                            .role("VENDOR")
                            .userId(vendor.getId())
                            .email(vendor.getEmail())
                            .firstName(vendor.getUsername())
                            .businessName(vendor.getBusinessName())
                            .businessDescription(vendor.getDescription())
                            .message("Vendor account verified. Awaiting admin approval")
                            .build();
                    
                    return ResponseEntity.ok(ApiResponse.builder()
                            .success(true)
                            .message("Vendor account verified. Awaiting admin approval")
                            .data(authResponse)
                            .build());
                }
            }
            
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message("User not found")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    // RESEND OTP
    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse> resendOtp(@RequestBody OtpRequest request) {
        try {
            otpService.sendOtp(request.getEmail(), request.getRole());
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("OTP sent successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    // ADMIN AUTHENTICATION
    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse> adminLogin(@RequestBody AuthRequest request) {
        try {
            Optional<AdminUser> adminOptional = adminUserService.findByEmail(request.getEmail());
            
            if (adminOptional.isEmpty() || !passwordEncoder.matches(request.getPassword(), adminOptional.get().getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.builder()
                        .success(false)
                        .message("Invalid email or password")
                        .build());
            }

            AdminUser admin = adminOptional.get();
            String token = jwtTokenProvider.generateToken(admin.getId(), admin.getEmail(), "ADMIN");
            
            AuthResponse authResponse = AuthResponse.builder()
                    .token(token)
                    .role("ADMIN")
                    .userId(admin.getId())
                    .email(admin.getEmail())
                    .firstName(admin.getName())
                    .message("Login successful")
                    .build();

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Login successful")
                    .data(authResponse)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    // ADMIN CREATE NEW ADMIN
    @PostMapping("/admin/create-admin")
    public ResponseEntity<ApiResponse> createAdmin(@RequestBody AuthRequest request) {
        try {
            AdminUser admin = adminUserService.createAdmin(
                request.getEmail(), 
                request.getPassword(), 
                request.getFirstName() + " " + request.getLastName()
            );
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Admin created successfully")
                    .data(admin)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}
