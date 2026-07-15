import type { DropKind, SpecialEventDef } from "./types";
import { getSpecialIconColors } from "./drawing";
import { escapeHtml } from "./utils";

export function getMiracleFeatureText(def: SpecialEventDef): string {
    const prefix = def.label.replace(/mode$/i, "モード").replace(/\s+/g, "");
    const specialMap: Record<string, string> = {
        cosmicEgg: "研究ログの最後にだけ名前が残る、極秘扱いの奇跡です。",
        labExplosion: "研究所の空気まで騒がしくなる、全部盛り級の事故演出です。",
        poseidonMode: "盤面が海の気配に染まり、最後まで世界観を持っていきます。",
        zeusuMode: "雷鳴の主役。出た瞬間から画面のテンションが明らかに変わります。",
        hadesuMode: "暗さと重さで押してくる、低温なのに圧のある奇跡です。",
        heartMode: "かわいさで盤面を支配する、甘めの暴走イベントです。",
        nekochanMode: "急に猫派の世界になります。説明不能ですが人気は高いです。",
        lifeQuoteMode: "急に言葉で殴ってくる、音声つきの哲学枠です。",
        blackSun: "光るのに不穏。見た瞬間に普通のレアとは別物だとわかります。",
        timeRift: "時間の縫い目みたいな演出で、盤面の空気を一段変えます。",
        obsidianKing: "王の中でも重厚寄り。静かなのに存在感が異様です。",
        crown: "定番の当たり役。見慣れてもちゃんとうれしい王道レアです。",
        silverUfo: "スッと現れて妙に記憶に残る、SF寄りのごほうび演出です。",
        angelRing: "軽やかで明るい、SSRらしい見栄え担当です。",
        blueFlame: "静かに熱い系。派手さよりも青の異質感で刺してきます。",
        shootingStar: "通過時間は短いのに、出たあと妙に印象が残るスピード系です。",
        heart: "甘さ全振りの幸運印。画面が一気にやさしい空気になります。",
        luckySeven: "数字ネタなのにちゃんと縁起がいい、遊び心の強いレアです。",
    };
    if (specialMap[def.kind]) return specialMap[def.kind];
    if (def.rank === "GOD") return `${prefix}は、その回の空気をまるごと持っていく別格の奇跡です。`;
    if (def.rank === "EX") return `${prefix}は、見た瞬間に盤面のルールが少し変わった気がする異常系レアです。`;
    if (def.rank === "UR") return `${prefix}は、出たらその回を覚えていられる記念写真向けの奇跡です。`;
    if (def.rank === "SSR") return `${prefix}は、比較的会いやすいのに見栄えが強いサービス枠レアです。`;
    return `${prefix}は、数を回しているとふっと混ざる、うれしい日常型レアです。`;
}

export function escapeSvgText(text: string): string {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function isCatMiracle(def: SpecialEventDef): boolean {
    return /猫|ねこ|neko|cat/i.test(`${def.kind} ${def.label} ${def.symbol} ${def.emoji}`);
}

function createOriginalCatMiracleSvg(def: SpecialEventDef): string {
    const rank = escapeSvgText(def.rank);
    const label = escapeSvgText(def.label);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
        <defs>
            <radialGradient id="bg" cx="36%" cy="22%">
                <stop offset="0%" stop-color="#fff7db"/>
                <stop offset="55%" stop-color="#ffb36b"/>
                <stop offset="100%" stop-color="#7c2d12"/>
            </radialGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="12" stdDeviation="8" flood-color="#000000" flood-opacity=".32"/>
            </filter>
        </defs>
        <rect width="320" height="320" rx="44" fill="#111827"/>
        <circle cx="58" cy="62" r="28" fill="#ffe8a3" opacity=".95"/>
        <circle cx="258" cy="80" r="8" fill="#ffffff" opacity=".65"/>
        <circle cx="282" cy="112" r="5" fill="#ffffff" opacity=".5"/>
        <g filter="url(#shadow)">
            <path d="M83 122 L111 58 L147 110 Q160 104 174 110 L211 58 L238 122 Q260 151 253 194 Q243 258 160 263 Q77 258 67 194 Q60 151 83 122 Z" fill="url(#bg)" stroke="#fff1c7" stroke-width="8" stroke-linejoin="round"/>
            <path d="M103 118 L113 88 L132 116" fill="#7c2d12" opacity=".38"/>
            <path d="M188 116 L207 88 L217 118" fill="#7c2d12" opacity=".38"/>
            <ellipse cx="126" cy="168" rx="18" ry="23" fill="#18202f"/>
            <ellipse cx="194" cy="168" rx="18" ry="23" fill="#18202f"/>
            <circle cx="132" cy="160" r="5" fill="#ffffff"/>
            <circle cx="200" cy="160" r="5" fill="#ffffff"/>
            <path d="M160 183 C151 183 146 190 153 196 C157 199 163 199 167 196 C174 190 169 183 160 183 Z" fill="#7c2d12"/>
            <path d="M160 198 C150 213 132 211 126 201" fill="none" stroke="#7c2d12" stroke-width="6" stroke-linecap="round"/>
            <path d="M160 198 C170 213 188 211 194 201" fill="none" stroke="#7c2d12" stroke-width="6" stroke-linecap="round"/>
            <path d="M96 185 H57 M101 203 H59 M224 185 H263 M219 203 H261" stroke="#fff1c7" stroke-width="6" stroke-linecap="round" opacity=".9"/>
            <path d="M95 239 Q126 272 159 244 Q193 272 225 239" fill="none" stroke="#fff1c7" stroke-width="7" stroke-linecap="round" opacity=".9"/>
        </g>
        <text x="160" y="45" text-anchor="middle" font-size="30" font-family="M PLUS Rounded 1c, Zen Maru Gothic, Noto Sans JP, sans-serif" font-weight="900" fill="#f8fafc">${rank}</text>
        <text x="160" y="303" text-anchor="middle" font-size="22" font-family="M PLUS Rounded 1c, Zen Maru Gothic, Noto Sans JP, sans-serif" font-weight="900" fill="#fff7ed">${label}</text>
    </svg>`;
}

export function createMiracleImageDataUri(def: SpecialEventDef): string {
    if (isCatMiracle(def)) {
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createOriginalCatMiracleSvg(def))}`;
    }
    const bg = def.fillStyle;
    const symbol = escapeSvgText(def.symbol || "奇");
    const rank = escapeSvgText(def.rank);
    const emoji = escapeSvgText(def.emoji || def.symbol || "✨");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
        <defs>
            <radialGradient id="g" cx="30%" cy="25%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="45%" stop-color="${bg}"/>
                <stop offset="100%" stop-color="#111827"/>
            </radialGradient>
        </defs>
        <rect width="320" height="320" rx="42" fill="#0f172a"/>
        <circle cx="160" cy="132" r="92" fill="url(#g)" stroke="rgba(255,255,255,.65)" stroke-width="10"/>
        <text x="160" y="155" text-anchor="middle" font-size="96" font-family="M PLUS Rounded 1c, Zen Maru Gothic, Segoe UI Emoji, Noto Sans JP, sans-serif" font-weight="900" fill="#ffffff">${symbol}</text>
        <text x="160" y="58" text-anchor="middle" font-size="30" font-family="M PLUS Rounded 1c, Zen Maru Gothic, Segoe UI Emoji, Noto Sans JP, sans-serif" font-weight="900" fill="#f8fafc">${rank}</text>
        <text x="160" y="280" text-anchor="middle" font-size="44" font-family="M PLUS Rounded 1c, Zen Maru Gothic, Segoe UI Emoji, Noto Sans JP, sans-serif" font-weight="900" fill="#f8fafc">${emoji}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getMiracleIconHtml(kind: DropKind, fallbackSymbol: string, def?: SpecialEventDef | null): string {
    if (def) {
        const imageSize = "clamp(210px,62vw,430px)";
        return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <img src="${createMiracleImageDataUri(def)}" alt="${escapeSvgText(def.label)}" style="width:${imageSize};height:${imageSize};border-radius:clamp(28px,8vw,64px);object-fit:contain;background:rgba(15,23,42,.84);box-shadow:0 26px 80px rgba(0,0,0,.58),0 0 0 clamp(6px,1.2vw,12px) rgba(255,255,255,.18);filter:drop-shadow(0 18px 28px rgba(0,0,0,.42));" />
        </div>`;
    }
    const label = fallbackSymbol || "奇";
    const colors = getSpecialIconColors(kind);
    const common = `display:inline-flex;align-items:center;justify-content:center;width:clamp(120px,34vw,230px);height:clamp(120px,34vw,230px);border-radius:999px;border:clamp(5px,1.2vw,10px) solid ${colors.stroke};background:radial-gradient(circle at 30% 25%, #fff 0%, ${colors.main} 36%, ${colors.sub} 100%);box-shadow:0 0 0 clamp(5px,1vw,14px) rgba(255,255,255,.18),0 0 60px ${colors.main};color:${colors.text};font-weight:1000;font-size:clamp(50px,14vw,118px);text-shadow:0 3px 0 rgba(0,0,0,.25);line-height:1;`;
    return `<div style="${common}">${label}</div>`;
}

export function getGachaRewardImageHtml(def: SpecialEventDef, label: string, isMobile: boolean): string {
    return `<img src="${createMiracleImageDataUri(def)}" alt="${escapeHtml(label)}" style="width:${isMobile ? 70 : 82}px;height:${isMobile ? 70 : 82}px;border-radius:18px;object-fit:cover;background:#0f172a;box-shadow:0 10px 24px rgba(0,0,0,.18);" />`;
}

export function getMiracleBookImageHtml(def: SpecialEventDef, found: boolean, isMobile: boolean): string {
    return `<div style="position:relative;width:${isMobile ? 98 : 112}px;height:${isMobile ? 98 : 112}px;">
        <img src="${createMiracleImageDataUri(def)}" alt="${escapeSvgText(def.label)}" style="width:100%;height:100%;border-radius:22px;object-fit:cover;box-shadow:0 10px 24px rgba(0,0,0,.18);background:#0f172a;${found ? "" : "filter:saturate(.32) brightness(.72);opacity:.82;"}" />
        ${found ? "" : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:22px;background:rgba(15,23,42,.36);color:#fff;font-size:${isMobile ? 22 : 24}px;font-weight:1000;">?</div>`}
    </div>`;
}

export function getMiracleBookRowHtml(
    def: SpecialEventDef,
    options: {
        savedCount: number;
        currentCount: number;
        firstFoundAt?: number;
        isMobile: boolean;
        oddsLabel: string;
        oddsText: string;
        totalFoundLabel: string;
        countSuffix: string;
        firstFoundLabel: string;
    },
): string {
    const totalCount = options.savedCount + options.currentCount;
    const found = totalCount > 0;
    const displayName = found ? `${def.symbol} ${def.label}` : "??? シークレット枠";
    const imageHtml = getMiracleBookImageHtml(def, found, options.isMobile);
    const firstFoundText = found && options.firstFoundAt ? new Date(options.firstFoundAt).toLocaleString() : "----";
    const featureText = found
        ? getMiracleFeatureText(def)
        : "未発見のため詳細は伏せられています。観測すると画像・名前・説明が解放されます。";
    const odds = found ? options.oddsText : "????";
    return `<div style="display:grid;grid-template-columns:${options.isMobile ? "98px minmax(0,1fr)" : "112px minmax(0,1fr)"};gap:14px;align-items:start;padding:14px 0;border-bottom:1px solid rgba(80,90,120,.16);">
        <div>${imageHtml}</div>
        <div style="min-width:0;">
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                <span style="display:inline-flex;align-items:center;justify-content:center;padding:4px 10px;border-radius:999px;background:${found ? "rgba(53,98,59,.14)" : "rgba(120,130,140,.14)"};font-weight:900;color:${found ? "#214329" : "#727a86"};">${escapeHtml(def.rank)}</span>
                <span style="font-size:${options.isMobile ? 21 : 22}px;font-weight:900;line-height:1.35;word-break:break-word;color:${found ? "#1d2738" : "#999"};">${escapeHtml(displayName)}</span>
            </div>
            <div style="margin-top:8px;font-size:${options.isMobile ? 15 : 16}px;line-height:1.7;opacity:.82;">${escapeHtml(featureText)}</div>
            <div style="margin-top:8px;font-size:${options.isMobile ? 15 : 16}px;line-height:1.6;opacity:.72;">${options.oddsLabel} ${odds} / ${options.totalFoundLabel} ${totalCount}${options.countSuffix}</div>
            <div style="margin-top:2px;font-size:${options.isMobile ? 14 : 15}px;line-height:1.6;opacity:.62;">${options.firstFoundLabel} ${firstFoundText}</div>
        </div>
    </div>`;
}
