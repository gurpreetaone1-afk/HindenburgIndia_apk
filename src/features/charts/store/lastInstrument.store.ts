import { create } from "zustand";

// Remembers the LAST instrument the user engaged with (opened an order panel
// on, or charted). The Trade tab (ChartScreen) is reachable two ways:
//   1. router.push with explicit { token } params — e.g. the TradeSheet
//      "Charts" button, watchlist rows, indices strip. These carry the
//      instrument.
//   2. The bottom-nav "Trade" tab button — router.push("/(tabs)/trade") with
//      NO params. Previously this fell straight back to the hardcoded NIFTY
//      default, so tapping "Trade" after viewing SBIN reset the chart to
//      NIFTY.
// This store bridges the gap: whenever an order panel opens (or the chart
// resolves an explicit instrument), we record it here so the param-less tab
// tap restores that instrument instead of snapping to NIFTY. In-memory only —
// on a fresh app launch the Trade tab still defaults to NIFTY.

export interface LastInstrument {
  token: string;
  symbol?: string;
  name?: string;
}

interface LastInstrumentState {
  token: string | null;
  symbol: string | null;
  name: string | null;
  set: (i: LastInstrument) => void;
}

export const useLastInstrumentStore = create<LastInstrumentState>((set) => ({
  token: null,
  symbol: null,
  name: null,
  set: (i) =>
    set({ token: i.token, symbol: i.symbol ?? null, name: i.name ?? null }),
}));
