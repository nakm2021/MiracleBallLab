import { MIRACLE_ASSET_BASE_URL } from "./constants";
import { getRankScore } from "./rarity";
import type { RemoteMiracleAsset, RemoteMiracleAssetSource, RemoteMiracleManifest, SpecialEventDef } from "./types";
import { clamp } from "./utils";

export function normalizeRemoteMiracleUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    return `${MIRACLE_ASSET_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

export function getRemoteAssetRank(asset: RemoteMiracleAsset): string {
    return String(asset.rank ?? "common").toLowerCase();
}

export function getRemoteAssetRankScore(asset: RemoteMiracleAsset): number {
    const rank = String(asset.rank ?? "N").toUpperCase();
    return Math.max(0, getRankScore(rank));
}

export function getRemoteMiracleAssetSources(asset: RemoteMiracleAsset): RemoteMiracleAssetSource[] {
    const sources: RemoteMiracleAssetSource[] = [];

    if (asset.sources && asset.sources.length > 0) {
        for (const source of asset.sources) {
            if (!source.url) continue;
            sources.push({
                url: normalizeRemoteMiracleUrl(source.url),
                mimeType: source.mimeType,
            });
        }
    } else if (asset.url) {
        sources.push({
            url: normalizeRemoteMiracleUrl(asset.url),
            mimeType: asset.mimeType,
        });
    }

    return sources;
}

export function getDefRank(def?: SpecialEventDef): string {
    return String(def?.rank ?? "common").toLowerCase();
}

export function getRemoteRankCandidates(def?: SpecialEventDef): string[] {
    const rank = getDefRank(def);

    if (rank === "god") return ["god", "secret", "ex", "ur", "ssr", "rare", "common"];
    if (rank === "ex") return ["ex", "secret", "god", "ur", "ssr", "rare", "common"];
    if (rank === "ur") return ["ur", "ssr", "rare", "common"];
    if (rank === "ssr") return ["ssr", "rare", "common"];
    if (rank === "sr") return ["sr", "rare", "common"];
    if (rank === "rare") return ["rare", "common"];

    return ["common", "rare"];
}

export function normalizeRemoteMiracleAssetsFromManifest(manifest: RemoteMiracleManifest): RemoteMiracleAsset[] {
    const assets = Array.isArray(manifest.assets) ? manifest.assets : [];

    return assets.filter((asset) => {
        if (!asset || !asset.id || !asset.kind) return false;
        if (asset.kind !== "video" && asset.kind !== "audio") return false;
        if (!asset.url && (!asset.sources || asset.sources.length === 0)) return false;
        return true;
    });
}

export function weightedPickRemoteAsset(assets: RemoteMiracleAsset[], random = Math.random): RemoteMiracleAsset | null {
    if (assets.length === 0) return null;

    const total = assets.reduce((sum, asset) => sum + Math.max(1, Number(asset.weight ?? 1)), 0);
    let roll = random() * total;

    for (const asset of assets) {
        roll -= Math.max(1, Number(asset.weight ?? 1));
        if (roll <= 0) return asset;
    }

    return assets[assets.length - 1] ?? null;
}

export function selectRemoteMiracleVideoAsset(
    assets: RemoteMiracleAsset[],
    def?: SpecialEventDef,
    isAssetUsable: (asset: RemoteMiracleAsset) => boolean = () => true,
    random = Math.random,
): RemoteMiracleAsset | null {
    const videos = assets.filter((asset) => asset.kind === "video" && isAssetUsable(asset));
    if (videos.length === 0) return null;

    const defRank = getDefRank(def);
    const exact = videos.filter((asset) => getRemoteAssetRank(asset) === defRank);
    if (exact.length > 0) return weightedPickRemoteAsset(exact, random);

    const candidates = getRemoteRankCandidates(def);
    const ranked = videos.filter((asset) => candidates.includes(getRemoteAssetRank(asset)));
    if (ranked.length > 0) return weightedPickRemoteAsset(ranked, random);

    return weightedPickRemoteAsset(videos, random);
}

export function getRemoteMiracleAssetMainUrl(asset: RemoteMiracleAsset): string {
    return getRemoteMiracleAssetSources(asset)[0]?.url ?? "";
}

export function getRemoteMiracleAssetLabel(asset: RemoteMiracleAsset): string {
    const rank = String(asset.rank ?? "common").toUpperCase();
    return `[${rank}] ${asset.id} / 再生10秒固定`;
}

export function getRemoteMiracleVideoVolume(asset: RemoteMiracleAsset): number {
    return clamp(Number(asset.volume ?? 0.45), 0, 1);
}
