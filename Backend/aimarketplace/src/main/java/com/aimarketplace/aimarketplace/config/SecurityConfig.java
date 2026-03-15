package com.aimarketplace.aimarketplace.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

// Marks this class as a Spring Security configuration
@Configuration
public class SecurityConfig {

    // Defines security rules for HTTP requests
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // Disable CSRF (commonly disabled for REST APIs using JWT)
                // CSRF  = cross site request forgery
                .csrf().disable()

                // Define authorization rules
                .authorizeRequests()

                // Allow all API requests without authentication
                .anyRequest().permitAll();

        // Build and return the security configuration
        return http.build();
    }
}