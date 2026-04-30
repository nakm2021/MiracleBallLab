import {
    buildOfflineMiracleVideoPlan,
    clearOfflineMiracleVideos,
    deleteOfflineMiracleVideo,
    downloadOfflineMiracleVideos,
    filterOfflineMiracleDownloadPlan,
    formatOfflineBytes,
    getOfflineMiracleCatalog,
    getOfflineMiracleResearchRank,
    getOfflineMiracleSummary,
    saveCustomOfflineMiracleVideo,
    trimOfflineMiracleVideosToBytes,
    type OfflineMiracleCatalogItem,
} from "./offlineCache";
import {
    completeOfflineTutorial,
    getNewlyUnlockedOfflineTitleLabels,
    getOfflineMiracleMissions,
    getOfflineMiracleTitles,
    loadOfflineMiracleProgress,
    recordOfflineMiracleAction,
    shouldShowOfflineTutorial,
} from "./offlineProgress";
import type { RemoteMiracleAsset, RemoteMiracleAssetSource } from "./types";
import { clamp, escapeHtml } from "./utils";

export type OfflineVideoDownloadMode = "recommended" | "rare" | "all";

export interface OfflineLabContext {
    isMobile: boolean;
    showPopup: (title: string, html: string) => void;
    closePopup: () => void;
    showSoftToast: (message: string) => void;
    stopRemoteMiracleVideo: () => void;
    loadRemoteMiracleAssets: (force?: boolean) => Promise<RemoteMiracleAsset[]>;
    getRemoteMiracleAssetSources: (asset: RemoteMiracleAsset) => RemoteMiracleAssetSource[];
    playRemoteMiracleVideoAsset: (asset: RemoteMiracleAsset, force?: boolean) => Promise<boolean>;
    isHelpOverlayClosed: () => boolean;
}

export interface OfflineLabController {
    showOfflineVideoDownloadPopup: (mode?: OfflineVideoDownloadMode) => Promise<void>;
    showOfflineMiracleBookPopup: () => Promise<void>;
    showOfflineLabHomePopup: () => Promise<void>;
    showOfflineModeEventPopup: () => void;
}

export function createOfflineLabController(context: OfflineLabContext): OfflineLabController {
    const {
        isMobile,
        showPopup,
        closePopup,
        showSoftToast,
        stopRemoteMiracleVideo,
        loadRemoteMiracleAssets,
        getRemoteMiracleAssetSources,
        playRemoteMiracleVideoAsset,
        isHelpOverlayClosed,
    } = context;

function getOfflineUpdatedAtText(updatedAt: number): string {
    if (!updatedAt) return "未保存";
    try {
        return new Date(updatedAt).toLocaleString();
    } catch {
        return "保存済み";
    }
}

async function getOfflineVideoAssetsForUi(force = false): Promise<RemoteMiracleAsset[]> {
    const assets = await loadRemoteMiracleAssets(force);
    return assets.filter((asset) => asset.kind === "video");
}

function getOfflineDownloadModeLabel(mode: OfflineVideoDownloadMode): string {
    if (mode === "recommended") return "おすすめ保存";
    if (mode === "rare") return "レア演出だけ保存";
    return "全部保存";
}

function getOfflineRankBadgeStyle(rank?: string): string {
    const r = String(rank ?? "common").toUpperCase();
    if (r === "GOD" || r === "EX" || r === "SECRET") return "background:linear-gradient(135deg,#7c2d12,#facc15,#7e22ce);color:#fff;";
    if (r === "UR" || r === "SSR") return "background:linear-gradient(135deg,#1e3a8a,#22d3ee);color:#fff;";
    if (r === "SR" || r === "RARE") return "background:linear-gradient(135deg,#166534,#bef264);color:#102a10;";
    return "background:rgba(100,116,139,.16);color:#334155;";
}

function getOfflineProgressHtml(percent: number): string {
    const safePercent = clamp(percent, 0, 100);
    return `
        <div style="height:18px;border-radius:999px;background:rgba(15,23,42,.12);overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.18);">
            <div style="width:${safePercent}%;height:100%;border-radius:999px;background:linear-gradient(90deg,#22c55e,#84cc16,#facc15);transition:width .25s ease;"></div>
        </div>
    `;
}

async function showOfflineVideoDownloadPopup(mode: OfflineVideoDownloadMode = "recommended"): Promise<void> {
    showPopup("オフライン動画保存", `
        <div class="miracle-user-card" style="border-radius:22px;padding:18px;background:linear-gradient(135deg,rgba(15,23,42,.92),rgba(49,46,129,.82));color:#fff;">
            <p style="margin:0;font-weight:1000;font-size:${isMobile ? "22px" : "20px"};">奇跡データを調査中...</p>
            <p style="margin:8px 0 0;opacity:.82;line-height:1.7;">研究所の保管庫を開き、保存できる動画演出と必要容量を計算しています。</p>
        </div>
    `);

    const videos = await getOfflineVideoAssetsForUi(true);

    if (videos.length === 0) {
        showPopup("オフライン動画保存", `
            <div class="miracle-user-card" style="border-radius:22px;padding:18px;">
                <p style="margin:0;font-weight:900;">保存対象の動画が見つかりませんでした。</p>
                <p style="margin:8px 0 0;opacity:.72;">manifest.json に <code>kind: "video"</code> の素材があるか確認してください。</p>
            </div>
        `);
        return;
    }

    const basePlan = await buildOfflineMiracleVideoPlan(videos, getRemoteMiracleAssetSources);
    const plan = filterOfflineMiracleDownloadPlan(basePlan, mode);
    const summary = await getOfflineMiracleSummary();
    const rank = getOfflineMiracleResearchRank(summary.cachedBytes);

    if (!plan.supported) {
        showPopup("オフライン動画保存", `
            <div class="miracle-user-card" style="border-radius:22px;padding:18px;">
                <p style="margin:0;font-weight:900;">このブラウザでは動画保存を利用できません。</p>
                <p style="margin:8px 0 0;opacity:.72;">Chrome / Edge / Safari の通常ブラウザ、またはHTTPS配信で試してください。</p>
            </div>
        `);
        return;
    }

    const unknownText = plan.unknownCount > 0
        ? `<div style="margin-top:8px;color:#92400e;font-weight:900;">サイズ不明の動画が ${plan.unknownCount} 件あります。実際の通信量は表示より増える可能性があります。</div>`
        : "";
    const allCachedText = plan.downloadSources.length === 0
        ? `<div style="margin-top:10px;padding:12px;border-radius:16px;background:rgba(34,197,94,.14);font-weight:900;">この保存モードの対象はすべて保管済みです。</div>`
        : "";
    const nextRankText = rank.nextBytes === null
        ? "最高ランク到達"
        : `次: ${escapeHtml(rank.nextLabel)} まで ${formatOfflineBytes(Math.max(0, rank.nextBytes - summary.cachedBytes))}`;

    showPopup("オフライン動画保存", `
        <div class="miracle-user-card" style="border-radius:22px;padding:18px;">
            <div style="padding:16px;border-radius:20px;background:linear-gradient(135deg,rgba(30,64,175,.90),rgba(124,58,237,.82));color:#fff;box-shadow:0 14px 34px rgba(30,41,59,.18);">
                <div style="font-weight:1000;font-size:${isMobile ? "24px" : "22px"};">奇跡保管庫</div>
                <div style="margin-top:6px;opacity:.86;line-height:1.6;">保存すると、通信がない場所でも保管済み動画演出を優先再生します。</div>
                <div style="margin-top:12px;font-weight:1000;">現在ランク: ${escapeHtml(rank.label)}</div>
                ${getOfflineProgressHtml(rank.progressRatio * 100)}
                <div style="margin-top:6px;opacity:.86;font-size:.9em;">${nextRankText}</div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                <button id="offline-mode-recommended" class="miracle-home-button ${mode === "recommended" ? "miracle-home-primary" : ""}">おすすめ保存</button>
                <button id="offline-mode-rare" class="miracle-home-button ${mode === "rare" ? "miracle-home-primary" : ""}">レア演出だけ保存</button>
                <button id="offline-mode-all" class="miracle-home-button ${mode === "all" ? "miracle-home-primary" : ""}">全部保存</button>
            </div>
            <div style="display:grid;grid-template-columns:${isMobile ? "1fr" : "repeat(2,minmax(0,1fr))"};gap:12px;margin-top:14px;">
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.68);"><div style="opacity:.68;">manifest内の動画URL</div><b style="font-size:26px;">${plan.sources.length}</b></div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.68);"><div style="opacity:.68;">保存済み</div><b style="font-size:26px;">${plan.cachedCount}</b></div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.68);"><div style="opacity:.68;">${escapeHtml(getOfflineDownloadModeLabel(mode))}</div><b style="font-size:26px;">${plan.downloadSources.length} 件</b></div>
                <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.68);"><div style="opacity:.68;">今回の推定容量</div><b style="font-size:26px;">${formatOfflineBytes(plan.knownBytes)}${plan.unknownCount > 0 ? "+α" : ""}</b></div>
            </div>
            ${unknownText}
            ${allCachedText}
            <div style="margin-top:12px;opacity:.72;">現在の保存容量: <b>${formatOfflineBytes(summary.cachedBytes)}</b> / 最終保存: ${escapeHtml(getOfflineUpdatedAtText(summary.updatedAt))}</div>
            <div id="offline-video-progress" style="margin-top:14px;min-height:42px;font-weight:900;"></div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;">
                <button id="offline-video-download-button" class="miracle-home-button miracle-home-primary" ${plan.downloadSources.length === 0 ? "disabled" : ""}>確認して保存開始</button>
                <button id="offline-video-book-button" class="miracle-home-button">図鑑を見る</button>
                <button id="offline-video-clear-button" class="miracle-home-button">保存済み動画を削除</button>
            </div>
            <p style="margin-bottom:0;opacity:.66;font-size:.92em;">ブラウザのサイトデータ削除や容量不足があると、保存済み動画は消える場合があります。</p>
        </div>
    `);

    (document.getElementById("offline-mode-recommended") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineVideoDownloadPopup("recommended"); });
    (document.getElementById("offline-mode-rare") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineVideoDownloadPopup("rare"); });
    (document.getElementById("offline-mode-all") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineVideoDownloadPopup("all"); });
    (document.getElementById("offline-video-book-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineMiracleBookPopup(); });

    const progress = document.getElementById("offline-video-progress") as HTMLDivElement | null;
    const downloadButton = document.getElementById("offline-video-download-button") as HTMLButtonElement | null;
    const clearButton = document.getElementById("offline-video-clear-button") as HTMLButtonElement | null;

    if (downloadButton) {
        downloadButton.onclick = async () => {
            const confirmText = plan.unknownCount > 0
                ? `${getOfflineDownloadModeLabel(mode)}: 推定 ${formatOfflineBytes(plan.knownBytes)} + サイズ不明 ${plan.unknownCount} 件を保存します。よろしいですか？`
                : `${getOfflineDownloadModeLabel(mode)}: 推定 ${formatOfflineBytes(plan.knownBytes)} を保存します。よろしいですか？`;
            if (!window.confirm(confirmText)) return;

            downloadButton.disabled = true;
            if (clearButton) clearButton.disabled = true;
            if (progress) progress.innerHTML = `<div>奇跡データを封印中...</div>${getOfflineProgressHtml(0)}<div style="margin-top:6px;opacity:.75;">研究所に動画演出を保管しています。</div>`;

            try {
                const beforeSaveCount = plan.downloadSources.length;
                const result = await downloadOfflineMiracleVideos(plan, (p) => {
                    if (!progress) return;
                    const percent = p.total > 0 ? (p.done / p.total) * 100 : 100;
                    progress.innerHTML = `<div>封印中 ${p.done} / ${p.total} ... ${formatOfflineBytes(p.downloadedBytes)}</div>${getOfflineProgressHtml(percent)}<div style="margin-top:6px;opacity:.72;word-break:break-all;font-size:.86em;">${escapeHtml(p.currentUrl.split("/").pop() ?? p.currentUrl)}</div>`;
                });
                const newRank = getOfflineMiracleResearchRank(result.cachedBytes);
                if (progress) progress.innerHTML = `<div>保存成功: ${result.cachedCount} 件 / ${formatOfflineBytes(result.cachedBytes)}</div>${getOfflineProgressHtml(100)}<div style="margin-top:6px;color:#166534;">研究ランク: ${escapeHtml(newRank.label)}</div>`;
                recordOfflineMiracleAction("saveVideo", Math.max(1, beforeSaveCount));
                await showOfflineTitleUnlockToast();
                showSoftToast("オフライン動画保存が完了しました");
            } catch (error) {
                console.error("[Miracle Offline] video download failed", error);
                if (progress) progress.textContent = `保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`;
                showSoftToast("オフライン動画保存に失敗しました");
            } finally {
                if (clearButton) clearButton.disabled = false;
            }
        };
    }

    if (clearButton) {
        clearButton.onclick = async () => {
            if (!window.confirm("保存済みの動画演出を削除します。よろしいですか？")) return;
            clearButton.disabled = true;
            if (progress) progress.textContent = "削除中...";
            await clearOfflineMiracleVideos();
            if (progress) progress.textContent = "保存済み動画を削除しました。";
            showSoftToast("保存済み動画を削除しました");
            if (downloadButton) downloadButton.disabled = false;
            clearButton.disabled = false;
        };
    }
}

async function showOfflineMiracleBookPopup(): Promise<void> {
    recordOfflineMiracleAction("bookOpen");
    showPopup("オフライン演出図鑑", `
        <div class="miracle-user-card" style="border-radius:22px;padding:18px;">
            <p style="margin:0;font-weight:900;">保存済み動画を確認しています...</p>
        </div>
    `);

    const videos = await getOfflineVideoAssetsForUi(false);
    const catalog = await getOfflineMiracleCatalog(videos, getRemoteMiracleAssetSources);
    const rank = getOfflineMiracleResearchRank(catalog.cachedBytes);

    if (!catalog.supported) {
        showPopup("オフライン演出図鑑", `
            <div class="miracle-user-card" style="border-radius:22px;padding:18px;">
                <p style="margin:0;font-weight:900;">このブラウザではオフライン図鑑を利用できません。</p>
            </div>
        `);
        return;
    }

    const rankRows = Object.entries(catalog.rankCounts).sort(([a], [b]) => b.localeCompare(a)).map(([rankName, count]) => `
        <div style="padding:12px;border-radius:16px;background:rgba(255,255,255,.68);display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center;">
            <span style="padding:5px 10px;border-radius:999px;font-weight:1000;${getOfflineRankBadgeStyle(rankName)}">${escapeHtml(rankName)}</span>
            <div style="font-weight:900;">${count.cached} / ${count.total}<div style="font-size:.84em;opacity:.65;">${formatOfflineBytes(count.bytes)}</div></div>
        </div>
    `).join("") || `<div style="opacity:.7;">manifest情報がまだありません。</div>`;

    const cachedRows = catalog.cachedItems.length === 0
        ? `<div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.68);font-weight:900;">まだ保存済み動画がありません。「動画保存」から保管してください。</div>`
        : catalog.cachedItems.slice(0, 80).map((item, index) => `
            <div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;">
                <div style="min-width:0;">
                    <div style="font-weight:1000;"><span style="padding:4px 9px;border-radius:999px;${getOfflineRankBadgeStyle(item.rank)}">${escapeHtml(String(item.rank ?? "common").toUpperCase())}</span> ${index + 1}. ${escapeHtml(getOfflineCatalogDisplayName(item))}</div>
                    <div style="margin-top:4px;opacity:.70;font-size:.88em;">${formatOfflineBytes(item.sizeBytes)} / ${escapeHtml(getOfflineUpdatedAtText(item.cachedAt))}</div>
                    <div style="margin-top:4px;opacity:.52;font-size:.78em;word-break:break-all;">${escapeHtml(item.url)}</div>
                </div>
                <button class="offline-video-test-button miracle-home-button" data-url="${escapeHtml(item.url)}">再生テスト</button>
            </div>
        `).join("");

    const nextRankText = rank.nextBytes === null
        ? "最高ランク到達"
        : `次: ${escapeHtml(rank.nextLabel)} まで ${formatOfflineBytes(Math.max(0, rank.nextBytes - catalog.cachedBytes))}`;

    showPopup("オフライン演出図鑑", `
        <div class="miracle-user-card" style="border-radius:22px;padding:18px;">
            <div style="padding:16px;border-radius:22px;background:linear-gradient(135deg,rgba(8,47,73,.92),rgba(88,28,135,.82));color:#fff;">
                <div style="font-weight:1000;font-size:${isMobile ? "24px" : "22px"};">オフライン研究所</div>
                <div style="margin-top:8px;display:grid;grid-template-columns:${isMobile ? "1fr" : "repeat(3,minmax(0,1fr))"};gap:10px;">
                    <div><div style="opacity:.74;">保存済み</div><b style="font-size:24px;">${catalog.cachedItems.length} / ${catalog.totalVideoSources}</b></div>
                    <div><div style="opacity:.74;">保存容量</div><b style="font-size:24px;">${formatOfflineBytes(catalog.cachedBytes)}</b></div>
                    <div><div style="opacity:.74;">研究ランク</div><b style="font-size:24px;">${escapeHtml(rank.label)}</b></div>
                </div>
                <div style="margin-top:12px;">${getOfflineProgressHtml(rank.progressRatio * 100)}</div>
                <div style="margin-top:6px;opacity:.86;">${nextRankText}</div>
            </div>
            <h3 style="margin:18px 0 8px;">レア度別の保管状況</h3>
            <div style="display:grid;grid-template-columns:${isMobile ? "1fr" : "repeat(2,minmax(0,1fr))"};gap:10px;">${rankRows}</div>
            <h3 style="margin:18px 0 8px;">保存済み動画の再生テスト</h3>
            <div style="border-radius:18px;background:rgba(255,255,255,.70);padding:4px 14px;max-height:${isMobile ? "48vh" : "420px"};overflow:auto;">${cachedRows}</div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
                <button id="offline-book-download-button" class="miracle-home-button miracle-home-primary">動画保存へ</button>
                <button id="offline-book-stop-button" class="miracle-home-button">動画停止</button>
            </div>
        </div>
    `);

    (document.getElementById("offline-book-download-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineVideoDownloadPopup("recommended"); });
    (document.getElementById("offline-book-stop-button") as HTMLButtonElement | null)?.addEventListener("click", () => stopRemoteMiracleVideo());
    document.querySelectorAll<HTMLButtonElement>(".offline-video-test-button").forEach((button) => {
        button.onclick = () => {
            const item = catalog.cachedItems.find((x) => x.url === button.dataset.url);
            if (!item) {
                showSoftToast("対象動画が見つかりません");
                return;
            }
            showSoftToast("保存済み動画を再生テストします");
            void playOfflineCatalogItem(item, "testPlay");
        };
    });
}

function createOfflineAssetFromCatalogItem(item: OfflineMiracleCatalogItem): RemoteMiracleAsset {
    return {
        id: item.assetId,
        kind: "video",
        rank: item.rank || (item.isUserVideo ? "custom" : "offline"),
        url: item.url,
        mimeType: item.url.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4",
        opacity: 0.58,
        volume: 0.45,
        weight: 1,
        tags: item.isUserVideo ? ["user", "offline"] : ["offline"],
    };
}

function getOfflineCatalogDisplayName(item: OfflineMiracleCatalogItem): string {
    return item.label || item.assetId || item.url.split("/").pop() || "保存済み動画";
}

async function getOfflineCatalogForUi(): Promise<{ videos: RemoteMiracleAsset[]; catalog: Awaited<ReturnType<typeof getOfflineMiracleCatalog>> }> {
    const videos = await getOfflineVideoAssetsForUi(false);
    const catalog = await getOfflineMiracleCatalog(videos, getRemoteMiracleAssetSources);
    return { videos, catalog };
}

function renderOfflineMissionRows(): string {
    const missions = getOfflineMiracleMissions(loadOfflineMiracleProgress());
    return missions.map((mission) => {
        const percent = clamp((mission.current / Math.max(1, mission.target)) * 100, 0, 100);
        return `
            <div style="padding:12px;border-radius:18px;background:${mission.done ? "rgba(34,197,94,.18)" : "rgba(255,255,255,.68)"};border:1px solid rgba(100,116,139,.18);">
                <div style="display:flex;justify-content:space-between;gap:10px;font-weight:1000;"><span>${mission.done ? "✅" : "🧪"} ${escapeHtml(mission.label)}</span><span>${Math.min(mission.current, mission.target)} / ${mission.target}</span></div>
                <div style="margin-top:5px;opacity:.72;font-size:.9em;">${escapeHtml(mission.description)}</div>
                <div style="margin-top:8px;">${getOfflineProgressHtml(percent)}</div>
                <div style="margin-top:5px;font-weight:900;color:#166534;">${escapeHtml(mission.reward)}</div>
            </div>`;
    }).join("");
}

function renderOfflineTitleRows(catalog: Awaited<ReturnType<typeof getOfflineMiracleCatalog>>): string {
    const titles = getOfflineMiracleTitles(catalog, loadOfflineMiracleProgress());
    return titles.map((title) => `
        <div style="padding:12px;border-radius:18px;background:${title.unlocked ? "linear-gradient(135deg,rgba(250,204,21,.24),rgba(34,197,94,.16))" : "rgba(148,163,184,.18)"};border:1px solid rgba(100,116,139,.18);">
            <div style="font-weight:1000;">${title.unlocked ? "🏅" : "🔒"} ${escapeHtml(title.label)}</div>
            <div style="opacity:.72;font-size:.9em;margin-top:4px;">${escapeHtml(title.description)}</div>
        </div>
    `).join("");
}

async function showOfflineTitleUnlockToast(): Promise<void> {
    try {
        const { catalog } = await getOfflineCatalogForUi();
        const labels = getNewlyUnlockedOfflineTitleLabels(catalog);
        if (labels.length > 0) {
            showSoftToast(`称号解放: ${labels[0]}${labels.length > 1 ? ` ほか${labels.length - 1}件` : ""}`);
        }
    } catch {
        // 称号チェック失敗は無視します。
    }
}

async function showOfflineLabHomePopup(): Promise<void> {
    recordOfflineMiracleAction("bookOpen");
    showPopup("オフライン研究所", `
        <div class="miracle-user-card" style="border-radius:22px;padding:18px;">
            <p style="margin:0;font-weight:900;">オフライン研究所を起動しています...</p>
        </div>
    `);

    const { catalog } = await getOfflineCatalogForUi();
    const rank = getOfflineMiracleResearchRank(catalog.cachedBytes);
    const nextRankText = rank.nextBytes === null
        ? "最高ランク到達"
        : `次: ${escapeHtml(rank.nextLabel)} まで ${formatOfflineBytes(Math.max(0, rank.nextBytes - catalog.cachedBytes))}`;
    const tutorialHtml = shouldShowOfflineTutorial()
        ? `<div style="padding:14px;border-radius:20px;background:linear-gradient(135deg,rgba(250,204,21,.24),rgba(59,130,246,.18));border:1px solid rgba(59,130,246,.22);margin-bottom:14px;">
                <div style="font-weight:1000;font-size:${isMobile ? "22px" : "20px"};">初回オフライン準備チュートリアル</div>
                <ol style="margin:8px 0 0;padding-left:1.4em;line-height:1.75;">
                    <li>まず「おすすめ保存」で動画演出を少し保管します。</li>
                    <li>図鑑で保存済み件数と研究ランクを確認します。</li>
                    <li>ランダム鑑賞またはガチャで保存済み動画を再生します。</li>
                    <li>容量が大きくなったらストレージ整理で軽くします。</li>
                </ol>
                <button id="offline-tutorial-done-button" class="miracle-home-button miracle-home-primary" style="margin-top:10px;">チュートリアル完了</button>
            </div>`
        : "";

    showPopup("オフライン研究所", `
        <div class="miracle-user-card" style="border-radius:22px;padding:18px;">
            ${tutorialHtml}
            <div style="padding:16px;border-radius:22px;background:linear-gradient(135deg,rgba(8,47,73,.92),rgba(88,28,135,.82));color:#fff;">
                <div style="font-weight:1000;font-size:${isMobile ? "26px" : "24px"};">地下オフライン研究所</div>
                <div style="display:grid;grid-template-columns:${isMobile ? "1fr" : "repeat(3,minmax(0,1fr))"};gap:10px;margin-top:12px;">
                    <div><div style="opacity:.74;">保存済み</div><b style="font-size:24px;">${catalog.cachedItems.length} / ${catalog.totalVideoSources}</b></div>
                    <div><div style="opacity:.74;">保存容量</div><b style="font-size:24px;">${formatOfflineBytes(catalog.cachedBytes)}</b></div>
                    <div><div style="opacity:.74;">研究ランク</div><b style="font-size:24px;">${escapeHtml(rank.label)}</b></div>
                </div>
                <div style="margin-top:12px;">${getOfflineProgressHtml(rank.progressRatio * 100)}</div>
                <div style="margin-top:6px;opacity:.86;">${nextRankText}</div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                <button id="offline-home-save-button" class="miracle-home-button miracle-home-primary">おすすめ保存</button>
                <button id="offline-home-book-button" class="miracle-home-button">図鑑</button>
                <button id="offline-home-theater-button" class="miracle-home-button">ランダム鑑賞</button>
                <button id="offline-home-gacha-button" class="miracle-home-button">オフラインガチャ</button>
                <button id="offline-home-cleanup-button" class="miracle-home-button">ストレージ整理</button>
                <button id="offline-home-custom-button" class="miracle-home-button">自分の動画登録</button>
            </div>
            <h3 style="margin:18px 0 8px;">今日のオフライン研究ミッション</h3>
            <div style="display:grid;grid-template-columns:${isMobile ? "1fr" : "repeat(2,minmax(0,1fr))"};gap:10px;">${renderOfflineMissionRows()}</div>
            <h3 style="margin:18px 0 8px;">オフライン限定称号</h3>
            <div style="display:grid;grid-template-columns:${isMobile ? "1fr" : "repeat(2,minmax(0,1fr))"};gap:10px;">${renderOfflineTitleRows(catalog)}</div>
        </div>
    `);

    (document.getElementById("offline-tutorial-done-button") as HTMLButtonElement | null)?.addEventListener("click", () => {
        completeOfflineTutorial();
        showSoftToast("オフライン準備チュートリアルを完了しました");
        void showOfflineLabHomePopup();
    });
    (document.getElementById("offline-home-save-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineVideoDownloadPopup("recommended"); });
    (document.getElementById("offline-home-book-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineMiracleBookPopup(); });
    (document.getElementById("offline-home-theater-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void playOfflineRandomTheater(); });
    (document.getElementById("offline-home-gacha-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineGachaPopup(); });
    (document.getElementById("offline-home-cleanup-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineStorageAssistPopup(); });
    (document.getElementById("offline-home-custom-button") as HTMLButtonElement | null)?.addEventListener("click", () => { showCustomOfflineVideoPopup(); });
}

async function pickOfflineCatalogItem(preferRare = false): Promise<OfflineMiracleCatalogItem | null> {
    const { catalog } = await getOfflineCatalogForUi();
    const items = catalog.cachedItems;
    if (items.length === 0) return null;
    const scoreRank = (rank?: string): number => {
        const r = String(rank ?? "common").toUpperCase();
        if (r === "GOD" || r === "SECRET" || r === "EX") return 100;
        if (r === "UR" || r === "SSR") return 80;
        if (r === "SR" || r === "RARE") return 60;
        if (r === "CUSTOM") return 55;
        return 10;
    };
    const pool = preferRare ? items.filter((item) => scoreRank(item.rank) >= 60) : items;
    const target = pool.length > 0 ? pool : items;
    return target[Math.floor(Math.random() * target.length)] ?? null;
}

async function playOfflineCatalogItem(item: OfflineMiracleCatalogItem, action: "testPlay" | "theaterPlay" | "gachaPlay"): Promise<void> {
    recordOfflineMiracleAction(action);
    closePopup();
    const asset = createOfflineAssetFromCatalogItem(item);
    const ok = await playRemoteMiracleVideoAsset(asset, true);
    if (ok) {
        await showOfflineTitleUnlockToast();
    } else {
        showSoftToast("保存済み動画を再生できませんでした。保管庫の整理を試してください。");
    }
}

async function playOfflineRandomTheater(): Promise<void> {
    const item = await pickOfflineCatalogItem(false);
    if (!item) {
        showSoftToast("保存済み動画がありません。先におすすめ保存を実行してください。");
        void showOfflineVideoDownloadPopup("recommended");
        return;
    }
    showSoftToast(`保存済み奇跡シアター: ${getOfflineCatalogDisplayName(item)}`);
    await playOfflineCatalogItem(item, "theaterPlay");
}

async function showOfflineGachaPopup(): Promise<void> {
    const item = await pickOfflineCatalogItem(true);
    if (!item) {
        showPopup("オフライン専用ガチャ", `
            <div class="miracle-user-card" style="border-radius:22px;padding:18px;">
                <p style="margin:0;font-weight:900;">保存済み動画がありません。</p>
                <p style="margin:8px 0 0;opacity:.72;">先におすすめ保存を行うと、通信なしでもガチャ演出を楽しめます。</p>
                <button id="offline-gacha-save-button" class="miracle-home-button miracle-home-primary" style="margin-top:12px;">おすすめ保存へ</button>
            </div>
        `);
        (document.getElementById("offline-gacha-save-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineVideoDownloadPopup("recommended"); });
        return;
    }

    showPopup("オフライン専用ガチャ", `
        <div class="miracle-user-card" style="border-radius:22px;padding:18px;text-align:center;background:linear-gradient(135deg,rgba(15,23,42,.94),rgba(88,28,135,.86));color:#fff;">
            <div style="font-size:${isMobile ? "42px" : "56px"};font-weight:1000;text-shadow:0 0 20px rgba(250,204,21,.8);">封印解除</div>
            <p style="line-height:1.8;opacity:.88;">保存済み奇跡データから、今回の演出を抽選しました。</p>
            <div style="margin:14px auto;padding:14px;border-radius:20px;background:rgba(255,255,255,.12);max-width:620px;">
                <div style="font-size:14px;opacity:.72;">RESULT</div>
                <div style="font-size:${isMobile ? "22px" : "26px"};font-weight:1000;">${escapeHtml(String(item.rank ?? "OFFLINE").toUpperCase())} / ${escapeHtml(getOfflineCatalogDisplayName(item))}</div>
                <div style="margin-top:5px;opacity:.72;">${formatOfflineBytes(item.sizeBytes)}</div>
            </div>
            <button id="offline-gacha-play-button" class="miracle-home-button miracle-home-primary">演出を再生</button>
        </div>
    `);
    (document.getElementById("offline-gacha-play-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void playOfflineCatalogItem(item, "gachaPlay"); });
}

async function showOfflineStorageAssistPopup(): Promise<void> {
    const { catalog } = await getOfflineCatalogForUi();
    const largeRows = catalog.cachedItems.slice().sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 12).map((item) => `
        <div style="display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(100,116,139,.18);">
            <div style="min-width:0;"><b>${escapeHtml(getOfflineCatalogDisplayName(item))}</b><div style="opacity:.64;font-size:.86em;">${escapeHtml(String(item.rank ?? "offline").toUpperCase())}</div></div>
            <div style="font-weight:900;">${formatOfflineBytes(item.sizeBytes)}</div>
            <button class="offline-delete-one-button miracle-home-button" data-url="${escapeHtml(item.url)}">削除</button>
        </div>
    `).join("") || `<div style="padding:14px;opacity:.72;">保存済み動画はまだありません。</div>`;

    showPopup("ストレージ整理アシスト", `
        <div class="miracle-user-card" style="border-radius:22px;padding:18px;">
            <div style="padding:16px;border-radius:20px;background:rgba(15,23,42,.88);color:#fff;">
                <div style="font-weight:1000;font-size:${isMobile ? "24px" : "22px"};">保管庫メンテナンス</div>
                <div style="margin-top:8px;">保存済み: <b>${catalog.cachedItems.length}</b> 件 / 容量: <b>${formatOfflineBytes(catalog.cachedBytes)}</b></div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                <button id="offline-trim-500mb-button" class="miracle-home-button">500MB以下に調整</button>
                <button id="offline-trim-1gb-button" class="miracle-home-button">1GB以下に調整</button>
                <button id="offline-clear-all-button" class="miracle-home-button">全削除</button>
            </div>
            <h3 style="margin:18px 0 8px;">容量が大きい保存済み動画</h3>
            <div style="border-radius:18px;background:rgba(255,255,255,.68);padding:4px 14px;max-height:${isMobile ? "48vh" : "420px"};overflow:auto;">${largeRows}</div>
        </div>
    `);

    const trim = async (limit: number) => {
        const deleted = await trimOfflineMiracleVideosToBytes(limit);
        recordOfflineMiracleAction("cleanup");
        await showOfflineTitleUnlockToast();
        showSoftToast(`整理完了: ${deleted} 件削除しました`);
        void showOfflineStorageAssistPopup();
    };
    (document.getElementById("offline-trim-500mb-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void trim(500 * 1024 * 1024); });
    (document.getElementById("offline-trim-1gb-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void trim(1024 * 1024 * 1024); });
    (document.getElementById("offline-clear-all-button") as HTMLButtonElement | null)?.addEventListener("click", async () => {
        if (!window.confirm("保存済み動画をすべて削除します。よろしいですか？")) return;
        await clearOfflineMiracleVideos();
        recordOfflineMiracleAction("cleanup");
        showSoftToast("保存済み動画をすべて削除しました");
        void showOfflineStorageAssistPopup();
    });
    document.querySelectorAll<HTMLButtonElement>(".offline-delete-one-button").forEach((button) => {
        button.onclick = async () => {
            const url = button.dataset.url;
            if (!url) return;
            await deleteOfflineMiracleVideo(url);
            recordOfflineMiracleAction("cleanup");
            showSoftToast("1件削除しました");
            void showOfflineStorageAssistPopup();
        };
    });
}

function showCustomOfflineVideoPopup(): void {
    showPopup("自分の動画を演出に登録", `
        <div class="miracle-user-card" style="border-radius:22px;padding:18px;">
            <div style="padding:16px;border-radius:20px;background:linear-gradient(135deg,rgba(30,64,175,.18),rgba(34,197,94,.14));">
                <div style="font-weight:1000;font-size:${isMobile ? "24px" : "22px"};">ユーザー動画スロット</div>
                <p style="line-height:1.75;margin:8px 0 0;">手元の mp4 / webm などの動画をブラウザ内に保存し、保存済み動画と同じようにテスト再生・ランダム鑑賞・ガチャ対象にできます。</p>
            </div>
            <label style="display:block;margin-top:14px;font-weight:900;">動画ファイル</label>
            <input id="offline-custom-video-input" type="file" accept="video/*" style="margin-top:8px;width:100%;font-size:18px;" />
            <label style="display:block;margin-top:14px;font-weight:900;">登録レア度</label>
            <select id="offline-custom-video-rank" style="margin-top:8px;font-size:18px;padding:10px;border-radius:14px;">
                <option value="custom">CUSTOM</option>
                <option value="rare">RARE</option>
                <option value="sr">SR</option>
                <option value="ssr">SSR</option>
                <option value="ex">EX</option>
                <option value="god">GOD</option>
            </select>
            <div id="offline-custom-video-status" style="margin-top:12px;min-height:28px;font-weight:900;"></div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                <button id="offline-custom-video-save-button" class="miracle-home-button miracle-home-primary">この動画を登録</button>
                <button id="offline-custom-video-book-button" class="miracle-home-button">図鑑を見る</button>
            </div>
            <p style="margin-bottom:0;opacity:.66;font-size:.92em;">登録した動画はこのブラウザのサイトデータ内に保存されます。容量不足やサイトデータ削除で消える場合があります。</p>
        </div>
    `);

    (document.getElementById("offline-custom-video-book-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineMiracleBookPopup(); });
    (document.getElementById("offline-custom-video-save-button") as HTMLButtonElement | null)?.addEventListener("click", async () => {
        const input = document.getElementById("offline-custom-video-input") as HTMLInputElement | null;
        const select = document.getElementById("offline-custom-video-rank") as HTMLSelectElement | null;
        const status = document.getElementById("offline-custom-video-status") as HTMLDivElement | null;
        const file = input?.files?.[0];
        if (!file) {
            if (status) status.textContent = "動画ファイルを選択してください。";
            return;
        }
        const confirmText = `${file.name} / ${formatOfflineBytes(file.size)} をユーザー動画として保存します。よろしいですか？`;
        if (!window.confirm(confirmText)) return;
        if (status) status.textContent = "ユーザー動画を保管庫へ登録中...";
        try {
            const item = await saveCustomOfflineMiracleVideo(file, select?.value || "custom");
            recordOfflineMiracleAction("customVideo");
            recordOfflineMiracleAction("saveVideo");
            if (status) status.textContent = `登録完了: ${getOfflineCatalogDisplayName(item)} / ${formatOfflineBytes(item.sizeBytes)}`;
            await showOfflineTitleUnlockToast();
            showSoftToast("自分の動画を登録しました");
        } catch (error) {
            console.error("[Miracle Offline] custom video save failed", error);
            if (status) status.textContent = `登録に失敗しました: ${error instanceof Error ? error.message : String(error)}`;
        }
    });
}

function showOfflineModeEventPopup(): void {
    const text = navigator.onLine
        ? "オンラインに復帰しました。通常研究モードに戻ります。"
        : "オフライン研究モード 起動。保存済みの奇跡データだけで実験を続行します。";
    showSoftToast(text);
    if (!navigator.onLine && isHelpOverlayClosed()) {
        recordOfflineMiracleAction("offlineBoot");
        showPopup("オフライン研究モード", `
            <div class="miracle-user-card" style="border-radius:22px;padding:18px;background:linear-gradient(135deg,rgba(15,23,42,.94),rgba(55,48,163,.86));color:#fff;">
                <div style="font-size:${isMobile ? "26px" : "24px"};font-weight:1000;">通信断絶イベント発生</div>
                <p style="line-height:1.7;opacity:.88;">保存済み動画演出を優先し、地下研究所モードで実験を継続します。</p>
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                    <button id="offline-event-book-button" class="miracle-home-button miracle-home-primary">オフライン図鑑を見る</button>
                </div>
            </div>
        `);
        (document.getElementById("offline-event-book-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineMiracleBookPopup(); });
    }
}


    return {
        showOfflineVideoDownloadPopup,
        showOfflineMiracleBookPopup,
        showOfflineLabHomePopup,
        showOfflineModeEventPopup,
    };
}
