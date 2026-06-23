import type { RemoteMiracleAsset, RemoteMiracleAssetSource, RemoteMiracleManifest } from "./types";
import { clamp } from "./utils";

export function isIOSLikeDevice(navigatorLike: Navigator = navigator): boolean {
    const ua = navigatorLike.userAgent || "";
    const platform = navigatorLike.platform || "";
    return /iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && navigatorLike.maxTouchPoints > 1);
}

export function prepareRemoteVideoForSound(video: HTMLVideoElement, params: {
    soundEnabled: boolean;
    isMobile: boolean;
    mobileAudioUnlocked: boolean;
    volume?: number;
}): void {
    const normalizedVolume = params.soundEnabled ? clamp(params.volume ?? 0.45, 0, 1) : 0;
    video.autoplay = false;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.controls = false;

    if (params.soundEnabled && (!params.isMobile || params.mobileAudioUnlocked)) {
        video.muted = false;
        video.defaultMuted = false;
        video.removeAttribute("muted");
        video.volume = normalizedVolume;
    } else {
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute("muted", "");
        video.volume = 0;
    }
}

export function getFreshRemoteVideoSourceUrl(url: string, asset: RemoteMiracleAsset, loadedAt: number, now = Date.now()): string {
    if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url;
    try {
        const u = new URL(url, window.location.href);
        u.searchParams.set("mbl_video", `${asset.id || "asset"}_${loadedAt || now}`);
        return u.toString();
    } catch {
        const sep = url.includes("?") ? "&" : "?";
        return `${url}${sep}mbl_video=${encodeURIComponent(String(asset.id || now))}`;
    }
}

export function createRemoteMiracleAssetLoader(params: {
    manifestUrl: string;
    cacheMs: number;
    backupStorageKey: string;
    normalizeManifest: (manifest: RemoteMiracleManifest) => RemoteMiracleAsset[];
    storage: Storage;
    fetchFn?: typeof fetch;
    now?: () => number;
}): {
    load: (force?: boolean) => Promise<RemoteMiracleAsset[]>;
    getLoadedAt: () => number;
} {
    const fetchFn = params.fetchFn ?? fetch;
    const now = params.now ?? (() => Date.now());
    let assets: RemoteMiracleAsset[] = [];
    let loadedAt = 0;
    let loading: Promise<RemoteMiracleAsset[]> | null = null;

    const saveBackup = (manifest: RemoteMiracleManifest): void => {
        try {
            params.storage.setItem(params.backupStorageKey, JSON.stringify(manifest));
        } catch {
            // オフライン再生の補助情報なので、保存失敗しても通常動作を優先します。
        }
    };

    const loadBackup = (): RemoteMiracleAsset[] => {
        try {
            const raw = params.storage.getItem(params.backupStorageKey);
            if (!raw) return [];
            return params.normalizeManifest(JSON.parse(raw) as RemoteMiracleManifest);
        } catch {
            return [];
        }
    };

    const load = async (force = false): Promise<RemoteMiracleAsset[]> => {
        const currentTime = now();

        if (!force && assets.length > 0 && currentTime - loadedAt < params.cacheMs) {
            return assets;
        }

        if (!force && loading) {
            return loading;
        }

        loading = fetchFn(params.manifestUrl, { cache: "no-cache" })
            .then(async (res) => {
                if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
                const manifest = (await res.json()) as RemoteMiracleManifest;

                assets = params.normalizeManifest(manifest);
                loadedAt = now();
                saveBackup({ ...manifest, assets });
                return assets;
            })
            .catch((error) => {
                console.warn("[Miracle R2] manifest load failed", error);
                const backupAssets = loadBackup();
                if (backupAssets.length > 0) {
                    assets = backupAssets;
                    loadedAt = now();
                    return assets;
                }
                return assets;
            })
            .finally(() => {
                loading = null;
            });

        return loading;
    };

    return {
        load,
        getLoadedAt: () => loadedAt,
    };
}

export function createRemoteMiracleBadUrlCache(params: {
    cacheMs: number;
    getSources: (asset: RemoteMiracleAsset) => RemoteMiracleAssetSource[];
    now?: () => number;
}): {
    markBad: (asset: RemoteMiracleAsset) => void;
    getUsableSources: (asset: RemoteMiracleAsset, ignoreBadCache?: boolean) => RemoteMiracleAssetSource[];
    isUsable: (asset: RemoteMiracleAsset) => boolean;
} {
    const failedUrls = new Map<string, number>();
    const now = params.now ?? (() => Date.now());

    const cleanup = (): void => {
        const currentTime = now();
        failedUrls.forEach((failedAt, url) => {
            if (currentTime - failedAt > params.cacheMs) {
                failedUrls.delete(url);
            }
        });
    };

    const getUsableSources = (asset: RemoteMiracleAsset, ignoreBadCache = false): RemoteMiracleAssetSource[] => {
        cleanup();
        const sources = params.getSources(asset);
        if (ignoreBadCache) return sources;
        return sources.filter((source) => !failedUrls.has(source.url));
    };

    const isUsable = (asset: RemoteMiracleAsset): boolean => {
        return getUsableSources(asset).length > 0;
    };

    return {
        markBad: (asset) => {
            const currentTime = now();
            for (const source of params.getSources(asset)) {
                failedUrls.set(source.url, currentTime);
            }
        },
        getUsableSources,
        isUsable,
    };
}

export function getAdjustedSoundVolume(base: number, isMobile: boolean): number {
    return base + (isMobile ? -4 : 0);
}

export function playUiToneCue(params: {
    toneModule: any;
    kind: "start" | "pause" | "resume" | "open" | "close" | "tick" | "skill" | "time";
    volume: number;
}): void {
    const Tone = params.toneModule;
    if (!Tone) return;
    const now = Tone.now();
    const synth = new Tone.Synth({
        oscillator: { type: params.kind === "time" ? "sine" : params.kind === "skill" ? "triangle" : "square" },
        envelope: { attack: 0.002, decay: 0.06, sustain: 0.05, release: 0.12 },
    }).toDestination();
    synth.volume.value = params.volume;
    const notes: Record<typeof params.kind, string[]> = {
        start: ["C5", "E5", "G5"],
        pause: ["E4", "C4"],
        resume: ["C4", "E4"],
        open: ["G4", "B4"],
        close: ["B4", "G4"],
        tick: ["C6"],
        skill: ["D5", "A5"],
        time: ["F4", "C5", "F5"],
    };
    notes[params.kind].forEach((note, index) => synth.triggerAttackRelease(note, "32n", now + index * 0.055));
    window.setTimeout(() => synth.dispose(), 650);
}

export function playSecretToneCue(params: {
    toneModule: any;
    volume: number;
}): void {
    const Tone = params.toneModule;
    if (!Tone) return;
    const now = Tone.now();
    const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "fatsawtooth" },
        envelope: { attack: 0.01, decay: 0.18, sustain: 0.18, release: 0.42 },
    }).toDestination();
    synth.volume.value = params.volume;
    ["C4", "E4", "G4", "B4", "D5", "G5"].forEach((note, i) => synth.triggerAttackRelease(note, i < 4 ? "16n" : "8n", now + i * 0.075));
    const noise = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.13, sustain: 0 } }).toDestination();
    noise.volume.value = -22;
    noise.triggerAttackRelease("16n", now + 0.08);
    window.setTimeout(() => { synth.dispose(); noise.dispose(); }, 1200);
}
