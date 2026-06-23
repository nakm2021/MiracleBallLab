import type { SpecialEventDef } from "./types";

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
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
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
