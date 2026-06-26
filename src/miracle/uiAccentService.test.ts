import { describe, expect, it } from "vitest";
import { getUiAccentPaletteByKind } from "./uiAccentService";

describe("getUiAccentPaletteByKind", () => {
    it("returns world mode palettes", () => {
        expect(getUiAccentPaletteByKind("poseidonMode")?.title).toBe("#08315e");
        expect(getUiAccentPaletteByKind("hadesuMode")?.fieldText).toBe("#ffe7e7");
    });

    it("returns rare miracle palettes", () => {
        expect(getUiAccentPaletteByKind("crown")?.badgeText).toBe("#3e2f00");
        expect(getUiAccentPaletteByKind("cosmicEgg")?.border).toBe("#65e7ff");
    });

    it("returns null for unknown or empty keys", () => {
        expect(getUiAccentPaletteByKind("unknown")).toBeNull();
        expect(getUiAccentPaletteByKind(null)).toBeNull();
    });
});
