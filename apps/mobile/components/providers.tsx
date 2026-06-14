import { View } from "react-native";
import { useColorScheme } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import StoreProvider from "@/redux/StoreProvider";
import { ThemeController } from "@/components/theme/ThemeController";
import { themes } from "@/components/theme/themes";

/**
 * Applies the active design tokens to the whole tree. Switching `colorScheme`
 * swaps the `vars()` object, which re-themes every NativeWind color class.
 */
function ThemedRoot({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useColorScheme();
  return (
    <View
      style={[{ flex: 1 }, colorScheme === "dark" ? themes.dark : themes.light]}
    >
      {children}
    </View>
  );
}

/**
 * Wraps the whole app, mirroring the web app's `providers.tsx`:
 *   • Redux store (RTK Query)            ← StoreProvider
 *   • theme restore + token application  ← ThemeController + ThemedRoot
 *   • gesture + safe-area + toast hosts  ← required by sonner-native
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <ThemeController>
            <ThemedRoot>
              {children}
              <Toaster />
            </ThemedRoot>
          </ThemeController>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
