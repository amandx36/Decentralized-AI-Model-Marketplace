package com.aimarketplace.aimarketplace.service;

public interface NonceService {
    String  generateNonce();
    boolean isExpired(Long createdAt);
}
