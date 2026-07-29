import { useEffect } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "@features/auth/store/auth.store";
import { usePinStore } from "@features/auth/store/pin.store";
import { colors } from "@shared/theme";

// Gate logic on app launch — the PIN/biometric lock is COMPULSORY:
//   - Not authenticated          → /(auth)/login
//   - Authenticated + NO PIN     → /(auth)/pin-set?mandatory=1 (forced setup —
//                                   e.g. a user upgrading from an older build)
//   - Authenticated + not unlocked → /(auth)/pin-enter (auto-prompts biometric
//                                   when the user enabled it; still accepts PIN)
//   - Authenticated + unlocked   → /(tabs)
export default function Splash() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hasPin = usePinStore((s) => s.hasPin);
  const unlocked = usePinStore((s) => s.unlocked);
  const hydratePin = usePinStore((s) => s.hydrate);

  // Run hydrates exactly once on mount. Previously we ran them every time
  // `hydrated` flipped, which (combined with the now-removed Stack key) made
  // the redirect chain re-evaluate and the login screen look like it was
  // refreshing as zustand state landed in two passes.
  useEffect(() => {
    hydrate();
    void hydratePin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isAuth) return <Redirect href="/(auth)/login" />;

  // Compulsory lock. A logged-in user with NO PIN (upgraded from an old build,
  // or setup interrupted) is forced into mandatory setup. Otherwise the app
  // stays locked until the user unlocks with PIN/biometric. pin-enter.tsx
  // auto-fires the biometric prompt on mount when the user enabled it.
  if (!hasPin) return <Redirect href="/(auth)/pin-set?mandatory=1" />;
  if (!unlocked) return <Redirect href="/(auth)/pin-enter" />;

  return <Redirect href="/(tabs)" />;
}
