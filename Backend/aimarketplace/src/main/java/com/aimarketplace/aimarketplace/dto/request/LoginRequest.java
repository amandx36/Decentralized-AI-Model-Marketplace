package com.aimarketplace.aimarketplace.dto.request;

import lombok.Data;


@Data
public class LoginRequest {
    private  String userName ;
    private  String walletAddress ;
    private String signature ;

}
