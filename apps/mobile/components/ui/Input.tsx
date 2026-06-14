import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";
import { useThemeColors } from "@/components/theme/colors";

/**
 * Text input matching the web app's shadcn `Input`. Adds `invalid` styling and
 * pulls the placeholder colour from the active theme (className can't set it).
 */
export function Input({
  className,
  invalid = false,
  ...props
}: TextInputProps & { invalid?: boolean }) {
  const colors = useThemeColors();

  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      className={cn(
        "rounded-lg border bg-card px-3.5 py-2.5 text-sm text-foreground",
        invalid ? "border-destructive" : "border-input",
        className,
      )}
      {...props}
    />
  );
}
