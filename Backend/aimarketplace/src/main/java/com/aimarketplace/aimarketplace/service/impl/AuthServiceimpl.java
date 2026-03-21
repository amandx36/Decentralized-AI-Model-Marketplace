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

        String nonce = nonceService.generateNonce();

        user.setNonce(nonce);
        user.setNonce_createdAt(Instant.now().toEpochMilli());
        userRepository.save(user);

        return nonce;
    }


    @Override
    public  String verifyAndLogin(String walletAddress, String message, String signature){

        // fetch user
        User user = userRepository.findByWalletAddress(walletAddress).orElseThrow(()-> new RuntimeException("User Not found "));




        //  1 validate nonce
        if (user.getNonce() == null || !message.equals(user.getNonce())) {
            throw new RuntimeException("Invalid nonce");
        }

        // 2 check the expiry of nonce
        if (System.currentTimeMillis() - user.getNonce_createdAt()> 5 * 60 * 1000) {
            throw new RuntimeException("Nonce expired");
        }

        // 3 recover  wallet address
        String recoveredAddress = Web3SignatureUtil.recoverAddress(message, signature);

        //   4 compare address
        if (!recoveredAddress.equalsIgnoreCase(walletAddress)){
            throw  new RuntimeException("Signature miss match ");
        }
        //  5  invalidate nonce
        user.setNonce(null);
        userRepository.save(user);

        // return the jwt token
        return jwtService.generateToken(walletAddress);
    }

}
