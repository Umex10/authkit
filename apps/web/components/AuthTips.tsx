import { API_BASE_URL } from "@/lib/config";

/**
 * The right-hand "how this works" panel shown next to the auth forms.
 *
 * It's genuinely useful documentation for anyone who just cloned AuthKit: it
 * explains, in-place, what happens when you submit the form and where to look
 * next. Feel free to replace it with your own product marketing once you build
 * on top of AuthKit.
 */
export function AuthTips({
  variant,
}: {
  variant: "sign-in" | "sign-up";
}) {
  const tips =
    variant === "sign-up"
      ? [
          "Deine Daten gehen an POST /auth/sign-up im Spring-Backend.",
          "Das Passwort wird serverseitig gehasht — niemals im Klartext gespeichert.",
          "Du bekommst sofort einen Access-Token + einen HTTP-only Refresh-Cookie.",
          "Danach wirst du automatisch aufs Dashboard weitergeleitet.",
        ]
      : [
          "Deine Eingaben gehen an POST /auth/sign-in.",
          "Bei Erfolg setzt das Backend den refresh_tk-Cookie (HTTP-only).",
          "Der kurzlebige Access-Token landet im RTK-Query-Cache.",
          "proxy.ts schützt alle Routen außer /, /sign-in und /sign-up.",
        ];

  return (
    <aside className="hidden w-1/2 flex-col justify-center gap-8 bg-primary px-16 text-primary-foreground lg:flex">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          <span className="text-lg font-semibold tracking-tight">AuthKit</span>
        </div>
        <h2 className="text-2xl font-bold leading-tight">
          {variant === "sign-up"
            ? "Ein Account, in Sekunden."
            : "Willkommen zurück."}
        </h2>
        <p className="text-sm leading-relaxed opacity-80">
          Ein wiederverwendbares Auth-System: Spring Boot + Next.js, JWT,
          Rollen, Swagger und Tests. Klonen, starten, loslegen.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {tips.map((tip) => (
          <li key={tip} className="flex items-start gap-2.5 text-sm opacity-90">
            <span className="mt-0.5 shrink-0">✦</span>
            <span className="leading-snug">{tip}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-lg bg-white/10 px-4 py-3 text-xs leading-relaxed opacity-90">
        <p className="font-semibold">Tipp für Entwickler:innen</p>
        <p className="mt-1">
          Die API-Routen erkundest du live unter{" "}
          <code className="rounded bg-white/15 px-1 py-0.5">
            {API_BASE_URL}/swagger-ui.html
          </code>{" "}
          — inkl. „Authorize 🔒"-Button.
        </p>
      </div>
    </aside>
  );
}
