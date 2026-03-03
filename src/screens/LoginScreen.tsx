import React, { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import { mobileAuthApi } from "../services/mobileAuthApi";

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [apiStatus, setApiStatus] = useState<"unknown" | "ok" | "down">("unknown");

  const onSubmit = async () => {
    setError(null);
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const checkApi = async () => {
    setChecking(true);
    try {
      await mobileAuthApi.health();
      setApiStatus("ok");
      setError(null);
    } catch {
      setApiStatus("down");
      setError("API unavailable. Check backend URL/network.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.brand}>SMARTPUMP PRO</Text>
        <Text style={styles.title}>Mobile Login</Text>
        <Text style={styles.apiText}>API: {API_BASE_URL}</Text>
        <Pressable style={styles.healthBtn} onPress={checkApi} disabled={checking}>
          <Text style={styles.healthText}>
            {checking ? "Checking API..." : `Check API (${apiStatus})`}
          </Text>
        </Pressable>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign In"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#ffffff", borderRadius: 14, padding: 18, gap: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  brand: { fontSize: 11, letterSpacing: 2.2, color: "#2563eb", fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  apiText: { fontSize: 12, color: "#64748b" },
  healthBtn: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  healthText: { color: "#334155", fontWeight: "600", fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  error: { color: "#dc2626", fontSize: 13 },
  button: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
