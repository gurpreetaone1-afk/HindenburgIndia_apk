import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "@shared/components/Screen";
import { Header } from "@shared/components/Header";
import { Avatar } from "@shared/ui/Avatar";
import { Badge } from "@shared/ui/Badge";
import { Text } from "@shared/ui/Text";
import { Input } from "@shared/ui/Input";
import { GradientButton } from "@shared/ui/GradientButton";
import { colors, radii, spacing } from "@shared/theme";
import { useAuthStore } from "@features/auth/store/auth.store";
import { useUpdateProfile } from "@features/auth/hooks/useAuth";
import {
  isEmailVerificationEnabled,
  useEmailVerificationStatus,
} from "@features/auth/hooks/useEmailVerification";
import { ActionField, ReadOnlyField } from "@features/profile/components/AccountFields";
import { useBankCapacity } from "@features/wallet/hooks/useBankAccounts";
import type { KycStatus } from "@features/auth/types/user.types";

const KYC_TONE: Record<KycStatus, "neutral" | "buy" | "warn" | "sell" | "info"> = {
  PENDING: "warn",
  SUBMITTED: "info",
  APPROVED: "buy",
  REJECTED: "sell",
};

// Email + mobile aren't editable via the public backend contract
// (`PUT /user/users/me` only accepts `full_name`, `photo_url`, `communication`,
// `kyc`). Render them read-only and direct the user to support to change them.
export default function AccountDetails() {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const { used, max } = useBankCapacity();
  const emailFlow = isEmailVerificationEnabled();
  const emailStatus = useEmailVerificationStatus();

  const [fullName, setFullName] = useState(user?.full_name ?? "");

  const trimmed = fullName.trim();
  const dirty = trimmed.length >= 2 && trimmed !== user?.full_name;

  const kyc: KycStatus = user?.kyc_status ?? "PENDING";
  const emailVerified = !!(emailStatus.data?.verified ?? user?.email_verified);

  function save() {
    if (!dirty) return;
    update.mutate({ full_name: trimmed });
  }

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Header title="Account details" back />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing["3xl"],
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginTop: spacing.md, marginBottom: spacing.lg }}>
            <Avatar name={fullName || user?.full_name} size={92} />
            {user?.user_code ? (
              <Text tone="muted" size="xs" style={{ marginTop: 8 }}>
                {user.user_code}
              </Text>
            ) : null}
          </View>

          <View style={{ gap: spacing.md }}>
            <Input
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Your full name"
              maxLength={128}
            />

            {emailFlow ? (
              <ActionField
                label="Email"
                value={user?.email ?? "—"}
                icon="mail-outline"
                hint={emailVerified ? undefined : "Tap to verify this address"}
                right={
                  <Badge
                    label={emailVerified ? "VERIFIED" : "VERIFY"}
                    tone={emailVerified ? "buy" : "warn"}
                  />
                }
                onPress={() => router.push("/profile/verify-email")}
              />
            ) : (
              <ReadOnlyField label="Email" value={user?.email ?? "—"} icon="mail-outline" />
            )}

            <ReadOnlyField label="Mobile" value={user?.mobile ?? "—"} icon="call-outline" />
            {user?.pan ? (
              <ReadOnlyField label="PAN" value={user.pan} icon="card-outline" />
            ) : null}

            {/* KYC is the entry point into the bank-details flow: the first
                account is captured here, and every later edit is OTP-gated. */}
            <ActionField
              label="KYC status"
              value={kyc}
              icon="shield-checkmark-outline"
              hint={
                used === 0
                  ? "Add your bank details to complete KYC"
                  : `${used} of ${max} bank accounts saved · tap to manage`
              }
              right={<Badge label={kyc} tone={KYC_TONE[kyc]} />}
              onPress={() => router.push("/kyc/bank")}
            />

            <Pressable onPress={() => router.push("/profile/change-password")}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.bgElevated,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 14,
                  marginTop: spacing.sm,
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.text}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600" }}>Change password</Text>
                  <Text tone="dim" size="xs" style={{ marginTop: 2 }}>
                    Use your current password to set a new one
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </View>
            </Pressable>

            <Text tone="dim" size="xs" style={{ marginTop: 4, paddingHorizontal: 4 }}>
              Email and mobile can't be changed from the app. Contact support to update them.
            </Text>
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <GradientButton
              label={update.isPending ? "Saving…" : "Save changes"}
              disabled={!dirty || update.isPending}
              loading={update.isPending}
              onPress={save}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
