package com.authkit.backend.auth.config;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;

import com.authkit.backend.utils.TestKeys;

/**
 * Unit tests for {@link KeyConfig}.
 *
 * <p>
 * No Spring context and no key files: the PEM text is built in memory from the
 * key pair of {@link TestKeys} and handed over as a {@link ByteArrayResource}.
 * The happy path compares the parsed key with the original, so it checks that
 * the right key comes out and not only that the code runs. The error paths
 * check that a bad key source stops the start-up with a clear message.
 */
public class KeyConfigTest {

	private final KeyConfig keyConfig = new KeyConfig();

	/** The PEM private key is parsed into exactly the key it was built from. */
	@Test
	void shouldReadPrivateKey() {
		Resource pem = pem("PRIVATE", TestKeys.privateKey().getEncoded());

		RSAPrivateKey key = keyConfig.privateKey(pem);

		assertArrayEquals(TestKeys.privateKey().getEncoded(), key.getEncoded());
	}

	/** The PEM public key is parsed into exactly the key it was built from. */
	@Test
	void shouldReadPublicKey() {
		Resource pem = pem("PUBLIC", TestKeys.publicKey().getEncoded());

		RSAPublicKey key = keyConfig.publicKey(pem);

		assertArrayEquals(TestKeys.publicKey().getEncoded(), key.getEncoded());
	}

	/** Text that is not Base64 is rejected with a clear start-up error. */
	@Test
	void shouldRejectPrivateKeyThatIsNotBase64() {
		IllegalStateException ex = assertThrows(IllegalStateException.class,
				() -> keyConfig.privateKey(text("this is no key!!")));

		assertTrue(ex.getMessage().startsWith("Cannot read the JWT private key"));
		assertInstanceOf(IllegalArgumentException.class, ex.getCause());
	}

	/** Valid Base64 that is not a key structure is rejected. */
	@Test
	void shouldRejectPrivateKeyWithInvalidKeyBytes() {
		IllegalStateException ex = assertThrows(IllegalStateException.class,
				() -> keyConfig.privateKey(pem("PRIVATE", new byte[] { 1, 2, 3 })));

		assertTrue(ex.getMessage().startsWith("Cannot read the JWT private key"));
		assertInstanceOf(GeneralSecurityException.class, ex.getCause());
	}

	/** A key file that cannot be read (missing, no permission) is rejected. */
	@Test
	void shouldRejectUnreadablePrivateKey() {
		IllegalStateException ex = assertThrows(IllegalStateException.class,
				() -> keyConfig.privateKey(unreadable()));

		assertTrue(ex.getMessage().startsWith("Cannot read the JWT private key"));
		assertInstanceOf(IOException.class, ex.getCause());
	}

	/** Text that is not Base64 is rejected with a clear start-up error. */
	@Test
	void shouldRejectPublicKeyThatIsNotBase64() {
		IllegalStateException ex = assertThrows(IllegalStateException.class,
				() -> keyConfig.publicKey(text("this is no key!!")));

		assertTrue(ex.getMessage().startsWith("Cannot read the JWT public key"));
		assertInstanceOf(IllegalArgumentException.class, ex.getCause());
	}

	/** Valid Base64 that is not a key structure is rejected. */
	@Test
	void shouldRejectPublicKeyWithInvalidKeyBytes() {
		IllegalStateException ex = assertThrows(IllegalStateException.class,
				() -> keyConfig.publicKey(pem("PUBLIC", new byte[] { 1, 2, 3 })));

		assertTrue(ex.getMessage().startsWith("Cannot read the JWT public key"));
		assertInstanceOf(GeneralSecurityException.class, ex.getCause());
	}

	/** A key file that cannot be read (missing, no permission) is rejected. */
	@Test
	void shouldRejectUnreadablePublicKey() {
		IllegalStateException ex = assertThrows(IllegalStateException.class,
				() -> keyConfig.publicKey(unreadable()));

		assertTrue(ex.getMessage().startsWith("Cannot read the JWT public key"));
		assertInstanceOf(IOException.class, ex.getCause());
	}

	/** The error message names the resource, so the broken path is easy to find. */
	@Test
	void shouldNameTheResourceInTheErrorMessage() {
		Resource broken = new ByteArrayResource("x".getBytes(StandardCharsets.UTF_8), "classpath:keys/public.pem");

		IllegalStateException ex = assertThrows(IllegalStateException.class, () -> keyConfig.publicKey(broken));

		assertTrue(ex.getMessage().contains("classpath:keys/public.pem"));
	}

	/** Builds PEM text ({@code BEGIN/END <label> KEY}, Base64 body in 64-character lines). */
	private static Resource pem(String label, byte[] encodedKey) {
		String body = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.UTF_8)).encodeToString(encodedKey);
		return text("-----BEGIN " + label + " KEY-----\n" + body + "\n-----END " + label + " KEY-----\n");
	}

	/** Wraps plain text as an in-memory {@link Resource}. */
	private static Resource text(String content) {
		return new ByteArrayResource(content.getBytes(StandardCharsets.UTF_8));
	}

	/** A resource whose stream cannot be opened, like a missing key file. */
	private static Resource unreadable() {
		return new ByteArrayResource(new byte[0]) {
			@Override
			public InputStream getInputStream() throws IOException {
				throw new IOException("file not found");
			}
		};
	}
}
