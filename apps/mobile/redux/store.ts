import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";

/**
 * The single Redux store, wired with the RTK Query api slice. Identical to the
 * web app — every API module injects its endpoints into `apiSlice`.
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
