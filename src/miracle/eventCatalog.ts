import type {
    FusionDef,
    MiracleChainDef,
    NormalBallTraitDef,
    PachinkoYakumonoDef,
    RarePinDef,
    SpecialEventDef,
} from "./types";

const CROWN_RATE = 0.0001;
const SHOOTING_STAR_RATE = 0.00001;
const HEART_RATE = 0.000001;
const BLACK_SUN_RATE = 0.0000001;
const COSMIC_EGG_RATE = 0.000000000001;
const SWORD_IMPACT_RATE = 0.0000002;

export const FUSION_DEFS: FusionDef[] = [
    { id: "royal-meteor", label: "王の流星群", rank: "UR", sourceKinds: ["crown", "shootingStar"], requiredCount: 1, description: "王と流れ星が同じ研究記録に残ると派生する、記念撮影向けの合成奇跡です。", rewardScore: 42000 },
    { id: "blue-angel", label: "蒼天の輪炎", rank: "SSR+", sourceKinds: ["blueFlame", "angelRing"], requiredCount: 1, description: "青い炎と天使輪が混ざった、静かに派手な派生奇跡です。", rewardScore: 28000 },
    { id: "heart-seven", label: "ラッキーハートセブン", rank: "SR+", sourceKinds: ["heart", "luckySeven"], requiredCount: 1, description: "桃色ハートとラッキーセブンの縁起を合わせた、やさしい確率改変です。", rewardScore: 18000 },
    { id: "black-rift", label: "黒裂日食", rank: "EX", sourceKinds: ["blackSun", "timeRift"], requiredCount: 1, description: "黒い太陽と時空の裂け目が揃ったときだけ研究所に記録される危険な派生です。", rewardScore: 120000 },
    { id: "lab-cosmos", label: "研究所宇宙卵", rank: "GOD", sourceKinds: ["labExplosion", "cosmicEgg"], requiredCount: 1, description: "研究所爆発と宇宙卵が同時期に観測された、ほぼ都市伝説の合成記録です。", rewardScore: 300000 },
];


export const NORMAL_BALL_TRAITS: NormalBallTraitDef[] = [
    { kind: "heavy", label: "重い玉", mark: "重", description: "少し重く、下に落ちやすい通常玉です。", rate: 0.055, radiusScale: 1.08, restitution: 0.64, density: 0.00185, frictionAir: 0.0015, strokeStyle: "#475569" },
    { kind: "bouncy", label: "跳ね玉", mark: "跳", description: "よく跳ねるため、予想外の受け皿へ向かいやすい通常玉です。", rate: 0.052, radiusScale: 1.00, restitution: 1.04, density: 0.0009, frictionAir: 0.0012, strokeStyle: "#22c55e" },
    { kind: "tiny", label: "小粒玉", mark: "小", description: "少し小さく、ピンの間をすり抜けやすい通常玉です。", rate: 0.050, radiusScale: 0.74, restitution: 0.86, density: 0.00078, frictionAir: 0.0022, strokeStyle: "#38bdf8" },
    { kind: "sleepy", label: "のんびり玉", mark: "眠", description: "空気抵抗が大きく、ゆっくり落ちる通常玉です。", rate: 0.040, radiusScale: 1.00, restitution: 0.70, density: 0.0010, frictionAir: 0.0100, strokeStyle: "#a78bfa" },
    { kind: "sprinter", label: "早足玉", mark: "速", description: "横方向に少し勢いを持って生まれる通常玉です。", rate: 0.035, radiusScale: 0.96, restitution: 0.90, density: 0.00105, frictionAir: 0.0010, strokeStyle: "#f97316" },
    { kind: "spinner", label: "回転玉", mark: "回", description: "最初から強めに回転して、壁やピンで変な跳ね方をします。", rate: 0.032, radiusScale: 1.00, restitution: 0.88, density: 0.0010, frictionAir: 0.0018, strokeStyle: "#eab308" },
    { kind: "ghost", label: "うす玉", mark: "薄", description: "半透明で少し軽く、画面上で見つけにくい通常玉です。", rate: 0.026, radiusScale: 0.94, restitution: 0.96, density: 0.00082, frictionAir: 0.0026, strokeStyle: "#94a3b8" },
];

export const MIRACLE_CHAIN_DEFS: MiracleChainDef[] = [
    { id: "royal-starry-night", label: "王の星読み", rank: "CHAIN", sequence: ["crown", "shootingStar"], description: "王冠のあとに流れ星が続いた連鎖記録です。研究所が一瞬だけ星空になります。", rewardScore: 32000 },
    { id: "heart-lucky-shift", label: "幸運心拍", rank: "CHAIN", sequence: ["heart", "luckySeven"], description: "桃色ハートからラッキーセブンへつながった、やさしい確率連鎖です。", rewardScore: 38000 },
    { id: "blue-time-rift", label: "蒼炎時裂", rank: "CHAIN+", sequence: ["blueFlame", "timeRift"], description: "青い炎が時空の裂け目に飲まれた連鎖記録です。盤面が少し冷たく歪みます。", rewardScore: 62000 },
    { id: "black-lab-apocalypse", label: "黒日研究所崩壊", rank: "EX-CHAIN", sequence: ["blackSun", "labExplosion"], description: "黒い太陽の直後に研究所爆発が来た危険な連鎖です。", rewardScore: 160000 },
    { id: "last-cosmic-seal", label: "終末宇宙封印", rank: "GOD-CHAIN", sequence: ["blackSun", "timeRift", "cosmicEgg"], description: "黒い太陽、時空の裂け目、宇宙卵が順に並んだ最終級の連鎖です。", rewardScore: 420000 },
];

export const RARE_PIN_DEFS: RarePinDef[] = [
    { kind: "red", label: "赤ピン", description: "触れた玉を少し強く弾きます。", fillStyle: "#ef4444", strokeStyle: "#fee2e2", rate: 0.018 },
    { kind: "blue", label: "青ピン", description: "触れた玉を少し中央へ寄せます。", fillStyle: "#2563eb", strokeStyle: "#dbeafe", rate: 0.014 },
    { kind: "black", label: "黒ピン", description: "通常玉を低確率で金玉へ変質させます。", fillStyle: "#111827", strokeStyle: "#f87171", rate: 0.007 },
    { kind: "rainbow", label: "虹ピン", description: "触れると奇跡予兆が出やすい特別なピンです。", fillStyle: "#a855f7", strokeStyle: "#fef3c7", rate: 0.005 },
];

export const PACHINKO_YAKUMONO_DEFS: PachinkoYakumonoDef[] = [
    { kind: "start", label: "START", xRatio: 0.50, yRatio: 0.39, widthRatio: 0.23, height: 18, oddsScale: 1.00, score: 500, color: "#facc15" },
    { kind: "center", label: "役物", xRatio: 0.50, yRatio: 0.53, widthRatio: 0.30, height: 24, oddsScale: 1.85, score: 900, color: "#fb7185" },
    { kind: "premium", label: "PREMIUM", xRatio: 0.50, yRatio: 0.24, widthRatio: 0.16, height: 16, oddsScale: 5.50, score: 2500, color: "#a78bfa" },
];

const MASSIVE_MIRACLE_PREFIXES = ["月光", "星屑", "深海", "天界", "終末", "黎明", "氷結", "紅蓮", "薄明", "幻影", "雷鳴", "翡翠", "白銀"];
const MASSIVE_MIRACLE_SUFFIXES = [
    { label: "ラーメン", symbol: "麺", emoji: "🍜" },
    { label: "狐面", symbol: "面", emoji: "🦊" },
    { label: "王笛", symbol: "笛", emoji: "🎺" },
    { label: "時計塔", symbol: "塔", emoji: "🕰️" },
    { label: "くじら雲", symbol: "雲", emoji: "☁️" },
    { label: "招き猫", symbol: "猫", emoji: "🐱" },
    { label: "竜巻飴", symbol: "飴", emoji: "🍭" },
    { label: "流星札", symbol: "札", emoji: "🎴" },
];

function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let [r, g, b] = [0, 0, 0];
    if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
    else if (hp < 2) [r, g, b] = [x, c, 0];
    else if (hp < 3) [r, g, b] = [0, c, x];
    else if (hp < 4) [r, g, b] = [0, x, c];
    else if (hp < 5) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const m = l - c / 2;
    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function buildMassiveMiracleDefs(): SpecialEventDef[] {
    const defs: SpecialEventDef[] = [];
    let index = 0;
    for (const prefix of MASSIVE_MIRACLE_PREFIXES) {
        for (const suffix of MASSIVE_MIRACLE_SUFFIXES) {
            const hue = (index * 17) % 360;
            const rank = index % 12 === 0 ? "UR" : index % 5 === 0 ? "SSR" : "SR";
            const denominator = rank === "UR" ? 650_000 : rank === "SSR" ? 120_000 : 30_000;
            const soundMode = rank === "UR" ? "cosmic" : "miracle";
            defs.push({
                kind: `miracleExtra${String(index + 1).padStart(3, "0")}`,
                label: `${prefix}${suffix.label}`,
                rank,
                rate: 1 / denominator,
                denominator,
                symbol: suffix.symbol,
                emoji: suffix.emoji,
                fillStyle: hslToHex(hue, 88, rank === "UR" ? 61 : rank === "SSR" ? 67 : 72),
                radiusScale: rank === "UR" ? 1.96 : rank === "SSR" ? 1.86 : 1.74,
                soundMode,
            });
            index++;
        }
    }
    return defs;
}

export const BASE_SPECIAL_EVENT_DEFS: SpecialEventDef[] = [
    { kind: "cosmicEgg", label: "宇宙卵", rank: "GOD", rate: COSMIC_EGG_RATE, denominator: 1_000_000_000_000, symbol: "卵", emoji: "卵", fillStyle: "#240038", radiusScale: 2.7, soundMode: "cosmic" },
    { kind: "labExplosion", label: "研究所爆発", rank: "GOD", rate: 0.000000001, denominator: 1_000_000_000, symbol: "爆", emoji: "爆", fillStyle: "#ff3b30", radiusScale: 2.45, soundMode: "cosmic" },
    { kind: "poseidonMode", label: "poseidon mode", rank: "GOD", rate: 0.000000001, denominator: 1_000_000_000, symbol: "海", emoji: "海", fillStyle: "#1e88ff", radiusScale: 2.25, soundMode: "cosmic" },
    { kind: "zeusuMode", label: "zeusu mode", rank: "GOD", rate: 0.000000001, denominator: 1_000_000_000, symbol: "雷", emoji: "雷", fillStyle: "#ffd400", radiusScale: 2.25, soundMode: "miracle" },
    { kind: "hadesuMode", label: "hadesu mode", rank: "GOD", rate: 0.000000001, denominator: 1_000_000_000, symbol: "死", emoji: "死", fillStyle: "#151515", radiusScale: 2.25, soundMode: "black" },
    { kind: "heartMode", label: "heart mode", rank: "GOD", rate: 0.000000001, denominator: 1_000_000_000, symbol: "♥", emoji: "♥", fillStyle: "#ff5fb5", radiusScale: 2.15, soundMode: "miracle" },
    { kind: "nekochanMode", label: "nekochan mode", rank: "GOD", rate: 0.000000001, denominator: 1_000_000_000, symbol: "猫", emoji: "猫", fillStyle: "#ffb36b", radiusScale: 2.15, soundMode: "miracle" },
    { kind: "lifeQuoteMode", label: "人生名言ボイス", rank: "GOD", rate: 0.000000001, denominator: 1_000_000_000, symbol: "声", emoji: "声", fillStyle: "#ff9ed4", radiusScale: 2.15, soundMode: "miracle" },
    { kind: "blackSun", label: "黒い太陽", rank: "EX", rate: BLACK_SUN_RATE, denominator: 10_000_000, symbol: "黒", emoji: "黒", fillStyle: "#050505", radiusScale: 2.2, soundMode: "black" },
    { kind: "timeRift", label: "時空の裂け目", rank: "EX", rate: 0.0000005, denominator: 2_000_000, symbol: "裂", emoji: "裂", fillStyle: "#622aff", radiusScale: 2.05, soundMode: "cosmic" },
    { kind: "swordImpact", label: "剣の衝撃", rank: "EX", rate: SWORD_IMPACT_RATE, denominator: 5_000_000, symbol: "斬", emoji: "⚔️", fillStyle: "#e7f6ff", radiusScale: 2.2, soundMode: "cosmic" },
    { kind: "obsidianKing", label: "黒曜王", rank: "EX", rate: 0.0000005, denominator: 2_000_000, symbol: "王", emoji: "王", fillStyle: "#1f1626", radiusScale: 2.18, soundMode: "black" },

    { kind: "crystalDragon", label: "水晶ドラゴン", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "竜", emoji: "竜", fillStyle: "#72f1ff", radiusScale: 2.0, soundMode: "cosmic" },
    { kind: "goldenDaruma", label: "黄金だるま", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "達", emoji: "達", fillStyle: "#ffbf2e", radiusScale: 1.95, soundMode: "miracle" },
    { kind: "moonRabbit", label: "月うさぎ", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "月", emoji: "月", fillStyle: "#d8e7ff", radiusScale: 1.95, soundMode: "miracle" },
    { kind: "phantomCastle", label: "幻の城", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "城", emoji: "城", fillStyle: "#9b8cff", radiusScale: 1.95, soundMode: "cosmic" },
    { kind: "rainbowWhale", label: "虹クジラ", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "鯨", emoji: "鯨", fillStyle: "#3ee8c9", radiusScale: 2.0, soundMode: "miracle" },
    { kind: "thunderKitsune", label: "雷きつね", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "狐", emoji: "狐", fillStyle: "#ffe45c", radiusScale: 1.95, soundMode: "miracle" },
    { kind: "pocketGalaxy", label: "ポケット銀河", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "銀", emoji: "銀", fillStyle: "#3547ff", radiusScale: 2.05, soundMode: "cosmic" },
    { kind: "ancientClock", label: "古代時計", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "時", emoji: "時", fillStyle: "#b58b4a", radiusScale: 1.95, soundMode: "cosmic" },
    { kind: "mirrorCat", label: "鏡ねこ", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "猫", emoji: "猫", fillStyle: "#f5f7ff", radiusScale: 1.95, soundMode: "miracle" },
    { kind: "meteorCrown", label: "隕石クラウン", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "冠", emoji: "冠", fillStyle: "#ff6d3a", radiusScale: 2.05, soundMode: "cosmic" },
    { kind: "novaStar", label: "新星", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "星", emoji: "星", fillStyle: "#fff066", radiusScale: 1.95, soundMode: "miracle" },
    { kind: "diamondSkull", label: "ダイヤ髑髏", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "骸", emoji: "骸", fillStyle: "#8df3ff", radiusScale: 2.0, soundMode: "cosmic" },
    { kind: "sunLion", label: "太陽獅子", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "獅", emoji: "獅", fillStyle: "#ffb12f", radiusScale: 2.02, soundMode: "miracle" },
    { kind: "violetComet", label: "紫彗星", rank: "UR", rate: 0.000001, denominator: 1_000_000, symbol: "彗", emoji: "彗", fillStyle: "#8d63ff", radiusScale: 1.96, soundMode: "cosmic" },
    { kind: "heart", label: "桃色ハート", rank: "UR", rate: HEART_RATE, denominator: 1_000_000, symbol: "愛", emoji: "愛", fillStyle: "#ff69b4", radiusScale: 1.9, soundMode: "miracle" },
    { kind: "luckySeven", label: "ラッキーセブン", rank: "UR", rate: 1 / 777777, denominator: 777_777, symbol: "7", emoji: "7", fillStyle: "#ff2bd6", radiusScale: 1.85, soundMode: "miracle" },

    { kind: "angelRing", label: "天使輪", rank: "SSR", rate: 0.00001, denominator: 100_000, symbol: "輪", emoji: "輪", fillStyle: "#fff1a6", radiusScale: 1.88, soundMode: "miracle" },
    { kind: "blueFlame", label: "青い炎", rank: "SSR", rate: 0.000004, denominator: 250_000, symbol: "炎", emoji: "炎", fillStyle: "#00aaff", radiusScale: 1.75, soundMode: "miracle" },
    { kind: "shootingStar", label: "流れ星", rank: "SSR", rate: SHOOTING_STAR_RATE, denominator: 100_000, symbol: "星", emoji: "星", fillStyle: "#78e7ff", radiusScale: 1.7, soundMode: "miracle" },

    { kind: "silverUfo", label: "銀のUFO", rank: "SR", rate: 0.00002, denominator: 50_000, symbol: "UFO", emoji: "UFO", fillStyle: "#cfd8dc", radiusScale: 1.65, soundMode: "miracle" },
    { kind: "crown", label: "王", rank: "SR", rate: CROWN_RATE, denominator: 10_000, symbol: "王", emoji: "王", fillStyle: "#ffd54a", radiusScale: 1.9, soundMode: "miracle" },
];

export const SPECIAL_EVENT_DEFS: SpecialEventDef[] = [...BASE_SPECIAL_EVENT_DEFS, ...buildMassiveMiracleDefs()];

