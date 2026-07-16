const STORAGE_KEY = "miracle_settings_ui_zoom_v1";
const MIGRATION_KEY = "miracle_settings_ui_zoom_default_min_migrated_v1";
export const SETTINGS_UI_ZOOM_MIN = 0.82;
export const SETTINGS_UI_ZOOM_MAX = 1.22;

export interface KeyValueStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function normalize(value: unknown): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return SETTINGS_UI_ZOOM_MIN;
    return Math.min(SETTINGS_UI_ZOOM_MAX, Math.max(SETTINGS_UI_ZOOM_MIN, numeric));
}

export function loadSettingsUiZoom(storage: KeyValueStorage): number {
    let zoom = SETTINGS_UI_ZOOM_MIN;
    try {
        const saved = storage.getItem(STORAGE_KEY);
        zoom = normalize(saved ?? SETTINGS_UI_ZOOM_MIN);
        if (!storage.getItem(MIGRATION_KEY)) {
            if (saved === null || Math.abs(Number(saved) - 1) < 0.001) {
                zoom = SETTINGS_UI_ZOOM_MIN;
                storage.setItem(STORAGE_KEY, String(zoom));
            }
            storage.setItem(MIGRATION_KEY, "1");
        }
    } catch {
        // Storage can be blocked in privacy mode; the in-memory default remains usable.
    }
    return zoom;
}

export function saveSettingsUiZoom(storage: KeyValueStorage, value: number): number {
    const zoom = normalize(value);
    try {
        storage.setItem(STORAGE_KEY, String(zoom));
    } catch {
        // UI preferences are non-critical and remain active for this session.
    }
    return zoom;
}
