export interface Instrument {
  token: string;
  symbol: string;
  trading_symbol?: string;
  name: string;
  segment: string;
  exchange: string;
  instrument_type?: string;
  lot_size: number;
  tick_size: number | string;
  expiry?: string | null;
  strike?: number | null;
  option_type?: "CE" | "PE" | null;
  is_active?: boolean;
  is_tradable?: boolean;
}

export interface Tick {
  symbol: string;
  ltp: number;
  change: number;
  change_pct: number;
  volume?: number;
  bid?: number;
  ask?: number;
  // Intraday OHLC — populated when the backend tick payload carries it
  // (Zerodha full-mode quotes do; Infoway forex / crypto sometimes don't).
  // The chart info-bar reads these to show the "O / H / L / C" strip
  // above the chart so the user sees daily range at a glance.
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  ts: number;
  // Device wall-clock (Date.now) at the moment this tick was RECEIVED — used
  // to detect a stale feed (app backgrounded → WS frozen) without trusting the
  // server `ts` against a possibly-skewed device clock. Guards market fills
  // from using a stale price.
  rxAt?: number;
}

export interface DepthLevel {
  price: number;
  qty: number;
  orders?: number;
}

export interface MarketDepth {
  symbol: string;
  bids: DepthLevel[];
  asks: DepthLevel[];
  ts: number;
}
