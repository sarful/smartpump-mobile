const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
if (!fromEnv) {
  throw new Error(
    "Missing EXPO_PUBLIC_API_BASE_URL. Set it in smartpump-mobile/.env before starting the app.",
  );
}

export const API_BASE_URL = fromEnv.replace(/\/+$/, "");
export const API_TIMEOUT_MS = 12000;
