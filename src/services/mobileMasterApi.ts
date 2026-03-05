type AuthStateAccessor = {
  authorizedRequest: <T>(path: string, init?: RequestInit) => Promise<T>;
};

export type MasterDashboardData = {
  overview: {
    adminCount: number;
    userCount: number;
    running: number;
    waiting: number;
  };
  manualAdminApproval: boolean;
  admins: Array<{
    id: string;
    username: string;
    status: string;
    loadShedding: boolean;
    deviceOnline?: boolean;
    deviceReady: boolean;
    devicePinHigh: boolean;
    suspendReason: string | null;
  }>;
  pendingAdmins: Array<{
    id: string;
    username: string;
    status: string;
    loadShedding: boolean;
    deviceOnline?: boolean;
    deviceReady: boolean;
    devicePinHigh: boolean;
    suspendReason: string | null;
  }>;
  users: Array<{
    id: string;
    username: string;
    adminId: string;
    adminName: string;
    status: string;
    suspendReason: string | null;
    availableMinutes: number;
    motorStatus: string;
    motorRunningTime: number;
  }>;
};

export const mobileMasterApi = {
  dashboard(auth: AuthStateAccessor) {
    return auth.authorizedRequest<MasterDashboardData>("/api/mobile/master/dashboard");
  },
  setApprovalMode(auth: AuthStateAccessor, manualAdminApproval: boolean) {
    return auth.authorizedRequest<{ success: true; manualAdminApproval: boolean }>(
      "/api/mobile/master/settings",
      {
        method: "POST",
        body: JSON.stringify({ manualAdminApproval }),
      },
    );
  },
  adminAction(
    auth: AuthStateAccessor,
    payload: { adminId: string; action: "approve" | "suspend" | "unsuspend" | "delete"; reason?: string },
  ) {
    return auth.authorizedRequest<{ success: true }>("/api/mobile/master/admins/action", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  userAction(
    auth: AuthStateAccessor,
    payload: {
      userId: string;
      action: "suspend" | "unsuspend" | "delete" | "stop_reset" | "start";
      reason?: string;
      requestedMinutes?: number;
    },
  ) {
    return auth.authorizedRequest<{ success: true }>("/api/mobile/master/users/action", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
