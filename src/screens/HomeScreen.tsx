import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome, {user?.username}</Text>
        <Text style={styles.line}>Role: {user?.role}</Text>
        <Text style={styles.line}>User ID: {user?.id}</Text>
        {user?.adminId ? <Text style={styles.line}>Admin ID: {user.adminId}</Text> : null}

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
  button: { marginTop: 14, backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
});
