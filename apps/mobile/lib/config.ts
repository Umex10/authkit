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
