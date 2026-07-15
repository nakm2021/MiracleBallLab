import GIF from "gif.js";
import gifWorkerUrl from "gif.js/dist/gif.worker.js?url";
import { getReplayHtml, getShareHtml } from "./activityPresentation";
import type { Geometry, MiracleClip, SavedRecords, SpecialEventDef } from "./types";

export type ShareReplaySummary = {
    runScore: number;
    finishedCount: number;
    targetCount: number;
    discoveredCount: number;
    specialEventCount: number;
    savedRecords: SavedRecords;
    researchLevel: number;
    fusionCount: number;
    fusionTotalCount: number;
    fortuneRateBoost: number;
    bestComboThisRun: number;
    missionClearedCount: number;
    missionTotalCount: number;
};

export function buildShareText(
    summary: Pick<
        ShareReplaySummary,
        "runScore" | "finishedCount" | "targetCount" | "savedRecords" | "discoveredCount" | "specialEventCount"
    >,
    clipCount: number,
): string {
    return `ミラクルボールラボ
スコア: ${summary.runScore.toLocaleString()}
処理数: ${summary.finishedCount.toLocaleString()} / ${summary.targetCount.toLocaleString()}
最高レア: ${summary.savedRecords.bestRank} ${summary.savedRecords.bestLabel}
発見済み: ${summary.discoveredCount}/${summary.specialEventCount}
奇跡クリップ: ${clipCount}件
#MiracleBallLabo #ミラクルボールラボ`;
}

export function createMiracleClip(params: {
    def: SpecialEventDef;
    subtitle: string;
    finishedCount: number;
    frames: string[];
    now: number;
    random: () => number;
}): MiracleClip {
    return {
        id: `${params.now}-${Math.floor(params.random() * 100000)}`,
        label: params.def.label,
        rank: params.def.rank,
        denominator: params.def.denominator,
        finishedCount: params.finishedCount,
        createdAt: params.now,
        subtitle: params.subtitle,
        frames: params.frames.slice(-18),
    };
}

export type ShareReplayController = {
    showSharePopup(): void;
    showReplayPopup(): void;
    saveMiracleClip(def: SpecialEventDef, subtitle: string): void;
    captureReplayFrame(): void;
    warmupGif(): Promise<boolean>;
    getClipCount(): number;
};

export function createShareReplayController(deps: {
    canvas: HTMLCanvasElement;
    helpOverlay: HTMLElement;
    getGeometry: () => Geometry;
    getSummary: () => ShareReplaySummary;
    random: () => number;
    isMobile: boolean;
    t: (ja: string, en: string) => string;
    formatProbability: (denominator: number) => string;
    showPopup: (title: string, bodyHtml: string) => void;
    showMilestone: (message: string) => void;
}): ShareReplayController {
    let miracleClips: MiracleClip[] = [];
    let replayFrameBuffer: string[] = [];
    let replayCaptureTick = 0;
    let gifReady = false;

    const warmupGif = async (): Promise<boolean> => {
        gifReady = true;
        return true;
    };

    const downloadBlob = (blob: Blob, filename: string, revokeDelayMs = 1500): void => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), revokeDelayMs);
    };

    const saveCurrentScreenshot = (): void => {
        const shotCanvas = document.createElement("canvas");
        shotCanvas.width = Math.max(1, deps.canvas.width);
        shotCanvas.height = Math.max(1, deps.canvas.height);
        const ctx = shotCanvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#0b0d14";
        ctx.fillRect(0, 0, shotCanvas.width, shotCanvas.height);
        try {
            ctx.drawImage(deps.canvas, 0, 0);
        } catch {
            deps.showPopup("スクリーンショット", "<p>現在の画面保存に失敗しました。</p>");
            return;
        }
        shotCanvas.toBlob((blob) => {
            if (!blob) return;
            downloadBlob(blob, `miracle-ball-screenshot-${Date.now()}.png`);
            deps.showMilestone("スクリーンショットを保存しました");
        }, "image/png");
    };

    const saveShareCard = (): void => {
        const summary = deps.getSummary();
        const width = 1080;
        const height = 1920;
        const shareCanvas = document.createElement("canvas");
        shareCanvas.width = width;
        shareCanvas.height = height;
        const ctx = shareCanvas.getContext("2d");
        if (!ctx) return;

        const bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, "#0f172a");
        bg.addColorStop(1, "#1e293b");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "rgba(255,255,255,.08)";
        ctx.fillRect(60, 120, width - 120, 720);
        ctx.fillRect(60, 880, width - 120, 820);

        ctx.fillStyle = "#f8fafc";
        ctx.font = '900 64px "Segoe UI", "Noto Sans JP", sans-serif';
        ctx.fillText("MiracleBallLabo", 100, 210);
        ctx.font = '700 34px "Segoe UI", "Noto Sans JP", sans-serif';
        ctx.fillStyle = "#cbd5e1";
        ctx.fillText("ミラクルボールラボ 実験シェアカード", 100, 270);

        const previewW = width - 200;
        const previewH = 480;
        try {
            ctx.drawImage(deps.canvas, 100, 320, previewW, previewH);
        } catch {
            ctx.fillStyle = "#0b1220";
            ctx.fillRect(100, 320, previewW, previewH);
        }

        const lines = [
            `スコア ${summary.runScore.toLocaleString()}`,
            `処理 ${summary.finishedCount.toLocaleString()} / ${summary.targetCount.toLocaleString()}`,
            `最高レア ${summary.savedRecords.bestRank} ${summary.savedRecords.bestLabel}`,
            `発見済み ${summary.discoveredCount} / ${summary.specialEventCount}`,
            `研究Lv ${summary.researchLevel} / 合成 ${summary.fusionCount} / ${summary.fusionTotalCount}`,
            `今日の奇跡率 x${summary.fortuneRateBoost.toFixed(2)}`,
            `奇跡コンボ最高 ${summary.bestComboThisRun}`,
            `ミッション達成 ${summary.missionClearedCount} / ${summary.missionTotalCount}`,
        ];
        ctx.fillStyle = "#f8fafc";
        ctx.font = '900 48px "Segoe UI", "Noto Sans JP", sans-serif';
        ctx.fillText("RESULT", 100, 960);
        ctx.font = '700 42px "Segoe UI", "Noto Sans JP", sans-serif';
        lines.forEach((line, idx) => ctx.fillText(line, 100, 1050 + idx * 90));
        ctx.fillStyle = "#93c5fd";
        ctx.font = '700 30px "Segoe UI", "Noto Sans JP", sans-serif';
        ctx.fillText("#MiracleBallLabo #ミラクルボールラボ", 100, 1760);

        shareCanvas.toBlob((blob) => {
            if (!blob) return;
            downloadBlob(blob, `miracle-ball-share-${Date.now()}.png`, 0);
            deps.showMilestone("SNSカードを保存しました");
        }, "image/png");
    };

    const shareToSns = async (): Promise<void> => {
        const shareText = buildShareText(deps.getSummary(), miracleClips.length);
        try {
            await navigator.clipboard.writeText(shareText);
            deps.showMilestone("SNS投稿文をコピーしました");
        } catch {
            deps.showPopup("SNSシェア", `<pre style="white-space:pre-wrap;font-family:inherit;">${shareText}</pre>`);
            return;
        }
        if (navigator.share) {
            try {
                await navigator.share({ text: shareText, title: "MiracleBallLabo" });
            } catch {
                // 共有ダイアログのキャンセルは無視
            }
        }
    };

    const showSharePopup = (): void => {
        deps.showPopup("録画・SNS", getShareHtml());
        const copyBtn = document.getElementById("sns-copy-button") as HTMLButtonElement | null;
        const shotBtn = document.getElementById("screenshot-save-button") as HTMLButtonElement | null;
        const cardBtn = document.getElementById("sns-card-button") as HTMLButtonElement | null;
        if (copyBtn)
            copyBtn.onclick = () => {
                void shareToSns();
            };
        if (shotBtn) shotBtn.onclick = () => saveCurrentScreenshot();
        if (cardBtn) cardBtn.onclick = () => saveShareCard();
    };

    const saveMiracleClip = (def: SpecialEventDef, subtitle: string): void => {
        miracleClips.unshift(
            createMiracleClip({
                def,
                subtitle,
                finishedCount: deps.getSummary().finishedCount,
                frames: replayFrameBuffer,
                now: Date.now(),
                random: deps.random,
            }),
        );
        miracleClips = miracleClips.slice(0, 24);
    };

    const replayClipById = (id: string): void => {
        const clip = miracleClips.find((x) => x.id === id);
        if (!clip || clip.frames.length === 0) {
            deps.showPopup(
                deps.t("リプレイ", "Replay"),
                `<p>${deps.t("再生できるクリップがありません。", "No replay clip is available.")}</p>`,
            );
            return;
        }
        const body = `
            <div style="display:flex;flex-direction:column;gap:14px;">
                <div style="font-weight:900;font-size:${deps.isMobile ? "24px" : "20px"};">${clip.label} [${clip.rank}] ${deps.formatProbability(clip.denominator)}</div>
                <img id="replay-image" src="${clip.frames[0]}" style="width:100%;border-radius:20px;border:1px solid rgba(70,80,110,.16);background:#111;object-fit:contain;" />
                <div style="opacity:.8;">${clip.subtitle}</div>
                <div style="display:flex;justify-content:center;">
                    <button id="replay-gif-save-button" style="font-size:${deps.isMobile ? "18px" : "16px"};padding:10px 18px;border-radius:999px;border:1px solid rgba(100,90,180,.28);background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);font-weight:900;cursor:pointer;">${deps.t("GIF保存", "Save GIF")}</button>
                </div>
            </div>`;
        deps.showPopup(`${deps.t("リプレイ", "Replay")}: ${clip.label}`, body);
        const gifButton = document.getElementById("replay-gif-save-button") as HTMLButtonElement | null;
        if (gifButton)
            gifButton.onclick = () => {
                void exportClipAsGif(id);
            };
        const img = document.getElementById("replay-image") as HTMLImageElement | null;
        if (!img) return;
        let index = 0;
        const timer = window.setInterval(() => {
            if (deps.helpOverlay.style.display === "none") {
                window.clearInterval(timer);
                return;
            }
            index = (index + 1) % clip.frames.length;
            img.src = clip.frames[index];
        }, 140);
    };

    const exportClipAsGif = async (id: string): Promise<void> => {
        const clip = miracleClips.find((x) => x.id === id);
        if (!clip || clip.frames.length === 0) {
            deps.showPopup(
                deps.t("GIF保存", "Save GIF"),
                `<p>${deps.t("保存できるフレームがありません。", "No frames available to export.")}</p>`,
            );
            return;
        }
        const ok = await warmupGif();
        if (!ok || !gifReady) {
            deps.showPopup(
                deps.t("GIF保存", "Save GIF"),
                `<p>${deps.t("gif.js の読み込みに失敗しました。", "Failed to load gif.js.")}</p>`,
            );
            return;
        }

        const previous = deps.helpOverlay.style.display !== "none" ? deps.helpOverlay.innerHTML : "";
        deps.showPopup(
            deps.t("GIF保存中", "Rendering GIF"),
            `<p>${deps.t("GIFを書き出しています。少しお待ちください。", "Rendering the GIF. Please wait a moment.")}</p><div id="gif-progress" style="margin-top:12px;font-weight:900;">0%</div>`,
        );

        try {
            const images = await Promise.all(
                clip.frames.map(
                    (src) =>
                        new Promise<HTMLImageElement>((resolve, reject) => {
                            const img = new Image();
                            img.onload = () => resolve(img);
                            img.onerror = () => reject(new Error("frame load failed"));
                            img.src = src;
                        }),
                ),
            );
            const geometry = deps.getGeometry();
            const width = images[0]?.naturalWidth || geometry.width;
            const height = images[0]?.naturalHeight || geometry.height;
            const gif = new (GIF as any)({
                workers: 2,
                quality: 10,
                width,
                height,
                workerScript: gifWorkerUrl,
                background: "#0b0d14",
            });
            for (const image of images) {
                gif.addFrame(image, { delay: 140 });
            }
            gif.on("progress", (value: number) => {
                const progress = document.getElementById("gif-progress");
                if (progress) progress.textContent = `${Math.round(value * 100)}%`;
            });
            gif.on("finished", (blob: Blob) => {
                const safeLabel = clip.label.replace(/[\/:*?"<>|]/g, "_");
                downloadBlob(blob, `${safeLabel}_${clip.rank}_${clip.finishedCount}.gif`);
                deps.showPopup(
                    deps.t("GIF保存完了", "GIF saved"),
                    `<p>${deps.t("GIFを保存しました。", "The GIF has been saved.")}</p>`,
                );
            });
            gif.render();
        } catch {
            if (previous) deps.helpOverlay.innerHTML = previous;
            deps.showPopup(
                deps.t("GIF保存", "Save GIF"),
                `<p>${deps.t("GIF保存に失敗しました。もう一度お試しください。", "GIF export failed. Please try again.")}</p>`,
            );
        }
    };

    const showReplayPopup = (): void => {
        if (miracleClips.length === 0) {
            deps.showPopup(
                deps.t("リプレイ", "Replay"),
                `<p>${deps.t("まだ奇跡クリップがありません。", "No miracle clips yet.")}</p>`,
            );
            return;
        }
        const rows = getReplayHtml({
            clips: miracleClips,
            isMobile: deps.isMobile,
            playLabel: deps.t("再生", "Play"),
            gifLabel: deps.t("GIF保存", "Save GIF"),
            formatProbability: deps.formatProbability,
        });
        deps.showPopup(deps.t("奇跡クリップ保存", "Miracle clips"), rows);
        deps.helpOverlay.querySelectorAll("[data-replay-id]").forEach((el) => {
            (el as HTMLButtonElement).onclick = () => replayClipById((el as HTMLButtonElement).dataset.replayId || "");
        });
        deps.helpOverlay.querySelectorAll("[data-gif-id]").forEach((el) => {
            (el as HTMLButtonElement).onclick = () => {
                void exportClipAsGif((el as HTMLButtonElement).dataset.gifId || "");
            };
        });
    };

    const captureReplayFrame = (): void => {
        replayCaptureTick++;
        if (replayCaptureTick % 5 !== 0) return;
        try {
            replayFrameBuffer.push(deps.canvas.toDataURL("image/jpeg", 0.42));
            if (replayFrameBuffer.length > 24) replayFrameBuffer.shift();
        } catch {
            // キャンバスが taint されている場合などはリプレイ保存だけ諦める。
        }
    };

    return {
        showSharePopup,
        showReplayPopup,
        saveMiracleClip,
        captureReplayFrame,
        warmupGif,
        getClipCount: () => miracleClips.length,
    };
}
