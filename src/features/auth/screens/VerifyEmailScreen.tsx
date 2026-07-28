import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@shared/components/Screen";
import { Header } from "@shared/components/Header";
import { Text } from "@shared/ui/Text";
import { Card } from "@shared/ui/Card";
import { Badge } from "@shared/ui/Badge";
import { GradientButton } from "@shared/ui/GradientButton";
import { OtpVerifySheet } from "@shared/components/OtpVerifySheet";
import { colors, spacing } from "@shared/theme";
import { ApiError } from "@core/api/errors";
import { useAuthStore } from "@features/auth/store/auth.store";
import {
  isEmailVerificationEnabled,
  useEmailVerificationStatus,
  useSendEmailCode,
  useVerifyEmailCode,
} from "@features/auth/hooks/useEmailVerification";

export function VerifyEmailScreen() {
  const enabled = isEmailVerificationEnabled();
  const user = useAuthStore((s) => s.user);
  const status = useEmailVerificationStatus();
  const send = useSendEmailCode();
  const verify = useVerifyEmailCode();

  const [challengeId, setChallengeId] = useState<string | undefined>();
  const [resendAfter, setResendAfter] = useState(60);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = status.data?.email ?? user?.email ?? "—";
  const verified = !!status.data?.verified;

  async function startVerification() {
    setError(null);
    const ch = await send.mutateAsync().catch(() => null);
    if (!ch) return;
    setChallengeId(ch.challenge_id);
    setResendAfter(ch.resend_after_sec ?? 60);
    setSheetOpen(true);
  }

  async function submitOtp(otp: string) {
    setError(null);
    try {
      await verify.mutateAsync({ otp, challengeId });
      setSheetOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Verification failed");
    }
  }

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Header title="Verify email" back />
      </View>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
            <Text style={{ flex: 1, fontSize: 15 }} numberOfLines={1}>
              {email}
            </Text>
            <Badge
              label={verified ? "VERIFIED" : "UNVERIFIED"}
              tone={verified ? "buy" : "warn"}
            />
          </View>
        </Card>

        {!enabled ? (
          <Card>
            <Text style={{ fontWeight: "700" }}>Not available yet</Text>
            <Text tone="muted" size="sm" style={{ marginTop: 4 }}>
              Email verification is switched off on this build. It turns on
              automatically once the mail service is configured — nothing to
              reinstall.
            </Text>
          </Card>
        ) : verified ? (
          <Card>
            <Text tone="buy" style={{ fontWeight: "700" }}>
              You're all set
            </Text>
            <Text tone="muted" size="sm" style={{ marginTop: 4 }}>
              This email can be used for account recovery and statements.
            </Text>
          </Card>
        ) : (
          <>
            <Text tone="muted" size="sm">
              We'll email a 6-digit code to the address above. Enter it here to
              confirm the address belongs to you.
            </Text>
            <GradientButton
              label={send.isPending ? "Sending…" : "Send verification code"}
              loading={send.isPending}
              disabled={send.isPending}
              onPress={() => void startVerification()}
            />
          </>
        )}

        <Text tone="dim" size="xs" style={{ textAlign: "center" }}>
          Your email address itself can't be changed from the app — contact
          support for that.
        </Text>
      </ScrollView>

      <OtpVerifySheet
        visible={sheetOpen}
        title="Verify your email"
        subtitle={`We sent a 6-digit code to ${email}.`}
        sending={send.isPending}
        verifying={verify.isPending}
        error={error}
        resendAfterSec={resendAfter}
        onResend={() => void startVerification()}
        onSubmit={(otp) => void submitOtp(otp)}
        onClose={() => setSheetOpen(false)}
      />
    </Screen>
  );
}
