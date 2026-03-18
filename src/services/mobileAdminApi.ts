type AuthStateAccessor = {
  authorizedRequest: <T>(path: string, init?: RequestInit) => Promise<T>;
};

export type AdminDashboard = {
  admin: {
    id: string;
    username: string;
    status: string;
    suspendReason: string | null;
    loadShedding: boolean;
    deviceReady: boolean;
    deviceOnline?: boolean;
    devicePinHigh: boolean;
    deviceLastSeenAt: string | null;
  };
  users: Array<{
    id: string;
    username: string;
    rfidUid?: string | null;
    availableMinutes: number;
    motorStatus: string;
    motorRunningTime: number;
    useSource?: string | null;
    status: string;
    suspendReason: string | null;
  }>;
  pendingRequests: Array<{
    id: string;
    userId: string;
    username: string | null;
    minutes: number;
    createdAt: string;
  }>;
  queue: Array<{
    id: string;
    position: number;
    status: string;
    requestedMinutes: number;
    username: string | null;
  }>;
};

export const mobileAdminApi = {
  dashboard(auth: AuthStateAccessor) {
    return auth.authorizedRequest<AdminDashboard>("/api/mobile/admin/dashboard");
  },
  recharge(auth: AuthStateAccessor, userId: string, minutes: number) {
    return auth.authorizedRequest<{ success: true; availableMinutes: number }>(
      "/api/mobile/admin/recharge",
      {
        method: "POST",
        body: JSON.stringify({ userId, minutes }),
      },
    );
  },
  approveRequest(auth: AuthStateAccessor, requestId: string) {
    return auth.authorizedRequest<{ success: true; availableMinutes: number }>(
      "/api/mobile/admin/minute-requests/approve",
      {
        method: "POST",
        body: JSON.stringify({ requestId }),
      },
    );
  },
  declineRequest(auth: AuthStateAccessor, requestId: string) {
    return auth.authorizedRequest<{ success: true }>(
      "/api/mobile/admin/minute-requests/decline",
      {
        method: "POST",
        body: JSON.stringify({ requestId }),
      },
    );
  },
  suspendUser(auth: AuthStateAccessor, userId: string, reason?: string) {
    return auth.authorizedRequest<{ success: true }>(
      "/api/mobile/admin/users/suspend",
      {
        method: "POST",
        body: JSON.stringify({ userId, reason }),
      },
    );
  },
  unsuspendUser(auth: AuthStateAccessor, userId: string) {
    return auth.authorizedRequest<{ success: true }>(
      "/api/mobile/admin/users/unsuspend",
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
    );
  },
  stopReset(auth: AuthStateAccessor, userId: string) {
    return auth.authorizedRequest<{ success: true; usedMinutes: number; refundedMinutes: number }>(
      "/api/mobile/admin/users/stop-reset",
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      },
    );
  },
  startUser(auth: AuthStateAccessor, userId: string, requestedMinutes?: number) {
    return auth.authorizedRequest<{ success: true; status: "RUNNING" | "WAITING"; queuePosition?: number }>(
      "/api/mobile/admin/users/start",
      {
        method: "POST",
        body: JSON.stringify({ userId, requestedMinutes }),
      },
    );
  },
  assignRfid(auth: AuthStateAccessor, userId: string, rfidUid: string | null) {
    return auth.authorizedRequest<{ success: true; rfidUid: string | null }>(
      "/api/mobile/admin/users/rfid",
      {
        method: "POST",
        body: JSON.stringify({ userId, rfidUid }),
      },
    );
  },
};
