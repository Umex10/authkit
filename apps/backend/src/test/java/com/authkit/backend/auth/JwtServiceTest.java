package com.authkit.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import com.authkit.backend.common.entities.User;
import com.authkit.backend.common.repositories.UserRepository;
import com.authkit.backend.utils.TestDataFactory;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.Cookie;

/**
 * Unit tests for {@link JwtService}.
 *
 * <p>Pure Mockito tests — no Spring context. A fresh RSA key pair is generated
 * for the test run, so no key file is needed.
 */
@ExtendWith(MockitoExtension.class)
public class JwtServiceTest {

	@Mock
	private UserRepository userRepository;

	private JwtService jwtService;

	private final User user = TestDataFactory.createDefaultUser();

	@BeforeEach
	void setUp() throws Exception {
		KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
		generator.initialize(2048);
		KeyPair pair = generator.generateKeyPair();
		jwtService = new JwtService((RSAPrivateKey) pair.getPrivate(), (RSAPublicKey) pair.getPublic(), userRepository);
	}

	@Test
	void shouldCreateAccessTk() {
		assertNotNull(jwtService.createAccessTk(user));
	}

	@Test
	void shouldCreateRefreshTk() {
		assertNotNull(jwtService.createRefreshTk(user));
	}

	@Test
	void shouldValidateRefreshTk() {
		String tk = jwtService.createRefreshTk(user);
		when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

		User result = jwtService.validateRefreshTk(tk);

		assertEquals(user, result);
		verify(userRepository).findById(user.getId());
	}

	@Test
	void shouldThrowExceptionWhenUserNotFound() {
		String tk = jwtService.createRefreshTk(user);
		when(userRepository.findById(user.getId())).thenReturn(Optional.empty());

		assertThrows(EntityNotFoundException.class, () -> jwtService.validateRefreshTk(tk));
	}

	@Test
	void shouldExtractRefreshTk() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setCookies(new Cookie("refresh_tk", "New-refresh-tk"));

		assertNotNull(jwtService.extractRefreshTk(request));
	}

	@Test
	void shouldNotExtractRefreshTk() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		assertNull(jwtService.extractRefreshTk(request));
	}

}
