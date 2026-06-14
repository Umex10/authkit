import "react-native-gesture-handler";
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Providers } from "@/components/providers";

/**
 * Root layout — the mobile twin of the web `app/layout.tsx`. Wraps every screen
 * in the shared providers (Redux, theme, toast host) and declares the navigator.
 */
export default function RootLayout() {
  return (
    <Providers>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="(shell)" />
      </Stack>
    </Providers>
  );
}
