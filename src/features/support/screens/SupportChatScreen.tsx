import { useEffect, useRef } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@shared/components/Screen";
import { Text } from "@shared/ui/Text";
import { colors, radii, spacing } from "@shared/theme";
import { ChatHeader } from "@features/support/components/ChatHeader";
import { ChatComposer } from "@features/support/components/ChatComposer";
import {
  ChatBubble,
  DateChip,
  TypingBubble,
} from "@features/support/components/ChatBubble";
import {
  QUICK_REPLIES,
  useSupportChat,
  type ChatMessage,
} from "@features/support/hooks/useSupportChat";
import { buildWhatsappUrl, useSupportContacts } from "@features/support/useSupport";

export function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const { messages, typing, send, reset } = useSupportChat();
  const { data: contacts } = useSupportContacts();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const whatsappUrl = buildWhatsappUrl(
    contacts?.whatsapp,
    "Hi, I need help with my Hindenburg account",
  );

  // Drop any in-flight reply timer when the screen unmounts.
  useEffect(() => reset, [reset]);

  const showQuickReplies = messages.length <= 1;

  return (
    <Screen padded={false} edges={["top"]}>
      <ChatHeader typing={typing} whatsappUrl={whatsappUrl} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble msg={item} />}
          ListHeaderComponent={<DateChip label="Today" />}
          ListFooterComponent={typing ? <TypingBubble /> : null}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: spacing.sm,
          }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {showQuickReplies ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.sm,
            }}
          >
            {QUICK_REPLIES.map((q) => (
              <Pressable key={q} onPress={() => send(q)}>
                <View
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.bgElevated,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                  }}
                >
                  <Text size="sm" tone="muted">
                    {q}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View
          style={{
            marginHorizontal: spacing.md,
            marginBottom: 6,
            padding: 8,
            borderRadius: radii.md,
            backgroundColor: colors.bgSurface,
          }}
        >
          <Text tone="dim" size="xs" style={{ textAlign: "center" }}>
            Replies here are automated for now. For anything urgent, use the
            WhatsApp icon above.
          </Text>
        </View>

        <ChatComposer onSend={send} bottomInset={insets.bottom} />
      </KeyboardAvoidingView>
    </Screen>
  );
}
