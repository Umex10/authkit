import { Text, View } from "react-native";
import { API_BASE_URL } from "@/lib/config";

/**
 * The "how this works" panel shown beneath the auth forms.
 *
 * On the web this is a full-height side panel; on a phone it reads better as a
 * card below the form. It's genuinely useful documentation for anyone who just
 * cloned AuthKit — replace it with your own marketing once you build on top.
 */
export function AuthTips({ variant }: { variant: "sign-in" | "sign-up" }) {
  const tips =
    variant === "sign-up"
      ? [
          "Your details go to POST /auth/sign-up on the Spring backend.",
          "The password is hashed server-side — never stored in plain text.",
          "You instantly get an access token + a refresh token (kept in the keystore).",
          "Then you're taken straight to the dashboard.",
        ]
      : [
          "Your input goes to POST /auth/sign-in.",
          "On success the backend returns the refresh token; we store it securely.",
          "The short-lived access token lives in the RTK Query cache.",
          "AuthProvider guards every screen under (shell).",
        ];

  return (
    <View className="gap-4 rounded-2xl bg-primary p-6">
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl">🔐</Text>
          <Text className="text-lg font-semibold text-primary-foreground">
            AuthKit
          </Text>
        </View>
        <Text className="text-xl font-bold text-primary-foreground">
          {variant === "sign-up"
            ? "An account, in seconds."
            : "Welcome back."}
        </Text>
        <Text className="text-sm leading-relaxed text-primary-foreground/80">
          A reusable auth system: Spring Boot + React Native, JWT, roles, Swagger
          and tests. Clone it, start it, build.
        </Text>
      </View>

      <View className="gap-3">
        {tips.map((tip) => (
          <View key={tip} className="flex-row items-start gap-2.5">
            <Text className="text-primary-foreground/90">✦</Text>
            <Text className="flex-1 text-sm leading-snug text-primary-foreground/90">
              {tip}
            </Text>
          </View>
        ))}
      </View>

      <View className="gap-1 rounded-lg bg-white/10 px-4 py-3">
        <Text className="text-xs font-semibold text-primary-foreground">
          Developer tip
        </Text>
        <Text className="text-xs leading-relaxed text-primary-foreground/90">
          Explore the API live at {API_BASE_URL}/swagger-ui.html — including the
          “Authorize 🔒” button.
        </Text>
      </View>
    </View>
  );
}
