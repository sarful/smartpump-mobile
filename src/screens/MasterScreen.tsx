import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { MasterDashboardData, mobileMasterApi } from "../services/mobileMasterApi";
import { AppFooter } from "../components/AppFooter";

export function MasterScreen() {
  const auth = useAuth();
  const [data, setData] = useState<MasterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const dashboard = await mobileMasterApi.dashboard(auth);
      setData(dashboard);
    } catch (err: any) {
      setError(err?.message || "Failed to load master dashboard");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    load(false);
    const id = setInterval(() => load(true), 7000);
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
        <Text style={styles.info}>Loading master dashboard...</Text>
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
          <Text style={styles.title}>Master Dashboard</Text>
          <Text style={styles.info}>Master Admin: {auth.user?.username || "-"}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.logoutBtn} onPress={auth.logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <View style={styles.statsGrid}>
        <StatCard title="Admins" value={String(data?.overview.adminCount ?? 0)} />
        <StatCard title="Users" value={String(data?.overview.userCount ?? 0)} />
        <StatCard title="Running" value={String(data?.overview.running ?? 0)} />
        <StatCard title="Waiting" value={String(data?.overview.waiting ?? 0)} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Admin Approval Mode</Text>
        <Text style={styles.info}>
          {data?.manualAdminApproval
            ? "Manual ON: New admins need master approval."
            : "Auto ON: New admins become active automatically."}
        </Text>
        <Pressable
          style={[styles.primaryBtn, busyAction === "approval-mode" && styles.disabled]}
          disabled={busyAction !== null}
          onPress={() =>
            run("approval-mode", async () => {
              await mobileMasterApi.setApprovalMode(auth, !Boolean(data?.manualAdminApproval));
              setMessage("Approval mode updated");
            })
          }
        >
          <Text style={styles.btnText}>
            {busyAction === "approval-mode"
              ? "Saving..."
              : data?.manualAdminApproval
                ? "Switch to Auto Approval"
                : "Switch to Manual Approval"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Pending Admin Approvals</Text>
        {data?.pendingAdmins.length ? (
          data.pendingAdmins.map((a) => (
            <View style={styles.item} key={a.id}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemTitle}>{a.username}</Text>
                <Text style={styles.itemText}>Status: {a.status}</Text>
                <Text style={styles.itemText}>ID: {a.id}</Text>
              </View>
              <Pressable
                style={[styles.approveBtn, busyAction === `approve-${a.id}` && styles.disabled]}
                disabled={busyAction !== null}
                onPress={() =>
                  run(`approve-${a.id}`, async () => {
                    await mobileMasterApi.adminAction(auth, { adminId: a.id, action: "approve" });
                    setMessage(`Approved ${a.username}`);
                  })
                }
              >
                <Text style={styles.btnText}>Approve</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.info}>No pending admins.</Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>All Admins</Text>
        {data?.admins.length ? (
          data.admins.map((a) => (
            <View style={styles.item} key={a.id}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemTitle}>{a.username}</Text>
                <Text style={styles.itemText}>
                  Status: {a.status}
                  {a.suspendReason ? ` (${a.suspendReason})` : ""}
                </Text>
                <Text style={styles.itemText}>ID: {a.id}</Text>
              </View>
              <View style={styles.itemActions}>
                {a.status === "suspended" ? (
                  <Pressable
                    style={[styles.approveBtn, busyAction === `ad-uns-${a.id}` && styles.disabled]}
                    disabled={busyAction !== null}
                    onPress={() =>
                      run(`ad-uns-${a.id}`, async () => {
                        await mobileMasterApi.adminAction(auth, { adminId: a.id, action: "unsuspend" });
                        setMessage(`Unsuspended ${a.username}`);
                      })
                    }
                  >
                    <Text style={styles.btnText}>Unsuspend</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.warnBtn, busyAction === `ad-sus-${a.id}` && styles.disabled]}
                    disabled={busyAction !== null}
                    onPress={() =>
                      run(`ad-sus-${a.id}`, async () => {
                        await mobileMasterApi.adminAction(auth, {
                          adminId: a.id,
                          action: "suspend",
                          reason: "Suspended from master mobile",
                        });
                        setMessage(`Suspended ${a.username}`);
                      })
                    }
                  >
                    <Text style={styles.btnText}>Suspend</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.deleteBtn, busyAction === `ad-del-${a.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() =>
                    run(`ad-del-${a.id}`, async () => {
                      await mobileMasterApi.adminAction(auth, { adminId: a.id, action: "delete" });
                      setMessage(`Deleted admin ${a.username}`);
                    })
                  }
                >
                  <Text style={styles.btnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.info}>No admins.</Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>All Users</Text>
        {data?.users.length ? (
          data.users.map((u) => (
            <View style={styles.item} key={u.id}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemTitle}>{u.username}</Text>
                <Text style={styles.itemText}>Admin: {u.adminName}</Text>
                <Text style={styles.itemText}>Balance: {u.availableMinutes}m</Text>
                <Text style={styles.itemText}>
                  Motor:{" "}
                  <Text
                    style={
                      u.motorStatus === "RUNNING"
                        ? styles.motorOn
                        : u.motorStatus === "HOLD"
                          ? styles.motorHold
                          : styles.motorOff
                    }
                  >
                    {u.motorStatus === "RUNNING" ? "ON" : u.motorStatus}
                  </Text>
                </Text>
                <Text style={styles.itemText}>Running Time: {u.motorRunningTime ?? 0}m</Text>
                <Text style={styles.itemText}>
                  Status: {u.status}
                  {u.suspendReason ? ` (${u.suspendReason})` : ""}
                </Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  style={[styles.stopBtn, busyAction === `us-stop-${u.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() =>
                    run(`us-stop-${u.id}`, async () => {
                      await mobileMasterApi.userAction(auth, { userId: u.id, action: "stop_reset" });
                      setMessage(`Stopped/reset ${u.username}`);
                    })
                  }
                >
                  <Text style={styles.btnText}>Stop/Reset</Text>
                </Pressable>
                <Pressable
                  style={[styles.startBtn, busyAction === `us-start-${u.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() =>
                    run(`us-start-${u.id}`, async () => {
                      const requestedMinutes = u.motorRunningTime > 0 ? u.motorRunningTime : 5;
                      await mobileMasterApi.userAction(auth, {
                        userId: u.id,
                        action: "start",
                        requestedMinutes,
                      });
                      setMessage(`Start request sent for ${u.username}`);
                    })
                  }
                >
                  <Text style={styles.btnText}>Start Motor</Text>
                </Pressable>
                {u.status === "suspended" ? (
                  <Pressable
                    style={[styles.approveBtn, busyAction === `us-uns-${u.id}` && styles.disabled]}
                    disabled={busyAction !== null}
                    onPress={() =>
                      run(`us-uns-${u.id}`, async () => {
                        await mobileMasterApi.userAction(auth, { userId: u.id, action: "unsuspend" });
                        setMessage(`Unsuspended ${u.username}`);
                      })
                    }
                  >
                    <Text style={styles.btnText}>Unsuspend</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.warnBtn, busyAction === `us-sus-${u.id}` && styles.disabled]}
                    disabled={busyAction !== null}
                    onPress={() =>
                      run(`us-sus-${u.id}`, async () => {
                        await mobileMasterApi.userAction(auth, {
                          userId: u.id,
                          action: "suspend",
                          reason: "Suspended from master mobile",
                        });
                        setMessage(`Suspended ${u.username}`);
                      })
                    }
                  >
                    <Text style={styles.btnText}>Suspend</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.deleteBtn, busyAction === `us-del-${u.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() =>
                    run(`us-del-${u.id}`, async () => {
                      await mobileMasterApi.userAction(auth, { userId: u.id, action: "delete" });
                      setMessage(`Deleted user ${u.username}`);
                    })
                  }
                >
                  <Text style={styles.btnText}>Delete</Text>
                </Pressable>
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

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  center: { justifyContent: "center", alignItems: "center" },
  container: { padding: 16, gap: 12 },
  headerRow: { marginTop: 8, alignItems: "center", gap: 8 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  brand: { color: "#2563eb", fontSize: 12, fontWeight: "700", letterSpacing: 2, textAlign: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a", textAlign: "center" },
  info: { color: "#475569", fontSize: 13, textAlign: "center" },
  error: { color: "#b91c1c", fontSize: 13 },
  success: { color: "#15803d", fontSize: 13 },
  logoutBtn: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 999, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: "#0f172a", fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "48%", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, backgroundColor: "#fff", padding: 10 },
  statTitle: { color: "#64748b", fontSize: 12 },
  statValue: { color: "#0f172a", fontWeight: "700", fontSize: 20, marginTop: 5 },
  panel: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, backgroundColor: "#fff", padding: 12, gap: 10 },
  panelTitle: { color: "#0f172a", fontWeight: "700", fontSize: 16 },
  primaryBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  item: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 10, backgroundColor: "#f8fafc", gap: 8 },
  itemLeft: { gap: 2 },
  itemTitle: { color: "#0f172a", fontWeight: "700" },
  itemText: { color: "#475569", fontSize: 12 },
  motorOn: { color: "#16a34a", fontWeight: "700" },
  motorHold: { color: "#d97706", fontWeight: "700" },
  motorOff: { color: "#64748b", fontWeight: "700" },
  itemActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  startBtn: { backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12 },
  stopBtn: { backgroundColor: "#0f172a", borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12 },
  approveBtn: { backgroundColor: "#16a34a", borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12 },
  warnBtn: { backgroundColor: "#d97706", borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12 },
  deleteBtn: { backgroundColor: "#dc2626", borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  disabled: { opacity: 0.6 },
});
