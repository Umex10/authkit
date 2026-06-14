package com.authkit.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the AuthKit authentication microservice.
 *
 * <p>AuthKit is a self-contained, reusable JWT auth backend: sign-up, sign-in,
 * refresh-token rotation, role-based access and a ready-to-use Swagger UI. Drop
 * it next to any new project and you have authentication on day one.
 */
@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
