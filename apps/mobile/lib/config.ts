import { Platform } from "react-native";

/**
 * Base URL of the AuthKit backend.
 *
 * Read from `EXPO_PUBLIC_BACKEND_URL` with a localhost fallback, so the app runs
 * after a clone with zero configuration and can still be pointed at any backend
 * via the environment variable (see .env.example).
 *
 * Heads-up: on a real phone or the Android emulator, "localhost" is the device
 * itself — see .env.example for the per-platform URLs.
 */
export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/** Fully-qualified API root, including the Spring servlet context path. */
export const API_BASE_URL = `${BACKEND_URL}/api/v1`;

/** True when {@link BACKEND_URL} points at the loopback address. */
const usesLocalhost = /localhost|127\.0\.0\.1|\[::1\]/.test(BACKEND_URL);

/**
 * Human-friendly message for a failed network request.
 *
 * The default "is the backend running?" is misleading on a device/emulator: the
 * #1 first-run gotcha is that `localhost` resolves to the *device itself*, not
 * your computer, so even a perfectly healthy Docker backend is unreachable. When
 * the base URL is still loopback and we are not on web, point the user straight
 * at the real fix (set `EXPO_PUBLIC_BACKEND_URL`) instead of a Docker red
 * herring.
 */
export function networkErrorMessage(): string {
  if (usesLocalhost && Platform.OS !== "web") {
    return (
      `Could not reach the backend at ${BACKEND_URL}. On a phone or emulator ` +
      `"localhost" is the device itself — not your computer. Set ` +
      `EXPO_PUBLIC_BACKEND_URL to your machine and restart Expo:\n` +
      `  • Android emulator → http://10.0.2.2:8080\n` +
      `  • Physical device  → http://<your-computer-LAN-IP>:8080\n` +
      `See .env.example. (On the iOS simulator localhost is fine — then just ` +
      `make sure the backend is up: docker compose up -d.)`
    );
  }
  return "Network error — is the backend running?";
}
