package com.aimarketplace.aimarketplace.dto.request;

import lombok.Data;

import java.security.Signature;



@Data
public class LoginRequest {
    private  String userName ;
    private  String walletAddress ;
    private String signature ;

}
