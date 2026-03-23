import { reportMobileIncident } from "../services/mobileTelemetry";

type AppUser = {
  id: string;
  role: "master" | "admin" | "user";
  username: string;
  adminId?: string;
};

type ErrorUtilsShape = {
  getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
  setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
};

let installed = false;

export function installMobileCrashReporting(getUser: () => AppUser | null) {
  if (installed) return;
  installed = true;

  const errorUtils = (globalThis as typeof globalThis & { ErrorUtils?: ErrorUtilsShape }).ErrorUtils;
  const previousHandler = errorUtils?.getGlobalHandler?.();

  errorUtils?.setGlobalHandler?.((error, isFatal) => {
    const user = getUser();
    void reportMobileIncident({
      source: "mobile_global_error",
      message: error.message,
      stack: error.stack ?? null,
      level: "error",
      isFatal,
      role: user?.role,
      userId: user?.id,
      adminId: user?.adminId,
    });

    previousHandler?.(error, isFatal);
  });
}
