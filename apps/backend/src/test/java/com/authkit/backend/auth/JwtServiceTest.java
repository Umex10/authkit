package com.authkit.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.servlet.http.Cookie;

/**
 * Unit tests for {@link JwtService}.
 *
 * <p>Pure Mockito tests — no Spring context. The HS256 secret is injected via
 * reflection because there is no property source loaded here.
 */
@ExtendWith(MockitoExtension.class)
public class JwtServiceTest {

	@Mock
	private UserDetailsService userDetailsService;

	@InjectMocks
	private JwtService jwtService;

	@BeforeEach
	void setUp() {
		// >= 256-bit secret required by HS256.
		ReflectionTestUtils.setField(jwtService, "secretKey",
				"6JdV8gkU9MfeAtDHc0qnRdQtdWhZ2VOyr+nMV6N9jDKuVnHpHLO98XPjmvh7MAlPiLNsxb+deTP1f8arBuwooA==");
	}

	@Test
	void shouldCreateAccessTk() {
		String accessTk = jwtService.createAccessTk("john@mail.com");
		assertNotNull(accessTk);
	}

	@Test
	void shouldCreateRefreshTk() {
		String refreshTk = jwtService.createRefreshTk("john@mail.com");
		assertNotNull(refreshTk);
	}

	@Test
	void shouldValidateTk() {
		String email = "john@mail.com";
		String tk = jwtService.createRefreshTk(email);

		UserDetails userDetailsMock = mock(UserDetails.class);
		when(userDetailsMock.getUsername()).thenReturn(email);
		when(userDetailsService.loadUserByUsername(email)).thenReturn(userDetailsMock);

		UserDetails userDetails = jwtService.validateTk(tk);

		assertNotNull(userDetails);
		assertEquals(email, userDetails.getUsername());
		verify(userDetailsService).loadUserByUsername(email);
	}

	@Test
	void shouldThrowExceptionWhenUserNotFound() {
		String email = "unknown@mail.com";
		String tk = jwtService.createAccessTk(email);

		when(userDetailsService.loadUserByUsername(email))
				.thenThrow(new UsernameNotFoundException("User not found"));

		assertThrows(UsernameNotFoundException.class, () -> jwtService.validateTk(tk));
	}

	@Test
	void shouldExtractAccessTk() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.addHeader("Authorization", "Bearer New-Access-Tk");

		assertNotNull(jwtService.extractAccessTk(request));
	}

	@Test
	void shouldNotExtractAccessTk() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		assertNull(jwtService.extractAccessTk(request));
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
