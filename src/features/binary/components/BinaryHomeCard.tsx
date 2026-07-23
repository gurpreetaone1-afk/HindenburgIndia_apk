import { memo } from "react";
import { Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, radii, spacing } from "@shared/theme";
import { Text } from "@shared/ui/Text";

// Home-screen entry point into the full-screen binary terminal. Uses the
// brand gradient so it reads as a distinct "product" tile against the
// dark home feed.
function BinaryHomeCardImpl() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push("/binary")}>
      <LinearGradient
        colors={[colors.gradientVia, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: radii.lg,
          padding: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.full,
              backgroundColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="swap-vertical" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="bold" size="md" style={{ color: "#FFFFFF" }}>
              Binary Trading
            </Text>
            <Text size="xs" style={{ color: "rgba(255,255,255,0.85)" }}>
              Higher or Lower · fixed payouts
            </Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </LinearGradient>
    </Pressable>
  );
}

export const BinaryHomeCard = memo(BinaryHomeCardImpl);
