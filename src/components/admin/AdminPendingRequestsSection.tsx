import React from "react";
import { Pressable, Text, View } from "react-native";
import { EmptyStateCard } from "../EmptyStateCard";
import { AdminDashboard } from "../../services/mobileAdminApi";

type StylesMap = Record<string, any>;

type Props = {
  requests: AdminDashboard["pendingRequests"];
  busyAction: string | null;
  styles: StylesMap;
  onApprove: (requestId: string) => void;
  onDecline: (requestId: string) => void;
};

export function AdminPendingRequestsSection({
  requests,
  busyAction,
  styles,
  onApprove,
  onDecline,
}: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Pending Minute Requests</Text>
      {requests.length ? (
        requests.map((request) => (
          <View style={styles.item} key={request.id}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemTitle}>{request.username || request.userId}</Text>
              <Text style={styles.itemText}>Minutes: {request.minutes}</Text>
            </View>
            <View style={styles.itemActions}>
              <Pressable
                style={[styles.approveBtn, busyAction === `approve-${request.id}` && styles.disabled]}
                disabled={busyAction !== null}
                onPress={() => onApprove(request.id)}
              >
                <Text style={styles.btnText}>Approve</Text>
              </Pressable>
              <Pressable
                style={[styles.declineBtn, busyAction === `decline-${request.id}` && styles.disabled]}
                disabled={busyAction !== null}
                onPress={() => onDecline(request.id)}
              >
                <Text style={styles.btnText}>Decline</Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <EmptyStateCard
          title="No pending requests"
          message="New minute requests from users will appear here for approval or decline."
        />
      )}
    </View>
  );
}
