import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { BinaryAPI } from "@features/binary/api/binary.api";
import { ApiError } from "@core/api/errors";
import { useUiStore } from "@shared/store/ui.store";
import { useAuthStore } from "@features/auth/store/auth.store";
import type {
  BinaryCandle,
  BinaryHistoryPage,
  BinaryOption,
  BinaryQuote,
  BinarySettings,
  PlaceBinaryInput,
} from "@features/binary/types/binary.types";

const SETTINGS_KEY = (symbol?: string) =>
  ["binary", "settings", symbol ?? "__global__"] as const;
const ACTIVE_KEY = ["binary", "active"] as const;
const HISTORY_KEY = (page: number) => ["binary", "history", page] as const;
const QUOTE_KEY = (symbol: string) => ["binary", "quote", symbol] as const;
const CANDLES_KEY = (symbol: string, res: number) =>
  ["binary", "candles", symbol, res] as const;

// Effective settings (duration chips, stake bounds, payout map, asset
// whitelist). Pass a symbol once one is picked to get per-asset payouts.
export function useBinarySettings(symbol?: string) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery<BinarySettings>({
    queryKey: SETTINGS_KEY(symbol),
    queryFn: () => BinaryAPI.settings(symbol),
    enabled: isAuth,
    staleTime: 30_000,
  });
}

// Open binaries — polled every 5s so countdowns and settlements surface
// even without the WS `binary_settled` push.
export function useBinaryActive() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery<BinaryOption[]>({
    queryKey: ACTIVE_KEY,
    queryFn: () => BinaryAPI.active(),
    enabled: isAuth,
    refetchInterval: 5_000,
    staleTime: 2_000,
  });
}

export function useBinaryHistory(page = 1) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery<BinaryHistoryPage>({
    queryKey: HISTORY_KEY(page),
    queryFn: () => BinaryAPI.history({ page, page_size: 50 }),
    enabled: isAuth,
    staleTime: 10_000,
  });
}

// Live price for the trade-panel header + strike preview. Polls at 1Hz —
// the backend quote is Redis-cached so this is cheap, and it avoids
// wiring the raw Infoway WS symbol mapping into the app.
export function useBinaryQuote(symbol: string | undefined) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery<BinaryQuote>({
    queryKey: QUOTE_KEY(symbol ?? ""),
    queryFn: () => BinaryAPI.quote(symbol as string),
    enabled: isAuth && !!symbol,
    refetchInterval: 1_000,
    staleTime: 800,
  });
}

export function useBinaryCandles(
  symbol: string | undefined,
  resolution: number,
) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery<BinaryCandle[]>({
    queryKey: CANDLES_KEY(symbol ?? "", resolution),
    queryFn: () => BinaryAPI.candles(symbol as string, resolution, 120),
    enabled: isAuth && !!symbol,
    refetchInterval: 5_000,
    staleTime: 3_000,
  });
}

// Place a binary. Green haptic + toast on the tap frame; on success we
// refresh the active list, history and wallet; on error a red toast
// overrides. No optimistic row — the active poll (5s) plus this
// invalidation surfaces the new position fast enough.
export function usePlaceBinary() {
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  return useMutation<BinaryOption, ApiError, PlaceBinaryInput>({
    mutationFn: (body) =>
      BinaryAPI.place({ ...body, placed_from: body.placed_from ?? "APK" }),
    onSuccess: (binary) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      pushToast({
        kind: "success",
        message: `${binary.direction === "HIGHER" ? "Higher" : "Lower"} placed · ${binary.stake}`,
        ttlMs: 1800,
      });
      void qc.invalidateQueries({ queryKey: ACTIVE_KEY });
      void qc.invalidateQueries({ queryKey: ["binary", "history"] });
      void qc.invalidateQueries({ queryKey: ["wallet", "summary"] });
    },
    onError: (e) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      pushToast({ kind: "error", message: e.message || "Could not place trade" });
    },
  });
}
