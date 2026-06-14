# Security model & production hardening

## The model

- **Stateless JWT.** The backend stores no sessions. Every request is
  authenticated purely from its `Authorization: Bearer <accessTk>` header by
  `JwtAuthFilter`.
- **Two tokens, two lifetimes.**
  - *Access token* (15 min): returned in the JSON body, kept in memory (the RTK
    Query cache), sent as a Bearer header. Short-lived to limit blast radius.
  - *Refresh token* (30 days): delivered as an **HTTP-only** cookie (`refresh_tk`)
    so client-side JavaScript can never read it — this mitigates token theft via XSS.
- **The BFF pattern (web).** The browser never talks to the auth endpoints
  directly; Next.js Server Actions do, server-side, so the refresh cookie stays
  HTTP-only end to end.
- **Mobile token storage.** A native app has no cookie jar to trust, so
  `apps/mobile` reads the refresh token from the `Set-Cookie` header and keeps it
  in the **OS keystore** (`expo-secure-store` → iOS Keychain / Android Keystore),
  replaying it as a `Cookie:` header on refresh. The access token stays in memory
  (RTK Query cache), exactly like on the web.
- **Passwords** are hashed with Spring Security's delegating `PasswordEncoder`
  (bcrypt by default) — never stored or logged in clear text.
- **No account enumeration.** Wrong credentials return a generic
  `401 "The credentials are incorrect."` with no hint about which field was wrong.
- **Roles** map to Spring authorities (`USER` → `ROLE_USER`) and are enforced
  with `@PreAuthorize` (see `MeController#adminPing`).

## Two subtle bugs this codebase already fixes

1. **Double-registered filter.** Because `JwtAuthFilter` is a Spring bean, Spring
   Boot would also auto-register it as a *global* servlet filter — running it
   twice, with the security chain's `SecurityContextHolderFilter` wiping the
   authentication on the second pass (every request ends up anonymous). A
   disabled `FilterRegistrationBean<JwtAuthFilter>` in `SecurityConfig` stops the
   auto-registration so the filter runs exactly once, inside the chain.
2. **`@PreAuthorize` → 500 instead of 403.** Method-security denials throw
   `AccessDeniedException` during the controller invocation, where a catch-all
   `@ExceptionHandler(Exception.class)` would turn it into a 500. An explicit
   `AccessDeniedException` handler maps it to a clean **403**.

## Before you ship to production

- [ ] **Set a real `JWT_SECRET`** (`openssl rand -base64 48`) via env — never use the dev default.
- [ ] **Serve over HTTPS** and set the refresh cookie's `secure` flag to `true`
      — in `AuthController#createAuthResponseDto` (backend) and in
      `setRefreshCookie` (`apps/web/actions/auth-action.ts`). Mobile keeps the
      token in the keystore (no cookie flag to set), but it must talk to the
      backend over HTTPS too — set `EXPO_PUBLIC_BACKEND_URL` to an `https://` URL.
- [ ] **Lock down CORS** via `FRONTEND_URL` to your real origin(s); drop the
      localhost defaults in `SecurityConfig` if you don't need them.
- [ ] **Switch the schema strategy.** `ddl-auto=update` is convenient for getting
      started; use a migration tool (Flyway/Liquibase) for production.
- [ ] Consider **refresh-token rotation / revocation** if your threat model needs
      it (the current refresh endpoint does not rotate the cookie).
- [ ] Add **rate limiting** on `/auth/**` to slow brute-force attempts.
