package com.aimarketplace.aimarketplace.service.impl;

import com.aimarketplace.aimarketplace.service.NonceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

import java.util.concurrent.TimeUnit;


@Service
public class NonceServiceImpl implements NonceService {


    @Autowired
    private RedisTemplate<String , String> redisTemplate;

    // get crytographical random number
    private  static  final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static  final  int NONCE_EXPIRY_MINUTES = 5 ;
    private  static  final String NONCE_PREFIX =  "nonce:";


    // for generating and storing nonce

    public  String generateAndSaveNonce(String walletAddress){
        String nonce = generateNonce();
        String key = NONCE_PREFIX+walletAddress;
        redisTemplate.opsForValue().set(key,nonce,NONCE_EXPIRY_MINUTES, TimeUnit.MINUTES);
        return nonce ;
    }



    // for deletenonce
    public void  deleteNonce (String walletAddress){
        String key =   NONCE_PREFIX+walletAddress ;
        redisTemplate.delete(key);
    }



    // function for getting  nonce
    public String getNonce(String walletAddress) {

        String key = NONCE_PREFIX + walletAddress;

        // Returns null if key expired or does not exist
        return redisTemplate.opsForValue().get(key);
    }




    // for generating nonce
    private  String generateNonce(){
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return bytesToHex(randomBytes);
    }

    // function to convert byte into  hex
    // for eg          byte 15 ->   hex "0f"
    private  String bytesToHex(byte[] bytes ){
        StringBuilder sb = new StringBuilder();
        for ( var b : bytes){
            sb.append(String.format("%02x",b));
        }
        return sb.toString();
    }

}