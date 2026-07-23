import { memo, useMemo } from "react";
import { Dimensions, View } from "react-native";
import { colors, radii, spacing } from "@shared/theme";
import { Text } from "@shared/ui/Text";
import { IntradayLineChart } from "@features/charts/components/IntradayLineChart";
import { prettySymbol } from "@features/binary/utils/binary.utils";
import type { BinaryCandle } from "@features/binary/types/binary.types";

interface Props {
  symbol?: string;
  ltp: number;
  candles: BinaryCandle[];
  loading?: boolean;
}

const CHART_HEIGHT = Math.round(Dimensions.get("window").height * 0.32);

function BinaryChartImpl({ symbol, ltp, candles, loading }: Props) {
  const closes = useMemo(() => candles.map((c) => c.c), [candles]);
  const startTs = candles[0]?.t;
  const endTs = candles[candles.length - 1]?.t;
  // Card lives inside a screen with spacing.lg horizontal padding.
  const width = Dimensions.get("window").width - spacing.lg * 2 - spacing.lg * 2;

  // Sign the line by first→last close so it greens on an up-move.
  const up =
    closes.length >= 2
      ? (closes[closes.length - 1] as number) >= (closes[0] as number)
      : true;

  return (
    <View
      style={{
        backgroundColor: colors.bgElevated,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <Text weight="semibold" variant="subheading">
          {symbol ? prettySymbol(symbol) : "—"}
        </Text>
        <Text numeric weight="bold" size="lg" tone={up ? "buy" : "sell"}>
          {ltp > 0 ? ltp.toFixed(5) : "—"}
        </Text>
      </View>

      {closes.length >= 2 ? (
        <IntradayLineChart
          data={closes}
          width={Math.max(0, width)}
          height={CHART_HEIGHT}
          startTs={startTs}
          endTs={endTs}
          color={up ? colors.buy : colors.sell}
        />
      ) : (
        <View
          style={{
            height: CHART_HEIGHT,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text tone="dim" size="sm">
            {loading ? "Loading chart…" : "No price data"}
          </Text>
        </View>
      )}
    </View>
  );
}

export const BinaryChart = memo(BinaryChartImpl);
