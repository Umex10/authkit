/**
 * Shape of the JSON payload returned by every successful auth endpoint.
 *
 * Mirrors the backend's `AuthResponseDto`: the short-lived access token plus its
 * remaining lifetime in seconds. The refresh token travels separately in a
 * `Set-Cookie` header; on mobile we stash it in the device keystore (see
 * actions/auth-action.ts) instead of relying on a cookie jar.
 */
export interface AuthResponseDto {
  accessTk: string;
  expiresIn: number;
}
