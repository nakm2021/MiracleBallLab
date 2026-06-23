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

export function getOfflineLabStyles(isMobile: boolean): string {
    const panelPadding = isMobile ? "18px" : "30px";
    const cardPadding = isMobile ? "22px" : "34px";
    const smallCardPadding = isMobile ? "20px" : "28px";
    const rowPadding = isMobile ? "16px 10px" : "18px 12px";
    const buttonPadding = isMobile ? "12px 18px" : "13px 24px";
    return `
        <style>
            .offline-lab-panel{
                padding:${panelPadding} !important;
                box-sizing:border-box;
                line-height:1.68;
            }
            .offline-lab-panel p{
                line-height:1.75;
            }
            .offline-lab-panel h3{
                margin:24px 0 14px !important;
                padding-left:8px;
                line-height:1.35;
            }
            .offline-lab-panel .offline-lab-card,
            .offline-lab-panel > div[style*="border-radius"]{
                padding:${cardPadding} !important;
                box-sizing:border-box;
            }
            .offline-lab-panel .offline-lab-small-card{
                padding:${smallCardPadding} !important;
                box-sizing:border-box;
                line-height:1.62;
            }
            .offline-lab-panel .offline-lab-button-row{
                display:flex;
                flex-wrap:wrap;
                gap:12px !important;
                margin:18px 0 20px !important;
            }
            .offline-lab-panel .miracle-home-button{
                padding:${buttonPadding} !important;
                box-sizing:border-box;
                line-height:1.25;
            }
            .offline-lab-panel .offline-lab-scroll-box{
                padding:18px 26px !important;
                box-sizing:border-box;
            }
            .offline-lab-panel .offline-lab-list-row{
                padding:${rowPadding} !important;
                box-sizing:border-box;
            }
            .offline-lab-panel .offline-lab-muted{
                line-height:1.7;
            }
            .offline-lab-panel .offline-lab-grid{
                gap:14px !important;
            }
            .offline-lab-panel .offline-lab-card > :first-child,
            .offline-lab-panel .offline-lab-small-card > :first-child{
                margin-top:0 !important;
            }
            .offline-lab-panel .offline-lab-card > :last-child,
            .offline-lab-panel .offline-lab-small-card > :last-child{
                margin-bottom:0 !important;
            }
            @media (max-width: 640px){
                .offline-lab-panel{
                    padding:18px !important;
                }
                .offline-lab-panel .offline-lab-card,
                .offline-lab-panel > div[style*="border-radius"]{
                    padding:20px !important;
                }
                .offline-lab-panel .offline-lab-scroll-box{
                    padding:14px 20px !important;
                }
            }
        </style>
    `;
}
