import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export function MasterScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Master Mobile (Phase 1)</Text>
        <Text style={styles.line}>Welcome, {user?.username}</Text>
        <Text style={styles.line}>Role: {user?.role}</Text>
        <Text style={styles.line}>Master ID: {user?.id}</Text>
        <Text style={styles.note}>Phase 2 তে master controls (approve/suspend/overview) যুক্ত হবে।</Text>
        <Pressable style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 18, gap: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  line: { fontSize: 15, color: "#334155" },
  note: { marginTop: 8, fontSize: 13, color: "#64748b" },
  button: { marginTop: 14, backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
});
