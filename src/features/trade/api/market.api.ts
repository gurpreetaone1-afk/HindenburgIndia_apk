import { api } from "@core/api/client";
import { unwrap } from "@core/api/errors";
import type { Instrument } from "@features/trade/types/instrument.types";
import type {
  OptionChainConfig,
  OptionChainResponse,
} from "@features/trade/types/option-chain.types";

export interface SearchParams {
  q?: string;
  segment?: string;
  exchange?: string;
  instrument_type?: string;
  limit?: number;
}

export interface Quote {
  token: string;
  ltp: number;
  change: number;
  change_pct: number;
  open: number;
  high: number;
  low: number;
  prev_close: number;
  volume: number;
  bid: number;
  ask: number;
  source?: string | null;
}

export const MarketAPI = {
  search: (params: SearchParams = {}) =>
    unwrap<Instrument[]>(api.get("/user/instruments/search", { params })),
  instrument: (token: string) =>
    unwrap<Instrument>(api.get(`/user/instruments/${encodeURIComponent(token)}`)),
  quote: (token: string) =>
    unwrap<Quote>(api.get(`/user/instruments/${encodeURIComponent(token)}/quote`)),
  // NOTE: live LTP comes from the WS feed (marketdata.service) and single
  // quotes from /instruments/{token}/quote. The old `ltp`/`depth` helpers
  // pointed at /user/market/* routes that don't exist on the backend (404)
  // and had no callers — removed to avoid future dead calls.
};

export const OptionChainAPI = {
  config: () => unwrap<OptionChainConfig>(api.get("/user/option-chain/config")),
  fetch: (underlying: string, expiry?: string) =>
    unwrap<OptionChainResponse>(
      api.get("/user/option-chain", {
        params: { underlying, ...(expiry ? { expiry } : {}) },
      }),
    ),
};
