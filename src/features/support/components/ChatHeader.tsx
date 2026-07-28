import { Linking, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@shared/ui/Text";
import { colors, spacing } from "@shared/theme";

interface Props {
  typing: boolean;
  /** wa.me link from admin-managed contacts — hidden when unavailable. */
  whatsappUrl: string | null;
}

/** Chat-app header: back, avatar, name + presence line, WhatsApp shortcut. */
export function ChatHeader({ typing, whatsappUrl }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bgElevated,
      }}
    >
      <Pressable hitSlop={10} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>

      <LinearGradient
        colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="headset" size={19} color="#fff" />
      </LinearGradient>

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700", fontSize: 15 }}>Hindenburg Support</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}>
          {!typing ? (
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.buy,
              }}
            />
          ) : null}
          <Text tone={typing ? "buy" : "muted"} size="xs">
            {typing ? "typing…" : "Online · replies in a few minutes"}
          </Text>
        </View>
      </View>

      {whatsappUrl ? (
        <Pressable hitSlop={10} onPress={() => void Linking.openURL(whatsappUrl)}>
          <Ionicons name="logo-whatsapp" size={22} color={colors.buy} />
        </Pressable>
      ) : null}
    </View>
  );
}
