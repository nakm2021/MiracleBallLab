import type { DailyFortune, ProbabilityMode, SpecialEventDef } from "./types";

export function getProbabilityScale(mode: ProbabilityMode): number {
    if (mode === "festival") return 5;
    if (mode === "hard") return 0.35;
    if (mode === "hell") return 0.08;
    return 1;
}

export function getPassiveMiracleBoost(params: {
    isStarted: boolean;
    isFinished: boolean;
    startedAt: number;
    now: number;
}): number {
    if (!params.isStarted || params.isFinished) return 1;
    const elapsedSec = Math.max(0, (params.now - params.startedAt) / 1000);
    return Math.min(6, Math.max(1, 1 + Math.floor(elapsedSec / 20) * 0.06));
}

export function calculateMiracleRateScale(params: {
    probabilityMode: ProbabilityMode;
    passiveBoost: number;
    dailyBoost: number;
    seasonBoost: number;
    extraScale?: number;
}): number {
    return getProbabilityScale(params.probabilityMode)
        * Math.max(0, params.passiveBoost)
        * Math.max(0, params.dailyBoost)
        * Math.max(0, params.seasonBoost)
        * Math.max(0, params.extraScale ?? 1);
}

export function rollSpecialEvent(
    defs: readonly SpecialEventDef[],
    scale: number,
    roll: number,
): SpecialEventDef | null {
    const normalizedRoll = Math.min(1, Math.max(0, roll));
    let threshold = 0;
    for (const def of defs) {
        threshold += Math.max(0, def.rate) * Math.max(0, scale);
        if (normalizedRoll < threshold) return def;
    }
    return null;
}

export function buildDailyFortune(params: {
    dateKey: string;
    binCount: number;
    specialDefs: readonly SpecialEventDef[];
    fallbackDefs: readonly SpecialEventDef[];
    hashTextToNumber: (text: string) => number;
}): DailyFortune {
    const seed = params.hashTextToNumber(`${params.dateKey}:miracle-ball-lab`);
    const titles = ["大吉", "中吉", "小吉", "研究日和", "乱数注意", "捨て区間警報", "奇跡濃度高め"];
    const advices = [
        "通常速度で眺めると、演出を見逃しにくい日です。",
        "投下数を少し増やすと、研究ログが育ちやすい日です。",
        "捨て区間に入りやすい気配があります。ピンを軽く揺らすとよさそうです。",
        "録画・SNSカード向けの見栄えが出やすい日です。",
        "同じSR/SSRが続くと演出が短縮されるので、長時間放置に向いています。",
    ];
    const luckyDefs = params.specialDefs.length > 0 ? params.specialDefs : params.fallbackDefs;
    const lucky = luckyDefs[seed % Math.max(1, luckyDefs.length)];
    return {
        dateKey: params.dateKey,
        title: titles[seed % titles.length] ?? "研究日和",
        rateBoost: 1 + ((seed >>> 5) % 17) / 100,
        luckyKind: lucky?.label ?? "王",
        luckyBin: (seed % Math.max(1, params.binCount)) + 1,
        advice: advices[(seed >>> 9) % advices.length] ?? advices[0],
        seed,
    };
}
