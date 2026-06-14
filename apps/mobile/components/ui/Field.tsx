import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

/** A vertical stack of fields. Mirrors the web `FieldGroup`. */
export function FieldGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn("gap-5", className)}>{children}</View>;
}

/** A single field: label + control + optional error. */
export function Field({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn("gap-1.5", className)}>{children}</View>;
}

/** The label above a control. */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-sm font-medium text-foreground">{children}</Text>
  );
}

/** A validation message shown beneath a control. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text className="text-xs text-destructive">{message}</Text>;
}
