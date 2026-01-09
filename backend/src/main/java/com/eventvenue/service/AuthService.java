package com.eventvenue.service;

import com.eventvenue.dto.AuthResponse;
import com.eventvenue.dto.SignupRequest;
import com.eventvenue.entity.User;
import com.eventvenue.entity.Vendor;
import com.eventvenue.entity.AdminUser;
import com.eventvenue.repository.UserRepository;
import com.eventvenue.repository.VendorRepository;
import com.eventvenue.repository.AdminUserRepository;
import com.eventvenue.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse userSignup(SignupRequest request) {
        // Check if email already registered as USER (allow same email for different roles)
        if (userRepository.existsByEmailAndRole(request.getEmail(), "USER")) {
            throw new RuntimeException("Email already registered as a user");
        }

        String username = request.getUsername();
        if (username == null || username.isEmpty()) {
            username = request.getEmail().split("@")[0];
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .username(username)  // Added username field
                .role("USER")
                .points(2000L)
                .isVerified(false)
                .build();

        user = userRepository.save(user);
        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), "USER");

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role("USER")
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())  // Added username to response
                .points(2000L)
                .isVerified(false)
                .message("User registered successfully. Please login with your email")
                .build();
    }

    @Transactional
    public AuthResponse vendorSignup(SignupRequest request) {
        // Check if email already registered as VENDOR (allow same email for different roles)
        if (vendorRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered as a vendor");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role("VENDOR")
                .points(200L)  // Vendors get 200 welcome points
                .isVerified(false)
                .build();

        user = userRepository.save(user);

        Vendor vendor = Vendor.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .businessName(request.getBusinessName())
                .description(request.getBusinessDescription())
                .status("PENDING")
                .isActive(true)
                .points(200L)  // Also set on vendor entity
                .build();

        vendorRepository.save(vendor);

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), "VENDOR");

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role("VENDOR")
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .businessName(vendor.getBusinessName())
                .businessDescription(vendor.getDescription())
                .points(200L)  // Include points in response
                .message("Vendor registered successfully. You received 200 welcome points!")
                .build();
    }

    @Transactional
    public AuthResponse createFirstAdmin(SignupRequest request) {
        long adminCount = adminUserRepository.count();
        if (adminCount > 0) {
            throw new RuntimeException("Admin already exists");
        }

        // Check if email already registered as ADMIN (allow same email for different roles)
        if (adminUserRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered as an admin");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role("ADMIN")
                .points(0L)
                .isVerified(true)
                .build();

        user = userRepository.save(user);

        AdminUser adminUser = AdminUser.builder()
                .email(user.getEmail())
                .password(user.getPassword())
                .name(request.getFirstName() + " " + request.getLastName())
                .role("ADMIN")
                .isActive(true)
                .build();

        adminUserRepository.save(adminUser);

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), "ADMIN");

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role("ADMIN")
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .message("Admin created successfully")
                .build();
    }
}
