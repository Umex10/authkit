package com.authkit.backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.authkit.backend.auth.dto.requests.SignUpAccountRequestDto;
import com.authkit.backend.common.entities.User;
import com.authkit.backend.common.exception.ApiError;
import com.authkit.backend.common.exception.OwnException;
import com.authkit.backend.common.repositories.UserRepository;
import com.authkit.backend.utils.TestDataFactory;

/**
 * Unit tests for {@link AuthService}.
 *
 * <p>
 * Pure Mockito tests: no Spring context. Covers sign-up (unique email and phone
 * lead to a persisted, hashed user; taken fields lead to an
 * {@link OwnException} with one field error each) and sign-in (valid
 * credentials return the user, invalid ones throw).
 */
@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

	@Mock
	UserRepository userRepository;

	@Mock
	PasswordEncoder encoder;

	@Mock
	AuthenticationManager authenticationManager;

	@InjectMocks
	AuthService authService;

	private final User user = TestDataFactory.createDefaultUser();

	/** A new user with a free email and phone is saved with the hashed password. */
	@Test
	void shouldSignUpAccount() {
		SignUpAccountRequestDto dto = TestDataFactory.createSignUpDto();

		when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.empty());
		when(userRepository.findByPhone(user.getPhone())).thenReturn(Optional.empty());
		when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0)); // return what was saved
		when(encoder.encode(dto.getPassword())).thenReturn(user.getPassword());

		User savedUser = authService.signUp(dto);

		assertNotNull(savedUser);
		assertEquals(user.getEmail(), savedUser.getEmail());
		assertEquals(user.getPassword(), savedUser.getPassword());
	}

	/** Taken email and phone are both reported at once. */
	@Test
	void shouldNotSignUpAccount() {
		SignUpAccountRequestDto dto = TestDataFactory.createSignUpDto();

		when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
		when(userRepository.findByPhone(user.getPhone())).thenReturn(Optional.of(user));

		OwnException exception = assertThrows(OwnException.class, () -> authService.signUp(dto));

		List<ApiError.FieldError> errors = exception.getErrors();
		assertEquals(2, errors.size());
		assertTrue(errors.stream().anyMatch(e -> e.getField().equals("email")));
		assertTrue(errors.stream().anyMatch(e -> e.getField().equals("phone")));
	}

	/**
	 * Valid credentials return the user loaded by email. The AuthenticationManager
	 * mock needs no stub: returning normally (null) is the success case.
	 */
	@Test
	void shouldAuthenticate() {
		when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

		User returnedUser = authService.authenticate(user.getEmail(), user.getPassword());

		assertEquals(user.getId(), returnedUser.getId());
		assertEquals(user.getEmail(), returnedUser.getEmail());
	}

	/** Wrong credentials make the AuthenticationManager throw, and the error is passed on. */
	@Test
	void shouldNotAuthenticate() {
		when(authenticationManager
				.authenticate(new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword())))
				.thenThrow(new BadCredentialsException("Bad credentials"));

		assertThrows(org.springframework.security.core.AuthenticationException.class,
				() -> authService.authenticate(user.getEmail(), user.getPassword()));
	}

}
