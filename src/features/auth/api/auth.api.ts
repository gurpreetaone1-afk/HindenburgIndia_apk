import { api } from "@core/api/client";
import { unwrap } from "@core/api/errors";
import type { TokenPair } from "@core/types/api";
import type { User } from "@features/auth/types/user.types";

export interface LoginInput {
  identifier: string;
  password: string;
  two_fa_code?: string;
}

export interface RegisterInput {
  email: string;
  mobile: string;
  password: string;
  full_name: string;
  // Email OTP (from AuthAPI.requestOtp with purpose "register"). Verified
  // server-side at account creation — verify-first signup.
  otp: string;
  pan?: string;
}

export interface LoginResponse extends TokenPair {
  user: User;
}

export interface UpdateProfileInput {
  full_name?: string;
  photo_url?: string;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}

export const AuthAPI = {
  login: (body: LoginInput) =>
    unwrap<LoginResponse>(api.post("/user/auth/login", body)),
  // Send an email OTP. purpose "register" verifies a NEW email before signup
  // (backend rejects already-registered emails here).
  requestOtp: (identifier: string, purpose: "register" | "reset_password" = "register") =>
    unwrap(api.post("/user/auth/otp/request", { identifier, purpose })),
  register: (body: RegisterInput) =>
    unwrap<User>(api.post("/user/auth/register", body)),
  logout: (refresh_token?: string) =>
    unwrap(api.post("/user/auth/logout", { refresh_token })),
  refresh: (refresh_token: string) =>
    unwrap<TokenPair>(api.post("/user/auth/refresh", { refresh_token })),
  forgotPassword: (identifier: string) =>
    unwrap(api.post("/user/auth/forgot-password", { identifier })),
  resetPassword: (body: { identifier: string; otp: string; new_password: string }) =>
    unwrap(api.post("/user/auth/reset-password", body)),
  me: () => unwrap<User>(api.get("/user/users/me")),
  updateProfile: (body: UpdateProfileInput) =>
    unwrap<User>(api.put("/user/users/me", body)),
  changePassword: (body: ChangePasswordInput) =>
    unwrap<{ ok: boolean; message?: string }>(
      api.post("/user/auth/change-password", body),
    ),
};
