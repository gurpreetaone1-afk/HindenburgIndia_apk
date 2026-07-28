import { api } from "@core/api/client";
import { unwrap, unwrapVoid } from "@core/api/errors";
import type { UserBank } from "@features/wallet/types/wallet.types";
import type {
  BankAccountInput,
  BankOtpAction,
  BankOtpChallenge,
  BankOtpProof,
} from "@features/wallet/types/bank.types";

const BASE = "/user/wallet/bank-accounts";

// Backend contract this module expects:
//   GET    /user/wallet/bank-accounts              → UserBank[]        (exists)
//   POST   /user/wallet/bank-accounts              → { id }            (exists)
//   POST   /user/wallet/bank-accounts/otp          → BankOtpChallenge  (new)
//   PUT    /user/wallet/bank-accounts/{id}         → UserBank          (new)
//   DELETE /user/wallet/bank-accounts/{id}         → 200, empty body   (new)
// The three "new" routes are the OTP-gated edit path. Until they ship the
// client degrades — see `markOtpUnsupported` in useBankAccounts.
export const BankAPI = {
  list: () => unwrap<UserBank[]>(api.get(BASE)),

  /** Ask the backend to SMS a code to the registered mobile. The returned
   *  `challenge_id` must be echoed back with the mutating call. */
  requestOtp: (action: BankOtpAction, bank_account_id?: string) =>
    unwrap<BankOtpChallenge>(
      api.post(`${BASE}/otp`, { action, bank_account_id }),
    ),

  create: (body: BankAccountInput, proof?: BankOtpProof) =>
    unwrap<{ id: string }>(api.post(BASE, { ...body, ...proof })),

  update: (id: string, body: BankAccountInput, proof?: BankOtpProof) =>
    unwrap<UserBank>(api.put(`${BASE}/${id}`, { ...body, ...proof })),

  // DELETE bodies are dropped by some proxies — the proof rides as query
  // params instead.
  remove: (id: string, proof?: BankOtpProof) =>
    unwrapVoid(api.delete(`${BASE}/${id}`, { params: proof })),
};
