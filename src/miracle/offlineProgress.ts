import type { OfflineMiracleCatalog } from "./offlineCache";

const OFFLINE_PROGRESS_KEY = "miracleBallLab.offlineProgress.v1";
const OFFLINE_TUTORIAL_KEY = "miracleBallLab.offlineTutorialDone.v1";

export type OfflineMiracleAction =
    | "bookOpen"
    | "saveVideo"
    | "testPlay"
    | "theaterPlay"
    | "gachaPlay"
    | "cleanup"
    | "customVideo"
    | "offlineBoot";

export type OfflineMiracleProgress = {
    dateKey: string;
    actions: Record<OfflineMiracleAction, number>;
    unlockedTitleIds: string[];
    lastUpdatedAt: number;
};

export type OfflineMissionDef = {
    id: string;
    label: string;
    description: string;
    current: number;
    target: number;
    done: boolean;
    reward: string;
};

export type OfflineTitleDef = {
    id: string;
    label: string;
    description: string;
    unlocked: boolean;
};

function getDateKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function createEmptyActions(): Record<OfflineMiracleAction, number> {
    return {
        bookOpen: 0,
        saveVideo: 0,
        testPlay: 0,
        theaterPlay: 0,
        gachaPlay: 0,
        cleanup: 0,
        customVideo: 0,
        offlineBoot: 0,
    };
}

export function loadOfflineMiracleProgress(): OfflineMiracleProgress {
    const today = getDateKey();
    try {
        const raw = localStorage.getItem(OFFLINE_PROGRESS_KEY);
        if (!raw) throw new Error("empty");
        const parsed = JSON.parse(raw) as Partial<OfflineMiracleProgress>;
        const base: OfflineMiracleProgress = {
            dateKey: parsed.dateKey === today ? today : today,
            actions: createEmptyActions(),
            unlockedTitleIds: Array.isArray(parsed.unlockedTitleIds) ? parsed.unlockedTitleIds.filter((x): x is string => typeof x === "string") : [],
            lastUpdatedAt: Number(parsed.lastUpdatedAt ?? 0),
        };

        if (parsed.dateKey === today && parsed.actions && typeof parsed.actions === "object") {
            for (const key of Object.keys(base.actions) as OfflineMiracleAction[]) {
                base.actions[key] = Math.max(0, Number(parsed.actions[key] ?? 0));
            }
        }

        return base;
    } catch {
        return { dateKey: today, actions: createEmptyActions(), unlockedTitleIds: [], lastUpdatedAt: 0 };
    }
}

export function saveOfflineMiracleProgress(progress: OfflineMiracleProgress): void {
    try {
        localStorage.setItem(OFFLINE_PROGRESS_KEY, JSON.stringify(progress));
    } catch {
        // 保存失敗時もゲーム本体は続行します。
    }
}

export function recordOfflineMiracleAction(action: OfflineMiracleAction, delta = 1): OfflineMiracleProgress {
    const progress = loadOfflineMiracleProgress();
    progress.actions[action] = Math.max(0, Number(progress.actions[action] ?? 0) + delta);
    progress.lastUpdatedAt = Date.now();
    saveOfflineMiracleProgress(progress);
    return progress;
}

export function getOfflineMiracleMissions(progress = loadOfflineMiracleProgress()): OfflineMissionDef[] {
    const a = progress.actions;
    return [
        {
            id: "open-book",
            label: "保管庫を確認する",
            description: "オフライン図鑑または研究所ホームを1回開く",
            current: a.bookOpen,
            target: 1,
            done: a.bookOpen >= 1,
            reward: "研究ポイント +10",
        },
        {
            id: "save-video",
            label: "奇跡データを封印する",
            description: "動画を1本以上保存する",
            current: a.saveVideo,
            target: 1,
            done: a.saveVideo >= 1,
            reward: "保存研究EXP +20",
        },
        {
            id: "test-play",
            label: "保存済み演出を検査する",
            description: "保存済み動画を1回テスト再生する",
            current: a.testPlay,
            target: 1,
            done: a.testPlay >= 1,
            reward: "称号解放率アップ",
        },
        {
            id: "theater-or-gacha",
            label: "地下シアターを起動する",
            description: "ランダム鑑賞またはオフラインガチャを1回使う",
            current: a.theaterPlay + a.gachaPlay,
            target: 1,
            done: a.theaterPlay + a.gachaPlay >= 1,
            reward: "オフライン運 +1",
        },
    ];
}

export function getOfflineMiracleTitles(catalog: OfflineMiracleCatalog, progress = loadOfflineMiracleProgress()): OfflineTitleDef[] {
    const bytes = catalog.cachedBytes;
    const count = catalog.cachedItems.length;
    const actions = progress.actions;
    const customCount = catalog.cachedItems.filter((item) => item.assetId.startsWith("user-video-")).length;

    return [
        { id: "first-seal", label: "初めての封印者", description: "動画演出を1本以上保存した", unlocked: count >= 1 },
        { id: "ten-seals", label: "十封印の研究員", description: "動画演出を10本以上保存した", unlocked: count >= 10 },
        { id: "hundred-mb", label: "100MBを預かる者", description: "保存容量が100MBを超えた", unlocked: bytes >= 100 * 1024 * 1024 },
        { id: "one-gb", label: "1GB保管官", description: "保存容量が1GBを超えた", unlocked: bytes >= 1024 * 1024 * 1024 },
        { id: "offline-operator", label: "通信断絶の研究員", description: "オフラインイベントを経験した", unlocked: actions.offlineBoot >= 1 },
        { id: "theater-master", label: "地下シアター支配人", description: "ランダム鑑賞を3回以上使った", unlocked: actions.theaterPlay >= 3 },
        { id: "gacha-priest", label: "封印ガチャ祈祷師", description: "オフラインガチャを3回以上使った", unlocked: actions.gachaPlay >= 3 },
        { id: "custom-director", label: "自作演出監督", description: "自分の動画を1本以上登録した", unlocked: customCount >= 1 || actions.customVideo >= 1 },
        { id: "cleaner", label: "保管庫整備士", description: "ストレージ整理を1回以上行った", unlocked: actions.cleanup >= 1 },
        { id: "complete-archive", label: "全演出を持つ者", description: "manifest内の動画をすべて保存した", unlocked: catalog.totalVideoSources > 0 && count >= catalog.totalVideoSources },
    ];
}

export function getNewlyUnlockedOfflineTitleLabels(catalog: OfflineMiracleCatalog): string[] {
    const progress = loadOfflineMiracleProgress();
    const titles = getOfflineMiracleTitles(catalog, progress);
    const known = new Set(progress.unlockedTitleIds);
    const newly = titles.filter((title) => title.unlocked && !known.has(title.id));
    if (newly.length === 0) return [];

    progress.unlockedTitleIds = Array.from(new Set([...progress.unlockedTitleIds, ...newly.map((title) => title.id)]));
    progress.lastUpdatedAt = Date.now();
    saveOfflineMiracleProgress(progress);
    return newly.map((title) => title.label);
}

export function shouldShowOfflineTutorial(): boolean {
    try {
        return localStorage.getItem(OFFLINE_TUTORIAL_KEY) !== "1";
    } catch {
        return true;
    }
}

export function completeOfflineTutorial(): void {
    try {
        localStorage.setItem(OFFLINE_TUTORIAL_KEY, "1");
    } catch {
        // 無視
    }
}
