import { User } from "@/types/User";
import { apiSlice } from "../apiSlice";

/**
 * Endpoint for the protected `GET /me` route.
 *
 * Demonstrates a normal authenticated request: the access token is attached
 * automatically by the shared `prepareHeaders` in {@link apiSlice}. Add your
 * own feature endpoints next to this one the exact same way.
 */
const meApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => `/me`,
      providesTags: ["Me"],
    }),
  }),
});

export const { useGetMeQuery } = meApi;
