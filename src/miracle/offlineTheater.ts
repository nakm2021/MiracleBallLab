import type { OfflineMiracleCatalogItem, getOfflineMiracleCatalog } from "./offlineCache";
import { formatOfflineBytes } from "./offlineCache";
import { getNewlyUnlockedOfflineTitleLabels, recordOfflineMiracleAction } from "./offlineProgress";
import type { RemoteMiracleAsset } from "./types";
import { escapeHtml } from "./utils";
import {
    createOfflineAssetFromCatalogItem,
    getOfflineCatalogDisplayName,
    getOfflineLabStyles,
    type OfflineVideoDownloadMode,
} from "./offlineUi";

export type OfflinePlayAction = "testPlay" | "theaterPlay" | "gachaPlay";

type OfflineCatalog = Awaited<ReturnType<typeof getOfflineMiracleCatalog>>;

export interface OfflineTheaterController {
    playOfflineCatalogItem: (item: OfflineMiracleCatalogItem, action: OfflinePlayAction) => Promise<void>;
    playOfflineRandomTheater: () => Promise<void>;
    showOfflineGachaPopup: () => Promise<void>;
}

export interface OfflineTheaterDependencies {
    isMobile: boolean;
    showPopup: (title: string, html: string) => void;
    closePopup: () => void;
    showSoftToast: (message: string) => void;
    getOfflineCatalogForUi: () => Promise<{ videos: RemoteMiracleAsset[]; catalog: OfflineCatalog }>;
    playRemoteMiracleVideoAsset: (asset: RemoteMiracleAsset, force?: boolean) => Promise<boolean>;
    showOfflineVideoDownloadPopup: (mode?: OfflineVideoDownloadMode) => Promise<void>;
}

export function createOfflineTheaterController(deps: OfflineTheaterDependencies): OfflineTheaterController {
    const {
        isMobile,
        showPopup,
        closePopup,
        showSoftToast,
        getOfflineCatalogForUi,
        playRemoteMiracleVideoAsset,
        showOfflineVideoDownloadPopup,
    } = deps;

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

    async function playOfflineCatalogItem(item: OfflineMiracleCatalogItem, action: OfflinePlayAction): Promise<void> {
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
                ${getOfflineLabStyles(isMobile)}
        <div class="miracle-user-card offline-lab-panel" style="border-radius:22px;padding:18px;">
                    <p style="margin:0;font-weight:900;">保存済み動画がありません。</p>
                    <p style="margin:8px 0 0;opacity:.72;">先におすすめ保存を行うと、通信なしでもガチャ演出を楽しめます。</p>
                    <button id="offline-gacha-save-button" class="miracle-home-button miracle-home-primary" style="margin-top:12px;">おすすめ保存へ</button>
                </div>
            `);
            (document.getElementById("offline-gacha-save-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void showOfflineVideoDownloadPopup("recommended"); });
            return;
        }

        showPopup("オフライン専用ガチャ", `
            ${getOfflineLabStyles(isMobile)}
        <div class="miracle-user-card offline-lab-panel" style="border-radius:22px;padding:18px;text-align:center;background:linear-gradient(135deg,rgba(15,23,42,.94),rgba(88,28,135,.86));color:#fff;">
                <div style="font-size:${isMobile ? "42px" : "56px"};font-weight:1000;text-shadow:0 0 20px rgba(250,204,21,.8);">封印解除</div>
                <p style="line-height:1.8;opacity:.88;">保存済み奇跡データから、今回の演出を抽選しました。</p>
                <div class="offline-lab-card" style="margin:14px auto;padding:14px;border-radius:20px;background:rgba(255,255,255,.12);max-width:620px;">
                    <div style="font-size:14px;opacity:.72;">RESULT</div>
                    <div style="font-size:${isMobile ? "22px" : "26px"};font-weight:1000;">${escapeHtml(String(item.rank ?? "OFFLINE").toUpperCase())} / ${escapeHtml(getOfflineCatalogDisplayName(item))}</div>
                    <div style="margin-top:5px;opacity:.72;">${formatOfflineBytes(item.sizeBytes)}</div>
                </div>
                <button id="offline-gacha-play-button" class="miracle-home-button miracle-home-primary">演出を再生</button>
            </div>
        `);
        (document.getElementById("offline-gacha-play-button") as HTMLButtonElement | null)?.addEventListener("click", () => { void playOfflineCatalogItem(item, "gachaPlay"); });
    }

    return {
        playOfflineCatalogItem,
        playOfflineRandomTheater,
        showOfflineGachaPopup,
    };
}
