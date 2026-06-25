import { describe, expect, it, vi } from "vitest";
import { createBossExperimentController } from "./bossExperimentController";
import { normalizeSavedRecords } from "./saveMigration";
import type { Geometry } from "./types";

const geometry: Geometry = {
    width: 800, height: 600, infoHeight: 100, scale: 1, pixelRatio: 1,
    wallWidth: 10, groundHeight: 10, groundTop: 590, totalBinCount: 4,
    binLeft: 0, binRight: 800, binWidth: 200, visibleStart: 0,
    ballRadius: 8, pinRadius: 4, dividerWidth: 2, dividerHeight: 80,
    dividerY: 500, ballCountY: 520, labelY: 540, countY: 560,
    percentY: 580, barY: 590, labelFont: 12, countFont: 12,
    percentFont: 12, infoFont: 12, binCenters: [100, 300, 500, 700],
};

function setup() {
    const records = normalizeSavedRecords(null);
    const finishRun = vi.fn();
    const controller = createBossExperimentController({
        getRecords: () => records,
        getStartTime: () => 1_000,
        getRunScore: () => 500,
        getFinishedCount: () => 25,
        getRuntimeState: () => ({ isStarted: true, isFinished: false, isPaused: false, isMiraclePaused: false }),
        getGeometry: () => geometry,
        getBlackModeEnabled: () => false,
        getRankScore: (rank) => ["N", "R", "SR", "SSR", "UR", "EX", "GOD"].indexOf(rank),
        getThemeDisplayName: (theme) => theme,
        findSpecialDef: () => undefined,
        createId: (prefix) => `${prefix}-1`,
        random: () => 0,
        showPopup: vi.fn(),
        closePopup: vi.fn(),
        showToast: vi.fn(),
        showMilestone: vi.fn(),
        addFloatingText: vi.fn(),
        addScore: vi.fn(),
        triggerPhaseEffect: vi.fn(),
        celebrateVictory: vi.fn(),
        triggerTimeoutEffect: vi.fn(),
        finishRun,
        triggerCameraShake: vi.fn(),
        spawnIntruders: vi.fn(),
        triggerOmen: vi.fn(),
        showCommentary: vi.fn(),
        addGachaPoint: vi.fn(),
        markThemeUnlocked: vi.fn(),
        prepareBossSettings: vi.fn(),
        startBossRun: vi.fn(),
        uiFont: "sans-serif",
    });
    return { controller, records, finishRun };
}

describe("bossExperimentController", () => {
    it("選択したボスを実験用状態へ初期化する", () => {
        const { controller } = setup();
        controller.start("gravity-kraken");
        controller.activateForRun();
        const state = controller.getSnapshot();
        expect(state.active?.id).toBe("gravity-kraken");
        expect(state.hp).toBe(state.active?.hp);
        expect(state.phase).toBe(1);
    });

    it("HPを削り切ると勝利終了を通知する", () => {
        const { controller, finishRun } = setup();
        controller.start("gravity-kraken");
        controller.activateForRun();
        for (let i = 0; i < 10; i++) controller.damage(100_000, "test");
        expect(controller.getSnapshot().cleared).toBe(true);
        expect(controller.getSnapshot().hp).toBe(0);
        expect(finishRun).toHaveBeenCalledWith("victory", "重力クラーケン");
    });

    it("討伐結果を保存記録へ追加する", () => {
        const { controller, records } = setup();
        controller.start("gravity-kraken");
        controller.activateForRun();
        controller.damage(1000, "test");
        const result = controller.recordResult();
        expect(result?.bossId).toBe("gravity-kraken");
        expect(records.bossRecords).toHaveLength(1);
    });
});
