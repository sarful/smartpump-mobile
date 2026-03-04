const devFallback = "http://192.168.2.102:3000";
const prodFallback = "https://pms-two-kappa.vercel.app";
const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL =
  fromEnv && fromEnv.length > 0 ? fromEnv : __DEV__ ? devFallback : prodFallback;
export const API_TIMEOUT_MS = 12000;
