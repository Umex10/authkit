# Backend flow — in detail (controller → service → repository → DB)

This document traces **every call** the Spring Boot backend makes, per endpoint,
all the way from the controller down to the repository and the database, including
the security filter chain and the error branches. If [ARCHITECTURE.md](ARCHITECTURE.md)
is the bird's-eye view, this is the wiring diagram.

All diagrams are Mermaid (rendered automatically by GitHub).

---

## 0. Bean / dependency graph

Who is injected into whom (constructor injection via Lombok `@RequiredArgsConstructor`),
grouped by layer.

```mermaid
flowchart TD
    subgraph web["Web layer (controllers)"]
        AC["AuthController<br/>/auth/**"]
        MC["MeController<br/>/me, /admin/**"]
        GEH["GlobalExceptionHandler<br/>@RestControllerAdvice"]
    end

    subgraph service["Service layer"]
        AS["AuthService"]
        JS["JwtService"]
    end

    subgraph security["Security layer"]
        SC["SecurityConfig<br/>(@Bean factory)"]
        JAF["JwtAuthFilter"]
        CUDS["CustomUserDetailsService<br/>implements UserDetailsService"]
        CUD["CustomUserDetails<br/>implements UserDetails"]
        AM["AuthenticationManager<br/>(Spring bean)"]
        PE["PasswordEncoder<br/>(delegating / bcrypt)"]
    end

    subgraph persistence["Persistence layer"]
        UR["UserRepository<br/>extends JpaRepository"]
        DB[("PostgreSQL<br/>users table")]
    end

    AC --> AS
    AC --> JS
    MC --> UR

    AS --> UR
    AS --> PE
    AS --> AM
    AS --> CUDS

    JS --> CUDS

    JAF --> JS
    CUDS --> UR
    CUDS -. "creates" .-> CUD
    AM -. "delegates to" .-> CUDS
    AM -. "verifies with" .-> PE

    SC -. "builds" .-> JAF
    SC -. "builds" .-> AM
    SC -. "builds" .-> PE

    UR --> DB

    AS -. "throws OwnException" .-> GEH
    AM -. "throws AuthenticationException" .-> GEH
    MC -. "throws AccessDeniedException" .-> GEH
```

> `UserDetailsService` is an interface; the concrete bean is
> `CustomUserDetailsService`. `AuthService`, `JwtService` and the Spring
> `AuthenticationManager` all resolve to it.

---

## 1. The security filter chain (runs before every controller)

Order of the filters in the one `SecurityFilterChain` built by `SecurityConfig`.
`JwtAuthFilter` is inserted just before `UsernamePasswordAuthenticationFilter`.

```mermaid
flowchart LR
    R["request"] --> SCHF["SecurityContextHolderFilter"]
    SCHF --> CORS["CorsFilter"]
    CORS --> JAF["JwtAuthFilter ⭐"]
    JAF --> AAF["AnonymousAuthenticationFilter"]
    AAF --> AZF["AuthorizationFilter<br/>(checks the route rules)"]
    AZF --> DS["DispatcherServlet → controller"]
```

Route rules (from `SecurityConfig.securityFilterChain`):

| Matcher | Rule |
|---------|------|
| `OPTIONS /**` | permit all (CORS pre-flight) |
| `/auth/**` | permit all (public) |
| `/swagger-ui/**`, `/v3/api-docs/**` | permit all |
| everything else | `authenticated()` |

> `JwtAuthFilter` is registered **only** inside this chain. A disabled
> `FilterRegistrationBean<JwtAuthFilter>` in `SecurityConfig` prevents Spring Boot
> from *also* registering it as a global servlet filter (which would run it twice).

---

## 2. `POST /auth/sign-up`

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant AC as AuthController
    participant AS as AuthService
    participant UR as UserRepository
    participant PE as PasswordEncoder
    participant JS as JwtService
    participant DB as PostgreSQL
    participant GEH as GlobalExceptionHandler

    C->>AC: POST /auth/sign-up (@Valid SignUpAccountRequestDto)
    Note over AC: @Valid runs Bean Validation first;<br/>failure → MethodArgumentNotValidException → GEH → 400
    AC->>AS: signUp(dto)
    AS->>UR: findByEmail(email)
    UR->>DB: SELECT … WHERE email = ?
    DB-->>UR: Optional<User>
    UR-->>AS: Optional<User>
    AS->>UR: findByPhone(phone)
    UR->>DB: SELECT … WHERE phone = ?
    DB-->>AS: Optional<User>

    alt email or phone already taken
        AS->>GEH: throw OwnException(fieldErrors)
        GEH-->>C: 400 ApiError { errors:[{field,message}] }
    else unique
        AS->>PE: encode(rawPassword)
        PE-->>AS: "{bcrypt}…" hash
        AS->>UR: save(User{…, password=hash})
        UR->>DB: INSERT INTO users …
        DB-->>AS: persisted User (with generated UUID)
        AS-->>AC: User
        AC->>JS: createAccessTk(email)
        JS-->>AC: access JWT (15 min)
        AC->>JS: createRefreshTk(email)
        JS-->>AC: refresh JWT (30 days)
        Note over AC: adds Cookie refresh_tk (HttpOnly, Path=/, 30d)
        AC-->>C: 201 { accessTk, expiresIn:900 } + Set-Cookie: refresh_tk
    end
```

---

## 3. `POST /auth/sign-in`

Note the two-step authentication: the `AuthenticationManager` verifies the
credentials (which itself loads the user + checks the password), and then
`AuthService` loads the `UserDetails` again to return it.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant AC as AuthController
    participant AS as AuthService
    participant AM as AuthenticationManager
    participant CUDS as CustomUserDetailsService
    participant UR as UserRepository
    participant PE as PasswordEncoder
    participant JS as JwtService
    participant DB as PostgreSQL
    participant GEH as GlobalExceptionHandler

    C->>AC: POST /auth/sign-in (@Valid SignInAccountRequestDto)
    AC->>AS: authenticate(email, password)
    AS->>AM: authenticate(UsernamePasswordAuthenticationToken)
    AM->>CUDS: loadUserByUsername(email)
    CUDS->>UR: findByEmail(email)
    UR->>DB: SELECT … WHERE email = ?
    DB-->>CUDS: User
    CUDS-->>AM: CustomUserDetails (authorities: ROLE_USER/ROLE_ADMIN)
    AM->>PE: matches(rawPassword, storedHash)

    alt bad credentials / unknown user
        AM->>GEH: throw AuthenticationException
        GEH-->>C: 401 ApiError { message:"The credentials are incorrect." }
    else ok
        AM-->>AS: Authentication (authenticated)
        AS->>CUDS: loadUserByUsername(email)  ⟵ second load
        CUDS->>UR: findByEmail(email)
        UR->>DB: SELECT …
        DB-->>AS: CustomUserDetails
        AS-->>AC: UserDetails
        AC->>JS: createAccessTk(email)
        AC->>JS: createRefreshTk(email)
        AC-->>C: 200 { accessTk, expiresIn:900 } + Set-Cookie: refresh_tk
    end
```

> **Detail worth knowing:** `loadUserByUsername` runs **twice** on sign-in — once
> inside the `AuthenticationManager` and once explicitly in `AuthService`. It's
> correct, just a minor optimization opportunity (the manager already returns the
> authenticated principal you could reuse).

---

## 4. `GET /auth/access-tk` (silent refresh)

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant AC as AuthController
    participant JS as JwtService
    participant CUDS as CustomUserDetailsService
    participant UR as UserRepository
    participant DB as PostgreSQL

    C->>AC: GET /auth/access-tk (Cookie: refresh_tk)
    AC->>JS: extractRefreshTk(request)
    Note over JS: reads the refresh_tk cookie value
    alt cookie missing/empty
        JS-->>AC: null
        AC-->>C: 401 "The refresh token is missing"
    else present
        JS-->>AC: refreshTk
        AC->>JS: validateTk(refreshTk)
        JS->>JS: extractEmail(tk) — parse + verify HS256 signature
        JS->>CUDS: loadUserByUsername(email)
        CUDS->>UR: findByEmail(email)
        UR->>DB: SELECT …
        DB-->>JS: CustomUserDetails
        JS-->>AC: UserDetails
        AC->>JS: createAccessTk(username)
        AC-->>C: 200 { accessTk, expiresIn:900 }  (refresh cookie NOT rotated)
    end
```

---

## 5. `GET /me` (protected route — the full chain)

This shows the filter authenticating the request *and* the controller handling it.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant JAF as JwtAuthFilter
    participant JS as JwtService
    participant CUDS as CustomUserDetailsService
    participant UR as UserRepository
    participant SCH as SecurityContextHolder
    participant MC as MeController
    participant DB as PostgreSQL

    C->>JAF: GET /me (Authorization: Bearer <accessTk>)
    JAF->>JS: extractAccessTk(request)
    JS-->>JAF: token (or null)
    alt token present & valid
        JAF->>JS: validateTk(token)
        JS->>JS: extractEmail(token) — verify signature
        JS->>CUDS: loadUserByUsername(email)
        CUDS->>UR: findByEmail(email)
        UR->>DB: SELECT …
        DB-->>CUDS: User
        CUDS-->>JS: CustomUserDetails
        JS-->>JAF: UserDetails
        JAF->>SCH: setAuthentication(UsernamePasswordAuthenticationToken)
        JAF->>JAF: request.setAttribute("userId", customUserDetails.getId())
    else token missing/invalid
        Note over JAF: no authentication set → AuthorizationFilter rejects → 403
    end
    JAF->>MC: continue chain → me(@RequestAttribute userId)
    MC->>UR: findById(userId)
    UR->>DB: SELECT … WHERE id = ?
    DB-->>MC: User
    MC->>MC: UserResponseDto.from(user)  (drops the password)
    MC-->>C: 200 { name, email, phone, role }
```

---

## 6. `GET /admin/ping` (role-based authorization)

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant JAF as JwtAuthFilter
    participant MSI as "@PreAuthorize interceptor"
    participant MC as MeController
    participant GEH as GlobalExceptionHandler

    C->>JAF: GET /admin/ping (Bearer accessTk)
    Note over JAF: authenticates as in §5,<br/>authorities = ROLE_USER or ROLE_ADMIN
    JAF->>MSI: invoke MeController.adminPing()
    Note over MSI: @PreAuthorize("hasRole('ADMIN')")
    alt role is ADMIN
        MSI->>MC: proceed
        MC-->>C: 200 "pong — you are an ADMIN 👑"
    else role is USER
        MSI->>GEH: throw AccessDeniedException
        GEH-->>C: 403 ApiError { message:"You do not have permission…" }
    end
```

---

## 7. Where each thing lives

| Concern | Class | Path |
|---------|-------|------|
| Public auth endpoints | `AuthController` | `auth/AuthController.java` |
| Sign-up rules + credential check | `AuthService` | `auth/AuthService.java` |
| JWT create/parse/extract | `JwtService` | `auth/JwtService.java` |
| Per-request auth | `JwtAuthFilter` | `auth/security/JwtAuthFilter.java` |
| Spring Security wiring | `SecurityConfig` | `auth/security/config/SecurityConfig.java` |
| Principal lookup | `CustomUserDetailsService` | `auth/security/CustomUserDetailsService.java` |
| `User` → `UserDetails` adapter | `CustomUserDetails` | `auth/security/CustomUserDetails.java` |
| Protected example routes | `MeController` | `user/MeController.java` |
| Entity | `User` | `common/entities/User.java` |
| Repository | `UserRepository` | `common/repositories/UserRepository.java` |
| Error → HTTP mapping | `GlobalExceptionHandler` | `common/exception/GlobalExceptionHandler.java` |
| Swagger / Authorize button | `OpenApiConfig` | `config/OpenApiConfig.java` |
