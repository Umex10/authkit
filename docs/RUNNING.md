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
scripts/generate-jwt-keys.sh    # once after cloning, see "JWT keys" below
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

# 2. The backend (hot-reload via Spring DevTools; creates dev JWT keys on first start)
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
scripts/generate-jwt-keys.sh    # once after cloning, see "JWT keys" below
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

> **First time on a physical device?** This project uses a **development
> build** instead of Expo Go (Expo Go only supports one SDK version at a time,
> so it drifts out of sync). Fastest one-time setup: download the prebuilt APK
> from this repo's [Releases](../../releases) and install it — no EAS account,
> no cloud build, no waiting. You only need `eas build` yourself if you've
> changed a native dependency. Full details, including iOS, in
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
| `JWT_PRIVATE_KEY_LOCATION` | `file:./keys/private.pem` | RSA private key (PKCS#8 PEM) that signs the tokens (RS256). Keep it secret. |
| `JWT_PUBLIC_KEY_LOCATION` | `file:./keys/public.pem` | Matching public key (PEM). Verifies tokens and is published at `/.well-known/jwks.json`. |
| `JWT_GENERATE_MISSING_KEYS` | `true` (`false` in the Docker image) | Create a dev key pair on startup when neither key file exists. |
| `DB_URL` | `jdbc:postgresql://localhost:5432/authkit` | JDBC URL |
| `DB_USER` / `DB_PASSWORD` | `authkit` / `authkit` | DB credentials |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin(s), comma-separated, wildcards ok |

### JWT keys

The repository contains no keys (`keys/` is git-ignored). How you get them
depends on how you run the backend:

- **Directly (`./mvnw spring-boot:run`):** nothing to do. On the first start the
  backend sees that neither key file exists and writes a fresh dev pair to
  `apps/backend/keys/` (a warning in the log tells you so).
- **With Docker (`docker compose up`):** the container never generates keys, it
  mounts `apps/backend/keys/`. Create the pair once before the first start:

  ```bash
  scripts/generate-jwt-keys.sh
  ```

  The script never overwrites existing keys. It needs only `openssl` (on Windows
  use Git Bash or WSL).

These are **dev keys**: readable by everyone on your machine (the container runs
as another user and must read them) and meant only for local tokens.

**Production:** generate a separate pair, e.g. `scripts/generate-jwt-keys.sh
<folder outside the repo>`, store both files as a secret (Docker/Kubernetes
secret, cloud key vault) and let the platform mount them as files into the
container. Point `JWT_PRIVATE_KEY_LOCATION` / `JWT_PUBLIC_KEY_LOCATION` at
these files (e.g. `file:/run/secrets/jwt-private.pem`) and make sure the
container user (`authkit`, uid 1001) can read them. The image never generates
keys (`JWT_GENERATE_MISSING_KEYS=false`), so missing or unreadable keys stop the
backend at startup with an error that names the path. Never reuse the dev keys.

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
