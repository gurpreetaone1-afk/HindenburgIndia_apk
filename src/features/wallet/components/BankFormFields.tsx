import { View } from "react-native";
import { Controller, type Control } from "react-hook-form";
import { Input } from "@shared/ui/Input";
import { Text } from "@shared/ui/Text";
import { Toggle } from "@shared/ui/Toggle";
import { colors, radii } from "@shared/theme";
import type { BankAccountValues } from "@features/wallet/schemas/bank.schema";

/** Field set shared by the add and edit screens. Validation lives in
 *  `bankAccountSchema`; this only renders. */
export function BankFormFields({ control }: { control: Control<BankAccountValues> }) {
  return (
    <>
      <Controller
        control={control}
        name="bank_name"
        render={({ field, fieldState }) => (
          <Input
            label="Bank name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="e.g. HDFC Bank"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="account_holder"
        render={({ field, fieldState }) => (
          <Input
            label="Account holder name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="As per passbook"
            autoCapitalize="words"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="account_number"
        render={({ field, fieldState }) => (
          <Input
            label="Account number"
            value={field.value}
            onChangeText={(v) => field.onChange(v.replace(/\s/g, ""))}
            onBlur={field.onBlur}
            placeholder="A/C number"
            keyboardType="number-pad"
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="ifsc_code"
        render={({ field, fieldState }) => (
          <Input
            label="IFSC code"
            value={field.value}
            onChangeText={(v) => field.onChange(v.toUpperCase())}
            onBlur={field.onBlur}
            placeholder="e.g. HDFC0001234"
            autoCapitalize="characters"
            error={fieldState.error?.message}
            hint="11 characters, format XXXX0XXXXXX"
          />
        )}
      />
      <Controller
        control={control}
        name="nickname"
        render={({ field }) => (
          <Input
            label="Nickname (optional)"
            value={field.value ?? ""}
            onChangeText={field.onChange}
            placeholder="Salary / Savings"
          />
        )}
      />
      <Controller
        control={control}
        name="is_default"
        render={({ field }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.bgElevated,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 14,
              paddingHorizontal: 14,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "500", fontSize: 14 }}>Set as default</Text>
              <Text tone="muted" size="xs" style={{ marginTop: 2 }}>
                Pre-selected for future withdrawals.
              </Text>
            </View>
            <Toggle value={!!field.value} onChange={field.onChange} />
          </View>
        )}
      />
    </>
  );
}
