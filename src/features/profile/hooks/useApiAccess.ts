import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@core/api/client";
import { unwrap } from "@core/api/errors";
import { useAuthStore } from "@features/auth/store/auth.store";

export type ApiAccessStatus = "idle" | "PENDING" | "APPROVED" | "REJECTED";

export interface ApiAccessState {
  status: ApiAccessStatus;
  api_key: string;
  rejection_reason: string | null;
}

export const API_ACCESS_KEY = ["api-access"] as const;

// Current API-access request state for the logged-in user. Backed by
// GET /user/api-access. Gated on auth so the login/splash never issues a 401.
export function useApiAccess() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery<ApiAccessState>({
    queryKey: API_ACCESS_KEY,
    queryFn: () => unwrap<ApiAccessState>(api.get("/user/api-access")),
    enabled: isAuth,
    staleTime: 30_000,
    // Safety net: flip to connected within ~20s of admin approval even if the
    // api_access WS event is missed (backgrounded app, dropped socket).
    refetchInterval: 20_000,
  });
}

// Submit (or resubmit) an API key → POST /user/api-access. The server upserts
// the user's single request back to PENDING; the admin approves/rejects it and
// the `api_access` user WS event (UserEventsProvider) flips this live.
export function useSubmitApiAccess() {
  const qc = useQueryClient();
  return useMutation<ApiAccessState, Error, string>({
    mutationFn: (apiKey: string) =>
      unwrap<ApiAccessState>(api.post("/user/api-access", { api_key: apiKey })),
    onSuccess: (data) => {
      qc.setQueryData(API_ACCESS_KEY, data);
    },
  });
}
