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

Scan the QR code with the **AuthKit dev client** (not Expo Go — see below),
or press **i** (iOS simulator) / **a** (Android emulator).

### 📲 Install the dev client on your phone (one time only)

This project uses a **development build** instead of Expo Go. Expo Go is a
generic app that only supports one SDK version at a time, so every SDK
release (or Play Store rollout delay) breaks it — that's the classic
`Project is incompatible with this version of Expo Go` error. A dev build is
a small custom "AuthKit" app built once from this exact project, so it never
goes out of sync — you only rebuild it if native dependencies change (rare),
never for routine SDK/version bumps.

There are three ways to get it onto your device — pick whichever fits:

**Option 1 — download the prebuilt APK (fastest, Android only)**

Grab the latest APK from this repo's **[Releases](../../../releases)** page
and install it directly — no Expo account, no build, no waiting:

```bash
adb install authkit-dev-client.apk
# or just copy the file to your phone and open it
```

Use this by default. The catch: it's only as fresh as the last time someone
published a release, so if you've added/changed a native dependency on your
own branch, it won't reflect that — build it yourself instead (Option 2 or 3).

**Option 2 — build it yourself in Expo's cloud (EAS Build)**

No local Android/iOS toolchain needed; Expo's servers do the compiling.

```bash
npm install -g eas-cli
eas login          # free Expo account
eas build --platform android --profile development
```

Takes ~10–15 min and prints a QR code / link at the end — scan it to install
the "AuthKit" app on your phone. (For iOS, use `--platform ios`; installing
on a physical iPhone additionally needs the device registered via
`eas device:create` because of Apple's signing requirements — see
[Expo's iOS device guide](https://docs.expo.dev/develop/development-builds/create-a-build/#install-and-open-the-app-on-a-device).)

**Option 3 — build it locally (`eas build --local`)**

Same output as Option 2, but compiles on your own machine instead of Expo's
cloud — no upload/queue wait, but you need the native Android toolchain
installed locally (Android SDK + a JDK; Gradle comes via the project). iOS
additionally requires a Mac with Xcode, so this only really applies to
Android on Linux/Windows.

```bash
npm install -g eas-cli
cd apps/mobile
eas build --platform android --profile development --local
```

**When do you actually need Option 2 or 3?** Only if you've added or upgraded
a *native* module (anything with native code, e.g. a new `expo-*` or
`react-native-*` package) — that's baked into the compiled app and can't be
live-reloaded. Pure JS/TS/UI changes never require a new build, on any
option: just `npx expo start` and reload.

**Every day after that:**

```bash
npx expo start
```

Open the **AuthKit** app on your phone (not Expo Go) — it connects to the
dev server over your LAN, same live-reload experience as Expo Go, but
without the version-lock problem. WiFi debugging / same-Wi-Fi as your
computer is all you need; no adb, no USB required for JS-only changes.

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

All `expo-*` and `react-native-*` packages are pinned to **exact** versions
(no `^`/`~`) so `npm install` always reproduces the same native module set —
see [Install the dev client](#-install-the-dev-client-on-your-phone-one-time-only)
if you still hit a version error.
