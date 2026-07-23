import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MarketAPI, type SearchParams } from "@features/trade/api/market.api";

export function useInstrumentSearch(params: SearchParams, enabled = true) {
  const q = (params.q ?? "").trim();
  const hasFilter = q.length > 0 || !!params.segment || !!params.exchange;
  return useQuery({
    queryKey: ["instruments", "search", params],
    queryFn: () => MarketAPI.search(params),
    enabled: enabled && hasFilter,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    // CRITICAL: override the global `refetchOnMount: false`. The app ships a
    // 24-hour AsyncStorage persister (QueryProvider), so a segment list that
    // was EMPTY when first opened (e.g. Forex/Crypto before the backend had
    // Infoway rows) gets its empty `[]` persisted to disk and re-served on
    // every launch — the segment tab then stays permanently empty even after
    // the backend starts returning instruments. "always" forces a fresh
    // fetch on every mount so new instruments appear within one open, instead
    // of waiting on the 24h cache to expire. Same fix as useEffectiveSettings.
    refetchOnMount: "always",
  });
}
