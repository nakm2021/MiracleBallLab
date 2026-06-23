import type { BossExperimentDef } from "./bossExperiment";
import type { BossExperimentRecord, DropKind, PachinkoYakumonoKind, SpecialEventDef, ThemeMode } from "./types";

export function getBossElapsedMs(activeBoss: BossExperimentDef | null, startTime: number, now: number): number {
    return activeBoss ? Math.max(0, now - startTime) : 0;
}

export function getBossRemainingMs(activeBoss: BossExperimentDef | null, startTime: number, now: number): number {
    if (!activeBoss) return 0;
    return Math.max(0, activeBoss.timeLimitSec * 1000 - getBossElapsedMs(activeBoss, startTime, now));
}

export function calculateBossDamage(amount: number, bossMaxHp: number): number {
    const damageCap = Math.max(30000, Math.floor(bossMaxHp * 0.18));
    return Math.min(damageCap, Math.max(0, Math.floor(amount)));
}

export function getBossPhase(hp: number, maxHp: number): number {
    return hp <= maxHp * 0.33 ? 3 : hp <= maxHp * 0.66 ? 2 : 1;
}

export function getBossYakumonoDamage(kind: PachinkoYakumonoKind, weakness: BossExperimentDef["weakness"]): number {
    const weak = weakness === kind;
    const base = kind === "premium" ? 28 : kind === "center" ? 18 : 10;
    return Math.round(base * (weak ? 2.2 : 1));
}

export function getBossDropDamage(params: {
    kind: DropKind;
    def?: SpecialEventDef;
    weakness: BossExperimentDef["weakness"];
    getRankScore: (rank: string) => number;
}): number {
    if (!params.def) {
        if (params.kind === "gold") return 900;
        if (params.kind === "rainbow") return 2400;
        return 0;
    }
    const rankScore = params.getRankScore(params.def.rank);
    const base = rankScore >= params.getRankScore("GOD") ? 120000
        : rankScore >= params.getRankScore("EX") ? 72000
        : rankScore >= params.getRankScore("UR") ? 36000
        : rankScore >= params.getRankScore("SSR") ? 18000
        : rankScore >= params.getRankScore("SR") ? 7200
        : 3600;
    return Math.round(base * (params.weakness === "miracle" ? 1.45 : 1));
}

export function getBossAttackInterval(phase: number): number {
    return phase === 1 ? 9000 : phase === 2 ? 6500 : 4600;
}

export function createBossExperimentRecord(params: {
    id: string;
    boss: BossExperimentDef;
    cleared: boolean;
    timedOut: boolean;
    damage: number;
    maxHp: number;
    score: number;
    finishedCount: number;
    createdAt: number;
    rewardParts: string[];
}): BossExperimentRecord {
    return {
        id: params.id,
        bossId: params.boss.id,
        bossName: params.boss.name,
        cleared: params.cleared,
        damage: params.damage,
        maxHp: params.maxHp,
        score: params.score,
        finishedCount: params.finishedCount,
        createdAt: params.createdAt,
        rewardLabel: params.rewardParts.join(" / ") || (params.timedOut ? "時間切れ" : "討伐失敗"),
    };
}

export function prependBossRecord(records: BossExperimentRecord[] | undefined, record: BossExperimentRecord, limit = 80): BossExperimentRecord[] {
    return [record, ...((records ?? []).filter((x) => x.id !== record.id))].slice(0, limit);
}

export function getBossRewardParts(params: {
    cleared: boolean;
    rewardPoint: number;
    rewardTheme?: ThemeMode;
    getThemeDisplayName: (theme: ThemeMode) => string;
}): string[] {
    if (!params.cleared) return [];
    return [
        `P+${params.rewardPoint}`,
        params.rewardTheme ? `テーマ:${params.getThemeDisplayName(params.rewardTheme)}` : "",
    ].filter(Boolean);
}
