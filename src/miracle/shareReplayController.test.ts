import { describe, expect, it } from "vitest";
import { buildShareText, createMiracleClip } from "./shareReplayController";
import type { SavedRecords, SpecialEventDef } from "./types";

const savedRecords: SavedRecords = {
    schemaVersion: 2,
    totalRuns: 3,
    maxFinishedCount: 100,
    maxTargetCount: 100,
    bestRank: "SSR",
    bestLabel: "虹の観測",
    discovered: {},
    discoveredFirstAt: {},
    totalScore: 0,
    bestScore: 0,
    miracleLogs: [],
    secretUnlocked: {},
    fusions: {},
    missionCompleted: {},
    dailyMissionCompleted: {},
    unlockedThemes: {},
    gachaPoint: 0,
    shopPurchases: [],
    bossRecords: [],
};

describe("buildShareText", () => {
    it("includes key run stats and clip count", () => {
        const text = buildShareText({
            runScore: 123456,
            finishedCount: 500,
            targetCount: 1000,
            savedRecords,
            discoveredCount: 7,
            specialEventCount: 42,
        }, 5);

        expect(text).toContain("スコア: 123,456");
        expect(text).toContain("処理数: 500 / 1,000");
        expect(text).toContain("最高レア: SSR 虹の観測");
        expect(text).toContain("発見済み: 7/42");
        expect(text).toContain("奇跡クリップ: 5件");
    });
});

describe("createMiracleClip", () => {
    it("keeps only the latest 18 frames and creates a stable id prefix", () => {
        const def: SpecialEventDef = {
            kind: "rainbow",
            label: "虹",
            symbol: "🌈",
            rank: "SSR",
            rate: 0.001,
            denominator: 7777,
            emoji: "🌈",
            fillStyle: "#fff",
            radiusScale: 1,
            soundMode: "miracle",
        };
        const frames = Array.from({ length: 25 }, (_, i) => `frame-${i}`);
        const clip = createMiracleClip({
            def,
            subtitle: "subtitle",
            finishedCount: 321,
            frames,
            now: 123000,
            random: () => 0.42,
        });

        expect(clip.id).toBe("123000-42000");
        expect(clip.frames).toHaveLength(18);
        expect(clip.frames[0]).toBe("frame-7");
        expect(clip.label).toBe("虹");
        expect(clip.finishedCount).toBe(321);
    });
});
