import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  {
    icon: "🔐",
    title: "JWT, richtig gemacht",
    text: "Kurzlebiger Access-Token + HTTP-only Refresh-Cookie. Stateless, sicher, fertig.",
  },
  {
    icon: "🧩",
    title: "Rollen & @PreAuthorize",
    text: "USER/ADMIN out of the box, methoden­basierte Autorisierung inklusive.",
  },
  {
    icon: "⚡",
    title: "Next.js + RTK Query",
    text: "Server Actions halten Tokens serverseitig, RTK Query cached den Rest.",
  },
  {
    icon: "📖",
    title: "Swagger & Tests",
    text: "Live-API-Docs mit Authorize-Button und eine grüne Testsuite.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-xl">🔐</span>
            <span>AuthKit</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="rounded-full px-4"
              data-testid="landing-sign-in-link"
            >
              <Link href="/sign-in">Anmelden</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="rounded-full px-5"
              data-testid="landing-get-started-link"
            >
              <Link href="/sign-up">Loslegen</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 pt-24 pb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary">
            ✨ Klonen · Starten · Eingeloggt
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Authentifizierung, die du{" "}
            <span className="text-primary">nie wieder</span> neu schreibst.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            AuthKit ist ein wiederverwendbarer Auth-Microservice: Spring-Boot-Backend
            und Next.js-Frontend mit Sign-up, Sign-in, Refresh-Tokens, Rollen,
            Swagger und Tests. Starte dein nächstes Projekt mit fertiger Anmeldung.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="h-auto rounded-xl px-6 py-3 text-sm">
              <Link href="/sign-up">Account erstellen</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-auto rounded-xl px-6 py-3 text-sm"
            >
              <Link href="/sign-in">Ich habe schon einen Account</Link>
            </Button>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.text}
              </p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
          <p>AuthKit — a reusable authentication starter.</p>
          <p>Built on Spring Boot + Next.js.</p>
        </div>
      </footer>
    </div>
  );
}
