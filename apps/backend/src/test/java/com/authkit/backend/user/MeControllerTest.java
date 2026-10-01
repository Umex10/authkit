package com.authkit.backend.user;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.authkit.backend.auth.security.config.SecurityConfig;
import com.authkit.backend.common.entities.User;
import com.authkit.backend.common.repositories.UserRepository;
import com.authkit.backend.utils.TestDataFactory;

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
@Import(SecurityConfig.class)
public class MeControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private UserRepository userRepository;

	@Test
	void shouldReturnCurrentUser() throws Exception {
		User user = TestDataFactory.createDefaultUser();
		when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

		mockMvc.perform(get("/me").with(authenticatedAs(user)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value(user.getEmail()))
				.andExpect(jsonPath("$.role").value("USER"))
				.andExpect(jsonPath("$.password").doesNotExist());
	}

	@Test
	void shouldRejectAnonymousAccessToMe() throws Exception {
		mockMvc.perform(get("/me"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void shouldForbidAdminRouteForRegularUser() throws Exception {
		mockMvc.perform(get("/admin/ping").with(authenticatedAs(TestDataFactory.createDefaultUser()))) // role USER
				.andExpect(status().isForbidden());
	}

	@Test
	void shouldAllowAdminRouteForAdmin() throws Exception {
		mockMvc.perform(get("/admin/ping").with(authenticatedAs(TestDataFactory.createAdminUser()))) // role ADMIN
				.andExpect(status().isOk())
				.andExpect(content().string(org.hamcrest.Matchers.containsString("pong")));
	}

	/**
	 * Simulates a request that already passed token verification: puts a JWT
	 * (subject = user id) with the user's {@code ROLE_} authority into the
	 * security context.
	 */
	private static org.springframework.test.web.servlet.request.RequestPostProcessor authenticatedAs(User user) {
		return jwt()
				.jwt(token -> token.subject(user.getId().toString()))
				.authorities(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
	}
}
