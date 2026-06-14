package com.authkit.backend.auth;

import java.security.Key;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import com.authkit.backend.auth.dto.TkName;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/**
 * Service layer responsible for JWT issuance, validation and extraction.
 *
 * <p>Centralises the secret-key handling, the access/refresh-token lifetimes and
 * the conventions for reading tokens from the inbound HTTP request (the
 * {@code Authorization: Bearer ...} header for access tokens and the
 * {@code refresh_tk} cookie for refresh tokens). The signing secret is read
 * from the {@code jwt.secret} property.
 *
 * @see AuthController
 * @see com.authkit.backend.auth.security.JwtAuthFilter
 */
@Service
@RequiredArgsConstructor
public class JwtService {

	/** Base64-encoded HMAC secret. Must be at least 256 bits for HS256. */
	@Value("${jwt.secret}")
	private String secretKey;

	/** Refresh-token lifetime: 30 days (in milliseconds). */
	private final long REFRESH_TK = 1000L * 60 * 60 * 24 * 30;

	/** Access-token lifetime: 15 minutes (in milliseconds). */
	private final long ACCESS_TK = 1000L * 60 * 15;

	private final UserDetailsService userDetailsService;

	/**
	 * Parses the supplied JWT, validates its signature and expiry, and loads
	 * the associated {@link UserDetails}.
	 *
	 * @return the user details of the subject encoded in the token
	 * @throws io.jsonwebtoken.JwtException when the token is malformed, expired
	 *         or signed with a different key
	 */
	public UserDetails validateTk(String tk) {
		String email = extractEmail(tk);
		return userDetailsService.loadUserByUsername(email);
	}

	/**
	 * Creates a short-lived access token for the supplied email.
	 *
	 * @return the signed access JWT
	 */
	public String createAccessTk(String email) {
		return createTk(email, TkName.ACCESS);
	}

	/**
	 * Creates a long-lived refresh token for the supplied email.
	 *
	 * @return the signed refresh JWT
	 */
	public String createRefreshTk(String email) {
		return createTk(email, TkName.REFRESH);
	}

	/**
	 * Extracts the bearer access token from the request's
	 * {@code Authorization} header.
	 *
	 * @return the raw token string, or {@code null} when the header is missing
	 *         or does not start with the {@code Bearer } prefix
	 */
	public String extractAccessTk(HttpServletRequest request) {

		String bearerTk = request.getHeader("Authorization");

		if (bearerTk != null && bearerTk.startsWith("Bearer ")) {
			return bearerTk.substring(7);
		}
		return null;
	}

	/**
	 * Extracts the refresh token from the {@code refresh_tk} cookie.
	 *
	 * @return the cookie value, or {@code null} when the request carries no
	 *         cookies or no cookie with that name
	 */
	public String extractRefreshTk(HttpServletRequest request) {
		Cookie[] cookies = request.getCookies();
		if (cookies == null) {
			return null;
		}

		return Arrays.stream(cookies)
				.filter(cookie -> "refresh_tk".equals(cookie.getName()))
				.map(Cookie::getValue)
				.findFirst()
				.orElse(null);
	}

	/**
	 * Builds and signs a JWT for the supplied subject with the lifetime
	 * matching the given token type.
	 *
	 * <p>The token carries the subject (the user's email), an issued-at
	 * timestamp, the expiration timestamp and a {@code type_tk} claim that
	 * distinguishes access tokens from refresh tokens.
	 *
	 * @return the compact, signed JWT string
	 */
	private String createTk(String email, TkName tkType) {

		long expiryMs = (tkType == TkName.ACCESS) ? ACCESS_TK : REFRESH_TK;

		Map<String, Object> claims = new HashMap<>();
		return Jwts.builder()
				.setClaims(claims)
				.setSubject(email)
				.setIssuedAt(new Date(System.currentTimeMillis()))
				.claim("type_tk", tkType) // lets the receiver tell access from refresh tokens apart
				.setExpiration(new Date(System.currentTimeMillis() + expiryMs))
				.signWith(getSigningKey(), SignatureAlgorithm.HS256) // our tamper-proof checksum
				.compact(); // produces the xxxxx.yyyyy.zzzzz string
	}

	/**
	 * Derives the HMAC signing key from the configured secret.
	 *
	 * @return the HMAC-SHA key used for signing and verification
	 */
	private Key getSigningKey() {
		byte[] keyBytes = secretKey.getBytes();
		return Keys.hmacShaKeyFor(keyBytes);
	}

	/**
	 * Parses the JWT and returns its subject claim (the user's email).
	 *
	 * @return the email encoded as the token's subject
	 * @throws io.jsonwebtoken.JwtException when the token cannot be parsed or
	 *         the signature is invalid
	 */
	private String extractEmail(String tk) {
		Claims claims = Jwts.parserBuilder()
				.setSigningKey(getSigningKey())
				.build()
				.parseClaimsJws(tk)
				.getBody();
		return claims.getSubject();
	}
}
