import { describe, expect, it } from "vitest";
import { normalizeSavedRecords } from "./saveMigration";
import { getUnlockedLabWallFormulaDefs, unlockLabWallFormulas } from "./labWallFormulaService";

describe("labWallFormulaService", () => {
    it("unlocks formulas by completed run count", () => {
        expect(getUnlockedLabWallFormulaDefs(2)).toHaveLength(0);
        expect(getUnlockedLabWallFormulaDefs(3).map((x) => x.id)).toEqual(["first-scratch"]);
        expect(getUnlockedLabWallFormulaDefs(21)).toHaveLength(4);
    });

    it("adds newly unlocked wall formulas without duplicates", () => {
        const records = normalizeSavedRecords({ totalRuns: 7 });
        const first = unlockLabWallFormulas({ records, now: 1000 });
        expect(first.unlocked.map((x) => x.id)).toEqual(["first-scratch", "observer-residue"]);
        expect(first.records.labWallFormulas?.[0]?.runCount).toBe(7);

        const second = unlockLabWallFormulas({ records: first.records, now: 2000 });
        expect(second.unlocked).toEqual([]);
        expect(second.records.labWallFormulas).toHaveLength(2);
    });
});
