import { ActivityIndicator, Text, View } from "react-native";
import { useThemeColors } from "@/components/theme/colors";

/** A theme-coloured spinner. */
export function Spinner({ size = "small" }: { size?: "small" | "large" }) {
  const colors = useThemeColors();
  return <ActivityIndicator size={size} color={colors.primary} />;
}

/**
 * A centered, branded full-screen loader. Shown by `AuthProvider` while the
 * access token and current user are resolved — mirrors the web `FullPageLoader`.
 */
export function FullPageLoader({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
      <Spinner size="large" />
      {label ? (
        <Text className="text-center text-sm text-muted-foreground">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
