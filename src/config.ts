const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const defaultBaseUrl = "http://localhost:3000";

export const API_BASE_URL = fromEnv && fromEnv.length > 0 ? fromEnv : defaultBaseUrl;
export const API_TIMEOUT_MS = 12000;
