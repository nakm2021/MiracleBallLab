import type { AdminLogEntry } from "./adminLog";

export function stringifyErrorForAdminLog(value: unknown): string {
    try {
        if (value instanceof Error) {
            return [value.name, value.message, value.stack].filter(Boolean).join(" | ").slice(0, 900);
        }
        if (typeof value === "string") return value.slice(0, 900);
        const json = JSON.stringify(value, (_key, current) => {
            if (typeof current === "function") return `[Function ${current.name || "anonymous"}]`;
            if (current instanceof Error) return { name: current.name, message: current.message, stack: current.stack };
            return current;
        });
        return (json || String(value)).slice(0, 900);
    } catch {
        return String(value).slice(0, 900);
    }
}

export function createRuntimeErrorLogWriter(params: {
    maxLogsPerSession: number;
    recordAdminEvent: (entry: AdminLogEntry) => void;
}): (label: string, detail: string) => void {
    let count = 0;
    return (label, detail) => {
        if (count >= params.maxLogsPerSession) return;
        count += 1;
        try {
            params.recordAdminEvent({
                type: "video_fail",
                at: Date.now(),
                label,
                rank: "ERROR",
                detail,
            });
        } catch {
            // ログ保存自体の失敗でさらにエラーを増やさない。
        }
    };
}

export function installGlobalErrorLogger(writeRuntimeErrorToAdminLog: (label: string, detail: string) => void): void {
    const originalConsoleError = console.error.bind(console);
    let logging = false;

    window.addEventListener("error", (event) => {
        const detail = `${event.message || "runtime error"} @ ${event.filename || "unknown"}:${event.lineno || 0}:${event.colno || 0}${event.error ? " | " + stringifyErrorForAdminLog(event.error) : ""}`;
        writeRuntimeErrorToAdminLog("runtime_error", detail);
    });

    window.addEventListener("unhandledrejection", (event) => {
        writeRuntimeErrorToAdminLog("unhandled_rejection", stringifyErrorForAdminLog(event.reason));
    });

    console.error = (...args: unknown[]) => {
        originalConsoleError(...args);
        if (logging) return;
        logging = true;
        try {
            writeRuntimeErrorToAdminLog("console_error", args.map(stringifyErrorForAdminLog).join(" / "));
        } finally {
            logging = false;
        }
    };
}
