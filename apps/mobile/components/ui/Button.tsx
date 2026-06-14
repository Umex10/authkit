import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { cn } from "@/lib/utils";
import { useThemeColors } from "@/components/theme/colors";

type Variant = "default" | "outline" | "ghost";

const CONTAINER: Record<Variant, string> = {
  default: "bg-primary",
  outline: "border border-input bg-transparent",
  ghost: "bg-transparent",
};

const LABEL: Record<Variant, string> = {
  default: "text-primary-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
};

/**
 * The mobile twin of the web app's shadcn `Button`. A pressable with the same
 * three variants, a rounded pill shape, a disabled/pressed state and an inline
 * loading spinner.
 */
export function Button({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = "default",
  className,
  textClassName,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  className?: string;
  textClassName?: string;
}) {
  const colors = useThemeColors();
  const spinnerColor =
    variant === "default" ? colors.primaryForeground : colors.foreground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      className={cn(
        "flex-row items-center justify-center rounded-xl px-5 py-3",
        CONTAINER[variant],
        (disabled || loading) && "opacity-60",
        className,
      )}
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
    >
      {typeof children === "string" ? (
        <Text
          className={cn("text-sm font-semibold", LABEL[variant], textClassName)}
        >
          {children}
        </Text>
      ) : (
        <View className="flex-row items-center">{children}</View>
      )}
      {loading && (
        <ActivityIndicator size="small" color={spinnerColor} className="ml-2" />
      )}
    </Pressable>
  );
}
