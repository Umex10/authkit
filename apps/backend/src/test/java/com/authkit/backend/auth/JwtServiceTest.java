package com.authkit.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.text.ParseException;
import java.util.Optional;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import com.authkit.backend.common.entities.User;
import com.authkit.backend.common.repositories.UserRepository;
import com.authkit.backend.utils.TestDataFactory;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.Cookie;

/**
 * Unit tests for {@link JwtService}.
 *
 * <p>
 * Pure Mockito tests — no Spring context, so the service is built by hand with
 * {@code new}. A fresh RSA key pair is generated once for the whole class, so no
 * key file is needed. Token contents are read with nimbus-jose-jwt
 * ({@link SignedJWT#parse(String)}), which only decodes and does not verify.
 */
@ExtendWith(MockitoExtension.class)
public class JwtServiceTest {

	/** Recreated by Mockito before every test, so stubs never leak between tests. */
	@Mock
	private UserRepository userRepository;

	private JwtService jwtService;

	private final User user = TestDataFactory.createDefaultUser();

	/** Shared by all tests: generating a 2048-bit pair is slow and a key never changes. */
	private static KeyPair pair;

	/**
	 * Generates the RSA key pair once for the whole class.
	 */
	@BeforeAll
	static void generateKeys() throws Exception {
		KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
		generator.initialize(2048);
		pair = generator.generateKeyPair();
	}

	/**
	 * Builds a fresh service per test so it always uses the current test's
	 * {@code userRepository} mock.
	 */
	@BeforeEach
	void setUp() {
		jwtService = new JwtService(
				(RSAPrivateKey) pair.getPrivate(),
				(RSAPublicKey) pair.getPublic(),
				userRepository);
	}

	/** An access token carries the user id as {@code sub} plus the {@code email} and {@code roles} claims. */
	@Test
	void shouldCreateAccessTk() throws ParseException {
		String tk = jwtService.createAccessTk(user);
		assertNotNull(tk);

		SignedJWT jwt = SignedJWT.parse(tk);
		JWTClaimsSet claims = jwt.getJWTClaimsSet();

		assertEquals(claims.getSubject(), user.getId().toString());
		assertEquals(claims.getStringClaim("email"), user.getEmail());
		assertTrue(claims.getStringListClaim("roles").contains(user.getRole().name()));
	}

	/** A refresh token carries only the user id; email and roles are re-read from the database on refresh. */
	@Test
	void shouldCreateRefreshTk() throws ParseException {
		String tk = jwtService.createRefreshTk(user);
		assertNotNull(tk);

		SignedJWT jwt = SignedJWT.parse(tk);
		JWTClaimsSet claims = jwt.getJWTClaimsSet();

		assertEquals(claims.getSubject(), user.getId().toString());
		assertNull(claims.getStringClaim("email"));
		assertNull(claims.getStringListClaim("roles"));
	}

	/** A valid refresh token resolves to the user behind its subject, loaded by id. */
	@Test
	void shouldValidateRefreshTk() {
		String tk = jwtService.createRefreshTk(user);
		when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

		User result = jwtService.validateRefreshTk(tk);

		assertEquals(user, result);
		verify(userRepository).findById(user.getId());
	}

	/** A refresh token of a user that no longer exists is rejected. */
	@Test
	void shouldThrowExceptionWhenUserNotFound() {
		String tk = jwtService.createRefreshTk(user);
		when(userRepository.findById(user.getId())).thenReturn(Optional.empty());

		assertThrows(EntityNotFoundException.class, () -> jwtService.validateRefreshTk(tk));
	}

	/** The refresh token is read from the {@code refresh_tk} cookie. */
	@Test
	void shouldExtractRefreshTk() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setCookies(new Cookie("refresh_tk", "New-refresh-tk"));

		assertNotNull(jwtService.extractRefreshTk(request));
	}

	/** Without the cookie there is no refresh token. */
	@Test
	void shouldNotExtractRefreshTk() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		assertNull(jwtService.extractRefreshTk(request));
	}

}
