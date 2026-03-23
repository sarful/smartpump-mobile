import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppFooter } from "../components/AppFooter";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { GuestRoute } from "../navigation/guestRoutes";
import { mobileAuthApi } from "../services/mobileAuthApi";

type ActiveAdmin = {
  _id: string;
  username: string;
};

const beginnerGuideSections = [
  {
    title: "1. Introduction to PumpPilot",
    body: "PumpPilot is a smart motor control platform for fair and safe pump usage.",
    points: [
      "One Admin controls one pump line with many users.",
      "System handles wallet minutes, queue, and load shedding automatically.",
      "ESP32 follows server command every few seconds.",
    ],
  },
  {
    title: "2. Account Login and Access",
    body: "Choose the correct role before login: Master Admin, Admin, or User.",
    points: [
      "User and Admin can register from Home page.",
      "New Admin may stay pending until Master Admin approval.",
      "If login fails, check role + username + password.",
    ],
    example:
      "Example: Admin 'Rahim' registers -> status pending -> Master approves -> then login works.",
  },
  {
    title: "3. Understanding the Dashboard",
    body: "Dashboard cards show real-time motor and wallet state.",
    points: [
      "Motor Status: OFF / RUNNING / HOLD",
      "Remaining Minutes: current running timer",
      "Available Minutes: wallet balance",
      "Queue cards appear only when user is queued",
    ],
  },
  {
    title: "4. Checking Your Balance",
    body: "Always verify balance before starting.",
    points: [
      "If balance is below 5 minutes, start controls are restricted.",
      "Recharge first, then run motor.",
    ],
    example:
      "Example: Balance 4m -> Start disabled -> request recharge -> after approval balance updates.",
  },
  {
    title: "5. Getting Minutes Recharge",
    body: "User requests minutes; Admin approves/recharges from Admin Dashboard.",
    points: [
      "User clicks Buy Minutes and sends request.",
      "Admin sees pending request and can Approve/Decline.",
      "Approved minutes are added instantly to user wallet.",
    ],
  },
  {
    title: "6. How to Start the Pump",
    body: "Set run time and start motor from User Dashboard.",
    points: [
      "Enter requested minutes in Set Minutes.",
      "Press Start Motor.",
      "If pump is busy, user automatically joins queue.",
    ],
    example:
      "Example: Request 10m while another user runs -> Queue Position becomes #1.",
  },
  {
    title: "7. How to Stop the Pump",
    body: "Stop can be pressed anytime, including queued state.",
    points: [
      "Running user: motor stops and usage is finalized.",
      "Queued user: queue entry is removed.",
      "Dashboard refreshes to normal OFF state.",
    ],
  },
  {
    title: "8. Unused Minute Return (Refund System)",
    body: "If a run is stopped early, unused requested minutes are returned to wallet balance.",
    points: [
      "System first reserves requested minutes for fair queue control.",
      "On early stop, actual used minutes are calculated from run time.",
      "Unused part is refunded automatically to Available Minutes.",
    ],
    example:
      "Example: User sets 10m, stops at 6m -> Used 6m, Refund 4m, wallet gets 4m back.",
  },
  {
    title: "9. Adding Extra Minutes",
    body: "When RUNNING, user can extend by +1 minute.",
    points: [
      "Button appears only during RUNNING.",
      "Each click increases remaining time by 1 minute.",
      "Wallet is adjusted accordingly.",
    ],
  },
  {
    title: "10. Understanding the Queue System",
    body: "Queue ensures only one active motor per admin.",
    points: [
      "Position #1 waits for current run to finish.",
      "Estimated wait depends on current and earlier queue times.",
      "Next user auto-starts when current run ends.",
    ],
    example:
      "Example: User A running 8m, User B queue #1 -> estimated wait about 8m.",
  },
  {
    title: "11. What to Do During Load Shedding",
    body: "Load shedding forces HOLD mode for safety.",
    points: [
      "Motor output turns OFF immediately.",
      "Timer pauses during HOLD.",
      "After power return, RUNNING resumes from same remaining time.",
    ],
  },
  {
    title: "12. Viewing Usage History",
    body: "Use Logs page to track activity.",
    points: [
      "See motor_start, motor_stop, recharge, hold, resume events.",
      "Master sees all logs, Admin sees own logs, User sees own logs.",
      "Useful for support and billing checks.",
    ],
  },
  {
    title: "13. Common Problems and Solutions",
    body: "Use this quick troubleshooting order.",
    points: [
      "Check internet and API base URL.",
      "Check account status (active/suspended).",
      "Check wallet balance and queue status.",
      "Check load shedding state and ESP32 connectivity.",
    ],
  },
  {
    title: "14. Safety Guidelines",
    body: "Follow electrical and operational safety at all times.",
    points: [
      "Do not bypass interlock or relay protection.",
      "Use proper rated contactor/relay and wiring.",
      "Keep panel dry and protected from dust/water.",
    ],
  },
  {
    title: "15. Best Usage Practices",
    body: "Good habits improve uptime and reduce disputes.",
    points: [
      "Set realistic run minutes, avoid oversized requests.",
      "Approve/decline requests quickly to keep workflow smooth.",
      "Review logs weekly for unusual behavior.",
      "Protect credentials, secrets, and device access.",
    ],
  },
];

const documentationSections = [
  {
    title: "System Overview",
    body: "PumpPilot is a centralized motor control platform with web dashboard, mobile app, API backend, MongoDB storage, and ESP32 edge devices.",
    example:
      "Example: User starts motor from dashboard -> API updates state -> ESP32 polls and runs motor.",
  },
  {
    title: "High-Level Architecture",
    body: "One backend (Next.js App Router API) serves two clients (Web + React Native). MongoDB stores users, queue, wallet, logs, and system state.",
    example:
      "Flow: Web/Mobile -> /api/* -> Queue/Timer engines -> MongoDB -> ESP32 /api/esp32/poll",
  },
  {
    title: "Multi-Tenant Isolation Model",
    body: "Each Admin is a tenant. Users are strictly bound to adminId. Queue, minute requests, and runtime decisions are tenant-scoped.",
    example: "Admin Rahim users cannot affect Admin Q users or queue.",
  },
  {
    title: "Role-Based Access Control (RBAC)",
    body: "Master Admin: system-wide control. Admin: tenant control. User: motor operation only. Mobile and web both enforce role checks.",
    example: "User cannot call admin recharge API; request returns 403.",
  },
  {
    title: "Application Layer Design",
    body: "UI layer (pages/screens), API routes, engine layer (queue/timer/loadshedding), and model layer (mongoose schemas) are separated for maintainability.",
  },
  {
    title: "Wallet Engine Architecture",
    body: "Minutes are deducted on actual usage. Early stop returns unused minutes. Recharge updates availableMinutes with audit logs.",
    example: "Set 10m, stop at 6m -> used 6, refund 4.",
  },
  {
    title: "Smart Queue Engine Architecture",
    body: "Per admin only one RUNNING entry is allowed. New requests become WAITING with position. Next user auto-starts when current ends.",
    example: "User A RUNNING, User B starts -> WAITING #1.",
  },
  {
    title: "Load Shedding Engine Design",
    body: "Load shedding forces HOLD state, pauses decrement, and keeps remaining time intact for safe resume.",
    example:
      "RUNNING 8m -> HOLD due to power loss -> resume from 8m on recovery.",
  },
  {
    title: "Device Synchronization Engine",
    body: "ESP32 polling syncs physical state with backend state every 3-5 seconds. Local load-shedding pin can also be sent to server.",
  },
  {
    title: "ESP32 Firmware Architecture",
    body: "Firmware has WiFi/GPRS connect, poll loop, JSON parser, and motor GPIO decision logic using motorStatus + loadShedding.",
    example: "RUNNING + no LS => GPIO HIGH, otherwise GPIO LOW.",
  },
  {
    title: "Hardware Integration & Electrical Protection Design",
    body: "Use relay/contactor isolation, proper fuse/MCB, optocoupler path, and interlock rule (single active motor per admin) for safety.",
  },
  {
    title: "Database Schema & Index Strategy",
    body: "Core collections: admins, users, queues, usage_history, minute_requests, mobile_sessions. Indexed by adminId/userId/date/position for fast reads.",
    example: "Queue compound index adminId+position speeds waiting list reads.",
  },
  {
    title: "API Architecture & Endpoint Design",
    body: "REST endpoints are role-scoped: auth, motor, queue, admin actions, master actions, mobile endpoints, and ESP32 poll endpoint.",
    example:
      "POST /api/motor/start, POST /api/motor/stop, GET /api/esp32/poll?adminId=...",
  },
  {
    title: "Concurrency & State Management Strategy",
    body: "Queue ordering and state transitions are controlled server-side. Optimistic UI is corrected by realtime polling to prevent drift.",
  },
  {
    title: "Security Architecture",
    body: "Password hashing, JWT/session auth, role guards, suspend workflow, and protected mobile bearer token endpoints reduce abuse risk.",
  },
  {
    title: "Error Handling & Fail-Safe Strategy",
    body: "API routes use try/catch and explicit JSON errors. On failures, motor-safe fallback is OFF/HOLD depending on state.",
    example: "ESP32 non-200 response => keep safe OFF output.",
  },
  {
    title: "Scalability & Performance Strategy",
    body: "Tenant-scoped queries, indexed reads, lightweight polling payloads, and decoupled engines support scaling to 100+ motors.",
  },
  {
    title: "Deployment Architecture",
    body: "Web/API deploy on Vercel, MongoDB Atlas as database, ESP32 devices configured with hosted API URL, mobile app via Expo/EAS.",
  },
  {
    title: "Production Validation Checklist",
    body: "Validate env vars, auth roles, suspend behavior, queue correctness, hold/resume, refund correctness, and ESP32 command response.",
  },
  {
    title: "Future Upgrade & Expansion Roadmap",
    body: "Planned: websocket/MQTT realtime, richer analytics, alerting, backup/restore tooling, and stronger device certificate security.",
  },
];

const hardwareRows = [
  "ESP32 | GPIO5 | Optocoupler LED (+) via resistor | Motor ON/OFF signal",
  "ESP32 | GND | Optocoupler LED (-) | Signal ground",
  "Optocoupler Output | Collector | Transistor Base (via 1k resistor) | Isolation switching",
  "Optocoupler Output | Emitter | GND | Ground reference",
  "Transistor | Collector | Relay Coil (-) | Relay drive",
  "Transistor | Emitter | GND | Ground",
  "Relay Coil (+) | +12V | External power | Relay supply",
  "Relay COM | AC Line | Motor input | Switching line",
  "Relay NO | Motor Phase | Motor power control | -",
  "ESP32 | GPIO18 (example) | Load Shedding input | Grid status detect",
];

type LoginScreenProps = {
  route: GuestRoute;
  navigate: (route: GuestRoute) => void;
};

export function LoginScreen({ route, navigate }: LoginScreenProps) {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [checking, setChecking] = useState(false);
  const [apiStatus, setApiStatus] = useState<"unknown" | "ok" | "down">(
    "unknown",
  );

  const [admins, setAdmins] = useState<ActiveAdmin[]>([]);
  const [adminId, setAdminId] = useState("");

  const isLoginMode =
    route === "user-login" || route === "admin-login" || route === "master-login";

  const title = useMemo(() => {
    if (route === "user-login") return "User Login";
    if (route === "admin-login") return "Admin Login";
    if (route === "master-login") return "Master Admin Login";
    if (route === "user-register") return "User Register";
    if (route === "admin-register") return "Admin Register";
    if (route === "guide") return "Beginner Guide";
    if (route === "documentation") return "Documentation";
    return "Welcome";
  }, [route]);

  const subtitle = useMemo(() => {
    if (route === "admin-login") return "Sign in to manage approvals and pumps.";
    if (route === "user-login") return "Sign in to run and monitor your motor.";
    if (route === "master-login")
      return "Sign in to control admins and system settings.";
    if (route === "admin-register") return "Create admin account for approval.";
    if (route === "user-register")
      return "Create user account under an active admin.";
    if (route === "guide") return "Quick start steps for first-time users.";
    if (route === "documentation")
      return "Technical overview in simple language.";
    return "Choose login or register to continue.";
  }, [route]);

  useEffect(() => {
    if (route !== "user-register") return;

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
  }, [route, adminId]);

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
      if (route === "admin-register") {
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
          body: JSON.stringify({
            username: username.trim(),
            password,
            adminId,
          }),
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

  const navigateAndReset = (nextRoute: GuestRoute) => {
    navigate(nextRoute);
    setError(null);
    setSuccess(null);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.brand}>PUMPPILOT</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.contentArea}>
            {route === "home" ? (
              <View style={styles.homeWrap}>
                <View style={styles.menuWrap}>
                  <ActionButton
                    label="User Login"
                    onPress={() => navigateAndReset("user-login")}
                  />
                  <ActionButton
                    label="Admin Login"
                    onPress={() => navigateAndReset("admin-login")}
                  />
                  <ActionButton
                    label="Master Login"
                    onPress={() => navigateAndReset("master-login")}
                  />
                  <ActionButton
                    label="User Register"
                    onPress={() => navigateAndReset("user-register")}
                  />
                  <ActionButton
                    label="Admin Register"
                    onPress={() => navigateAndReset("admin-register")}
                  />
                </View>

                <View style={styles.helpCard}>
                  <Text style={styles.helpTitle}>Help Center</Text>
                  <Text style={styles.helpSubTitle}>
                    Beginner Guide and Documentation
                  </Text>
                  <View style={styles.helpActions}>
                    <ActionButton
                      label="Beginner Guide"
                      onPress={() => navigateAndReset("guide")}
                    />
                    <ActionButton
                      label="Documentation"
                      onPress={() => navigateAndReset("documentation")}
                    />
                  </View>
                </View>
              </View>
            ) : route === "guide" ? (
              <View style={styles.docWrap}>
                <Text style={styles.docLine}>
                  This guide is written for absolute beginners. Follow each step
                  in order.
                </Text>
                {beginnerGuideSections.map((section) => (
                  <View key={section.title} style={styles.docSection}>
                    <Text style={styles.docSectionTitle}>{section.title}</Text>
                    <Text style={styles.docLine}>{section.body}</Text>
                    {section.points.map((point) => (
                      <Text key={point} style={styles.docBullet}>- {point}</Text>
                    ))}
                    {section.example ? (
                      <Text style={styles.docExample}>{section.example}</Text>
                    ) : null}
                  </View>
                ))}
                <Pressable onPress={() => navigateAndReset("home")}>
                  <Text style={styles.smallLink}>Go to Home</Text>
                </Pressable>
              </View>
            ) : route === "documentation" ? (
              <View style={styles.docWrap}>
                {/* <Text style={styles.docLine}>Quick technical documentation in simple language.</Text> */}
                {documentationSections.map((section) => (
                  <View key={section.title} style={styles.docSection}>
                    <Text style={styles.docSectionTitle}>{section.title}</Text>
                    <Text style={styles.docLine}>{section.body}</Text>
                    {section.title ===
                      "Hardware Integration & Electrical Protection Design" && (
                      <View style={styles.tableWrap}>
                        <Text style={styles.tableHead}>
                          Component | Pin/Terminal | Connect To | Purpose
                        </Text>
                        {hardwareRows.map((row) => (
                          <Text key={row} style={styles.tableRow}>
                            {row}
                          </Text>
                        ))}
                      </View>
                    )}
                    {section.example ? (
                      <Text style={styles.docExample}>{section.example}</Text>
                    ) : null}
                  </View>
                ))}
                <Text style={styles.docLine}>API Host: {API_BASE_URL}</Text>
                <Pressable onPress={() => navigateAndReset("home")}>
                  <Text style={styles.smallLink}>Go to Home</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={
                    route === "admin-login" ? "admin name" : "username"
                  }
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="password"
                  secureTextEntry
                />

                {route === "user-register" && (
                  <View style={styles.selectWrap}>
                    <Text style={styles.selectLabel}>Select Admin</Text>
                    {admins.length === 0 ? (
                      <Text style={styles.selectEmpty}>
                        No active admin found
                      </Text>
                    ) : (
                      admins.map((admin) => (
                        <Pressable
                          key={admin._id}
                          style={[
                            styles.selectItem,
                            adminId === admin._id && styles.selectItemActive,
                          ]}
                          onPress={() => setAdminId(admin._id)}
                        >
                          <Text
                            style={[
                              styles.selectItemText,
                              adminId === admin._id &&
                                styles.selectItemTextActive,
                            ]}
                          >
                            {admin.username}
                          </Text>
                        </Pressable>
                      ))
                    )}
                  </View>
                )}

                {isLoginMode ? (
                  <View style={styles.securityNote}>
                    <Text style={styles.securityNoteTitle}>Password security</Text>
                    <Text style={styles.securityNoteText}>
                      Public password reset is disabled. Sign in first, then change your password from the dashboard.
                    </Text>
                  </View>
                ) : null}

                {error ? <Text style={styles.error}>{error}</Text> : null}
                {success ? <Text style={styles.success}>{success}</Text> : null}

                <Pressable
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={isLoginMode ? onSubmitLogin : onSubmitRegister}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading
                      ? "Please wait..."
                      : isLoginMode
                        ? "Sign In"
                        : "Create Account"}
                  </Text>
                </Pressable>

                <View style={styles.bottomRow}>
                  <Pressable
                    onPress={() =>
                      navigateAndReset(
                        route === "admin-login"
                          ? "admin-register"
                          : "user-register",
                      )
                    }
                  >
                    <Text style={styles.smallLink}>
                      Need an account? Register
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => navigateAndReset("home")}>
                    <Text style={styles.smallLink}>Go to Home</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>

          <Pressable
            style={styles.healthBtn}
            onPress={checkApi}
            disabled={checking}
          >
            <Text style={styles.healthText}>
              {checking ? "Checking API..." : `API Check (${apiStatus})`}
            </Text>
          </Pressable>
        </View>
        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
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
  brand: {
    fontSize: 12,
    letterSpacing: 3,
    color: "#2563eb",
    fontWeight: "700",
    textAlign: "center",
  },
  title: {
    fontSize: 46,
    fontWeight: "700",
    color: "#0a2351",
    lineHeight: 50,
    textAlign: "center",
  },
  subtitle: {
    color: "#0f172a",
    fontSize: 14,
    marginTop: -2,
    textAlign: "center",
  },
  homeWrap: { gap: 12, marginTop: 2 },
  menuWrap: { gap: 10 },
  helpCard: {
    borderWidth: 2,
    borderColor: "#93c5fd",
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    padding: 10,
    gap: 8,
    shadowColor: "#93c5fd",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  helpTitle: {
    color: "#1d4ed8",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  helpSubTitle: { color: "#1e3a8a", fontSize: 12, textAlign: "center" },
  helpActions: { gap: 8 },
  contentArea: { width: "100%", maxWidth: 620, alignSelf: "center" },
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
  selectWrap: {
    borderWidth: 1,
    borderColor: "#d8e2f0",
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
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
  securityNote: {
    borderWidth: 1,
    borderColor: "#d8e2f0",
    borderRadius: 10,
    padding: 10,
    gap: 6,
    backgroundColor: "#f8fafc",
  },
  securityNoteTitle: { color: "#0f172a", fontWeight: "700", fontSize: 13 },
  securityNoteText: { color: "#475569", fontSize: 13, lineHeight: 18 },
  error: { color: "#dc2626", fontSize: 13 },
  success: { color: "#15803d", fontSize: 13 },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 22 },
  bottomRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallLink: { color: "#2563eb", fontSize: 14 },
  healthBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  healthText: { color: "#334155", fontWeight: "600", fontSize: 12 },
  docWrap: {
    borderWidth: 1,
    borderColor: "#d8e2f0",
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  docSection: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 8,
    gap: 4,
    backgroundColor: "#f8fafc",
  },
  docSectionTitle: { color: "#0f172a", fontWeight: "700", fontSize: 13 },
  docLine: { color: "#334155", fontSize: 13, lineHeight: 20 },
  docBullet: { color: "#334155", fontSize: 13, lineHeight: 20, paddingLeft: 4 },
  docExample: { color: "#1e3a8a", fontSize: 12, lineHeight: 18, marginTop: 2 },
  tableWrap: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    borderRadius: 6,
    backgroundColor: "#fff",
    padding: 6,
    gap: 4,
  },
  tableHead: { color: "#0f172a", fontSize: 11, fontWeight: "700" },
  tableRow: { color: "#334155", fontSize: 11, lineHeight: 16 },
});
