import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";

/**
 * Singleton Redux store for the web app.
 *
 * Only mounts the shared `apiSlice` reducer and middleware; feature-specific
 * endpoints inject themselves into that slice via `apiSlice.injectEndpoints`,
 * so we keep a single cache and a single set of tag invalidations across the
 * whole app.
 */
export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
