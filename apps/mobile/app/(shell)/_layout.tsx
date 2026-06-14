import { Slot, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthProvider from "@/components/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SignOutButton } from "@/components/SignOutButton";

/**
 * Layout for every protected route under `(shell)`.
 *
 * `AuthProvider` gates rendering until an access token is resolved (and the
 * current user prefetched), so child screens can assume they are authenticated.
 * A minimal top bar provides the theme toggle and sign-out. The mobile twin of
 * the web `app/(shell)/layout.tsx`.
 */
export default function ShellLayout() {
  const router = useRouter();

  return (
    <AuthProvider>
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-row items-center justify-between border-b border-border px-6 py-3">
          {/* Goes to the root URL on purpose. If you're still signed in, the
              landing screen bounces you right back to /dashboard with the
              "already signed in" note — demonstrating the redirect flow. */}
          <Pressable
            onPress={() => router.replace("/")}
            className="flex-row items-center gap-2"
          >
            <Text className="text-xl">🔐</Text>
            <Text className="font-semibold text-foreground">AuthKit</Text>
          </Pressable>
          <View className="flex-row items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </View>
        </View>

        <Slot />
      </SafeAreaView>
    </AuthProvider>
  );
}
