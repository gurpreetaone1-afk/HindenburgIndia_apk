import { useMemo } from "react";
import { useWalletSummary } from "@features/wallet/hooks/useWallet";
import { useOpenPositions } from "@features/portfolio/hooks/usePositions";
import { useTickerStore } from "@features/trade/store/ticker.store";
import type { Position } from "@features/portfolio/types/position.types";

/**
 * Per-position live P&L derivation. Same max-abs heuristic the
 * <LivePositionRow> wrapper uses on each row card so the per-row
 * pnl and the aggregate (M2M / TOTAL P&L) stay in lock-step:
 *
 *   • Live tick available + sane avg/qty → recompute
 *       (ltp − avg) × |qty|  (sign flipped for SELL)
 *     and pick whichever of (derived, server) has larger magnitude.
 *     This lets the value tick on every WS push for INR-quoted
 *     instruments while still trusting the server's FX-applied
 *     number for USD-quoted ones once it lands.
 *   • Anything missing (no tick, qty 0, bad avg) → return server.
 *
 * Returns 0 when neither side has a usable number.
 */
export function computeLivePnl(args: {
  serverPnl: number;
  liveLtp: number | null | undefined;
  avg: number;
  // Signed quantity — positive = long, negative = short.
  qty: number;
  // True for USD-quoted instruments (BTCUSD, EURUSD, XAUUSD, … from the
  // Infoway feed): they price in USD while the wallet is INR, so ONLY the
  // server can convert (it snapshots the live USD/INR rate). INR-native
  // instruments (NSE / MCX — NIFTY, CRUDEOIL, SILVERM …) need no
  // conversion and must use the live-derived value directly.
  isUsd?: boolean;
}): number {
  const { serverPnl, liveLtp, avg, qty, isUsd } = args;
  if (
    liveLtp == null ||
    !Number.isFinite(liveLtp) ||
    !Number.isFinite(avg) ||
    avg <= 0 ||
    !Number.isFinite(qty) ||
    qty === 0
  ) {
    return Number.isFinite(serverPnl) ? serverPnl : 0;
  }
  const isBuy = qty > 0;
  const derived = (isBuy ? liveLtp - avg : avg - liveLtp) * Math.abs(qty);
  if (isUsd) {
    // USD-quoted: `derived` is in USD (native currency). The server returns
    // an FX-applied INR figure whose magnitude exceeds the native number
    // once it lands, so prefer it; fall back to `derived` only until the
    // first server refresh arrives (keeps a fresh trade from showing 0).
    return Math.abs(serverPnl) >= Math.abs(derived) ? serverPnl : derived;
  }
  // INR-native: `derived` (computed against the live CLOSE-side price the
  // caller passes — bid for a long, ask for a short) IS the truth — it's
  // what the user would realise if they closed right now and it ticks every
  // frame. The server's `unrealized_pnl` is marked against the last-traded
  // LTP, which can lag the live bid/ask and overstate the move (PANKAJ /
  // SILVERM: server showed -11,621 against a lagging LTP vs the correct
  // -4,535 at the live bid). The old "larger magnitude wins" rule wrongly
  // surfaced that stale server loss for INR positions — removed.
  return derived;
}

/**
 * Pick the close-side price (bid for a long, ask for a short) but REJECT a
 * depth level that's obviously out of scale with the last trade.
 *
 * Illiquid / expired option depth books routinely carry a STALE or junk
 * best level whose price sits far from the live LTP. Using it made the
 * position card's P&L jump between e.g. +18 and +1800 tick-to-tick — the
 * "pnl ek sec me 18 fir 1800 ho jata hai, ltp switch ho raha hai" bug.
 * The card also showed that rarely-refreshed depth price under the LTP
 * label, so the price looked frozen even while the last-trade LTP was
 * ticking fast.
 *
 * Guard: only trust bid/ask when it's within 25% of LTP. A real bid/ask
 * spread is never a quarter of the price, so 25% comfortably rejects a
 * junk/stale level (the ×100 flicker is ~9900% off) while never touching
 * a legitimate quote. On rejection we fall back to LTP, which both
 * stabilises the P&L and lets the displayed price track the fast-moving
 * last trade.
 */
export function safeCloseSide(
  ltp: number | null | undefined,
  bid: number | null | undefined,
  ask: number | null | undefined,
  side: "BUY" | "SELL",
): number | null {
  const l = Number(ltp);
  const raw = Number(side === "BUY" ? bid : ask);
  const rawOk = Number.isFinite(raw) && raw > 0;
  if (!Number.isFinite(l) || l <= 0) {
    // No usable LTP — the depth side is all we have.
    return rawOk ? raw : null;
  }
  if (!rawOk) return l;
  // Reject a depth price more than 25% away from LTP — stale / junk level.
  return Math.abs(raw - l) / l > 0.25 ? l : raw;
}

export interface LiveWalletKpi {
  ledger: number;
  available: number;
  used: number;
  m2m: number;
  cfRequired: number;
}

/**
 * Live-derived wallet KPIs.
 *
 * Why this hook exists: `/user/wallet/summary` polls every 10 s and
 * `/positions/pnl-summary` every 5 s — too slow for the trader's
 * perception. We need MARGIN USED / M2M to react the same frame as the
 * buy/sell or close tap, and to match the per-position card on screen.
 *
 *   available + used → wallet/summary cache, patched optimistically by
 *                      usePlaceOrder.onMutate + close mutations so the
 *                      strip moves on the same frame as the tap.
 *
 *   m2m → Σ (position.unrealized_pnl + position.realized_pnl) across
 *         every OPEN position. This is the EXACT same calc PortfolioScreen
 *         uses to build the per-row `pnl` field that the position card
 *         and TOTAL P&L card show. Same data source = guaranteed
 *         agreement — no more "card says +31.48, M2M says -0.01" mismatch.
 *
 *         We tried recomputing M2M client-side from live WS ticks
 *         (`(ltp − avg) × qty`) so it would animate tick-by-tick. The
 *         catch: backend may apply FX (USD-quoted instruments), use a
 *         different qty unit (contracts vs lots × lot_size), or run a
 *         legacy ×83 conversion — and our client-side math has no way to
 *         know which path the server took. The 3 s positions poll
 *         delivers a refreshed `unrealized_pnl` from the server (already
 *         FX-aware), so we just sum that. M2M effectively updates every
 *         3 s instead of every tick — acceptable trade-off for never
 *         showing a wrong number.
 *
 *   ledger → available + used. Cash on deposit; ignores live P&L.
 */
export function useLiveWalletKpi(): LiveWalletKpi {
  const wallet = useWalletSummary();
  const openPositions = useOpenPositions();
  // Subscribe to the WS ticker store so M2M repaints on every tick
  // (not just on the 3 s positions poll). The whole `ticks` object
  // is replaced on every setTick (see ticker.store.setTick) so a
  // single tick triggers one re-render here — O(positions) work,
  // negligible for 5–50 rows.
  const ticks = useTickerStore((s) => s.ticks);

  const rawAvailable = Number(wallet.data?.available_balance ?? 0);
  const used = Number(wallet.data?.used_margin ?? 0);
  const ledger = rawAvailable + used;

  const m2m = useMemo(() => {
    const rows: Position[] = openPositions.data ?? [];
    if (rows.length === 0) return 0;
    let total = 0;
    for (const p of rows) {
      // M2M shows ONLY unrealized P&L for OPEN positions. The realized
      // component has already been credited to `available_balance` (see
      // wallet_service.adjust on the close leg), so including it here
      // double-counts the same profit — once in LEDGER BALANCE and once
      // in M2M. That's the "M2M shows 4 lots' worth even after closing
      // 1 lot" bug — realized from the closed lot kept showing up here.
      //
      // Live tick-driven recompute (same helper the row card uses) so
      // M2M moves on every WS push instead of waiting on the 3 s poll.
      const tok = p.instrument_token ? String(p.instrument_token) : "";
      const tk: any = tok ? ticks[tok] : undefined;
      const qn = Number(p.quantity);
      // Mark against the CLOSE-side price (bid for a long, ask for a short)
      // — what the user would actually realise — not the last trade. A
      // junk/stale depth level is rejected in favour of LTP (see
      // safeCloseSide) so M2M can't flicker ×100.
      const closeSide = safeCloseSide(tk?.ltp, tk?.bid, tk?.ask, qn >= 0 ? "BUY" : "SELL");
      total += computeLivePnl({
        serverPnl: Number(p.unrealized_pnl) || 0,
        liveLtp: closeSide,
        avg: Number(p.avg_price),
        qty: qn,
        isUsd: p.currency_quote === "USD",
      });
    }
    return total;
  }, [openPositions.data, ticks]);

  // MARGIN AVAILABLE = Equity − Margin = Bal + M2M − Used
  //                  = (available + used + m2m) − used
  //                  = rawAvailable + m2m
  // User spec: "PNL jo hai mere available se mines hote rahega" — floating
  // loss should erode what's deployable on the next trade. With the raw
  // `available_balance` field the strip never reacted to PnL (only to
  // realized trade events), so traders could keep punching in new orders
  // while their existing positions silently bled out. Folding live M2M
  // into Available matches the WalletStrip on the web user terminal and
  // the standard CFD broker convention.
  const available = rawAvailable + m2m;

  // CF (Carry Forward) Required = the EXTRA cash a user needs to convert
  // every open MIS position to NRML so it can be held overnight. Backend
  // now stamps the REAL overnight requirement on each position row as
  // `holding_margin` (computed via the segment-settings cascade —
  // broker / admin / super-admin / global pools), so we just sum
  // (holding_margin − margin_used) across MIS rows. Old code multiplied
  // `margin_used × 0.4` (the 1.4× heuristic minus 1.0) which is wrong on
  // every segment whose admin matrix has non-default overnight leverage
  // — operator-flagged 22-May: TCS card showed 1,127 here while the
  // trade dialog correctly showed 5,752.
  const cfRequired = useMemo(() => {
    const rows: Position[] = openPositions.data ?? [];
    if (rows.length === 0) return 0;
    let total = 0;
    for (const p of rows) {
      const isMIS = (p.product_type || "").toUpperCase() === "MIS";
      if (!isMIS) continue;
      const used = Number(p.margin_used) || 0;
      const holding = Number(p.holding_margin);
      // A real overnight (holding) margin for an MIS leg is ALWAYS greater
      // than the intraday margin — carry-forward costs more, never less. So
      // trust the stamped `holding_margin` ONLY when it actually exceeds
      // `used`. A value that equals (or is below) used is the backend's
      // degraded fallback (overnight resolver empty/errored → it stamps
      // holding == margin_used), which made "CF Required" read 0.00 for every
      // MIS position. Treat that as "no usable overnight number" and fall
      // back to the 0.4× heuristic so the tile shows a sane non-zero estimate
      // — this also makes CF correct on-device even before the backend that
      // stamps a proper holding_margin is redeployed.
      if (Number.isFinite(holding) && holding > used) {
        total += holding - used;
      } else {
        total += used * 0.4;
      }
    }
    return total;
  }, [openPositions.data]);

  return { ledger, available, used, m2m, cfRequired };
}
