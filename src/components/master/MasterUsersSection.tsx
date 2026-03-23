import React from "react";
import { Pressable, Text, View } from "react-native";
import { EmptyStateCard } from "../EmptyStateCard";
import { MasterDashboardData } from "../../services/mobileMasterApi";

type StylesMap = Record<string, any>;
type MasterUser = MasterDashboardData["users"][number];

type Props = {
  users: MasterDashboardData["users"];
  busyAction: string | null;
  confirmActionKey: string | null;
  styles: StylesMap;
  onStopReset: (user: MasterUser) => void;
  onStart: (user: MasterUser) => void;
  onUnsuspend: (user: MasterUser) => void;
  onSuspend: (user: MasterUser) => void;
  onDelete: (user: MasterUser) => void;
};

export function MasterUsersSection({
  users,
  busyAction,
  confirmActionKey,
  styles,
  onStopReset,
  onStart,
  onUnsuspend,
  onSuspend,
  onDelete,
}: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>All Users</Text>
      {users.length ? (
        users.map((user) => (
          <View style={styles.item} key={user.id}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemTitle}>{user.username}</Text>
              <Text style={styles.itemText}>Admin: {user.adminName}</Text>
              <Text style={styles.itemText}>RFID: {user.rfidUid ? user.rfidUid : "-"}</Text>
              <Text style={styles.itemText}>Balance: {user.availableMinutes}m</Text>
              <Text style={styles.itemText}>
                Motor:{" "}
                <Text
                  style={
                    user.motorStatus === "RUNNING"
                      ? styles.motorOn
                      : user.motorStatus === "HOLD"
                        ? styles.motorHold
                        : styles.motorOff
                  }
                >
                  {user.motorStatus === "RUNNING" ? "ON" : user.motorStatus}
                </Text>
              </Text>
              <Text style={styles.itemText}>Remaining Minutes: {user.motorRunningTime ?? 0}m</Text>
              <Text style={styles.itemText}>Use: {user.useSource ? user.useSource : "-"}</Text>
              <Text style={styles.itemText}>
                Status: {user.status}
                {user.suspendReason ? ` (${user.suspendReason})` : ""}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <Pressable
                style={[styles.stopBtn, busyAction === `us-stop-${user.id}` && styles.disabled]}
                disabled={busyAction !== null}
                onPress={() => onStopReset(user)}
              >
                <Text style={styles.btnText}>
                  {confirmActionKey === `us-stop-${user.id}` ? "Confirm Stop/Reset" : "Stop/Reset"}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.startBtn, busyAction === `us-start-${user.id}` && styles.disabled]}
                disabled={busyAction !== null}
                onPress={() => onStart(user)}
              >
                <Text style={styles.btnText}>Start Motor</Text>
              </Pressable>
              {user.status === "suspended" ? (
                <Pressable
                  style={[styles.approveBtn, busyAction === `us-uns-${user.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() => onUnsuspend(user)}
                >
                  <Text style={styles.btnText}>Unsuspend</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.warnBtn, busyAction === `us-sus-${user.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() => onSuspend(user)}
                >
                  <Text style={styles.btnText}>
                    {confirmActionKey === `us-sus-${user.id}` ? "Confirm Suspend" : "Suspend"}
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.deleteBtn, busyAction === `us-del-${user.id}` && styles.disabled]}
                disabled={busyAction !== null}
                onPress={() => onDelete(user)}
              >
                <Text style={styles.btnText}>
                  {confirmActionKey === `us-del-${user.id}` ? "Confirm Delete" : "Delete"}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <EmptyStateCard
          title="No users available"
          message="Create a user to manage motor actions, suspend status, and deletion."
        />
      )}
    </View>
  );
}
