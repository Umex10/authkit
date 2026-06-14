package com.authkit.backend.auth.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for the {@code POST /auth/sign-in} endpoint.
 *
 * <p>Carries the credentials a returning user submits to obtain a fresh
 * access/refresh-token pair. Both fields are validated server-side via Jakarta
 * Bean Validation; failed validation is surfaced as HTTP 400 with field-level
 * error messages.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignInAccountRequestDto {

	@NotBlank(message = "Email is required")
	@Email(message = "Email must be valid")
	private String email;

	@NotBlank(message = "Password is required")
	@Size(min = 6, message = "Password must be at least {min} characters.")
	private String password;

}
