# Architecture & flow diagrams

This document explains how AuthKit's pieces fit together and — most importantly —
**which service calls which, and in what order**. All diagrams are Mermaid, so
GitHub renders them automatically.

---

## 1. The components

```mermaid
flowchart TB
    subgraph Browser
        UI["Next.js pages<br/>sign-in · sign-up · dashboard"]
        RTK["Redux Toolkit Query cache<br/>(holds the access token)"]
    end

    subgraph "Next.js server (BFF)"
        PROXY["proxy.ts<br/>route protection"]
        ACTIONS["Server Actions<br/>auth-action.ts"]
    end

    subgraph "Spring Boot — AuthKit API (/api/v1)"
        SEC["SecurityConfig + JwtAuthFilter"]
        AUTH["AuthController /auth/**"]
        ME["MeController /me, /admin/**"]
        JWT["JwtService"]
        DB[("PostgreSQL<br/>users")]
    end

    UI --> RTK
    UI -->|"navigations"| PROXY
    UI -->|"mutations/queries"| ACTIONS
    RTK -->|"Bearer access token"| ME
    ACTIONS -->|"HTTP + refresh cookie"| AUTH
    AUTH --> JWT
    AUTH --> DB
    SEC --> ME
    ME --> DB
```

**Why a BFF?** The auth calls go through **Next.js Server Actions**, not directly
from the browser. That lets the server read/write the `refresh_tk` cookie as
**HTTP-only** — it is never exposed to client-side JavaScript. The short-lived
access token, by contrast, lives only in the RTK Query cache in memory and is
attached as a `Bearer` header to normal API calls.

---

## 2. Sign-up

```mermaid
sequenceDiagram
    autonumber
    participant U as Browser (form)
    participant A as Next.js Server Action
    participant B as Spring Boot API
    participant DB as PostgreSQL

    U->>A: signUp(values) via RTK mutation
    A->>B: POST /api/v1/auth/sign-up { name, email, phone, password, role }
    B->>DB: unique email & phone check
    alt email or phone taken
        B-->>A: 400 ApiError { errors:[{field,message}] }
        A-->>U: errors replayed onto the form fields
    else ok
        B->>DB: save user (password hashed)
        B-->>A: 201 { accessTk, expiresIn } + Set-Cookie: refresh_tk (HttpOnly)
        A-->>U: store cookie (server) + cache access token (RTK)
        U->>U: redirect to /dashboard
    end
```

---

## 3. Sign-in

```mermaid
sequenceDiagram
    autonumber
    participant U as Browser (form)
    participant A as Next.js Server Action
    participant B as Spring Boot API

    U->>A: signIn(email, password) via RTK mutation
    A->>B: POST /api/v1/auth/sign-in
    alt wrong credentials
        B-->>A: 401 ApiError { message: "The credentials are incorrect." }
        A-->>U: error toast (no per-field hint — no account enumeration)
    else ok
        B-->>A: 200 { accessTk, expiresIn } + Set-Cookie: refresh_tk
        A-->>U: cache access token, redirect to /dashboard
    end
```

---

## 4. Loading the protected dashboard (silent refresh + /me)

```mermaid
sequenceDiagram
    autonumber
    participant U as Browser
    participant P as proxy.ts (middleware)
    participant AP as AuthProvider
    participant A as Server Action
    participant B as Spring Boot API

    U->>P: GET /dashboard
    alt no refresh_tk cookie
        P-->>U: 307 redirect to /sign-in
    else cookie present
        P-->>U: allow
        U->>AP: render (shell) layout
        AP->>A: getAccessTk()
        A->>B: GET /api/v1/auth/access-tk (Cookie: refresh_tk)
        B-->>A: 200 { accessTk }
        A-->>AP: access token cached in RTK
        AP->>B: GET /api/v1/me (Authorization: Bearer accessTk)
        B-->>AP: 200 { name, email, phone, role }
        AP-->>U: render dashboard 🎉
    end
```

---

## 5. How a request gets authenticated on the backend

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant F as JwtAuthFilter
    participant J as JwtService
    participant UDS as CustomUserDetailsService
    participant H as Controller

    C->>F: request with Authorization: Bearer <accessTk>
    F->>J: validateTk(accessTk)
    J->>UDS: loadUserByUsername(email from token subject)
    UDS-->>J: CustomUserDetails (role -> ROLE_USER / ROLE_ADMIN)
    J-->>F: UserDetails
    F->>F: set SecurityContext + request attribute "userId"
    F->>H: continue chain
    H-->>C: response (or 403 if @PreAuthorize role check fails)
```

The filter is registered **only** inside the Spring Security chain (a disabled
`FilterRegistrationBean` stops Spring Boot from also wiring it up as a global
servlet filter, which would otherwise run it twice). See
[SECURITY.md](SECURITY.md) for the details.

> Want the *fully detailed* call graph — every hop from controller through
> service to repository and database, the bean dependency graph and the filter
> chain order? See **[BACKEND_FLOW.md](BACKEND_FLOW.md)**.

---

## 6. Token & cookie model

| Token | Lifetime | Where it lives | Sent how |
|-------|----------|----------------|----------|
| **Access token** | 15 minutes | RTK Query cache (memory) | `Authorization: Bearer …` header |
| **Refresh token** | 30 days | `refresh_tk` **HTTP-only** cookie | automatically by the browser to the BFF |

The backend is **stateless** — it stores no sessions. Signing out simply deletes
the refresh cookie; any still-valid access token expires on its own within 15
minutes.
