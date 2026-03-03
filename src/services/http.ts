import { API_TIMEOUT_MS } from "../config";

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
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
      throw new Error(json?.error || `HTTP ${res.status}`);
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
