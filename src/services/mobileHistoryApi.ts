type AuthorizedRequest = <T>(path: string, init?: RequestInit) => Promise<T>;

export type MobileHistoryEntry = {
  id: string;
  event: string;
  date: string | null;
  usedMinutes: number | null;
  addedMinutes: number | null;
  userName: string | null;
  adminName: string | null;
};

export const mobileHistoryApi = {
  list(authorizedRequest: AuthorizedRequest, limit = 20) {
    return authorizedRequest<{ entries: MobileHistoryEntry[] }>(
      `/api/mobile/history?limit=${limit}`,
    );
  },
};
