import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@shared/components/Screen";
import { Header } from "@shared/components/Header";
import { Text } from "@shared/ui/Text";
import { colors, radii, spacing } from "@shared/theme";
import { useWalletSummary } from "@features/wallet/hooks/useWallet";
import {
  useBinaryActive,
  useBinaryCandles,
  useBinaryHistory,
  useBinaryQuote,
  useBinarySettings,
  usePlaceBinary,
} from "@features/binary/hooks/useBinary";
import { BinaryChart } from "@features/binary/components/BinaryChart";
import { BinaryTradeForm } from "@features/binary/components/BinaryTradeForm";
import { BinaryActiveDock } from "@features/binary/components/BinaryActiveDock";
import { BinaryHistoryList } from "@features/binary/components/BinaryHistoryList";
import { BinaryAssetPicker } from "@features/binary/components/BinaryAssetPicker";
import { prettySymbol } from "@features/binary/utils/binary.utils";
import type { BinaryDirection } from "@features/binary/types/binary.types";

// 1-minute buckets for the chart line.
const CHART_RESOLUTION = 60;

type DockTab = "active" | "history";

export function BinaryTradingScreen() {
  // Global settings first — gives us the asset whitelist + defaults before
  // an asset is chosen. Per-asset payouts re-resolve once `symbol` is set.
  const globalSettings = useBinarySettings();
  const assets = useMemo(
    () => globalSettings.data?.enabled_assets ?? [],
    [globalSettings.data],
  );

  const [symbol, setSymbol] = useState<string | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dock, setDock] = useState<DockTab>("active");

  // Auto-select the first whitelisted asset.
  useEffect(() => {
    if (!symbol && assets.length > 0) setSymbol(assets[0]);
  }, [assets, symbol]);

  const settings = useBinarySettings(symbol);
  const quote = useBinaryQuote(symbol);
  const candles = useBinaryCandles(symbol, CHART_RESOLUTION);
  const active = useBinaryActive();
  const history = useBinaryHistory(1);
  const wallet = useWalletSummary();
  const place = usePlaceBinary();

  const ltp = quote.data?.ltp ?? 0;
  const balance = Number(wallet.data?.available_balance ?? 0);
  const cfg = settings.data ?? globalSettings.data;

  function onPlace(direction: BinaryDirection, stake: number, durationSec: number) {
    if (!symbol) return;
    place.mutate({ symbol, direction, stake, duration_sec: durationSec });
  }

  const activeItems = active.data ?? [];
  const historyItems = history.data?.items ?? [];

  return (
    <Screen>
      <Header
        back
        title="Binary"
        subtitle={symbol ? prettySymbol(symbol) : "Higher / Lower"}
        right={
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: colors.bgChip,
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
              borderRadius: radii.full,
            }}
          >
            <Ionicons name="wallet-outline" size={14} color={colors.textMuted} />
            <Text numeric size="sm" tone="muted">
              {balance.toFixed(0)}
            </Text>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: spacing.md, paddingBottom: 40 }}
      >
        {/* Asset selector */}
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: colors.bgElevated,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
            <Text weight="semibold">
              {symbol ? prettySymbol(symbol) : "Select asset"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>

        <BinaryChart
          symbol={symbol}
          ltp={ltp}
          candles={candles.data ?? []}
          loading={candles.isLoading}
        />

        <BinaryTradeForm
          settings={settings.data}
          balance={balance}
          placing={place.isPending}
          onPlace={onPlace}
        />

        {/* Active / History dock */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <DockToggle
              label={`Active${activeItems.length ? ` (${activeItems.length})` : ""}`}
              active={dock === "active"}
              onPress={() => setDock("active")}
            />
            <DockToggle
              label="History"
              active={dock === "history"}
              onPress={() => setDock("history")}
            />
          </View>
          {dock === "active" ? (
            <BinaryActiveDock items={activeItems} />
          ) : (
            <BinaryHistoryList items={historyItems} />
          )}
        </View>
      </ScrollView>

      <BinaryAssetPicker
        visible={pickerOpen}
        assets={assets}
        selected={symbol}
        onSelect={setSymbol}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  );
}

function DockToggle({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        backgroundColor: active ? colors.text : colors.bgChip,
        borderWidth: active ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <Text
        size="sm"
        weight="semibold"
        style={{ color: active ? colors.textInverse : colors.text }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
