export const RANK_ORDER = ["N", "R", "SR", "SSR", "UR", "EX", "GOD"] as const;

export function getRankScore(rank: string): number {
    return RANK_ORDER.indexOf(String(rank).toUpperCase() as typeof RANK_ORDER[number]);
}

export function getRankBaseScore(rank: string): number {
    const normalized = String(rank).toUpperCase();
    if (normalized === "GOD") return 250000;
    if (normalized === "EX") return 120000;
    if (normalized === "UR") return 60000;
    if (normalized === "SSR") return 18000;
    if (normalized === "SR") return 6000;
    if (normalized === "R") return 1800;
    return 100;
}
