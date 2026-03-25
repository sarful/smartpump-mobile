import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  actionLabel?: string;
  onActionPress?: () => void;
  actions?: Array<{
    label: string;
    onPress: () => void;
  }>;
};

export function AppFooter({ actionLabel, onActionPress, actions }: Props) {
  const footerActions =
    actions && actions.length > 0
      ? actions
      : actionLabel && onActionPress
        ? [{ label: actionLabel, onPress: onActionPress }]
        : [];

  return (
    <View style={styles.wrap}>
      {footerActions.length > 0 ? (
        <View style={styles.actionsRow}>
          {footerActions.map((action) => (
            <Pressable
              key={action.label}
              style={styles.actionButton}
              onPress={action.onPress}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
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
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
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
