import React from "react";
import { Pressable, Text, View } from "react-native";
import { EmptyStateCard } from "../EmptyStateCard";
import { MasterDashboardData } from "../../services/mobileMasterApi";

type StylesMap = Record<string, any>;
type MasterAdmin = MasterDashboardData["admins"][number];

type Props = {
  admins: MasterDashboardData["admins"];
  busyAction: string | null;
  confirmActionKey: string | null;
  styles: StylesMap;
  onUnsuspend: (admin: MasterAdmin) => void;
  onSuspend: (admin: MasterAdmin) => void;
  onDelete: (admin: MasterAdmin) => void;
};

export function MasterAdminsSection({
  admins,
  busyAction,
  confirmActionKey,
  styles,
  onUnsuspend,
  onSuspend,
  onDelete,
}: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>All Admins</Text>
      {admins.length ? (
        admins.map((admin) => (
          <View style={styles.item} key={admin.id}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemTitle}>{admin.username}</Text>
              <Text style={styles.itemText}>
                Status: {admin.status}
                {admin.suspendReason ? ` (${admin.suspendReason})` : ""}
              </Text>
              <Text style={styles.itemText}>
                Device:{" "}
                <Text style={admin.deviceReady ? styles.greenText : styles.redText}>
                  {admin.deviceReady ? "Ready" : "Not Ready"}
                </Text>
              </Text>
              <Text style={styles.itemText}>
                Loadshedding:{" "}
                <Text style={admin.loadShedding || !admin.deviceReady ? styles.redText : styles.greenText}>
                  {admin.loadShedding || !admin.deviceReady ? "Yes" : "No"}
                </Text>
              </Text>
              <Text style={styles.itemText}>
                Internet:{" "}
                <Text style={admin.deviceReady && (admin.deviceOnline ?? true) ? styles.greenText : styles.redText}>
                  {admin.deviceReady && (admin.deviceOnline ?? true) ? "Online" : "Offline"}
                </Text>
              </Text>
              <Text style={styles.itemText}>ID: {admin.id}</Text>
            </View>
            <View style={styles.itemActions}>
              {admin.status === "suspended" ? (
                <Pressable
                  style={[styles.approveBtn, busyAction === `ad-uns-${admin.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() => onUnsuspend(admin)}
                >
                  <Text style={styles.btnText}>Unsuspend</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.warnBtn, busyAction === `ad-sus-${admin.id}` && styles.disabled]}
                  disabled={busyAction !== null}
                  onPress={() => onSuspend(admin)}
                >
                  <Text style={styles.btnText}>
                    {confirmActionKey === `ad-sus-${admin.id}` ? "Confirm Suspend" : "Suspend"}
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.deleteBtn, busyAction === `ad-del-${admin.id}` && styles.disabled]}
                disabled={busyAction !== null}
                onPress={() => onDelete(admin)}
              >
                <Text style={styles.btnText}>
                  {confirmActionKey === `ad-del-${admin.id}` ? "Confirm Delete" : "Delete"}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <EmptyStateCard title="No admins" message="Create or approve an admin to start onboarding tenants." />
      )}
    </View>
  );
}
