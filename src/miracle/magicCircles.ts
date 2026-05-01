import { escapeHtml } from "./utils";

export type MagicCircleEffect =
    | "sun" | "moon" | "star" | "thunder" | "wave" | "earth" | "wind" | "gate"
    | "mirror" | "dragon" | "void" | "flower" | "gear" | "meteor" | "clock" | "crown";

export interface MagicCircleDef {
    kind: string;
    effect: MagicCircleEffect;
    label: string;
    emoji: string;
    color: string;
    description: string;
    chant: string;
}

export const MAGIC_CIRCLE_DEFS: MagicCircleDef[] = [
    { kind: "sun", effect: "sun", label: "太陽輪", emoji: "☀️", color: "#facc15", chant: "黄金照射", description: "盤面を発光させ、外から銀玉を呼び込みます。" },
    { kind: "moon", effect: "moon", label: "月影輪", emoji: "🌙", color: "#bfdbfe", chant: "月重力", description: "重力を少し弱め、玉をふわっと流します。" },
    { kind: "star", effect: "star", label: "星芒陣", emoji: "⭐", color: "#fde68a", chant: "流星招来", description: "流れ星のように外側から玉が飛び込みます。" },
    { kind: "thunder", effect: "thunder", label: "雷鳴陣", emoji: "⚡", color: "#fef08a", chant: "天雷開放", description: "落雷系の盤面崩壊を呼びます。" },
    { kind: "wave", effect: "wave", label: "水渦陣", emoji: "🌊", color: "#38bdf8", chant: "潮流反転", description: "津波のように盤面の流れを横へ押します。" },
    { kind: "earth", effect: "earth", label: "地脈陣", emoji: "🪨", color: "#d6d3d1", chant: "地殻起動", description: "大地震のように盤面を揺らします。" },
    { kind: "wind", effect: "wind", label: "旋風陣", emoji: "🌀", color: "#67e8f9", chant: "風穴解放", description: "横風で玉の流れを乱します。" },
    { kind: "gate", effect: "gate", label: "門陣", emoji: "🌀", color: "#c4b5fd", chant: "外界接続", description: "左右の画面外から玉を侵入させます。" },
    { kind: "mirror", effect: "mirror", label: "鏡陣", emoji: "🪞", color: "#e0f2fe", chant: "反射世界", description: "反射世界のように盤面を反転気味に揺らします。" },
    { kind: "dragon", effect: "dragon", label: "龍脈陣", emoji: "🐉", color: "#34d399", chant: "龍脈奔流", description: "龍脈崩壊を呼びます。" },
    { kind: "void", effect: "void", label: "虚無陣", emoji: "⬛", color: "#e5e7eb", chant: "空白降臨", description: "虚無領域を開きます。" },
    { kind: "flower", effect: "flower", label: "花冠陣", emoji: "🌸", color: "#f9a8d4", chant: "花冠展開", description: "一時ピンを花のように配置します。" },
    { kind: "gear", effect: "gear", label: "歯車陣", emoji: "⚙️", color: "#cbd5e1", chant: "機構暴走", description: "ピンの反応を一時的に暴走させます。" },
    { kind: "meteor", effect: "meteor", label: "隕石陣", emoji: "☄️", color: "#fb923c", chant: "隕鉄落下", description: "隕石玉を画面外から突入させます。" },
    { kind: "clock", effect: "clock", label: "時辰陣", emoji: "⏳", color: "#a78bfa", chant: "時間断層", description: "時間断層崩壊を呼びます。" },
    { kind: "crown", effect: "crown", label: "王冠陣", emoji: "👑", color: "#facc15", chant: "王冠観測", description: "強い光とともに観測ピンを置きます。" },
    { kind: "aurora", effect: "sun", label: "極光陣", emoji: "🌌", color: "#86efac", chant: "極光流転", description: "オーロラの帯で盤面を照らし、銀玉を呼び込みます。" },
    { kind: "crystal", effect: "mirror", label: "水晶陣", emoji: "🔮", color: "#93c5fd", chant: "水晶反射", description: "盤面全体に透明な反射を走らせます。" },
    { kind: "phoenix", effect: "meteor", label: "鳳凰陣", emoji: "🔥", color: "#fb7185", chant: "鳳凰再燃", description: "燃える流星玉を外界から呼び込みます。" },
    { kind: "nebula", effect: "void", label: "星雲陣", emoji: "🌠", color: "#c084fc", chant: "星雲融解", description: "虚無と星屑が混ざった領域を作ります。" },
    { kind: "labyrinth", effect: "gate", label: "迷宮陣", emoji: "🧩", color: "#fbbf24", chant: "迷宮接続", description: "迷宮の出口から玉が侵入します。" },
    { kind: "serpent", effect: "dragon", label: "蛇行陣", emoji: "🐍", color: "#84cc16", chant: "蛇行龍脈", description: "龍脈の小型版として盤面をくねらせます。" },
    { kind: "prism", effect: "mirror", label: "虹晶陣", emoji: "🌈", color: "#f0abfc", chant: "虹晶反射", description: "虹色の反射で魔法陣の結果を派手にします。" },
    { kind: "anchor", effect: "earth", label: "錨陣", emoji: "⚓", color: "#94a3b8", chant: "重力固定", description: "盤面を重く揺らし、金具ピンをしならせます。" },
    { kind: "bell", effect: "thunder", label: "鐘鳴陣", emoji: "🔔", color: "#fde68a", chant: "鐘雷鳴動", description: "鐘のような光と落雷を呼びます。" },
    { kind: "comet", effect: "star", label: "彗星陣", emoji: "💫", color: "#bae6fd", chant: "彗星突入", description: "彗星のように横から玉が走ります。" },
    { kind: "lotus", effect: "flower", label: "蓮華陣", emoji: "🪷", color: "#f0abfc", chant: "蓮華開花", description: "花型の観測ピンをさらに華やかに広げます。" },
    { kind: "sword", effect: "wind", label: "剣風陣", emoji: "🗡️", color: "#e5e7eb", chant: "剣風乱舞", description: "鋭い風で玉の進路を乱します。" },
    { kind: "jewel", effect: "crown", label: "宝冠陣", emoji: "💎", color: "#67e8f9", chant: "宝冠降臨", description: "宝石の光をまとった観測ピンを置きます。" },
    { kind: "spiral", effect: "wind", label: "螺旋陣", emoji: "🌀", color: "#22d3ee", chant: "螺旋加速", description: "盤面に螺旋の流れを作ります。" },
    { kind: "eclipse", effect: "void", label: "蝕陣", emoji: "🌘", color: "#d1d5db", chant: "日蝕虚無", description: "黒い輪で盤面を包みます。" },
    { kind: "volcano", effect: "meteor", label: "火山陣", emoji: "🌋", color: "#fb923c", chant: "火口解放", description: "下から噴き上がるような玉侵入を起こします。" },
    { kind: "snow", effect: "moon", label: "氷雪陣", emoji: "❄️", color: "#dbeafe", chant: "氷雪浮遊", description: "少し浮遊感のある流れに変えます。" },
    { kind: "forest", effect: "flower", label: "森羅陣", emoji: "🌳", color: "#86efac", chant: "森羅芽吹", description: "観測ピンを森のように増やします。" },
    { kind: "train", effect: "gear", label: "機関陣", emoji: "🚂", color: "#cbd5e1", chant: "機関全開", description: "歯車のようにピンを激しく反応させます。" },
    { kind: "lantern", effect: "sun", label: "灯籠陣", emoji: "🏮", color: "#f97316", chant: "灯火招来", description: "暖かい光で外部玉を呼びます。" },
    { kind: "whale", effect: "wave", label: "鯨潮陣", emoji: "🐋", color: "#38bdf8", chant: "大潮召喚", description: "大きな潮流で横方向に押します。" },
    { kind: "castle", effect: "crown", label: "城塞陣", emoji: "🏯", color: "#fde68a", chant: "城塞観測", description: "王冠級の観測ピンを設置します。" },
    { kind: "tempura", effect: "meteor", label: "穴子天ぷら陣", emoji: "🍤", color: "#f59e0b", chant: "衣、天へ舞う", description: "隠し魔法陣。穴子の天ぷらの衣が流星のように舞います。" },
];

export function getMagicCircleMarkSvg(def: MagicCircleDef): string {
    const stroke = escapeHtml(def.color);
    const common = `fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`;
    const seed = def.kind.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const sides = 3 + (seed % 6);
    const angleOffset = (seed % 360) * Math.PI / 180;
    const points: string[] = [];
    for (let i = 0; i < sides; i++) {
        const a = angleOffset + i * Math.PI * 2 / sides;
        const r = i % 2 === 0 ? 43 : 28;
        points.push(`${(60 + Math.cos(a) * r).toFixed(1)},${(60 + Math.sin(a) * r).toFixed(1)}`);
    }
    const base = `<circle cx="60" cy="60" r="48" ${common} opacity=".55"/><circle cx="60" cy="60" r="25" ${common} opacity=".72"/><polygon points="${points.join(" ")}" ${common}/>`;
    const accentMap: Record<MagicCircleEffect, string> = {
        sun: `<path d="M60 8v16M60 96v16M8 60h16M96 60h16" ${common}/>` ,
        moon: `<path d="M75 20c-24 8-36 22-36 40s12 32 36 40c-32 6-58-12-58-40s26-46 58-40Z" fill="${stroke}" opacity=".45"/>`,
        star: `<path d="M60 15 72 46 105 46 78 65 88 98 60 78 32 98 42 65 15 46 48 46Z" ${common}/>` ,
        thunder: `<path d="M72 10 30 64h28L48 110 92 48H64Z" fill="${stroke}" opacity=".64"/>`,
        wave: `<path d="M12 78c18-18 32-18 50 0s32 18 50 0" ${common}/>` ,
        earth: `<path d="M22 84h76M32 66l28-38 28 38" ${common}/>` ,
        wind: `<path d="M18 42h54c18 0 18-22 0-22M18 64h78c18 0 18 24-2 24H72" ${common}/>` ,
        gate: `<path d="M28 102V36c0-16 12-26 32-26s32 10 32 26v66" ${common}/>` ,
        mirror: `<path d="M28 18h64v84H28zM60 20v80" ${common}/>` ,
        dragon: `<path d="M20 82c22-54 58 22 80-34M82 24l18-8-8 18" ${common}/>` ,
        void: `<circle cx="60" cy="60" r="26" fill="${stroke}" opacity=".66"/>`,
        flower: `<circle cx="60" cy="60" r="10" fill="${stroke}"/><path d="M60 18c18 18 18 28 0 42-18-14-18-24 0-42ZM60 102c-18-18-18-28 0-42 18 14 18 24 0 42Z" fill="${stroke}" opacity=".42"/>`,
        gear: `<path d="M60 12v18M60 90v18M12 60h18M90 60h18M26 26l13 13M81 81l13 13M94 26 81 39M39 81 26 94" ${common}/>` ,
        meteor: `<path d="M16 24c22 8 42 24 64 50M78 70c18-8 30 8 22 24s-30 12-38 0 0-20 16-24Z" ${common}/>` ,
        clock: `<circle cx="60" cy="60" r="42" ${common}/><path d="M60 34v28l20 12" ${common}/>` ,
        crown: `<path d="M20 86h80M26 80l8-44 22 26 4-42 4 42 22-26 8 44Z" ${common}/>` ,
    };
    return `<svg viewBox="0 0 120 120" width="96" height="96" role="img" aria-label="${escapeHtml(def.label)}" style="display:block;margin:0 auto 10px;filter:drop-shadow(0 8px 14px rgba(0,0,0,.18));">${base}${accentMap[def.effect]}</svg>`;
}
