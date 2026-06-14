import { apiSlice } from "../apiSlice";
import {
  getAccessTkAction,
  signInAction,
  signUpAction,
} from "@/actions/auth-action";

/**
 * RTK Query endpoints for the auth flow.
 *
 * The endpoints call into the on-device auth actions (instead of RTK's built-in
 * baseQuery) so the refresh token can be read/written in the OS keystore. Sign-up
 * and sign-in are mutations because they change server state; the access-token
 * refresh is a query so RTK caches the result for `keepUnusedDataFor` seconds and
 * shares it across the app. A 1:1 mirror of the web app's auth endpoints.
 */
const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    signUp: builder.mutation({
      async queryFn(signUpData) {
        const res = await signUpAction(signUpData);
        // The error body is the backend's JSON ({ message, errors? }); RTK only
        // needs it to round-trip back to the form, so it is passed as-is.
        return res.success ? { data: res.data } : { error: res.error as any };
      },
      onQueryStarted: updateAuthCache,
    }),

    signIn: builder.mutation({
      async queryFn(signInData) {
        const res = await signInAction(signInData);
        return res.success ? { data: res.data } : { error: res.error as any };
      },
      onQueryStarted: updateAuthCache,
    }),

    getAccessTk: builder.query({
      async queryFn() {
        const res = await getAccessTkAction();
        return res.success ? { data: res.data } : { error: res.error as any };
      },
      // 15 minutes — matches the access-token lifetime.
      keepUnusedDataFor: 900,
    }),
  }),
});

/**
 * After a sign-up or sign-in mutation succeeds, seed the `getAccessTk` cache
 * entry with the returned auth data so the access token is immediately available
 * to authenticated requests without triggering a separate refresh.
 */
async function updateAuthCache(arg: any, { dispatch, queryFulfilled }: any) {
  try {
    const { data } = await queryFulfilled;
    dispatch(
      authApi.util.updateQueryData("getAccessTk", undefined, (draft: any) => {
        Object.assign(draft, data);
      }),
    );
  } catch {
    // Mutation failed; nothing to cache.
  }
}

export const { useSignUpMutation, useSignInMutation, useGetAccessTkQuery } =
  authApi;
