import { memo } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@shared/theme";
import { Text } from "@shared/ui/Text";
import { useNowTick } from "@features/binary/hooks/useNowTick";
import {
  formatRemaining,
  prettySymbol,
} from "@features/binary/utils/binary.utils";
import type { BinaryOption } from "@features/binary/types/binary.types";

interface Props {
  items: BinaryOption[];
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text tone="dim" size="xs">
        {label}
      </Text>
      <Text numeric size="sm" weight="medium">
        {value}
      </Text>
    </View>
  );
}

function ActiveRow({ b, now }: { b: BinaryOption; now: number }) {
  const start = new Date(b.placed_at).getTime();
  const end = new Date(b.expiry_at).getTime();
  const remainingMs = end - now;
  const total = Math.max(1, end - start);
  const elapsed = Math.min(total, Math.max(0, now - start));
  const fraction = 1 - elapsed / total; // bar drains as expiry approaches
  const urgent = remainingMs <= 5_000;
  const isHigher = b.direction === "HIGHER";

  return (
    <View
      style={{
        backgroundColor: colors.bgSurface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text weight="semibold">{prettySymbol(b.symbol)}</Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: isHigher ? colors.buyDim : colors.sellDim,
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: radii.full,
          }}
        >
          <Ionicons
            name={isHigher ? "arrow-up" : "arrow-down"}
            size={12}
            color={isHigher ? colors.buy : colors.sell}
          />
          <Text size="xs" tone={isHigher ? "buy" : "sell"} weight="semibold">
            {isHigher ? "HIGHER" : "LOWER"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Stat label="Stake" value={`${b.stake}`} />
        <Stat label="Strike" value={Number(b.strike_price).toFixed(5)} />
        <Stat label="Payout" value={`+${Math.round(b.payout_pct * 100)}%`} />
      </View>

      <View style={{ gap: 4 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text tone="dim" size="xs">
            Time left
          </Text>
          <Text
            numeric
            size="sm"
            weight="semibold"
            style={{ color: urgent ? colors.warn : colors.text }}
          >
            {formatRemaining(remainingMs)}
          </Text>
        </View>
        <View
          style={{
            height: 4,
            borderRadius: radii.full,
            backgroundColor: colors.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${Math.max(0, Math.min(1, fraction)) * 100}%`,
              backgroundColor: urgent ? colors.warn : colors.primary,
              borderRadius: radii.full,
            }}
          />
        </View>
      </View>
    </View>
  );
}

function BinaryActiveDockImpl({ items }: Props) {
  const now = useNowTick(1000);
  if (items.length === 0) {
    return (
      <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
        <Ionicons name="timer-outline" size={28} color={colors.textDim} />
        <Text tone="dim" size="sm" style={{ marginTop: spacing.sm }}>
          No active trades
        </Text>
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((b) => (
        <ActiveRow key={b.id} b={b} now={now} />
      ))}
    </View>
  );
}

export const BinaryActiveDock = memo(BinaryActiveDockImpl);
