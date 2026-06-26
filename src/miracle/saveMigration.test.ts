import { describe, expect, it } from "vitest";
import {
    CURRENT_SAVE_SCHEMA_VERSION,
    migrateSavedRecords,
    normalizeSavedRecords,
} from "./saveMigration";

describe("saveMigration", () => {
    it("バージョンなしの旧セーブを最新スキーマへ移行する", () => {
        const migrated = migrateSavedRecords({
            totalRuns: 7,
            discovered: { crown: 2 },
        });
        expect(migrated.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
        expect(migrated.totalRuns).toBe(7);
        expect(migrated.gachaRewards).toEqual([]);
        expect(migrated.bossRecords).toEqual([]);
        expect(migrated.discoveredFirstAt).toEqual({});
        expect(migrated.labWallFormulas).toEqual([]);
    });

    it("v1セーブへv2/v3のボス・レポート・壁数式領域を補う", () => {
        const migrated = migrateSavedRecords({
            schemaVersion: 1,
            gachaPoint: 12,
            researchReports: [{ id: "report-1" }],
        });
        expect(migrated.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
        expect(migrated.gachaPoint).toBe(12);
        expect(migrated.researchReports).toEqual([{ id: "report-1" }]);
        expect(migrated.bossCleared).toEqual({});
        expect(migrated.labWallFormulas).toEqual([]);
    });

    it("壊れた数値を安全化し、履歴上限を80件に揃える", () => {
        const normalized = normalizeSavedRecords({
            totalRuns: -4,
            totalScore: "1200",
            gachaPoint: -99,
            discovered: { crown: "3", invalid: "x" },
            miracleLogs: Array.from({ length: 100 }, (_, id) => ({ id })),
        });
        expect(normalized.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
        expect(normalized.totalRuns).toBe(0);
        expect(normalized.totalScore).toBe(1200);
        expect(normalized.gachaPoint).toBe(0);
        expect(normalized.discovered).toEqual({ crown: 3 });
        expect(normalized.miracleLogs).toHaveLength(80);
    });

    it("nullや配列でも初期セーブを生成できる", () => {
        expect(normalizeSavedRecords(null).totalRuns).toBe(0);
        expect(normalizeSavedRecords([]).bestRank).toBe("-");
    });
});
