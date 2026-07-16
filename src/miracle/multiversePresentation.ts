import { escapeHtml } from "./utils";
import { UNIVERSES, type MultiverseResult, type MultiverseState } from "./multiverseExpedition";

export function getMultiverseExpeditionHtml(state: MultiverseState, seed: string): string {
    const worlds = UNIVERSES.map((world) => {
        const visits = state.discovered[world.id] ?? 0;
        return `<article style="padding:18px;border-radius:22px;border:1px solid ${world.color}66;background:linear-gradient(145deg,rgba(2,6,23,.96),${world.color}20);color:#f8fafc;box-shadow:0 12px 34px rgba(2,6,23,.34);">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;"><div style="font-size:42px;color:${world.color};text-shadow:0 0 22px ${world.color};">${world.icon}</div><span class="miracle-status-pill">危険度 ${"◆".repeat(world.risk)}</span></div>
            <h3 style="margin:8px 0 2px;font-size:1.28em;">${escapeHtml(world.name)}</h3><div style="color:${world.color};font-weight:900;">${escapeHtml(world.subtitle)}</div>
            <p style="line-height:1.7;opacity:.86;min-height:3.4em;">${escapeHtml(world.description)}</p>
            <div style="padding:10px;border-radius:14px;background:rgba(255,255,255,.07);"><b>宇宙法則：${escapeHtml(world.lawLabel)}</b><br><small>${world.targetCount}観測 / 同時${world.activeLimit} / ${world.probabilityMode.toUpperCase()}</small></div>
            <button data-home-action="multiverse-start:${world.id}" class="miracle-home-button miracle-home-primary" style="width:100%;margin-top:14px;">次元門を開く</button>
            <div style="text-align:center;margin-top:7px;font-size:.82em;opacity:.7;">踏破記録 ${visits}回</div>
        </article>`;
    }).join("");
    const last = state.lastResult
        ? `<div class="miracle-user-card"><b>直近の帰還：${escapeHtml(state.lastResult.universeName)} / 評価 ${state.lastResult.grade}</b><br>宇宙片 +${state.lastResult.shards}${state.lastResult.relic ? ` / 遺物「${escapeHtml(state.lastResult.relic)}」を発見` : ""}</div>`
        : "";
    return `<div style="display:grid;gap:18px;color:#e2e8f0;">
        <section style="padding:24px;border-radius:28px;background:radial-gradient(circle at 20% 0%,rgba(124,58,237,.5),transparent 42%),linear-gradient(135deg,#020617,#172554,#3b0764);box-shadow:inset 0 0 60px rgba(34,211,238,.12);">
            <div style="letter-spacing:.28em;color:#67e8f9;font-weight:1000;">MULTIVERSE EXPEDITION</div><h2 style="font-size:clamp(28px,6vw,54px);margin:8px 0;">多元宇宙遠征</h2>
            <p style="line-height:1.8;max-width:850px;">観測不能領域へ次元門を接続しました。宇宙ごとに物理法則・危険度・奇跡率が変化します。一度の実験が、そのまま別宇宙への遠征になります。</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;"><span class="miracle-status-pill">次元ランク ${state.rank}</span><span class="miracle-status-pill">宇宙片 ${state.shards.toLocaleString()}</span><span class="miracle-status-pill">遠征 ${state.totalExpeditions}回</span><span class="miracle-status-pill">遺物 ${state.unlockedRelics.length}/${7}</span></div>
            <div style="margin-top:16px;opacity:.8;">共有シード：<b style="user-select:all;color:#a5f3fc;">${escapeHtml(seed)}</b></div>
        </section>${last}<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;">${worlds}</div>
    </div>`;
}

export function getMultiverseResultHtml(result: MultiverseResult | null): string {
    if (!result) return "";
    return `<div style="margin:0 auto 18px;max-width:760px;padding:18px;border-radius:22px;background:linear-gradient(135deg,rgba(30,64,175,.28),rgba(126,34,206,.3));border:1px solid rgba(103,232,249,.5);color:#e0f2fe;"><div style="letter-spacing:.18em;font-weight:1000;color:#67e8f9;">EXPEDITION COMPLETE</div><div style="font-size:1.5em;font-weight:1000;margin:5px 0;">${escapeHtml(result.universeName)}から帰還</div><div>遠征評価 <b>${result.grade}</b> / 宇宙片 <b>+${result.shards}</b>${result.relic ? ` / 新遺物 <b>${escapeHtml(result.relic)}</b>` : ""}</div></div>`;
}
