import { memo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@shared/ui/Input";
import { OtpInput } from "@shared/ui/OtpInput";
import { GradientButton } from "@shared/ui/GradientButton";
import { Text } from "@shared/ui/Text";
import { colors, radii, spacing } from "@shared/theme";
import { registerSchema, type RegisterValues } from "@features/auth/schemas/auth.schema";
import { useRegister } from "@features/auth/hooks/useAuth";
import { AuthAPI } from "@features/auth/api/auth.api";
import { ApiError } from "@core/api/errors";
import { useUiStore } from "@shared/store/ui.store";

// Mirror the password rules from auth.schema.ts (which mirrors the backend
// /auth/register validator). Keeping them in one list lets us render a live
// checklist under the password field so the user can see WHY a strong
// password is required — same pattern as Google / GitHub signup, fixes the
// "I typed 8 chars why is it failing" confusion that produced the silent
// 422 → "server error" toast loop.
const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter (A–Z)", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter (a–z)", test: (v) => /[a-z]/.test(v) },
  { label: "One digit (0–9)", test: (v) => /\d/.test(v) },
];

function PasswordChecklist({ value }: { value: string }) {
  // Stay hidden until the user starts typing so the form doesn't look
  // intimidating up-front — once they've touched it, walk them through
  // each rule in real time.
  if (!value) return null;
  return (
    <View
      style={{
        marginTop: spacing.xs,
        padding: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: colors.bgSurface,
        gap: 4,
      }}
    >
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <View
            key={rule.label}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Ionicons
              name={ok ? "checkmark-circle" : "ellipse-outline"}
              size={14}
              color={ok ? colors.buy : colors.textDim}
            />
            <Text
              size="sm"
              style={{
                color: ok ? colors.buy : colors.textMuted,
                fontWeight: ok ? "600" : "400",
              }}
            >
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function RegisterFormImpl() {
  const { control, handleSubmit } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      mobile: "",
      password: "",
      confirm: "",
      referral_code: "",
    },
    mode: "onChange",
  });
  const passwordValue = useWatch({ control, name: "password" }) ?? "";
  const reg = useRegister();
  const pushToast = useUiStore((s) => s.pushToast);

  // Verify-first signup: step "form" collects details and emails a code;
  // step "otp" verifies it by creating the account with the code. When the
  // owning admin (from referral_code) has register-OTP off, we skip the code
  // step and create the account straight away.
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const pending = useRef<RegisterValues | null>(null);

  function createAccount(v: RegisterValues, code?: string) {
    reg.mutate({
      email: v.email,
      mobile: v.mobile,
      password: v.password,
      full_name: v.full_name,
      referral_code: v.referral_code?.trim() || undefined,
      ...(code ? { otp: code } : {}),
    });
  }

  const sendOtp = useMutation({
    mutationFn: (v: RegisterValues) =>
      AuthAPI.requestOtp(v.email, "register", v.referral_code?.trim() || undefined),
    onSuccess: (res, v) => {
      // Admin turned register-OTP off → no code needed, register directly.
      if (res?.otp_required === false) {
        createAccount(v);
        return;
      }
      setStep("otp");
      setOtp("");
      pushToast({
        kind: "success",
        message: `We sent a 6-digit code to ${v.email}`,
      });
    },
    onError: (e: ApiError) =>
      pushToast({ kind: "error", message: e.message || "Could not send code" }),
  });

  function verifyAndCreate() {
    const v = pending.current;
    if (!v) return;
    if (otp.trim().length < 4) {
      pushToast({ kind: "error", message: "Enter the 6-digit code from your email" });
      return;
    }
    createAccount(v, otp.trim());
  }

  if (step === "otp") {
    return (
      <View style={{ gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text size="lg" style={{ fontWeight: "700", color: colors.text }}>
            Verify your email
          </Text>
          <Text size="sm" style={{ color: colors.textMuted }}>
            Enter the 6-digit code we sent to {pending.current?.email}
          </Text>
        </View>
        <OtpInput value={otp} onChange={setOtp} />
        <GradientButton
          label="Verify & create account"
          loading={reg.isPending}
          onPress={verifyAndCreate}
        />
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}
        >
          <Pressable onPress={() => setStep("form")} disabled={reg.isPending}>
            <Text size="sm" style={{ color: colors.textMuted, fontWeight: "600" }}>
              ← Edit details
            </Text>
          </Pressable>
          <Pressable
            onPress={() => pending.current && sendOtp.mutate(pending.current)}
            disabled={sendOtp.isPending}
          >
            <Text size="sm" style={{ color: colors.primary, fontWeight: "700" }}>
              {sendOtp.isPending ? "Sending…" : "Resend code"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <Controller
        control={control}
        name="full_name"
        render={({ field, fieldState }) => (
          <Input
            label="Full name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            placeholder="Rahul Sharma"
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <Input
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="email-address"
            placeholder="you@example.com"
          />
        )}
      />
      <Controller
        control={control}
        name="mobile"
        render={({ field, fieldState }) => (
          <Input
            label="Mobile"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="98XXXXXXXX"
          />
        )}
      />
      <View>
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              label="Password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              secureTextEntry
              placeholder="e.g. Ram@123"
            />
          )}
        />
        <PasswordChecklist value={passwordValue} />
      </View>
      <Controller
        control={control}
        name="confirm"
        render={({ field, fieldState }) => (
          <Input
            label="Confirm password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secureTextEntry
          />
        )}
      />
      <Controller
        control={control}
        name="referral_code"
        render={({ field, fieldState }) => (
          <Input
            label="Referral code (optional)"
            value={field.value ?? ""}
            onChangeText={(t) => field.onChange(t.toUpperCase().replace(/\s/g, ""))}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoCapitalize="characters"
            placeholder="Admin referral code, e.g. ADM12087609"
          />
        )}
      />
      <View style={{ marginTop: 8 }}>
        <GradientButton
          label="Continue"
          loading={sendOtp.isPending || reg.isPending}
          onPress={handleSubmit(
            (v) => {
              // Stash the validated details and ask the server for an OTP. If
              // the owning admin has register-OTP off, requestOtp replies
              // otp_required=false and we register directly (see sendOtp).
              pending.current = v;
              sendOtp.mutate(v);
            },
            // Surface a toast when validation fails — otherwise the user
            // taps "Continue" and nothing visible happens because the
            // offending field (usually Confirm-password) is below the
            // keyboard and they never see the inline error.
            (errors) => {
              const first =
                errors.full_name?.message ??
                errors.email?.message ??
                errors.mobile?.message ??
                errors.password?.message ??
                errors.confirm?.message ??
                "Please fill all fields correctly";
              pushToast({ kind: "error", message: String(first) });
            },
          )}
        />
      </View>
    </View>
  );
}

export const RegisterForm = memo(RegisterFormImpl);
