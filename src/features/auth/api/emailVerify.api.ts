import { api } from "@core/api/client";
import { unwrap } from "@core/api/errors";

export interface EmailVerificationStatus {
  email: string;
  verified: boolean;
  /** ISO timestamp of the last code we sent, when the backend tracks it. */
  last_sent_at?: string | null;
}

export interface EmailChallenge {
  challenge_id?: string;
  expires_in_sec?: number | null;
  resend_after_sec?: number | null;
}

// Backend contract (NOT deployed yet — no SMTP in the server env, which is
// why `flags.EMAIL_VERIFICATION` ships false):
//   GET  /user/auth/email/status     → EmailVerificationStatus
//   POST /user/auth/email/send-code  → EmailChallenge
//   POST /user/auth/email/verify     → { verified: true }
export const EmailVerifyAPI = {
  status: () => unwrap<EmailVerificationStatus>(api.get("/user/auth/email/status")),

  sendCode: () => unwrap<EmailChallenge>(api.post("/user/auth/email/send-code", {})),

  verify: (body: { otp: string; challenge_id?: string }) =>
    unwrap<{ verified: boolean }>(api.post("/user/auth/email/verify", body)),
};
