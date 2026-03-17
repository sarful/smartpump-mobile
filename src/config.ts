const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
// APK/AAB builds need a real hosted backend; localhost is never reachable from an installed phone app.
const defaultBaseUrl = "https://pms-two-kappa.vercel.app";

export const API_BASE_URL = fromEnv && fromEnv.length > 0 ? fromEnv : defaultBaseUrl;
export const API_TIMEOUT_MS = 12000;
