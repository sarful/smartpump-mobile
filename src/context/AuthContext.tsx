import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { mobileAuthApi } from "../services/mobileAuthApi";

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
};

const ACCESS_TOKEN_KEY = "sp_access_token";
const REFRESH_TOKEN_KEY = "sp_refresh_token";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (!accessToken || !refreshToken) return;

        try {
          const me = await mobileAuthApi.me(accessToken);
          setUser(me.user);
          return;
        } catch {
          const refreshed = await mobileAuthApi.refresh(refreshToken);
          await AsyncStorage.setItem(ACCESS_TOKEN_KEY, refreshed.accessToken);
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshed.refreshToken);
          const me = await mobileAuthApi.me(refreshed.accessToken);
          setUser(me.user);
        }
      } catch {
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
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
        const data = await mobileAuthApi.login(username, password);
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        setUser(data.user);
      },
      async logout() {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          try {
            await mobileAuthApi.logout(refreshToken);
          } catch {
            // ignore network failures; clear local tokens anyway
          }
        }
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
