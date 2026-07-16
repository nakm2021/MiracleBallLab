import { describe, expect, it } from "vitest";
import { loadSettingsUiZoom, saveSettingsUiZoom } from "./settingsUiZoom";

function memoryStorage(initial: Record<string, string> = {}) {
    const values = new Map(Object.entries(initial));
    return {
        values,
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => void values.set(key, value),
    };
}

describe("settingsUiZoom", () => {
    it("migrates the former 100% default to the new minimum", () => {
        const storage = memoryStorage({ miracle_settings_ui_zoom_v1: "1" });
        expect(loadSettingsUiZoom(storage)).toBe(0.82);
        expect(storage.values.get("miracle_settings_ui_zoom_default_min_migrated_v1")).toBe("1");
    });

    it("normalizes malformed and out-of-range values", () => {
        const migrated = { miracle_settings_ui_zoom_default_min_migrated_v1: "1" };
        expect(loadSettingsUiZoom(memoryStorage({ ...migrated, miracle_settings_ui_zoom_v1: "broken" }))).toBe(0.82);
        expect(loadSettingsUiZoom(memoryStorage({ ...migrated, miracle_settings_ui_zoom_v1: "9" }))).toBe(1.22);
    });

    it("returns and applies a preference even when storage writes fail", () => {
        const storage = {
            getItem: () => null,
            setItem: () => {
                throw new Error("blocked");
            },
        };
        expect(saveSettingsUiZoom(storage, 1.1)).toBe(1.1);
    });
});
