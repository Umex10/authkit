import { apiSlice } from "../apiSlice";
import {
  getAccessTkAction,
  signInAction,
  signUpAction,
} from "@/actions/auth-action";

/**
 * RTK Query endpoints for the auth flow.
 *
 * The endpoints intentionally call into Next.js server actions (instead of
 * RTK's built-in baseQuery) so the refresh-token cookie can be read and written
 * on the server side, where it is never exposed to client JavaScript. Sign-up
 * and sign-in are modelled as mutations because they change server state; the
 * access-token refresh is a query so RTK caches the result for
 * `keepUnusedDataFor` seconds and shares it across the app.
 */
const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    signUp: builder.mutation({
      async queryFn(signUpData) {
        const res = await signUpAction(signUpData);
        return res.success ? { data: res.data } : { error: res.error };
      },
      onQueryStarted: updateAuthCache,
    }),

    signIn: builder.mutation({
      async queryFn(signInData) {
        const res = await signInAction(signInData);
        return res.success ? { data: res.data } : { error: res.error };
      },
      onQueryStarted: updateAuthCache,
    }),

    getAccessTk: builder.query({
      async queryFn() {
        const res = await getAccessTkAction();
        return res.success ? { data: res.data } : { error: res.error };
      },
      // 15 minutes — matches the access-token lifetime.
      keepUnusedDataFor: 900,
    }),
  }),
});

/**
 * After a sign-up or sign-in mutation succeeds, seed the `getAccessTk` cache
 * entry with the returned auth data so the access token is immediately
 * available to authenticated requests without triggering a separate refresh.
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
