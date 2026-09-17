package com.aimarketplace.aimarketplace.security.jwt;

import com.aimarketplace.aimarketplace.entity.User;
import com.aimarketplace.aimarketplace.repository.UserRepository;
import com.aimarketplace.aimarketplace.security.UserPrincipal;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
// This filter runs once for every HTTP request


    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {

        // Get the Authorization header from the incoming HTTP request
        String authHeader = request.getHeader("Authorization");

        // Example header sent by frontend:
        // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();

            try {
                String walletAddress = jwtService.extractWalletAddress(token);
                Optional<User> optionalUser = userRepository.findByWalletAddress(walletAddress);

                if (optionalUser.isPresent()) {
                    UserPrincipal principal = new UserPrincipal(optionalUser.get());
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    principal,
                                    null,
                                    principal.getAuthorities()
                            );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (JwtException | IllegalArgumentException ignored) {
                // Invalid tokens stay unauthenticated. Spring Security will reject protected routes.
                SecurityContextHolder.clearContext();
            }
        }

        // Requests without a token must still reach public endpoints.
        chain.doFilter(request, response);

    }
}