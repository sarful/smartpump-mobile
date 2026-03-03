import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";

type DashboardResponse = {
  username: string;
  adminName: string | null;
  availableMinutes: number;
  motorStatus: "OFF" | "RUNNING" | "HOLD";
  remainingMinutes: number;
  queuePosition: number | null;
  runningUser: string | null;
  estimatedWait: number | null;
  loadShedding: boolean;
  userStatus: "active" | "suspended";
  userSuspendReason: string | null;
  adminStatus: "active" | "suspended" | "pending";
  adminSuspendReason: string | null;
  pendingMinuteRequest: { minutes: number; status: "pending" } | null;
};

export function UserDashboardScreen() {
  const { logout, authorizedRequest } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [requestedMinutes, setRequestedMinutes] = useState("10");
  const [requestMinutes, setRequestMinutes] = useState("10");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await authorizedRequest<DashboardResponse>("/api/mobile/user/dashboard");
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [authorizedRequest]);

  useEffect(() => {
    loadDashboard(false);
    const id = setInterval(() => {
      loadDashboard(true);
    }, 5000);
    return () => clearInterval(id);
  }, [loadDashboard]);

  const suspendedReason = data?.userStatus === "suspended"
    ? data.userSuspendReason
    : data?.adminStatus === "suspended"
      ? data.adminSuspendReason
      : null;
  const lowBalance = (data?.availableMinutes ?? 0) < 5;
  const hasPendingRequest = Boolean(data?.pendingMinuteRequest);
  const canControlMotor = !suspendedReason && !lowBalance && !data?.loadShedding;
  const hasActiveQueue = Boolean(data?.queuePosition && data.queuePosition > 0);

  const queueAwareness = useMemo(() => {
    if (!data) return "-";
    if (data.queuePosition === 0) return "You are running";
    if (data.queuePosition && data.queuePosition > 0) return `You are #${data.queuePosition}`;
    return "No queue";
  }, [data]);

  const runAction = async (actionName: string, fn: () => Promise<void>) => {
    setBusyAction(actionName);
    setError(null);
    setMessage(null);
    try {
      await fn();
      await loadDashboard(true);
    } catch (err: any) {
      setError(err?.message || "Action failed");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading && !data) {
    return (
      <View style={[styles.center, styles.page]}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Welcome, {data?.username}</Text>
          <Text style={styles.subTitle}>Admin: {data?.adminName || "-"}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {message ? <Text style={styles.successText}>{message}</Text> : null}

      {suspendedReason ? (
        <Text style={styles.warningText}>Account suspended: {suspendedReason}</Text>
      ) : null}
      {!suspendedReason && lowBalance ? (
        <Text style={styles.warningText}>আপনার পাঁচ মিনিটের কম ব্যালান্স আছে, রিচার্জ করুন।</Text>
      ) : null}
      {data?.loadShedding ? (
        <Text style={styles.warningText}>Load shedding active. Motor/timer are on HOLD.</Text>
      ) : null}

      <View style={styles.grid}>
        <Card title="Motor Status" value={data?.motorStatus || "OFF"} />
        <Card title="Remaining Minutes" value={`${data?.remainingMinutes ?? 0}m`} />
        <Card title="Available Minutes" value={`${data?.availableMinutes ?? 0}m`} />
        {hasActiveQueue ? (
          <>
            <Card title="Running User" value={data?.runningUser || "-"} />
            <Card title="Queue Position" value={data?.queuePosition === 0 ? "Running" : `#${data?.queuePosition}`} />
            <Card title="Est. Wait" value={data?.estimatedWait !== null ? `${data?.estimatedWait}m` : "-"} />
            <Card title="Queue Awareness" value={queueAwareness} />
          </>
        ) : null}
        {hasPendingRequest ? (
          <Card
            title="Request Minutes"
            value={`Pending: ${data?.pendingMinuteRequest?.minutes}m`}
          />
        ) : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Set Minutes</Text>
        <TextInput
          value={requestedMinutes}
          onChangeText={setRequestedMinutes}
          keyboardType="numeric"
          style={styles.input}
          placeholder="Minutes"
        />
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.primaryBtn, (!canControlMotor || busyAction === "start") && styles.btnDisabled]}
            disabled={!canControlMotor || busyAction !== null}
            onPress={() =>
              runAction("start", async () => {
                const minutes = Number(requestedMinutes);
                if (!minutes || minutes <= 0) throw new Error("Invalid minutes");
                const res = await authorizedRequest<{ status: "RUNNING" | "WAITING"; queuePosition?: number }>(
                  "/api/mobile/user/start",
                  { method: "POST", body: JSON.stringify({ requestedMinutes: minutes }) },
                );
                if (res.status === "WAITING") {
                  setMessage(`Queued at position #${res.queuePosition ?? "?"}`);
                } else {
                  setMessage("Motor started");
                }
              })
            }
          >
            <Text style={styles.primaryBtnText}>{busyAction === "start" ? "Starting..." : "Start Motor"}</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryBtn, busyAction === "stop" && styles.btnDisabled]}
            disabled={busyAction !== null}
            onPress={() =>
              runAction("stop", async () => {
                await authorizedRequest("/api/mobile/user/stop", { method: "POST" });
                setMessage("Motor stopped/reset");
              })
            }
          >
            <Text style={styles.secondaryBtnText}>{busyAction === "stop" ? "Stopping..." : "Stop Motor"}</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, (!canControlMotor || busyAction === "extend") && styles.btnDisabled]}
            disabled={!canControlMotor || busyAction !== null}
            onPress={() =>
              runAction("extend", async () => {
                await authorizedRequest("/api/mobile/user/extend", {
                  method: "POST",
                  body: JSON.stringify({ minutes: 1 }),
                });
                setMessage("+1 minute added");
              })
            }
          >
            <Text style={styles.primaryBtnText}>{busyAction === "extend" ? "Adding..." : "+ Add 1 Minute"}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Request More Minutes</Text>
        <TextInput
          value={requestMinutes}
          onChangeText={setRequestMinutes}
          keyboardType="numeric"
          style={styles.input}
          placeholder="Request minutes"
          editable={!hasPendingRequest}
        />
        <Pressable
          style={[styles.requestBtn, (hasPendingRequest || busyAction === "request") && styles.btnDisabled]}
          disabled={hasPendingRequest || busyAction !== null}
          onPress={() =>
            runAction("request", async () => {
              const minutes = Number(requestMinutes);
              if (!minutes || minutes <= 0) throw new Error("Invalid request minutes");
              await authorizedRequest("/api/mobile/user/minute-request", {
                method: "POST",
                body: JSON.stringify({ minutes }),
              });
              setMessage("Request sent. Wait until admin approval.");
            })
          }
        >
          <Text style={styles.requestBtnText}>
            {hasPendingRequest ? "Waiting approval..." : busyAction === "request" ? "Sending..." : "Send Request"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  center: { justifyContent: "center", alignItems: "center" },
  container: { padding: 16, gap: 12 },
  loadingText: { color: "#334155", fontSize: 15 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "700", color: "#0f172a" },
  subTitle: { marginTop: 2, color: "#475569" },
  logoutBtn: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff" },
  logoutText: { color: "#0f172a", fontWeight: "600" },
  errorText: { color: "#b91c1c" },
  successText: { color: "#15803d" },
  warningText: {
    color: "#b45309",
    borderWidth: 1,
    borderColor: "#fcd34d",
    backgroundColor: "#fffbeb",
    borderRadius: 10,
    padding: 10,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
  },
  cardTitle: { color: "#64748b", fontSize: 12 },
  cardValue: { marginTop: 6, color: "#0f172a", fontWeight: "700", fontSize: 19 },
  panel: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    gap: 10,
  },
  panelTitle: { color: "#0f172a", fontWeight: "700", fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  buttonRow: { gap: 8 },
  primaryBtn: { borderRadius: 10, backgroundColor: "#10b981", paddingVertical: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { borderRadius: 10, backgroundColor: "#2563eb", paddingVertical: 12, alignItems: "center" },
  secondaryBtnText: { color: "#fff", fontWeight: "700" },
  requestBtn: { borderRadius: 10, backgroundColor: "#0ea5e9", paddingVertical: 12, alignItems: "center" },
  requestBtnText: { color: "#fff", fontWeight: "700" },
  btnDisabled: { opacity: 0.55 },
});
