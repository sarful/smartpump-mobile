import React, { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import { mobileAuthApi } from "../services/mobileAuthApi";

type Mode = "home" | "user-login" | "admin-login" | "master-login" | "user-register" | "admin-register";

type ActiveAdmin = {
  _id: string;
  username: string;
};

export function LoginScreen() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("home");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [checking, setChecking] = useState(false);
  const [apiStatus, setApiStatus] = useState<"unknown" | "ok" | "down">("unknown");

  const [admins, setAdmins] = useState<ActiveAdmin[]>([]);
  const [adminId, setAdminId] = useState("");

  const [resetOpen, setResetOpen] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const isLoginMode = mode === "user-login" || mode === "admin-login" || mode === "master-login";
  const canReset = mode === "user-login" || mode === "admin-login";

  const title = useMemo(() => {
    if (mode === "user-login") return "User Login";
    if (mode === "admin-login") return "Admin Login";
    if (mode === "master-login") return "Master Admin Login";
    if (mode === "user-register") return "User Register";
    if (mode === "admin-register") return "Admin Register";
    return "Welcome";
  }, [mode]);

  const subtitle = useMemo(() => {
    if (mode === "admin-login") return "Sign in to manage approvals and pumps.";
    if (mode === "user-login") return "Sign in to run and monitor your motor.";
    if (mode === "master-login") return "Sign in to control admins and system settings.";
    if (mode === "admin-register") return "Create admin account for approval.";
    if (mode === "user-register") return "Create user account under an active admin.";
    return "Choose login or register to continue.";
  }, [mode]);

  useEffect(() => {
    if (mode !== "user-register") return;

    const loadAdmins = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/list-active`);
        const json = (await res.json()) as { admins?: ActiveAdmin[] };
        const list = Array.isArray(json.admins) ? json.admins : [];
        setAdmins(list);
        if (!adminId && list.length > 0) setAdminId(list[0]._id);
      } catch {
        setAdmins([]);
      }
    };

    loadAdmins();
  }, [mode, adminId]);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const clearAuthFields = () => {
    setUsername("");
    setPassword("");
  };

  const onSubmitLogin = async () => {
    resetMessages();
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitRegister = async () => {
    resetMessages();
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "admin-register") {
        const res = await fetch(`${API_BASE_URL}/api/admin/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        });
        const json = (await res.json()) as { error?: string; message?: string };
        if (!res.ok) throw new Error(json.error || "Admin register failed");
        setSuccess(json.message || "Admin created. Waiting for approval.");
      } else {
        if (!adminId) {
          setError("Select an admin first");
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/api/user/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password, adminId }),
        });
        const json = (await res.json()) as { error?: string; message?: string };
        if (!res.ok) throw new Error(json.error || "User register failed");
        setSuccess(json.message || "User registered successfully.");
      }

      clearAuthFields();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    resetMessages();
    if (!canReset) return;
    if (!resetUsername || !resetPassword) {
      setError("Username and new password are required");
      return;
    }
    if (resetPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (resetPassword !== resetConfirm) {
      setError("Password confirmation does not match");
      return;
    }

    setResetLoading(true);
    try {
      await mobileAuthApi.resetPassword({
        role: mode === "admin-login" ? "admin" : "user",
        username: resetUsername.trim(),
        newPassword: resetPassword,
      });
      setSuccess("Password reset successful. Now login with new password.");
      setResetOpen(false);
      setResetUsername("");
      setResetPassword("");
      setResetConfirm("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Reset failed";
      setError(message);
    } finally {
      setResetLoading(false);
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

  const setModeAndReset = (nextMode: Mode) => {
    setMode(nextMode);
    setResetOpen(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.brand}>SMARTPUMP PRO</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {mode === "home" ? (
            <View style={styles.menuWrap}>
              <ActionButton label="User Login" onPress={() => setModeAndReset("user-login")} />
              <ActionButton label="Admin Login" onPress={() => setModeAndReset("admin-login")} />
              <ActionButton label="Master Login" onPress={() => setModeAndReset("master-login")} />
              <ActionButton label="User Register" onPress={() => setModeAndReset("user-register")} />
              <ActionButton label="Admin Register" onPress={() => setModeAndReset("admin-register")} />
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder={mode === "admin-login" ? "admin name" : "username"}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="password"
                secureTextEntry
              />

              {mode === "user-register" && (
                <View style={styles.selectWrap}>
                  <Text style={styles.selectLabel}>Select Admin</Text>
                  {admins.length === 0 ? (
                    <Text style={styles.selectEmpty}>No active admin found</Text>
                  ) : (
                    admins.map((admin) => (
                      <Pressable
                        key={admin._id}
                        style={[styles.selectItem, adminId === admin._id && styles.selectItemActive]}
                        onPress={() => setAdminId(admin._id)}
                      >
                        <Text style={[styles.selectItemText, adminId === admin._id && styles.selectItemTextActive]}>
                          {admin.username}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              )}

              {canReset && (
                <Pressable onPress={() => setResetOpen((open) => !open)}>
                  <Text style={styles.forgotLink}>{resetOpen ? "Close reset form" : "Forgot password?"}</Text>
                </Pressable>
              )}

              {resetOpen && canReset && (
                <View style={styles.resetWrap}>
                  <Text style={styles.resetTitle}>Reset password ({mode === "admin-login" ? "Admin" : "User"})</Text>
                  <TextInput
                    style={styles.input}
                    value={resetUsername}
                    onChangeText={setResetUsername}
                    placeholder="Username"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    value={resetPassword}
                    onChangeText={setResetPassword}
                    placeholder="New Password"
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.input}
                    value={resetConfirm}
                    onChangeText={setResetConfirm}
                    placeholder="Confirm New Password"
                    secureTextEntry
                  />
                  <Pressable
                    style={[styles.resetBtn, resetLoading && styles.buttonDisabled]}
                    onPress={onResetPassword}
                    disabled={resetLoading}
                  >
                    <Text style={styles.buttonText}>{resetLoading ? "Resetting..." : "Reset Password"}</Text>
                  </Pressable>
                </View>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {success ? <Text style={styles.success}>{success}</Text> : null}

              <Pressable
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={isLoginMode ? onSubmitLogin : onSubmitRegister}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Please wait..." : isLoginMode ? "Sign In" : "Create Account"}
                </Text>
              </Pressable>

              <View style={styles.bottomRow}>
                <Pressable onPress={() => setModeAndReset(mode === "admin-login" ? "admin-register" : "user-register")}>
                  <Text style={styles.smallLink}>Need an account? Register</Text>
                </Pressable>
                <Pressable onPress={() => setModeAndReset("home")}>
                  <Text style={styles.smallLink}>Go to Home</Text>
                </Pressable>
              </View>
            </>
          )}

          <Pressable style={styles.healthBtn} onPress={checkApi} disabled={checking}>
            <Text style={styles.healthText}>{checking ? "Checking API..." : `API Check (${apiStatus})`}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.linkBtn} onPress={onPress}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f7fb" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 18 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "#d8e2f0",
    alignSelf: "center",
    width: "100%",
    maxWidth: 520,
  },
  brand: { fontSize: 12, letterSpacing: 3, color: "#2563eb", fontWeight: "700", textAlign: "center" },
  title: { fontSize: 46, fontWeight: "700", color: "#0a2351", lineHeight: 50, textAlign: "center" },
  subtitle: { color: "#0f172a", fontSize: 14, marginTop: -2, textAlign: "center" },
  menuWrap: { gap: 10, marginTop: 2 },
  linkBtn: {
    borderWidth: 1,
    borderColor: "#b9c8de",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
  },
  linkText: { color: "#0f172a", fontSize: 24, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#0f172a",
    backgroundColor: "#fff",
    fontSize: 17,
  },
  selectWrap: { borderWidth: 1, borderColor: "#d8e2f0", borderRadius: 10, padding: 10, gap: 8 },
  selectLabel: { fontSize: 13, fontWeight: "600", color: "#334155" },
  selectEmpty: { fontSize: 12, color: "#64748b" },
  selectItem: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  selectItemActive: { borderColor: "#2563eb", backgroundColor: "#eef4ff" },
  selectItemText: { color: "#0f172a" },
  selectItemTextActive: { color: "#1d4ed8", fontWeight: "700" },
  forgotLink: { color: "#2563eb", fontSize: 13, fontWeight: "600" },
  resetWrap: { borderWidth: 1, borderColor: "#d8e2f0", borderRadius: 10, padding: 10, gap: 8 },
  resetTitle: { color: "#0f172a", fontWeight: "700", fontSize: 13 },
  resetBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  error: { color: "#dc2626", fontSize: 13 },
  success: { color: "#15803d", fontSize: 13 },
  button: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 22 },
  bottomRow: { marginTop: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smallLink: { color: "#2563eb", fontSize: 14 },
  healthBtn: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  healthText: { color: "#334155", fontWeight: "600", fontSize: 12 },
});
