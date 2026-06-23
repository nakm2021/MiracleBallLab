import { RECORD_STORAGE_KEY, USER_PREFERENCES_STORAGE_KEY, USER_PROFILE_STORAGE_KEY } from "./constants";
import type { SavedRecords, UserPlayStyle, UserPreferences, UserProfile } from "./types";

export function loadSavedRecords(): SavedRecords {
    try {
        const raw = localStorage.getItem(RECORD_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw) as Partial<SavedRecords>;
            return {
                totalRuns: data.totalRuns ?? 0,
                maxFinishedCount: data.maxFinishedCount ?? 0,
                maxTargetCount: data.maxTargetCount ?? 0,
                bestRank: data.bestRank ?? "-",
                bestLabel: data.bestLabel ?? "-",
                discovered: data.discovered ?? {},
                discoveredFirstAt: data.discoveredFirstAt ?? {},
                bestScore: data.bestScore ?? 0,
                totalScore: data.totalScore ?? 0,
                missionCompleted: data.missionCompleted ?? {},
                miracleLogs: Array.isArray(data.miracleLogs) ? data.miracleLogs.slice(0, 80) : [],
                fusions: data.fusions ?? {},
                secretUnlocked: data.secretUnlocked ?? {},
                dailyMissionCompleted: data.dailyMissionCompleted ?? {},
                unlockedThemes: data.unlockedThemes ?? {},
                researchReports: Array.isArray(data.researchReports) ? data.researchReports.slice(0, 80) : [],
                gachaPoint: Math.max(0, Math.floor(Number(data.gachaPoint) || 0)),
                gachaRewards: Array.isArray(data.gachaRewards) ? data.gachaRewards.slice(0, 80) : [],
                shopPurchased: data.shopPurchased ?? {},
                shopPurchases: Array.isArray(data.shopPurchases) ? data.shopPurchases.slice(0, 80) : [],
                seasonRewardClaimed: data.seasonRewardClaimed ?? {},
                seasonRewards: Array.isArray(data.seasonRewards) ? data.seasonRewards.slice(0, 80) : [],
                crafted: data.crafted ?? {},
                craftHistory: Array.isArray(data.craftHistory) ? data.craftHistory.slice(0, 80) : [],
                bossRecords: Array.isArray(data.bossRecords) ? data.bossRecords.slice(0, 80) : [],
                bossCleared: data.bossCleared ?? {},
            };
        }
    }
    catch {
        // 保存データが壊れていてもゲームは止めない
    }
    return {
        totalRuns: 0,
        maxFinishedCount: 0,
        maxTargetCount: 0,
        bestRank: "-",
        bestLabel: "-",
        discovered: {},
        discoveredFirstAt: {},
        bestScore: 0,
        totalScore: 0,
        missionCompleted: {},
        miracleLogs: [],
        fusions: {},
        secretUnlocked: {},
        dailyMissionCompleted: {},
        unlockedThemes: {},
        researchReports: [],
        gachaPoint: 0,
        gachaRewards: [],
        shopPurchased: {},
        shopPurchases: [],
        seasonRewardClaimed: {},
        seasonRewards: [],
        crafted: {},
        craftHistory: [],
        bossRecords: [],
        bossCleared: {},
    };
}

export function createDefaultUserProfile(): UserProfile {
    const now = Date.now();
    return {
        nickname: "研究員",
        playStyle: "standard",
        favoriteMiracle: "まだ未設定",
        createdAt: now,
        lastOpenedAt: now,
        openCount: 0,
        lastPlayedDateKey: "",
        consecutiveDays: 0,
        totalSafeStops: 0,
    };
}

export function loadUserProfile(): UserProfile {
    try {
        const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw) as Partial<UserProfile>;
            const base = createDefaultUserProfile();
            return {
                nickname: typeof data.nickname === "string" && data.nickname.trim() ? data.nickname.trim().slice(0, 24) : base.nickname,
                playStyle: (["standard", "viewer", "collector", "recording"] as UserPlayStyle[]).includes(data.playStyle as UserPlayStyle) ? data.playStyle as UserPlayStyle : base.playStyle,
                favoriteMiracle: typeof data.favoriteMiracle === "string" && data.favoriteMiracle.trim() ? data.favoriteMiracle.trim().slice(0, 40) : base.favoriteMiracle,
                createdAt: typeof data.createdAt === "number" ? data.createdAt : base.createdAt,
                lastOpenedAt: typeof data.lastOpenedAt === "number" ? data.lastOpenedAt : base.lastOpenedAt,
                openCount: typeof data.openCount === "number" ? data.openCount : base.openCount,
                lastPlayedDateKey: typeof data.lastPlayedDateKey === "string" ? data.lastPlayedDateKey : "",
                consecutiveDays: typeof data.consecutiveDays === "number" ? data.consecutiveDays : 0,
                totalSafeStops: typeof data.totalSafeStops === "number" ? data.totalSafeStops : 0,
            };
        }
    } catch {}
    return createDefaultUserProfile();
}

export function loadUserPreferences(): UserPreferences {
    try {
        const raw = localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
        if (raw) return JSON.parse(raw) as UserPreferences;
    } catch {}
    return { version: 1 };
}


export function saveSavedRecords(records: SavedRecords): void {
    try {
        localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(records));
    } catch {
        // localStorage不可の環境では無視
    }
}

export function saveUserProfileData(profile: UserProfile): void {
    try { localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile)); } catch {}
}
