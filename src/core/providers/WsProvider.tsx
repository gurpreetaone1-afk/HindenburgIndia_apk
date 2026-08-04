import { ReactNode, useEffect } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@features/auth/store/auth.store";
import { useWatchlistStore } from "@features/trade/store/watchlist.store";
import { marketdata } from "@features/trade/services/marketdata.service";
import { useTickerStore } from "@features/trade/store/ticker.store";

// One-shot cold-start price cache. The ticker store is in-memory (no per-tick
// persist — that caused runtime lag), but we still want close→reopen to paint
// the last-known prices instantly instead of "—". So we snapshot the ticks to
// AsyncStorage ONCE when the app backgrounds and restore them ONCE on boot —
// zero per-tick cost, instant cold-start feel, then the live WS refreshes.
const TICKS_SNAPSHOT_KEY = "nb.ticks-snapshot";

interface Props {
  children: ReactNode;
}

export function WsProvider({ children }: Props) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const hydrate = useWatchlistStore((s) => s.hydrate);
  const symbols = useWatchlistStore((s) => s.symbols);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuth) {
      marketdata.disconnect();
      return;
    }
    if (symbols.length > 0) marketdata.subscribe(symbols);
  }, [isAuth, symbols]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && isAuth) {
        // Force a fast reconnect first (the WS may have frozen while
        // backgrounded), then re-assert the subscriptions so ticks refresh
        // immediately instead of after the 45 s stale timeout.
        marketdata.resume();
        if (symbols.length > 0) marketdata.subscribe(symbols);
      } else {
        // Leaving foreground — snapshot current prices once for instant paint
        // on the next open.
        void AsyncStorage.setItem(
          TICKS_SNAPSHOT_KEY,
          JSON.stringify(useTickerStore.getState().ticks),
        ).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [isAuth, symbols]);

  // Boot: paint last-known prices instantly, before the WS snapshot lands.
  useEffect(() => {
    void AsyncStorage.getItem(TICKS_SNAPSHOT_KEY).then((raw) => {
      if (!raw) return;
      try {
        const ticks = JSON.parse(raw);
        if (ticks && typeof ticks === "object") {
          // Only seed slots we don't already have a live tick for.
          const cur = useTickerStore.getState().ticks;
          useTickerStore.setState({ ticks: { ...ticks, ...cur } });
        }
      } catch {
        /* ignore corrupt snapshot */
      }
    });
  }, []);

  return <>{children}</>;
}
