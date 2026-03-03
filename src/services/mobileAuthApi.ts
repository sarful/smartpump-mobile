import { API_BASE_URL } from "../config";

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
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Request failed");
  }
  return json as T;
}

export const mobileAuthApi = {
  login(username: string, password: string) {
    return request<LoginResponse>("/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  refresh(refreshToken: string) {
    return request<{ accessToken: string; refreshToken: string }>("/api/mobile/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
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
};
