import { memo } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@shared/ui/Text";
import { Badge } from "@shared/ui/Badge";
import { colors, radii, spacing } from "@shared/theme";
import { maskAccount } from "@features/wallet/schemas/bank.schema";
import type { UserBank } from "@features/wallet/types/wallet.types";

interface Props {
  bank: UserBank;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

function BankAccountCardImpl({ bank, onEdit, onDelete, disabled }: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.bgElevated,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: bank.is_default ? colors.primary : colors.border,
        padding: spacing.md,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="business-outline" size={18} color={colors.textMuted} />
        <Text style={{ flex: 1, fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
          {bank.bank_name}
        </Text>
        {bank.is_default ? <Badge label="DEFAULT" tone="primary" /> : null}
        {bank.is_verified ? <Badge label="VERIFIED" tone="buy" /> : null}
      </View>

      <Text tone="muted" size="sm">
        {maskAccount(bank.account_number)} · {bank.ifsc_code}
      </Text>
      <Text tone="dim" size="xs">
        {bank.account_holder}
        {bank.nickname ? ` · ${bank.nickname}` : ""}
      </Text>

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: 6 }}>
        <Action icon="create-outline" label="Edit" onPress={onEdit} disabled={disabled} />
        <Action
          icon="trash-outline"
          label="Delete"
          tone={colors.sell}
          onPress={onDelete}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
  tone,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: string;
  disabled?: boolean;
}) {
  const color = disabled ? colors.textDim : (tone ?? colors.text);
  return (
    <Pressable onPress={disabled ? undefined : onPress} hitSlop={6}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.bg,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Ionicons name={icon} size={15} color={color} />
        <Text size="sm" style={{ color, fontWeight: "600" }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export const BankAccountCard = memo(BankAccountCardImpl);
