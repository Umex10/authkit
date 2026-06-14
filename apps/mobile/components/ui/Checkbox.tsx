import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { cn } from "@/lib/utils";
import { useThemeColors } from "@/components/theme/colors";

/**
 * A labelled checkbox row. Tapping anywhere on the row toggles it — the mobile
 * equivalent of the web app's shadcn `Checkbox` + `Label` pairing.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  invalid = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  invalid?: boolean;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      className="flex-row items-start gap-2.5"
    >
      <View
        className={cn(
          "mt-0.5 h-5 w-5 items-center justify-center rounded-md border",
          checked ? "border-primary bg-primary" : "border-input bg-transparent",
          invalid && !checked && "border-destructive",
        )}
      >
        {checked && (
          <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />
        )}
      </View>
      <Text className="flex-1 text-sm leading-snug text-muted-foreground">
        {label}
      </Text>
    </Pressable>
  );
}
