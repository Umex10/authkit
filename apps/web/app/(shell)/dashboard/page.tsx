"use client";

import { useGetMeQuery } from "@/redux/api/apis/me";
import { Spinner } from "@/components/ui/loader";
// FUN GAG (optional): remove this import and the <Celebration/> usage below to
// turn the dashboard into a plain welcome screen.
import { Celebration } from "@/components/fun/Celebration";

/**
 * The post-login landing page.
 *
 * Reads the authenticated user from `GET /me` (proving the whole auth chain
 * works end to end) and greets them. The confetti celebration is an optional
 * "fun gag" — see components/fun/Celebration.tsx for how to remove it.
 */
export default function DashboardPage() {
  const { data: user, isLoading } = useGetMeQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10 py-10">
      {/* FUN GAG (optional) — confetti + a goofy subtitle. */}
      <Celebration />

      <div className="flex flex-col items-center gap-2 text-center">
        <h1
          data-testid="dashboard-welcome"
          className="text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          Du hast es geschafft{user?.name ? `, ${user.name}` : ""}! 🚀
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Du bist eingeloggt. Das bedeutet: Sign-up/Sign-in, der HTTP-only
          Refresh-Cookie, der Access-Token und die geschützte Route{" "}
          <code className="rounded bg-muted px-1 py-0.5">GET /me</code> haben alle
          funktioniert.
        </p>
      </div>

      {/* The authenticated user, straight from the protected /me endpoint. */}
      {user && (
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
            Dein Account (via <code>GET /me</code>)
          </h2>
          <dl className="flex flex-col gap-3 text-sm">
            <Row label="Name" value={user.name} />
            <Row label="E-Mail" value={user.email} />
            <Row label="Telefon" value={user.phone} />
            <Row
              label="Rolle"
              value={
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {user.role}
                </span>
              }
            />
          </dl>
        </div>
      )}

      <div className="w-full max-w-md rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Wie geht's weiter?</p>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
          <li>Baue deine Features unter <code>app/(shell)/</code> — sie sind automatisch geschützt.</li>
          <li>Neue API-Calls als RTK-Query-Endpoints neben <code>me.ts</code>.</li>
          <li>Rollen/Logik im Backend unter <code>com.authkit.backend</code>.</li>
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
