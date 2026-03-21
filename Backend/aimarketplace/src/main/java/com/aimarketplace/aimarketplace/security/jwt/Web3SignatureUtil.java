package com.aimarketplace.aimarketplace.security.jwt;

import org.web3j.crypto.Hash;
import org.web3j.crypto.Sign;
import org.web3j.crypto.Keys;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

//    message → prefix → hash → (r,s,v) → publicKey → address





// class for handling ethereum signature and signature verification
public class Web3SignatureUtil {

    // recover wallet address from signed message (nonce) + signature

    // recover address
    public static String recoverAddress(String message, String signature) {
        try {

            // Ethereum adds this prefix before signing (EIP-191 standard)
            String prefix = "\u0019Ethereum Signed Message:\n" + message.length();
            String prefixedMessage = prefix + message;

            // hash the message for recovering the public key (keccak256)
            byte[] msgHash = Hash.sha3(prefixedMessage.getBytes(StandardCharsets.UTF_8));

            // convert the string signature into structured data (r, s, v)
            Sign.SignatureData sigData = signatureStringToData(signature);

            // recover the public key using (hash + signature)
            BigInteger publicKey = Sign.signedMessageToKey(msgHash, sigData);

            // now fetching the address from public key
            // internally: keccak256(publicKey) → last 20 bytes
            return "0x" + Keys.getAddress(publicKey);

        } catch (Exception e) {
            throw new RuntimeException("Failed to verify signature", e);
        }
    }

    // converting signature string into r, s, v
    private static Sign.SignatureData signatureStringToData(String signature) {

        // convert hex string → byte[]
        byte[] sigBytes = Numeric.hexStringToByteArray(signature);

        // last byte is v (recovery id)
        byte v = sigBytes[64];

        // normalize v (MetaMask may return 0/1 instead of 27/28)
        if (v < 27) {
            v += 27;
        }

        // first 32 bytes - > r
        byte[] r = Arrays.copyOfRange(sigBytes, 0, 32);

        // next 32 bytes -> s
        byte[] s = Arrays.copyOfRange(sigBytes, 32, 64);

        return new Sign.SignatureData(v, r, s);
    }
}