# Running AuthKit

Three ways to run it, from "just show me" to "I want to develop on it".

---

## Prerequisites

- **Docker** (for the database, and optionally the backend)
- **Java 21** + the bundled Maven wrapper (`./mvnw`) — only if you run the backend outside Docker
- **Node.js 20+** — for either frontend
- **For the mobile app only:** an iOS simulator / Android emulator, or a physical phone with the project's own **dev client** installed (see below) — not Expo Go, since this project pins exact native module versions that Expo Go on the App/Play Store won't match

No global Maven and no global secrets manager needed; the Maven wrapper is
included and every config value has a built-in default.

---

## Option A — Docker for the backend, npm for the frontend (recommended)

```bash
# from the repo root
docker compose up -d            # Postgres + backend + Swagger UI mirror

cd apps/web
npm install
npm run dev                     # http://localhost:3000
```

Open http://localhost:3000 and register.

---

## Option B — Everything manual (best for backend development)

```bash
# 1. Just the database
docker compose up -d db

# 2. The backend (hot-reload via Spring DevTools)
cd apps/backend
./mvnw spring-boot:run          # http://localhost:8080/api/v1

# 3. The frontend
cd ../web
npm install
npm run dev                     # http://localhost:3000
```

---

## Option C — Full Docker (no local Node/Java at all for the API)

```bash
docker compose up --build
```

This builds and runs the backend image too. The frontend is intentionally **not**
containerised here (Next.js dev experience is best run locally), so still do
`cd apps/web && npm install && npm run dev`.

---

## Running the mobile app instead (React Native / Expo)

`apps/mobile` is a drop-in alternative to `apps/web` — same backend, same auth
flow. Run the backend exactly as above, then:

```bash
cd apps/mobile
npm install
npx expo start                  # press i (iOS), a (Android), or scan the QR
```

> **First time on a physical device?** This project uses an EAS **development
> build** instead of Expo Go (Expo Go only supports one SDK version at a time,
> so it drifts out of sync). One-time per device:
> `npm install -g eas-cli && eas login && eas build --platform android --profile development`
> — installs a custom "AuthKit" app you then point `npx expo start` at every
> time after. Full details, including iOS, in
> [apps/mobile/README.md](../apps/mobile/README.md).

> **`localhost` is the device, not your machine.** Set `EXPO_PUBLIC_BACKEND_URL`
> for anything other than the iOS simulator:
>
> | Where it runs | `EXPO_PUBLIC_BACKEND_URL` |
> | --- | --- |
> | iOS simulator | `http://localhost:8080` (default) |
> | Android emulator | `http://10.0.2.2:8080` |
> | Physical device | `http://<your-computer-LAN-IP>:8080` |
>
> Copy `apps/mobile/.env.example` to `apps/mobile/.env` to set it. Full details
> in [apps/mobile/README.md](../apps/mobile/README.md).

---

## Docker instances

| Service | Compose file | Container | Host port | What it is |
|---------|--------------|-----------|-----------|------------|
| `db` | `docker-compose.yml` | `authkit-db` | `5432` | PostgreSQL (user/pw/db all `authkit`) |
| `backend` | `docker-compose.yml` | `authkit-backend` | `8080` | The Spring Boot API, served under `/api/v1` |
| `swagger-ui` | `docker-compose.yml` | `authkit-swagger` | `8082` | A standalone Swagger UI mirroring the live spec |
| `db-test` | `docker-compose.test.yml` | `authkit-test-db` | `5433` | Throwaway PostgreSQL used by the e2e tests |

```bash
docker compose up -d            # main stack
docker compose down             # stop it (add -v to wipe the DB volume)
docker compose -f docker-compose.test.yml up -d   # just the test DB
```

---

## Ports

| Port | Used by |
|------|---------|
| 3000 | Next.js frontend (dev) |
| 8080 | Backend (default / Docker / `./mvnw spring-boot:run`) |
| 8081 | Backend when run with the `e2e` profile (Playwright) — also Expo's Metro bundler default, so don't run mobile + web-e2e at the same time |
| 8082 | Standalone Swagger UI container |
| 5432 | PostgreSQL (development) |
| 5433 | PostgreSQL (throwaway test database) |

---

## Environment variables

Everything has a default, so you only set these to override.

### Backend (`apps/backend`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `JWT_SECRET` | a dev secret | HS256 signing key — **must** be ≥ 256 bits. Override in production. |
| `DB_URL` | `jdbc:postgresql://localhost:5432/authkit` | JDBC URL |
| `DB_USER` / `DB_PASSWORD` | `authkit` / `authkit` | DB credentials |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin(s), comma-separated, wildcards ok |

Generate a strong secret with: `openssl rand -base64 48`.

### Web frontend (`apps/web`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:8080` | Base URL of the backend; the app appends `/api/v1` |

Copy `apps/web/.env.example` to `apps/web/.env.local` to change it.

### Mobile frontend (`apps/mobile`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `EXPO_PUBLIC_BACKEND_URL` | `http://localhost:8080` | Base URL of the backend; the app appends `/api/v1`. See the per-platform table above. |

Copy `apps/mobile/.env.example` to `apps/mobile/.env` to change it.

---

## Handy URLs

- App: http://localhost:3000
- Swagger UI (built into the backend, with the Authorize button): http://localhost:8080/api/v1/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api/v1/v3/api-docs
- Swagger UI mirror container: http://localhost:8082
