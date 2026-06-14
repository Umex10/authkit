import { Provider } from "react-redux";
import { store } from "./store";

/** Wraps the app with the Redux provider. Mirrors the web app's StoreProvider. */
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Provider store={store}>{children}</Provider>;
}
