import { useCallback, useRef, useState } from "react";
import { ApiError } from "@core/api/errors";
import {
  bankChangeNeedsOtp,
  useRequestBankOtp,
} from "@features/wallet/hooks/useBankAccounts";
import type {
  BankOtpAction,
  BankOtpChallenge,
  BankOtpProof,
} from "@features/wallet/types/bank.types";

interface RunArgs {
  action: BankOtpAction;
  /** How many accounts the user already has — decides whether the first
   *  (KYC-setup) save is allowed through without a code. */
  existingCount: number;
  bankAccountId?: string;
  /** The actual mutation. Receives the OTP proof when one was collected. */
  perform: (proof?: BankOtpProof) => Promise<unknown>;
}

/**
 * Wraps a bank mutation in the SMS-OTP challenge. `start()` either runs the
 * mutation straight away (first account / gate off / backend without the
 * challenge route) or fires the code and opens the sheet; `submit()` then
 * replays the mutation with the proof attached.
 */
export function useBankOtpGate(fallbackMobile?: string) {
  const request = useRequestBankOtp();
  const [challenge, setChallenge] = useState<BankOtpChallenge | null>(null);
  const [visible, setVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const args = useRef<RunArgs | null>(null);

  const start = useCallback(
    async (next: RunArgs) => {
      args.current = next;
      setError(null);
      // Failures on this path (the mutation itself, or the challenge
      // request) already raise a red toast from their own `onError`, so
      // they're swallowed here rather than escaping as an unhandled
      // rejection into the caller's `void gate.start(...)`.
      try {
        if (!bankChangeNeedsOtp(next.action, next.existingCount)) {
          await next.perform();
          return;
        }
        const ch = await request.mutateAsync({
          action: next.action,
          bankAccountId: next.bankAccountId,
        });
        // `null` = backend has no OTP route yet; go through unverified
        // rather than trapping the user behind a gate the server can't open.
        if (!ch) {
          await next.perform();
          return;
        }
        setChallenge(ch);
        setVisible(true);
      } catch {
        args.current = null;
      }
    },
    [request],
  );

  const submit = useCallback(
    async (otp: string) => {
      const current = args.current;
      if (!current || !challenge) return;
      setVerifying(true);
      setError(null);
      try {
        await current.perform({ challenge_id: challenge.challenge_id, otp });
        setVisible(false);
        setChallenge(null);
        args.current = null;
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Verification failed");
      } finally {
        setVerifying(false);
      }
    },
    [challenge],
  );

  const resend = useCallback(async () => {
    const current = args.current;
    if (!current) return;
    setError(null);
    try {
      const ch = await request.mutateAsync({
        action: current.action,
        bankAccountId: current.bankAccountId,
      });
      if (ch) setChallenge(ch);
    } catch {
      // toasted by useRequestBankOtp
    }
  }, [request]);

  const close = useCallback(() => {
    setVisible(false);
    setChallenge(null);
    args.current = null;
  }, []);

  const target = challenge?.masked_mobile || fallbackMobile;

  return {
    visible,
    verifying,
    sending: request.isPending,
    error,
    subtitle: target
      ? `We sent a 6-digit code to ${target}. It expires in ${Math.round((challenge?.expires_in_sec ?? 300) / 60)} min.`
      : "Enter the 6-digit code sent to your registered mobile number.",
    resendAfterSec: challenge?.resend_after_sec ?? 30,
    start,
    submit,
    resend,
    close,
  };
}
