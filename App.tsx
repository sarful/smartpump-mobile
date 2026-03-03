import React from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { HomeScreen } from "./src/screens/HomeScreen";

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return user ? <HomeScreen /> : <LoginScreen />;
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
