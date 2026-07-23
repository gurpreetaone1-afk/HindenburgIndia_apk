import type { BinarySettings, BinaryStatus } from "@features/binary/types/binary.types";

// "30s" / "1m" / "5m" / "1h" — compact duration label for the chips.
export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) {
    const m = sec / 60;
    return Number.isInteger(m) ? `${m}m` : `${(sec / 60).toFixed(1)}m`;
  }
  const h = sec / 3600;
  return Number.isInteger(h) ? `${h}h` : `${(sec / 3600).toFixed(1)}h`;
}

// Milliseconds remaining → "M:SS" (or "SS s" under a minute) for the
// active-position countdown.
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Pick the payout fraction for a duration from resolved settings. Exact
// match preferred, else nearest configured duration — mirrors the
// backend's `payout_for_duration` so the preview matches the fill.
export function payoutForDuration(
  cfg: Pick<BinarySettings, "payout_pct_by_duration"> | undefined,
  durationSec: number,
): number {
  const pmap = cfg?.payout_pct_by_duration ?? {};
  const keys = Object.keys(pmap);
  if (keys.length === 0) return 0;
  const exact = pmap[String(durationSec)];
  if (exact != null) return exact;
  let best = keys[0] as string;
  for (const k of keys) {
    if (Math.abs(Number(k) - durationSec) < Math.abs(Number(best) - durationSec)) {
      best = k;
    }
  }
  return pmap[best] ?? 0;
}

// Profit if a stake wins at the given payout fraction.
export function profitFor(stake: number, payoutPct: number): number {
  if (!Number.isFinite(stake) || stake <= 0) return 0;
  return stake * payoutPct;
}

// Short asset label, e.g. "EURUSD" → "EUR/USD". Falls back to the raw
// symbol when it doesn't look like a 6-char FX pair.
export function prettySymbol(symbol: string): string {
  const s = (symbol || "").toUpperCase();
  if (/^[A-Z]{6}$/.test(s)) return `${s.slice(0, 3)}/${s.slice(3)}`;
  return s;
}

export function isSettled(status: BinaryStatus): boolean {
  return status !== "OPEN";
}

// Theme tone for a settled-status badge / P&L figure.
export function statusTone(status: BinaryStatus): "buy" | "sell" | "muted" {
  if (status === "WON") return "buy";
  if (status === "LOST") return "sell";
  return "muted"; // TIE_REFUND / CANCELLED / REJECTED
}

export function statusLabel(status: BinaryStatus): string {
  switch (status) {
    case "WON":
      return "Won";
    case "LOST":
      return "Lost";
    case "TIE_REFUND":
      return "Refund";
    case "CANCELLED":
      return "Cancelled";
    case "REJECTED":
      return "Rejected";
    case "OPEN":
      return "Open";
  }
}
