package com.authkit.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import com.authkit.backend.auth.security.CustomUserDetails;
import com.authkit.backend.auth.security.JwtAuthFilter;

import jakarta.servlet.FilterChain;

/**
 * Pure unit test for {@link JwtAuthFilter}.
 *
 * <p>Drives the filter directly (no Spring context) so the assertions are about
 * exactly one thing: given a token, does the filter authenticate the request and
 * expose the {@code userId} attribute, and does it always continue the chain?
 */
public class JwtAuthFilterTest {

	private final JwtService jwtService = mock(JwtService.class);
	private final JwtAuthFilter filter = new JwtAuthFilter(jwtService);

	@AfterEach
	void clearContext() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void shouldAuthenticateAndExposeUserId() throws Exception {
		UUID userId = UUID.fromString("11111111-1111-1111-1111-111111111111");

		CustomUserDetails userDetails = mock(CustomUserDetails.class);
		when(jwtService.extractAccessTk(any())).thenReturn("valid-token");
		when(jwtService.validateTk("valid-token")).thenReturn(userDetails);
		when(userDetails.getId()).thenReturn(userId);
		when(userDetails.getAuthorities()).thenReturn(List.of());

		MockHttpServletRequest request = new MockHttpServletRequest();
		MockHttpServletResponse response = new MockHttpServletResponse();
		FilterChain chain = mock(FilterChain.class);

		filter.doFilter(request, response, chain);

		assertNotNull(SecurityContextHolder.getContext().getAuthentication());
		assertEquals(userId, request.getAttribute("userId"));
		verify(chain).doFilter(request, response); // chain always continues
	}

	@Test
	void shouldRejectRequestWithoutToken() throws Exception {
		when(jwtService.extractAccessTk(any())).thenReturn(null);

		MockHttpServletRequest request = new MockHttpServletRequest();
		MockHttpServletResponse response = new MockHttpServletResponse();
		FilterChain chain = mock(FilterChain.class);

		filter.doFilter(request, response, chain);

		assertNull(SecurityContextHolder.getContext().getAuthentication());
		assertNull(request.getAttribute("userId"));
		verify(chain).doFilter(request, response);
	}

	@Test
	void shouldContinueChainWhenTokenIsInvalid() throws Exception {
		// validateTk throwing must not blow up the request; the filter swallows it
		// and lets the authorization rules reject the (still anonymous) request.
		when(jwtService.extractAccessTk(any())).thenReturn("broken-token");
		when(jwtService.validateTk("broken-token")).thenThrow(new RuntimeException("bad signature"));

		MockHttpServletRequest request = new MockHttpServletRequest();
		MockHttpServletResponse response = new MockHttpServletResponse();
		FilterChain chain = mock(FilterChain.class);

		filter.doFilter(request, response, chain);

		assertNull(SecurityContextHolder.getContext().getAuthentication());
		verify(chain).doFilter(request, response);
	}
}
