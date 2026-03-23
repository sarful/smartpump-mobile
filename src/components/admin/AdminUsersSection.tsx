import React from "react";
import { Pressable, Text, View } from "react-native";
import { EmptyStateCard } from "../EmptyStateCard";
import { AdminDashboard } from "../../services/mobileAdminApi";

type StylesMap = Record<string, any>;
type AdminUser = AdminDashboard["users"][number];

type Props = {
  users: AdminDashboard["users"];
  busyAction: string | null;
  deleteConfirmUserId: string | null;
  confirmActionKey: string | null;
  styles: StylesMap;
  adminStatus: string;
  displayLoadShedding: boolean;
  displayInternetOnline: boolean;
  deviceReady: boolean;
  onStart: (user: AdminUser) => void;
  onStopReset: (user: AdminUser) => void;
  onUnsuspend: (user: AdminUser) => void;
  onSuspend: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
};

export function AdminUsersSection({
  users,
  busyAction,
  deleteConfirmUserId,
  confirmActionKey,
  styles,
  adminStatus,
  displayLoadShedding,
  displayInternetOnline,
  deviceReady,
  onStart,
  onStopReset,
  onUnsuspend,
  onSuspend,
  onDelete,
}: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Users</Text>
      {users.length ? (
        users.map((user) => (
          <View style={styles.item} key={user.id}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemTitle}>
                {user.username} ({user.motorStatus})
              </Text>
              <Text style={styles.itemText}>Balance: {user.availableMinutes}m</Text>
              <Text style={styles.itemText}>Remaining Minutes: {user.motorRunningTime ?? 0}m</Text>
              <Text style={styles.itemText}>RFID: {user.rfidUid ? user.rfidUid : "-"}</Text>
              <Text style={styles.itemText}>Use: {user.useSource ? user.useSource : "-"}</Text>
              <Text style={styles.itemText}>
                Status: {user.status}
                {user.suspendReason ? ` (${user.suspendReason})` : ""}
              </Text>
              <Text style={styles.itemText}>User ID: {user.id}</Text>
            </View>
            <View style={styles.itemActions}>
              <Pressable
                style={[styles.startBtn, busyAction === `start-${user.id}` && styles.disabled]}
                disabled={
                  busyAction !== null ||
                  adminStatus !== "active" ||
                  displayLoadShedding ||
                  deviceReady !== true ||
                  displayInternetOnline !== true ||
                  user.status === "suspended"
                }
                onPress={() => onStart(user)}
              >
                <Text style={styles.btnText}>Start Motor</Text>
              </Pressable>
              <Pressable
                style={[styles.stopBtn, busyAction === `stop-${user.id}` && styles.disabled]}
                disabled={busyAction !== null}
                onPress={() => onStopReset(user)}
              >
                <Text style={styles.btnText}>
                  {confirmActionKey === `stop-${user.id}` ? "Confirm Stop/Reset" : "Stop/Reset"}
                </Text>
              </Pressable>

              {user.status === "suspended" ? (
                <Pressable
                  style={[styles.approveBtn, busyAction === `uns-${user.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() => onUnsuspend(user)}
                >
                  <Text style={styles.btnText}>Unsuspend</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.warnBtn, busyAction === `sus-${user.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() => onSuspend(user)}
                >
                  <Text style={styles.btnText}>
                    {confirmActionKey === `sus-${user.id}` ? "Confirm Suspend" : "Suspend"}
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={[
                  deleteConfirmUserId === user.id ? styles.deleteBtn : styles.secondaryBtn,
                  busyAction === `delete-${user.id}` && styles.disabled,
                ]}
                disabled={busyAction !== null}
                onPress={() => onDelete(user)}
              >
                <Text style={deleteConfirmUserId === user.id ? styles.btnText : styles.secondaryBtnText}>
                  {busyAction === `delete-${user.id}`
                    ? "Deleting..."
                    : deleteConfirmUserId === user.id
                      ? "Confirm Delete"
                      : "Delete"}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <EmptyStateCard
          title="No users available"
          message="Create a user to start seeing tenant motor status and quick actions."
        />
      )}
    </View>
  );
}
