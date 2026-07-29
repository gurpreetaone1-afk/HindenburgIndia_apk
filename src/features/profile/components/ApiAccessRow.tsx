import { memo, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@shared/ui/Text";
import { Input } from "@shared/ui/Input";
import { GradientButton } from "@shared/ui/GradientButton";
import { colors } from "@shared/theme";
import { mmkv } from "@core/storage/mmkv";
import { useUiStore } from "@shared/store/ui.store";

// Local-only "API Access" section. It does NOT talk to any backend — the
// client pastes their API key/link and taps Connect; we persist it on-device
// and mark it "pending admin approval". A real approval flip to "connected"
// would come from the backend later; until then it stays pending. Purely a
// UI/section placeholder per product spec.
const KEY_STORE = "nb.apiKey";
const STATUS_STORE = "nb.apiStatus";

type ApiStatus = "idle" | "pending" | "connected";

function ApiAccessRowImpl() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [expanded, setExpanded] = useState(false);
  const [apiKey, setApiKey] = useState(() => mmkv.getString(KEY_STORE) ?? "");
  const [status, setStatus] = useState<ApiStatus>(
    () => (mmkv.getString(STATUS_STORE) as ApiStatus | null) ?? "idle",
  );
  const [busy, setBusy] = useState(false);

  const connected = status === "connected";
  const pending = status === "pending";

  const subtitle = connected
    ? "Connected"
    : pending
      ? "Pending admin approval"
      : "Securely manage API keys";
  const subtitleColor = connected
    ? colors.buy
    : pending
      ? colors.textMuted
      : colors.textMuted;

  function connect() {
    const k = apiKey.trim();
    if (!k) {
      pushToast({ kind: "warn", message: "Please enter your API key first" });
      return;
    }
    setBusy(true);
    mmkv.setString(KEY_STORE, k);
    mmkv.setString(STATUS_STORE, "pending");
    setStatus("pending");
    setBusy(false);
    pushToast({
      kind: "success",
      message: "API key submitted — pending admin approval",
    });
  }

  return (
    <View>
      <Pressable onPress={() => setExpanded((v) => !v)}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 14,
            paddingHorizontal: 4,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Ionicons
            name="terminal-outline"
            size={20}
            color={colors.textMuted}
            style={{ marginRight: 14 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "500" }}>API Access</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 2,
                gap: 5,
              }}
            >
              <Ionicons
                name={pending ? "time-outline" : "checkmark-circle"}
                size={13}
                color={pending ? colors.textMuted : colors.buy}
              />
              <Text size="sm" style={{ color: subtitleColor }}>
                {subtitle}
              </Text>
            </View>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textDim}
          />
        </View>
      </Pressable>

      {expanded ? (
        <View
          style={{ paddingHorizontal: 4, paddingTop: 10, paddingBottom: 8, gap: 12 }}
        >
          <Input
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Please put API Key in this section"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!connected}
          />
          {connected ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.buy} />
              <Text size="sm" style={{ color: colors.buy }}>
                Your API access is active.
              </Text>
            </View>
          ) : (
            <>
              <GradientButton
                label={pending ? "Resubmit" : "Connect"}
                loading={busy}
                onPress={connect}
              />
              {pending ? (
                <Text tone="dim" size="xs" style={{ textAlign: "center" }}>
                  Your request is with the admin. You&apos;ll be connected once
                  it&apos;s approved.
                </Text>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

export const ApiAccessRow = memo(ApiAccessRowImpl);
