import { useEffect } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Screen } from "@shared/components/Screen";
import { Header } from "@shared/components/Header";
import { Text } from "@shared/ui/Text";
import { GradientButton } from "@shared/ui/GradientButton";
import { OtpVerifySheet } from "@shared/components/OtpVerifySheet";
import { spacing } from "@shared/theme";
import { useAuthStore } from "@features/auth/store/auth.store";
import { BankFormFields } from "@features/wallet/components/BankFormFields";
import {
  bankAccountSchema,
  type BankAccountValues,
} from "@features/wallet/schemas/bank.schema";
import {
  useBankCapacity,
  useMyBankAccounts,
  useSaveBankAccount,
} from "@features/wallet/hooks/useBankAccounts";
import { useBankOtpGate } from "@features/wallet/hooks/useBankOtpGate";

const EMPTY: BankAccountValues = {
  bank_name: "",
  account_holder: "",
  account_number: "",
  ifsc_code: "",
  nickname: "",
  is_default: false,
};

export function BankFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const user = useAuthStore((s) => s.user);
  const banks = useMyBankAccounts();
  const { used, max, canAdd } = useBankCapacity();
  const save = useSaveBankAccount();
  const gate = useBankOtpGate(user?.mobile);

  const editing = !!id;
  const existing = banks.data?.find((b) => b.id === id);
  // Guard the cap here too — the list screen hides the button, but a stale
  // deep-link straight into the form would otherwise slip past it.
  const blocked = !editing && !canAdd;

  const { control, handleSubmit, reset } = useForm<BankAccountValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: EMPTY,
    mode: "onBlur",
  });

  // The list may still be in flight when the edit screen mounts — hydrate
  // the form as soon as the record lands.
  useEffect(() => {
    if (!existing) return;
    reset({
      bank_name: existing.bank_name,
      account_holder: existing.account_holder,
      account_number: existing.account_number,
      ifsc_code: existing.ifsc_code,
      nickname: existing.nickname ?? "",
      is_default: existing.is_default,
    });
  }, [existing, reset]);

  function onSubmit(values: BankAccountValues) {
    if (blocked) return;
    void gate.start({
      action: editing ? "UPDATE" : "ADD",
      existingCount: used,
      bankAccountId: id,
      perform: async (proof) => {
        await save.mutateAsync({
          id,
          body: { ...values, nickname: values.nickname || undefined },
          proof,
        });
        // Pop on the next frame so the OTP sheet finishes closing first.
        requestAnimationFrame(() => router.back());
      },
    });
  }

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Header title={editing ? "Edit bank account" : "Add bank account"} back />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing["5xl"],
            gap: spacing.md,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text tone="muted" size="sm">
            {blocked
              ? `You already have ${max} saved accounts. Delete one before adding another.`
              : "We pay approved withdrawals into this account, so the name must match your KYC."}
          </Text>

          <BankFormFields control={control} />

          <GradientButton
            label={editing ? "Save changes" : "Save bank account"}
            loading={save.isPending || gate.sending}
            disabled={blocked || save.isPending || gate.sending}
            onPress={handleSubmit(onSubmit)}
          />

          {editing ? (
            <Text tone="dim" size="xs" style={{ textAlign: "center" }}>
              You'll get an OTP on your registered mobile to confirm this change.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <OtpVerifySheet
        visible={gate.visible}
        title="Confirm with OTP"
        subtitle={gate.subtitle}
        sending={gate.sending}
        verifying={gate.verifying || save.isPending}
        error={gate.error}
        resendAfterSec={gate.resendAfterSec}
        onResend={() => void gate.resend()}
        onSubmit={(otp) => void gate.submit(otp)}
        onClose={gate.close}
      />
    </Screen>
  );
}
