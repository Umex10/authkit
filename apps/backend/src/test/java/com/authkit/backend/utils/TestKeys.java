package com.authkit.backend.utils;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

/**
 * Central source of the RSA keys used in tests.
 *
 * <p>
 * The repository contains no private key, so a key pair is generated at
 * runtime. {@link #PAIR} is created once per test run and shared by all tests:
 * generating a 2048-bit pair is slow and a key never changes. Tests that need
 * an unrelated key (e.g. to forge a token with a wrong signature) call
 * {@link #generateKeyPair()}.
 */
public final class TestKeys {

	/** The key pair the code under test signs and verifies with. */
	public static final KeyPair PAIR = generateKeyPair();

	private TestKeys() {
	}

	/** The private key of {@link #PAIR}, used to sign tokens. */
	public static RSAPrivateKey privateKey() {
		return (RSAPrivateKey) PAIR.getPrivate();
	}

	/** The public key of {@link #PAIR}, used to verify tokens. */
	public static RSAPublicKey publicKey() {
		return (RSAPublicKey) PAIR.getPublic();
	}

	/** Generates a fresh 2048-bit RSA key pair, unrelated to {@link #PAIR}. */
	public static KeyPair generateKeyPair() {
		try {
			KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
			generator.initialize(2048);
			return generator.generateKeyPair();
		} catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("RSA is not available in this JVM", ex);
		}
	}

	/**
	 * Provides the {@link RSAPublicKey} bean that {@code KeyConfig} supplies in
	 * the real app. {@code @WebMvcTest} does not load {@code @Configuration}
	 * classes, but {@code SecurityConfig} (JwtDecoder) and {@code JwksController}
	 * need the key. It returns the public key of {@link #PAIR}, so tokens signed
	 * with {@link #privateKey()} are accepted by the decoder.
	 */
	@TestConfiguration
	public static class PublicKeyConfig {

		@Bean
		RSAPublicKey publicKey() {
			return TestKeys.publicKey();
		}
	}
}
