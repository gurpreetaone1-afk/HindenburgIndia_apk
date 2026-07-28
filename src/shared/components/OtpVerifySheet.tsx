import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@shared/ui/Text";
import { OtpInput } from "@shared/ui/OtpInput";
import { GradientButton } from "@shared/ui/GradientButton";
import { colors, radii, spacing } from "@shared/theme";

const OTP_LENGTH = 6;

interface Props {
  visible: boolean;
  title: string;
  /** Where the code went — e.g. "Sent to •••••• 6733". */
  subtitle?: string;
  sending?: boolean;
  verifying?: boolean;
  error?: string | null;
  /** Seconds before "Resend" unlocks. Restarts whenever it changes. */
  resendAfterSec?: number;
  onResend: () => void;
  onSubmit: (otp: string) => void;
  onClose: () => void;
}

/** Bottom sheet that collects a 6-digit code. Owns nothing but the code
 *  itself — sending, verifying and error text are driven by the caller so
 *  the same sheet serves bank edits and email verification. */
export function OtpVerifySheet({
  visible,
  title,
  subtitle,
  sending,
  verifying,
  error,
  resendAfterSec = 30,
  onResend,
  onSubmit,
  onClose,
}: Props) {
  const [otp, setOtp] = useState("");
  const [left, setLeft] = useState(resendAfterSec);

  // Fresh sheet every time it opens: clear the previous code and restart
  // the resend cooldown.
  useEffect(() => {
    if (visible) {
      setOtp("");
      setLeft(resendAfterSec);
    }
  }, [visible, resendAfterSec]);

  useEffect(() => {
    if (!visible || left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, left]);

  const busy = !!sending || !!verifying;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bgOverlay, justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={busy ? undefined : onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            style={{
              backgroundColor: colors.bg,
              borderTopLeftRadius: radii.lg,
              borderTopRightRadius: radii.lg,
              borderTopWidth: 1,
              borderColor: colors.border,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: 17, fontWeight: "700", marginLeft: 8 }}>
                {title}
              </Text>
              <Pressable hitSlop={10} onPress={busy ? undefined : onClose}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {subtitle ? (
              <Text tone="muted" size="sm">
                {subtitle}
              </Text>
            ) : null}

            <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} autoFocus />

            {error ? (
              <Text tone="sell" size="sm">
                {error}
              </Text>
            ) : null}

            <GradientButton
              label={verifying ? "Verifying…" : "Verify & continue"}
              loading={!!verifying}
              disabled={otp.length !== OTP_LENGTH || busy}
              onPress={() => onSubmit(otp)}
            />

            <Pressable
              hitSlop={8}
              disabled={left > 0 || busy}
              onPress={() => {
                setOtp("");
                setLeft(resendAfterSec);
                onResend();
              }}
              style={{ alignSelf: "center", paddingVertical: 4 }}
            >
              <Text
                size="sm"
                style={{ color: left > 0 || busy ? colors.textDim : colors.primary }}
              >
                {sending
                  ? "Sending…"
                  : left > 0
                    ? `Resend code in ${left}s`
                    : "Resend code"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
