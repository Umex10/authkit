import { Pressable, Text, View } from "react-native";
import { cn } from "@/lib/utils";

type Option<T extends string> = { label: string; value: T };

/**
 * A segmented selector — the idiomatic mobile take on the web app's shadcn
 * `Select` dropdown. With only a couple of options (USER / ADMIN) a row of pills
 * is faster to use on a phone than a popover.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Option<T>[];
}) {
  return (
    <View className="flex-row gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={cn(
              "flex-1 items-center rounded-lg border px-3.5 py-2.5",
              active
                ? "border-primary bg-primary"
                : "border-input bg-card",
            )}
          >
            <Text
              className={cn(
                "text-sm font-medium",
                active ? "text-primary-foreground" : "text-foreground",
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
