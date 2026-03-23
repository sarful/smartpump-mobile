import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppFooter } from "../components/AppFooter";
import { AdminPendingRequestsSection } from "../components/admin/AdminPendingRequestsSection";
import { AdminUsersSection } from "../components/admin/AdminUsersSection";
import { ChangePasswordCard } from "../components/ChangePasswordCard";
import { EmptyStateCard } from "../components/EmptyStateCard";
import { useAdaptivePolling } from "../hooks/useAdaptivePolling";
import { ScreenStateNotice } from "../components/ScreenStateNotice";
import { useAuth } from "../context/AuthContext";
import { AdminDashboard, mobileAdminApi } from "../services/mobileAdminApi";

export function AdminScreen() {
  const auth = useAuth();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [rechargeUserId, setRechargeUserId] = useState("");
  const [rechargeMinutes, setRechargeMinutes] = useState("10");
  const [rfidUserId, setRfidUserId] = useState("");
  const [rfidUid, setRfidUid] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
  const [confirmActionKey, setConfirmActionKey] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "manual" | "silent" = "initial") => {
      if (mode === "manual") setRefreshing(true);
      else if (mode === "initial") setLoading(true);
      if (mode !== "silent") setError(null);
      try {
        const dashboard = await mobileAdminApi.dashboard(auth);
        setData(dashboard);
        if (!rechargeUserId && dashboard.users.length > 0) {
          setRechargeUserId(dashboard.users[0].id);
        }
        if (!rfidUserId && dashboard.users.length > 0) {
          setRfidUserId(dashboard.users[0].id);
        }
        return true;
      } catch (err: any) {
        if (mode !== "silent") {
          setError(err?.message || "Failed to load admin dashboard");
        }
        return false;
      } finally {
        if (mode === "manual") setRefreshing(false);
        else if (mode === "initial") setLoading(false);
      }
    },
    [auth, rechargeUserId],
  );

  useAdaptivePolling({
    baseIntervalMs: 5000,
    errorIntervalMs: 10000,
    onPoll: () => load(data ? "silent" : "initial"),
  });

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusyAction(key);
    setConfirmActionKey(null);
    setDeleteConfirmUserId(null);
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

  const requireConfirm = (key: string, message: string) => {
    if (confirmActionKey !== key) {
      setConfirmActionKey(key);
      setMessage(message);
      return false;
    }
    return true;
  };

  if (loading && !data) {
    return (
      <View style={[styles.page, styles.center]}>
        <View style={styles.initialState}>
          <ScreenStateNotice
            title="Loading admin dashboard"
            message="We are syncing your users, requests, and device status."
            variant="info"
          />
        </View>
      </View>
    );
  }

  if (!loading && !data) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={[styles.page, styles.center]}>
          <View style={styles.initialState}>
            <ScreenStateNotice
              title="Dashboard unavailable"
              message={error || "We could not load your admin dashboard."}
              variant="error"
              actionLabel="Retry"
              onAction={() => load("initial")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const displayLoadShedding =
    Boolean(data?.admin.loadShedding) || data?.admin.deviceReady === false;
  const displayInternetOnline =
    Boolean(data?.admin.deviceReady) && (data?.admin.deviceOnline ?? true);

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load("manual")} />
        }
      >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>PUMPPILOT</Text>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.info}>Admin: {data?.admin.username || "-"}</Text>
          <Text style={styles.info}>
            Status: {data?.admin.status || "active"}
          </Text>
          <Text style={styles.info}>
            Users: {data?.users.length ?? 0} | Pending:{" "}
            {data?.pendingRequests.length ?? 0}
          </Text>
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

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>System Readiness</Text>
        <Text style={styles.itemText}>
          Device:{" "}
          <Text style={data?.admin.deviceReady ? styles.greenText : styles.redText}>
            {data?.admin.deviceReady ? "Ready" : "Not Ready"}
          </Text>
        </Text>
        <Text style={styles.itemText}>
          Loadshedding:{" "}
          <Text style={displayLoadShedding ? styles.redText : styles.greenText}>
            {displayLoadShedding ? "Yes" : "No"}
          </Text>
        </Text>
        <Text style={styles.itemText}>
          Internet:{" "}
          <Text style={displayInternetOnline ? styles.greenText : styles.redText}>
            {displayInternetOnline ? "Online" : "Offline"}
          </Text>
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Create User</Text>
        <TextInput
          style={styles.input}
          value={newUsername}
          onChangeText={setNewUsername}
          autoCapitalize="none"
          placeholder="New username"
        />
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="Temporary password"
        />
        <Pressable
          style={[styles.primaryBtn, busyAction === "create-user" && styles.disabled]}
          disabled={busyAction !== null}
          onPress={() =>
            run("create-user", async () => {
              const username = newUsername.trim();
              const password = newPassword;
              if (!username) throw new Error("Username is required");
              if (password.length < 6) throw new Error("Password must be at least 6 characters");
              await mobileAdminApi.createUser(auth, username, password);
              setNewUsername("");
              setNewPassword("");
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
        <Text style={styles.panelTitle}>Recharge Minutes</Text>
        <Text style={styles.info}>Select User</Text>
        <View style={styles.userList}>
          {data?.users.length ? (
            data.users.map((u) => (
              <Pressable
                key={u.id}
                style={[
                  styles.userChip,
                  rechargeUserId === u.id && styles.userChipActive,
                ]}
                onPress={() => setRechargeUserId(u.id)}
              >
                <Text
                  style={[
                    styles.userChipText,
                    rechargeUserId === u.id && styles.userChipTextActive,
                  ]}
                >
                  {u.username}
                </Text>
              </Pressable>
            ))
          ) : (
            <EmptyStateCard title="No users yet" message="Create your first tenant user to enable recharge, RFID, and motor actions." />
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
          style={[
            styles.primaryBtn,
            busyAction === "recharge" && styles.disabled,
          ]}
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
          <Text style={styles.btnText}>
            {busyAction === "recharge" ? "Processing..." : "Recharge"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>RFID Card Registration</Text>
        <Text style={styles.info}>Select User</Text>
        <View style={styles.userList}>
          {data?.users.length ? (
            data.users.map((u) => (
              <Pressable
                key={u.id}
                style={[
                  styles.userChip,
                  rfidUserId === u.id && styles.userChipActive,
                ]}
                onPress={() => {
                  setRfidUserId(u.id);
                  setRfidUid(u.rfidUid ?? "");
                }}
              >
                <Text
                  style={[
                    styles.userChipText,
                    rfidUserId === u.id && styles.userChipTextActive,
                  ]}
                >
                  {u.username}
                </Text>
              </Pressable>
            ))
          ) : (
            <EmptyStateCard title="No users yet" message="Add a user before assigning or clearing RFID cards." />
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
            style={[
              styles.primaryBtn,
              busyAction === "rfid-assign" && styles.disabled,
            ]}
            disabled={busyAction !== null}
            onPress={() =>
              run("rfid-assign", async () => {
                if (!rfidUserId) throw new Error("User ID is required");
                const uid = rfidUid.trim();
                if (!uid) throw new Error("RFID UID is required");
                const res = await mobileAdminApi.assignRfid(auth, rfidUserId, uid);
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
            style={[
              styles.secondaryBtn,
              busyAction === "rfid-clear" && styles.disabled,
            ]}
            disabled={busyAction !== null}
            onPress={() =>
              run("rfid-clear", async () => {
                if (!rfidUserId) throw new Error("User ID is required");
                await mobileAdminApi.assignRfid(auth, rfidUserId, null);
                setRfidUid("");
                setMessage("RFID cleared");
              })
            }
          >
            <Text style={styles.secondaryBtnText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <AdminPendingRequestsSection
        requests={data?.pendingRequests ?? []}
        busyAction={busyAction}
        styles={styles}
        onApprove={(requestId) =>
          run(`approve-${requestId}`, async () => {
            await mobileAdminApi.approveRequest(auth, requestId);
            setMessage("Request approved");
          })
        }
        onDecline={(requestId) =>
          run(`decline-${requestId}`, async () => {
            await mobileAdminApi.declineRequest(auth, requestId);
            setMessage("Request declined");
          })
        }
      />

      <AdminUsersSection
        users={data?.users ?? []}
        busyAction={busyAction}
        deleteConfirmUserId={deleteConfirmUserId}
        confirmActionKey={confirmActionKey}
        styles={styles}
        adminStatus={data?.admin.status ?? "active"}
        displayLoadShedding={displayLoadShedding}
        displayInternetOnline={displayInternetOnline}
        deviceReady={data?.admin.deviceReady === true}
        onStart={(user) =>
          run(`start-${user.id}`, async () => {
            if (data?.admin.status !== "active") throw new Error("Admin is suspended");
            if (displayLoadShedding) throw new Error("Load shedding active now");
            if (!data?.admin.deviceReady) throw new Error("Device is not ready");
            if (!displayInternetOnline) throw new Error("Internet is offline");
            if (user.status === "suspended") throw new Error("User is suspended");
            const requestedMinutes = user.motorRunningTime > 0 ? user.motorRunningTime : 5;
            const result = await mobileAdminApi.startUser(auth, user.id, requestedMinutes);
            setMessage(
              result.status === "WAITING"
                ? `${user.username} queued at #${result.queuePosition ?? "-"}`
                : `${user.username} motor started`,
            );
          })
        }
        onStopReset={(user) =>
          requireConfirm(`stop-${user.id}`, `Press Stop/Reset again to reset ${user.username}`) &&
          run(`stop-${user.id}`, async () => {
            await mobileAdminApi.stopReset(auth, user.id);
            setMessage("User motor stopped/reset");
          })
        }
        onUnsuspend={(user) =>
          run(`uns-${user.id}`, async () => {
            await mobileAdminApi.unsuspendUser(auth, user.id);
            setMessage("User unsuspended");
          })
        }
        onSuspend={(user) =>
          requireConfirm(`sus-${user.id}`, `Press Suspend again to suspend ${user.username}`) &&
          run(`sus-${user.id}`, async () => {
            await mobileAdminApi.suspendUser(auth, user.id, "Suspended from mobile admin");
            setMessage("User suspended");
          })
        }
        onDelete={(user) => {
          if (deleteConfirmUserId !== user.id) {
            setDeleteConfirmUserId(user.id);
            setMessage(`Press delete again to remove ${user.username}`);
            return;
          }
          run(`delete-${user.id}`, async () => {
            await mobileAdminApi.deleteUser(auth, user.id);
            setDeleteConfirmUserId(null);
            setMessage(`Deleted ${user.username}`);
          });
        }}
      />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  center: { justifyContent: "center", alignItems: "center" },
  container: { padding: 16, gap: 12 },
  initialState: { width: "100%", maxWidth: 420, paddingHorizontal: 16 },
  headerRow: { marginTop: 8, alignItems: "center", gap: 8 },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  info: { color: "#475569", fontSize: 13, textAlign: "center" },
  error: { color: "#b91c1c", fontSize: 13 },
  success: { color: "#15803d", fontSize: 13 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: { color: "#0f172a", fontWeight: "700" },
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
  item: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f8fafc",
    gap: 8,
  },
  itemLeft: { gap: 2 },
  itemTitle: { color: "#0f172a", fontWeight: "700" },
  itemText: { color: "#475569", fontSize: 12 },
  greenText: { color: "#16a34a", fontWeight: "700" },
  redText: { color: "#dc2626", fontWeight: "700" },
  itemActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  primaryBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
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
  approveBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  declineBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  warnBtn: {
    backgroundColor: "#d97706",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  startBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  stopBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  deleteBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  disabled: { opacity: 0.6 },
});
