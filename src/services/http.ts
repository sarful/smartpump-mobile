import { API_TIMEOUT_MS } from "../config";

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const raw = await res.text();
    let json: any = null;
    const summarizeRaw = (value: string) => {
      const collapsed = value.replace(/\s+/g, " ").trim();
      if (!collapsed) return "Non-JSON error response";
      const clipped = collapsed.length > 200 ? `${collapsed.slice(0, 200)}...` : collapsed;
      return `Non-JSON response: ${clipped}`;
    };
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${summarizeRaw(raw)}`);
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
