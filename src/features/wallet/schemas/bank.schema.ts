import { z } from "zod";
import { isValidIFSC } from "@shared/utils/validators";

// Mirrors the backend's payout-account validation so a bad IFSC is caught
// before the round-trip. Account numbers are 9-18 digits across Indian
// banks; spaces are stripped, never rejected.
export const bankAccountSchema = z.object({
  bank_name: z.string().trim().min(2, "Enter the bank name"),
  account_holder: z.string().trim().min(2, "Enter the name as per passbook"),
  account_number: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => /^\d{9,18}$/.test(v), "Account number must be 9-18 digits"),
  ifsc_code: z
    .string()
    .transform((v) => v.toUpperCase().trim())
    .refine(isValidIFSC, "Invalid IFSC — format XXXX0XXXXXX"),
  nickname: z.string().trim().max(24, "Keep it under 24 characters").optional(),
  is_default: z.boolean().optional(),
});

export type BankAccountValues = z.infer<typeof bankAccountSchema>;

/** Show only the last 4 digits anywhere an account is listed. */
export function maskAccount(accountNumber: string): string {
  const digits = (accountNumber ?? "").replace(/\s/g, "");
  if (digits.length <= 4) return digits;
  return `${"•".repeat(Math.min(digits.length - 4, 8))} ${digits.slice(-4)}`;
}
