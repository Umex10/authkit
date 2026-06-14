"use client";

import React from "react";
import { useGetAccessTkQuery } from "@/redux/api/apis/auth";
import { useGetMeQuery } from "@/redux/api/apis/me";
import { FullPageLoader } from "@/components/ui/loader";

/**
 * Gate that defers rendering of the authenticated app shell until an access
 * token has been resolved.
 *
 * On mount it kicks off `getAccessTk`, which exchanges the refresh-token cookie
 * for a fresh access token via a server action. Once a token exists it also
 * prefetches the current user (`GET /me`) so the first authenticated route is
 * ready by the time the children render. A branded full-page loader is shown
 * while either request is in flight.
 */
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoading: isLoadingTk, isSuccess: hasTk } =
    useGetAccessTkQuery(undefined);

  const { isLoading: isLoadingMe } = useGetMeQuery(undefined, { skip: !hasTk });

  if (isLoadingTk || (hasTk && isLoadingMe)) {
    return <FullPageLoader label="Einen Moment, wir melden dich an …" />;
  }

  return <>{children}</>;
};

export default AuthProvider;
