package com.aimarketplace.aimarketplace.service.impl;

import com.aimarketplace.aimarketplace.dto.request.LoginRequest;
import com.aimarketplace.aimarketplace.dto.response.LoginResponse;
import com.aimarketplace.aimarketplace.repository.UserRepository;
import com.aimarketplace.aimarketplace.security.jwt.JwtService;
import com.aimarketplace.aimarketplace.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class AuthServiceimpl implements AuthService {

    @Autowired
    private UserRepository userRepository ;


    // for jwt services
    @Autowired
    private JwtService jwtService ;


    @Override
    public LoginResponse verifyLogin(LoginRequest request) {
    if(request.getUserName() == null){
        return new LoginResponse("User not Found",null,"404");
    }

    // generate  the jwt token
        String token = jwtService.generateToken(request.getWalletAddress());
    return new LoginResponse(
            "Login Sucessfully ",
            token,
            "202"
    );
    }
}
