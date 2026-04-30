import type { OfflineMiracleCatalogItem } from "./offlineCache";
import type { RemoteMiracleAsset, RemoteMiracleAssetSource } from "./types";
import { clamp } from "./utils";

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

export function getOfflineUpdatedAtText(updatedAt: number): string {
    if (!updatedAt) return "未保存";
    try {
        return new Date(updatedAt).toLocaleString();
    } catch {
        return "保存済み";
    }
}

export function getOfflineDownloadModeLabel(mode: OfflineVideoDownloadMode): string {
    if (mode === "recommended") return "おすすめ保存";
    if (mode === "rare") return "レア演出だけ保存";
    return "全部保存";
}

export function getOfflineRankBadgeStyle(rank?: string): string {
    const r = String(rank ?? "common").toUpperCase();
    if (r === "GOD" || r === "EX" || r === "SECRET") return "background:linear-gradient(135deg,#7c2d12,#facc15,#7e22ce);color:#fff;";
    if (r === "UR" || r === "SSR") return "background:linear-gradient(135deg,#1e3a8a,#22d3ee);color:#fff;";
    if (r === "SR" || r === "RARE") return "background:linear-gradient(135deg,#166534,#bef264);color:#102a10;";
    return "background:rgba(100,116,139,.16);color:#334155;";
}

export function getOfflineProgressHtml(percent: number): string {
    const safePercent = clamp(percent, 0, 100);
    return `
        <div style="height:18px;border-radius:999px;background:rgba(15,23,42,.12);overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.18);">
            <div style="width:${safePercent}%;height:100%;border-radius:999px;background:linear-gradient(90deg,#22c55e,#84cc16,#facc15);transition:width .25s ease;"></div>
        </div>
    `;
}

export function createOfflineAssetFromCatalogItem(item: OfflineMiracleCatalogItem): RemoteMiracleAsset {
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

export function getOfflineCatalogDisplayName(item: OfflineMiracleCatalogItem): string {
    return item.label || item.assetId || item.url.split("/").pop() || "保存済み動画";
}
