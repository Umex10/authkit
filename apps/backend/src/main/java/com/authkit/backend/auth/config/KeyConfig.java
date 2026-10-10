package com.authkit.backend.auth.config;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

@Configuration
public class KeyConfig {

    /**
     * Loads the private signing key from a PKCS#8 PEM file.
     *
     * @return the RSA private key used to sign access and refresh tokens
     * @throws IllegalStateException when the file is missing or is not a valid PKCS#8 RSA key
     */
    @Bean
    public RSAPrivateKey privateKey(@Value("${jwt.private-key-location}") Resource location) {
        try {
            String data = new String(location.getInputStream().readAllBytes());

            // Strings are immutable: replace() returns a NEW string, so the result must be reassigned.
            String base64 = data
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", ""); // line breaks and spaces are not part of the Base64 body

            byte[] keyBytes = Base64.getDecoder().decode(base64);

            return (RSAPrivateKey) KeyFactory.getInstance("RSA")
                    .generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
        } catch (IOException | GeneralSecurityException | IllegalArgumentException ex) {
            throw new IllegalStateException("Cannot read the JWT private key from " + location, ex);
        }
    }

    /**
     * Loads the public verification key from an X.509 PEM file.
     *
     * @return the RSA public key used to verify token signatures
     * @throws IllegalStateException when the file is missing or is not a valid X.509 RSA key
     */
    @Bean
    public RSAPublicKey publicKey(@Value("${jwt.public-key-location}") Resource location) {
        try {
            String data = new String(location.getInputStream().readAllBytes());

            // Strings are immutable: replace() returns a NEW string, so the result must be reassigned.
            String base64 = data
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", ""); // line breaks and spaces are not part of the Base64 body

            byte[] keyBytes = Base64.getDecoder().decode(base64);

            return (RSAPublicKey) KeyFactory.getInstance("RSA")
                    .generatePublic(new X509EncodedKeySpec(keyBytes));
        } catch (IOException | GeneralSecurityException | IllegalArgumentException ex) {
            throw new IllegalStateException("Cannot read the JWT public key from " + location, ex);
        }
    }
}