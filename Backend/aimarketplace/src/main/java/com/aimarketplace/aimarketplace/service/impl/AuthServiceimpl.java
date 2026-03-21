package com.aimarketplace.aimarketplace.service.impl;

import com.aimarketplace.aimarketplace.dto.request.LoginRequest;
import com.aimarketplace.aimarketplace.dto.response.LoginResponse;
import com.aimarketplace.aimarketplace.entity.User;
import com.aimarketplace.aimarketplace.repository.UserRepository;
import com.aimarketplace.aimarketplace.security.jwt.JwtService;
import com.aimarketplace.aimarketplace.service.AuthService;
import com.aimarketplace.aimarketplace.service.NonceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;


@Service
public class AuthServiceimpl implements AuthService {

    @Autowired
    private UserRepository userRepository;


    // for jwt services
    @Autowired
    private JwtService jwtService;


    @Override
    public LoginResponse verifyLogin(LoginRequest request) {
        // check is exist in the database other wise create it
        User user = userRepository.findByWalletAddress(request.getWalletAddress())
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setWalletAddress(request.getWalletAddress());
                    return userRepository.save(newUser);
                });

        // generate  the jwt token
        String token = jwtService.generateToken(request.getWalletAddress());
        return new LoginResponse(
                "Login Sucessfully ",
                token,
                "200"
        );
    }

    // function for generating ans saving the nonce

    @Autowired
    private NonceService nonceService;

    @Override
    public String generateAndSaveNonce(String walletAddress) {

        User user = userRepository.findByWalletAddress(walletAddress)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setWalletAddress(walletAddress);
                    return newUser;
                });

        String nonce = nonceService.generateNonce();

        user.setNonce(nonce);
        user.setNonce_createdAt(Instant.now().toEpochMilli());
        userRepository.save(user);

        return nonce;
    }

}
