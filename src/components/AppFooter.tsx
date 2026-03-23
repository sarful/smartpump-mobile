import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  actionLabel?: string;
  onActionPress?: () => void;
};

export function AppFooter({ actionLabel, onActionPress }: Props) {
  return (
    <View style={styles.wrap}>
      {actionLabel && onActionPress ? (
        <Pressable style={styles.actionButton} onPress={onActionPress}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.text}>
        Copyright by BasicsLab. All rights reserved. Powered by MechatronicsLab.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    paddingTop: 8,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: "#d8e2f0",
    gap: 8,
  },
  actionButton: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
  },
  actionText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  text: {
    color: "#64748b",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
