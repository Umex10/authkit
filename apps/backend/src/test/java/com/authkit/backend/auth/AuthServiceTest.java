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
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.authkit.backend.auth.dto.requests.SignUpAccountRequestDto;
import com.authkit.backend.common.entities.User;
import com.authkit.backend.common.exception.ApiError;
import com.authkit.backend.common.exception.OwnException;
import com.authkit.backend.common.repositories.UserRepository;
import com.authkit.backend.utils.TestDataFactory;

/**
 * Unit tests for {@link AuthService} sign-up rules.
 *
 * <p>Verifies the happy path (unique email + phone → persisted, hashed user) and
 * the duplicate path (both fields taken → {@link OwnException} carrying one field
 * error each).
 */
@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

	@Mock
	UserRepository userRepository;

	@Mock
	PasswordEncoder encoder;

	@Mock
	UserDetailsService userDetailsService;

	@InjectMocks
	AuthService authService;

	@Test
	void shouldSignUpAccount() {
		User userMock = TestDataFactory.createDefaultUser();
		SignUpAccountRequestDto dto = TestDataFactory.createSignUpDto();

		String email = userMock.getEmail();
		String phone = userMock.getPhone();
		String password = dto.getPassword();
		String hashedPassword = userMock.getPassword();

		when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
		when(userRepository.findByPhone(phone)).thenReturn(Optional.empty());
		when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
		when(encoder.encode(password)).thenReturn(hashedPassword);

		User user = authService.signUp(dto);

		assertNotNull(user);
		assertEquals(email, user.getEmail());
		assertEquals(hashedPassword, user.getPassword());
	}

	@Test
	void shouldNotSignUpAccount() {
		User userMock = TestDataFactory.createDefaultUser();
		SignUpAccountRequestDto dto = TestDataFactory.createSignUpDto();

		when(userRepository.findByEmail(userMock.getEmail())).thenReturn(Optional.of(userMock));
		when(userRepository.findByPhone(userMock.getPhone())).thenReturn(Optional.of(userMock));

		OwnException exception = assertThrows(OwnException.class, () -> authService.signUp(dto));

		List<ApiError.FieldError> errors = exception.getErrors();
		assertEquals(2, errors.size());
		assertTrue(errors.stream().anyMatch(e -> e.getField().equals("email")));
		assertTrue(errors.stream().anyMatch(e -> e.getField().equals("phone")));
	}

}
