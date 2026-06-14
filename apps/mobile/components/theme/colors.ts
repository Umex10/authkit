import { useColorScheme } from "nativewind";

/**
 * JS copies of the design tokens for the few imperative cases NativeWind
 * className strings can't reach: `placeholderTextColor`, `ActivityIndicator`
 * colour, the status bar, confetti, etc. Keep these in sync with global.css.
 */
export const lightColors = {
  background: "#ffffff",
  foreground: "#18181b",
  card: "#ffffff",
  primary: "#7c3aed",
  primaryForeground: "#ffffff",
  mutedForeground: "#71717a",
  border: "#e4e4e7",
  destructive: "#ef4444",
};

export const darkColors = {
  background: "#0a0a0f",
  foreground: "#fafafa",
  card: "#15151b",
  primary: "#8b5cf6",
  primaryForeground: "#ffffff",
  mutedForeground: "#a1a1aa",
  border: "#27272e",
  destructive: "#f87171",
};

export type ThemeColors = typeof lightColors;

/** Returns the active palette based on the current (NativeWind) color scheme. */
export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? darkColors : lightColors;
}
