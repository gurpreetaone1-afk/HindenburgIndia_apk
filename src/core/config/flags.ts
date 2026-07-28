import Constants from "expo-constants";

// Feature flags read the same way as `env` — `process.env` first (Expo
// inlines EXPO_PUBLIC_* at build time), then `expoConfig.extra`, then the
// hardcoded fallback. Flipping one only needs an eas.json `env` entry, no
// code change.
function readFlag(key: string, fallback: boolean): boolean {
  const fromProc = process.env[key];
  const fromExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const raw = fromProc ?? fromExtra[key];
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  return /^(1|true|yes|on)$/i.test(raw.trim());
}

/** Hard cap on saved payout accounts. The user must delete one before a
 *  sixth can be added. The backend is the real authority — this only
 *  keeps the UI honest and avoids a pointless round-trip. */
export const MAX_BANK_ACCOUNTS = 5;

export const flags = {
  /**
   * Email verification (send code → verify → "Verified" badge).
   * OFF by default: no SMTP/mail provider is wired into the backend env
   * yet, so the endpoints would fail. The whole flow is implemented and
   * ships dormant — set EXPO_PUBLIC_FEATURE_EMAIL_VERIFICATION=1 in the
   * build profile once mail is configured and it lights up.
   */
  EMAIL_VERIFICATION: readFlag("EXPO_PUBLIC_FEATURE_EMAIL_VERIFICATION", false),

  /**
   * OTP gate on bank-account changes. ON — the user's registered mobile
   * receives the code. If the backend hasn't shipped the challenge
   * endpoint yet the client degrades gracefully (see useBankAccounts).
   */
  BANK_CHANGE_OTP: readFlag("EXPO_PUBLIC_FEATURE_BANK_OTP", true),
} as const;
