package com.aimarketplace.aimarketplace.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;


    // for set signing key
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }


    // Generate JWT token
    public String generateToken(String walletAddress) {
        return Jwts.builder()
                .setSubject(walletAddress)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Generate refresh token (longer expiration)
    public String generateRefreshToken(String walletAddress) {
        return Jwts.builder()
                .setSubject(walletAddress)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }


    // Extract wallet address from JWT
    public String extractWalletAddress(String token) {
        return extractAllClaims(token).getSubject();
    }

    // extract the expiration
    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();

    }

    // check is token is expired or not
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }


    // is token isValidToken
    public boolean isValidToken(String token, String walletAddress) {
        final String extractedWallet = extractWalletAddress(token);
        return extractedWallet.equals(walletAddress) && !isTokenExpired(token);
    }

    // Validate refresh token and generate new access token
    public String refreshAccessToken(String refreshToken) {
        if (isTokenExpired(refreshToken)) {
            throw new RuntimeException("Refresh token has expired");
        }
        String walletAddress = extractWalletAddress(refreshToken);
        return generateToken(walletAddress);
    }

}