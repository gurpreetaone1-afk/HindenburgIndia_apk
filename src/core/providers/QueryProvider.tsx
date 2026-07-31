import { ReactNode } from "react";
import { focusManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { queryClient } from "@core/config/queryClient";

interface Props {
  children: ReactNode;
}

// On-device persister — every successful query response is written to
// AsyncStorage so the NEXT app launch can paint the UI from disk in
// <50 ms instead of waiting on a HTTP round-trip. Favourites + segment
// lists + wallet quotes all benefit. Max age 24 h keeps the cache fresh
// but lets us trim it across cold starts.
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "rq-cache.v1",
  throttleTime: 1_000,
});

// Hook React Query's focusManager into RN AppState so refetches fire the
// moment the app comes back to foreground — bringing prices up to date
// after the user backgrounds the app for a minute.
AppState.addEventListener("change", (status) => {
  focusManager.setFocused(status === "active");
});

export function QueryProvider({ children }: Props) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 h
        // Bumped v1 → v2 to DISCARD the old on-disk cache once. Builds that ran
        // during the market-closed/timezone bug persisted empty instrument /
        // segment lists ([]), and with the global `refetchOnMount: false` those
        // empties were re-served for 24h — the Market page (search + every
        // segment) stayed permanently empty even though the backend had the
        // instruments. Busting clears that stale state on first launch.
        buster: "v3",
        // NEVER persist volatile market data. Ticks come over WS; instrument
        // SEARCH results + curated SEGMENT lists + watchlist quotes depend on
        // the live catalog and admin blocks, so a cached `[]` must never be
        // re-served from disk — that was the root cause of the empty Market
        // page. These always fetch fresh from the network.
        dehydrateOptions: {
          shouldDehydrateQuery: (q) => {
            const key0 = q.queryKey[0];
            if (
              key0 === "ticker" ||
              key0 === "ticker-batch" ||
              key0 === "marketdata-snapshot" ||
              key0 === "instruments" ||
              key0 === "segment-items" ||
              key0 === "marketwatch" ||
              key0 === "watchlist-quotes" ||
              // Never persist the admin inactive-segment list — a stale copy
              // kept hiding the INDICES/STOCKS/COMMODITIES/FOREX chips after
              // those segments were activated. It's tiny + refetches fast, so
              // always pull it fresh instead of serving a persisted value.
              key0 === "segment-settings"
            ) {
              return false;
            }
            return q.state.status === "success";
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
