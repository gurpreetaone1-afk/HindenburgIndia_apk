import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@shared/components/Screen";
import { Header } from "@shared/components/Header";
import { Text } from "@shared/ui/Text";
import { Input } from "@shared/ui/Input";
import { GradientButton } from "@shared/ui/GradientButton";
import { colors, radii, spacing } from "@shared/theme";
import { useUiStore } from "@shared/store/ui.store";
import { formatINR } from "@shared/utils/format";
import {
  useMyBankAccounts,
  useWalletSummary,
  useWithdraw,
} from "@features/wallet/hooks/useWallet";
import type { UserBank } from "@features/wallet/types/wallet.types";

const QUICK_AMOUNTS = [500, 1000, 5000, 10000, 25000];

// Withdrawals ALWAYS go to a saved bank account (the same accounts the user
// added during KYC / on the Bank Accounts screen). There is intentionally NO
// free-form bank/UPI entry here — the user just picks one of their linked
// accounts, and "Add new" opens the same bank-add flow used in KYC.
export default function WithdrawScreen() {
  const pushToast = useUiStore((s) => s.pushToast);
  const banks = useMyBankAccounts();
  const summary = useWalletSummary();
  const withdraw = useWithdraw();

  const [amount, setAmount] = useState("");
  const [bankId, setBankId] = useState("");
  const [remarks, setRemarks] = useState("");

  const selected = useMemo(
    () => banks.data?.find((b) => b.id === bankId),
    [banks.data, bankId],
  );

  // Default-select the user's default (or first) linked bank as soon as the
  // list loads, so the common case needs zero taps beyond the amount.
  useEffect(() => {
    if (!bankId && banks.data?.length) {
      const def = banks.data.find((b) => b.is_default) ?? banks.data[0];
      if (def) setBankId(def.id);
    }
  }, [banks.data, bankId]);

  async function submit() {
    const n = Number(amount);
    if (!n || n <= 0) {
      pushToast({ kind: "error", message: "Amount required" });
      return;
    }
    if (!selected) {
      pushToast({ kind: "error", message: "Select a bank account" });
      return;
    }

    const avail = Number(summary.data?.available_balance ?? 0);
    if (avail > 0 && n > avail) {
      pushToast({
        kind: "warn",
        message: `Available balance ${formatINR(avail)} — admin may reject larger requests`,
      });
    }

    try {
      await withdraw.mutateAsync({
        amount: n,
        remarks: remarks || undefined,
        bank: {
          name: selected.bank_name,
          account_number: selected.account_number,
          ifsc: selected.ifsc_code,
          holder: selected.account_holder,
        },
      });
      pushToast({
        kind: "success",
        message: "Withdrawal requested — awaiting admin approval",
      });
      router.back();
    } catch {
      // hook surfaces error toast
    }
  }

  const submitting = withdraw.isPending;
  const canSubmit = !!selected;

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Header title="Withdraw funds" back />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing["5xl"] * 2,
            gap: spacing.md,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View
            style={{
              backgroundColor: colors.bgElevated,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: 6,
            }}
          >
            <Text tone="muted" size="xs" style={{ letterSpacing: 0.5 }}>
              AVAILABLE TO WITHDRAW
            </Text>
            <Text mono style={{ fontSize: 24, fontWeight: "700" }}>
              {formatINR(summary.data?.available_balance ?? 0)}
            </Text>
            <Text tone="dim" size="xs">
              Payout goes to your selected bank account. Admin approves before
              payout.
            </Text>
          </View>

          <Input
            label="Amount"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ""))}
            placeholder="0"
          />

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {QUICK_AMOUNTS.map((v) => (
              <Pressable key={v} onPress={() => setAmount(String(v))}>
                <View
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.bgElevated,
                  }}
                >
                  <Text size="xs" style={{ fontWeight: "600" }}>
                    {v.toLocaleString("en-IN")}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Bank account picker — select one of the linked accounts. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <Text tone="muted" size="sm" style={{ marginLeft: 4 }}>
              Bank account
            </Text>
            <Pressable
              onPress={() => router.push("/wallet/add-bank")}
              hitSlop={6}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons name="add-circle-outline" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>
                Add new
              </Text>
            </Pressable>
          </View>

          {banks.isLoading ? (
            <View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (banks.data?.length ?? 0) === 0 ? (
            <View
              style={{
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: colors.border,
                borderRadius: radii.lg,
                padding: spacing.md,
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons name="card-outline" size={26} color={colors.textMuted} />
              <Text tone="muted" size="sm" style={{ textAlign: "center" }}>
                No bank accounts linked yet
              </Text>
              <Pressable onPress={() => router.push("/wallet/add-bank")} hitSlop={8}>
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>
                  + Add a bank account
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {banks.data!.map((b) => (
                <BankRow
                  key={b.id}
                  bank={b}
                  active={b.id === bankId}
                  onPress={() => setBankId(b.id)}
                />
              ))}
            </View>
          )}

          <Input
            label="Remarks (optional)"
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Add a note for the admin"
          />

          <View style={{ marginTop: spacing.md }}>
            <GradientButton
              label="Request withdrawal"
              loading={submitting}
              disabled={submitting || !canSubmit}
              onPress={submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function BankRow({
  bank,
  active,
  onPress,
}: {
  bank: UserBank;
  active: boolean;
  onPress: () => void;
}) {
  const last4 = String(bank.account_number).slice(-4);
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: radii.lg,
        borderWidth: active ? 2 : 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? "rgba(168,85,247,0.08)" : colors.bgElevated,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(168,85,247,0.18)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="card-outline" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600" }} numberOfLines={1}>
          {bank.bank_name}
        </Text>
        <Text tone="muted" size="xs" numberOfLines={1}>
          {bank.account_holder} · •••• {last4}
        </Text>
      </View>
      {bank.is_verified ? (
        <Ionicons name="checkmark-circle" size={16} color={colors.buy} />
      ) : null}
    </Pressable>
  );
}
