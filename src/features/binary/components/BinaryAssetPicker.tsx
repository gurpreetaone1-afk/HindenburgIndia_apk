import { memo, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@shared/theme";
import { Text } from "@shared/ui/Text";
import { Input } from "@shared/ui/Input";
import { prettySymbol } from "@features/binary/utils/binary.utils";

interface Props {
  visible: boolean;
  assets: string[];
  selected?: string;
  onSelect: (symbol: string) => void;
  onClose: () => void;
}

function BinaryAssetPickerImpl({
  visible,
  assets,
  selected,
  onSelect,
  onClose,
}: Props) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toUpperCase();
    if (!needle) return assets;
    return assets.filter((a) => a.toUpperCase().includes(needle));
  }, [assets, q]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: colors.bgOverlay }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            marginTop: "auto",
            backgroundColor: colors.bg,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.xl,
            maxHeight: "70%",
            borderTopWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <Text variant="subheading" weight="semibold">
              Select asset
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <Input
            placeholder="Search assets"
            value={q}
            onChangeText={setQ}
            autoCapitalize="characters"
          />

          {assets.length === 0 ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
              <Text tone="dim" size="sm">
                No assets enabled for binary trading
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ marginTop: spacing.md }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ gap: spacing.xs }}>
                {filtered.map((sym) => {
                  const active = sym === selected;
                  return (
                    <Pressable
                      key={sym}
                      onPress={() => {
                        onSelect(sym);
                        onClose();
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.md,
                        borderRadius: radii.md,
                        backgroundColor: active
                          ? colors.bgElevated
                          : "transparent",
                        borderWidth: 1,
                        borderColor: active ? colors.borderStrong : colors.border,
                      }}
                    >
                      <Text weight={active ? "semibold" : "regular"}>
                        {prettySymbol(sym)}
                      </Text>
                      {active ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={colors.primary}
                        />
                      ) : (
                        <Text tone="dim" size="xs">
                          {sym}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const BinaryAssetPicker = memo(BinaryAssetPickerImpl);
