import React, { useEffect } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { GuestNavigator } from "./src/navigation/GuestNavigator";
import { UserDashboardScreen } from "./src/screens/UserDashboardScreen";
import { AdminScreen } from "./src/screens/AdminScreen";
import { MasterScreen } from "./src/screens/MasterScreen";
import { installMobileCrashReporting } from "./src/utils/installMobileCrashReporting";

function Root() {
  const { user, loading } = useAuth();

  useEffect(() => {
    installMobileCrashReporting(() => user);
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!user) return <GuestNavigator />;
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
