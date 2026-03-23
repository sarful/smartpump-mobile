import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ScreenStateNoticeProps = {
  title?: string;
  message: string;
  variant?: "info" | "success" | "warning" | "error";
  actionLabel?: string;
  onAction?: () => void;
};

const noticeStyles = {
  info: {
    container: { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
    title: { color: "#0f172a" },
    text: { color: "#475569" },
    button: { borderColor: "#cbd5e1", backgroundColor: "#ffffff" },
    buttonText: { color: "#0f172a" },
  },
  success: {
    container: { borderColor: "#86efac", backgroundColor: "#f0fdf4" },
    title: { color: "#166534" },
    text: { color: "#15803d" },
    button: { borderColor: "#86efac", backgroundColor: "#ffffff" },
    buttonText: { color: "#166534" },
  },
  warning: {
    container: { borderColor: "#fcd34d", backgroundColor: "#fffbeb" },
    title: { color: "#92400e" },
    text: { color: "#b45309" },
    button: { borderColor: "#fcd34d", backgroundColor: "#ffffff" },
    buttonText: { color: "#92400e" },
  },
  error: {
    container: { borderColor: "#fca5a5", backgroundColor: "#fef2f2" },
    title: { color: "#991b1b" },
    text: { color: "#b91c1c" },
    button: { borderColor: "#fca5a5", backgroundColor: "#ffffff" },
    buttonText: { color: "#991b1b" },
  },
} as const;

export function ScreenStateNotice({
  title,
  message,
  variant = "info",
  actionLabel,
  onAction,
}: ScreenStateNoticeProps) {
  const colors = noticeStyles[variant];

  return (
    <View style={[styles.container, colors.container]}>
      <View style={styles.content}>
        <View style={styles.copy}>
          {title ? <Text style={[styles.title, colors.title]}>{title}</Text> : null}
          <Text style={[styles.message, colors.text]}>{message}</Text>
        </View>
        {actionLabel && onAction ? (
          <Pressable style={[styles.actionButton, colors.button]} onPress={onAction}>
            <Text style={[styles.actionText, colors.buttonText]}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  content: {
    gap: 10,
  },
  copy: {
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
