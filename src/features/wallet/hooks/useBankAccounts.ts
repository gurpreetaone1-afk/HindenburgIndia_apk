import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@core/api/errors";
import { flags, MAX_BANK_ACCOUNTS } from "@core/config/flags";
import { useUiStore } from "@shared/store/ui.store";
import { BankAPI } from "@features/wallet/api/bank.api";
import { useMyBankAccounts } from "@features/wallet/hooks/useWallet";
import type {
  BankAccountInput,
  BankOtpAction,
  BankOtpProof,
} from "@features/wallet/types/bank.types";

// Same key useWallet registers the list query under — mutations here
// invalidate it so the list, the withdraw picker and the KYC row all
// refresh off one fetch.
const MY_BANKS_KEY = ["wallet", "bank-accounts"] as const;

export { useMyBankAccounts, MAX_BANK_ACCOUNTS };

// The OTP challenge route may not be deployed yet. The first 404/501 flips
// this for the rest of the session so the user isn't stuck behind a gate
// the server can't serve — the change still goes through, and the server
// stays the real authority once it does ship.
let otpSupported = true;
export const isBankOtpSupported = (): boolean => otpSupported;

function markUnsupported(e: ApiError): boolean {
  const dead = e.status === 404 || e.status === 501 || e.code === "NOT_FOUND";
  if (dead) otpSupported = false;
  return dead;
}

/**
 * The first payout account is captured as part of KYC setup, so it saves
 * without a code. Every change after that — editing, deleting, or adding
 * another account — is OTP-verified on the registered mobile.
 */
export function bankChangeNeedsOtp(
  action: BankOtpAction,
  existingCount: number,
): boolean {
  if (!flags.BANK_CHANGE_OTP || !otpSupported) return false;
  return action === "ADD" ? existingCount > 0 : true;
}

export function useBankCapacity() {
  const q = useMyBankAccounts();
  const used = q.data?.length ?? 0;
  return {
    used,
    max: MAX_BANK_ACCOUNTS,
    canAdd: used < MAX_BANK_ACCOUNTS,
    isLoading: q.isLoading,
  };
}

/** Requests the SMS challenge. Resolves to `null` when the backend has no
 *  OTP route — callers treat that as "proceed without proof". */
export function useRequestBankOtp() {
  const pushToast = useUiStore((s) => s.pushToast);
  return useMutation({
    mutationFn: async (vars: { action: BankOtpAction; bankAccountId?: string }) => {
      try {
        return await BankAPI.requestOtp(vars.action, vars.bankAccountId);
      } catch (e) {
        if (e instanceof ApiError && markUnsupported(e)) return null;
        throw e;
      }
    },
    onError: (e: ApiError) =>
      pushToast({ kind: "error", message: e.message || "Couldn't send OTP" }),
  });
}

export interface SaveBankVars {
  id?: string;
  body: BankAccountInput;
  proof?: BankOtpProof;
}

export function useSaveBankAccount() {
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  return useMutation({
    mutationFn: ({ id, body, proof }: SaveBankVars) =>
      id ? BankAPI.update(id, body, proof) : BankAPI.create(body, proof),
    onSuccess: (_res, vars) => {
      pushToast({
        kind: "success",
        message: vars.id ? "Bank account updated" : "Bank account added",
        ttlMs: 1800,
      });
      void qc.invalidateQueries({ queryKey: MY_BANKS_KEY });
    },
    onError: (e: ApiError) => pushToast({ kind: "error", message: e.message }),
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  return useMutation({
    mutationFn: ({ id, proof }: { id: string; proof?: BankOtpProof }) =>
      BankAPI.remove(id, proof),
    onSuccess: () => {
      pushToast({ kind: "success", message: "Bank account removed", ttlMs: 1800 });
      void qc.invalidateQueries({ queryKey: MY_BANKS_KEY });
    },
    onError: (e: ApiError) => pushToast({ kind: "error", message: e.message }),
  });
}
