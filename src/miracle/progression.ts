import { getRankScore } from "./rarity";
import { getThemeOptions } from "./settings";
import type { DailyMissionDef, ResearchRankInfo, SavedRecords, ThemeAutoMode, ThemeCollectionEntry, ThemeMode } from "./types";

export type DailyMissionContext = {
    finishedCount: number;
    runScore: number;
    specialCount: number;
    discardedCount: number;
    centerHits: number;
};

function hashText(text: string): number {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function pick<T>(items: T[], seed: number): T {
    return items[Math.abs(seed) % items.length];
}

export function getThemeForTime(date = new Date()): ThemeMode {
    const hour = date.getHours();
    if (hour >= 5 && hour < 9) return "sakura";
    if (hour >= 9 && hour < 15) return "lab";
    if (hour >= 15 && hour < 18) return "sunset";
    if (hour >= 18 && hour < 22) return "neon";
    if (hour >= 22 || hour < 2) return "midnight";
    return "space";
}

export function pickRandomTheme(seed: string | number = Date.now()): ThemeMode {
    const themes = getThemeOptions().map((x) => x.value);
    return pick(themes, hashText(String(seed)));
}

export function resolveAutoTheme(mode: ThemeAutoMode, current: ThemeMode, date = new Date()): ThemeMode {
    if (mode === "time") return getThemeForTime(date);
    if (mode === "random") return pickRandomTheme(`${date.toDateString()}-${Date.now()}`);
    return current;
}

export function getDailyMissions(dateKey: string): DailyMissionDef[] {
    const seed = hashText(dateKey);
    const themeHints: ThemeMode[] = ["gold", "space", "sakura", "ocean", "forest", "cyber", "temple", "thunder", "glacier", "neon"];
    const luckyTheme = pick(themeHints, seed);
    const targetFinished = 300 + (seed % 5) * 100;
    const targetScore = 30000 + (seed % 7) * 10000;
    const targetCenter = 20 + (seed % 6) * 5;
    return [
        {
            id: `${dateKey}-run`,
            title: "本日の起動実験",
            description: "今日1回、実験を最後まで完了する",
            metric: "run",
            target: 1,
            rewardScore: 3000,
            themeHint: luckyTheme,
        },
        {
            id: `${dateKey}-finished-${targetFinished}`,
            title: "落下データ収集",
            description: `今日の実験で${targetFinished.toLocaleString()}玉以上を処理する`,
            metric: "finished",
            target: targetFinished,
            rewardScore: 4500,
            themeHint: "lab",
        },
        {
            id: `${dateKey}-score-${targetScore}`,
            title: "高スコア観測",
            description: `今日の実験でスコア${targetScore.toLocaleString()}以上を出す`,
            metric: "score",
            target: targetScore,
            rewardScore: 6500,
            themeHint: "gold",
        },
        {
            id: `${dateKey}-center-${targetCenter}`,
            title: "中央受け皿の観測",
            description: `中央付近の受け皿に${targetCenter.toLocaleString()}回以上入れる`,
            metric: "center",
            target: targetCenter,
            rewardScore: 5200,
            themeHint: "cyber",
        },
    ];
}

export function getDailyMissionValue(mission: DailyMissionDef, context: DailyMissionContext): number {
    switch (mission.metric) {
        case "run": return 1;
        case "finished": return context.finishedCount;
        case "score": return context.runScore;
        case "special": return context.specialCount;
        case "discard": return context.discardedCount;
        case "center": return context.centerHits;
    }
}

export function getResearchRankInfo(records: SavedRecords, discoveredCount: number, fusionCount: number, secretCount: number): ResearchRankInfo {
    const score = Math.max(0,
        (records.totalScore ?? 0) +
        (records.bestScore ?? 0) * 0.4 +
        (records.totalRuns ?? 0) * 1800 +
        discoveredCount * 5200 +
        fusionCount * 16000 +
        secretCount * 24000 +
        getRankScore(records.bestRank ?? "-") * 1200,
    );
    const ranks = [
        { label: "見習い研究員", score: 0 },
        { label: "確率観測員", score: 25000 },
        { label: "奇跡記録係", score: 90000 },
        { label: "主任研究員", score: 220000 },
        { label: "奇跡所長", score: 520000 },
        { label: "深夜観測者", score: 1200000 },
        { label: "神域研究員", score: 2600000 },
        { label: "ミラクル博士", score: 5200000 },
    ];
    let level = 0;
    for (let i = 0; i < ranks.length; i++) {
        if (score >= ranks[i].score) level = i;
    }
    const current = ranks[level];
    const next = ranks[Math.min(level + 1, ranks.length - 1)];
    const width = Math.max(1, next.score - current.score);
    const progressPercent = level >= ranks.length - 1 ? 100 : Math.max(0, Math.min(100, ((score - current.score) / width) * 100));
    return { label: current.label, level: level + 1, score: Math.floor(score), nextScore: next.score, progressPercent };
}

export function getThemeCollection(records: SavedRecords, discoveredCount: number, fusionCount: number, secretCount: number): ThemeCollectionEntry[] {
    const bestRankScore = getRankScore(records.bestRank ?? "-");
    const runs = records.totalRuns ?? 0;
    const score = records.totalScore ?? 0;
    const openUnlocked = records.unlockedThemes ?? {};
    const conditions: Partial<Record<ThemeMode, [boolean, string]>> = {
        lab: [true, "最初から使えます"],
        midnight: [runs >= 1 || !!openUnlocked.midnight, "実験を1回完了"],
        retro: [runs >= 3 || !!openUnlocked.retro, "実験を3回完了"],
        gold: [bestRankScore >= getRankScore("UR") || score >= 120000 || !!openUnlocked.gold, "UR以上または通算スコア120,000"],
        ocean: [discoveredCount >= 3 || !!openUnlocked.ocean, "奇跡を3種類発見"],
        space: [bestRankScore >= getRankScore("EX") || !!openUnlocked.space, "EX以上を発見"],
        sakura: [runs >= 5 || !!openUnlocked.sakura, "実験を5回完了"],
        snow: [score >= 80000 || !!openUnlocked.snow, "通算スコア80,000"],
        volcano: [bestRankScore >= getRankScore("SSR") || !!openUnlocked.volcano, "SSR以上を発見"],
        forest: [discoveredCount >= 5 || !!openUnlocked.forest, "奇跡を5種類発見"],
        cyber: [fusionCount >= 1 || score >= 200000 || !!openUnlocked.cyber, "奇跡合成1種類または通算スコア200,000"],
        candy: [runs >= 8 || !!openUnlocked.candy, "実験を8回完了"],
        poison: [secretCount >= 1 || !!openUnlocked.poison, "秘密を1つ解放"],
        temple: [fusionCount >= 2 || !!openUnlocked.temple, "奇跡合成2種類"],
        sunset: [runs >= 2 || !!openUnlocked.sunset, "実験を2回完了"],
        neon: [score >= 300000 || !!openUnlocked.neon, "通算スコア300,000"],
        monochrome: [runs >= 10 || !!openUnlocked.monochrome, "実験を10回完了"],
        wafuu: [discoveredCount >= 8 || !!openUnlocked.wafuu, "奇跡を8種類発見"],
        glacier: [bestRankScore >= getRankScore("GOD") || !!openUnlocked.glacier, "GODを発見"],
        thunder: [score >= 500000 || bestRankScore >= getRankScore("EX") || !!openUnlocked.thunder, "通算スコア500,000またはEX以上"],
    };
    return getThemeOptions().map((option) => {
        const [unlocked, reason] = conditions[option.value] ?? [false, "研究を進めると解放"];
        return { ...option, unlocked, reason };
    });
}
