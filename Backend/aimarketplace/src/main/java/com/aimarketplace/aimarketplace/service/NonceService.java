package com.aimarketplace.aimarketplace.service;
public interface NonceService {

    // Generate nonce + store in Redis
    String generateAndSaveNonce(String walletAddress);

    // Retrieve nonce for verification
    String getNonce(String walletAddress);

    // Delete nonce after successful verification (prevent replay attack)
    void deleteNonce(String walletAddress);
}