import { memo, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@shared/ui/Text";
import { Input } from "@shared/ui/Input";
import { GradientButton } from "@shared/ui/GradientButton";
import { colors } from "@shared/theme";
import { useUiStore } from "@shared/store/ui.store";
import { useApiAccess, useSubmitApiAccess } from "@features/profile/hooks/useApiAccess";

// "API Access" section — now backed by the real backend. The client pastes
// their API key and taps Connect; it lands as a PENDING request the admin
// approves/rejects from the admin panel. Status (idle / pending / approved /
// rejected) comes from GET /user/api-access and flips live via the
// `api_access` user WS event (UserEventsProvider invalidates the query).
function ApiAccessRowImpl() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [expanded, setExpanded] = useState(false);
  const { data } = useApiAccess();
  const submit = useSubmitApiAccess();

  const status = data?.status ?? "idle";
  const connected = status === "APPROVED";
  const pending = status === "PENDING";
  const rejected = status === "REJECTED";

  // Seed the input from the server's stored key, but don't clobber what the
  // user is typing once they've started editing.
  const [apiKey, setApiKey] = useState("");
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched && data?.api_key) setApiKey(data.api_key);
  }, [data?.api_key, touched]);

  const subtitle = connected
    ? "Connected"
    : pending
      ? "Pending admin approval"
      : rejected
        ? "Request rejected"
        : "Securely manage API keys";
  const subtitleColor = connected
    ? colors.buy
    : rejected
      ? colors.sell
      : colors.textMuted;

  function connect() {
    const k = apiKey.trim();
    if (!k) {
      pushToast({ kind: "warn", message: "Please enter your API key first" });
      return;
    }
    submit.mutate(k, {
      onSuccess: () => {
        setTouched(false);
        pushToast({
          kind: "success",
          message: "API key submitted — pending admin approval",
        });
      },
      onError: (e) => {
        pushToast({ kind: "error", message: e?.message || "Could not submit API key" });
      },
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
                name={
                  connected
                    ? "checkmark-circle"
                    : rejected
                      ? "close-circle"
                      : pending
                        ? "time-outline"
                        : "key-outline"
                }
                size={13}
                color={subtitleColor}
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
            onChangeText={(t) => {
              setTouched(true);
              setApiKey(t);
            }}
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
                label={pending || rejected ? "Resubmit" : "Connect"}
                loading={submit.isPending}
                onPress={connect}
              />
              {pending ? (
                <Text tone="dim" size="xs" style={{ textAlign: "center" }}>
                  Your request is with the admin. You&apos;ll be connected once
                  it&apos;s approved.
                </Text>
              ) : null}
              {rejected ? (
                <Text size="xs" style={{ textAlign: "center", color: colors.sell }}>
                  {data?.rejection_reason
                    ? `Rejected: ${data.rejection_reason}`
                    : "Your request was rejected. Update the key and resubmit."}
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
