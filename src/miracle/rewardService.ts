import type { SavedRecords } from "./types";
import type { EventSeasonMissionMetric } from "./researchFeatures";
import { getRankScore } from "./rarity";

export function getGachaPointRewardForRank(rank: string): number {
    const score = getRankScore(rank);
    if (rank === "GOD" || rank === "EX" || score >= getRankScore("GOD")) return 10;
    if (score >= getRankScore("SSR")) return 3;
    if (score >= getRankScore("SR")) return 1;
    return 0;
}

export function getExperimentFinishGachaPoint(params: { finishedCount: number; boosterPurchased: boolean }): number {
    return 1 + (params.finishedCount >= 1000 ? 1 : 0) + (params.boosterPurchased ? 1 : 0);
}

export function getSeasonMissionValue(records: SavedRecords, metric: EventSeasonMissionMetric): number {
    if (metric === "run") return records.totalRuns;
    if (metric === "discovered")
        return Object.keys(records.discovered).filter((key) => records.discovered[key] > 0).length;
    if (metric === "gacha") return records.gachaRewards?.length ?? 0;
    if (metric === "craft") return Object.keys(records.crafted ?? {}).length;
    return records.totalScore;
}

export function getSeasonClaimKey(seasonId: string, missionId: string): string {
    return `${seasonId}:${missionId}`;
}
