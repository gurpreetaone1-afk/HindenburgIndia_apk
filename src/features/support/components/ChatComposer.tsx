import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, typography } from "@shared/theme";

interface Props {
  onSend: (text: string) => void;
  /** Extra bottom padding so the bar clears the gesture / nav bar. */
  bottomInset?: number;
}

/** Rounded input pill + gradient send button, WhatsApp layout. */
export function ChatComposer({ onSend, bottomInset = 0 }: Props) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSend(value);
    setValue("");
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 8 + bottomInset,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.lg,
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name="happy-outline" size={20} color={colors.textDim} />
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Message"
          placeholderTextColor={colors.textDim}
          multiline
          maxLength={1000}
          onSubmitEditing={submit}
          style={{
            flex: 1,
            color: colors.text,
            fontFamily: typography.family,
            fontSize: typography.size.md,
            paddingHorizontal: 8,
            paddingVertical: 10,
            maxHeight: 110,
          }}
        />
        <Ionicons name="attach-outline" size={20} color={colors.textDim} />
      </View>

      <Pressable onPress={submit} disabled={!canSend}>
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientVia, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            alignItems: "center",
            justifyContent: "center",
            opacity: canSend ? 1 : 0.45,
          }}
        >
          <Ionicons name="send" size={19} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}
