"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteRefreshCookie } from "@/actions/auth-action";

/**
 * Signs the user out by deleting the refresh-token cookie (the backend is
 * stateless, so no server round-trip is required) and sending them home.
 */
export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await deleteRefreshCookie();
    // Full reload so the RTK Query cache (incl. the access token) is cleared.
    window.location.href = "/";
  };

  return (
    <Button
      variant="outline"
      size="lg"
      data-testid="header-sign-out-button"
      onClick={handleSignOut}
      className="rounded-full px-4"
    >
      Sign out
    </Button>
  );
}
