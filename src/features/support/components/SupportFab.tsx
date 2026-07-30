import { Pressable, View } from "react-native";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, shadows } from "@shared/theme";
import { useAuthStore } from "@features/auth/store/auth.store";
import { openWhatsappChat, useSupportContacts } from "@features/support/useSupport";

// WhatsApp brand green so the bubble reads instantly as "chat on WhatsApp".
const WA_GREEN = "#25D366";

// Routes that own the whole screen (auth flow, the chat itself, the
// full-screen chart) — the bubble would be in the way there.
const HIDDEN = [
  "/login",
  "/register",
  "/forgot-password",
  "/otp-verify",
  "/pin-enter",
  "/pin-set",
  "/2fa",
  "/support",
  "/terminal",
  "/trade/chart",
];

// Tab routes sit above a 48 dp tab bar, so the bubble is lifted clear of it.
const TAB_ROUTES = ["/", "/market", "/orders", "/portfolio", "/trade"];

/** Floating WhatsApp bubble, mounted once at the root so it rides above every
 *  screen. Taps open WhatsApp directly to the owning admin's configured
 *  support number (from /user/support). If no number is set it falls back to
 *  the in-app support chat so the button is never a dead end. */
export function SupportFab() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const { data: support } = useSupportContacts();

  if (!isAuth) return null;
  if (HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  const onTabRoute = TAB_ROUTES.includes(pathname);
  const bottom = insets.bottom + (onTabRoute ? 66 : 24);

  async function onPress() {
    // Try to open WhatsApp directly to the admin's number (native deep link
    // first, wa.me fallback). Only drop to the in-app chat when there's no
    // usable number OR neither URL could launch.
    const opened = await openWhatsappChat(
      support?.whatsapp,
      "Hi, I need help with my Hindenburg account",
    );
    if (!opened) router.push("/support");
  }

  return (
    <View style={{ position: "absolute", right: 16, bottom }} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Chat on WhatsApp"
      >
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: WA_GREEN,
            borderWidth: 2,
            borderColor: colors.bg,
            ...shadows.lg,
          }}
        >
          <Ionicons name="logo-whatsapp" size={28} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}
