import type { GachaRewardEntry, SpecialEventDef } from "./types";
import { getRankScore } from "./rarity";
import { escapeHtml } from "./utils";
import { getGachaRewardImageHtml } from "./miraclePresentation";

export function getMiracleGachaHtml(options: {
    point: number;
    onceCost: number;
    tenCost: number;
    recentRewards: GachaRewardEntry[];
}): string {
    const canOnce = options.point >= options.onceCost;
    const canTen = options.point >= options.tenCost;
    const recentRewards = options.recentRewards.slice(0, 6).map((entry) => `
        <div style="padding:10px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <b>${escapeHtml(entry.label)} [${escapeHtml(entry.rank)}]</b>
            <div style="opacity:.78;line-height:1.55;">${escapeHtml(entry.rewardLabel)} / ${new Date(entry.createdAt).toLocaleString()}</div>
        </div>
    `).join("") || `<div style="opacity:.72;">まだガチャ報酬はありません。</div>`;
    return `
        <div style="display:grid;gap:18px;text-align:center;">
            <div class="miracle-user-card" style="background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.95),rgba(255,230,160,.86),rgba(160,80,255,.34));">
                <div style="font-size:clamp(46px,12vw,120px);font-weight:1000;line-height:1;text-shadow:0 8px 28px rgba(0,0,0,.22);">奇跡ガチャ</div>
                <div style="margin-top:12px;font-size:clamp(18px,4vw,34px);font-weight:1000;">貯めた奇跡ガチャPで研究装置を回します</div>
                <div style="margin-top:10px;font-size:clamp(20px,4vw,34px);font-weight:1000;color:#713f12;">所持P：${options.point.toLocaleString()}P</div>
                <div style="margin-top:8px;opacity:.78;font-weight:900;line-height:1.7;">1回 ${options.onceCost}P / 10連 ${options.tenCost}P</div>
            </div>
            <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
                <button id="miracle-gacha-once-button" class="miracle-home-button miracle-home-primary" style="width:168px;height:48px;font-size:13px;padding:5px 10px;white-space:normal;line-height:1.08;" ${canOnce ? "" : "disabled"}>1回まわす</button>
                <button id="miracle-gacha-ten-button" class="miracle-home-button miracle-home-primary" style="width:168px;height:48px;font-size:13px;padding:5px 10px;white-space:normal;line-height:1.08;" ${canTen ? "" : "disabled"}>10連まわす</button>
            </div>
            <div class="miracle-user-card" style="text-align:left;">
                <b>排出されるもの</b>
                <ul style="line-height:1.85;margin:10px 0 0;padding-left:1.3em;">
                    <li>奇跡演出カード: ガチャ履歴に保存されます。</li>
                    <li>テーマ解放: SR以上でランダムなテーマを1つ研究済みにします。</li>
                    <li>奇跡チケット: レア度に応じて通常・レア・神域チケットを付与します。</li>
                    <li>SSR以上では盤面崩壊イベント、EX/GOD級では動画演出を強めに狙います。</li>
                </ul>
            </div>
            <div class="miracle-user-card" style="text-align:left;">
                <b>最近のガチャ履歴</b>
                <div style="margin-top:8px;">${recentRewards}</div>
                <button id="miracle-gacha-history-button" class="miracle-home-button" style="margin-top:12px;">履歴を詳しく見る</button>
            </div>
            <div class="miracle-user-card" style="text-align:left;">
                <b>奇跡ガチャPの貯め方</b>
                <ul style="line-height:1.85;margin:10px 0 0;padding-left:1.3em;">
                    <li>実験完了：+1P</li>
                    <li>1000玉以上投下：追加 +1P</li>
                    <li>SR以上発見：+1P</li>
                    <li>SSR以上発見：+3P</li>
                    <li>GOD/EX発見：+10P</li>
                    <li>デイリー研究達成：+2P</li>
                    <li>超レア確率はかなり低めです。10連でも確定ではありません。</li>
                </ul>
            </div>
            <p style="opacity:.72;line-height:1.8;margin:0;">ガチャ回転演出のあと、最高レアの演出を盤面で再生します。結果はガチャ履歴に保存されます。</p>
        </div>
    `;
}

export function getGachaSpinHtml(count: 1 | 10, cost: number): string {
    return `
        <style>
            @keyframes miracleGachaSpin {
                0% { transform:rotate(0deg) scale(1); filter:hue-rotate(0deg) brightness(1); }
                35% { transform:rotate(520deg) scale(1.08); filter:hue-rotate(120deg) brightness(1.25); }
                70% { transform:rotate(980deg) scale(1.16); filter:hue-rotate(260deg) brightness(1.45); }
                100% { transform:rotate(1440deg) scale(1); filter:hue-rotate(360deg) brightness(1.08); }
            }
            @keyframes miracleGachaPulse {
                0%,100% { transform:scale(.94); opacity:.58; }
                50% { transform:scale(1.18); opacity:1; }
            }
            @keyframes miracleGachaBeam {
                0% { transform:rotate(0deg); opacity:.20; }
                100% { transform:rotate(360deg); opacity:.62; }
            }
        </style>
        <div class="miracle-user-card" style="text-align:center;overflow:hidden;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.98),rgba(255,220,80,.82),rgba(88,28,135,.42));">
            <div style="position:relative;width:min(72vw,360px);height:min(72vw,360px);margin:0 auto;display:grid;place-items:center;">
                <div style="position:absolute;inset:0;border-radius:999px;background:conic-gradient(from 0deg,rgba(255,255,255,0),rgba(255,255,255,.85),rgba(250,204,21,.95),rgba(168,85,247,.75),rgba(255,255,255,0));animation:miracleGachaBeam .75s linear infinite;"></div>
                <div style="position:absolute;inset:10%;border-radius:999px;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(250,204,21,.72),rgba(126,34,206,.65));box-shadow:0 0 50px rgba(250,204,21,.7);animation:miracleGachaPulse .48s ease-in-out infinite;"></div>
                <div style="position:relative;font-size:min(26vw,132px);line-height:1;animation:miracleGachaSpin 1.85s cubic-bezier(.2,.9,.2,1) forwards;text-shadow:0 0 30px rgba(255,255,255,.95);">🎰</div>
            </div>
            <div style="font-size:clamp(24px,5vw,44px);font-weight:1000;margin-top:10px;">${count === 10 ? "10連" : "奇跡"}抽選中...</div>
            <div style="opacity:.78;font-weight:900;margin-top:8px;">${cost.toLocaleString()}Pを消費して研究装置が高エネルギー反応を解析しています</div>
        </div>
    `;
}

export function getGachaResultHtml(rewards: GachaRewardEntry[], best: SpecialEventDef, getDef: (kind: string) => SpecialEventDef | undefined, isMobile: boolean): string {
    const rows = rewards.map((entry) => `
        <div class="miracle-user-card" style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;">
            ${getGachaRewardImageHtml(best.kind === entry.kind ? best : (getDef(entry.kind) ?? best), entry.label, isMobile)}
            <div>
                <div style="font-weight:1000;">${entry.count}. ${escapeHtml(entry.label)} [${escapeHtml(entry.rank)}]</div>
                <div style="opacity:.82;line-height:1.65;">${escapeHtml(entry.rewardLabel)}</div>
            </div>
        </div>
    `).join("");
    return `
        <div style="display:grid;gap:14px;">
            <div class="miracle-user-card" style="text-align:center;background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.96),rgba(250,204,21,.34),rgba(59,130,246,.16));">
                <div style="font-size:clamp(28px,6vw,52px);font-weight:1000;">最高反応: ${escapeHtml(best.label)} [${escapeHtml(best.rank)}]</div>
                <div style="margin-top:8px;opacity:.82;">報酬はガチャ履歴に保存しました。</div>
            </div>
            ${rows}
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button id="gacha-result-history-button" class="miracle-home-button miracle-home-primary">履歴を見る</button>
                <button id="gacha-result-again-button" class="miracle-home-button">もう一度</button>
            </div>
        </div>
    `;
}

export function getGachaRewardBookHtml(rewards: GachaRewardEntry[]): string {
    const totalTickets = rewards.reduce((acc, entry) => ({
        normal: acc.normal + entry.ticketNormal,
        rare: acc.rare + entry.ticketRare,
        divine: acc.divine + entry.ticketDivine,
    }), { normal: 0, rare: 0, divine: 0 });
    const rankCounts = rewards.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.rank] = (acc[entry.rank] ?? 0) + 1;
        return acc;
    }, {});
    const rows = rewards.map((entry) => `
        <div class="miracle-user-card" style="display:grid;gap:6px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
                <b>${escapeHtml(entry.label)} [${escapeHtml(entry.rank)}]</b>
                <span style="opacity:.72;">${new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            <div style="opacity:.84;line-height:1.65;">${escapeHtml(entry.rewardLabel)}</div>
        </div>
    `).join("") || `<div class="miracle-user-card">まだガチャ履歴はありません。奇跡ガチャを回すとここに保存されます。</div>`;
    return `
        <div style="display:grid;gap:14px;">
            <div class="miracle-user-card">
                <b>奇跡ガチャ報酬図鑑</b><br>
                <span style="opacity:.78;">排出された演出カード、テーマ解放、チケット報酬を保存しています。</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
                <div class="miracle-user-card"><b>総排出</b><br><span style="font-size:1.5em;font-weight:1000;">${rewards.length.toLocaleString()}</span></div>
                <div class="miracle-user-card"><b>最高レア</b><br><span style="font-size:1.1em;font-weight:1000;">${rewards.slice().sort((a, b) => getRankScore(b.rank) - getRankScore(a.rank))[0]?.rank ?? "-"}</span></div>
                <div class="miracle-user-card"><b>獲得チケット</b><br>通常 ${totalTickets.normal} / レア ${totalTickets.rare} / 神域 ${totalTickets.divine}</div>
                <div class="miracle-user-card"><b>ランク内訳</b><br>${Object.entries(rankCounts).map(([rank, count]) => `${escapeHtml(rank)} ${count}`).join(" / ") || "-"}</div>
            </div>
            ${rows}
        </div>
    `;
}
