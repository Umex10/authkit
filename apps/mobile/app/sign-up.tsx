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
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/Field";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthTips } from "@/components/AuthTips";
import { useSignUpMutation } from "@/redux/api/apis/auth";
import { hasRefreshToken } from "@/actions/auth-action";

/**
 * Validation rules for the sign-up form. The constraints mirror the backend's
 * Jakarta Bean Validation (name >= 2, valid email, phone >= 10, password >= 6)
 * plus a UI-only `terms` checkbox that never reaches the API.
 */
const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z
    .string()
    .min(10, "Please enter a valid phone number (at least 10 characters)."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["USER", "ADMIN"], { message: "Please pick a role." }),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms.",
  }),
});

/** Form values inferred from {@link signUpSchema}; shared with `signUpAction`. */
export type SignUpFormValues = z.infer<typeof signUpSchema>;

/**
 * Sign-up screen. Submits via `useSignUpMutation`, replays backend field errors
 * (e.g. "email already taken") onto the matching inputs, and redirects to the
 * dashboard on success. The mobile twin of the web `app/sign-up/page.tsx`.
 */
export default function SignUpScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [signUp, { isLoading: isSigningUp }] = useSignUpMutation();

  useEffect(() => {
    hasRefreshToken().then((has) => {
      if (has) router.replace("/dashboard");
    });
  }, [router]);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "USER",
      terms: false,
    },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    const toastId = toast.loading("Creating account …");
    try {
      await signUp(values).unwrap();
      toast.success("Account created successfully!", { id: toastId });
      router.replace("/dashboard");
    } catch (error: any) {
      const message = error?.message || "Sign-up failed.";
      toast.error(message, { id: toastId });

      // Replay backend field errors (errors[].field) onto the form inputs.
      if (error?.errors) {
        error.errors.forEach((fieldError: any) => {
          form.setError(fieldError.field, { message: fieldError.message });
        });
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="px-6 py-6" keyboardShouldPersistTaps="handled">
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
              Create account
            </Text>
            <Text className="text-sm text-muted-foreground">
              Registered in seconds — and logged in right away.
            </Text>
          </View>

          <View className="gap-5">
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Full name</FieldLabel>
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Mario Kaya"
                      autoComplete="name"
                      invalid={fieldState.invalid}
                    />
                    <FieldError message={fieldState.error?.message} />
                  </Field>
                )}
              />

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
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Phone number</FieldLabel>
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="+43 660 1234567"
                      keyboardType="phone-pad"
                      autoComplete="tel"
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
                        placeholder="At least 6 characters"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="new-password"
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

              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Role</FieldLabel>
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { label: "User", value: "USER" },
                        { label: "Admin", value: "ADMIN" },
                      ]}
                    />
                    <FieldError message={fieldState.error?.message} />
                  </Field>
                )}
              />
            </FieldGroup>

            <Controller
              name="terms"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <Checkbox
                    checked={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                    label="I accept the terms and the privacy policy."
                  />
                  <FieldError message={fieldState.error?.message} />
                </Field>
              )}
            />

            <Button
              onPress={form.handleSubmit(onSubmit)}
              disabled={isSigningUp}
              loading={isSigningUp}
              className="mt-1"
            >
              {isSigningUp ? "Signing up …" : "Sign up"}
            </Button>
          </View>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-sm text-muted-foreground">
              Already registered?{" "}
            </Text>
            <Pressable onPress={() => router.replace("/sign-in")}>
              <Text className="text-sm font-semibold text-primary">Sign in</Text>
            </Pressable>
          </View>

          <View className="mt-10">
            <AuthTips variant="sign-up" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
