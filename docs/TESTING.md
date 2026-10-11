# Testing

AuthKit has test layers across the backend and both frontends. All of them pass
out of the box.

| Layer | Tool | Location | What it proves |
|-------|------|----------|----------------|
| Backend unit, slice + integration | JUnit 5, Mockito, MockMvc, Spring Security Test | `apps/backend/src/test` | Token logic, key loading, sign-up rules, the auth endpoints, token verification, role-based access, the JWKS endpoint |
| Web unit | Vitest + Testing Library | `apps/web/__tests__/unit` | Pure helpers and components render correctly |
| Web end-to-end | Playwright (Chromium) | `apps/web/__tests__/e2e` | The real browser flow against the real backend + database |
| Mobile unit | Jest (`jest-expo`) + React Native Testing Library | `apps/mobile/__tests__` | Pure helpers and RN components (Button, Select) behave correctly |

---

## Backend tests

```bash
cd apps/backend
./mvnw test
```

Uses an **in-memory H2 database** in PostgreSQL-compatibility mode (the `test`
profile, `src/test/resources/application-test.properties`) — no Docker required,
runs in seconds.

No key files are needed either: the tests create their own RSA key
pair at runtime (`utils/TestKeys`).

`./mvnw verify` additionally writes a JaCoCo coverage report to
`apps/backend/target/site/jacoco/index.html` (the CI uploads it as the
`backend-reports` artifact).

The tests are split into three layers:

**Unit** (`unit/`, no Spring context, dependencies mocked):
- `JwtServiceTest`: access/refresh token claims, refresh token validation (wrong key, expired, malformed, wrong type, user gone), cookie extraction
- `AuthServiceTest`: sign-up with free/taken email and phone, sign-in with valid/invalid credentials
- `CustomUserDetailsServiceTest`: email lookup for the password check
- `RsaKeyFilesTest`: reading the PEM key files (valid, broken, unreadable) and a write/read round trip
- `DevKeyGeneratorTest`: the dev key pair is created only when both files are missing and the switch is on

**Slice** (`slice/`, `@WebMvcTest`: only the web layer, services mocked):
- `AuthControllerTest`: the three `/auth` endpoints, error envelopes, bean validation
- `MeControllerTest`: `/me` and `/admin/ping` through the real `SecurityConfig`, with real signed tokens and `@PreAuthorize`
- `JwksControllerTest`: the public JWKS endpoint, without any private key material

**Integration** (`integration/BackendApplicationTests`, the whole app, nothing mocked):
the real `KeyConfig` loads keys written to a temp folder; the Spring context
starts once and is shared by all tests, the database is emptied before each.
Covers sign-up → sign-in → `/me`, the refresh cookie (valid → new access
token, invalid → 401), admin vs. user role,
duplicate sign-up, the published JWKS, and a decoder built only from
`jwks.json` (as another microservice would) that accepts access tokens and
rejects refresh tokens.

---

## Frontend unit tests

```bash
cd apps/web
npm run test:unit          # one-shot
npm run test:unit:watch    # watch mode
```

Fast jsdom tests — no servers needed.

---

## Mobile unit tests

```bash
cd apps/mobile
npm install
npm test                   # one-shot (jest)
npm run test:watch         # watch mode
```

Runs under **`jest-expo`** with **React Native Testing Library** — pure Node, no
simulator or device needed. The suite covers the `cn` helper and the shared UI
primitives (`Button`, `Select`) the auth screens are built from.

> **End-to-end on mobile?** Browser-style Playwright doesn't apply to a native
> app. The equivalent would be **Maestro** or **Detox** driving a simulator/
> emulator — that needs a built app and a device, so it isn't wired into CI here.
> The auth flow itself is identical to the web app's (same backend, same RTK
> Query layer), which the web e2e suite already exercises end to end.

---

## End-to-end tests

The e2e suite runs the **whole stack**: a throwaway PostgreSQL, the backend on
the `e2e` profile (port 8081), and the Next.js frontend (port 3000). One command
orchestrates everything:

```bash
cd apps/web
npm run test:e2e
```

What that command does:
1. `docker compose -f docker-compose.test.yml up -d` — starts the throwaway DB on port **5433**.
2. Playwright starts **both** servers (frontend + backend) and waits until each
   answers before running any test — so there is no race against a still-booting
   backend.
3. Runs the specs: a `setup` project provisions an account and saves its cookie;
   the `features` project reuses that state and exercises sign-up redirects,
   duplicate-field errors, sign-in → dashboard (`GET /me`), and the
   wrong-credentials security path.
4. Tears the database back down.

Run it with the Playwright UI instead:

```bash
npm run test:e2e:ui
```

### Why a separate `e2e` profile and database?

So tests never touch your development data. `application-e2e.properties` points
the backend at the disposable Postgres on `5433`, recreates the schema on every
boot (`ddl-auto=create-drop`), and runs on port `8081` so it can sit next to a
normally-running dev backend on `8080`.
