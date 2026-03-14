const DEBUG = import.meta.env.VITE_DEBUG_MODE === "true";

export function debugLog(message: string, ...args: unknown[]) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

export function debugError(message: string, ...args: unknown[]) {
  if (DEBUG) {
    console.error(`[DEBUG ERROR] ${message}`, ...args);
  }
}
