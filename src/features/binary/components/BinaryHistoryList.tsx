import { memo } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@shared/theme";
import { Text } from "@shared/ui/Text";
import {
  prettySymbol,
  statusLabel,
  statusTone,
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
      <Text numeric size="sm">
        {value}
      </Text>
    </View>
  );
}

function HistoryRow({ b }: { b: BinaryOption }) {
  const isHigher = b.direction === "HIGHER";
  const tone = statusTone(b.status);
  const pnl = b.profit_loss != null ? Number(b.profit_loss) : null;
  const pnlText =
    pnl == null ? "—" : `${pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(2)}`;

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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text weight="semibold">{prettySymbol(b.symbol)}</Text>
          <Ionicons
            name={isHigher ? "arrow-up" : "arrow-down"}
            size={13}
            color={isHigher ? colors.buy : colors.sell}
          />
        </View>
        <View
          style={{
            backgroundColor:
              tone === "buy"
                ? colors.buyDim
                : tone === "sell"
                ? colors.sellDim
                : colors.bgChip,
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: radii.full,
          }}
        >
          <Text size="xs" tone={tone === "muted" ? "muted" : tone} weight="semibold">
            {statusLabel(b.status)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}>
        <Stat label="Stake" value={`${b.stake}`} />
        <Stat label="Strike" value={Number(b.strike_price).toFixed(5)} />
        <Stat
          label="Settle"
          value={b.settle_price != null ? Number(b.settle_price).toFixed(5) : "—"}
        />
        <View style={{ alignItems: "flex-end" }}>
          <Text tone="dim" size="xs">
            P&amp;L
          </Text>
          <Text
            numeric
            weight="semibold"
            tone={tone === "muted" ? "muted" : tone}
          >
            {pnlText}
          </Text>
        </View>
      </View>
    </View>
  );
}

function BinaryHistoryListImpl({ items }: Props) {
  if (items.length === 0) {
    return (
      <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
        <Ionicons name="receipt-outline" size={28} color={colors.textDim} />
        <Text tone="dim" size="sm" style={{ marginTop: spacing.sm }}>
          No settled trades yet
        </Text>
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((b) => (
        <HistoryRow key={b.id} b={b} />
      ))}
    </View>
  );
}

export const BinaryHistoryList = memo(BinaryHistoryListImpl);
