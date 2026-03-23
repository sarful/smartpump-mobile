import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
};

export function ChangePasswordCard({ onSubmit }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password changed. Please sign in again.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Password update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.help}>
        Password changes require your current password and will sign you out on mobile.
      </Text>
      <TextInput
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        placeholder="Current password"
      />
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="New password"
      />
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="Confirm new password"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <Pressable style={[styles.button, loading && styles.disabled]} disabled={loading} onPress={submit}>
        <Text style={styles.buttonText}>{loading ? "Updating..." : "Change Password"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderColor: "#dbe4f0",
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 10,
  },
  title: { color: "#0f172a", fontSize: 18, fontWeight: "700" },
  help: { color: "#475569", fontSize: 13, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#0f172a",
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "#dc2626", fontSize: 13 },
  success: { color: "#15803d", fontSize: 13 },
});
