import type { FamiliarExpeditionPlan, FamiliarExpeditionState } from "./familiarExpedition";
import type { MiracleTicketState } from "./miracleTicket";
import type { SecretResearchNoteDef, SecretResearchNoteState } from "./secretResearchNote";
import type { FamiliarDef, FamiliarState } from "./types";
import { escapeHtml } from "./utils";

export type FamiliarExpeditionProgressView = {
    active: boolean;
    complete: boolean;
    percent: number;
    remainingMs: number;
    plan?: FamiliarExpeditionPlan;
};

export function getMiracleTicketHtml(state: MiracleTicketState): string {
    const rows = state.history.slice(0, 12).map((entry) => `
        <div style="padding:10px 0;border-bottom:1px solid rgba(80,90,120,.14);">
            <b>${escapeHtml(entry.label)}</b> <span style="font-weight:900;">+${entry.amount}</span> <span style="opacity:.72;">${entry.kind}</span><br>
            <span style="opacity:.7;">${escapeHtml(entry.reason)} / ${new Date(entry.at).toLocaleString()}</span>
        </div>
    `).join("") || `<p style="opacity:.75;">まだチケット履歴はありません。SR以上の奇跡を観測すると集まりやすいです。</p>`;
    return `
        <p>奇跡を観測するとチケットを入手できます。使用すると今回の研究スコアにブーストを入れられます。</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:12px 0;">
            <div style="border-radius:16px;background:rgba(255,255,255,.72);padding:12px;"><b>通常</b><br><span style="font-size:1.5em;font-weight:900;">${state.normal.toLocaleString()}</span></div>
            <div style="border-radius:16px;background:rgba(255,255,255,.72);padding:12px;"><b>レア</b><br><span style="font-size:1.5em;font-weight:900;">${state.rare.toLocaleString()}</span></div>
            <div style="border-radius:16px;background:rgba(255,255,255,.72);padding:12px;"><b>神域</b><br><span style="font-size:1.5em;font-weight:900;">${state.divine.toLocaleString()}</span></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;">
            <button id="ticket-small-boost">通常3枚で小ブースト</button>
            <button id="ticket-rare-boost">通常8枚+レア1枚で大ブースト</button>
            <button id="ticket-divine-boost">神域1枚で超ブースト</button>
        </div>
        <h3>履歴</h3>
        <div style="border-radius:18px;background:rgba(255,255,255,.64);padding:4px 14px;">${rows}</div>
    `;
}

export function getSecretResearchNoteHtml(notes: SecretResearchNoteDef[], state: SecretResearchNoteState): string {
    const rows = notes.map((note) => {
        const ts = state.unlocked[note.id];
        const unlocked = !!ts;
        return `<div style="border-radius:16px;margin:10px 0;padding:12px;background:${unlocked ? "rgba(255,255,255,.74)" : "rgba(15,23,42,.08)"};border:1px solid rgba(15,23,42,.12);">
            <div style="font-weight:900;font-size:1.05em;">${unlocked ? "📖" : "🔒"} ${unlocked ? escapeHtml(note.title) : "未解放の研究ノート"}</div>
            <div style="margin-top:6px;opacity:.78;">ヒント: ${escapeHtml(note.hint)}</div>
            <div style="margin-top:8px;line-height:1.75;">${unlocked ? escapeHtml(note.body) : "条件を満たすと内容が表示されます。"}</div>
            <div style="margin-top:6px;opacity:.62;">${unlocked ? new Date(ts).toLocaleString() : note.source}</div>
        </div>`;
    }).join("");
    return `
        <p>条件達成で解放される読み物です。ゲームの裏側にある小さな物語として記録されます。</p>
        <p><b>解放:</b> ${Object.keys(state.unlocked).length} / ${notes.length}</p>
        ${rows}
    `;
}

export function getFamiliarExpeditionHtml(
    state: FamiliarExpeditionState,
    progress: FamiliarExpeditionProgressView,
    plans: FamiliarExpeditionPlan[],
    formatDuration: (value: number) => string,
): string {
    const activeHtml = progress.active && state.active ? `
        <div style="border-radius:18px;background:rgba(255,255,255,.76);padding:14px;margin:10px 0;">
            <b>遠征中:</b> ${escapeHtml(progress.plan?.title ?? state.active.planId)}<br>
            <span style="opacity:.78;">残り ${formatDuration(progress.remainingMs)}</span>
            <div style="height:14px;border-radius:999px;background:rgba(15,23,42,.12);overflow:hidden;margin-top:10px;"><div style="width:${progress.percent.toFixed(1)}%;height:100%;background:linear-gradient(90deg,#facc15,#fb7185);"></div></div>
            <button id="expedition-claim" style="margin-top:10px;font-weight:900;" ${progress.complete ? "" : "disabled"}>報酬を受け取る</button>
        </div>
    ` : `<p>現在、遠征中の使い魔はいません。</p>`;
    const planRows = plans.map((plan) => `
        <div style="border-radius:16px;background:rgba(255,255,255,.68);padding:12px;margin:8px 0;border:1px solid rgba(15,23,42,.12);">
            <b>${escapeHtml(plan.title)}</b><br>
            <span style="opacity:.78;">${escapeHtml(plan.description)}</span><br>
            <span style="opacity:.72;">報酬: XP ${plan.xp} / なつき ${plan.affection} / 通常券 ${plan.ticketNormal} / レア券 ${plan.ticketRare}</span><br>
            <button data-expedition-plan="${plan.id}" style="margin-top:8px;font-weight:900;" ${progress.active ? "disabled" : ""}>出発</button>
        </div>`).join("");
    const historyRows = state.history.slice(0, 8).map((x) => `<div style="padding:8px 0;border-bottom:1px solid rgba(80,90,120,.12);"><b>${escapeHtml(x.title)}</b> / ${new Date(x.at).toLocaleString()}</div>`).join("") || `<p style="opacity:.7;">遠征履歴はまだありません。</p>`;
    return `
        <p>アプリを閉じている間も、開始時刻からの経過時間で報酬を受け取れます。</p>
        ${activeHtml}
        <h3>遠征先</h3>
        ${planRows}
        <h3>履歴</h3>
        <div style="border-radius:18px;background:rgba(255,255,255,.58);padding:4px 14px;">${historyRows}</div>
    `;
}

export function getFamiliarPopupHtml(
    def: FamiliarDef,
    state: FamiliarState,
    level: { nextXp: number; progressPercent: number },
    mood: string,
    defs: FamiliarDef[],
): string {
    const unlockedRows = defs.map((item) => {
        const unlocked = Boolean(state.unlocked[item.kind]);
        return `<div style="border-radius:16px;padding:12px;margin:8px 0;background:${unlocked ? "rgba(255,255,255,.72)" : "rgba(15,23,42,.08)"};border:1px solid rgba(15,23,42,.12);">
            <div style="font-weight:900;font-size:1.05em;">${item.emoji} ${item.name} ${unlocked ? "" : "🔒"}</div>
            <div style="opacity:.86;">${escapeHtml(item.description)}</div>
            <div style="margin-top:6px;font-size:.9em;opacity:.8;">秘密契約ヒント: ${item.secretCode ? "専用コードあり" : "最初から同行"}</div>
            ${unlocked ? `<button data-familiar-call="${item.kind}" style="margin-top:8px;font-weight:900;padding:8px 14px;border-radius:999px;">呼び出す</button>` : ""}
        </div>`;
    }).join("");
    return `
        <p><b>${def.emoji} ${escapeHtml(state.name)}</b> が同行中です。</p>
        <div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));">
            <div><b>Lv</b>: ${state.level}</div>
            <div><b>経験値</b>: ${state.xp.toLocaleString()} / 次 ${level.nextXp.toLocaleString()}</div>
            <div><b>なつき度</b>: ${state.affection.toLocaleString()} / ${escapeHtml(mood)}</div>
            <div><b>補助回数</b>: ${state.assistCount.toLocaleString()}</div>
        </div>
        <div style="margin:12px 0;height:14px;border-radius:999px;background:rgba(15,23,42,.12);overflow:hidden;"><div style="width:${level.progressPercent.toFixed(1)}%;height:100%;background:linear-gradient(90deg,${def.color},${def.accent});"></div></div>
        <p><b>超機能:</b> 実験中に使い魔が自動補助します。幸運は予兆、見張りは捨て区画、暴走は盤面干渉が強めです。</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;">
            <button data-familiar-mode="assist">補助</button>
            <button data-familiar-mode="lucky">幸運</button>
            <button data-familiar-mode="guard">見張り</button>
            <button data-familiar-mode="chaos">暴走</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;">
            <button id="familiar-expedition-button" style="font-weight:900;">使い魔遠征</button>
            <button id="familiar-ticket-button" style="font-weight:900;">奇跡チケット</button>
            <button id="familiar-note-button" style="font-weight:900;">秘密ノート</button>
        </div>
        <p><b>スマホ用秘密契約:</b> PCのキーボードがなくても下の入力で秘密コードを試せます。</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <input id="familiar-secret-input" placeholder="秘密コード" style="flex:1;min-width:160px;padding:12px;border-radius:14px;border:1px solid #b8c1d1;font-size:16px;">
            <button id="familiar-secret-button">契約</button>
        </div>
        <h3 style="margin-top:16px;">使い魔図鑑</h3>
        ${unlockedRows}
    `;
}
