# Testing

AuthKit has test layers across the backend and both frontends. All of them pass
out of the box.

| Layer | Tool | Location | What it proves |
|-------|------|----------|----------------|
| Backend unit + integration | JUnit 5, MockMvc, Spring Security Test | `apps/backend/src/test` | Token logic, sign-up rules, the auth endpoints, the JWT filter, role-based access |
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

What's covered:
- `JwtServiceTest` — token creation, validation, extraction (header & cookie)
- `AuthServiceTest` — sign-up happy path + duplicate email/phone
- `AuthControllerTest` — all three auth endpoints, error envelopes, bean validation
- `JwtAuthFilterTest` — the filter authenticates a request and exposes `userId`
- `MeControllerTest` — protected `/me`, and `@PreAuthorize` allowing/forbidding `/admin/ping`

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
