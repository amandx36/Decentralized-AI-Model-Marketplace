package com.aimarketplace.aimarketplace.security.jwt;

import org.web3j.crypto.Keys;
import org.web3j.crypto.Sign;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

// Utility for Ethereum personal_sign signature verification
public class Web3SignatureUtil {

    /**
     * Recover the Ethereum wallet address that signed the given message
     * using MetaMask's personal_sign / EIP-191 format.
     */
    public static String recoverAddress(String message, String signature) {

        try {
            // Pass the original message bytes; Web3j applies the EIP-191 prefix.
            byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);
            Sign.SignatureData sigData = signatureStringToData(signature);
            BigInteger publicKey =
                    Sign.signedPrefixedMessageToKey(messageBytes, sigData);

            return "0x" + Keys.getAddress(publicKey);

        } catch (Exception e) {
            throw new RuntimeException("Failed to verify signature", e);
        }
    }

    /**
     * Convert a hexadecimal Ethereum signature into Web3j SignatureData.
     *
     * Signature format:
     *
     * r = 32 bytes
     * s = 32 bytes
     * v = 1 byte
     *
     * Total = 65 bytes
     */
    private static Sign.SignatureData signatureStringToData(String signature) {

        byte[] sigBytes = Numeric.hexStringToByteArray(signature);

        if (sigBytes.length != 65) {
            throw new IllegalArgumentException(
                    "Invalid Ethereum signature length: "
                            + sigBytes.length
                            + " bytes"
            );
        }

        // Last byte is recovery ID (v).
        byte v = sigBytes[64];

        // MetaMask may return 0/1 instead of 27/28.
        if (v < 27) {
            v += 27;
        }

        // First 32 bytes = r
        byte[] r = Arrays.copyOfRange(sigBytes, 0, 32);

        // Next 32 bytes = s
        byte[] s = Arrays.copyOfRange(sigBytes, 32, 64);

        return new Sign.SignatureData(v, r, s);
    }
}