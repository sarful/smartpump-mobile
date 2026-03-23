import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

type UseAdaptivePollingOptions = {
  enabled?: boolean;
  baseIntervalMs: number;
  errorIntervalMs?: number;
  maxErrorIntervalMs?: number;
  onPoll: () => Promise<boolean | void> | boolean | void;
};

export function useAdaptivePolling({
  enabled = true,
  baseIntervalMs,
  errorIntervalMs,
  maxErrorIntervalMs = 30000,
  onPoll,
}: UseAdaptivePollingOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(true);
  const mountedRef = useRef(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const failureCountRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    activeRef.current = enabled;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const getDelay = (hadError: boolean) => {
      if (!hadError) return baseIntervalMs;
      const initial = errorIntervalMs ?? Math.max(baseIntervalMs * 2, 8000);
      const factor = Math.min(failureCountRef.current - 1, 3);
      return Math.min(initial * 2 ** factor, maxErrorIntervalMs);
    };

    const schedule = (delay: number) => {
      clearTimer();
      if (!mountedRef.current || !activeRef.current || appStateRef.current !== "active") return;
      timerRef.current = setTimeout(runPoll, delay);
    };

    const runPoll = async () => {
      if (!mountedRef.current || !activeRef.current || appStateRef.current !== "active") return;
      let hadError = false;
      try {
        const result = await onPoll();
        hadError = result === false;
      } catch {
        hadError = true;
      }

      failureCountRef.current = hadError ? failureCountRef.current + 1 : 0;
      schedule(getDelay(hadError));
    };

    const handleAppStateChange = (nextState: AppStateStatus) => {
      appStateRef.current = nextState;
      if (nextState === "active") {
        failureCountRef.current = 0;
        schedule(0);
      } else {
        clearTimer();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    if (enabled && appStateRef.current === "active") {
      schedule(0);
    } else {
      clearTimer();
    }

    return () => {
      mountedRef.current = false;
      clearTimer();
      subscription.remove();
    };
  }, [baseIntervalMs, enabled, errorIntervalMs, maxErrorIntervalMs, onPoll]);
}
