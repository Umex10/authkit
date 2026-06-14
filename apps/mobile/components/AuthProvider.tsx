import React from "react";
import { Redirect } from "expo-router";
import { useGetAccessTkQuery } from "@/redux/api/apis/auth";
import { useGetMeQuery } from "@/redux/api/apis/me";
import { FullPageLoader } from "@/components/ui/Loader";

/**
 * Gate that defers rendering of the authenticated shell until an access token is
 * resolved — the mobile twin of the web `AuthProvider`.
 *
 * On mount it kicks off `getAccessTk`, which exchanges the stored refresh token
 * for a fresh access token. Once a token exists it prefetches the current user
 * (`GET /me`). If the refresh token is missing or rejected, it redirects to the
 * sign-in screen (the role `proxy.ts` plays on the web).
 */
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    isLoading: isLoadingTk,
    isSuccess: hasTk,
    isError: tkFailed,
  } = useGetAccessTkQuery(undefined);

  const { isLoading: isLoadingMe } = useGetMeQuery(undefined, { skip: !hasTk });

  if (isLoadingTk || (hasTk && isLoadingMe)) {
    return <FullPageLoader label="One moment, signing you in …" />;
  }

  // No valid refresh token → bounce to the auth flow.
  if (tkFailed || !hasTk) {
    return <Redirect href="/sign-in" />;
  }

  return <>{children}</>;
};

export default AuthProvider;
