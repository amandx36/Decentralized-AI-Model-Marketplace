package com.aimarketplace.aimarketplace.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;


@Configuration
public class CorsConfig   {


    @Bean
    public CorsConfigurationSource  corsConfigurationSource (){

        CorsConfiguration config  = new CorsConfiguration();

        // Allow React frontend to connect
        config.setAllowedOrigins(List.of("http://localhost:5173"));


        // Allow https methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Allow headers
        config.setAllowedHeaders(List.of("*"));

        // Allow credentials like cookies , authorization heasders
        config.setAllowCredentials(true);

    //      map the cors configuration to specific url
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**",config);
        return source ;
    }

}
