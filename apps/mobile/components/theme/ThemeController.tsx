import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { useColorScheme } from "nativewind";

/** Keystore key holding the user's chosen color scheme. */
export const SCHEME_KEY = "color_scheme";

/**
 * Restores a previously chosen light/dark preference on launch (the rough
 * equivalent of next-themes reading localStorage on the web). Without a saved
 * choice NativeWind follows the OS setting.
 */
export function ThemeController({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    SecureStore.getItemAsync(SCHEME_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setColorScheme(saved);
      }
    });
    // setColorScheme is stable; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
