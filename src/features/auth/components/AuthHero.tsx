import { memo } from "react";
import { Image, View } from "react-native";
import { Text } from "@shared/ui/Text";

interface Props {
  title: string;
  subtitle?: string;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO = require("../../../../assets/images/icon.png");

function AuthHeroImpl({ title, subtitle }: Props) {
  return (
    <View style={{ marginBottom: 32, gap: 20 }}>
      {/* Brand lockup — tricolor "H" app mark + wordmark. Centered above the
          welcome text so login/register carry the Hindenburg identity. */}
      <View style={{ alignItems: "center", gap: 10 }}>
        <Image
          source={LOGO}
          style={{ width: 64, height: 64, borderRadius: 16 }}
          resizeMode="contain"
        />
        <View style={{ flexDirection: "row" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", letterSpacing: 0.5 }}>
            HINDENBURG{" "}
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              letterSpacing: 0.5,
              color: "#22c55e",
            }}
          >
            INDIA
          </Text>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>{title}</Text>
        {subtitle ? (
          <Text tone="muted" size="lg">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const AuthHero = memo(AuthHeroImpl);
