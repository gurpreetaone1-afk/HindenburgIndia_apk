import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@core/api/errors";
import { flags } from "@core/config/flags";
import { useUiStore } from "@shared/store/ui.store";
import { AuthAPI } from "@features/auth/api/auth.api";
import {
  EmailVerifyAPI,
  type EmailChallenge,
} from "@features/auth/api/emailVerify.api";
import { useAuthStore } from "@features/auth/store/auth.store";

const KEY = ["auth", "email-verification"] as const;

/** Single source of truth for whether the flow is live. Every hook below
 *  no-ops while this is false so nothing hits an endpoint the backend
 *  can't serve (no mail provider configured yet). */
export const isEmailVerificationEnabled = (): boolean => flags.EMAIL_VERIFICATION;

const DISABLED = new ApiError(
  "Email verification isn't enabled yet.",
  "FEATURE_DISABLED",
);

export function useEmailVerificationStatus() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: KEY,
    queryFn: () => EmailVerifyAPI.status(),
    enabled: flags.EMAIL_VERIFICATION && isAuth,
    staleTime: 60_000,
    // Until the query runs, fall back to whatever the session already
    // knows so the badge doesn't flicker on every mount.
    placeholderData: user
      ? { email: user.email, verified: !!user.email_verified }
      : undefined,
  });
}

export function useSendEmailCode() {
  const pushToast = useUiStore((s) => s.pushToast);
  return useMutation<EmailChallenge, ApiError>({
    mutationFn: () => {
      if (!flags.EMAIL_VERIFICATION) return Promise.reject(DISABLED);
      return EmailVerifyAPI.sendCode();
    },
    onSuccess: () =>
      pushToast({ kind: "info", message: "Verification code sent to your email" }),
    onError: (e) => pushToast({ kind: "error", message: e.message }),
  });
}

export function useVerifyEmailCode() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const pushToast = useUiStore((s) => s.pushToast);
  return useMutation<{ verified: boolean }, ApiError, { otp: string; challengeId?: string }>({
    mutationFn: ({ otp, challengeId }) => {
      if (!flags.EMAIL_VERIFICATION) return Promise.reject(DISABLED);
      return EmailVerifyAPI.verify({ otp, challenge_id: challengeId });
    },
    onSuccess: async () => {
      pushToast({ kind: "success", message: "Email verified" });
      void qc.invalidateQueries({ queryKey: KEY });
      // Re-pull the profile so `email_verified` is right everywhere the
      // session user is read from (profile header, account screen).
      const fresh = await AuthAPI.me().catch(() => null);
      if (fresh) setUser(fresh);
    },
    // Errors surface inline in the OTP sheet, not as a toast.
  });
}
