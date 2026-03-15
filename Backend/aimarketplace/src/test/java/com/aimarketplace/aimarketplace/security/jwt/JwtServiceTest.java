package com.aimarketplace.aimarketplace.security.jwt;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import  static  org.junit.jupiter.api.Assertions.*;




@SpringBootTest
public class JwtServiceTest {

    @Autowired
    JwtService jwtService ;

    @Test
     public void testTokenGeneration() {



        String wallet = "0xABC123";

        String token = jwtService.generateToken(wallet);

        // check  it return something or not
        assertNotNull(token);
    }


    // another test case for validating wallet address extraction
    public  void testWalletExtraction(){
        String wallet = "0x02er";
        // generate token
        String token = jwtService.generateToken(wallet);

        String extractedWalletAddress  = jwtService.extractWalletAddress(token);

        assertEquals(wallet,extractedWalletAddress);

    }

}
