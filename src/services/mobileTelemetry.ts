import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, API_TIMEOUT_MS } from "../config";

const ACCESS_TOKEN_KEY = "sp_access_token";

type MobileIncidentInput = {
  message: string;
  stack?: string | null;
  source: string;
  level?: "error" | "warn" | "info";
  isFatal?: boolean;
  role?: string;
  userId?: string;
  adminId?: string;
  meta?: Record<string, unknown>;
};

export async function reportMobileIncident(input: MobileIncidentInput) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

    await fetch(`${API_BASE_URL}/api/mobile/client-log`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        ...input,
        platform: "mobile",
      }),
    });

    clearTimeout(timeout);
  } catch {
    // swallow telemetry failures to avoid user-facing regressions
  }
}
