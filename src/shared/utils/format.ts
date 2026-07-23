import { toDecimal, type DecimalInput } from "./decimal";

const inrFmt = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// `compact: true` used to emit Intl's "1.5L" / "2K" abbreviation. Per
// user feedback that hid the exact figure on KPI tiles, so every
// caller — including ones that pass `compact: true` for legacy
// compatibility — now gets the full Indian-grouped value. Kept the
// option in the signature so old call sites keep compiling.
export function formatINR(v: DecimalInput, _opts?: { compact?: boolean }): string {
  const n = Number(toDecimal(v).toFixed(2));
  return `${inrFmt.format(n)}`;
}

export function formatNumber(v: DecimalInput, dp = 2): string {
  return toDecimal(v).toFixed(dp);
}

// Magnitude-aware decimal count for a market PRICE. A flat 2 dp turned
// forex like AUDUSD 0.6543 into "0.65"/"0.69" — useless for trading. Brokers
// pick tick decimals by price level; this mirrors that: sub-1 forex/alt-coins
// get 4-5 dp, ≥1 majors get 4, big numbers (indices, BTC) stay at 2.
export function priceDecimals(v: DecimalInput): number {
  const a = Math.abs(Number(toDecimal(v).toString()));
  if (!Number.isFinite(a) || a === 0) return 2;
  if (a >= 100) return 2; // 145.23 JPY pairs, indices, large crypto
  if (a >= 1) return 4; // 1.0850 EURUSD
  if (a >= 0.01) return 5; // 0.65430 AUDUSD / alt-coins
  return 6; // 0.000123 micro-cap
}

export function formatPrice(v: DecimalInput): string {
  return toDecimal(v).toFixed(priceDecimals(v));
}

// Forex / crypto / spot-commodity prices need the magnitude-aware decimals;
// Indian equity / F&O stay at the conventional 2 dp (a ₹45.50 stock must not
// render as 45.5000). Segment-driven so the caller just passes the segment.
export function formatPriceForSegment(v: DecimalInput, segment?: string): string {
  const s = (segment ?? "").toUpperCase();
  const smart =
    s.includes("FOREX") || s.includes("CRYPTO") || s.includes("COMMODIT");
  return smart ? formatPrice(v) : formatNumber(v, 2);
}

export function formatPercent(v: DecimalInput, dp = 2): string {
  return `${toDecimal(v).toFixed(dp)}%`;
}

export function formatSigned(v: DecimalInput, dp = 2): string {
  const d = toDecimal(v);
  const sign = d.isPositive() && !d.isZero() ? "+" : "";
  return `${sign}${d.toFixed(dp)}`;
}

export function formatLots(qty: number, lotSize: number): string {
  if (lotSize <= 1) return `${qty}`;
  const lots = qty / lotSize;
  return Number.isInteger(lots) ? `${lots} lot${lots === 1 ? "" : "s"}` : `${qty}`;
}

export function truncate(s: string, max = 20): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
