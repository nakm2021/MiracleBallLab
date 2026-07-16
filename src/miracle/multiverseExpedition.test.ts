import { describe, expect, it } from "vitest";
import {
    completeMultiverseExpedition,
    createInitialMultiverseState,
    loadMultiverseState,
    startMultiverseExpedition,
} from "./multiverseExpedition";

describe("multiverseExpedition", () => {
    it("starts a known universe but rejects an unknown destination", () => {
        const initial = createInitialMultiverseState();
        expect(startMultiverseExpedition(initial, "missing", "SEED")).toBe(initial);
        const started = startMultiverseExpedition(initial, "clockwork", "SEED", 100);
        expect(started.active).toEqual({ universeId: "clockwork", seed: "SEED", startedAt: 100 });
    });

    it("awards shards, discovery progress and a deterministic grade", () => {
        const started = startMultiverseExpedition(createInitialMultiverseState(), "event-horizon", "X", 100);
        const completed = completeMultiverseExpedition(
            started,
            { score: 12_000, finishedCount: 520, specialCount: 4 },
            200,
        );
        expect(completed.active).toBeNull();
        expect(completed.shards).toBeGreaterThan(0);
        expect(completed.discovered["event-horizon"]).toBe(1);
        expect(completed.lastResult?.grade).toBe("S");
    });

    it("unlocks a relic every second successful expedition", () => {
        const initial = { ...createInitialMultiverseState(), totalExpeditions: 1 };
        const started = startMultiverseExpedition(initial, "bloom", "X");
        const completed = completeMultiverseExpedition(started, { score: 2000, finishedCount: 600, specialCount: 1 });
        expect(completed.unlockedRelics).toEqual(["反重力の羽根"]);
    });

    it("recovers safely from corrupt storage", () => {
        const state = loadMultiverseState({ getItem: () => "{broken" });
        expect(state).toEqual(createInitialMultiverseState());
    });
});
