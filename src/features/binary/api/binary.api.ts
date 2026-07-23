import { api } from "@core/api/client";
import { unwrap } from "@core/api/errors";
import type {
  BinaryCandle,
  BinaryHistoryPage,
  BinaryOption,
  BinaryQuote,
  BinarySettings,
  PlaceBinaryInput,
} from "@features/binary/types/binary.types";

// Thin wrapper over the backend `/user/binary/*` endpoints. The axios
// `api` instance already injects the Bearer token + /api/v1 base, so the
// paths here are relative to /api/v1, matching MarketAPI.
export const BinaryAPI = {
  // symbol omitted → user/global merge (no per-asset override applied),
  // used to render duration chips + stake bounds before an asset is picked.
  settings: (symbol?: string) =>
    unwrap<BinarySettings>(
      api.get("/user/binary/settings", {
        params: symbol ? { symbol } : undefined,
      }),
    ),

  place: (body: PlaceBinaryInput) =>
    unwrap<BinaryOption>(api.post("/user/binary/place", body)),

  active: () => unwrap<BinaryOption[]>(api.get("/user/binary/active")),

  history: (params?: { page?: number; page_size?: number }) =>
    unwrap<BinaryHistoryPage>(api.get("/user/binary/history", { params })),

  candles: (symbol: string, resolution: number, count = 200) =>
    unwrap<BinaryCandle[]>(
      api.get("/user/binary/candles", { params: { symbol, resolution, count } }),
    ),

  quote: (symbol: string) =>
    unwrap<BinaryQuote>(
      api.get(`/user/binary/quote/${encodeURIComponent(symbol)}`),
    ),
};
