import { describe, expect, it } from "vitest";
import { normalizeSavedRecords } from "./saveMigration";
import {
    getExperimentFinishGachaPoint,
    getGachaPointRewardForRank,
    getSeasonClaimKey,
    getSeasonMissionValue,
} from "./rewardService";

describe("rewardService", () => {
    it("ランク別のガチャポイント報酬を返す", () => {
        expect(getGachaPointRewardForRank("N")).toBe(0);
        expect(getGachaPointRewardForRank("SR")).toBe(1);
        expect(getGachaPointRewardForRank("SSR")).toBe(3);
        expect(getGachaPointRewardForRank("EX")).toBe(10);
        expect(getGachaPointRewardForRank("GOD")).toBe(10);
    });

    it("実験完了、1000玉、設備購入の報酬を加算する", () => {
        expect(getExperimentFinishGachaPoint({ finishedCount: 999, boosterPurchased: false })).toBe(1);
        expect(getExperimentFinishGachaPoint({ finishedCount: 1000, boosterPurchased: false })).toBe(2);
        expect(getExperimentFinishGachaPoint({ finishedCount: 1000, boosterPurchased: true })).toBe(3);
    });

    it("シーズンミッション値を保存記録から算出する", () => {
        const records = normalizeSavedRecords({
            totalRuns: 4,
            totalScore: 120_000,
            discovered: { crown: 2, heart: 0, star: 1 },
            gachaRewards: [{ id: "a" }, { id: "b" }],
            crafted: { forge: 1 },
        });
        expect(getSeasonMissionValue(records, "run")).toBe(4);
        expect(getSeasonMissionValue(records, "score")).toBe(120_000);
        expect(getSeasonMissionValue(records, "discovered")).toBe(2);
        expect(getSeasonMissionValue(records, "gacha")).toBe(2);
        expect(getSeasonMissionValue(records, "craft")).toBe(1);
        expect(getSeasonClaimKey("deep-sea", "run-2")).toBe("deep-sea:run-2");
    });
});
