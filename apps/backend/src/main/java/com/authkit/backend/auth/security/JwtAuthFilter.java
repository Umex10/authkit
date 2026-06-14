package com.authkit.backend.auth.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.OncePerRequestFilter;

import com.authkit.backend.auth.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servlet filter that authenticates each request based on its bearer JWT.
 *
 * <p>Extracts the access token from the {@code Authorization} header, validates
 * it through {@link JwtService}, and on success places an authenticated
 * {@link UsernamePasswordAuthenticationToken} (with the user's authorities) into
 * the security context for the remainder of the request. Invalid or missing
 * tokens are silently ignored so that downstream Spring Security rules can
 * decide whether to allow or reject the request.
 *
 * @see JwtService
 * @see com.authkit.backend.auth.security.config.SecurityConfig
 */
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

	private final JwtService jwtService;

	/**
	 * Inspects the incoming request for a bearer token, validates it, and
	 * publishes the resulting authentication into the security context before
	 * invoking the next filter in the chain.
	 *
	 * <p>When a {@link CustomUserDetails} is produced, the user's id is also
	 * exposed as the request attribute {@code "userId"} so controllers can read
	 * it directly via {@code @RequestAttribute UUID userId} without re-parsing
	 * the security context.
	 *
	 * @throws ServletException when the downstream chain raises a servlet error
	 * @throws IOException when the downstream chain raises an I/O error
	 */
	@Override
	protected void doFilterInternal(HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		try {
			String tk = jwtService.extractAccessTk(request);

			if (tk != null) {

				UserDetails userDetails = jwtService.validateTk(tk);

				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
						userDetails,
						null,
						userDetails.getAuthorities());

				// Marks the current request as authenticated for every downstream
				// filter and controller.
				SecurityContextHolder.getContext().setAuthentication(authentication);

				// Convenience: lets controllers grab the user id straight off the
				// request (@RequestAttribute UUID userId) instead of digging through
				// the security context.
				if (userDetails instanceof CustomUserDetails) {
					request.setAttribute("userId", ((CustomUserDetails) userDetails).getId());
				}

			}
		} catch (Exception ex) {
			log.warn("Received invalid access token");
		}

		// Always continue the chain; unauthenticated requests are rejected later
		// by the authorization rules, not here.
		filterChain.doFilter(request, response);
	}

}
