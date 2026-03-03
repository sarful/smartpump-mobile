import React from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { UserDashboardScreen } from "./src/screens/UserDashboardScreen";
import { AdminScreen } from "./src/screens/AdminScreen";
import { MasterScreen } from "./src/screens/MasterScreen";

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!user) return <LoginScreen />;
  if (user.role === "master") return <MasterScreen />;
  if (user.role === "admin") return <AdminScreen />;
  return <UserDashboardScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
});
