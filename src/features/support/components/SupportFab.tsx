import { Pressable, View } from "react-native";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, shadows } from "@shared/theme";
import { useAuthStore } from "@features/auth/store/auth.store";

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

/** Floating support bubble, mounted once at the root so it rides above
 *  every screen. Opens the in-app chat. */
export function SupportFab() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  if (!isAuth) return null;
  if (HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  const onTabRoute = TAB_ROUTES.includes(pathname);
  const bottom = insets.bottom + (onTabRoute ? 66 : 24);

  return (
    <View style={{ position: "absolute", right: 16, bottom }} pointerEvents="box-none">
      <Pressable
        onPress={() => router.push("/support")}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Chat with support"
      >
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: colors.bg,
            ...shadows.lg,
          }}
        >
          <Ionicons name="headset" size={24} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}
