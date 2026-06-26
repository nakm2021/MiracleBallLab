import { describe, expect, it } from "vitest";
import { buildResearchMemoHtml, buildResearchMemoText, evaluateResearchRun } from "./researchEvaluationService";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

describe("evaluateResearchRun", () => {
    it("grades dense miracle runs highly", () => {
        const result = evaluateResearchRun({
            specialCreated: { rainbow: 3, cosmicEgg: 1 },
            chainCount: 2,
            finishedCount: 1000,
            discardedCount: 10,
            binCount: 5,
            binCounts: [180, 190, 210, 200, 220],
            bestComboThisRun: 5,
            smallMiracleCount: 4,
            hasOmen: true,
            runScore: 90000,
            clamp,
        });

        expect(result.grade).toBe("S");
        expect(result.type).toBe("奇跡観測型");
        expect(result.density).toBe(100);
    });

    it("classifies calm low-discard runs as stable research", () => {
        const result = evaluateResearchRun({
            specialCreated: {},
            chainCount: 0,
            finishedCount: 1000,
            discardedCount: 20,
            binCount: 5,
            binCounts: [190, 200, 210, 205, 195],
            bestComboThisRun: 0,
            smallMiracleCount: 0,
            hasOmen: false,
            runScore: 5000,
            clamp,
        });

        expect(result.grade).toBe("D");
        expect(result.type).toBe("安定研究型");
    });
});

describe("buildResearchMemoText", () => {
    it("summarizes top bin, omen and discovered count", () => {
        const text = buildResearchMemoText({
            elapsed: "1分23秒",
            finishedCount: 1000,
            discardedCount: 25,
            labels: ["A", "B", "C"],
            binCounts: [100, 700, 200],
            bestMiracle: {
                label: "虹",
                rank: "SSR",
                denominator: 7777,
                finishedAt: 1,
                finishedCount: 99,
                mode: "normal",
                speedLabel: "通常",
                combo: 1,
            },
            lastOmenText: "空気が震えた",
            rarePinSummary: "赤1 / 青2",
            pachinkoStartHits: 3,
            pachinkoCenterHits: 4,
            pachinkoPremiumHits: 5,
            pachinkoJackpotCount: 6,
            discoveredCount: 7,
            specialEventCount: 8,
        });

        expect(text).toContain("もっとも多かった受け皿は「B」で 700 回");
        expect(text).toContain("今回もっとも印象的だった奇跡は「虹」");
        expect(text).toContain("空気が震えた");
        expect(text).toContain("奇跡図鑑は 7 / 8 種類");
    });

    it("escapes memo html", () => {
        const html = buildResearchMemoHtml({
            elapsed: "<script>",
            finishedCount: 1,
            discardedCount: 0,
            labels: ["<b>"],
            binCounts: [1],
            rarePinSummary: "none",
            pachinkoStartHits: 0,
            pachinkoCenterHits: 0,
            pachinkoPremiumHits: 0,
            pachinkoJackpotCount: 0,
            discoveredCount: 0,
            specialEventCount: 1,
        });

        expect(html).toContain("&lt;script&gt;");
        expect(html).toContain("&lt;b&gt;");
        expect(html).toContain("<br>");
    });
});
