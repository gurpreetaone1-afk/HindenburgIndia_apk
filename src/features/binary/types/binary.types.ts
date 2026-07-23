// Binary trading types — mirror the backend serializer in
// stock4x_ind/backend/app/api/v1/user/binary.py (`_serialize`) and the
// settings resolver (`binary_settings_service.resolve`). All  money
// fields arrive as STRINGS for Decimal128 precision, exactly like the
// wallet client — parse with Number() only at the display edge.

export type BinaryDirection = "HIGHER" | "LOWER";

export type BinaryStatus =
  | "OPEN"
  | "WON"
  | "LOST"
  | "TIE_REFUND"
  | "CANCELLED"
  | "REJECTED";

export interface BinaryOption {
  id: string;
  symbol: string;
  instrument_token: string;
  direction: BinaryDirection;
  stake: string;
  duration_sec: number;
  strike_price: string;
  settle_price: string | null;
  payout_pct: number;
  potential_payout: string;
  profit_loss: string | null;
  status: BinaryStatus;
  placed_at: string;
  expiry_at: string;
  settled_at: string | null;
  placed_from: string;
}

export interface BinarySettings {
  enabled: boolean;
  allowed_durations: number[];
  payout_pct_by_duration: Record<string, number>;
  min_stake_inr: number;
  max_stake_inr: number;
  daily_loss_cap_inr: number;
  tie_handling: "REFUND" | "LOSS";
  weekend_trading: boolean;
  cooldown_consecutive_losses: number;
  cooldown_window_minutes: number;
  cooldown_pause_minutes: number;
  // Appended by the /settings route on top of the resolver output.
  enabled_assets: string[];
  global_enabled: boolean;
}

export interface BinaryQuote {
  symbol: string;
  ltp: number;
  bid: number;
  ask: number;
  source: string | null;
  ts: number | null;
}

export interface BinaryCandle {
  t: number; // bucket start, ms
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface BinaryHistoryPage {
  items: BinaryOption[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface PlaceBinaryInput {
  symbol: string;
  direction: BinaryDirection;
  stake: number;
  duration_sec: number;
  placed_from?: string;
}
