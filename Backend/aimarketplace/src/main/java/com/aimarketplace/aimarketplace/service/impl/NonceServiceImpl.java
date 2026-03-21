package com.aimarketplace.aimarketplace.service.impl;

import com.aimarketplace.aimarketplace.entity.User;
import com.aimarketplace.aimarketplace.service.NonceService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;



@Service
public class NonceServiceImpl implements NonceService {


    @Override
    public String generateNonce() {

        return "Trying to log into Ai marketplace " + UUID.randomUUID();

    }

    @Override
    public boolean isExpired(Long createdAt) {
        long now = System.currentTimeMillis();
        long fiveMinutes = 5 * 60 * 1000;

        return createdAt == null || (now - createdAt) > fiveMinutes;
    }
}