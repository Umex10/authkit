"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/loader";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthTips } from "@/components/AuthTips";
import { useSignUpMutation } from "@/redux/api/apis/auth";

/**
 * Validation rules for the sign-up form. The constraints mirror the backend's
 * Jakarta Bean Validation (name >= 2, valid email, phone >= 10, password >= 6)
 * plus a UI-only `terms` checkbox that never reaches the API.
 */
const signUpSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein."),
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein."),
  phone: z
    .string()
    .min(10, "Bitte gib eine gültige Telefonnummer ein (mind. 10 Zeichen)."),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein."),
  role: z.enum(["USER", "ADMIN"], { message: "Bitte wähle eine Rolle aus." }),
  terms: z.boolean().refine((val) => val === true, {
    message: "Du musst die Bedingungen akzeptieren.",
  }),
});

/** Form values inferred from {@link signUpSchema}; shared with `signUpAction`. */
export type SignUpFormValues = z.infer<typeof signUpSchema>;

/**
 * Sign-up page at `/sign-up`. Submits via `useSignUpMutation`, replays backend
 * field errors (e.g. "email already taken") onto the matching inputs, and
 * redirects to the dashboard on success.
 */
export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [signUp, { isLoading: isSigningUp }] = useSignUpMutation();

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
    const toastId = toast.loading("Account wird erstellt …", {
      className: "toast-loading",
    });
    try {
      await signUp(values).unwrap();
      toast.success("Account erfolgreich erstellt!", {
        id: toastId,
        className: "toast-success",
      });
      router.push("/dashboard");
    } catch (error: any) {
      const message = error?.message || "Registrierung fehlgeschlagen.";
      toast.error(message, { id: toastId, className: "toast-error" });

      // Replay backend field errors (errors[].field) onto the form inputs.
      if (error?.errors) {
        error.errors.forEach((fieldError: any) => {
          form.setError(fieldError.field, { message: fieldError.message });
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Form column */}
      <main className="relative flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <Link
          href="/"
          className="absolute top-6 left-6 text-sm font-medium text-muted-foreground transition-opacity hover:opacity-60"
        >
          ← Zurück
        </Link>
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Account erstellen
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              In Sekunden registriert — und sofort eingeloggt.
            </p>
          </div>

          <form
            id="sign-up-form"
            className="flex flex-col gap-5"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">Vollständiger Name</FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      data-testid="sign-up-name-input"
                      placeholder="Mario Kaya"
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                      className="h-auto rounded-lg px-3.5 py-2.5 text-sm"
                    />
                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                        fieldName="sign-up-name"
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">E-Mail</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      data-testid="sign-up-email-input"
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                      className="h-auto rounded-lg px-3.5 py-2.5 text-sm"
                    />
                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                        fieldName="sign-up-email"
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="phone">Telefonnummer</FieldLabel>
                    <Input
                      {...field}
                      id="phone"
                      data-testid="sign-up-phone-input"
                      type="tel"
                      placeholder="+43 660 1234567"
                      autoComplete="tel"
                      aria-invalid={fieldState.invalid}
                      className="h-auto rounded-lg px-3.5 py-2.5 text-sm"
                    />
                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                        fieldName="sign-up-phone"
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">Passwort</FieldLabel>
                    <div className="flex items-stretch gap-2">
                      <Input
                        {...field}
                        id="password"
                        data-testid="sign-up-password-input"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mindestens 6 Zeichen"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        className="h-auto rounded-lg px-3.5 py-2.5 text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPassword((p) => !p)}
                        className="h-auto rounded-lg px-3 text-xs"
                      >
                        {showPassword ? "Verbergen" : "Zeigen"}
                      </Button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                        fieldName="sign-up-password"
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="role">Rolle</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger
                        id="role"
                        data-testid="sign-up-role-trigger"
                        aria-invalid={fieldState.invalid}
                        className="h-auto w-full rounded-lg px-3.5 py-2.5 text-sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Values are UPPERCASE to match the backend Role enum. */}
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <Controller
              name="terms"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Checkbox
                      id="terms"
                      data-testid="sign-up-terms-checkbox"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="terms"
                      className="cursor-pointer leading-snug font-normal text-muted-foreground"
                    >
                      Ich akzeptiere die Bedingungen und die Datenschutzrichtlinie.
                    </Label>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Button
              type="submit"
              data-testid="sign-up-submit-button"
              disabled={isSigningUp}
              className="mt-1 h-auto w-full rounded-xl py-3 text-sm font-semibold"
            >
              {isSigningUp ? "Registrierung läuft …" : "Registrieren"}
              {isSigningUp && <Spinner className="ml-2 size-4 text-current" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Bereits registriert?{" "}
            <Link
              href="/sign-in"
              data-testid="sign-up-sign-in-link"
              className="font-semibold text-primary hover:opacity-70"
            >
              Anmelden
            </Link>
          </p>
        </div>
      </main>

      {/* Tips panel (desktop only) */}
      <AuthTips variant="sign-up" />
    </div>
  );
}
