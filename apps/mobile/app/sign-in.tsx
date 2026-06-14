import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/Field";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthTips } from "@/components/AuthTips";
import { useSignInMutation } from "@/redux/api/apis/auth";
import { hasRefreshToken } from "@/actions/auth-action";

/**
 * Validation rules for the sign-in form. The email check stays loose (any valid
 * address) so the backend remains the source of truth for unknown accounts.
 */
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

/** Form values inferred from {@link signInSchema}; shared with `signInAction`. */
export type SignInFormValues = z.infer<typeof signInSchema>;

/**
 * Sign-in screen. Wires a Zod-validated react-hook-form to the
 * `useSignInMutation` RTK endpoint, shows toasts and redirects to the dashboard
 * on success. The mobile twin of the web `app/sign-in/page.tsx`.
 */
export default function SignInScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [signIn, { isLoading: isSigningIn }] = useSignInMutation();

  // Already signed in? Skip the form (the web app does this in proxy.ts).
  useEffect(() => {
    hasRefreshToken().then((has) => {
      if (has) router.replace("/dashboard");
    });
  }, [router]);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInFormValues) => {
    const toastId = toast.loading("Signing in …");
    try {
      await signIn(values).unwrap();
      toast.success("Signed in successfully!", { id: toastId });
      router.replace("/dashboard");
    } catch (error: any) {
      const message = error?.message || "Sign-in failed.";
      toast.error(message, { id: toastId });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="px-6 py-6" keyboardShouldPersistTaps="handled">
          {/* Top bar: back + theme toggle */}
          <View className="mb-8 flex-row items-center justify-between">
            <Pressable onPress={() => router.replace("/")} hitSlop={8}>
              <Text className="text-sm font-medium text-muted-foreground">
                ← Back
              </Text>
            </Pressable>
            <ThemeToggle />
          </View>

          <View className="mb-8 gap-2">
            <Text className="text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back
            </Text>
            <Text className="text-sm text-muted-foreground">
              Sign in to get to your dashboard.
            </Text>
          </View>

          <View className="gap-5">
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="name@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      invalid={fieldState.invalid}
                    />
                    <FieldError message={fieldState.error?.message} />
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Password</FieldLabel>
                    <View className="flex-row items-stretch gap-2">
                      <Input
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Your password"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="current-password"
                        invalid={fieldState.invalid}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onPress={() => setShowPassword((p) => !p)}
                        className="px-3"
                        textClassName="text-xs"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </Button>
                    </View>
                    <FieldError message={fieldState.error?.message} />
                  </Field>
                )}
              />
            </FieldGroup>

            <Button
              onPress={form.handleSubmit(onSubmit)}
              disabled={isSigningIn}
              loading={isSigningIn}
              className="mt-1"
            >
              {isSigningIn ? "Signing in …" : "Sign in"}
            </Button>
          </View>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-sm text-muted-foreground">
              No account yet?{" "}
            </Text>
            <Pressable onPress={() => router.replace("/sign-up")}>
              <Text className="text-sm font-semibold text-primary">
                Sign up for free
              </Text>
            </Pressable>
          </View>

          <View className="mt-10">
            <AuthTips variant="sign-in" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
