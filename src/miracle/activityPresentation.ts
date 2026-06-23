import type { DailyFortune, FusionDef, MiracleChainDef, MiracleClip, MissionDef } from "./types";
import { escapeHtml } from "./utils";

export function getMissionHtml(params: {
    missions: MissionDef[];
    progress: Record<string, boolean>;
    totalCompleted: Record<string, number>;
    isMobile: boolean;
}): string {
    const rows = params.missions.map((mission) => {
        const cleared = !!params.progress[mission.id];
        const totalClear = params.totalCompleted[mission.id] ?? 0;
        return `<div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
                <div style="font-weight:900;font-size:${params.isMobile ? 22 : 18}px;color:${cleared ? "#166534" : "#1f2937"};">${cleared ? "✅" : "⬜"} ${escapeHtml(mission.title)}</div>
                <div style="font-weight:800;color:#475569;">+${mission.rewardScore.toLocaleString()} score</div>
            </div>
            <div style="margin-top:6px;opacity:.82;line-height:1.55;">${escapeHtml(mission.description)}</div>
            <div style="margin-top:6px;font-size:${params.isMobile ? 16 : 14}px;opacity:.72;">通算達成 ${totalClear}回</div>
        </div>`;
    }).join("");
    return `<div style="margin-top:8px;border-radius:18px;background:rgba(255,255,255,.72);padding:${params.isMobile ? "8px 14px" : "8px 16px"};">${rows}</div>`;
}

export function getShareHtml(): string {
    return `
        <p>奇跡クリップのGIF保存は「リプレイ」から行えます。ここでは投稿文コピー、現在画面のスクリーンショット保存、縦長シェアカード保存を行えます。</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:18px;">
            <button id="sns-copy-button" style="font-size:18px;padding:12px 18px;border-radius:999px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:900;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);">投稿文コピー</button>
            <button id="screenshot-save-button" style="font-size:18px;padding:12px 18px;border-radius:999px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:900;background:linear-gradient(180deg,#fff7ed 0%,#fed7aa 100%);">現在画面を保存</button>
            <button id="sns-card-button" style="font-size:18px;padding:12px 18px;border-radius:999px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:900;background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);">SNSカード保存</button>
        </div>
    `;
}

export function getDailyFortuneHtml(fortune: DailyFortune, isMobile: boolean): string {
    return `
        <div style="display:grid;gap:12px;">
            <div style="font-size:${isMobile ? "30px" : "26px"};font-weight:1000;">${escapeHtml(fortune.title)}</div>
            <div><b>今日の奇跡率:</b> x${fortune.rateBoost.toFixed(2)}</div>
            <div><b>今日の注目奇跡:</b> ${escapeHtml(fortune.luckyKind)}</div>
            <div><b>ラッキー受け皿:</b> ${fortune.luckyBin}</div>
            <div style="line-height:1.7;">${escapeHtml(fortune.advice)}</div>
            <div style="opacity:.7;font-size:${isMobile ? "15px" : "13px"};">日付ごとに固定されます。奇跡率はレア抽選にほんの少しだけ加算されます。</div>
        </div>
    `;
}

export type FusionView = {
    fusion: FusionDef;
    unlocked: boolean;
    ready: boolean;
    sources: string;
};

export type ChainView = {
    chain: MiracleChainDef;
    names: string;
    unlocked: boolean;
};

export function getFusionHtml(params: {
    fusions: FusionView[];
    chains: ChainView[];
    isMobile: boolean;
}): string {
    const rows = params.fusions.map(({ fusion, unlocked, ready, sources }) => `<div style="padding:13px 0;border-bottom:1px solid rgba(80,90,120,.16);">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">
            <div style="font-weight:1000;font-size:${params.isMobile ? "22px" : "18px"};color:${unlocked ? "#166534" : ready ? "#854d0e" : "#334155"};">${unlocked ? "✅" : ready ? "🧪" : "🔒"} ${unlocked || ready ? escapeHtml(fusion.label) : "未解放の派生奇跡"} [${escapeHtml(fusion.rank)}]</div>
            <div style="font-weight:900;color:#475569;">+${fusion.rewardScore.toLocaleString()} score</div>
        </div>
        <div style="margin-top:6px;opacity:.80;line-height:1.55;">${unlocked ? escapeHtml(fusion.description) : "素材奇跡を集めると解放されます。"}</div>
        <div style="margin-top:6px;opacity:.72;">素材: ${escapeHtml(sources)}</div>
    </div>`).join("");
    const chainRows = params.chains.map(({ chain, names, unlocked }) => `<div style="padding:10px 0;border-bottom:1px dashed rgba(80,90,120,.18);"><b>${unlocked ? "✅" : "🔁"} ${escapeHtml(chain.label)} [${escapeHtml(chain.rank)}]</b><div style="margin-top:4px;opacity:.74;">順番: ${escapeHtml(names)}</div><div style="margin-top:4px;opacity:.74;">${escapeHtml(chain.description)}</div></div>`).join("");
    return `<p>特定の奇跡を観測すると、合成・派生の研究記録が解放されます。</p>${rows}<h3 style="margin-top:18px;">実験中の奇跡連鎖</h3><p>下記の順番で奇跡が続くと、その実験中だけの連鎖演出が発生します。</p>${chainRows}`;
}

export function getReplayHtml(params: {
    clips: MiracleClip[];
    isMobile: boolean;
    playLabel: string;
    gifLabel: string;
    formatProbability: (denominator: number) => string;
}): string {
    return params.clips.map((clip, i) => `
        <div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;">
            <div>
                <div style="font-weight:900;">${i + 1}. ${escapeHtml(clip.label)} [${escapeHtml(clip.rank)}]</div>
                <div style="opacity:.76;">${params.formatProbability(clip.denominator)} / ${clip.finishedCount.toLocaleString()}投目 / ${new Date(clip.createdAt).toLocaleTimeString()}</div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;">
                <button data-replay-id="${clip.id}" style="font-size:${params.isMobile ? "18px" : "16px"};padding:10px 16px;border-radius:999px;border:1px solid rgba(87,112,51,.28);background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);font-weight:900;cursor:pointer;">${escapeHtml(params.playLabel)}</button>
                <button data-gif-id="${clip.id}" style="font-size:${params.isMobile ? "18px" : "16px"};padding:10px 16px;border-radius:999px;border:1px solid rgba(100,90,180,.28);background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);font-weight:900;cursor:pointer;">${escapeHtml(params.gifLabel)}</button>
            </div>
        </div>
    `).join("");
}
