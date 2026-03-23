import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { MasterDashboardData, mobileMasterApi } from "../services/mobileMasterApi";
import { AppFooter } from "../components/AppFooter";
import { ChangePasswordCard } from "../components/ChangePasswordCard";
import { EmptyStateCard } from "../components/EmptyStateCard";
import { useAdaptivePolling } from "../hooks/useAdaptivePolling";
import { MasterAdminsSection } from "../components/master/MasterAdminsSection";
import { MasterPendingAdminsSection } from "../components/master/MasterPendingAdminsSection";
import { MasterUsersSection } from "../components/master/MasterUsersSection";
import { ScreenStateNotice } from "../components/ScreenStateNotice";

export function MasterScreen() {
  const auth = useAuth();
  const [data, setData] = useState<MasterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [rfidUserId, setRfidUserId] = useState("");
  const [rfidUid, setRfidUid] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminStatus, setNewAdminStatus] = useState<"pending" | "active">("pending");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserAdminId, setNewUserAdminId] = useState("");
  const [minutesUserId, setMinutesUserId] = useState("");
  const [minutesValue, setMinutesValue] = useState("10");
  const [confirmActionKey, setConfirmActionKey] = useState<string | null>(null);

  const load = useCallback(async (mode: "initial" | "manual" | "silent" = "initial") => {
    if (mode === "manual") setRefreshing(true);
    else if (mode === "initial") setLoading(true);
    if (mode !== "silent") setError(null);
    try {
      const dashboard = await mobileMasterApi.dashboard(auth);
      setData(dashboard);
      if (!newUserAdminId && dashboard.admins.length > 0) {
        const firstActiveAdmin = dashboard.admins.find((admin) => admin.status === "active");
        if (firstActiveAdmin) setNewUserAdminId(firstActiveAdmin.id);
      }
      if (!minutesUserId && dashboard.users.length > 0) {
        setMinutesUserId(dashboard.users[0].id);
      }
      if (!rfidUserId && dashboard.users.length > 0) {
        setRfidUserId(dashboard.users[0].id);
      }
      return true;
    } catch (err: any) {
      if (mode !== "silent") {
        setError(err?.message || "Failed to load master dashboard");
      }
      return false;
    } finally {
      if (mode === "manual") setRefreshing(false);
      else if (mode === "initial") setLoading(false);
    }
  }, [auth, minutesUserId, newUserAdminId, rfidUserId]);

  useAdaptivePolling({
    baseIntervalMs: 7000,
    errorIntervalMs: 12000,
    onPoll: () => load(data ? "silent" : "initial"),
  });

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusyAction(key);
    setConfirmActionKey(null);
    setError(null);
    setMessage(null);
    try {
      await fn();
      await load("silent");
    } catch (err: any) {
      setError(err?.message || "Action failed");
    } finally {
      setBusyAction(null);
    }
  };

  const requireConfirm = (key: string, nextMessage: string) => {
    if (confirmActionKey !== key) {
      setConfirmActionKey(key);
      setMessage(nextMessage);
      return false;
    }
    return true;
  };

  if (loading && !data) {
    return (
      <View style={[styles.page, styles.center]}>
        <View style={styles.initialState}>
          <ScreenStateNotice
            title="Loading master dashboard"
            message="We are syncing admins, users, approvals, and system state."
            variant="info"
          />
        </View>
      </View>
    );
  }

  if (!loading && !data) {
    return (
      <View style={[styles.page, styles.center]}>
        <View style={styles.initialState}>
          <ScreenStateNotice
            title="Dashboard unavailable"
            message={error || "We could not load the master dashboard."}
            variant="error"
            actionLabel="Retry"
            onAction={() => load("initial")}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("manual")} />}
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

      {error ? (
        <ScreenStateNotice
          title="Action failed"
          message={error}
          variant="error"
          actionLabel="Retry"
          onAction={() => load("manual")}
        />
      ) : null}
      {message ? <ScreenStateNotice message={message} variant="success" /> : null}

      <View style={styles.statsGrid}>
        <StatCard title="Admins" value={String(data?.overview.adminCount ?? 0)} />
        <StatCard title="Users" value={String(data?.overview.userCount ?? 0)} />
        <StatCard title="Running" value={String(data?.overview.running ?? 0)} />
        <StatCard title="Waiting" value={String(data?.overview.waiting ?? 0)} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Create Admin</Text>
        <TextInput
          style={styles.input}
          value={newAdminUsername}
          onChangeText={setNewAdminUsername}
          autoCapitalize="none"
          placeholder="Admin username"
        />
        <TextInput
          style={styles.input}
          value={newAdminPassword}
          onChangeText={setNewAdminPassword}
          secureTextEntry
          placeholder="Admin password"
        />
        <View style={styles.optionRow}>
          <Pressable
            style={[styles.userChip, newAdminStatus === "pending" && styles.userChipActive]}
            onPress={() => setNewAdminStatus("pending")}
          >
            <Text style={[styles.userChipText, newAdminStatus === "pending" && styles.userChipTextActive]}>
              Pending
            </Text>
          </Pressable>
          <Pressable
            style={[styles.userChip, newAdminStatus === "active" && styles.userChipActive]}
            onPress={() => setNewAdminStatus("active")}
          >
            <Text style={[styles.userChipText, newAdminStatus === "active" && styles.userChipTextActive]}>
              Active
            </Text>
          </Pressable>
        </View>
        <Pressable
          style={[styles.primaryBtn, busyAction === "create-admin" && styles.disabled]}
          disabled={busyAction !== null}
          onPress={() =>
            run("create-admin", async () => {
              const username = newAdminUsername.trim();
              if (!username) throw new Error("Admin username is required");
              if (newAdminPassword.length < 6) throw new Error("Admin password must be at least 6 characters");
              await mobileMasterApi.createAdmin(auth, {
                username,
                password: newAdminPassword,
                status: newAdminStatus,
              });
              setNewAdminUsername("");
              setNewAdminPassword("");
              setMessage(`Admin ${username} created`);
            })
          }
        >
          <Text style={styles.btnText}>
            {busyAction === "create-admin" ? "Creating..." : "Create Admin"}
          </Text>
        </Pressable>
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
            requireConfirm(
              "approval-mode",
              data?.manualAdminApproval
                ? "Press again to switch to auto approval"
                : "Press again to switch to manual approval",
            ) &&
            run("approval-mode", async () => {
              await mobileMasterApi.setApprovalMode(auth, !Boolean(data?.manualAdminApproval));
              setMessage("Approval mode updated");
            })
          }
        >
          <Text style={styles.btnText}>
            {busyAction === "approval-mode"
              ? "Saving..."
              : confirmActionKey === "approval-mode"
                ? "Confirm Change"
                : data?.manualAdminApproval
                  ? "Switch to Auto Approval"
                  : "Switch to Manual Approval"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Create User</Text>
        <Text style={styles.info}>Select Active Admin</Text>
        <View style={styles.userList}>
          {data?.admins.filter((admin) => admin.status === "active").length ? (
            data.admins
              .filter((admin) => admin.status === "active")
              .map((admin) => (
                <Pressable
                  key={admin.id}
                  style={[styles.userChip, newUserAdminId === admin.id && styles.userChipActive]}
                  onPress={() => setNewUserAdminId(admin.id)}
                >
                  <Text style={[styles.userChipText, newUserAdminId === admin.id && styles.userChipTextActive]}>
                    {admin.username}
                  </Text>
                </Pressable>
              ))
          ) : (
            <EmptyStateCard title="No active admins" message="Activate an admin before creating users under that tenant." />
          )}
        </View>
        <TextInput
          style={styles.input}
          value={newUserUsername}
          onChangeText={setNewUserUsername}
          autoCapitalize="none"
          placeholder="User username"
        />
        <TextInput
          style={styles.input}
          value={newUserPassword}
          onChangeText={setNewUserPassword}
          secureTextEntry
          placeholder="User password"
        />
        <Pressable
          style={[styles.primaryBtn, busyAction === "create-user" && styles.disabled]}
          disabled={busyAction !== null}
          onPress={() =>
            run("create-user", async () => {
              const username = newUserUsername.trim();
              if (!newUserAdminId) throw new Error("Select an active admin");
              if (!username) throw new Error("User username is required");
              if (newUserPassword.length < 6) throw new Error("User password must be at least 6 characters");
              await mobileMasterApi.createUser(auth, {
                username,
                password: newUserPassword,
                adminId: newUserAdminId,
              });
              setNewUserUsername("");
              setNewUserPassword("");
              setMessage(`User ${username} created`);
            })
          }
        >
          <Text style={styles.btnText}>
            {busyAction === "create-user" ? "Creating..." : "Create User"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Balance Management</Text>
        <Text style={styles.info}>Select User</Text>
        <View style={styles.userList}>
          {data?.users.length ? (
            data.users.map((user) => (
              <Pressable
                key={user.id}
                style={[styles.userChip, minutesUserId === user.id && styles.userChipActive]}
                onPress={() => setMinutesUserId(user.id)}
              >
                <Text style={[styles.userChipText, minutesUserId === user.id && styles.userChipTextActive]}>
                  {user.username}
                </Text>
              </Pressable>
            ))
          ) : (
            <EmptyStateCard title="No users available" message="Create a user before adjusting balances from mobile." />
          )}
        </View>
        <TextInput
          style={styles.input}
          value={minutesValue}
          onChangeText={setMinutesValue}
          keyboardType="numeric"
          placeholder="Minutes"
        />
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.primaryBtn, busyAction === "recharge-minutes" && styles.disabled]}
            disabled={busyAction !== null}
            onPress={() =>
              run("recharge-minutes", async () => {
                const minutes = Number(minutesValue);
                if (!minutesUserId) throw new Error("Select a user");
                if (!Number.isFinite(minutes) || minutes <= 0) {
                  throw new Error("Recharge minutes must be greater than 0");
                }
                await mobileMasterApi.updateUserMinutes(auth, {
                  userId: minutesUserId,
                  minutes,
                  action: "recharge",
                });
                setMessage("User balance recharged");
              })
            }
          >
            <Text style={styles.btnText}>
              {busyAction === "recharge-minutes" ? "Recharging..." : "Recharge Minutes"}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, busyAction === "set-minutes" && styles.disabled]}
            disabled={busyAction !== null}
            onPress={() =>
              run("set-minutes", async () => {
                const minutes = Number(minutesValue);
                if (!minutesUserId) throw new Error("Select a user");
                if (!Number.isFinite(minutes) || minutes < 0) {
                  throw new Error("Set minutes must be 0 or greater");
                }
                await mobileMasterApi.updateUserMinutes(auth, {
                  userId: minutesUserId,
                  minutes,
                  action: "set",
                });
                setMessage("User balance updated");
              })
            }
          >
            <Text style={styles.secondaryBtnText}>
              {busyAction === "set-minutes" ? "Saving..." : "Set Balance"}
            </Text>
          </Pressable>
        </View>
      </View>

      <MasterPendingAdminsSection
        admins={data?.pendingAdmins ?? []}
        busyAction={busyAction}
        styles={styles}
        onApprove={(adminId, username) =>
          run(`approve-${adminId}`, async () => {
            await mobileMasterApi.adminAction(auth, { adminId, action: "approve" });
            setMessage(`Approved ${username}`);
          })
        }
      />

      <MasterAdminsSection
        admins={data?.admins ?? []}
        busyAction={busyAction}
        confirmActionKey={confirmActionKey}
        styles={styles}
        onUnsuspend={(admin) =>
          run(`ad-uns-${admin.id}`, async () => {
            await mobileMasterApi.adminAction(auth, { adminId: admin.id, action: "unsuspend" });
            setMessage(`Unsuspended ${admin.username}`);
          })
        }
        onSuspend={(admin) =>
          requireConfirm(`ad-sus-${admin.id}`, `Press Suspend again to suspend ${admin.username}`) &&
          run(`ad-sus-${admin.id}`, async () => {
            await mobileMasterApi.adminAction(auth, {
              adminId: admin.id,
              action: "suspend",
              reason: "Suspended from master mobile",
            });
            setMessage(`Suspended ${admin.username}`);
          })
        }
        onDelete={(admin) =>
          requireConfirm(`ad-del-${admin.id}`, `Press Delete again to remove admin ${admin.username}`) &&
          run(`ad-del-${admin.id}`, async () => {
            await mobileMasterApi.adminAction(auth, { adminId: admin.id, action: "delete" });
            setMessage(`Deleted admin ${admin.username}`);
          })
        }
      />

      <MasterUsersSection
        users={data?.users ?? []}
        busyAction={busyAction}
        confirmActionKey={confirmActionKey}
        styles={styles}
        onStopReset={(user) =>
          requireConfirm(`us-stop-${user.id}`, `Press Stop/Reset again to reset ${user.username}`) &&
          run(`us-stop-${user.id}`, async () => {
            await mobileMasterApi.userAction(auth, { userId: user.id, action: "stop_reset" });
            setMessage(`Stopped/reset ${user.username}`);
          })
        }
        onStart={(user) =>
          run(`us-start-${user.id}`, async () => {
            const requestedMinutes = user.motorRunningTime > 0 ? user.motorRunningTime : 5;
            await mobileMasterApi.userAction(auth, {
              userId: user.id,
              action: "start",
              requestedMinutes,
            });
            setMessage(`Start request sent for ${user.username}`);
          })
        }
        onUnsuspend={(user) =>
          run(`us-uns-${user.id}`, async () => {
            await mobileMasterApi.userAction(auth, { userId: user.id, action: "unsuspend" });
            setMessage(`Unsuspended ${user.username}`);
          })
        }
        onSuspend={(user) =>
          requireConfirm(`us-sus-${user.id}`, `Press Suspend again to suspend ${user.username}`) &&
          run(`us-sus-${user.id}`, async () => {
            await mobileMasterApi.userAction(auth, {
              userId: user.id,
              action: "suspend",
              reason: "Suspended from master mobile",
            });
            setMessage(`Suspended ${user.username}`);
          })
        }
        onDelete={(user) =>
          requireConfirm(`us-del-${user.id}`, `Press Delete again to remove ${user.username}`) &&
          run(`us-del-${user.id}`, async () => {
            await mobileMasterApi.userAction(auth, { userId: user.id, action: "delete" });
            setMessage(`Deleted user ${user.username}`);
          })
        }
      />

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>RFID Card Registration</Text>
        <Text style={styles.info}>Select User</Text>
        <View style={styles.userList}>
          {data?.users.length ? (
            data.users.map((user) => (
              <Pressable
                key={user.id}
                style={[styles.userChip, rfidUserId === user.id && styles.userChipActive]}
                onPress={() => {
                  setRfidUserId(user.id);
                  setRfidUid(user.rfidUid ?? "");
                }}
              >
                <Text style={[styles.userChipText, rfidUserId === user.id && styles.userChipTextActive]}>
                  {user.username}
                </Text>
              </Pressable>
            ))
          ) : (
            <EmptyStateCard title="No users available" message="Create a user before assigning or clearing RFID cards." />
          )}
        </View>
        <TextInput
          style={styles.input}
          value={rfidUid}
          onChangeText={(text) => setRfidUid(text.toUpperCase())}
          autoCapitalize="characters"
          placeholder="RFID UID (UPPERCASE)"
        />
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.primaryBtn, busyAction === "rfid-assign" && styles.disabled]}
            disabled={busyAction !== null}
            onPress={() =>
              run("rfid-assign", async () => {
                if (!rfidUserId) throw new Error("User ID is required");
                const uid = rfidUid.trim();
                if (!uid) throw new Error("RFID UID is required");
                const res = await mobileMasterApi.assignRfid(auth, rfidUserId, uid);
                setRfidUid(res.rfidUid ?? uid);
                setMessage("RFID assigned");
              })
            }
          >
            <Text style={styles.btnText}>
              {busyAction === "rfid-assign" ? "Assigning..." : "Assign"}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, busyAction === "rfid-clear" && styles.disabled]}
            disabled={busyAction !== null}
            onPress={() =>
              run("rfid-clear", async () => {
                if (!rfidUserId) throw new Error("User ID is required");
                await mobileMasterApi.assignRfid(auth, rfidUserId, null);
                setRfidUid("");
                setMessage("RFID cleared");
              })
            }
          >
            <Text style={styles.secondaryBtnText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      {showChangePassword ? (
        <ChangePasswordCard
          onSubmit={async (currentPassword, newPassword) => {
            await auth.authorizedRequest("/api/mobile/auth/change-password", {
              method: "POST",
              body: JSON.stringify({ currentPassword, newPassword }),
            });
            await auth.logout();
          }}
        />
      ) : null}
      <AppFooter
        actionLabel={showChangePassword ? "Hide Change Password" : "Change Password"}
        onActionPress={() => setShowChangePassword((value) => !value)}
      />
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
  initialState: { width: "100%", maxWidth: 420, paddingHorizontal: 16 },
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
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  userList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  userChip: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  userChipActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  userChipText: { color: "#334155", fontWeight: "600", fontSize: 12 },
  userChipTextActive: { color: "#1d4ed8" },
  item: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 10, backgroundColor: "#f8fafc", gap: 8 },
  itemLeft: { gap: 2 },
  itemTitle: { color: "#0f172a", fontWeight: "700" },
  itemText: { color: "#475569", fontSize: 12 },
  greenText: { color: "#16a34a", fontWeight: "700" },
  redText: { color: "#dc2626", fontWeight: "700" },
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
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  secondaryBtnText: { color: "#0f172a", fontWeight: "700", fontSize: 12 },
  disabled: { opacity: 0.6 },
});
