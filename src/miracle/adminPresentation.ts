import type { SpecialEventDef } from "./types";
import { escapeHtml } from "./utils";

export function getAdminGateHtml(params: {
    isMobile: boolean;
    uiFontPx: number;
    uiButtonFontPx: number;
    roundedUiFont: string;
}): string {
    return `
        <p>研究主任モードに入るための合言葉を入力してください。</p>
        <input id="admin-passcode-input" type="password" autocomplete="off" placeholder="合言葉" style="width:100%;box-sizing:border-box;padding:${params.isMobile ? "16px" : "12px 14px"};border-radius:18px;border:1px solid #b8c1d1;font-size:${params.uiFontPx}px;font-family:${params.roundedUiFont};">
        <div id="admin-passcode-message" style="margin-top:10px;font-weight:900;color:#7f1d1d;min-height:1.4em;"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
            <button id="admin-unlock-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px 22px;border-radius:999px;border:1px solid rgba(87,112,51,.28);background:linear-gradient(180deg,#fee2e2 0%,#fecaca 100%);color:#7f1d1d;cursor:pointer;">解放する</button>
        </div>
    `;
}

export function getAdminMiracleButtonHtml(
    def: SpecialEventDef,
    params: {
        isMobile: boolean;
        formatProbability: (denominator: number) => string;
    },
): string {
    return `<button class="admin-miracle-button" data-kind="${escapeHtml(def.kind)}" style="font-size:${params.isMobile ? "16px" : "15px"};font-weight:900;padding:10px 12px;border-radius:14px;border:1px solid rgba(127,29,29,.24);background:linear-gradient(180deg,#fff7ed 0%,#fed7aa 100%);color:#7c2d12;cursor:pointer;text-align:left;white-space:normal;overflow-wrap:anywhere;line-height:1.2;">${escapeHtml(def.label)}<br><span style="font-size:.82em;opacity:.78;">[${escapeHtml(def.rank)}] ${params.formatProbability(def.denominator)}</span></button>`;
}

export function getAdminPanelHtml(params: {
    miracleButtons: string;
    isMobile: boolean;
    uiButtonFontPx: number;
}): string {
    return `
        <p><b>管理者専用のテスト操作です。</b> 1兆分の1級の演出もボタンで強制発動できます。</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${params.isMobile ? "150px" : "180px"},1fr));gap:10px;margin:14px 0;">
            <button id="admin-cosmic-egg-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(127,29,29,.25);background:linear-gradient(180deg,#2e1065 0%,#111827 100%);color:#fff;cursor:pointer;">宇宙卵<br><span style="font-size:.75em;">1兆分の1</span></button>
            <button id="admin-sword-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(14,116,144,.25);background:linear-gradient(180deg,#e0f2fe 0%,#bae6fd 100%);color:#0c4a6e;cursor:pointer;">剣の衝撃</button>
            <button id="admin-all-effects-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(87,112,51,.25);background:linear-gradient(180deg,#dcfce7 0%,#bbf7d0 100%);color:#14532d;cursor:pointer;">演出系を全部ON</button>
            <button id="admin-r2-video-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(14,116,144,.25);background:linear-gradient(180deg,#e0f2fe 0%,#bae6fd 100%);color:#0c4a6e;cursor:pointer;">R2動画確認</button>
            <button id="admin-offline-video-save-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(14,116,144,.25);background:linear-gradient(180deg,#ecfeff 0%,#67e8f9 100%);color:#155e75;cursor:pointer;">オフライン動画保存</button>
            <button id="admin-log-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(87,112,51,.25);background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);color:#26351f;cursor:pointer;">管理者ログ</button>
            <button id="admin-runtime-guard-log-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(14,116,144,.25);background:linear-gradient(180deg,#ecfeff 0%,#a5f3fc 100%);color:#155e75;cursor:pointer;">復旧ログ</button>
            <button id="admin-tempura-secret-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(245,158,11,.32);background:linear-gradient(180deg,#fff7ed 0%,#fdba74 100%);color:#7c2d12;cursor:pointer;">穴子天ぷら</button>
            <button id="admin-magic-answer-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(88,28,135,.25);background:linear-gradient(180deg,#f3e8ff 0%,#ddd6fe 100%);color:#581c87;cursor:pointer;">魔法陣回答</button>
            <button id="admin-skill-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(87,112,51,.25);background:linear-gradient(180deg,#eef2ff 0%,#c7d2fe 100%);color:#312e81;cursor:pointer;">スキル+99</button>
            <button id="admin-unlock-book-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(87,112,51,.25);background:linear-gradient(180deg,#fef9c3 0%,#fde68a 100%);color:#713f12;cursor:pointer;">図鑑テスト解放</button>
            <button id="admin-lock-button" style="font-size:${params.uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(127,29,29,.25);background:linear-gradient(180deg,#fee2e2 0%,#fecaca 100%);color:#7f1d1d;cursor:pointer;">管理者解除</button>
        </div>
        <h3 style="margin-top:18px;">全レア演出テスト</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${params.isMobile ? "142px" : "170px"},1fr));gap:8px;">${params.miracleButtons}</div>
    `;
}

export function getAnagoTempuraSecretHtml(): string {
    return `
        <div class="miracle-user-card" style="text-align:center;background:radial-gradient(circle at 50% 0%,rgba(255,247,237,.96),rgba(251,191,36,.58),rgba(124,45,18,.20));">
            <div style="font-size:clamp(54px,12vw,110px);line-height:1;">🍤</div>
            <div style="font-size:clamp(24px,5vw,44px);font-weight:1000;margin-top:10px;">穴子の天ぷら、研究所奥義</div>
            <p style="line-height:1.9;text-align:left;max-width:720px;margin:16px auto 0;">管理者用メモ：隠し魔法陣 <b>穴子天ぷら陣</b> を追加済みです。魔法陣判定で選ばれると、衣が流星のように舞う演出として扱われます。表向きはただの研究所ですが、奥では穴子が揚がっています。</p>
        </div>
    `;
}

export function getAdminRemoteVideoLoadingHtml(manifestUrl: string): string {
    return `
        <p>R2 の <b>manifest.json</b> を再取得しています。</p>
        <p style="opacity:.72;">${escapeHtml(manifestUrl)}</p>
    `;
}

export function getAdminRemoteVideoEmptyHtml(): string {
    return `
        <p>manifest.json に動画が見つかりませんでした。</p>
        <p style="opacity:.72;">動画は <code>kind: "video"</code> で登録してください。</p>
    `;
}

export function getAdminRemoteVideoRowHtml(params: {
    index: number;
    id: string;
    rank: string;
    mainUrl: string;
    opacity: number;
    weight: number;
    isMobile: boolean;
}): string {
    return `
        <div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.18);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;">
            <div style="min-width:0;">
                <div style="font-weight:1000;font-size:${params.isMobile ? "18px" : "16px"};">
                    ${params.index + 1}. [${escapeHtml(params.rank)}] ${escapeHtml(params.id)}
                </div>
                <div style="margin-top:4px;opacity:.78;font-size:${params.isMobile ? "14px" : "13px"};line-height:1.5;">
                    秒数: 10秒固定 / 透明度: ${escapeHtml(params.opacity)} / weight: ${escapeHtml(params.weight)}
                </div>
                <div style="margin-top:4px;opacity:.62;font-size:12px;word-break:break-all;">
                    ${escapeHtml(params.mainUrl)}
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <button class="admin-r2-video-play-button" data-asset-id="${escapeHtml(params.id)}" style="font-size:${params.isMobile ? "16px" : "14px"};font-weight:900;padding:10px 14px;border-radius:999px;border:1px solid rgba(14,116,144,.24);background:linear-gradient(180deg,#e0f2fe 0%,#bae6fd 100%);color:#0c4a6e;cursor:pointer;">再生</button>
                <button class="admin-r2-video-open-button" data-asset-id="${escapeHtml(params.id)}" style="font-size:${params.isMobile ? "16px" : "14px"};font-weight:900;padding:10px 14px;border-radius:999px;border:1px solid rgba(87,112,51,.24);background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);color:#26351f;cursor:pointer;">URLを開く</button>
            </div>
        </div>
    `;
}

export function getAdminRemoteVideoListHtml(params: { count: number; rows: string; isMobile: boolean }): string {
    return `
        <p><b>${params.count}件</b> の動画を確認できます。</p>
        <p style="opacity:.72;line-height:1.6;">
            「再生」を押すと、このポップアップを閉じて対象動画を半透明オーバーレイで強制再生します。
        </p>
        <div style="margin-top:10px;border-radius:18px;background:rgba(255,255,255,.70);padding:4px 14px;">
            ${params.rows}
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
            <button id="admin-r2-video-reload-button" style="font-size:${params.isMobile ? "18px" : "16px"};font-weight:900;padding:10px 16px;border-radius:999px;border:1px solid rgba(87,112,51,.24);background:linear-gradient(180deg,#fef9c3 0%,#fde68a 100%);color:#713f12;cursor:pointer;">manifest再読込</button>
            <button id="admin-r2-video-stop-button" style="font-size:${params.isMobile ? "18px" : "16px"};font-weight:900;padding:10px 16px;border-radius:999px;border:1px solid rgba(127,29,29,.24);background:linear-gradient(180deg,#fee2e2 0%,#fecaca 100%);color:#7f1d1d;cursor:pointer;">動画停止</button>
        </div>
    `;
}

export function getRuntimeGuardLogHtml(logs: Array<{ at: number; reason: string; detail: string }>): string {
    const rows =
        logs
            .slice()
            .reverse()
            .map(
                (entry, index) => `
        <div style="padding:10px 0;border-bottom:1px solid rgba(100,116,139,.18);">
            <div style="font-weight:1000;">${index + 1}. ${escapeHtml(entry.reason)}</div>
            <div style="opacity:.72;font-size:.86em;">${escapeHtml(new Date(entry.at).toLocaleString())}</div>
            <div style="margin-top:4px;line-height:1.55;word-break:break-all;">${escapeHtml(entry.detail)}</div>
        </div>
    `,
            )
            .join("") || `<p>復旧ログはまだありません。</p>`;

    return `
        <p>画面縮小・白画面・操作不能などを検知したときのログです。</p>
        <div class="miracle-user-card" style="max-height:58dvh;overflow:auto;">${rows}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
            <button id="runtime-guard-recover-button" class="miracle-home-button miracle-home-primary">今すぐ復旧</button>
            <button id="runtime-guard-clear-button" class="miracle-home-button">ログ削除</button>
        </div>
    `;
}

export function getEmergencyRuntimeLogOverlayHtml(text: string): string {
    return `
        <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:10px;position:sticky;top:0;background:rgba(0,0,0,.92);padding-bottom:8px;">
            <div style="font-weight:1000;font-size:18px;">緊急ログ</div>
            <button id="emergency-log-close" style="font-size:18px;font-weight:900;padding:8px 12px;border-radius:12px;border:1px solid #94a3b8;background:#e2e8f0;color:#0f172a;">閉じる</button>
        </div>
        <p style="line-height:1.6;margin:0 0 10px;">下のテキスト欄を長押ししてコピーできます。ボタンが効く場合は「ログをコピー」を押してください。</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
            <button id="emergency-log-copy" style="font-size:16px;font-weight:900;padding:10px 14px;border-radius:12px;border:1px solid #67e8f9;background:#22d3ee;color:#082f49;">ログをコピー</button>
            <button id="emergency-log-recover" style="font-size:16px;font-weight:900;padding:10px 14px;border-radius:12px;border:1px solid #86efac;background:#22c55e;color:#052e16;">今すぐ復旧</button>
            <button id="emergency-log-clear" style="font-size:16px;font-weight:900;padding:10px 14px;border-radius:12px;border:1px solid #fecaca;background:#ef4444;color:#fff;">ログ削除</button>
        </div>
        <textarea id="emergency-log-textarea" readonly style="width:100%;height:68vh;box-sizing:border-box;border-radius:14px;padding:12px;font-size:12px;line-height:1.45;background:#0f172a;color:#d1fae5;border:1px solid #475569;white-space:pre;">${escapeHtml(text)}</textarea>
    `;
}
