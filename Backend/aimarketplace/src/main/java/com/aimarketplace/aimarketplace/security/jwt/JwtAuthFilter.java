package com.aimarketplace.aimarketplace.security.jwt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
// Marks this class as a Spring-managed component so Spring can detect and register it automatically
public class JwtAuthFilter extends OncePerRequestFilter {
// This filter runs once for every HTTP request

    @Autowired
    private JwtUtils jwtUtils;
    // JwtUtils is used to decode and extract information from the JWT token

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        // Get the Authorization header from the incoming HTTP request
        String authHeader = request.getHeader("Authorization");

        // Example header sent by frontend:
        // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

        //  Check if the header exists AND starts with "Bearer "
        if (authHeader != null && authHeader.startsWith("Bearer ")) {

            //  Remove "Bearer " (first 7 characters) to extract the JWT token
            String token = authHeader.substring(7);

            //  Decode the token and extract the wallet address from its payload
            String walletAddress = jwtUtils.extractWalletAddress(token);

            //  Create an Authentication object for Spring Security
            // principal = walletAddress (identity of the user)
            // credentials = null (JWT already verified)
            // authorities = null (roles not included here)
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(walletAddress, null, null);

            // Store authentication in the Security Context
            // This tells Spring Security that the user is authenticated
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        //  Continue the request to the next filter or controller
        chain.doFilter(request, response);
    }
}