import {
    clearOfflineMiracleVideos,
    deleteOfflineMiracleVideo,
    formatOfflineBytes,
    getOfflineMiracleCatalog,
    trimOfflineMiracleVideosToBytes,
} from "./offlineCache";
import { getNewlyUnlockedOfflineTitleLabels, recordOfflineMiracleAction } from "./offlineProgress";
import type { RemoteMiracleAsset } from "./types";
import { escapeHtml } from "./utils";
import { getOfflineCatalogDisplayName, getOfflineLabStyles } from "./offlineUi";

type OfflineCatalog = Awaited<ReturnType<typeof getOfflineMiracleCatalog>>;

export interface OfflineStorageController {
    showOfflineStorageAssistPopup: () => Promise<void>;
}

export interface OfflineStorageDependencies {
    isMobile: boolean;
    showPopup: (title: string, html: string) => void;
    showSoftToast: (message: string) => void;
    getOfflineCatalogForUi: () => Promise<{ videos: RemoteMiracleAsset[]; catalog: OfflineCatalog }>;
}

export function createOfflineStorageController(deps: OfflineStorageDependencies): OfflineStorageController {
    const { isMobile, showPopup, showSoftToast, getOfflineCatalogForUi } = deps;

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

    async function showOfflineStorageAssistPopup(): Promise<void> {
        const { catalog } = await getOfflineCatalogForUi();
        const largeRows = catalog.cachedItems.slice().sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 12).map((item) => `
            <div class="offline-lab-list-row" style="display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(100,116,139,.18);">
                <div style="min-width:0;"><b>${escapeHtml(getOfflineCatalogDisplayName(item))}</b><div style="opacity:.64;font-size:.86em;">${escapeHtml(String(item.rank ?? "offline").toUpperCase())}</div></div>
                <div style="font-weight:900;">${formatOfflineBytes(item.sizeBytes)}</div>
                <button class="offline-delete-one-button miracle-home-button" data-url="${escapeHtml(item.url)}">削除</button>
            </div>
        `).join("") || `<div style="padding:14px;opacity:.72;">保存済み動画はまだありません。</div>`;

        showPopup("ストレージ整理アシスト", `
            ${getOfflineLabStyles(isMobile)}
        <div class="miracle-user-card offline-lab-panel" style="border-radius:22px;padding:18px;">
                <div class="offline-lab-card" style="padding:16px;border-radius:20px;background:rgba(15,23,42,.88);color:#fff;">
                    <div style="font-weight:1000;font-size:${isMobile ? "24px" : "22px"};">保管庫メンテナンス</div>
                    <div style="margin-top:8px;">保存済み: <b>${catalog.cachedItems.length}</b> 件 / 容量: <b>${formatOfflineBytes(catalog.cachedBytes)}</b></div>
                </div>
                <div class="offline-lab-button-row" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                    <button id="offline-trim-500mb-button" class="miracle-home-button">500MB以下に調整</button>
                    <button id="offline-trim-1gb-button" class="miracle-home-button">1GB以下に調整</button>
                    <button id="offline-clear-all-button" class="miracle-home-button">全削除</button>
                </div>
                <h3 style="margin:18px 0 8px;">容量が大きい保存済み動画</h3>
                <div class="offline-lab-scroll-box" style="border-radius:18px;background:rgba(255,255,255,.68);padding:4px 14px;max-height:${isMobile ? "48vh" : "420px"};overflow:auto;">${largeRows}</div>
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

    return { showOfflineStorageAssistPopup };
}
