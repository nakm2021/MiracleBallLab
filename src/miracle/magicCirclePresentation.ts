import { getMagicCircleMarkSvg, type MagicCircleDef } from "./magicCircles";
import { escapeHtml } from "./utils";

export function getAdminMagicCircleAnswerHtml(defs: MagicCircleDef[], isMobile: boolean): string {
    const rows = defs.map((def, index) => `
        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.72);border:1px solid rgba(80,90,120,.16);text-align:center;">
            ${getMagicCircleMarkSvg(def)}
            <div style="font-weight:1000;font-size:1.05em;">${index + 1}. ${def.emoji} ${escapeHtml(def.label)}</div>
            <div style="margin-top:6px;opacity:.76;line-height:1.65;text-align:left;"><b>${escapeHtml(def.chant)}</b><br>${escapeHtml(def.description)}</div>
            <div style="margin-top:5px;font-size:.84em;opacity:.62;text-align:left;">内部ID: ${escapeHtml(def.kind)}</div>
        </div>
    `).join("");

    return `
        <p style="line-height:1.8;margin-top:0;">管理者確認用です。各魔法陣の見た目イメージを表示しています。実際の判定は線の長さ、曲がり方、描いた範囲、閉じ具合、点数から分類します。</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${isMobile ? "180px" : "220px"},1fr));gap:12px;">${rows}</div>
        <p style="line-height:1.8;opacity:.72;margin-bottom:0;">「魔法陣を書く」を押して、上のマークに近い形を盤面へ描いてください。</p>
    `;
}

export function getMagicCircleSummonOverlayHtml(params: {
    def: MagicCircleDef;
    icon: string;
    title: string;
    subtitle: string;
    isDragon: boolean;
}): string {
    const { def } = params;
    return `
        <style>
            @keyframes miracleSummonFade { 0%{opacity:0;transform:scale(.86) rotate(-3deg);} 15%{opacity:1;transform:scale(1.02) rotate(1deg);} 72%{opacity:1;} 100%{opacity:0;transform:scale(1.22) rotate(6deg);} }
            @keyframes miracleSummonRing { 0%{transform:scale(.25) rotate(0deg);opacity:0;} 25%{opacity:.95;} 100%{transform:scale(1.85) rotate(220deg);opacity:0;} }
            @keyframes miracleDragonFly { 0%{transform:translateX(-42vw) scale(.7) rotate(-10deg);opacity:0;} 20%{opacity:1;} 50%{transform:translateX(0) scale(1.35) rotate(4deg);} 100%{transform:translateX(42vw) scale(.9) rotate(12deg);opacity:0;} }
        </style>
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 38%, rgba(255,255,255,.24), rgba(8,12,28,.48) 42%, rgba(0,0,0,.74));mix-blend-mode:screen;"></div>
        <div style="position:absolute;width:min(78vw,760px);height:min(78vw,760px);border-radius:999px;border:5px solid ${def.color};box-shadow:0 0 44px ${def.color}, inset 0 0 34px ${def.color};animation:miracleSummonRing 1500ms ease-out forwards;"></div>
        <div style="position:absolute;width:min(60vw,520px);height:min(60vw,520px);border-radius:999px;background:repeating-conic-gradient(from 0deg, rgba(255,255,255,.72) 0 5deg, transparent 5deg 17deg);clip-path:circle(50%);mix-blend-mode:screen;animation:miracleSummonRing 1650ms ease-out forwards reverse;"></div>
        <div style="text-align:center;color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.7);animation:miracleSummonFade 1900ms ease-out forwards;">
            <div style="font-size:clamp(70px,22vw,210px);line-height:1;filter:drop-shadow(0 0 30px ${def.color});animation:${params.isDragon ? "miracleDragonFly" : "none"} 1900ms ease-out forwards;">${params.icon}</div>
            <div style="margin-top:10px;font-size:clamp(28px,7vw,72px);font-weight:1000;letter-spacing:.08em;color:#fff7cc;">${escapeHtml(params.title)}</div>
            <div style="margin-top:8px;font-size:clamp(15px,3.2vw,26px);font-weight:900;max-width:min(92vw,860px);line-height:1.6;">${escapeHtml(params.subtitle)}</div>
        </div>`;
}
