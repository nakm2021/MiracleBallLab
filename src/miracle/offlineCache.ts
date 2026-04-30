import type { RemoteMiracleAsset, RemoteMiracleAssetSource } from "./types";

const OFFLINE_VIDEO_CACHE_NAME = "miracle-ball-lab-video-cache-v1";
const OFFLINE_VIDEO_META_KEY = "miracleBallLab.offlineVideoMeta.v1";

export type OfflineMiracleVideoSource = RemoteMiracleAssetSource & {
    assetId: string;
    rank?: string;
    estimateBytes?: number | null;
};

export type OfflineMiracleDownloadPlan = {
    supported: boolean;
    sources: OfflineMiracleVideoSource[];
    downloadSources: OfflineMiracleVideoSource[];
    cachedCount: number;
    knownBytes: number;
    unknownCount: number;
};

export type OfflineMiracleDownloadProgress = {
    done: number;
    total: number;
    currentUrl: string;
    downloadedBytes: number;
};

export type OfflineMiracleSummary = {
    supported: boolean;
    cachedCount: number;
    cachedBytes: number;
    updatedAt: number;
};

export type OfflineMiracleCatalogItem = {
    url: string;
    assetId: string;
    rank?: string;
    sizeBytes: number;
    cachedAt: number;
};

export type OfflineMiracleCatalog = {
    supported: boolean;
    totalVideoSources: number;
    cachedItems: OfflineMiracleCatalogItem[];
    cachedBytes: number;
    updatedAt: number;
    rankCounts: Record<string, { total: number; cached: number; bytes: number }>;
};

export type OfflineMiracleResearchRank = {
    label: string;
    level: number;
    nextLabel: string;
    nextBytes: number | null;
    progressRatio: number;
};

type OfflineMiracleMeta = {
    sources: Record<string, { assetId: string; rank?: string; sizeBytes: number; cachedAt: number }>;
    updatedAt: number;
};

function isCacheSupported(): boolean {
    return typeof window !== "undefined" && "caches" in window;
}

function loadMeta(): OfflineMiracleMeta {
    try {
        const raw = localStorage.getItem(OFFLINE_VIDEO_META_KEY);
        if (!raw) return { sources: {}, updatedAt: 0 };
        const parsed = JSON.parse(raw) as OfflineMiracleMeta;
        return {
            sources: parsed.sources && typeof parsed.sources === "object" ? parsed.sources : {},
            updatedAt: Number(parsed.updatedAt ?? 0),
        };
    } catch {
        return { sources: {}, updatedAt: 0 };
    }
}

function saveMeta(meta: OfflineMiracleMeta): void {
    try {
        localStorage.setItem(OFFLINE_VIDEO_META_KEY, JSON.stringify(meta));
    } catch {
        // localStorage が使えない環境では、動画キャッシュ自体は残せるため無視します。
    }
}

function uniqueVideoSources(assets: RemoteMiracleAsset[], getSources: (asset: RemoteMiracleAsset) => RemoteMiracleAssetSource[]): OfflineMiracleVideoSource[] {
    const result: OfflineMiracleVideoSource[] = [];
    const seen = new Set<string>();

    for (const asset of assets) {
        if (asset.kind !== "video") continue;
        const sources = getSources(asset);
        for (const source of sources) {
            if (!source.url || seen.has(source.url)) continue;
            seen.add(source.url);
            result.push({
                assetId: asset.id,
                rank: asset.rank,
                url: source.url,
                mimeType: source.mimeType,
            });
        }
    }

    return result;
}

async function isCached(cache: Cache, url: string): Promise<boolean> {
    try {
        return !!(await cache.match(url));
    } catch {
        return false;
    }
}

async function fetchContentLength(url: string): Promise<number | null> {
    try {
        const res = await fetch(url, { method: "HEAD", cache: "no-cache" });
        if (!res.ok) return null;
        const value = res.headers.get("content-length");
        if (!value) return null;
        const bytes = Number(value);
        return Number.isFinite(bytes) && bytes > 0 ? bytes : null;
    } catch {
        return null;
    }
}

export async function buildOfflineMiracleVideoPlan(
    assets: RemoteMiracleAsset[],
    getSources: (asset: RemoteMiracleAsset) => RemoteMiracleAssetSource[],
): Promise<OfflineMiracleDownloadPlan> {
    if (!isCacheSupported()) {
        return { supported: false, sources: [], downloadSources: [], cachedCount: 0, knownBytes: 0, unknownCount: 0 };
    }

    const cache = await caches.open(OFFLINE_VIDEO_CACHE_NAME);
    const sources = uniqueVideoSources(assets, getSources);
    const downloadSources: OfflineMiracleVideoSource[] = [];
    let cachedCount = 0;
    let knownBytes = 0;
    let unknownCount = 0;

    for (const source of sources) {
        if (await isCached(cache, source.url)) {
            cachedCount++;
            continue;
        }

        downloadSources.push(source);
        const bytes = await fetchContentLength(source.url);
        source.estimateBytes = bytes;
        if (bytes === null) {
            unknownCount++;
        } else {
            knownBytes += bytes;
        }
    }

    return { supported: true, sources, downloadSources, cachedCount, knownBytes, unknownCount };
}

export async function downloadOfflineMiracleVideos(
    plan: OfflineMiracleDownloadPlan,
    onProgress?: (progress: OfflineMiracleDownloadProgress) => void,
): Promise<OfflineMiracleSummary> {
    if (!plan.supported || !isCacheSupported()) {
        throw new Error("このブラウザはオフライン動画保存に対応していません。");
    }

    const cache = await caches.open(OFFLINE_VIDEO_CACHE_NAME);
    const meta = loadMeta();
    let downloadedBytes = 0;

    for (let i = 0; i < plan.downloadSources.length; i++) {
        const source = plan.downloadSources[i];
        onProgress?.({ done: i, total: plan.downloadSources.length, currentUrl: source.url, downloadedBytes });

        const res = await fetch(source.url, { cache: "no-cache" });
        if (!res.ok) {
            throw new Error(`動画の取得に失敗しました: ${res.status}`);
        }

        const blob = await res.blob();
        const headers = new Headers();
        headers.set("Content-Type", source.mimeType || blob.type || "video/mp4");
        headers.set("X-Miracle-Offline-Asset-Id", source.assetId);
        await cache.put(source.url, new Response(blob, { headers }));

        downloadedBytes += blob.size;
        meta.sources[source.url] = {
            assetId: source.assetId,
            rank: source.rank,
            sizeBytes: blob.size,
            cachedAt: Date.now(),
        };
        meta.updatedAt = Date.now();
        saveMeta(meta);

        onProgress?.({ done: i + 1, total: plan.downloadSources.length, currentUrl: source.url, downloadedBytes });
    }

    return getOfflineMiracleSummary();
}

export async function resolveOfflineMiracleSources(sources: RemoteMiracleAssetSource[]): Promise<{ sources: RemoteMiracleAssetSource[]; objectUrls: string[] }> {
    if (!isCacheSupported()) return { sources: [], objectUrls: [] };

    const cache = await caches.open(OFFLINE_VIDEO_CACHE_NAME);
    const resolvedSources: RemoteMiracleAssetSource[] = [];
    const objectUrls: string[] = [];

    for (const source of sources) {
        try {
            const cached = await cache.match(source.url);
            if (!cached) continue;
            const blob = await cached.blob();
            if (blob.size <= 0) continue;
            const objectUrl = URL.createObjectURL(blob);
            objectUrls.push(objectUrl);
            resolvedSources.push({
                url: objectUrl,
                mimeType: source.mimeType || blob.type || cached.headers.get("Content-Type") || undefined,
            });
        } catch {
            // 壊れたキャッシュが混ざっていても、通常のオンライン再生へフォールバックします。
        }
    }

    return { sources: resolvedSources, objectUrls };
}

export function revokeOfflineObjectUrls(urls: string[]): void {
    for (const url of urls) {
        try {
            URL.revokeObjectURL(url);
        } catch {
            // 無視
        }
    }
}


export function getOfflineMiracleResearchRank(cachedBytes: number): OfflineMiracleResearchRank {
    const thresholds = [
        { bytes: 0, label: "見習い研究員" },
        { bytes: 100 * 1024 * 1024, label: "奇跡保管員" },
        { bytes: 500 * 1024 * 1024, label: "演出アーカイブ主任" },
        { bytes: 1024 * 1024 * 1024, label: "オフライン研究所長" },
        { bytes: 3 * 1024 * 1024 * 1024, label: "時空保存官" },
        { bytes: 8 * 1024 * 1024 * 1024, label: "永久機関管理者" },
    ];

    let level = 0;
    for (let i = 0; i < thresholds.length; i++) {
        if (cachedBytes >= thresholds[i].bytes) level = i;
    }

    const current = thresholds[level] ?? { bytes: 0, label: "見習い研究員" };
    const next = thresholds[level + 1];
    const progressRatio = next
        ? Math.max(0, Math.min(1, (cachedBytes - current.bytes) / Math.max(1, next.bytes - current.bytes)))
        : 1;

    return {
        label: current.label,
        level,
        nextLabel: next?.label ?? "最高ランク",
        nextBytes: next?.bytes ?? null,
        progressRatio,
    };
}

export async function getOfflineMiracleCatalog(
    assets: RemoteMiracleAsset[],
    getSources: (asset: RemoteMiracleAsset) => RemoteMiracleAssetSource[],
): Promise<OfflineMiracleCatalog> {
    if (!isCacheSupported()) {
        return { supported: false, totalVideoSources: 0, cachedItems: [], cachedBytes: 0, updatedAt: 0, rankCounts: {} };
    }

    const sources = uniqueVideoSources(assets, getSources);
    const meta = loadMeta();
    const rankCounts: Record<string, { total: number; cached: number; bytes: number }> = {};

    for (const source of sources) {
        const rank = String(source.rank ?? "common").toUpperCase();
        rankCounts[rank] ??= { total: 0, cached: 0, bytes: 0 };
        rankCounts[rank].total++;
    }

    const cachedItems = Object.entries(meta.sources).map(([url, item]) => ({
        url,
        assetId: item.assetId,
        rank: item.rank,
        sizeBytes: Math.max(0, Number(item.sizeBytes ?? 0)),
        cachedAt: Number(item.cachedAt ?? 0),
    }));

    for (const item of cachedItems) {
        const rank = String(item.rank ?? "common").toUpperCase();
        rankCounts[rank] ??= { total: 0, cached: 0, bytes: 0 };
        rankCounts[rank].cached++;
        rankCounts[rank].bytes += item.sizeBytes;
    }

    return {
        supported: true,
        totalVideoSources: sources.length,
        cachedItems: cachedItems.sort((a, b) => b.cachedAt - a.cachedAt),
        cachedBytes: cachedItems.reduce((sum, item) => sum + item.sizeBytes, 0),
        updatedAt: meta.updatedAt,
        rankCounts,
    };
}

export function filterOfflineMiracleDownloadPlan(
    plan: OfflineMiracleDownloadPlan,
    mode: "recommended" | "rare" | "all",
): OfflineMiracleDownloadPlan {
    if (mode === "all") return plan;

    const scoreRank = (rank?: string): number => {
        const r = String(rank ?? "common").toUpperCase();
        if (r === "GOD" || r === "SECRET") return 100;
        if (r === "EX") return 90;
        if (r === "UR") return 80;
        if (r === "SSR") return 70;
        if (r === "SR") return 60;
        if (r === "RARE") return 50;
        return 10;
    };

    const sorted = [...plan.downloadSources].sort((a, b) => {
        const rankDiff = scoreRank(b.rank) - scoreRank(a.rank);
        if (rankDiff !== 0) return rankDiff;
        const aBytes = a.estimateBytes ?? Number.MAX_SAFE_INTEGER;
        const bBytes = b.estimateBytes ?? Number.MAX_SAFE_INTEGER;
        return aBytes - bBytes;
    });

    const selected = mode === "rare"
        ? sorted.filter((source) => scoreRank(source.rank) >= 60)
        : sorted.filter((source) => scoreRank(source.rank) >= 60 || (source.estimateBytes ?? Number.MAX_SAFE_INTEGER) <= 25 * 1024 * 1024).slice(0, 24);

    return {
        ...plan,
        downloadSources: selected,
        knownBytes: selected.reduce((sum, source) => sum + Math.max(0, Number(source.estimateBytes ?? 0)), 0),
        unknownCount: selected.filter((source) => source.estimateBytes == null).length,
    };
}

export async function getOfflineMiracleSummary(): Promise<OfflineMiracleSummary> {
    if (!isCacheSupported()) return { supported: false, cachedCount: 0, cachedBytes: 0, updatedAt: 0 };

    const meta = loadMeta();
    const values = Object.values(meta.sources);
    return {
        supported: true,
        cachedCount: values.length,
        cachedBytes: values.reduce((sum, item) => sum + Math.max(0, Number(item.sizeBytes ?? 0)), 0),
        updatedAt: meta.updatedAt,
    };
}

export async function clearOfflineMiracleVideos(): Promise<void> {
    if (isCacheSupported()) {
        await caches.delete(OFFLINE_VIDEO_CACHE_NAME);
    }
    try {
        localStorage.removeItem(OFFLINE_VIDEO_META_KEY);
    } catch {
        // 無視
    }
}

export function formatOfflineBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}
