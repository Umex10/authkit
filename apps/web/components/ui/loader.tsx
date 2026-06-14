import { cn } from "@/lib/utils";

/**
 * Small circular spinner in the brand colour.
 *
 * Sizing/colour is driven by the parent via `className` (it inherits
 * `currentColor` by default).
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin text-primary", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/**
 * Full-viewport loading screen used as the auth/app-shell gate while the access
 * token and first route data are resolved. Reusable anywhere a whole-page
 * blocking loader is needed.
 */
export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <Spinner className="size-8" />
      {label && (
        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          {label}
        </p>
      )}
    </div>
  );
}
