import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { AdminDashboard, mobileAdminApi } from "../services/mobileAdminApi";
import { AppFooter } from "../components/AppFooter";

export function AdminScreen() {
  const auth = useAuth();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [rechargeUserId, setRechargeUserId] = useState("");
  const [rechargeMinutes, setRechargeMinutes] = useState("10");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const dashboard = await mobileAdminApi.dashboard(auth);
      setData(dashboard);
      if (!rechargeUserId && dashboard.users.length > 0) {
        setRechargeUserId(dashboard.users[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load admin dashboard");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [auth, rechargeUserId]);

  useEffect(() => {
    load(false);
    const id = setInterval(() => load(true), 5000);
    return () => clearInterval(id);
  }, [load]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusyAction(key);
    setError(null);
    setMessage(null);
    try {
      await fn();
      await load(true);
    } catch (err: any) {
      setError(err?.message || "Action failed");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading && !data) {
    return (
      <View style={[styles.page, styles.center]}>
        <Text style={styles.info}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>PUMPPILOT</Text>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.info}>Admin: {data?.admin.username || "-"}</Text>
          <Text style={styles.info}>Users: {data?.users.length ?? 0} | Pending: {data?.pendingRequests.length ?? 0}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.logoutBtn} onPress={auth.logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Recharge Minutes</Text>
        <Text style={styles.info}>Select User</Text>
        <View style={styles.userList}>
          {data?.users.length ? (
            data.users.map((u) => (
              <Pressable
                key={u.id}
                style={[styles.userChip, rechargeUserId === u.id && styles.userChipActive]}
                onPress={() => setRechargeUserId(u.id)}
              >
                <Text style={[styles.userChipText, rechargeUserId === u.id && styles.userChipTextActive]}>
                  {u.username}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.info}>No users found</Text>
          )}
        </View>
        <TextInput
          style={styles.input}
          value={rechargeMinutes}
          onChangeText={setRechargeMinutes}
          keyboardType="numeric"
          placeholder="Minutes"
        />
        <Pressable
          style={[styles.primaryBtn, busyAction === "recharge" && styles.disabled]}
          disabled={busyAction !== null}
          onPress={() =>
            run("recharge", async () => {
              const minutes = Number(rechargeMinutes);
              if (!rechargeUserId) throw new Error("User ID is required");
              if (!minutes || minutes <= 0) throw new Error("Invalid minutes");
              await mobileAdminApi.recharge(auth, rechargeUserId, minutes);
              setMessage("Recharge successful");
            })
          }
        >
          <Text style={styles.btnText}>{busyAction === "recharge" ? "Processing..." : "Recharge"}</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Pending Minute Requests</Text>
        {data?.pendingRequests.length ? (
          data.pendingRequests.map((r) => (
            <View style={styles.item} key={r.id}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemTitle}>{r.username || r.userId}</Text>
                <Text style={styles.itemText}>Minutes: {r.minutes}</Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  style={[styles.approveBtn, busyAction === `approve-${r.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() =>
                    run(`approve-${r.id}`, async () => {
                      await mobileAdminApi.approveRequest(auth, r.id);
                      setMessage("Request approved");
                    })
                  }
                >
                  <Text style={styles.btnText}>Approve</Text>
                </Pressable>
                <Pressable
                  style={[styles.declineBtn, busyAction === `decline-${r.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() =>
                    run(`decline-${r.id}`, async () => {
                      await mobileAdminApi.declineRequest(auth, r.id);
                      setMessage("Request declined");
                    })
                  }
                >
                  <Text style={styles.btnText}>Decline</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.info}>No pending requests.</Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Users</Text>
        {data?.users.length ? (
          data.users.map((u) => (
            <View style={styles.item} key={u.id}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemTitle}>
                  {u.username} ({u.motorStatus})
                </Text>
                <Text style={styles.itemText}>Balance: {u.availableMinutes}m</Text>
                <Text style={styles.itemText}>
                  Status: {u.status}
                  {u.suspendReason ? ` (${u.suspendReason})` : ""}
                </Text>
                <Text style={styles.itemText}>User ID: {u.id}</Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  style={[styles.stopBtn, busyAction === `stop-${u.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() =>
                    run(`stop-${u.id}`, async () => {
                      await mobileAdminApi.stopReset(auth, u.id);
                      setMessage("User motor stopped/reset");
                    })
                  }
                >
                  <Text style={styles.btnText}>Stop/Reset</Text>
                </Pressable>

                {u.status === "suspended" ? (
                  <Pressable
                    style={[styles.approveBtn, busyAction === `uns-${u.id}` && styles.disabled]}
                    disabled={busyAction !== null}
                    onPress={() =>
                      run(`uns-${u.id}`, async () => {
                        await mobileAdminApi.unsuspendUser(auth, u.id);
                        setMessage("User unsuspended");
                      })
                    }
                  >
                    <Text style={styles.btnText}>Unsuspend</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.warnBtn, busyAction === `sus-${u.id}` && styles.disabled]}
                    disabled={busyAction !== null}
                    onPress={() =>
                      run(`sus-${u.id}`, async () => {
                        await mobileAdminApi.suspendUser(auth, u.id, "Suspended from mobile admin");
                        setMessage("User suspended");
                      })
                    }
                  >
                    <Text style={styles.btnText}>Suspend</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.info}>No users.</Text>
        )}
      </View>
      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  center: { justifyContent: "center", alignItems: "center" },
  container: { padding: 16, gap: 12 },
  headerRow: { marginTop: 8, alignItems: "center", gap: 8 },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  brand: { color: "#2563eb", fontSize: 12, fontWeight: "700", letterSpacing: 2, textAlign: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a", textAlign: "center" },
  info: { color: "#475569", fontSize: 13, textAlign: "center" },
  error: { color: "#b91c1c", fontSize: 13 },
  success: { color: "#15803d", fontSize: 13 },
  logoutBtn: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 999, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: "#0f172a", fontWeight: "700" },
  panel: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, backgroundColor: "#fff", padding: 12, gap: 10 },
  panelTitle: { color: "#0f172a", fontWeight: "700", fontSize: 16 },
  input: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: "#0f172a", backgroundColor: "#fff" },
  userList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  userChip: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff" },
  userChipActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  userChipText: { color: "#334155", fontWeight: "600", fontSize: 12 },
  userChipTextActive: { color: "#1d4ed8" },
  item: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 10, backgroundColor: "#f8fafc", gap: 8 },
  itemLeft: { gap: 2 },
  itemTitle: { color: "#0f172a", fontWeight: "700" },
  itemText: { color: "#475569", fontSize: 12 },
  itemActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  primaryBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  approveBtn: { backgroundColor: "#16a34a", borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12 },
  declineBtn: { backgroundColor: "#dc2626", borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12 },
  warnBtn: { backgroundColor: "#d97706", borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12 },
  stopBtn: { backgroundColor: "#0f172a", borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  disabled: { opacity: 0.6 },
});
