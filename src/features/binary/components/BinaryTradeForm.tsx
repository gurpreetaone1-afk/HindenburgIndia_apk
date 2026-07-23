import { memo, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@shared/theme";
import { Text } from "@shared/ui/Text";
import { Input } from "@shared/ui/Input";
import { Button } from "@shared/ui/Button";
import {
  formatDuration,
  payoutForDuration,
  profitFor,
} from "@features/binary/utils/binary.utils";
import type {
  BinaryDirection,
  BinarySettings,
} from "@features/binary/types/binary.types";

interface Props {
  settings?: BinarySettings;
  balance: number;
  placing: boolean;
  onPlace: (direction: BinaryDirection, stake: number, durationSec: number) => void;
}

function BinaryTradeFormImpl({ settings, balance, placing, onPlace }: Props) {
  const durations = settings?.allowed_durations ?? [];
  const [duration, setDuration] = useState<number | null>(null);
  const [stake, setStake] = useState("");

  // Default to the first allowed duration once settings load.
  useEffect(() => {
    const first = durations[0];
    if (duration == null && first != null) setDuration(first);
  }, [durations, duration]);

  const min = settings?.min_stake_inr ?? 0;
  const max = settings?.max_stake_inr ?? 0;
  const stakeNum = Number(stake);
  const payoutPct = useMemo(
    () => payoutForDuration(settings, duration ?? 0),
    [settings, duration],
  );
  const profit = profitFor(stakeNum, payoutPct);

  const stakeValid =
    Number.isFinite(stakeNum) &&
    stakeNum > 0 &&
    (min <= 0 || stakeNum >= min) &&
    (max <= 0 || stakeNum <= max);
  const enough = stakeNum <= balance;
  const canTrade =
    !!settings?.enabled && duration != null && stakeValid && enough && !placing;

  const stakeError =
    stake.length > 0 && !stakeValid
      ? min > 0 && stakeNum < min
        ? `Min ${min}`
        : max > 0 && stakeNum > max
        ? `Max ${max}`
        : "Enter a valid amount"
      : stake.length > 0 && !enough
      ? "Insufficient balance"
      : undefined;

  const quickStakes = useMemo(() => {
    const base = min > 0 ? min : 100;
    const cap = max > 0 ? max : base * 25;
    return [base, base * 5, base * 10, cap].filter(
      (v, i, a) => v <= cap && a.indexOf(v) === i,
    );
  }, [min, max]);

  function place(direction: BinaryDirection) {
    if (!canTrade || duration == null) return;
    onPlace(direction, stakeNum, duration);
  }

  if (settings && !settings.enabled) {
    return (
      <View
        style={{
          borderRadius: radii.md,
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        <Ionicons name="lock-closed-outline" size={18} color={colors.warn} />
        <Text tone="muted" size="sm" style={{ flex: 1 }}>
          Binary trading isn&apos;t enabled for this asset yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      {/* Duration chips */}
      <View style={{ gap: spacing.xs }}>
        <Text tone="muted" size="sm">
          Expiry
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {durations.map((d) => {
            const active = d === duration;
            return (
              <Pressable
                key={d}
                onPress={() => setDuration(d)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor: active ? colors.primary : colors.bgChip,
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  numeric
                  size="sm"
                  weight="semibold"
                  style={{ color: active ? colors.textInverse : colors.text }}
                >
                  {formatDuration(d)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Stake + payout */}
      <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Input
            label="Stake"
            keyboardType="numeric"
            placeholder={min > 0 ? `Min ${min}` : "Amount"}
            value={stake}
            onChangeText={setStake}
            error={stakeError}
          />
        </View>
        <View
          style={{
            minWidth: 96,
            borderRadius: radii.md,
            backgroundColor: colors.bgElevated,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            marginTop: 22,
          }}
        >
          <Text tone="dim" size="xs">
            Payout
          </Text>
          <Text numeric tone="buy" weight="semibold">
            +{Math.round(payoutPct * 100)}%
          </Text>
          <Text numeric tone="buy" size="xs">
            {profit.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Quick stakes */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {quickStakes.map((v) => (
          <Pressable
            key={v}
            onPress={() => setStake(String(v))}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.bgChip,
            }}
          >
            <Text numeric size="xs" tone="muted">
              {v}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button
            label="HIGHER"
            variant="buy"
            size="lg"
            fullWidth
            loading={placing}
            disabled={!canTrade}
            leadingIcon={
              <Ionicons name="trending-up" size={18} color={colors.textInverse} />
            }
            onPress={() => place("HIGHER")}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="LOWER"
            variant="sell"
            size="lg"
            fullWidth
            loading={placing}
            disabled={!canTrade}
            leadingIcon={
              <Ionicons name="trending-down" size={18} color={colors.text} />
            }
            onPress={() => place("LOWER")}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text tone="dim" size="xs">
          Balance
        </Text>
        <Text numeric size="sm" tone="muted">
          {balance.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

export const BinaryTradeForm = memo(BinaryTradeFormImpl);
