package com.authkit.backend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Smoke test that boots the full application context against the in-memory H2
 * database (the "test" profile). If the wiring of any bean is broken, this fails
 * fast.
 */
@SpringBootTest
@ActiveProfiles("test")
class BackendApplicationTests {

	/** Passes if the application context starts; the test body is intentionally empty. */
	@Test
	void contextLoads() {
	}

}
