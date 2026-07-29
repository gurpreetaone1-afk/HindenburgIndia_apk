import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@shared/components/Screen";
import { Text } from "@shared/ui/Text";
import { AuthHero } from "@features/auth/components/AuthHero";
import { LoginForm } from "@features/auth/components/LoginForm";

export default function LoginScreen() {
  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        {/* Top-anchored + scrollable (NOT justifyContent:"center"). Centering
            the content stopped the ScrollView from scrolling the focused field
            up when the keyboard opened, so the Password box hid behind the
            keyboard. Same pattern as the (working) Withdraw/Deposit screens:
            padding + a generous paddingBottom so the focused input always
            scrolls clear of the keyboard. */}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 40,
            // Generous bottom padding (same approach as the register screen) so
            // the Password field + Sign-in button always scroll clear of the
            // keyboard — the ScrollView overflow-scrolls above the resized host.
            paddingBottom: 220,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <AuthHero title="Welcome back" subtitle="Sign in to continue trading" />
          <LoginForm />
          <View style={{ marginTop: 28, alignItems: "center", gap: 16 }}>
            <Pressable
              onPress={() => router.push("/(auth)/forgot-password")}
              hitSlop={10}
            >
              <Text style={{ color: "#A855F7", fontWeight: "500" }}>Forgot password?</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(auth)/register")}
              hitSlop={10}
              style={{ flexDirection: "row", gap: 4 }}
            >
              <Text tone="muted">New here?</Text>
              <Text style={{ color: "#A855F7", fontWeight: "500" }}>Create account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
