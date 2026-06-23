export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes("Edg/")) return "Microsoft Edge";
    if (ua.includes("Firefox/")) return "Firefox";
    if (ua.includes("Chrome/")) return "Google Chrome";
    if (ua.includes("Safari/")) return "Safari";
    return "Unknown Browser";
}

export function isMobileDevice(): boolean {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        window.matchMedia?.("(pointer: coarse)")?.matches === true ||
        window.innerWidth < 700;
}

export function parseLabels(text: string, count: number): string[] {
    const items = text.split(/\n|,/).map((x) => x.trim()).filter((x) => x.length > 0);
    const result: string[] = [];
    for (let i = 0; i < count; i++) result.push(items[i] ?? String(i + 1));
    return result;
}

export function formatElapsedTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function escapeHtml(value: string | number): string {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function escapeCsv(value: string | number): string {
    const text = String(value);
    if (text.includes(",") || text.includes('"') || text.includes("\n")) return `"${text.replace(/"/g, '""')}"`;
    return text;
}

export function loadExternalScript(_src: string): Promise<void> {
    return Promise.resolve();
}

export function getDateKey(date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function formatDateTime(ts: number | undefined): string {
    if (!ts) return "-";
    try {
        return new Date(ts).toLocaleString("ja-JP");
    } catch {
        return "-";
    }
}

export function formatDurationMs(ms: number): string {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const sec = totalSeconds % 60;
    if (h > 0) return `${h}時間${m}分`;
    if (m > 0) return `${m}分${sec}秒`;
    return `${sec}秒`;
}

export function formatProbability(denominator: number): string {
    return `1 / ${denominator.toLocaleString()}`;
}

export function getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function hashTextToNumber(text: string): number {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
