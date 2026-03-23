import React from "react";
import { Pressable, Text, View } from "react-native";
import { EmptyStateCard } from "../EmptyStateCard";
import { MasterDashboardData } from "../../services/mobileMasterApi";

type StylesMap = Record<string, any>;

type Props = {
  admins: MasterDashboardData["pendingAdmins"];
  busyAction: string | null;
  styles: StylesMap;
  onApprove: (adminId: string, username: string) => void;
};

export function MasterPendingAdminsSection({ admins, busyAction, styles, onApprove }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Pending Admin Approvals</Text>
      {admins.length ? (
        admins.map((admin) => (
          <View style={styles.item} key={admin.id}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemTitle}>{admin.username}</Text>
              <Text style={styles.itemText}>Status: {admin.status}</Text>
              <Text style={styles.itemText}>ID: {admin.id}</Text>
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
            </View>
            <Pressable
              style={[styles.approveBtn, busyAction === `approve-${admin.id}` && styles.disabled]}
              disabled={busyAction !== null}
              onPress={() => onApprove(admin.id, admin.username)}
            >
              <Text style={styles.btnText}>Approve</Text>
            </Pressable>
          </View>
        ))
      ) : (
        <EmptyStateCard
          title="No pending admins"
          message="New admin approvals will appear here when manual approval is enabled."
        />
      )}
    </View>
  );
}
