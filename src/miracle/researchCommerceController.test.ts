import { describe, expect, it, vi } from "vitest";
import { createInitialMiracleTicketState } from "./miracleTicket";
import { createResearchCommerceController } from "./researchCommerceController";
import { normalizeSavedRecords } from "./saveMigration";

function setup() {
    const records = normalizeSavedRecords(null);
    let tickets = createInitialMiracleTicketState();
    const controller = createResearchCommerceController({
        getRecords: () => records,
        saveRecords: vi.fn(),
        getTickets: () => tickets,
        setTickets: (state) => {
            tickets = state;
        },
        createId: (prefix) => `${prefix}-1`,
        random: () => 0.5,
        now: () => 1234,
        isMobile: false,
        showPopup: vi.fn(),
        closePopup: vi.fn(),
        showToast: vi.fn(),
        showMilestone: vi.fn(),
        updateTicketButton: vi.fn(),
        getThemeOptions: () => ["lab"],
        getThemeDisplayName: (theme) => theme,
        markThemeUnlocked: vi.fn(),
        hashTextToNumber: () => 1,
        formatProbability: (value) => String(value),
        applyExperimentPreset: vi.fn(),
        addScore: vi.fn(),
        revealGachaResult: vi.fn(),
        playGachaVideo: vi.fn(),
    });
    return { controller, records };
}

describe("researchCommerceController", () => {
    it("ガチャポイントを安全に加算する", () => {
        const { controller, records } = setup();
        expect(controller.addGachaPoint(12.9, "test", false)).toBe(12);
        expect(records.gachaPoint).toBe(12);
        expect(controller.addGachaPoint(-4, "test", false)).toBe(12);
    });

    it("実験完了報酬を設備状態込みで算出する", () => {
        const { controller, records } = setup();
        records.shopPurchased = { "gacha-point-booster": 1 };
        expect(controller.awardExperimentFinishGachaPoint(1000)).toBe(3);
        expect(records.gachaPoint).toBe(3);
    });
});
