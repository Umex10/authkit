package com.authkit.backend.auth.dto.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for the {@code POST /auth/sign-up} endpoint.
 *
 * <p>Carries the full set of attributes required to create a new {@code User}.
 * Each field is validated server-side; the {@link Role} enum mirrors the
 * application-level role taxonomy and is also the canonical source for the
 * frontend's role select.
 *
 * <p><b>Customising for your project:</b> the {@link Role} enum below is the one
 * thing you will almost certainly change. Add your own roles (e.g. {@code OWNER},
 * {@code DRIVER}, {@code ACCOUNTANT}) and they will automatically flow through to
 * the JWT authorities and the {@code @PreAuthorize} checks.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SignUpAccountRequestDto {

	@NotBlank(message = "Name is required")
	@Size(min = 2, message = "Name must be at least {min} characters.")
	private String name;

	@NotBlank(message = "Email is required")
	@Email(message = "Please enter a valid email address.")
	private String email;

	@NotBlank(message = "Phone is required")
	@Size(min = 10, message = "Phone must be at least {min} characters.")
	private String phone;

	@NotBlank(message = "Password is required")
	@Size(min = 6, message = "Password must be at least {min} characters.")
	private String password;

	@NotNull(message = "Role is required")
	private Role role;

	/**
	 * Application-level user roles.
	 *
	 * <p>Persisted as a string on the {@code User} entity and mapped to the
	 * Spring Security authority {@code ROLE_<NAME>} by
	 * {@link com.authkit.backend.auth.security.CustomUserDetails#getAuthorities()}.
	 *
	 * <p>These two generic roles are a sensible starting point. Replace or extend
	 * them with whatever your project needs.
	 */
	public static enum Role {
		USER,
		ADMIN
	}
}
