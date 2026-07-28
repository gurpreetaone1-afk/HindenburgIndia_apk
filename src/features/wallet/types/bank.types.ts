/** What the user is trying to do to their payout accounts. The backend
 *  scopes the OTP challenge to this action + account so a code issued for
 *  a delete can't be replayed against an edit. */
export type BankOtpAction = "ADD" | "UPDATE" | "DELETE";

export interface BankOtpChallenge {
  challenge_id: string;
  /** e.g. "•••••• 6733" — shown in the OTP sheet so the user knows which
   *  number to check. Falls back to the profile mobile when absent. */
  masked_mobile?: string | null;
  expires_in_sec?: number | null;
  resend_after_sec?: number | null;
}

/** OTP proof attached to the mutating request. Omitted for the very first
 *  account (part of KYC setup) and when the gate is off. */
export interface BankOtpProof {
  challenge_id: string;
  otp: string;
}

export interface BankAccountInput {
  bank_name: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  nickname?: string;
  is_default?: boolean;
}
