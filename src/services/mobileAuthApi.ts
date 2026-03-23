import { API_BASE_URL } from "../config";
import { fetchJson } from "./http";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: "master" | "admin" | "user";
    username: string;
    adminId?: string;
  };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchJson<T>(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

export const mobileAuthApi = {
  login(username: string, password: string, deviceId?: string) {
    return request<LoginResponse>("/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, deviceId }),
    });
  },
  refresh(refreshToken: string, deviceId?: string) {
    return request<{ accessToken: string; refreshToken: string }>("/api/mobile/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken, deviceId }),
    });
  },
  logout(refreshToken: string) {
    return request<{ success: boolean }>("/api/mobile/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },
  me(accessToken: string) {
    return request<{
      user: { id: string; role: "master" | "admin" | "user"; username: string; adminId?: string };
    }>("/api/mobile/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
  health() {
    return request<{ ok: boolean; service: string; timestamp: string }>("/api/mobile/health", {
      method: "GET",
    });
  },
};
