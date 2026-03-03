import { API_TIMEOUT_MS } from "../config";

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Request failed");
    }
    return json as T;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("Request timeout. Check internet/API.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
