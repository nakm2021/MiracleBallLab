export function loadJsonFromStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return { ...(fallback as any), ...(JSON.parse(raw) as any) } as T;
    } catch {
        return fallback;
    }
}

export function saveJsonToStorage(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // localStorage不可の環境では無視
    }
}

export function removeStorageKeys(keys: string[]): void {
    for (const key of keys) {
        try { localStorage.removeItem(key); } catch {}
    }
}
