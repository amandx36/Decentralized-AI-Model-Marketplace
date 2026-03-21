package com.aimarketplace.aimarketplace.dto.request;


import lombok.Data;

@Data
public class VerifyRequest {
    public String walletAddress;
    public  String message ;
    public  String signature ;

}
