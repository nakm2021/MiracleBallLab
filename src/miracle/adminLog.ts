import { saveJsonToStorage } from "./storage";
export type AdminLogEventType =
    | "app_open"
    | "run_start"
    | "run_finish"
    | "miracle"
    | "video_play"
    | "video_skip_lower_rank"
    | "video_fail"
    | "settings_apply"
    | "safe_exit"
    | "admin_unlock";

export type AdminLogEntry = {
    type: AdminLogEventType;
    at: number;
    detail?: string;
    rank?: string;
    label?: string;
    count?: number;
    targetCount?: number;
    speedLabel?: string;
    mode?: string;
};

type AdminStats = {
    version: number;
    createdAt: number;
    updatedAt: number;
    appOpenCount: number;
    runStartCount: number;
    runFinishCount: number;
    safeExitCount: number;
    miracleCount: number;
    videoPlayCount: number;
    videoSkipLowerRankCount: number;
    videoFailCount: number;
    totalFinishedCount: number;
    rankCounts: Record<string, number>;
    dailyOpenCounts: Record<string, number>;
    dailyRunCounts: Record<string, number>;
    dailyMiracleCounts: Record<string, number>;
    lastEvents: AdminLogEntry[];
};

type AdminLogDependencies = {
    getSpeedLabelText: () => string;
    getProbabilityMode: () => string;
    getIsAdminMode: () => boolean;
    showAdminGatePopup: () => void;
    showPopup: (title: string, body: string) => void;
    showSoftToast: (message: string) => void;
    getDateKey: (date?: Date) => string;
    escapeHtml: (value: string | number) => string;
    formatDateTime: (ts: number | undefined) => string;
    getRankScore: (rank: string) => number;
    getIsMobile: () => boolean;
    getUiButtonFontPx: () => number;
};

export type AdminLogApi = {
    recordAdminEvent: (entry: AdminLogEntry) => void;
    showAdminStatsPopup: () => void;
};

const ADMIN_STATS_STORAGE_KEY = "miracle-ball-lab-admin-stats-v1";

function createEmptyAdminStats(): AdminStats {
    const now = Date.now();
    return {
        version: 1,
        createdAt: now,
        updatedAt: now,
        appOpenCount: 0,
        runStartCount: 0,
        runFinishCount: 0,
        safeExitCount: 0,
        miracleCount: 0,
        videoPlayCount: 0,
        videoSkipLowerRankCount: 0,
        videoFailCount: 0,
        totalFinishedCount: 0,
        rankCounts: {},
        dailyOpenCounts: {},
        dailyRunCounts: {},
        dailyMiracleCounts: {},
        lastEvents: [],
    };
}

function loadAdminStats(): AdminStats {
    try {
        const raw = localStorage.getItem(ADMIN_STATS_STORAGE_KEY);
        if (!raw) return createEmptyAdminStats();
        const parsed = JSON.parse(raw) as Partial<AdminStats>;
        const base = createEmptyAdminStats();
        return {
            ...base,
            ...parsed,
            rankCounts: parsed.rankCounts ?? {},
            dailyOpenCounts: parsed.dailyOpenCounts ?? {},
            dailyRunCounts: parsed.dailyRunCounts ?? {},
            dailyMiracleCounts: parsed.dailyMiracleCounts ?? {},
            lastEvents: Array.isArray(parsed.lastEvents) ? parsed.lastEvents.slice(0, 120) : [],
        };
    } catch {
        return createEmptyAdminStats();
    }
}

function incrementAdminCounter(map: Record<string, number>, key: string, amount = 1): void {
    map[key] = (map[key] ?? 0) + amount;
}

function getAdminRate(numerator: number, denominator: number): string {
    if (denominator <= 0) return "0.0%";
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export function createAdminLogApi(deps: AdminLogDependencies): AdminLogApi {
    let adminStats: AdminStats = loadAdminStats();

    function saveAdminStats(): void {
        adminStats.updatedAt = Date.now();
        try {
            saveJsonToStorage(ADMIN_STATS_STORAGE_KEY, adminStats);
        } catch {
            adminStats.lastEvents = adminStats.lastEvents.slice(0, 40);
            saveJsonToStorage(ADMIN_STATS_STORAGE_KEY, adminStats);
        }
    }

    function recordAdminEvent(entry: AdminLogEntry): void {
        const fullEntry: AdminLogEntry = {
            at: entry.at || Date.now(),
            type: entry.type,
            detail: entry.detail,
            rank: entry.rank,
            label: entry.label,
            count: entry.count,
            targetCount: entry.targetCount,
            speedLabel: entry.speedLabel ?? deps.getSpeedLabelText(),
            mode: entry.mode ?? deps.getProbabilityMode(),
        };
        const day = deps.getDateKey(new Date(fullEntry.at));
        if (fullEntry.type === "app_open") {
            adminStats.appOpenCount += 1;
            incrementAdminCounter(adminStats.dailyOpenCounts, day);
        } else if (fullEntry.type === "run_start") {
            adminStats.runStartCount += 1;
            incrementAdminCounter(adminStats.dailyRunCounts, day);
        } else if (fullEntry.type === "run_finish") {
            adminStats.runFinishCount += 1;
            adminStats.totalFinishedCount += Math.max(0, fullEntry.count ?? 0);
        } else if (fullEntry.type === "safe_exit") {
            adminStats.safeExitCount += 1;
        } else if (fullEntry.type === "miracle") {
            adminStats.miracleCount += 1;
            incrementAdminCounter(adminStats.dailyMiracleCounts, day);
            if (fullEntry.rank) incrementAdminCounter(adminStats.rankCounts, fullEntry.rank);
        } else if (fullEntry.type === "video_play") {
            adminStats.videoPlayCount += 1;
        } else if (fullEntry.type === "video_skip_lower_rank") {
            adminStats.videoSkipLowerRankCount += 1;
        } else if (fullEntry.type === "video_fail") {
            adminStats.videoFailCount += 1;
        }
        adminStats.lastEvents = [fullEntry, ...adminStats.lastEvents].slice(0, 120);
        saveAdminStats();
    }

    function getTopAdminDays(map: Record<string, number>): string {
        const rows = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7);
        if (rows.length === 0) return `<div style="opacity:.65;">記録なし</div>`;
        return rows.map(([day, count]) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px dashed rgba(80,90,120,.16);"><span>${deps.escapeHtml(day)}</span><b>${count.toLocaleString()}</b></div>`).join("");
    }

    function getAdminRankRows(): string {
        const rows = Object.entries(adminStats.rankCounts).sort((a, b) => deps.getRankScore(b[0]) - deps.getRankScore(a[0]) || b[1] - a[1]);
        if (rows.length === 0) return `<div style="opacity:.65;">まだレア役の記録はありません。</div>`;
        return rows.map(([rank, count]) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px dashed rgba(80,90,120,.16);"><span>${deps.escapeHtml(rank)}</span><b>${count.toLocaleString()}</b></div>`).join("");
    }

    function getAdminEventRows(): string {
        if (adminStats.lastEvents.length === 0) return `<div style="opacity:.65;">ログなし</div>`;
        return adminStats.lastEvents.slice(0, 35).map((event) => {
            const label = [event.label, event.rank ? `[${event.rank}]` : "", event.detail].filter(Boolean).join(" ");
            return `<div style="padding:8px 0;border-bottom:1px solid rgba(80,90,120,.12);"><b>${deps.escapeHtml(event.type)}</b> <span style="opacity:.68;">${deps.formatDateTime(event.at)}</span><br><span style="opacity:.78;">${deps.escapeHtml(label || "-")}</span></div>`;
        }).join("");
    }

    function showAdminStatsPopup(): void {
        if (!deps.getIsAdminMode()) {
            deps.showAdminGatePopup();
            return;
        }
        const isMobile = deps.getIsMobile();
        const uiButtonFontPx = deps.getUiButtonFontPx();
        const avgFinished = adminStats.runFinishCount > 0 ? Math.round(adminStats.totalFinishedCount / adminStats.runFinishCount).toLocaleString() : "0";
        const body = `
            <p><b>この端末内だけに保存している管理者用ログです。</b> 個人情報や広告IDは保存せず、ローカル分析にしています。</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${isMobile ? "145px" : "170px"},1fr));gap:10px;margin:14px 0;">
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.72);"><div style="opacity:.68;">起動回数</div><b style="font-size:26px;">${adminStats.appOpenCount.toLocaleString()}</b></div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.72);"><div style="opacity:.68;">実行開始</div><b style="font-size:26px;">${adminStats.runStartCount.toLocaleString()}</b></div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.72);"><div style="opacity:.68;">実験完了</div><b style="font-size:26px;">${adminStats.runFinishCount.toLocaleString()}</b></div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.72);"><div style="opacity:.68;">完了率</div><b style="font-size:26px;">${getAdminRate(adminStats.runFinishCount, adminStats.runStartCount)}</b></div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.72);"><div style="opacity:.68;">奇跡回数</div><b style="font-size:26px;">${adminStats.miracleCount.toLocaleString()}</b></div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.72);"><div style="opacity:.68;">動画再生</div><b style="font-size:26px;">${adminStats.videoPlayCount.toLocaleString()}</b></div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.72);"><div style="opacity:.68;">低レア動画スキップ</div><b style="font-size:26px;">${adminStats.videoSkipLowerRankCount.toLocaleString()}</b></div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.72);"><div style="opacity:.68;">平均処理数</div><b style="font-size:26px;">${avgFinished}</b></div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${isMobile ? "230px" : "260px"},1fr));gap:12px;">
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.62);"><h3>ランク別レア役</h3>${getAdminRankRows()}</div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.62);"><h3>日別起動 TOP7</h3>${getTopAdminDays(adminStats.dailyOpenCounts)}</div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.62);"><h3>日別実行 TOP7</h3>${getTopAdminDays(adminStats.dailyRunCounts)}</div>
            </div>
            <h3 style="margin-top:18px;">直近ログ</h3>
            <div style="padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.68);max-height:42vh;overflow:auto;">${getAdminEventRows()}</div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                <button id="admin-log-copy-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:10px 16px;border-radius:999px;border:1px solid rgba(87,112,51,.24);background:linear-gradient(180deg,#dcfce7 0%,#bbf7d0 100%);color:#14532d;cursor:pointer;">JSONコピー</button>
                <button id="admin-log-reset-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:10px 16px;border-radius:999px;border:1px solid rgba(127,29,29,.24);background:linear-gradient(180deg,#fee2e2 0%,#fecaca 100%);color:#7f1d1d;cursor:pointer;">ログ初期化</button>
            </div>`;
        deps.showPopup("管理者ログ", body);
        document.getElementById("admin-log-copy-button")!.onclick = () => {
            void navigator.clipboard?.writeText(JSON.stringify(adminStats, null, 2));
            deps.showSoftToast("管理者ログJSONをコピーしました");
        };
        document.getElementById("admin-log-reset-button")!.onclick = () => {
            adminStats = createEmptyAdminStats();
            saveAdminStats();
            deps.showSoftToast("管理者ログを初期化しました");
            showAdminStatsPopup();
        };
    }

    return { recordAdminEvent, showAdminStatsPopup };
}