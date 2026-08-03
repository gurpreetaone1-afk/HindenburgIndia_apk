import { Linking } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@core/api/client";
import { unwrap } from "@core/api/errors";
import { useAuthStore } from "@features/auth/store/auth.store";

export interface SupportContacts {
  whatsapp: string;
  email: string;
}

// Admin-managed WhatsApp + email exposed via `/user/support`. Cached
// generously since these change at most once a quarter. Gated on auth
// so the unauthenticated splash doesn't issue a 401.
//
// No hardcoded fallback — admin is the single source of truth. If the
// backend hasn't been restarted with the new route, the query errors
// and `data` stays undefined, which makes the Support section in the
// UI hide. The fix is "restart the backend so the seed inserts the
// default support_email row", NOT "stuff a stale email in the JS
// bundle". Hardcoding here would also override an admin-cleared
// value, which is the wrong direction of dependency.
export function useSupportContacts() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery<SupportContacts>({
    queryKey: ["support", "contacts"],
    queryFn: () => unwrap<SupportContacts>(api.get("/user/support")),
    enabled: isAuth,
    // Admin can change the support number any time — keep it fresh so users
    // see the update fast (on app foreground via focusManager, and within a
    // minute while open) instead of the old 10-min hard cache.
    staleTime: 30_000,
    gcTime: 30 * 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}

/** Builds a wa.me URL from an admin-stored number — strips spaces /
 *  dashes / leading "+" since wa.me expects digits only. Returns null
 *  for blank or otherwise unusable input so callers can hide the link. */
export function buildWhatsappUrl(raw: string | undefined | null, prefill?: string): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^0-9]/g, "");
  if (digits.length < 8) return null; // shorter than the shortest country dial
  const text = prefill ? `?text=${encodeURIComponent(prefill)}` : "";
  return `https://wa.me/${digits}${text}`;
}

/**
 * Open a WhatsApp chat to an admin-stored number, preferring the native app
 * and falling back to the wa.me web link. Returns true if some URL launched,
 * false if the number was unusable or nothing could open it (caller then
 * routes to the in-app chat).
 *
 * Why a chain and not a single `Linking.openURL(wa.me)`: on Android the
 * plain `https://wa.me/…` link frequently bounced to the browser (or did
 * nothing when the app-link handler wasn't verified), which read as "WhatsApp
 * icon kuch nahi karta". We try the `whatsapp://send` deep link FIRST — it
 * opens the installed app directly — then fall back to wa.me. We deliberately
 * DON'T gate on `Linking.canOpenURL`: on Android 11+ it returns false without
 * a `<queries>` manifest entry even when WhatsApp is installed, so we just
 * attempt `openURL` and catch.
 */
export async function openWhatsappChat(
  raw: string | undefined | null,
  prefill?: string,
): Promise<boolean> {
  if (!raw) return false;
  const digits = String(raw).replace(/[^0-9]/g, "");
  if (digits.length < 8) return false;
  const text = prefill ? encodeURIComponent(prefill) : "";
  const appUrl = `whatsapp://send?phone=${digits}${text ? `&text=${text}` : ""}`;
  const webUrl = `https://wa.me/${digits}${text ? `?text=${text}` : ""}`;
  for (const url of [appUrl, webUrl]) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // try the next candidate
    }
  }
  return false;
}

/** Builds a mailto: URL with optional subject + body. Returns null when
 *  the address is missing so the caller can hide the button. */
export function buildMailtoUrl(
  email: string | undefined | null,
  opts?: { subject?: string; body?: string },
): string | null {
  if (!email || !email.includes("@")) return null;
  const params: string[] = [];
  if (opts?.subject) params.push(`subject=${encodeURIComponent(opts.subject)}`);
  if (opts?.body) params.push(`body=${encodeURIComponent(opts.body)}`);
  const qs = params.length > 0 ? `?${params.join("&")}` : "";
  return `mailto:${email}${qs}`;
}
