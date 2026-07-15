import { escapeCsv } from "./utils";

export function buildResultCsv(params: {
    browserName: string;
    device: "mobile" | "desktop";
    targetCount: number;
    probabilityMode: string;
    finishedCount: number;
    binCount: number;
    pinRows: number;
    randomCallCount: number;
    discardedCount: number;
    runScore: number;
    boss: {
        id: string;
        name: string;
        damage: number;
        hpRemaining: number;
        cleared: boolean;
        timedOut: boolean;
        timeLimitSec: number | "";
        elapsedSec: number | "";
    };
    bestComboThisRun: number;
    missionsCleared: number;
    createdCounts: Record<string, number>;
    labels: string[];
    binCounts: number[];
    hits: Record<string, number[]>;
}): string {
    const rows: Array<Array<string | number>> = [];
    rows.push(["browser", params.browserName]);
    rows.push(["device", params.device]);
    rows.push(["target_count", params.targetCount]);
    rows.push(["probability_mode", params.probabilityMode]);
    rows.push(["finished_count", params.finishedCount]);
    rows.push(["bin_count", params.binCount]);
    rows.push(["pin_rows", params.pinRows]);
    rows.push(["random_call_count", params.randomCallCount]);
    rows.push(["discarded_count", params.discardedCount]);
    rows.push(["run_score", params.runScore]);
    rows.push(["boss_id", params.boss.id]);
    rows.push(["boss_name", params.boss.name]);
    rows.push(["boss_damage", params.boss.damage]);
    rows.push(["boss_hp_remaining", params.boss.hpRemaining]);
    rows.push(["boss_cleared", params.boss.cleared ? "yes" : "no"]);
    rows.push(["boss_timed_out", params.boss.timedOut ? "yes" : "no"]);
    rows.push(["boss_time_limit_sec", params.boss.timeLimitSec]);
    rows.push(["boss_elapsed_sec", params.boss.elapsedSec]);
    rows.push(["best_combo", params.bestComboThisRun]);
    rows.push(["missions_cleared", params.missionsCleared]);
    for (const [key, value] of Object.entries(params.createdCounts)) {
        rows.push([`${key}_created`, value]);
    }
    rows.push([]);
    rows.push([
        "bin",
        "label",
        "count",
        "percent",
        "gold",
        "rainbow",
        "giant",
        "shape",
        "crown",
        "star",
        "heart",
        "blackSun",
        "cosmicEgg",
    ]);
    for (let i = 0; i < params.binCount; i++) {
        const percent = params.finishedCount > 0 ? ((params.binCounts[i] ?? 0) / params.finishedCount) * 100 : 0;
        rows.push([
            i + 1,
            params.labels[i] ?? "",
            params.binCounts[i] ?? 0,
            percent.toFixed(4),
            params.hits.gold[i] ?? 0,
            params.hits.rainbow[i] ?? 0,
            params.hits.giant[i] ?? 0,
            params.hits.shape[i] ?? 0,
            params.hits.crown[i] ?? 0,
            params.hits.star[i] ?? 0,
            params.hits.heart[i] ?? 0,
            params.hits.blackSun[i] ?? 0,
            params.hits.cosmicEgg[i] ?? 0,
        ]);
    }
    return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}
