const fallback = "https://pms-two-kappa.vercel.app";
const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = fromEnv && fromEnv.length > 0 ? fromEnv : fallback;
export const API_TIMEOUT_MS = 12000;
