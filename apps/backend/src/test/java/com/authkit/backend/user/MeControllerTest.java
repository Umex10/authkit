package com.authkit.backend.user;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.authkit.backend.auth.JwtService;
import com.authkit.backend.auth.security.CustomUserDetails;
import com.authkit.backend.auth.security.config.SecurityConfig;
import com.authkit.backend.common.entities.User;
import com.authkit.backend.common.repositories.UserRepository;
import com.authkit.backend.utils.TestDataFactory;

import static org.mockito.Mockito.mock;

/**
 * Integration test for the protected {@link MeController} routes, exercised
 * through the real {@link SecurityConfig} filter chain (incl. method security).
 *
 * <p>Demonstrates that the JWT-based authentication, the {@code userId} request
 * attribute and the role-based {@code @PreAuthorize} checks all behave end to
 * end.
 */
@WebMvcTest(MeController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import({ MeControllerTest.MockJwtServiceConfig.class, SecurityConfig.class })
public class MeControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JwtService jwtService;

	@MockitoBean
	private UserRepository userRepository;

	@TestConfiguration
	static class MockJwtServiceConfig {
		@Bean
		public JwtService jwtService() {
			return mock(JwtService.class);
		}
	}

	@Test
	void shouldReturnCurrentUser() throws Exception {
		User user = TestDataFactory.createDefaultUser();
		stubValidTokenFor(user);
		when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

		mockMvc.perform(get("/me").header("Authorization", "Bearer tk"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value(user.getEmail()))
				.andExpect(jsonPath("$.role").value("USER"))
				.andExpect(jsonPath("$.password").doesNotExist());
	}

	@Test
	void shouldRejectAnonymousAccessToMe() throws Exception {
		when(jwtService.extractAccessTk(any())).thenReturn(null);

		mockMvc.perform(get("/me"))
				.andExpect(status().isForbidden());
	}

	@Test
	void shouldForbidAdminRouteForRegularUser() throws Exception {
		stubValidTokenFor(TestDataFactory.createDefaultUser()); // role USER

		mockMvc.perform(get("/admin/ping").header("Authorization", "Bearer tk"))
				.andExpect(status().isForbidden());
	}

	@Test
	void shouldAllowAdminRouteForAdmin() throws Exception {
		stubValidTokenFor(TestDataFactory.createAdminUser()); // role ADMIN

		mockMvc.perform(get("/admin/ping").header("Authorization", "Bearer tk"))
				.andExpect(status().isOk())
				.andExpect(content().string(org.hamcrest.Matchers.containsString("pong")));
	}

	/** Wires the mocked {@link JwtService} so any bearer token resolves to {@code user}. */
	private void stubValidTokenFor(User user) {
		when(jwtService.extractAccessTk(any())).thenReturn("tk");
		when(jwtService.validateTk("tk")).thenReturn(new CustomUserDetails(user));
	}
}
