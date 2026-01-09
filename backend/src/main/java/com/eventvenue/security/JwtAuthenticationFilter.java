package com.eventvenue.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
        "/api/auth",
        "/api/admin/create-admin",
        "/api/admin/settings/conversion-rate",
        "/api/admin/settings/platform-fees",
        "/api/health",
        "/api/withdrawals",
        "/api/credit-requests"
        // Note: /api/events is NOT fully public - vendor endpoints need auth
        // Public event access is handled by SecurityConfig permitAll for GET
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        String method = request.getMethod();
        
        System.out.println("\n[JWT Filter] ========== NEW REQUEST ==========");
        System.out.println("[JWT Filter] Method: " + method);
        System.out.println("[JWT Filter] Path: " + requestPath);
        
        // Skip OPTIONS requests (CORS preflight)
        if ("OPTIONS".equals(method)) {
            System.out.println("[JWT Filter] OPTIONS request - skipping auth");
            System.out.println("[JWT Filter] ===============================\n");
            filterChain.doFilter(request, response);
            return;
        }
        
        // Check if it's a public endpoint (but NOT /api/events/vendor which needs auth)
        boolean isPublicEndpoint = PUBLIC_ENDPOINTS.stream()
            .anyMatch(publicPath -> requestPath.startsWith(publicPath));
        
        // Events: Only public GET requests are allowed without auth
        // /api/events/vendor/** requires VENDOR auth
        boolean isPublicEventAccess = requestPath.startsWith("/api/events") 
            && !requestPath.startsWith("/api/events/vendor")
            && "GET".equals(method);

        if (isPublicEndpoint || isPublicEventAccess) {
            System.out.println("[JWT Filter] Public endpoint - no auth required");
            System.out.println("[JWT Filter] ===============================\n");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = extractTokenFromRequest(request);
            
            System.out.println("[JWT Filter] Token extracted: " + (jwt != null ? "YES" : "NO"));
            if (jwt != null) {
                System.out.println("[JWT Filter] Token preview: " + jwt.substring(0, Math.min(50, jwt.length())) + "...");
                System.out.println("[JWT Filter] Token length: " + jwt.length());
            }
            
            if (jwt == null || jwt.trim().isEmpty()) {
                System.out.println("[JWT Filter] No token found - proceeding without authentication");
                System.out.println("[JWT Filter] ===============================\n");
                filterChain.doFilter(request, response);
                return;
            }
            
            if (jwtTokenProvider.validateToken(jwt)) {
                String email = jwtTokenProvider.getEmailFromToken(jwt);
                String role = jwtTokenProvider.getRoleFromToken(jwt);
                Long userId = jwtTokenProvider.getUserIdFromToken(jwt);

                System.out.println("[JWT Filter] Token valid! Setting authentication:");
                System.out.println("[JWT Filter]   Email: " + email);
                System.out.println("[JWT Filter]   Role: " + role);
                System.out.println("[JWT Filter]   User ID: " + userId);
                System.out.println("[JWT Filter]   Authority: ROLE_" + role);

                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                UsernamePasswordAuthenticationToken authenticationToken = 
                    new UsernamePasswordAuthenticationToken(userId.toString(), null, Arrays.asList(authority));
                // Store email in details for reference
                authenticationToken.setDetails(email);
                
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                System.out.println("[JWT Filter] ✓ Authentication set in SecurityContext");
            } else {
                System.out.println("[JWT Filter] ✗ Token validation FAILED");
            }
        } catch (Exception e) {
            System.out.println("[JWT Filter] ✗ Exception in filter: " + e.getClass().getName());
            System.out.println("[JWT Filter] ✗ Message: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("[JWT Filter] ===============================\n");
        filterChain.doFilter(request, response);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        
        System.out.println("[JWT Filter] Authorization header: " + (bearerToken != null ? bearerToken.substring(0, Math.min(40, bearerToken.length())) + "..." : "null"));
        
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            System.out.println("[JWT Filter] Extracted token from 'Bearer ' prefix");
            return token;
        }
        return null;
    }
}
