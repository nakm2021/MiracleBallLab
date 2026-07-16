import { describe, expect, it } from "vitest";
import {
    completeMultiverseExpedition,
    chooseBlessing,
    createInitialMultiverseState,
    loadMultiverseState,
    startMultiverseExpedition,
    toggleRelic,
    evolveFamiliar,
    getSeededRoute,
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

    it("builds a repeatable five-node route ending in a boss", () => {
        expect(getSeededRoute("DAILY", "mirror")).toEqual(getSeededRoute("DAILY", "mirror"));
        expect(getSeededRoute("DAILY", "mirror")).toHaveLength(5);
        expect(getSeededRoute("DAILY", "mirror")[4].label).toBe("宇宙ボス");
    });

    it("manages blessings, curses, relic equipment and familiar evolution", () => {
        let state = chooseBlessing(createInitialMultiverseState(), "golden-division");
        expect(state.curses).toContain("重力密度上昇");
        state = { ...state, shards: 500, unlockedRelics: ["反重力の羽根"] };
        state = toggleRelic(state, "反重力の羽根");
        expect(state.equippedRelics).toEqual(["反重力の羽根"]);
        state = evolveFamiliar(state);
        expect(state.familiarForm).toBe("星界共鳴体");
        expect(state.shards).toBe(380);
    });
});
