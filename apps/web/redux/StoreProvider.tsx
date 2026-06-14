"use client";

import { Provider } from "react-redux";
import { store } from "./store";

/**
 * Client-side wrapper that exposes the Redux store to React.
 *
 * Lives in its own `"use client"` file so the store stays out of the
 * server-component tree while the rest of the app shell can remain server
 * rendered.
 */
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Provider store={store}>{children}</Provider>;
}
