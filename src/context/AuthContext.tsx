import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, API_TIMEOUT_MS } from "../config";
import { mobileAuthApi } from "../services/mobileAuthApi";
import { getOrCreateDeviceId } from "../utils/deviceId";

type AppUser = {
  id: string;
  role: "master" | "admin" | "user";
  username: string;
  adminId?: string;
};

type AuthState = {
  user: AppUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  authorizedRequest: <T>(path: string, init?: RequestInit) => Promise<T>;
};

const ACCESS_TOKEN_KEY = "sp_access_token";
const REFRESH_TOKEN_KEY = "sp_refresh_token";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        const deviceId = await getOrCreateDeviceId();
        if (!accessToken || !refreshToken) return;
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);

        try {
          const me = await mobileAuthApi.me(accessToken);
          setUser(me.user);
          return;
        } catch {
          const refreshed = await mobileAuthApi.refresh(refreshToken, deviceId);
          await AsyncStorage.setItem(ACCESS_TOKEN_KEY, refreshed.accessToken);
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshed.refreshToken);
          setAccessToken(refreshed.accessToken);
          setRefreshToken(refreshed.refreshToken);
          const me = await mobileAuthApi.me(refreshed.accessToken);
          setUser(me.user);
        }
      } catch {
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      async login(username: string, password: string) {
        const deviceId = await getOrCreateDeviceId();
        const data = await mobileAuthApi.login(username, password, deviceId);
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setUser(data.user);
      },
      async logout() {
        const storedRefresh = refreshToken ?? (await AsyncStorage.getItem(REFRESH_TOKEN_KEY));
        if (storedRefresh) {
          try {
            await mobileAuthApi.logout(storedRefresh);
          } catch {
            // ignore network failures; clear local tokens anyway
          }
        }
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      },
      async logoutAll() {
        const currentAccess = accessToken ?? (await AsyncStorage.getItem(ACCESS_TOKEN_KEY));
        if (currentAccess) {
          try {
            await fetch(`${API_BASE_URL}/api/mobile/auth/logout-all`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${currentAccess}`,
              },
            });
          } catch {
            // ignore network failures
          }
        }
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      },
      async authorizedRequest<T>(path: string, init?: RequestInit) {
        const rawRequest = async (token: string) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
          const res = await fetch(`${API_BASE_URL}${path}`, {
            ...init,
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              ...(init?.headers || {}),
            },
          });
          clearTimeout(timeout);
          return res;
        };

        let currentAccess = accessToken ?? (await AsyncStorage.getItem(ACCESS_TOKEN_KEY));
        let currentRefresh = refreshToken ?? (await AsyncStorage.getItem(REFRESH_TOKEN_KEY));

        if (!currentAccess || !currentRefresh) {
          throw new Error("Session expired. Please login again.");
        }
        const deviceId = await getOrCreateDeviceId();

        let res = await rawRequest(currentAccess);
        if (res.status === 401) {
          const refreshed = await mobileAuthApi.refresh(currentRefresh, deviceId);
          currentAccess = refreshed.accessToken;
          currentRefresh = refreshed.refreshToken;
          await AsyncStorage.setItem(ACCESS_TOKEN_KEY, currentAccess);
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, currentRefresh);
          setAccessToken(currentAccess);
          setRefreshToken(currentRefresh);
          res = await rawRequest(currentAccess);
        }

        const raw = await res.text();
        let json: any = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${raw || "Non-JSON error response"}`);
          }
          throw new Error("Invalid JSON response from server");
        }

        if (!res.ok) {
          throw new Error(json?.error || "Request failed");
        }

        return json as T;
      },
    }),
    [user, loading, accessToken, refreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
