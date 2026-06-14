import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/lib/config";

/**
 * Root RTK Query slice used by every feature-specific API module.
 *
 * The shared `prepareHeaders` reads the access token straight from the cached
 * `getAccessTk` query, so any authenticated request automatically carries an
 * up-to-date `Authorization: Bearer <tk>` header without callers having to
 * inject it manually.
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as any;

      // The access token lives in the cached getAccessTk query result.
      const tk = state.api.queries["getAccessTk(undefined)"]?.data?.accessTk;

      if (tk) {
        headers.set("authorization", `Bearer ${tk}`);
      }

      return headers;
    },
  }),
  tagTypes: ["Me"],
  endpoints: () => ({}),
});
