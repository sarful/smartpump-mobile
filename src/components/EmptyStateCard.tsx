import React from "react";
import { StyleSheet, Text, View } from "react-native";

type EmptyStateCardProps = {
  title: string;
  message: string;
};

export function EmptyStateCard({ title, message }: EmptyStateCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  title: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
  },
  message: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 17,
  },
});
