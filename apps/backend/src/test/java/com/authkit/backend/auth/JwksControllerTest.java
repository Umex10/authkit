package com.authkit.backend.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Web-layer test for {@link JwksController}.
 *
 * <p>
 * Checks that the public key is published as a JWK set with the expected
 * fields and that no private key material ever leaves the service.
 */
@WebMvcTest(JwksController.class)
public class JwksControllerTest {

    @Autowired
    private MockMvc mockMvc;

    /** The JWKS contains exactly one RSA signing key (n, e) and nothing private. */
    @Test
    void shouldCreateJwksJson() throws Exception {
        mockMvc.perform(get("/.well-known/jwks.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.keys").isArray())
                .andExpect(jsonPath("$.keys.length()").value(1))
                .andExpect(jsonPath("$.keys[0].kty").value("RSA"))
                .andExpect(jsonPath("$.keys[0].use").value("sig"))
                .andExpect(jsonPath("$.keys[0].alg").value("RS256"))
                .andExpect(jsonPath("$.keys[0].n").isNotEmpty())
                .andExpect(jsonPath("$.keys[0].e").value("AQAB"))
                .andExpect(jsonPath("$.keys[0].d").doesNotExist()); // "d" is the private exponent: it must never be published
    }

    /**
     * Provides the {@link RSAPublicKey} bean that {@code KeyConfig} supplies in
     * the real app ({@code @WebMvcTest} does not load {@code @Configuration}
     * classes). Static, so Spring can create it without a test instance.
     */
    @TestConfiguration
    static class TestKeyConfig {
        @Bean
        RSAPublicKey publicKey() throws Exception {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return (RSAPublicKey) generator.generateKeyPair().getPublic();
        }
    }
}
