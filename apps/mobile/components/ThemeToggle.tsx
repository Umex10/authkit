import { Pressable } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useColorScheme } from "nativewind";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemeColors } from "@/components/theme/colors";
import { SCHEME_KEY } from "@/components/theme/ThemeController";

/** Light/dark toggle. Persists the choice so it survives a restart. */
export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const colors = useThemeColors();
  const isDark = colorScheme === "dark";

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setColorScheme(next);
    SecureStore.setItemAsync(SCHEME_KEY, next);
  };

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      className="rounded-md p-1.5"
      accessibilityRole="button"
      accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Ionicons
        name={isDark ? "sunny-outline" : "moon-outline"}
        size={20}
        color={colors.mutedForeground}
      />
    </Pressable>
  );
}
