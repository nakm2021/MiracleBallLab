import { escapeHtml } from "./utils";
import {
    ACHIEVEMENTS,
    BLESSINGS,
    RELICS,
    UNIVERSES,
    getSeededRoute,
    type MultiverseResult,
    type MultiverseState,
} from "./multiverseExpedition";

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
    const route = getSeededRoute(seed, UNIVERSES[state.totalExpeditions % UNIVERSES.length].id)
        .map(
            (node, index) =>
                `<div style="display:grid;place-items:center;min-width:94px;padding:12px;border-radius:18px;background:rgba(255,255,255,.07);"><b style="font-size:28px;">${node.icon}</b><small>${index + 1}. ${escapeHtml(node.label)}</small></div>`,
        )
        .join("<b style='color:#67e8f9;'>━━</b>");
    const blessings = BLESSINGS.map(
        (item) =>
            `<button data-home-action="multiverse-blessing:${item.id}" class="miracle-home-button" style="text-align:left;opacity:${state.blessings.includes(item.id) ? 0.6 : 1};"><b>${escapeHtml(item.name)}</b><br><small style="color:#86efac;">${escapeHtml(item.effect)}</small><br><small style="color:#fda4af;">代償: ${escapeHtml(item.curse)}</small></button>`,
    ).join("");
    const relics = RELICS.map((relic) => {
        const unlocked = state.unlockedRelics.includes(relic);
        const equipped = state.equippedRelics.includes(relic);
        return `<button data-home-action="multiverse-relic:${escapeHtml(relic)}" class="miracle-home-button" ${unlocked ? "" : "disabled"}>${equipped ? "💠" : unlocked ? "◇" : "🔒"} ${escapeHtml(relic)}</button>`;
    }).join("");
    const achievements = ACHIEVEMENTS.map(
        (a) =>
            `<span class="miracle-status-pill" style="opacity:${state.achievements.includes(a.id) ? 1 : 0.38};">${state.achievements.includes(a.id) ? "🏆" : "◌"} ${escapeHtml(a.name)}</span>`,
    ).join("");
    const chronicle =
        state.chronicle
            .slice(0, 6)
            .map(
                (entry) =>
                    `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.1);"><b>${escapeHtml(entry.universeName)}</b> / ${entry.grade} / ${entry.score.toLocaleString()} / 宇宙片+${entry.shards}</div>`,
            )
            .join("") || "まだ年代記は白紙です。";
    return `<div style="display:grid;gap:18px;color:#e2e8f0;">
        <section style="padding:24px;border-radius:28px;background:radial-gradient(circle at 20% 0%,rgba(124,58,237,.5),transparent 42%),linear-gradient(135deg,#020617,#172554,#3b0764);box-shadow:inset 0 0 60px rgba(34,211,238,.12);">
            <div style="letter-spacing:.28em;color:#67e8f9;font-weight:1000;">MULTIVERSE EXPEDITION</div><h2 style="font-size:clamp(28px,6vw,54px);margin:8px 0;">多元宇宙遠征</h2>
            <p style="line-height:1.8;max-width:850px;">観測不能領域へ次元門を接続しました。宇宙ごとに物理法則・危険度・奇跡率が変化します。一度の実験が、そのまま別宇宙への遠征になります。</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;"><span class="miracle-status-pill">次元ランク ${state.rank}</span><span class="miracle-status-pill">宇宙片 ${state.shards.toLocaleString()}</span><span class="miracle-status-pill">遠征 ${state.totalExpeditions}回</span><span class="miracle-status-pill">遺物 ${state.unlockedRelics.length}/${7}</span></div>
            <div style="margin-top:16px;opacity:.8;">共有シード：<b style="user-select:all;color:#a5f3fc;">${escapeHtml(seed)}</b></div>
        </section>${last}
        <section class="miracle-user-card" style="background:linear-gradient(135deg,rgba(15,23,42,.96),rgba(49,46,129,.72));color:#e2e8f0;"><h3>次元航路・デイリー共通シード</h3><div style="display:flex;align-items:center;gap:8px;overflow:auto;padding:8px 0;">${route}</div><p style="opacity:.75;">未知現象、祭壇、商人、過去の自分のゴーストを越え、最終地点の宇宙ボスへ到達します。</p></section>
        <section class="miracle-user-card"><h3>祝福と呪いビルド</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px;">${blessings}</div><p>現在の呪い：${state.curses.map(escapeHtml).join(" / ") || "なし"}</p></section>
        <section class="miracle-user-card"><h3>遺物装備（最大3個）</h3><div style="display:flex;gap:8px;flex-wrap:wrap;">${relics}</div><h3>使い魔融合</h3><p>現在形態：<b>${escapeHtml(state.familiarForm)}</b></p><button data-home-action="multiverse-familiar" class="miracle-home-button miracle-home-primary">宇宙片で進化・融合</button></section>
        <section class="miracle-user-card"><h3>実績・称号・真エンディング</h3><div style="display:flex;gap:8px;flex-wrap:wrap;">${achievements}</div><p>称号：${state.titles.map(escapeHtml).join(" / ")}</p>${state.trueEndingUnlocked ? "<div style='font-size:1.3em;color:#fde68a;font-weight:1000;'>✦ 秘密宇宙「観測者の外側」と真エンディングが解放されました</div>" : "<p style='opacity:.65;'>六宇宙と遺物を集めると、存在しない第七宇宙が観測されます。</p>"}</section>
        <section class="miracle-user-card"><h3>遠征年代記・ゴースト記録</h3>${chronicle}<p>自己ゴースト最高記録：<b>${state.bestScore.toLocaleString()}</b></p></section>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;">${worlds}</div>
    </div>`;
}

export function getMultiverseResultHtml(result: MultiverseResult | null): string {
    if (!result) return "";
    return `<div style="margin:0 auto 18px;max-width:760px;padding:18px;border-radius:22px;background:linear-gradient(135deg,rgba(30,64,175,.28),rgba(126,34,206,.3));border:1px solid rgba(103,232,249,.5);color:#e0f2fe;"><div style="letter-spacing:.18em;font-weight:1000;color:#67e8f9;">EXPEDITION COMPLETE</div><div style="font-size:1.5em;font-weight:1000;margin:5px 0;">${escapeHtml(result.universeName)}から帰還</div><div>遠征評価 <b>${result.grade}</b> / 宇宙片 <b>+${result.shards}</b>${result.relic ? ` / 新遺物 <b>${escapeHtml(result.relic)}</b>` : ""}</div></div>`;
}
