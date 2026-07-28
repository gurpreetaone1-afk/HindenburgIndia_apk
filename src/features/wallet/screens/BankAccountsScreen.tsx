import { Alert, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@shared/components/Screen";
import { Header } from "@shared/components/Header";
import { Text } from "@shared/ui/Text";
import { Loader } from "@shared/ui/Loader";
import { GradientButton } from "@shared/ui/GradientButton";
import { OtpVerifySheet } from "@shared/components/OtpVerifySheet";
import { colors, radii, spacing } from "@shared/theme";
import { useAuthStore } from "@features/auth/store/auth.store";
import { BankAccountCard } from "@features/wallet/components/BankAccountCard";
import {
  useBankCapacity,
  useDeleteBankAccount,
  useMyBankAccounts,
} from "@features/wallet/hooks/useBankAccounts";
import { useBankOtpGate } from "@features/wallet/hooks/useBankOtpGate";

export function BankAccountsScreen() {
  const user = useAuthStore((s) => s.user);
  const banks = useMyBankAccounts();
  const { used, max, canAdd } = useBankCapacity();
  const del = useDeleteBankAccount();
  const gate = useBankOtpGate(user?.mobile);

  const list = banks.data ?? [];
  const hasBank = list.length > 0;

  function confirmDelete(id: string, label: string) {
    Alert.alert(
      "Remove bank account?",
      `${label} will no longer be available for withdrawals.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            void gate.start({
              action: "DELETE",
              existingCount: used,
              bankAccountId: id,
              perform: (proof) => del.mutateAsync({ id, proof }),
            });
          },
        },
      ],
    );
  }

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Header title="Bank details" back />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing["3xl"],
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Banner hasBank={hasBank} />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text tone="muted" size="sm" style={{ flex: 1 }}>
            {used} of {max} accounts used
          </Text>
          {!canAdd ? (
            <Text tone="warn" size="xs">
              Limit reached — delete one to add another
            </Text>
          ) : null}
        </View>

        {banks.isLoading ? (
          <Loader label="Loading bank accounts…" />
        ) : hasBank ? (
          list.map((b) => (
            <BankAccountCard
              key={b.id}
              bank={b}
              disabled={del.isPending || gate.visible}
              onEdit={() => router.push({ pathname: "/kyc/bank-form", params: { id: b.id } })}
              onDelete={() => confirmDelete(b.id, b.bank_name)}
            />
          ))
        ) : null}

        <GradientButton
          label={hasBank ? "Add another bank account" : "Add bank details"}
          disabled={!canAdd || banks.isLoading}
          onPress={() => router.push("/kyc/bank-form")}
        />

        <Text tone="dim" size="xs" style={{ textAlign: "center" }}>
          {hasBank
            ? "Editing or deleting a saved account needs an OTP on your registered mobile."
            : "Your first account is saved as part of KYC. Later changes need an OTP."}
        </Text>
      </ScrollView>

      <OtpVerifySheet
        visible={gate.visible}
        title="Confirm with OTP"
        subtitle={gate.subtitle}
        sending={gate.sending}
        verifying={gate.verifying || del.isPending}
        error={gate.error}
        resendAfterSec={gate.resendAfterSec}
        onResend={() => void gate.resend()}
        onSubmit={(otp) => void gate.submit(otp)}
        onClose={gate.close}
      />
    </Screen>
  );
}

function Banner({ hasBank }: { hasBank: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: hasBank ? colors.border : colors.primary,
        backgroundColor: hasBank ? colors.bgElevated : colors.primaryDim,
      }}
    >
      <Ionicons
        name={hasBank ? "shield-checkmark-outline" : "information-circle-outline"}
        size={18}
        color={hasBank ? colors.buy : colors.primary}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700" }}>
          {hasBank ? "Bank details on file" : "Complete your KYC"}
        </Text>
        <Text tone="muted" size="sm" style={{ marginTop: 2 }}>
          {hasBank
            ? "Payouts go to the account marked default. Keep it up to date."
            : "Add the bank account where you want withdrawals paid out."}
        </Text>
      </View>
    </View>
  );
}
