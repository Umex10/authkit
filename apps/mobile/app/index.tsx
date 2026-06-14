import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FullPageLoader } from "@/components/ui/Loader";
import { hasRefreshToken } from "@/actions/auth-action";

const FEATURES = [
  {
    icon: "🔐",
    title: "JWT, done right",
    text: "Short-lived access token + secure refresh token. Stateless, safe, done.",
  },
  {
    icon: "🧩",
    title: "Roles & @PreAuthorize",
    text: "USER/ADMIN out of the box, method-level authorization included.",
  },
  {
    icon: "⚡",
    title: "RTK Query",
    text: "The keystore holds the refresh token, RTK Query caches the rest.",
  },
  {
    icon: "📖",
    title: "Swagger & tests",
    text: "Live API docs with an Authorize button and a green test suite.",
  },
];

/** Public landing screen — the mobile twin of the web `app/page.tsx`. */
export default function Home() {
  const router = useRouter();
  // Already signed in? Skip the landing and go straight to the dashboard — the
  // mobile equivalent of proxy.ts redirecting `/` → `/dashboard`. The flag lets
  // the dashboard show an "already signed in" note. We hold a loader until the
  // keystore check resolves so the landing never flashes for logged-in users.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    hasRefreshToken().then((has) => {
      if (has) {
        router.replace({ pathname: "/dashboard", params: { redirected: "1" } });
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return <FullPageLoader />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-6 py-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl">🔐</Text>
          <Text className="font-semibold text-foreground">AuthKit</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            onPress={() => router.push("/sign-in")}
            className="px-3 py-2"
          >
            Sign in
          </Button>
        </View>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-16">
        {/* Hero */}
        <View className="items-center gap-5 pt-14 pb-10">
          <View className="rounded-full bg-primary/10 px-3.5 py-1.5">
            <Text className="text-sm font-medium text-primary">
              ✨ Clone · Start · Logged in
            </Text>
          </View>
          <Text className="text-center text-4xl font-extrabold tracking-tight text-foreground">
            Authentication you{" "}
            <Text className="text-primary">never rewrite</Text> again.
          </Text>
          <Text className="max-w-md text-center text-base leading-relaxed text-muted-foreground">
            AuthKit is a reusable auth microservice: a Spring Boot backend and a
            React Native frontend with sign-up, sign-in, refresh tokens, roles,
            Swagger and tests. Start your next project with auth already done.
          </Text>
          <View className="w-full gap-3 pt-2">
            <Button onPress={() => router.push("/sign-up")}>
              Create account
            </Button>
            <Button variant="outline" onPress={() => router.push("/sign-in")}>
              I already have an account
            </Button>
          </View>
        </View>

        {/* Feature grid */}
        <View className="gap-4">
          {FEATURES.map((f) => (
            <View
              key={f.title}
              className="gap-2 rounded-xl border border-border bg-card p-5"
            >
              <Text className="text-2xl">{f.icon}</Text>
              <Text className="font-semibold text-foreground">{f.title}</Text>
              <Text className="text-sm leading-relaxed text-muted-foreground">
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View className="mt-12 items-center gap-1 border-t border-border pt-8">
          <Text className="text-xs text-muted-foreground">
            AuthKit — a reusable authentication starter.
          </Text>
          <Text className="text-xs text-muted-foreground">
            Built on Spring Boot + React Native.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
