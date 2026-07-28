import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@shared/ui/Text";
import { colors, radii, spacing } from "@shared/theme";

type IconName = keyof typeof Ionicons.glyphMap;

const BOX = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  backgroundColor: colors.bgElevated,
  borderRadius: radii.md,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.md,
  paddingVertical: 14,
};

function Label({ children }: { children: ReactNode }) {
  return (
    <Text tone="muted" size="sm" style={{ marginLeft: 4, marginBottom: 4 }}>
      {children}
    </Text>
  );
}

/** Locked value — the backend won't accept a change from the app. */
export function ReadOnlyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: IconName;
}) {
  return (
    <View>
      <Label>{label}</Label>
      <View style={[BOX, { opacity: 0.85 }]}>
        <Ionicons name={icon} size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
        <Text style={{ flex: 1, fontSize: 15 }}>{value}</Text>
        <Ionicons name="lock-closed" size={12} color={colors.textDim} />
      </View>
    </View>
  );
}

/** Same visual language as ReadOnlyField, but the row opens a flow —
 *  KYC → bank details, email → verification. */
export function ActionField({
  label,
  value,
  icon,
  hint,
  right,
  onPress,
}: {
  label: string;
  value: string;
  icon: IconName;
  hint?: string;
  right?: ReactNode;
  onPress: () => void;
}) {
  return (
    <View>
      <Label>{label}</Label>
      <Pressable onPress={onPress}>
        <View style={BOX}>
          <Ionicons name={icon} size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15 }}>{value}</Text>
            {hint ? (
              <Text tone="dim" size="xs" style={{ marginTop: 2 }}>
                {hint}
              </Text>
            ) : null}
          </View>
          {right}
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textDim}
            style={{ marginLeft: 6 }}
          />
        </View>
      </Pressable>
    </View>
  );
}
