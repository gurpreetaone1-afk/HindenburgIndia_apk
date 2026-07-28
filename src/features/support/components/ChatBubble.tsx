import { memo } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@shared/ui/Text";
import { colors, radii } from "@shared/theme";
import { fmtIST } from "@shared/utils/time";
import type { ChatMessage } from "@features/support/hooks/useSupportChat";

/** WhatsApp-style bubble: mine = purple, right-aligned, with delivery
 *  ticks; agent = elevated surface, left-aligned. */
function ChatBubbleImpl({ msg }: { msg: ChatMessage }) {
  const mine = msg.mine;
  return (
    <View
      style={{
        alignSelf: mine ? "flex-end" : "flex-start",
        maxWidth: "82%",
        backgroundColor: mine ? colors.primaryDim : colors.bgElevated,
        borderWidth: 1,
        borderColor: mine ? colors.primary : colors.border,
        borderRadius: radii.lg,
        // Squared-off corner on the sender's side gives the bubble its tail.
        borderBottomRightRadius: mine ? 4 : radii.lg,
        borderBottomLeftRadius: mine ? radii.lg : 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 14, lineHeight: 20 }}>{msg.text}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-end",
          gap: 4,
          marginTop: 2,
        }}
      >
        <Text tone="dim" size="xs">
          {fmtIST(new Date(msg.at), "hh:mm a")}
        </Text>
        {mine ? (
          <Ionicons name="checkmark-done" size={13} color={colors.info} />
        ) : null}
      </View>
    </View>
  );
}

/** Three-dot "agent is typing" bubble. */
export function TypingBubble() {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        gap: 4,
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.lg,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 8,
      }}
    >
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.textDim,
            opacity: 1 - i * 0.25,
          }}
        />
      ))}
    </View>
  );
}

/** "Today" pill that separates the day's messages. */
export function DateChip({ label }: { label: string }) {
  return (
    <View style={{ alignItems: "center", marginBottom: 12 }}>
      <View
        style={{
          backgroundColor: colors.bgSurface,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
      >
        <Text tone="muted" size="xs">
          {label}
        </Text>
      </View>
    </View>
  );
}

export const ChatBubble = memo(ChatBubbleImpl);
