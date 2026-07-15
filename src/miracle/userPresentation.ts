import type { SavedRecords, SpecialEventDef, UserPlayStyle, UserProfile } from "./types";
import { escapeHtml } from "./utils";

export function getMiracleBookHtml(rows: string, isMobile: boolean): string {
    return `
        <p style="margin-top:0;">全ての奇跡を画像つきで表示します。未発見のものは<b>シークレット枠</b>として、名前・確率・説明を伏せたまま表示します。</p>
        <div style="margin-top:16px;border-radius:22px;background:rgba(255,255,255,.75);padding:${isMobile ? "4px 14px" : "8px 16px"};box-sizing:border-box;max-width:100%;overflow:hidden;">${rows}</div>
    `;
}

export function getUserSettingsHtml(params: {
    profile: UserProfile;
    savedRecords: SavedRecords;
    discoveredKinds: number;
    specialCount: number;
    isMobile: boolean;
    playStyleLabel: string;
}): string {
    const fontSize = params.isMobile ? 20 : 18;
    const option = (value: UserPlayStyle, label: string) =>
        `<option value="${value}" ${params.profile.playStyle === value ? "selected" : ""}>${label}</option>`;
    return `
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>研究員プロフィール</b></p>
            <label style="display:block;font-weight:900;margin-bottom:6px;">ニックネーム</label>
            <input id="user-nickname-input" value="${escapeHtml(params.profile.nickname)}" maxlength="24" style="width:100%;font-size:${fontSize}px;padding:12px 14px;border-radius:14px;border:1px solid #b8c1d1;box-sizing:border-box;" />
            <label style="display:block;font-weight:900;margin:14px 0 6px;">遊び方</label>
            <select id="user-play-style-select" style="width:100%;font-size:${fontSize}px;padding:12px 14px;border-radius:14px;border:1px solid #b8c1d1;box-sizing:border-box;">
                ${option("standard", "標準")}
                ${option("viewer", "演出を見る")}
                ${option("collector", "図鑑収集")}
                ${option("recording", "録画・SNS")}
            </select>
            <label style="display:block;font-weight:900;margin:14px 0 6px;">好きな奇跡メモ</label>
            <input id="user-favorite-input" value="${escapeHtml(params.profile.favoriteMiracle)}" maxlength="40" style="width:100%;font-size:${fontSize}px;padding:12px 14px;border-radius:14px;border:1px solid #b8c1d1;box-sizing:border-box;" />
            <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
                <button id="save-user-profile-button" style="font-size:18px;font-weight:900;padding:10px 18px;border-radius:999px;border:1px solid rgba(87,112,51,.24);background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);cursor:pointer;">保存して反映</button>
                <button id="guest-name-button" style="font-size:18px;font-weight:900;padding:10px 18px;border-radius:999px;border:1px solid rgba(87,112,51,.24);background:#fff;cursor:pointer;">ゲスト名に戻す</button>
            </div>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>ユーザー状況</b></p>
            <p>表示名: <b>${escapeHtml(params.profile.nickname)}</b></p>
            <p>遊び方: <b>${escapeHtml(params.playStyleLabel)}</b></p>
            <p>連続起動: <b>${params.profile.consecutiveDays}</b>日 / 起動回数: <b>${params.profile.openCount}</b>回</p>
            <p>図鑑発見: <b>${params.discoveredKinds}</b> / ${params.specialCount} 種類</p>
            <p>最高レア: <b>${escapeHtml(params.savedRecords.bestRank)}</b> ${escapeHtml(params.savedRecords.bestLabel)}</p>
            <p>安全停止回数: <b>${params.profile.totalSafeStops}</b>回</p>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>保存データ</b></p>
            <p>ニックネーム、設定、図鑑、奇跡ログ、最高記録はこの端末のブラウザ内に保存します。ログインやサーバー送信は行いません。</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button id="export-user-data-button" style="font-size:18px;font-weight:900;padding:10px 18px;border-radius:999px;border:1px solid rgba(87,112,51,.24);background:#fff;cursor:pointer;">データ書き出し</button>
                <button id="reset-local-data-button" style="font-size:18px;font-weight:900;padding:10px 18px;border-radius:999px;border:1px solid rgba(185,28,28,.35);background:#fee2e2;color:#991b1b;cursor:pointer;">ローカルデータ削除</button>
            </div>
        </div>
    `;
}

export function getAppInfoHtml(params: { appVersion: string; onlineStatusHtml: string; standalone: boolean }): string {
    return `
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>MiracleBallLab</b></p>
            <p>${params.onlineStatusHtml}</p>
            <p>表示モード: <b>${params.standalone ? "ホーム画面から起動中" : "ブラウザで利用中"}</b></p>
            <p>バージョン: <b>${escapeHtml(params.appVersion)}</b></p>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>このアプリでできること</b></p>
            <ul style="line-height:1.8;margin-bottom:0;">
                <li>玉を落として、まれに発生する特別な演出や記録を楽しめます。</li>
                <li>一時停止・終了ボタンで、スマホでも無理なく遊びやすくしています。</li>
                <li>設定、図鑑、最高記録、ミッション、奇跡ログをこの端末に保存できます。</li>
                <li>研究所ホーム、奇跡アルバム、実験レポート履歴から、今日の記録をあとで振り返れます。</li>
                <li>一度読み込んだ主要ファイルは、通信が不安定な場所でも開きやすくなります。</li>
                <li>ユーザー設定から保存データの確認や削除ができます。</li>
            </ul>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>保存される情報</b></p>
            <p>ニックネーム、遊び方の設定、図鑑、記録、ミッション進行状況は、この端末のブラウザ保存領域に保存されます。</p>
            <p>アカウント作成、位置情報取得、プレイ記録の外部送信は行いません。</p>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>通信について</b></p>
            <p>動画演出をONにしている場合、演出用動画を読み込むために通信が発生することがあります。</p>
            <p>通信が不安定な場合は、設定から動画演出をOFFにすると軽く遊べます。</p>
        </div>
    `;
}

export function getRecordsHtml(params: {
    savedRecords: SavedRecords;
    rankLevel: number;
    rankLabel: string;
    unlockedThemes: number;
    themeCount: number;
    missionCount: number;
    missionTotal: number;
}): string {
    return `
        <p><b>実験回数:</b> ${params.savedRecords.totalRuns.toLocaleString()}回</p>
        <p><b>最大実処理数:</b> ${params.savedRecords.maxFinishedCount.toLocaleString()}回</p>
        <p><b>最大指定投下数:</b> ${params.savedRecords.maxTargetCount.toLocaleString()}回</p>
        <p><b>最高レア:</b> ${escapeHtml(params.savedRecords.bestRank)} / ${escapeHtml(params.savedRecords.bestLabel)}</p>
        <p><b>最高スコア:</b> ${params.savedRecords.bestScore.toLocaleString()}</p>
        <p><b>通算スコア:</b> ${params.savedRecords.totalScore.toLocaleString()}</p>
        <p><b>研究員ランク:</b> Lv.${params.rankLevel} ${escapeHtml(params.rankLabel)}</p>
        <p><b>テーマ解放:</b> ${params.unlockedThemes} / ${params.themeCount}</p>
        <p><b>ミッション達成種類:</b> ${params.missionCount} / ${params.missionTotal}</p>
        <p>保存はブラウザ内です。別端末や別ブラウザでは共有されません。</p>
        <p style="opacity:.75;">消したい場合はブラウザのサイトデータ削除でリセットできます。</p>
    `;
}
