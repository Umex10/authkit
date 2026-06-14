# Customizing AuthKit for your project

AuthKit is meant to be a starting point. Here are the changes you'll most likely
make.

---

## Change the roles

The roles are deliberately generic (`USER`, `ADMIN`). To use your own:

1. **Backend** — edit the enum in
   `apps/backend/src/main/java/com/authkit/backend/auth/dto/requests/SignUpAccountRequestDto.java`:
   ```java
   public static enum Role { OWNER, DRIVER, ACCOUNTANT }
   ```
   That's the single source of truth — it flows automatically into the JWT
   authorities (`ROLE_OWNER`, …) and every `@PreAuthorize("hasRole('OWNER')")`.
2. **Web frontend** — update the union in `apps/web/types/User.ts` and the
   `<SelectItem>` options + the Zod `z.enum([...])` in
   `apps/web/app/sign-up/page.tsx`.
3. **Mobile frontend** — the same two changes in `apps/mobile/types/User.ts` and
   the `<Select>` `options` + Zod `z.enum([...])` in `apps/mobile/app/sign-up.tsx`.

---

## Add a protected endpoint

Backend — create a controller and read the authenticated user's id straight off
the request:

```java
@RestController
@SecurityRequirement(name = "bearerAuth") // shows the lock in Swagger
public class ProjectController {
    @GetMapping("/projects")
    public List<Project> mine(@RequestAttribute("userId") UUID userId) { ... }

    @PostMapping("/admin/thing")
    @PreAuthorize("hasRole('ADMIN')")
    public void adminOnly() { ... }
}
```

Frontend — add an RTK Query endpoint next to `apps/web/redux/api/apis/me.ts`:

```ts
const projectsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({ query: () => `/projects` }),
  }),
});
export const { useGetProjectsQuery } = projectsApi;
```

The access token is attached automatically. Put new pages under
`apps/web/app/(shell)/` and they're protected by `proxy.ts` + `AuthProvider` for free.

The mobile app is identical: add the same RTK Query endpoint under
`apps/mobile/redux/api/apis/` and put new screens under `apps/mobile/app/(shell)/`,
where `AuthProvider` protects them automatically.

---

## Re-theme

Colors and radius are CSS variables in `apps/web/app/globals.css` (a standard
shadcn/ui token set). Change `--primary` (and its dark-mode value) to rebrand.
The font is set in `apps/web/app/layout.tsx` (`next/font`).

On mobile the same violet tokens live in `apps/mobile/components/theme/themes.ts`
(the live light/dark values applied via NativeWind `vars()`), mirrored in
`apps/mobile/global.css` and `apps/mobile/tailwind.config.js`. Change `--primary`
in all three to match.

---

## Remove the fun gag 🎉

The celebratory confetti on the dashboard is 100% optional and fully isolated.
To remove it completely:

1. Delete the folder `apps/web/components/fun/`.
2. In `apps/web/app/(shell)/dashboard/page.tsx`, remove the `import { Celebration }`
   line and the `<Celebration />` usage (both are marked with a `FUN GAG` comment).
3. *(optional)* Delete the `FUN GAG` block at the bottom of `apps/web/app/globals.css`.
4. *(optional)* Delete the test `apps/web/__tests__/unit/Celebration.test.tsx`.

Nothing else depends on it — the dashboard becomes a plain welcome screen.

The mobile app has the same gag: delete `apps/mobile/components/fun/` and remove
the `Celebration` import + usage in `apps/mobile/app/(shell)/dashboard.tsx`.

The "tips" panel next to the auth forms (`apps/web/components/AuthTips.tsx`) is
separate from the gag; it's genuinely useful onboarding text. Replace it with
your own marketing, or remove the `<AuthTips />` usage in the sign-in/sign-up
pages if you prefer a single-column layout.

---

## Rename the project / package

- Backend Java package `com.authkit.backend` → your package (rename folders +
  the `package`/`import` statements; `groupId` in `pom.xml`).
- Database name, container names and the `JWT_SECRET` default live in
  `apps/backend/src/main/resources/application*.properties` and
  `docker-compose*.yml`.
- Frontend package names in `apps/web/package.json` and
  `apps/mobile/package.json` (plus the app `name`/`slug`/bundle identifiers in
  `apps/mobile/app.json`).
