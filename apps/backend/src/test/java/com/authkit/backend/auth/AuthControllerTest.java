package com.authkit.backend.auth;

import static org.hamcrest.Matchers.hasItems;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.authkit.backend.auth.dto.requests.SignInAccountRequestDto;
import com.authkit.backend.auth.dto.requests.SignUpAccountRequestDto;
import com.authkit.backend.common.entities.User;
import com.authkit.backend.common.exception.ApiError;
import com.authkit.backend.common.exception.OwnException;
import com.authkit.backend.utils.TestDataFactory;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Web-layer tests for {@link AuthController}.
 *
 * <p>Drives the three public endpoints through MockMvc with the service and JWT
 * layers mocked, asserting status codes, the {@code AuthResponseDto} shape and
 * the error envelopes produced by the global exception handler.
 */
@WebMvcTest(AuthController.class)
@Import(ObjectMapper.class)
public class AuthControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@MockitoBean
	private AuthService authService;

	@MockitoBean
	private JwtService jwtService;

	@Test
	void shouldSignUpAccount() throws Exception {
		User userMock = TestDataFactory.createDefaultUser();
		SignUpAccountRequestDto dto = TestDataFactory.createSignUpDto();
		String jsonRequest = objectMapper.writeValueAsString(dto);

		when(authService.signUp(dto)).thenReturn(userMock);
		when(jwtService.createAccessTk(any())).thenReturn("mock-access-token");
		when(jwtService.createRefreshTk(any())).thenReturn("mock-refresh-token");

		mockMvc.perform(post("/auth/sign-up")
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonRequest))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.accessTk").isString())
				.andExpect(jsonPath("$.accessTk").isNotEmpty())
				.andExpect(jsonPath("$.expiresIn").isNumber())
				.andExpect(jsonPath("$.expiresIn").value(900));
	}

	@Test
	void shouldNotSignUpAccount() throws Exception {
		SignUpAccountRequestDto dto = TestDataFactory.createSignUpDto();
		String jsonRequest = objectMapper.writeValueAsString(dto);
		List<ApiError.FieldError> errors = List.of(
				ApiError.FieldError.builder().field("email").message("The used email is already taken.").build(),
				ApiError.FieldError.builder().field("phone").message("The used phone is already taken.").build());
		when(authService.signUp(dto)).thenThrow(new OwnException(errors));

		mockMvc.perform(post("/auth/sign-up")
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonRequest))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.errors").isArray())
				.andExpect(jsonPath("$.errors[*].field").value(hasItems("email", "phone")));
	}

	@Test
	void shouldRejectInvalidSignUpPayload() throws Exception {
		// Missing/blank fields must be rejected by bean validation and surfaced
		// in the same ApiError shape (errors[].field) the frontend already maps.
		String invalidJson = "{\"name\":\"\",\"email\":\"not-an-email\",\"phone\":\"\",\"password\":\"123\"}";

		mockMvc.perform(post("/auth/sign-up")
				.contentType(MediaType.APPLICATION_JSON)
				.content(invalidJson))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.errors").isArray());
	}

	@Test
	void shouldSignIn() throws Exception {
		SignInAccountRequestDto dto = TestDataFactory.createSignInDto();
		String jsonRequest = objectMapper.writeValueAsString(dto);
		UserDetails userDetailsMock = mock(UserDetails.class);
		when(authService.authenticate(any(), any())).thenReturn(userDetailsMock);
		when(userDetailsMock.getUsername()).thenReturn("username");
		when(jwtService.createAccessTk(any())).thenReturn("mock-access-token");
		when(jwtService.createRefreshTk(any())).thenReturn("mock-refresh-token");

		mockMvc.perform(post("/auth/sign-in")
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonRequest))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessTk").isString())
				.andExpect(jsonPath("$.accessTk").isNotEmpty())
				.andExpect(jsonPath("$.expiresIn").isNumber())
				.andExpect(jsonPath("$.expiresIn").value(900));
	}

	@Test
	void shouldNotSignIn() throws Exception {
		SignInAccountRequestDto dto = TestDataFactory.createSignInDto();
		String jsonRequest = objectMapper.writeValueAsString(dto);

		when(authService.authenticate(any(), any())).thenThrow(new BadCredentialsException("Invalid credentials"));

		mockMvc.perform(post("/auth/sign-in")
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonRequest))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.status").value(401))
				.andExpect(jsonPath("$.errors").doesNotExist());
	}

	@Test
	void shouldCreateAccessTk() throws Exception {
		UserDetails userDetailsMock = mock(UserDetails.class);
		when(jwtService.extractRefreshTk(any())).thenReturn("Token");
		when(jwtService.validateTk(any())).thenReturn(userDetailsMock);
		when(userDetailsMock.getUsername()).thenReturn("username");
		when(jwtService.createAccessTk(any())).thenReturn("mock-access-token");

		mockMvc.perform(get("/auth/access-tk"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessTk").isString())
				.andExpect(jsonPath("$.accessTk").isNotEmpty())
				.andExpect(jsonPath("$.expiresIn").isNumber())
				.andExpect(jsonPath("$.expiresIn").value(900));
	}

	@Test
	void shouldNotCreateAccessTk() throws Exception {
		when(jwtService.extractRefreshTk(any())).thenReturn(null);

		mockMvc.perform(get("/auth/access-tk"))
				.andExpect(status().isUnauthorized());
	}

}
