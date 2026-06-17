# 📱 AuthKit — Mobile (React Native)

The **React Native** twin of `apps/web`. Same backend, same auth flow, same
screens — just native. Pick this app if your product is a mobile app; pick
`apps/web` (Next.js) if it's a website. They are interchangeable frontends for
the one Spring Boot backend in `apps/backend`.

Built with **Expo + Expo Router**, **NativeWind** (Tailwind for RN),
**Redux Toolkit Query**, **react-hook-form + Zod** — deliberately mirroring the
web app so the two are easy to read side by side.

---

## 🚀 Quick start

```bash
# 1. Start the database + backend (from the repo root)
docker compose up -d

# 2. Start the mobile app
cd apps/mobile
npm install
npx expo start
```

Then press **i** (iOS simulator), **a** (Android emulator), or scan the QR code
with the **Expo Go** app on your phone.

> The project tracks the **latest Expo SDK** so it runs in the Expo Go build
> that's currently in the App/Play Store. If your local Expo CLI ever drifts from
> the pinned versions, run `npx expo install --fix` once to realign.

### 📱 Running on a physical device? Do this first

This is the #1 first-run gotcha. On a real phone (and on the Android emulator),
**`localhost` points at the device itself, not your computer**, so the app can't
reach the backend — you'll see a network error that looks like "backend not
running" even though Docker is perfectly fine.

Point the app at your computer instead, then restart Expo:

```bash
cp .env.example .env
# then set EXPO_PUBLIC_BACKEND_URL in .env:
#   • Physical device  → http://<your-computer-LAN-IP>:8080   (e.g. http://192.168.1.20:8080)
#   • Android emulator → http://10.0.2.2:8080
#   • iOS simulator    → http://localhost:8080  (the default — nothing to change)
```

Find your LAN IP with `ip addr` (Linux) / `ifconfig` (macOS) / `ipconfig`
(Windows). The full table is also in [`.env.example`](.env.example).

### ✅ Verify the backend is reachable

```bash
# Backend is alive on your computer (a 404 on "/" is fine — it means the server answered):
curl -i http://localhost:8080

# Reachable from your phone: open this in the phone's browser (same Wi-Fi):
#   http://<your-computer-LAN-IP>:8080
```

If the phone can't reach it: allow the port through your firewall
(`sudo ufw allow 8080` on Linux) and make sure Docker maps it on all interfaces
(`8080:8080`, i.e. `0.0.0.0`, **not** `127.0.0.1:8080:8080`).

---

## 🌐 Pointing the app at your backend (important)

On a phone or emulator, **`localhost` means the device itself, not your
computer.** Set `EXPO_PUBLIC_BACKEND_URL` accordingly (copy `.env.example` → `.env`):

| Where you run the app | `EXPO_PUBLIC_BACKEND_URL`            |
| --------------------- | ----------------------------------- |
| iOS simulator         | `http://localhost:8080` (default)   |
| Android emulator      | `http://10.0.2.2:8080`              |
| Physical device       | `http://<your-computer-LAN-IP>:8080` |

(Find your LAN IP with `ip addr` / `ifconfig` — e.g. `http://192.168.1.20:8080`.)

---

## 🔑 How auth differs from the web app

The contract with the backend is **identical** — no server changes. The only
difference is *where the refresh token lives*:

| Concern               | Web (`apps/web`)                          | Mobile (`apps/mobile`)                          |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| Refresh token storage | HTTP-only cookie via **Server Actions**   | **expo-secure-store** (OS keystore)             |
| Reading `Set-Cookie`  | Next.js parses it server-side             | RN reads the header and extracts `refresh_tk`   |
| Sending the refresh   | Browser cookie jar                        | Explicit `Cookie: refresh_tk=…` header          |
| Route protection      | `proxy.ts` middleware                     | `AuthProvider` + `Redirect` (see `app/(shell)`) |
| Access token          | RTK Query cache (in-memory)               | RTK Query cache (in-memory) — same              |

Everything else — `redux/`, the RTK Query endpoints, the Zod schemas, the auth
state machine — is a near 1:1 copy of the web app.

### Convenience redirect (already signed in)

Like the web app's `proxy.ts`, the mobile app skips the landing/auth screens when
you already have a valid refresh token: `app/index.tsx` checks the keystore on
mount and `router.replace`s to `/dashboard?redirected=1`, and the dashboard shows
a short "you're already signed in" note. Tapping the AuthKit logo navigates to
`/`, which triggers exactly this bounce — the same demo as clicking the logo on
the web.

---

## 🧪 Tests

```bash
npm test            # jest-expo + React Native Testing Library (pure Node)
npm run test:watch
```

Covers the `cn` helper and the shared UI primitives (`Button`, `Select`). No
simulator needed. See [docs/TESTING.md](../../docs/TESTING.md) for the full
testing story (and why native e2e is a separate, device-bound concern).

---

## 🗺️ Project layout (mirrors `apps/web`)

```
apps/mobile/
├── app/                       Expo Router screens (= Next.js App Router)
│   ├── _layout.tsx            root layout + providers
│   ├── index.tsx              landing            (= app/page.tsx)
│   ├── sign-in.tsx            sign-in            (= app/sign-in/page.tsx)
│   ├── sign-up.tsx            sign-up            (= app/sign-up/page.tsx)
│   └── (shell)/               protected group    (= app/(shell)/)
│       ├── _layout.tsx        AuthProvider gate + top bar
│       └── dashboard.tsx      the post-login screen
├── actions/auth-action.ts     fetch + keystore (= web server actions)
├── redux/                     store + RTK Query endpoints (≈ identical)
├── components/                ui/ primitives + AuthProvider, AuthTips, …
├── types/                     User, AuthResponseDto (identical)
├── lib/                       config, utils (cn)
├── global.css                 design tokens (= web globals.css)
└── tailwind.config.js         NativeWind theme
```

---

## 🛠️ Tech stack

Expo SDK 56 · Expo Router · React Native 0.85 · React 19 · NativeWind v4 ·
Redux Toolkit Query · react-hook-form + Zod · sonner-native (toasts) ·
expo-secure-store · react-native-confetti-cannon (the optional fun gag).
