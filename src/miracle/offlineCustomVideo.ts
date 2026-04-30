import { formatOfflineBytes, saveCustomOfflineMiracleVideo } from "./offlineCache";
import { getNewlyUnlockedOfflineTitleLabels, recordOfflineMiracleAction } from "./offlineProgress";
import type { RemoteMiracleAsset } from "./types";
import { getOfflineCatalogDisplayName } from "./offlineUi";
import type { getOfflineMiracleCatalog } from "./offlineCache";

type OfflineCatalog = Awaited<ReturnType<typeof getOfflineMiracleCatalog>>;

export interface OfflineCustomVideoController {
    showCustomOfflineVideoPopup: () => void;
}

export interface OfflineCustomVideoDependencies {
    isMobile: boolean;
    showPopup: (title: string, html: string) => void;
    showSoftToast: (message: string) => void;
    getOfflineCatalogForUi: () => Promise<{ videos: RemoteMiracleAsset[]; catalog: OfflineCatalog }>;
    showOfflineMiracleBookPopup: () => Promise<void>;
}

export function createOfflineCustomVideoController(deps: OfflineCustomVideoDependencies): OfflineCustomVideoController {
    const { isMobile, showPopup, showSoftToast, getOfflineCatalogForUi, showOfflineMiracleBookPopup } = deps;

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

    return { showCustomOfflineVideoPopup };
}
