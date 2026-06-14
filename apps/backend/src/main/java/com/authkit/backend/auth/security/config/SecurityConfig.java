package com.authkit.backend.auth.security.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.authkit.backend.auth.JwtService;
import com.authkit.backend.auth.security.JwtAuthFilter;

/**
 * Central Spring Security configuration for the application.
 *
 * <p>Wires the stateless JWT-based authentication setup: CSRF is disabled because
 * the API does not rely on session cookies, the {@link JwtAuthFilter} runs before
 * the standard {@link UsernamePasswordAuthenticationFilter}, and the
 * {@code /auth/**} routes are publicly reachable so unauthenticated clients can
 * sign up, sign in and refresh tokens. CORS is opened up for the configured
 * frontend origin(s).
 *
 * @see JwtAuthFilter
 * @see CorsConfig
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // enables @PreAuthorize("hasRole('ADMIN')") and friends
public class SecurityConfig {

	/**
	 * Allowed frontend origin(s) for CORS. Comma-separated; supports wildcard
	 * patterns such as {@code https://*.vercel.app}. Defaults to the local
	 * Next.js dev server.
	 */
	@Value("${FRONTEND_URL:http://localhost:3000}")
	private String frontendUrl;

	/**
	 * Produces the JWT authentication filter as a managed bean.
	 *
	 * @return the configured {@link JwtAuthFilter}
	 */
	@Bean
	public JwtAuthFilter jwtAuthenticationFilter(JwtService jwtService) {
		return new JwtAuthFilter(jwtService);
	}

	/**
	 * Assembles the application's primary security filter chain.
	 *
	 * <p>Disables CSRF, opts in to CORS using the bean defined below, makes
	 * {@code /auth/**} and the Swagger UI paths public, requires authentication
	 * for every other route, declares the session policy as stateless and
	 * inserts the JWT filter ahead of the username/password filter.
	 *
	 * @return the built security filter chain
	 * @throws Exception when {@link HttpSecurity#build()} fails
	 */
	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http,
			JwtAuthFilter jwtAuthenticationFilter) throws Exception {
		http
			.cors(Customizer.withDefaults())
			.csrf(csrf -> csrf.disable()) // safe: the API is stateless and token-based, not cookie-session-based
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // CORS pre-flight
				.requestMatchers("/auth/**").permitAll()                // public: sign-up / sign-in / refresh
				.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll() // public docs
				.anyRequest().authenticated())                          // everything else needs a valid JWT
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	/**
	 * Exposes a delegating password encoder so hashes carrying different
	 * algorithm prefixes (e.g. {@code {bcrypt}}) can still be matched.
	 *
	 * @return the configured {@link PasswordEncoder}
	 */
	@Bean
	public PasswordEncoder encoder() {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder();
	}

	/**
	 * Exposes the Spring-managed {@link AuthenticationManager} so the service
	 * layer can trigger username/password authentication.
	 *
	 * @return the auto-configured authentication manager
	 * @throws Exception when the underlying configuration cannot be resolved
	 */
	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
		return config.getAuthenticationManager();
	}

	/**
	 * Configures Cross-Origin Resource Sharing (CORS) for every route.
	 *
	 * <p>Reads {@code FRONTEND_URL} (a comma-separated list of patterns) and
	 * registers it via {@code setAllowedOriginPatterns}, which is required when
	 * {@code allowCredentials} is enabled and supports wildcards such as
	 * {@code https://*.vercel.app}. The configuration permits the standard REST
	 * verbs and allows credentials so the refresh-token cookie can round-trip
	 * between the browser and the API.
	 *
	 * @return the CORS configuration source registered for {@code /**}
	 */
	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		// Split by comma to support multiple origins, trim whitespace from each entry.
		List<String> allowedOrigins = new ArrayList<>(Stream.of(frontendUrl.split(","))
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.toList());

		// Always permit the local development clients so tools like Swagger
		// "Try it out" work out of the box, regardless of FRONTEND_URL.
		allowedOrigins.addAll(List.of(
				"http://localhost:3000", // Next.js web (dev)
				"http://localhost:3001", // Next.js web (e2e test instance)
				"http://localhost:8082"  // standalone Swagger UI container
		));

		CorsConfiguration configuration = new CorsConfiguration();
		// setAllowedOriginPatterns works with allowCredentials(true) and supports wildcards.
		configuration.setAllowedOriginPatterns(allowedOrigins);
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setAllowCredentials(true); // required so the browser sends/stores the refresh_tk cookie

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
