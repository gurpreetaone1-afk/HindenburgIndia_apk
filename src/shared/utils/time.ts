import { format } from "date-fns";

// IST helpers WITHOUT Intl / date-fns-tz.
//
// React Native's Hermes engine does not reliably ship full ICU / timezone data
// in release builds, so any `Intl.DateTimeFormat({ timeZone: "Asia/Kolkata" })`
// — which date-fns-tz uses under the hood — can silently fall back to UTC. That
// made every IST time render 5:30 behind (and the market-hours check read the
// clock 5:30 early → the app showed "market closed" during live hours; web was
// fine because browsers ship full ICU). We instead compute IST by manually
// shifting UTC by +5:30 and reading the UTC clock — engine-independent and
// always correct.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;

function _pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Returns a Date whose UTC-* getters read the IST wall clock. */
function _istShift(d: Date | string): Date {
  const base = typeof d === "string" ? new Date(d) : d;
  return new Date(base.getTime() + IST_OFFSET_MS);
}

export function nowUTC(): Date {
  return new Date();
}

/** IST-shifted date. Read its UTC-* getters (getUTCHours, …) for IST
 *  wall-clock values — the local getters would re-apply the device timezone. */
export function toIST(d: Date | string): Date {
  return _istShift(d);
}

/** Format an instant in IST. Supports the tokens used across the app:
 *  `yyyy MMM dd hh mm ss a`. A single left-to-right pass means an inserted
 *  month name (e.g. "May") is never re-scanned for its own letters. */
export function fmtIST(d: Date | string, pattern = "dd MMM yyyy, hh:mm a"): string {
  const ist = _istShift(d);
  const h24 = ist.getUTCHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const map: Record<string, string> = {
    yyyy: String(ist.getUTCFullYear()),
    MMM: MONTHS[ist.getUTCMonth()] ?? "",
    dd: _pad(ist.getUTCDate()),
    hh: _pad(h12),
    mm: _pad(ist.getUTCMinutes()),
    ss: _pad(ist.getUTCSeconds()),
    a: h24 < 12 ? "AM" : "PM",
  };
  return pattern.replace(/yyyy|MMM|dd|hh|mm|ss|a/g, (t) => map[t] ?? t);
}

export function fmtTime(d: Date | string): string {
  return fmtIST(d, "hh:mm:ss a");
}

export function fmtDate(d: Date | string): string {
  return fmtIST(d, "dd MMM yyyy");
}

/** True during NSE equity hours (Mon-Fri 09:15-15:30 IST). Engine-independent. */
export function isMarketHoursIST(d: Date = nowUTC()): boolean {
  const ist = _istShift(d);
  const day = ist.getUTCDay();
  if (day === 0 || day === 6) return false;
  const min = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return min >= 9 * 60 + 15 && min <= 15 * 60 + 30;
}

export { format };
