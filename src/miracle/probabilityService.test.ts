import { describe, expect, it } from "vitest";
import {
    buildDailyFortune,
    calculateMiracleRateScale,
    getPassiveMiracleBoost,
    getProbabilityScale,
    rollSpecialEvent,
} from "./probabilityService";
import type { SpecialEventDef } from "./types";

function event(kind: string, rate: number): SpecialEventDef {
    return {
        kind,
        label: kind,
        rank: "SR",
        rate,
        denominator: Math.round(1 / rate),
        symbol: kind,
        emoji: kind,
        fillStyle: "#fff",
        radiusScale: 1,
        soundMode: "miracle",
    };
}

describe("probabilityService", () => {
    it("確率モードの倍率を固定値で返す", () => {
        expect(getProbabilityScale("normal")).toBe(1);
        expect(getProbabilityScale("festival")).toBe(5);
        expect(getProbabilityScale("hard")).toBe(0.35);
        expect(getProbabilityScale("hell")).toBe(0.08);
    });

    it("経過時間ブーストを20秒単位で増やし上限6倍にする", () => {
        expect(getPassiveMiracleBoost({ isStarted: false, isFinished: false, startedAt: 0, now: 999_999 })).toBe(1);
        expect(getPassiveMiracleBoost({ isStarted: true, isFinished: false, startedAt: 1_000, now: 20_999 })).toBe(1);
        expect(
            getPassiveMiracleBoost({ isStarted: true, isFinished: false, startedAt: 1_000, now: 21_000 }),
        ).toBeCloseTo(1.06);
        expect(getPassiveMiracleBoost({ isStarted: true, isFinished: false, startedAt: 0, now: 10_000_000 })).toBe(6);
    });

    it("全ブーストを積算し、負の倍率を抽選へ混ぜない", () => {
        expect(
            calculateMiracleRateScale({
                probabilityMode: "festival",
                passiveBoost: 1.5,
                dailyBoost: 1.1,
                seasonBoost: 1.2,
                extraScale: 2,
            }),
        ).toBeCloseTo(19.8);
        expect(
            calculateMiracleRateScale({
                probabilityMode: "normal",
                passiveBoost: -1,
                dailyBoost: 1,
                seasonBoost: 1,
            }),
        ).toBe(0);
    });

    it("定義順の累積確率で境界を正しく抽選する", () => {
        const defs = [event("first", 0.1), event("second", 0.2)];
        expect(rollSpecialEvent(defs, 1, 0.099)?.kind).toBe("first");
        expect(rollSpecialEvent(defs, 1, 0.1)?.kind).toBe("second");
        expect(rollSpecialEvent(defs, 1, 0.299)?.kind).toBe("second");
        expect(rollSpecialEvent(defs, 1, 0.301)).toBeNull();
    });

    it("同じ日付と設定から同じデイリー運勢を生成する", () => {
        const params = {
            dateKey: "2026-06-25",
            binCount: 4,
            specialDefs: [event("alpha", 0.1)],
            fallbackDefs: [event("fallback", 0.1)],
            hashTextToNumber: () => 123456,
        };
        expect(buildDailyFortune(params)).toEqual(buildDailyFortune(params));
        expect(buildDailyFortune(params).luckyBin).toBeGreaterThanOrEqual(1);
        expect(buildDailyFortune(params).luckyBin).toBeLessThanOrEqual(4);
    });
});
