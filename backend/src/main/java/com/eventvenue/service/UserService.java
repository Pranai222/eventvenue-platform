package com.eventvenue.service;

import com.eventvenue.dto.AuthResponse;
import com.eventvenue.entity.User;
import com.eventvenue.repository.UserRepository;
import com.eventvenue.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Autowired
    private AuditLogService auditLogService;

    public AuthResponse registerUserResponse(String email, String password, String firstName, String lastName, String phone, String username) {
        // Check if email already registered as USER (allow same email for different roles)
        Optional<User> existingUser = userRepository.findByEmailAndRole(email, "USER");
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // If unverified, delete and allow re-registration
            if (!user.getIsVerified()) {
                userRepository.delete(user);
                System.out.println("[pranai] Deleted unverified user for re-registration: " + email);
            } else {
                throw new RuntimeException("Email already exists as a verified user");
            }
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .firstName(firstName)
                .lastName(lastName)
                .phone(phone)
                .points(2000L)
                .isVerified(false)
                .role("USER")
                .build();

        user = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), "USER");
        
        // Audit log user registration
        auditLogService.log("USER_REGISTERED", "USER", user.getId(), 
            "New user registered: " + user.getEmail());
        
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .points(2000L)
                .isVerified(false)
                .role("USER")
                .message("User registered successfully")
                .build();
    }

    public User registerUser(String firstName, String email, String password) {
        // Check if email already registered as USER (allow same email for different roles)
        if (userRepository.existsByEmailAndRole(email, "USER")) {
            throw new RuntimeException("Email already exists as a user");
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .firstName(firstName)
                .points(2000L)
                .isVerified(false)
                .role("USER")
                .build();

        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public Optional<User> findByEmailAndRole(String email, String role) {
        return userRepository.findByEmailAndRole(email, role);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User updateUser(Long id, User userDetails) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (userDetails.getFirstName() != null) {
                user.setFirstName(userDetails.getFirstName());
            }
            if (userDetails.getLastName() != null) {
                user.setLastName(userDetails.getLastName());
            }
            if (userDetails.getPhone() != null) {
                user.setPhone(userDetails.getPhone());
            }
            if (userDetails.getUsername() != null) {
                user.setUsername(userDetails.getUsername());
            }
            return userRepository.save(user);
        }
        throw new RuntimeException("User not found");
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }

    public void addPoints(Long userId, Long points, String reason) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setPoints(user.getPoints() + points);
            userRepository.save(user);
            System.out.println("[pranai] Points added: " + points + " for reason: " + reason);
        }
    }

    public boolean deductPoints(Long userId, Long points) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getPoints() >= points) {
                user.setPoints(user.getPoints() - points);
                userRepository.save(user);
                System.out.println("[pranai] Points deducted: " + points);
                return true;
            }
        }
        return false;
    }
}
