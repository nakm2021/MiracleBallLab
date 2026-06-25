import type { SavedRecords } from "./types";

export const CURRENT_SAVE_SCHEMA_VERSION = 2;

type UnknownRecord = Record<string, unknown>;

function asObject(value: unknown): UnknownRecord {
    return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function migrateV0ToV1(data: UnknownRecord): UnknownRecord {
    return {
        ...data,
        schemaVersion: 1,
        gachaPoint: data.gachaPoint ?? 0,
        gachaRewards: data.gachaRewards ?? [],
        shopPurchased: data.shopPurchased ?? {},
        shopPurchases: data.shopPurchases ?? [],
        seasonRewardClaimed: data.seasonRewardClaimed ?? {},
        seasonRewards: data.seasonRewards ?? [],
        crafted: data.crafted ?? {},
        craftHistory: data.craftHistory ?? [],
    };
}

function migrateV1ToV2(data: UnknownRecord): UnknownRecord {
    return {
        ...data,
        schemaVersion: 2,
        discoveredFirstAt: data.discoveredFirstAt ?? {},
        researchReports: data.researchReports ?? [],
        bossRecords: data.bossRecords ?? [],
        bossCleared: data.bossCleared ?? {},
    };
}

export function migrateSavedRecords(value: unknown): UnknownRecord {
    let data = asObject(value);
    let version = Math.max(0, Math.floor(Number(data.schemaVersion) || 0));
    if (version < 1) {
        data = migrateV0ToV1(data);
        version = 1;
    }
    if (version < 2) data = migrateV1ToV2(data);
    return { ...data, schemaVersion: CURRENT_SAVE_SCHEMA_VERSION };
}

function numberMap(value: unknown): Record<string, number> {
    const source = asObject(value);
    return Object.fromEntries(
        Object.entries(source)
            .filter(([, item]) => Number.isFinite(Number(item)))
            .map(([key, item]) => [key, Math.max(0, Number(item))]),
    );
}

function nonNegativeInteger(value: unknown): number {
    return Math.max(0, Math.floor(Number(value) || 0));
}

export function normalizeSavedRecords(value: unknown): SavedRecords {
    const data = migrateSavedRecords(value);
    return {
        schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
        totalRuns: nonNegativeInteger(data.totalRuns),
        maxFinishedCount: nonNegativeInteger(data.maxFinishedCount),
        maxTargetCount: nonNegativeInteger(data.maxTargetCount),
        bestRank: typeof data.bestRank === "string" ? data.bestRank : "-",
        bestLabel: typeof data.bestLabel === "string" ? data.bestLabel : "-",
        discovered: numberMap(data.discovered),
        discoveredFirstAt: numberMap(data.discoveredFirstAt),
        bestScore: nonNegativeInteger(data.bestScore),
        totalScore: nonNegativeInteger(data.totalScore),
        missionCompleted: numberMap(data.missionCompleted),
        miracleLogs: Array.isArray(data.miracleLogs) ? data.miracleLogs.slice(0, 80) : [],
        fusions: numberMap(data.fusions),
        secretUnlocked: numberMap(data.secretUnlocked),
        dailyMissionCompleted: numberMap(data.dailyMissionCompleted),
        unlockedThemes: numberMap(data.unlockedThemes),
        researchReports: Array.isArray(data.researchReports) ? data.researchReports.slice(0, 80) : [],
        gachaPoint: nonNegativeInteger(data.gachaPoint),
        gachaRewards: Array.isArray(data.gachaRewards) ? data.gachaRewards.slice(0, 80) : [],
        shopPurchased: numberMap(data.shopPurchased),
        shopPurchases: Array.isArray(data.shopPurchases) ? data.shopPurchases.slice(0, 80) : [],
        seasonRewardClaimed: numberMap(data.seasonRewardClaimed),
        seasonRewards: Array.isArray(data.seasonRewards) ? data.seasonRewards.slice(0, 80) : [],
        crafted: numberMap(data.crafted),
        craftHistory: Array.isArray(data.craftHistory) ? data.craftHistory.slice(0, 80) : [],
        bossRecords: Array.isArray(data.bossRecords) ? data.bossRecords.slice(0, 80) : [],
        bossCleared: numberMap(data.bossCleared),
    };
}
