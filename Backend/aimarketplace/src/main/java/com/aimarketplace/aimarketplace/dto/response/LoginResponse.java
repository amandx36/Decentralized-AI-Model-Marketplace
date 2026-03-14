package com.aimarketplace.aimarketplace.dto.response;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String message ;
    private String jwtToken ;
    private String responseCode ;
}
