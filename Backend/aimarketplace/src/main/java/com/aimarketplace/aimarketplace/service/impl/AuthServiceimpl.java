package com.aimarketplace.aimarketplace.service.impl;

import com.aimarketplace.aimarketplace.dto.request.LoginRequest;
import com.aimarketplace.aimarketplace.dto.response.LoginResponse;
import com.aimarketplace.aimarketplace.entity.User;
import com.aimarketplace.aimarketplace.repository.UserRepository;
import com.aimarketplace.aimarketplace.security.jwt.JwtService;
import com.aimarketplace.aimarketplace.security.jwt.Web3SignatureUtil;
import com.aimarketplace.aimarketplace.service.AuthService;
import com.aimarketplace.aimarketplace.service.NonceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;


@Service
public class AuthServiceimpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;


    // function for generating ans saving the nonce

    @Autowired
    private NonceService nonceService;

    @Override
    public String generateAndSaveNonce(String walletAddress) {

        User user = userRepository.findByWalletAddress(walletAddress)
                .orElseGet(() -> {
            User newUser = new User();
            newUser.setWalletAddress(walletAddress);
            return userRepository.save(newUser);
        });



        // Store nonce in Redis only
        return nonceService.generateAndSaveNonce(walletAddress);

    }


    @Override
    public  String verifyAndLogin(String walletAddress, String message, String signature){

        // fetch user
        User user = userRepository.findByWalletAddress(walletAddress).orElseThrow(()-> new RuntimeException("User Not found "));




        //  1 get nonce from  nonce
        String storedNonce = nonceService.getNonce(walletAddress);

        if (storedNonce== null){
            throw new RuntimeException("Nonce not  found or expired ");
        }

        // 2 validate nonce
        if (!message.equals(storedNonce)){
            throw new RuntimeException("Invalid nonce ");

        }

        // 3 recover  wallet address
        String recoveredAddress = Web3SignatureUtil.recoverAddress(message, signature);

        //   4 compare address
        if (!recoveredAddress.equalsIgnoreCase(walletAddress)){
            throw  new RuntimeException("Signature miss match ");
        }
        //  5  delete nonce from redis
        nonceService.deleteNonce(walletAddress);
        
        // return the jwt token
        return jwtService.generateToken(walletAddress);
    }

}
