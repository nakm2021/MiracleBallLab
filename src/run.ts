import Matter, { Events } from "matter-js";
import anime from "animejs";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import GIF from "gif.js";
import gifWorkerUrl from "gif.js/dist/gif.worker.js?url";
import * as Tone from "tone";
import confetti from "canvas-confetti";
import { Application, Graphics } from "pixi.js";

const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Composite = Matter.Composite;

type DropKind = string;

type ProbabilityMode = "normal" | "festival" | "hard" | "hell";

type SpecialEventDef = {
    kind: DropKind;
    label: string;
    rank: string;
    rate: number;
    denominator: number;
    symbol: string;
    emoji: string;
    fillStyle: string;
    radiusScale: number;
    soundMode: "miracle" | "black" | "cosmic";
};

type MiracleLogEntry = {
    label: string;
    rank: string;
    denominator: number;
    finishedAt: number;
    finishedCount: number;
    mode: ProbabilityMode;
    speedLabel: string;
    combo: number;
    note?: string;
};

type FusionDef = {
    id: string;
    label: string;
    rank: string;
    sourceKinds: DropKind[];
    requiredCount: number;
    description: string;
    rewardScore: number;
};

type DailyFortune = {
    dateKey: string;
    title: string;
    rateBoost: number;
    luckyKind: string;
    luckyBin: number;
    advice: string;
    seed: number;
};

type MiracleClip = {
    id: string;
    label: string;
    rank: string;
    denominator: number;
    finishedCount: number;
    createdAt: number;
    subtitle: string;
    frames: string[];
};

type ThemeMode = "lab" | "space" | "sunset" | "retro" | "midnight";
type WorldMode = "poseidon" | "zeusu" | "hadesu" | "heart" | "nekochan" | null;

type SavedRecords = {
    totalRuns: number;
    maxFinishedCount: number;
    maxTargetCount: number;
    bestRank: string;
    bestLabel: string;
    discovered: Record<string, number>;
    discoveredFirstAt: Record<string, number>;
    bestScore: number;
    totalScore: number;
    missionCompleted: Record<string, number>;
    miracleLogs: MiracleLogEntry[];
    fusions: Record<string, number>;
    secretUnlocked: Record<string, number>;
};

type MissionDef = {
    id: string;
    title: string;
    description: string;
    rewardScore: number;
    oncePerRun: boolean;
    evaluate: () => boolean;
};

type SkillKind = "shockwave" | "magnet" | "timeStop";

type SecretDef = {
    id: string;
    label: string;
    hint: string;
    detail: string;
    rewardScore: number;
};

type SkillState = {
    shockwave: number;
    magnet: number;
    timeStop: number;
};

type Settings = {
    targetCount: number;
    activeLimit: number;
    binCount: number;
    pinRows: number;
    labelText: string;
    backgroundImage: string;
    simpleMode: boolean;
    cameraShakeEnabled: boolean;
    slowMiracleEffects: boolean;
    probabilityMode: ProbabilityMode;
};

type Geometry = {
    width: number;
    height: number;
    infoHeight: number;
    scale: number;
    pixelRatio: number;
    wallWidth: number;
    groundHeight: number;
    groundTop: number;
    totalBinCount: number;
    binLeft: number;
    binRight: number;
    binWidth: number;
    visibleStart: number;
    ballRadius: number;
    pinRadius: number;
    dividerWidth: number;
    dividerHeight: number;
    dividerY: number;
    ballCountY: number;
    labelY: number;
    countY: number;
    percentY: number;
    barY: number;
    labelFont: number;
    countFont: number;
    percentFont: number;
    infoFont: number;
    binCenters: number[];
};

type FloatingText = {
    text: string;
    x: number;
    y: number;
    life: number;
    maxLife: number;
    color: string;
};

type NormalBallTraitKind = "standard" | "heavy" | "bouncy" | "tiny" | "sleepy" | "sprinter" | "spinner" | "ghost";

type NormalBallTraitDef = {
    kind: NormalBallTraitKind;
    label: string;
    mark: string;
    description: string;
    rate: number;
    radiusScale: number;
    restitution: number;
    density: number;
    frictionAir: number;
    strokeStyle: string;
};

type MiracleChainDef = {
    id: string;
    label: string;
    rank: string;
    sequence: DropKind[];
    description: string;
    rewardScore: number;
};

type BoardAnomalyMode = "none" | "sideGravity" | "stickyTime" | "dimPins" | "tremor" | "updraft" | "blackHole" | "pinPulse" | "reverseRain";

const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

const MILESTONE_INTERVAL = 100000;
const GIANT_EVENT_INTERVAL = 100000;
const FINAL_SWEEP_DELAY_MS = 3000;
const SCORE_STORAGE_BONUS_INTERVAL = 5000;
const MAGNET_DURATION_MS = 5000;
const TIME_STOP_DURATION_MS = 2200;
const COMMENTARY_MIN_INTERVAL_MS = 14000;
const COMMENTARY_DISPLAY_MS = 9000;
const MIRACLE_CHAIN_WINDOW_MS = 8 * 60 * 1000;

const GOLD_RATE = 0.002;           // 1/500
const RAINBOW_RATE = 0.0005;       // 1/2,000
const SHAPE_RATE = 0.002;          // 1/500
const CROWN_RATE = 0.0001;         // 1/10,000
const SHOOTING_STAR_RATE = 0.00001;// 1/100,000
const HEART_RATE = 0.000001;       // 1/1,000,000
const BLACK_SUN_RATE = 0.0000001;  // 1/10,000,000
const COSMIC_EGG_RATE = 0.000000000001; // 1/1,000,000,000,000

const RECORD_STORAGE_KEY = "miracle-ball-lab-records-v3";
const SECRET_KEY_SEQUENCE = "miracle";
const SECRET_KEY_SEQUENCES: Record<string, { label: string; detail: string }> = {
    miracle: { label: "MIRACLE コード", detail: "キーボードで隠しコードを入力しました。今日の研究所は少しだけ騒がしくなります。" },
    lab: { label: "LAB コード", detail: "研究所の短縮コードを入力しました。秘密研究員として記録します。" },
    neko: { label: "NEKO コード", detail: "ねこちゃんモードの気配を呼びました。" },
    sun: { label: "SUN コード", detail: "黒い太陽を探す研究者用の短縮コードです。" },
};
const SECRET_KEY_MAX_LENGTH = Math.max(SECRET_KEY_SEQUENCE.length, ...Object.keys(SECRET_KEY_SEQUENCES).map((x) => x.length));

const FUSION_DEFS: FusionDef[] = [
    { id: "royal-meteor", label: "王の流星群", rank: "UR", sourceKinds: ["crown", "shootingStar"], requiredCount: 1, description: "王と流れ星が同じ研究記録に残ると派生する、記念撮影向けの合成奇跡です。", rewardScore: 42000 },
    { id: "blue-angel", label: "蒼天の輪炎", rank: "SSR+", sourceKinds: ["blueFlame", "angelRing"], requiredCount: 1, description: "青い炎と天使輪が混ざった、静かに派手な派生奇跡です。", rewardScore: 28000 },
    { id: "heart-seven", label: "ラッキーハートセブン", rank: "SR+", sourceKinds: ["heart", "luckySeven"], requiredCount: 1, description: "桃色ハートとラッキーセブンの縁起を合わせた、やさしい確率改変です。", rewardScore: 18000 },
    { id: "black-rift", label: "黒裂日食", rank: "EX", sourceKinds: ["blackSun", "timeRift"], requiredCount: 1, description: "黒い太陽と時空の裂け目が揃ったときだけ研究所に記録される危険な派生です。", rewardScore: 120000 },
    { id: "lab-cosmos", label: "研究所宇宙卵", rank: "GOD", sourceKinds: ["labExplosion", "cosmicEgg"], requiredCount: 1, description: "研究所爆発と宇宙卵が同時期に観測された、ほぼ都市伝説の合成記録です。", rewardScore: 300000 },
];


const NORMAL_BALL_TRAITS: NormalBallTraitDef[] = [
    { kind: "heavy", label: "重い玉", mark: "重", description: "少し重く、下に落ちやすい通常玉です。", rate: 0.055, radiusScale: 1.08, restitution: 0.64, density: 0.00185, frictionAir: 0.0015, strokeStyle: "#475569" },
    { kind: "bouncy", label: "跳ね玉", mark: "跳", description: "よく跳ねるため、予想外の受け皿へ向かいやすい通常玉です。", rate: 0.052, radiusScale: 1.00, restitution: 1.04, density: 0.0009, frictionAir: 0.0012, strokeStyle: "#22c55e" },
    { kind: "tiny", label: "小粒玉", mark: "小", description: "少し小さく、ピンの間をすり抜けやすい通常玉です。", rate: 0.050, radiusScale: 0.74, restitution: 0.86, density: 0.00078, frictionAir: 0.0022, strokeStyle: "#38bdf8" },
    { kind: "sleepy", label: "のんびり玉", mark: "眠", description: "空気抵抗が大きく、ゆっくり落ちる通常玉です。", rate: 0.040, radiusScale: 1.00, restitution: 0.70, density: 0.0010, frictionAir: 0.0100, strokeStyle: "#a78bfa" },
    { kind: "sprinter", label: "早足玉", mark: "速", description: "横方向に少し勢いを持って生まれる通常玉です。", rate: 0.035, radiusScale: 0.96, restitution: 0.90, density: 0.00105, frictionAir: 0.0010, strokeStyle: "#f97316" },
    { kind: "spinner", label: "回転玉", mark: "回", description: "最初から強めに回転して、壁やピンで変な跳ね方をします。", rate: 0.032, radiusScale: 1.00, restitution: 0.88, density: 0.0010, frictionAir: 0.0018, strokeStyle: "#eab308" },
    { kind: "ghost", label: "うす玉", mark: "薄", description: "半透明で少し軽く、画面上で見つけにくい通常玉です。", rate: 0.026, radiusScale: 0.94, restitution: 0.96, density: 0.00082, frictionAir: 0.0026, strokeStyle: "#94a3b8" },
];

const MIRACLE_CHAIN_DEFS: MiracleChainDef[] = [
    { id: "royal-starry-night", label: "王の星読み", rank: "CHAIN", sequence: ["crown", "shootingStar"], description: "王冠のあとに流れ星が続いた連鎖記録です。研究所が一瞬だけ星空になります。", rewardScore: 32000 },
    { id: "heart-lucky-shift", label: "幸運心拍", rank: "CHAIN", sequence: ["heart", "luckySeven"], description: "桃色ハートからラッキーセブンへつながった、やさしい確率連鎖です。", rewardScore: 38000 },
    { id: "blue-time-rift", label: "蒼炎時裂", rank: "CHAIN+", sequence: ["blueFlame", "timeRift"], description: "青い炎が時空の裂け目に飲まれた連鎖記録です。盤面が少し冷たく歪みます。", rewardScore: 62000 },
    { id: "black-lab-apocalypse", label: "黒日研究所崩壊", rank: "EX-CHAIN", sequence: ["blackSun", "labExplosion"], description: "黒い太陽の直後に研究所爆発が来た危険な連鎖です。", rewardScore: 160000 },
    { id: "last-cosmic-seal", label: "終末宇宙封印", rank: "GOD-CHAIN", sequence: ["blackSun", "timeRift", "cosmicEgg"], description: "黒い太陽、時空の裂け目、宇宙卵が順に並んだ最終級の連鎖です。", rewardScore: 420000 },
];

const LOCAL_RARE_AUDIO_FILES = [
    "/audio/rare-01.mp3",
    "/audio/rare-02.mp3",
    "/audio/rare-03.mp3",
    "/audio/rare-04.mp3",
];
const LOCAL_GOD_AUDIO_FILES = [
    "/audio/god-01.mp3",
    "/audio/god-02.mp3",
    "/audio/god-03.mp3",
];
type RareSoundFlavor = "normal" | "ur" | "ex" | "god";

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

const BASE_SPECIAL_EVENT_DEFS: SpecialEventDef[] = [
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

const SPECIAL_EVENT_DEFS: SpecialEventDef[] = [...BASE_SPECIAL_EVENT_DEFS, ...buildMassiveMiracleDefs()];

const RANDOM_BUCKET_COUNT = 10;
const STUCK_NUDGE_FRAMES = 90;
const STUCK_EXPLODE_FRAMES = 600;

const browserName = getBrowserName();
const isMobile = isMobileDevice();
const uiFontPx = isMobile ? 25 : 20;
const uiButtonFontPx = isMobile ? 26 : 20;
const DEFAULT_BACKGROUND_IMAGE_URL = `${import.meta.env.BASE_URL}favicon.png`;
const ROUNDED_UI_FONT = `"M PLUS Rounded 1c", "Zen Maru Gothic", "Kosugi Maru", "Hiragino Maru Gothic ProN", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif`;

let settings: Settings = {
    targetCount: 50000,
    activeLimit: isMobile ? 18 : 30,
    binCount: isMobile ? 6 : 8,
    pinRows: isMobile ? 6 : 7,
    labelText: isMobile ? "１\n２\n３\n４\n５\n６" : "１\n２\n３\n４\n５\n６\n７\n８",
    backgroundImage: DEFAULT_BACKGROUND_IMAGE_URL,
    simpleMode: false,
    cameraShakeEnabled: false,
    slowMiracleEffects: false,
    probabilityMode: "normal",
};

let selectedBackgroundObjectUrl = "";
let geometry: Geometry;

let finishedCount = 0;
let activeDropCount = 0;
let startTime = Date.now();
let endTime: number | null = null;
let targetReachedTime: number | null = null;
let lastSpeedCheckTime = Date.now();
let lastSpeedCheckFinishedCount = 0;
let speedPerSecond = 0;
let nextMilestone = MILESTONE_INTERVAL;
let nextGiantEvent = GIANT_EVENT_INTERVAL;
let giantStock = 0;
let isFinished = false;
let isPaused = false;
let isStarted = false;
let isMiraclePaused = false;
let miraclePauseTimer: number | undefined;
let miraclePauseEndsAt = 0;
let miraclePauseRemainingMs = 0;

let labels: string[] = [];
let binCounts: number[] = [];
let hitFlash: number[] = [];
let discardedCount = 0;

let goldCreated = 0;
let rainbowCreated = 0;
let giantCreated = 0;
let shapeCreated = 0;
let crownCreated = 0;
let starCreated = 0;
let heartCreated = 0;
let blackSunCreated = 0;
let cosmicEggCreated = 0;
let silverUfoCreated = 0;
let blueFlameCreated = 0;
let luckySevenCreated = 0;
let timeRiftCreated = 0;
let labExplosionCreated = 0;

let specialCreated: Record<string, number> = {};
let savedRecords: SavedRecords = loadSavedRecords();
let missionDefs: MissionDef[] = [];
let missionProgress: Record<string, boolean> = {};
let runScore = 0;
let bestComboThisRun = 0;
let skillState: SkillState = { shockwave: 2, magnet: 2, timeStop: 1 };
let magnetUntil = 0;
let lastSkillUsedAt = 0;

let goldHits: number[] = [];
let rainbowHits: number[] = [];
let giantHits: number[] = [];
let shapeHits: number[] = [];
let crownHits: number[] = [];
let starHits: number[] = [];
let heartHits: number[] = [];
let blackSunHits: number[] = [];
let cosmicEggHits: number[] = [];

let randomBuckets = Array.from({ length: RANDOM_BUCKET_COUNT }, () => 0);
let randomCallCount = 0;
let floatingTexts: FloatingText[] = [];
let shakeUntil = 0;
let shakePower = 0;
let speedLabelText = "高速";
let isEnglish = false;
let isFullscreenMode = false;
let isVerticalVideoMode = false;
let isObsMode = false;
let currentTheme: ThemeMode = "lab";
let miracleLogs: MiracleLogEntry[] = [...(savedRecords.miracleLogs ?? [])];
let currentDailyFortune: DailyFortune | null = null;
let secretKeyBuffer = "";
let bootIconTapCount = 0;
let pauseTapHistory: number[] = [];
let mobileSettingsOpenCount = 0;
let skillComboBuffer: SkillKind[] = [];
let repeatedMiracleRunCounts: Record<string, number> = {};
let miracleClips: MiracleClip[] = [];
let replayFrameBuffer: string[] = [];
let replayCaptureTick = 0;
let currentSubtitleText = "";
let subtitleTimer: number | undefined;
let comboTimer: number | undefined;
let miracleCombo = 0;
let lastMiracleAt = 0;
let activeRareBackgroundKind: DropKind | null = null;
let activeWorldMode: WorldMode = null;
let lifeQuoteOverlayTimer: number | undefined;
let rareBackgroundTimer: number | undefined;
let anomalyUntil = 0;
let anomalyLabel = "";
let anomalyOldGravityX = 0;
let anomalyHidePins = false;
let anomalyMode: BoardAnomalyMode = "none";
let anomalyCenterX = 0;
let anomalyTick = 0;
let lastCommentaryAt = 0;
let commentaryTimer: number | undefined;
let recentMiracleKinds: { kind: DropKind; at: number }[] = [];
let unlockedChainRunIds: Record<string, number> = {};

let soundEnabled = true;
let toneReady = false;
let confettiEnabled = true;
let pixiEnabled = false;
let pixiReady = false;
let pixiApp: Application | null = null;
let pixiParticles: Graphics[] = [];
let animeReady = false;
let tippyReady = false;
let gifReady = false;
let mobileDockRunButton: HTMLButtonElement | null = null;
let mobileDockPauseButton: HTMLButtonElement | null = null;
let mobileDockSettingsButton: HTMLButtonElement | null = null;
let mobileSettingsOverlay: HTMLDivElement | null = null;
let mobileSettingsPanel: HTMLDivElement | null = null;
let missionButton: HTMLButtonElement | null = null;
let shareButton: HTMLButtonElement | null = null;
let skillButtons: Partial<Record<SkillKind, HTMLButtonElement>> = {};

const engine = Engine.create();
engine.gravity.y = 8;
engine.timing.timeScale = 2;

const render = Render.create({
    element: document.body,
    engine,
    options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: "transparent",
        pixelRatio: 2,
    },
});

const runner = Runner.create();

// ======================================================
// HTML / UI
// ======================================================

document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.width = "100%";
document.documentElement.style.maxWidth = "100%";
document.documentElement.style.height = "100%";
document.documentElement.style.overflow = "hidden";
document.documentElement.style.overscrollBehavior = "none";

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.background = "linear-gradient(180deg, #eef3ff 0%, #f7f4ef 100%)";
document.body.style.fontFamily = ROUNDED_UI_FONT;
document.body.style.overflow = "hidden";
document.body.style.overflowX = "hidden";
document.body.style.width = "100%";
document.body.style.maxWidth = "100%";
document.body.style.height = "100dvh";
document.body.style.position = "fixed";
document.body.style.left = "0";
document.body.style.top = "0";
document.body.style.right = "0";
document.body.style.bottom = "0";
document.body.style.overscrollBehavior = "none";
document.body.style.touchAction = "pan-y";

const globalStyle = document.createElement("style");
globalStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { max-width: 100%; overflow: hidden; }
  body { overscroll-behavior-x: none; font-family: "M PLUS Rounded 1c", "Zen Maru Gothic", "Kosugi Maru", "Hiragino Maru Gothic ProN", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif; }
  button, input, textarea, select, pre, code { font-family: inherit; }
  #miracle-horizontal-guard { width: 100%; max-width: 100%; overflow-x: hidden; }
`;
document.head.appendChild(globalStyle);

const bootStartedAt = Date.now();
const bootMinimumDurationMs = 2000;
const faviconUrl = DEFAULT_BACKGROUND_IMAGE_URL;

function preloadImage(src: string): Promise<void> {
    return new Promise((resolve) => {
        const img = new Image();
        img.decoding = "sync";
        img.loading = "eager";
        img.referrerPolicy = "no-referrer";
        img.onload = () => resolve();
        img.onerror = () => {
            window.setTimeout(() => resolve(), 250);
        };
        img.src = src;
        if (img.complete) resolve();
    });
}

const bootFaviconReady = preloadImage(faviconUrl);
const bootOverlay = document.createElement("div");
bootOverlay.id = "miracle-boot-overlay";
bootOverlay.style.position = "fixed";
bootOverlay.style.inset = "0";
bootOverlay.style.zIndex = "9999";
bootOverlay.style.display = "flex";
bootOverlay.style.flexDirection = "column";
bootOverlay.style.alignItems = "center";
bootOverlay.style.justifyContent = "center";
bootOverlay.style.gap = "18px";
bootOverlay.style.background = "radial-gradient(circle at 50% 38%, #f9fff0 0%, #dceec2 42%, #152019 100%)";
bootOverlay.style.color = "#f8fff0";
bootOverlay.style.textAlign = "center";
bootOverlay.style.transition = "opacity 420ms ease";
bootOverlay.style.pointerEvents = "auto";

const bootIcon = document.createElement("img");
bootIcon.src = faviconUrl;
bootIcon.alt = "ミラクルボールラボ";
bootIcon.decoding = "sync";
bootIcon.loading = "eager";
bootIcon.setAttribute("fetchpriority", "high");
bootIcon.style.width = "min(36vw,156px)";
bootIcon.style.height = "min(36vw,156px)";
bootIcon.style.borderRadius = "30px";
bootIcon.style.objectFit = "contain";
bootIcon.style.filter = "drop-shadow(0 16px 28px rgba(0,0,0,.34))";
bootIcon.style.background = "rgba(255,255,255,.92)";
bootIcon.style.padding = "10px";
bootIcon.style.display = "block";

const bootTitle = document.createElement("div");
bootTitle.textContent = "ミラクルボールラボ";
bootTitle.style.fontSize = "clamp(28px,8vw,58px)";
bootTitle.style.fontWeight = "1000";
bootTitle.style.letterSpacing = ".04em";
bootTitle.style.textShadow = "0 6px 22px rgba(0,0,0,.36)";

const bootLabel = document.createElement("div");
bootLabel.textContent = "ロード中...";
bootLabel.style.fontSize = "clamp(15px,4vw,22px)";
bootLabel.style.fontWeight = "900";
bootLabel.style.opacity = ".92";

const bootBarFrame = document.createElement("div");
bootBarFrame.style.width = "min(64vw,360px)";
bootBarFrame.style.height = "10px";
bootBarFrame.style.borderRadius = "999px";
bootBarFrame.style.background = "rgba(255,255,255,.24)";
bootBarFrame.style.overflow = "hidden";
bootBarFrame.style.boxShadow = "inset 0 0 0 1px rgba(255,255,255,.18)";

const bootBar = document.createElement("div");
bootBar.style.width = "42%";
bootBar.style.height = "100%";
bootBar.style.borderRadius = "999px";
bootBar.style.background = "rgba(255,255,255,.88)";
bootBar.style.animation = "miracle-boot-bar 1.05s ease-in-out infinite";
bootBarFrame.appendChild(bootBar);

const bootAnimationStyle = document.createElement("style");
bootAnimationStyle.textContent = "@keyframes miracle-boot-bar{0%{transform:translateX(-120%)}100%{transform:translateX(260%)}}";

bootOverlay.appendChild(bootIcon);
bootOverlay.appendChild(bootTitle);
bootOverlay.appendChild(bootLabel);
bootOverlay.appendChild(bootBarFrame);
bootOverlay.appendChild(bootAnimationStyle);
document.body.appendChild(bootOverlay);
bootIcon.addEventListener("click", () => {
    bootIconTapCount++;
    playUiSound("tick");
    if (bootIconTapCount >= 5) {
        unlockSecret("favicon-five-taps", "favicon 5連打", "起動ロゴを5回タップしました。ロード画面にも秘密がありました。");
        bootIconTapCount = 0;
    }
});
document.addEventListener("keydown", handleSecretKey);

let bootOverlayHidden = false;
function hideBootOverlay(): void {
    if (bootOverlayHidden) return;
    bootOverlayHidden = true;
    void Promise.all([
        bootFaviconReady,
        new Promise<void>((resolve) => {
            const wait = Math.max(0, bootMinimumDurationMs - (Date.now() - bootStartedAt));
            window.setTimeout(() => resolve(), wait);
        }),
    ]).then(() => {
        bootOverlay.style.opacity = "0";
        window.setTimeout(() => bootOverlay.remove(), 460);
    });
}

const appRoot = document.createElement("div");
appRoot.id = "miracle-horizontal-guard";
appRoot.style.width = "100%";
appRoot.style.maxWidth = "100%";
appRoot.style.height = "100dvh";
appRoot.style.boxSizing = "border-box";
appRoot.style.display = "flex";
appRoot.style.flexDirection = "column";
appRoot.style.overflow = "hidden";
document.body.appendChild(appRoot);

const gameArea = document.createElement("div");
gameArea.style.flex = "1";
gameArea.style.minHeight = "0";
gameArea.style.display = "flex";
gameArea.style.alignItems = "center";
gameArea.style.justifyContent = "center";
gameArea.style.background = "radial-gradient(circle at 50% 0%, #ffffff 0%, #edf3ff 46%, #dfe7f5 100%)";
gameArea.style.overflow = "hidden";
gameArea.style.position = "relative";
appRoot.appendChild(gameArea);

const pixiLayer = document.createElement("div");
pixiLayer.style.position = "absolute";
pixiLayer.style.inset = "0";
pixiLayer.style.zIndex = "0";
pixiLayer.style.pointerEvents = "none";
gameArea.appendChild(pixiLayer);

const canvas = render.canvas;
canvas.style.display = "block";
canvas.style.position = "relative";
canvas.style.zIndex = "1";
canvas.style.transformOrigin = "center center";
canvas.style.borderRadius = isMobile ? "24px" : "26px";
canvas.style.boxShadow = isMobile ? "0 10px 28px rgba(26,35,60,0.18)" : "0 18px 44px rgba(26,35,60,0.20)";
canvas.style.backgroundColor = "rgba(245,245,245,0.88)";
canvas.style.backgroundSize = "cover";
canvas.style.backgroundPosition = "center";
canvas.style.backgroundRepeat = "no-repeat";
canvas.addEventListener("pointerdown", (event) => activateNearestPin(event));
gameArea.appendChild(canvas);

const gameFullscreenButton = document.createElement("button");
gameFullscreenButton.textContent = "⛶";
gameFullscreenButton.title = "fullscreen";
gameFullscreenButton.style.position = "absolute";
gameFullscreenButton.style.right = isMobile ? "14px" : "16px";
gameFullscreenButton.style.bottom = isMobile ? "14px" : "16px";
gameFullscreenButton.style.zIndex = "3";
gameFullscreenButton.style.width = isMobile ? "54px" : "48px";
gameFullscreenButton.style.height = isMobile ? "54px" : "48px";
gameFullscreenButton.style.borderRadius = "999px";
gameFullscreenButton.style.border = "1px solid rgba(255,255,255,.4)";
gameFullscreenButton.style.background = "rgba(15,21,36,.55)";
gameFullscreenButton.style.backdropFilter = "blur(8px)";
gameFullscreenButton.style.color = "#fff";
gameFullscreenButton.style.fontSize = isMobile ? "28px" : "24px";
gameFullscreenButton.style.fontWeight = "900";
gameFullscreenButton.style.cursor = "pointer";
gameFullscreenButton.onclick = () => toggleGameFullscreen();
gameArea.appendChild(gameFullscreenButton);

const pcPauseButton = document.createElement("button");
pcPauseButton.textContent = "一時停止";
pcPauseButton.title = "一時停止 / 再開";
pcPauseButton.style.position = "absolute";
pcPauseButton.style.left = isMobile ? "14px" : "16px";
pcPauseButton.style.bottom = isMobile ? "82px" : "16px";
pcPauseButton.style.zIndex = "4";
pcPauseButton.style.display = isMobile ? "none" : "inline-flex";
pcPauseButton.style.alignItems = "center";
pcPauseButton.style.justifyContent = "center";
pcPauseButton.style.minWidth = "112px";
pcPauseButton.style.height = "48px";
pcPauseButton.style.padding = "0 18px";
pcPauseButton.style.borderRadius = "999px";
pcPauseButton.style.border = "1px solid rgba(255,255,255,.48)";
pcPauseButton.style.background = "rgba(15,21,36,.62)";
pcPauseButton.style.backdropFilter = "blur(10px)";
pcPauseButton.style.color = "#fff";
pcPauseButton.style.fontSize = "18px";
pcPauseButton.style.fontWeight = "900";
pcPauseButton.style.fontFamily = ROUNDED_UI_FONT;
pcPauseButton.style.cursor = "pointer";
pcPauseButton.onclick = () => togglePause();
gameArea.appendChild(pcPauseButton);

const info = document.createElement("div");
info.style.flex = "0 0 auto";
info.style.width = "100%";
info.style.maxWidth = "100%";
info.style.boxSizing = "border-box";
info.style.background = "rgba(255, 255, 255, 0.88)";
info.style.backdropFilter = "blur(18px)";
info.style.borderTop = "1px solid rgba(255,255,255,0.78)";
info.style.boxShadow = "0 -8px 28px rgba(0,0,0,0.08)";
info.style.overflow = "auto";
appRoot.appendChild(info);

const appHeader = document.createElement("div");
appHeader.style.display = "flex";
appHeader.style.alignItems = "center";
appHeader.style.justifyContent = "space-between";
appHeader.style.gap = "12px";
appHeader.style.flexWrap = "wrap";
appHeader.style.marginBottom = "12px";
appHeader.style.padding = isMobile ? "12px 14px" : "10px 16px";
appHeader.style.borderRadius = "18px";
appHeader.style.background = "linear-gradient(180deg, #f6faec 0%, #e3f0cc 100%)";
appHeader.style.border = "1px solid rgba(87,112,51,0.22)";
appHeader.style.boxShadow = "0 6px 18px rgba(87,112,51,0.10)";
info.appendChild(appHeader);

const appTitle = document.createElement("div");
appHeader.appendChild(appTitle);

const appHeaderNote = document.createElement("div");
appHeaderNote.textContent = "レア演出は運。超高速だと見逃しやすいです。";
appHeaderNote.style.fontSize = `${Math.max(14, uiFontPx - 5)}px`;
appHeaderNote.style.fontWeight = "800";
appHeaderNote.style.color = "#56663f";
appHeader.appendChild(appHeaderNote);

const recordHero = document.createElement("div");
recordHero.style.margin = "0 0 12px 0";
recordHero.style.padding = isMobile ? "14px 18px" : "12px 18px";
recordHero.style.borderRadius = "24px";
recordHero.style.background = "linear-gradient(135deg, #fff6cf 0%, #e3f0cc 55%, #dceec2 100%)";
recordHero.style.border = "1px solid rgba(87,112,51,0.24)";
recordHero.style.boxShadow = "0 10px 26px rgba(87,112,51,0.14)";
recordHero.style.color = "#26351f";
recordHero.style.fontWeight = "900";
recordHero.style.display = "flex";
recordHero.style.alignItems = "center";
recordHero.style.justifyContent = "space-between";
recordHero.style.gap = "12px";
recordHero.style.flexWrap = "wrap";
info.appendChild(recordHero);

const topRow = document.createElement("div");
topRow.style.display = "grid";
topRow.style.gridTemplateColumns = isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(170px, 1fr))";
topRow.style.gap = isMobile ? "10px 14px" : "8px 14px";
topRow.style.alignItems = "center";
info.appendChild(topRow);

const controlArea = document.createElement("div");
controlArea.style.display = "grid";
controlArea.style.gridTemplateColumns = isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))";
controlArea.style.gap = isMobile ? "14px" : "10px 14px";
controlArea.style.marginTop = "14px";
controlArea.style.alignItems = "end";
controlArea.style.width = "100%";
controlArea.style.maxWidth = "100%";
controlArea.style.boxSizing = "border-box";
info.appendChild(controlArea);

const buttonArea = document.createElement("div");
buttonArea.style.display = "flex";
buttonArea.style.flexWrap = "wrap";
buttonArea.style.gap = isMobile ? "12px" : "10px";
buttonArea.style.marginTop = "14px";
buttonArea.style.width = "100%";
buttonArea.style.maxWidth = "100%";
buttonArea.style.boxSizing = "border-box";
info.appendChild(buttonArea);

const randomGraphArea = document.createElement("div");
randomGraphArea.style.marginTop = "14px";
info.appendChild(randomGraphArea);

function createField(label: string, input: HTMLElement): { wrapper: HTMLDivElement; labelEl: HTMLLabelElement } {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "6px";
    wrapper.style.minWidth = "0";

    const labelElement = document.createElement("label");
    labelElement.textContent = label;
    labelElement.style.fontWeight = "800";
    labelElement.style.color = "#273042";
    labelElement.style.fontSize = `${Math.max(17, uiFontPx - 2)}px`;

    wrapper.appendChild(labelElement);
    wrapper.appendChild(input);
    return { wrapper, labelEl: labelElement };
}

function createInput(value: string, type = "text"): HTMLInputElement {
    const input = document.createElement("input");
    input.type = type;
    input.value = value;
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    input.style.padding = isMobile ? "16px 16px" : "12px 14px";
    input.style.borderRadius = "18px";
    input.style.border = "1px solid #b8c1d1";
    input.style.background = "#ffffff";
    input.style.fontSize = `${uiFontPx}px`;
    input.style.outline = "none";
    input.style.fontFamily = ROUNDED_UI_FONT;
    return input;
}

function createTextarea(value: string): HTMLTextAreaElement {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.rows = isMobile ? 5 : 4;
    textarea.style.width = "100%";
    textarea.style.boxSizing = "border-box";
    textarea.style.padding = isMobile ? "16px 16px" : "12px 14px";
    textarea.style.borderRadius = "18px";
    textarea.style.border = "1px solid #b8c1d1";
    textarea.style.background = "#ffffff";
    textarea.style.fontSize = `${uiFontPx}px`;
    textarea.style.outline = "none";
    textarea.style.resize = "vertical";
    textarea.style.fontFamily = ROUNDED_UI_FONT;
    return textarea;
}

function createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.fontSize = `${uiButtonFontPx}px`;
    button.style.fontWeight = "900";
    button.style.padding = isMobile ? "16px 22px" : "12px 18px";
    button.style.border = "1px solid rgba(87,112,51,0.28)";
    button.style.borderRadius = "999px";
    button.style.background = "linear-gradient(180deg, #f3f8e8 0%, #dceec2 100%)";
    button.style.boxShadow = "0 8px 20px rgba(87,112,51,0.16)";
    button.style.color = "#26351f";
    button.style.cursor = "pointer";
    button.style.maxWidth = "100%";
    button.style.whiteSpace = "nowrap";
    button.style.fontFamily = ROUNDED_UI_FONT;
    if (isMobile) {
        button.style.flex = "1 1 auto";
        button.style.minWidth = "0";
    }
    button.onclick = onClick;
    return button;
}

function setTooltip<T extends HTMLElement>(target: T, ja: string, en: string): T {
    tooltipRefs.push({ el: target, ja, en });
    target.setAttribute("data-tippy-content", isEnglish ? en : ja);
    target.setAttribute("aria-label", isEnglish ? en : ja);
    return target;
}

function updateTooltipText(): void {
    for (const item of tooltipRefs) {
        const content = isEnglish ? item.en : item.ja;
        item.el.setAttribute("data-tippy-content", content);
        item.el.setAttribute("aria-label", content);
        const tip = (item.el as any)._tippy;
        if (tip?.setContent) tip.setContent(content);
    }
}

function ensureExternalStyle(href: string): void {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}


type UiFieldRefs = { wrapper: HTMLDivElement; labelEl: HTMLLabelElement; ja: string; en: string };
const uiFieldRefs: UiFieldRefs[] = [];
const bilingualButtons: Array<{ button: HTMLButtonElement; ja: string; en: string }> = [];
const sectionTitles: Array<{ el: HTMLDivElement; ja: string; en: string }> = [];
const tooltipRefs: Array<{ el: HTMLElement; ja: string; en: string }> = [];

function setButtonLabel(button: HTMLButtonElement, ja: string, en: string): HTMLButtonElement {
    bilingualButtons.push({ button, ja, en });
    button.textContent = isEnglish ? en : ja;
    return button;
}

function createSection(titleJa: string, titleEn: string): HTMLDivElement {
    const section = document.createElement("div");
    section.style.display = "flex";
    section.style.flexDirection = "column";
    section.style.gap = "10px";
    section.style.padding = isMobile ? "14px" : "12px";
    section.style.borderRadius = "22px";
    section.style.background = "linear-gradient(180deg, rgba(246,250,236,.96) 0%, rgba(227,240,204,.88) 100%)";
    section.style.border = "1px solid rgba(87,112,51,0.20)";
    section.style.boxShadow = "0 8px 22px rgba(87,112,51,0.10)";
    section.style.width = "100%";
    section.style.boxSizing = "border-box";

    const title = document.createElement("div");
    title.style.fontSize = `${Math.max(18, uiFontPx - 1)}px`;
    title.style.fontWeight = "900";
    title.style.color = "#334321";
    title.textContent = isEnglish ? titleEn : titleJa;
    section.appendChild(title);
    sectionTitles.push({ el: title, ja: titleJa, en: titleEn });

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.flexWrap = "wrap";
    row.style.gap = isMobile ? "10px" : "8px";
    section.appendChild(row);
    buttonArea.appendChild(section);
    return row;
}

function addField(wrapper: HTMLDivElement, labelEl: HTMLLabelElement, ja: string, en: string): void {
    uiFieldRefs.push({ wrapper, labelEl, ja, en });
    labelEl.textContent = isEnglish ? en : ja;
    controlArea.appendChild(wrapper);
}

function setSelectOptions(): void {
    probabilityModeSelect.innerHTML = isEnglish
        ? `
    <option value="normal">Normal: observe true low odds</option>
    <option value="festival">Festival: easier to witness effects</option>
    <option value="hard">Hard: much rarer</option>
    <option value="hell">Hell: miracles almost denied</option>
`
        : `
    <option value="normal">通常モード：低確率を真面目に観測</option>
    <option value="festival">祭りモード：演出を少し観測しやすい</option>
    <option value="hard">修羅モード：かなり出にくい</option>
    <option value="hell">地獄モード：奇跡ほぼ拒否</option>
`;
    probabilityModeSelect.value = settings.probabilityMode;
}

function t(ja: string, en: string): string {
    return isEnglish ? en : ja;
}

const targetInput = createInput(String(settings.targetCount), "number");
targetInput.min = "1";
targetInput.step = "100";

const activeBallInput = createInput(String(settings.activeLimit), "number");
activeBallInput.min = "1";
activeBallInput.max = "300";

const binCountInput = createInput(String(settings.binCount), "number");
binCountInput.min = "2";
binCountInput.max = "30";

const pinRowInput = createInput(String(settings.pinRows), "number");
pinRowInput.min = "1";
pinRowInput.max = "30";

const backgroundInput = createInput(settings.backgroundImage, "text");
backgroundInput.placeholder = "例: /background.jpg または https://example.com/image.jpg";

const backgroundFileInput = document.createElement("input");
backgroundFileInput.type = "file";
backgroundFileInput.accept = "image/*";
backgroundFileInput.style.width = "100%";
backgroundFileInput.style.boxSizing = "border-box";
backgroundFileInput.style.padding = isMobile ? "16px 16px" : "12px 14px";
backgroundFileInput.style.borderRadius = "14px";
backgroundFileInput.style.border = "1px solid #b8c1d1";
backgroundFileInput.style.background = "#ffffff";
backgroundFileInput.style.fontSize = `${Math.max(18, uiFontPx - 2)}px`;
backgroundFileInput.onchange = () => {
    const file = backgroundFileInput.files?.[0];
    if (!file) return;
    if (selectedBackgroundObjectUrl) URL.revokeObjectURL(selectedBackgroundObjectUrl);
    selectedBackgroundObjectUrl = URL.createObjectURL(file);
    settings.backgroundImage = selectedBackgroundObjectUrl;
    backgroundInput.value = `選択した画像: ${file.name}`;
    applyBackgroundImage();
};

const probabilityModeSelect = document.createElement("select");
probabilityModeSelect.value = settings.probabilityMode;
probabilityModeSelect.style.width = "100%";
probabilityModeSelect.style.boxSizing = "border-box";
probabilityModeSelect.style.padding = isMobile ? "16px 16px" : "12px 14px";
probabilityModeSelect.style.borderRadius = "18px";
probabilityModeSelect.style.border = "1px solid #b8c1d1";
probabilityModeSelect.style.background = "#ffffff";
probabilityModeSelect.style.fontSize = `${uiFontPx}px`;
probabilityModeSelect.style.fontWeight = "800";
setSelectOptions();

const themeSelect = document.createElement("select");
themeSelect.style.width = "100%";
themeSelect.style.boxSizing = "border-box";
themeSelect.style.padding = isMobile ? "16px 16px" : "12px 14px";
themeSelect.style.borderRadius = "18px";
themeSelect.style.border = "1px solid #b8c1d1";
themeSelect.style.background = "#ffffff";
themeSelect.style.fontSize = `${uiFontPx}px`;
themeSelect.style.fontWeight = "800";
themeSelect.innerHTML = `
<option value="lab">研究所</option>
<option value="space">宇宙</option>
<option value="sunset">夕焼け</option>
<option value="retro">レトロ</option>
<option value="midnight">深夜</option>`;
themeSelect.value = currentTheme;
themeSelect.onchange = () => {
    currentTheme = (themeSelect.value as ThemeMode) || "lab";
    applyTheme();
};

binCountInput.addEventListener("blur", () => autoApplyLayoutSetting());
pinRowInput.addEventListener("blur", () => autoApplyLayoutSetting());

const targetField = createField("投下数", targetInput);
addField(targetField.wrapper, targetField.labelEl, "投下数", "Ball count");
const activeField = createField("同時に出す玉数", activeBallInput);
addField(activeField.wrapper, activeField.labelEl, "同時に出す玉数", "Simultaneous balls");
const binField = createField("下の受け皿数", binCountInput);
addField(binField.wrapper, binField.labelEl, "下の受け皿数", "Bottom bins");
const pinField = createField("ピン段数", pinRowInput);
addField(pinField.wrapper, pinField.labelEl, "ピン段数", "Pin rows");
const bgField = createField("背景画像URL", backgroundInput);
addField(bgField.wrapper, bgField.labelEl, "背景画像URL", "Background image URL");
const bgFileField = createField("背景画像を写真から選択", backgroundFileInput);
addField(bgFileField.wrapper, bgFileField.labelEl, "背景画像を写真から選択", "Choose background photo");
const probField = createField("確率モード", probabilityModeSelect);
addField(probField.wrapper, probField.labelEl, "確率モード", "Probability mode");
const themeField = createField("テーマ切替", themeSelect);
addField(themeField.wrapper, themeField.labelEl, "テーマ切替", "Theme");

const utilityButtons = createSection("実験メニュー", "Experiment");
const speedButtons = createSection("投下速度", "Drop speed");
const displayButtons = createSection("表示・演出", "Display & effects");
const settingButtons = createSection("反映・出力", "Apply & export");

const runButton = setTooltip(setButtonLabel(createButton("実行", () => startExperiment()), "実行", "Run"), "設定どおりに落下実験を開始します。", "Start the drop experiment with current settings.");
utilityButtons.appendChild(runButton);
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("この実験について", () => showAboutPopup()), "この実験について", "About"), "このプログラムが何をするか説明します。", "Explain what this program does."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("ボタン説明", () => showButtonHelpPopup()), "ボタン説明", "Buttons"), "各ボタンの役割を一覧表示します。", "Show a list of what each button does."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("奇跡図鑑", () => showMiracleBookPopup()), "奇跡図鑑", "Miracle book"), "レア玉の一覧と発見回数を見ます。", "View rare drops and discovery counts."));
missionButton = setTooltip(setButtonLabel(createButton("ミッション", () => showMissionPopup()), "ミッション", "Missions"), "達成条件と報酬スコアを確認します。", "Check missions and score rewards.");
utilityButtons.appendChild(missionButton);
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("最高記録", () => showRecordsPopup()), "最高記録", "Records"), "最高記録や通算記録を表示します。", "Show best and lifetime records."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("奇跡ログ", () => showMiracleLogPopup()), "奇跡ログ", "Miracle log"), "発生した奇跡の履歴を見ます。", "Show the history of miracles."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("今日の運勢", () => showDailyFortunePopup()), "今日の運勢", "Fortune"), "今日の奇跡率とラッキー受け皿を表示します。", "Show today's miracle rate and lucky bin."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("奇跡合成", () => showFusionPopup()), "奇跡合成", "Fusion"), "奇跡同士の合成・派生記録を表示します。", "Show miracle fusion records."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("秘密", () => showSecretPopup()), "秘密", "Secret"), "裏コマンドの解放状況を表示します。", "Show secret command unlocks."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("研究レポート", () => showResearchReportPopup()), "研究レポート", "Report"), "現在の実験状況をまとめます。", "Summarize the current experiment."));
const replayButton = setTooltip(setButtonLabel(createButton("リプレイ", () => showReplayPopup()), "リプレイ", "Replay"), "奇跡クリップを再生・GIF保存します。", "Play or export miracle clips as GIF.");
utilityButtons.appendChild(replayButton);
shareButton = setTooltip(setButtonLabel(createButton("録画・SNS", () => showSharePopup()), "録画・SNS", "Share"), "投稿文コピーやSNSカード保存を行います。", "Copy a share caption or save a social card.");
utilityButtons.appendChild(shareButton);

const languageButton = setTooltip(setButtonLabel(createButton("English", () => {
    isEnglish = !isEnglish;
    updateUiLanguage();
    updateStopButton();
    updateInfo();
}), "English", "日本語"), "表示言語を切り替えます。", "Switch the display language.");
utilityButtons.appendChild(languageButton);

const fullScreenButton = setTooltip(setButtonLabel(createButton("全画面", () => toggleGameFullscreen()), "全画面", "Fullscreen"), "実験画面だけを大きく表示します。", "Expand only the game screen." );
utilityButtons.appendChild(fullScreenButton);

speedButtons.appendChild(setTooltip(setButtonLabel(createButton("超低速", () => {
    speedLabelText = "超低速";
    engine.timing.timeScale = getCurrentTimeScale();
    updateInfo();
}), "超低速", "Very slow"), "かなりゆっくり進めます。観察向けです。", "Very slow for close observation."));

speedButtons.appendChild(setTooltip(setButtonLabel(createButton("低速", () => {
    speedLabelText = "低速";
    engine.timing.timeScale = getCurrentTimeScale();
    updateInfo();
}), "低速", "Slow"), "ゆっくり進めます。", "Run slowly."));

speedButtons.appendChild(setTooltip(setButtonLabel(createButton("通常", () => {
    speedLabelText = "通常";
    engine.timing.timeScale = getCurrentTimeScale();
    updateInfo();
}), "通常", "Normal"), "標準速度で観測します。", "Observe at standard speed."));

speedButtons.appendChild(setTooltip(setButtonLabel(createButton("高速", () => {
    speedLabelText = "高速";
    engine.timing.timeScale = getCurrentTimeScale();
    updateInfo();
}), "高速", "Fast"), "やや速めに流します。", "Run the simulation faster."));

speedButtons.appendChild(setTooltip(setButtonLabel(createButton("超高速", () => {
    speedLabelText = "超高速";
    engine.timing.timeScale = getCurrentTimeScale();
    updateInfo();
}), "超高速", "Ultra"), "かなり速いので演出を見逃しやすいです。", "Very fast and easier to miss effects."));

const stopButton = setTooltip(setButtonLabel(createButton("ストップ", () => togglePause()), "ストップ", "Stop"), "実験を一時停止・再開します。", "Pause or resume the experiment.");
stopButton.addEventListener("touchend", (event) => { event.preventDefault(); togglePause(); }, { passive: false });
displayButtons.appendChild(stopButton);
const shockwaveButton = setTooltip(setButtonLabel(createButton("衝撃波 ×2", () => useSkill("shockwave")), "衝撃波 ×2", "Shockwave ×2"), "画面中央から玉を散らすスキルです。", "Scatter balls from the center.");
const magnetButton = setTooltip(setButtonLabel(createButton("磁石 ×2", () => useSkill("magnet")), "磁石 ×2", "Magnet ×2"), "一定時間、上位の受け皿へ吸い寄せます。", "Pull balls toward the current top bin for a while.");
const timeStopButton = setTooltip(setButtonLabel(createButton("時止め ×1", () => useSkill("timeStop")), "時止め ×1", "Time stop ×1"), "短時間だけ時間を止めて盤面を立て直します。", "Temporarily stop time to regain control.");
skillButtons.shockwave = shockwaveButton;
skillButtons.magnet = magnetButton;
skillButtons.timeStop = timeStopButton;
displayButtons.appendChild(shockwaveButton);
displayButtons.appendChild(magnetButton);
displayButtons.appendChild(timeStopButton);

displayButtons.appendChild(setTooltip(setButtonLabel(createButton("リセット", () => {
    if (!applySettingsFromInputs(true)) return;
    resetExperiment(false);
}), "リセット", "Reset"), "盤面を作り直して最初からにします。", "Rebuild the board and start fresh."));

const simpleModeButton = setTooltip(setButtonLabel(createButton("シンプル: OFF", () => {
    settings.simpleMode = !settings.simpleMode;
    updateSimpleModeButton();
    updateInfo();
}), "シンプル: OFF", "Simple: OFF"), "演出を軽くして見やすくします。", "Reduce effects for a lighter view.");
displayButtons.appendChild(simpleModeButton);

const slowMiracleButton = setTooltip(setButtonLabel(createButton("演出ゆっくり: OFF", () => {
    settings.slowMiracleEffects = !settings.slowMiracleEffects;
    updateSlowMiracleButton();
    updateInfo();
}), "演出ゆっくり: OFF", "Slow effects: OFF"), "奇跡演出だけを少し長く見せます。デフォルトはOFFです。", "Show miracle effects a little longer. Default is off.");
displayButtons.appendChild(slowMiracleButton);

const cameraShakeButton = setTooltip(setButtonLabel(createButton("画面揺れ: ON", () => {
    settings.cameraShakeEnabled = !settings.cameraShakeEnabled;
    updateCameraShakeButton();
}), "画面揺れ: ON", "Shake: ON"), "画面揺れ演出のON/OFFを切り替えます。", "Toggle screen shake effects on or off.");
displayButtons.appendChild(cameraShakeButton);

const soundButton = setTooltip(setButtonLabel(createButton("音: ON", () => toggleSound()), "音: ON", "Sound: ON"), "効果音のON/OFFを切り替えます。", "Toggle sound effects on or off.");
displayButtons.appendChild(soundButton);

const confettiButton = setTooltip(setButtonLabel(createButton("紙吹雪: ON", () => {
    confettiEnabled = !confettiEnabled;
    confettiButton.textContent = confettiEnabled ? t("紙吹雪: ON", "Confetti: ON") : t("紙吹雪: OFF", "Confetti: OFF");
}), "紙吹雪: ON", "Confetti: ON"), "紙吹雪演出のON/OFFです。", "Toggle confetti effects." );
displayButtons.appendChild(confettiButton);

const pixiButton = setTooltip(setButtonLabel(createButton("Pixi背景: OFF", () => togglePixiBackground()), "Pixi背景: OFF", "Pixi BG: OFF"), "Pixi.jsの背景演出を切り替えます。", "Toggle the Pixi.js background effects.");
displayButtons.appendChild(pixiButton);
const verticalButton = setTooltip(setButtonLabel(createButton("縦動画: OFF", () => toggleVerticalVideoMode()), "縦動画: OFF", "Vertical: OFF"), "縦長動画向けの表示に寄せます。", "Adapt the view for vertical video." );
displayButtons.appendChild(verticalButton);
const obsButton = setTooltip(setButtonLabel(createButton("OBS: OFF", () => toggleObsMode()), "OBS: OFF", "OBS: OFF"), "OBS録画しやすい表示に切り替えます。", "Adjust the view for OBS recording." );
displayButtons.appendChild(obsButton);

settingButtons.appendChild(setTooltip(setButtonLabel(createButton("設定反映", () => {
    if (!applySettingsFromInputs(true)) return;
    resetExperiment(false);
}), "設定反映", "Apply settings"), "入力した設定を盤面へ反映します。", "Apply the input settings to the board."));

settingButtons.appendChild(setTooltip(setButtonLabel(createButton("背景だけ反映", () => {
    selectedBackgroundObjectUrl = "";
    settings.backgroundImage = backgroundInput.value.trim();
    applyBackgroundImage();
}), "背景だけ反映", "Apply background"), "背景画像だけ更新します。", "Update only the background image."));

settingButtons.appendChild(setTooltip(setButtonLabel(createButton("結果コピー", () => copyResultCsv()), "結果コピー", "Copy result"), "結果をCSV形式でコピーします。", "Copy the result as CSV."));
settingButtons.appendChild(setTooltip(setButtonLabel(createButton("CSV保存", () => downloadResultCsv()), "CSV保存", "Save CSV"), "結果CSVを保存します。", "Save the result as CSV."));
updateUiLanguage();
void ensureTippyReady();
if (isMobile) setupMobileLayout();

const resultOverlay = document.createElement("div");
resultOverlay.style.position = "fixed";
resultOverlay.style.left = "0";
resultOverlay.style.top = "0";
resultOverlay.style.width = "100vw";
resultOverlay.style.height = "100dvh";
resultOverlay.style.background = "rgba(5, 8, 18, 0.86)";
resultOverlay.style.color = "#ffffff";
resultOverlay.style.zIndex = "100";
resultOverlay.style.display = "none";
resultOverlay.style.alignItems = "center";
resultOverlay.style.justifyContent = "center";
resultOverlay.style.textAlign = "center";
resultOverlay.style.padding = "28px";
resultOverlay.style.boxSizing = "border-box";
document.body.appendChild(resultOverlay);

resultOverlay.addEventListener("click", (event) => {
    if (event.target === resultOverlay) closeFinalResult();
});
window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && resultOverlay.style.display !== "none") closeFinalResult();
    if (event.key === "1") useSkill("shockwave");
    if (event.key === "2") useSkill("magnet");
    if (event.key === "3") useSkill("timeStop");
});

const milestoneOverlay = document.createElement("div");
milestoneOverlay.style.position = "fixed";
milestoneOverlay.style.left = "50%";
milestoneOverlay.style.top = "34%";
milestoneOverlay.style.transform = "translate(-50%, -50%)";
milestoneOverlay.style.zIndex = "90";
milestoneOverlay.style.padding = "20px 34px";
milestoneOverlay.style.borderRadius = "22px";
milestoneOverlay.style.background = "linear-gradient(135deg, rgba(255,240,120,0.96), rgba(255,165,70,0.96))";
milestoneOverlay.style.color = "#2b2100";
milestoneOverlay.style.fontSize = isMobile ? "48px" : "44px";
milestoneOverlay.style.fontWeight = "900";
milestoneOverlay.style.boxShadow = "0 16px 38px rgba(0,0,0,0.35)";
milestoneOverlay.style.display = "none";
document.body.appendChild(milestoneOverlay);

const celebrationOverlay = document.createElement("div");
celebrationOverlay.style.position = "fixed";
celebrationOverlay.style.left = "0";
celebrationOverlay.style.top = "0";
celebrationOverlay.style.width = "100vw";
celebrationOverlay.style.height = "100dvh";
celebrationOverlay.style.zIndex = "80";
celebrationOverlay.style.pointerEvents = "none";
celebrationOverlay.style.display = "none";
celebrationOverlay.style.overflow = "hidden";
celebrationOverlay.style.alignItems = "center";
celebrationOverlay.style.justifyContent = "center";
celebrationOverlay.style.textAlign = "center";
document.body.appendChild(celebrationOverlay);

const miracleOverlay = document.createElement("div");
miracleOverlay.style.position = "fixed";
miracleOverlay.style.left = "0";
miracleOverlay.style.top = "0";
miracleOverlay.style.width = "100vw";
miracleOverlay.style.height = "100dvh";
miracleOverlay.style.zIndex = "120";
miracleOverlay.style.pointerEvents = "none";
miracleOverlay.style.display = "none";
miracleOverlay.style.alignItems = "center";
miracleOverlay.style.justifyContent = "center";
miracleOverlay.style.textAlign = "center";
miracleOverlay.style.background = "rgba(0,0,0,0.72)";
miracleOverlay.style.color = "#fff";
miracleOverlay.style.padding = "24px";
miracleOverlay.style.boxSizing = "border-box";
document.body.appendChild(miracleOverlay);
let miracleOverlayTimer: number | undefined;
let miracleOverlayEndsAt = 0;
let miracleOverlayRemainingMs = 0;
let miracleOverlayFrozen = false;

const flashOverlay = document.createElement("div");
flashOverlay.style.position = "fixed";
flashOverlay.style.left = "0";
flashOverlay.style.top = "0";
flashOverlay.style.width = "100vw";
flashOverlay.style.height = "100dvh";
flashOverlay.style.zIndex = "119";
flashOverlay.style.pointerEvents = "none";
flashOverlay.style.display = "none";
flashOverlay.style.background = "rgba(255,255,255,0)";
document.body.appendChild(flashOverlay);

const helpOverlay = document.createElement("div");
helpOverlay.style.position = "fixed";
helpOverlay.style.left = "0";
helpOverlay.style.top = "0";
helpOverlay.style.width = "100vw";
helpOverlay.style.height = "100dvh";
helpOverlay.style.background = "rgba(5, 8, 18, 0.78)";
helpOverlay.style.color = "#1f2a18";
helpOverlay.style.zIndex = "130";
helpOverlay.style.display = "none";
helpOverlay.style.alignItems = "center";
helpOverlay.style.justifyContent = "center";
helpOverlay.style.padding = isMobile ? "10px" : "24px";
helpOverlay.style.boxSizing = "border-box";
helpOverlay.style.overflow = "hidden";
helpOverlay.style.touchAction = "pan-y";
document.body.appendChild(helpOverlay);

const subtitleOverlay = document.createElement("div");
subtitleOverlay.style.position = "fixed";
subtitleOverlay.style.left = "50%";
subtitleOverlay.style.bottom = isMobile ? "104px" : "28px";
subtitleOverlay.style.transform = "translateX(-50%)";
subtitleOverlay.style.maxWidth = "min(92vw, 960px)";
subtitleOverlay.style.padding = isMobile ? "12px 18px" : "10px 18px";
subtitleOverlay.style.borderRadius = "18px";
subtitleOverlay.style.background = "rgba(0,0,0,.62)";
subtitleOverlay.style.color = "#fff";
subtitleOverlay.style.fontSize = isMobile ? "24px" : "18px";
subtitleOverlay.style.fontWeight = "900";
subtitleOverlay.style.lineHeight = "1.5";
subtitleOverlay.style.textAlign = "center";
subtitleOverlay.style.zIndex = "121";
subtitleOverlay.style.display = "none";
subtitleOverlay.style.pointerEvents = "none";
document.body.appendChild(subtitleOverlay);

const commentaryOverlay = document.createElement("div");
commentaryOverlay.style.position = "fixed";
commentaryOverlay.style.left = "0";
commentaryOverlay.style.bottom = isMobile ? "62px" : "10px";
commentaryOverlay.style.width = "100vw";
commentaryOverlay.style.height = isMobile ? "34px" : "30px";
commentaryOverlay.style.zIndex = "92";
commentaryOverlay.style.pointerEvents = "none";
commentaryOverlay.style.overflow = "hidden";
commentaryOverlay.style.display = "none";
document.body.appendChild(commentaryOverlay);

const comboOverlay = document.createElement("div");
comboOverlay.style.position = "fixed";
comboOverlay.style.right = isMobile ? "10px" : "20px";
comboOverlay.style.top = isMobile ? "72px" : "24px";
comboOverlay.style.padding = isMobile ? "10px 14px" : "8px 12px";
comboOverlay.style.borderRadius = "999px";
comboOverlay.style.background = "rgba(255,224,120,.92)";
comboOverlay.style.color = "#2b2100";
comboOverlay.style.fontSize = isMobile ? "22px" : "18px";
comboOverlay.style.fontWeight = "900";
comboOverlay.style.zIndex = "122";
comboOverlay.style.display = "none";
comboOverlay.style.boxShadow = "0 8px 20px rgba(0,0,0,.22)";
document.body.appendChild(comboOverlay);

helpOverlay.addEventListener("click", (event) => {
    if (event.target === helpOverlay) closeHelpPopup();
});
window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && helpOverlay.style.display !== "none") closeHelpPopup();
    if (event.key === "Escape" && mobileSettingsOverlay && mobileSettingsOverlay.style.display !== "none") closeMobileSettingsPopup();
});

// ======================================================
// Utility
// ======================================================

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes("Edg/")) return "Microsoft Edge";
    if (ua.includes("Firefox/")) return "Firefox";
    if (ua.includes("Chrome/")) return "Google Chrome";
    if (ua.includes("Safari/")) return "Safari";
    return "Unknown Browser";
}

function isMobileDevice(): boolean {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        window.matchMedia?.("(pointer: coarse)")?.matches === true ||
        window.innerWidth < 700;
}

function appRandom(): number {
    const value = Math.random();
    const index = Math.min(RANDOM_BUCKET_COUNT - 1, Math.floor(value * RANDOM_BUCKET_COUNT));
    randomBuckets[index]++;
    randomCallCount++;
    return value;
}

function randomColor(): string {
    return `hsl(${Math.floor(appRandom() * 360)}, ${70 + Math.floor(appRandom() * 25)}%, ${52 + Math.floor(appRandom() * 18)}%)`;
}

function randomRgba(alpha: number): string {
    const hue = Math.floor(appRandom() * 360);
    return `hsla(${hue}, 95%, 58%, ${alpha})`;
}

function parseLabels(text: string, count: number): string[] {
    const items = text.split(/\n|,/).map((x) => x.trim()).filter((x) => x.length > 0);
    const result: string[] = [];
    for (let i = 0; i < count; i++) result.push(items[i] ?? String(i + 1));
    return result;
}

function formatElapsedTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function escapeCsv(value: string | number): string {
    const text = String(value);
    if (text.includes(",") || text.includes('"') || text.includes("\n")) return `"${text.replace(/"/g, '""')}"`;
    return text;
}


function loadExternalScript(_src: string): Promise<void> {
    return Promise.resolve();
}

async function ensureAnimeReady(): Promise<boolean> {
    animeReady = true;
    return true;
}

async function ensureTippyReady(): Promise<boolean> {
    tippyReady = true;
    initButtonTooltips();
    return true;
}

async function ensureGifReady(): Promise<boolean> {
    gifReady = true;
    return true;
}

function initButtonTooltips(): void {
    updateTooltipText();
    for (const item of tooltipRefs) {
        if ((item.el as any)._tippy) continue;
        tippy(item.el, {
            content: item.el.getAttribute("data-tippy-content") || "",
            placement: isMobile ? "top" : "bottom",
            animation: "shift-away",
            theme: "light-border",
            maxWidth: isMobile ? 260 : 320,
            delay: isMobile ? [0, 0] : [140, 0],
            touch: ["hold", 350],
            interactive: false,
        });
    }
}

function loadSavedRecords(): SavedRecords {
    try {
        const raw = localStorage.getItem(RECORD_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw) as Partial<SavedRecords>;
            return {
                totalRuns: data.totalRuns ?? 0,
                maxFinishedCount: data.maxFinishedCount ?? 0,
                maxTargetCount: data.maxTargetCount ?? 0,
                bestRank: data.bestRank ?? "-",
                bestLabel: data.bestLabel ?? "-",
                discovered: data.discovered ?? {},
                discoveredFirstAt: data.discoveredFirstAt ?? {},
                bestScore: data.bestScore ?? 0,
                totalScore: data.totalScore ?? 0,
                missionCompleted: data.missionCompleted ?? {},
                miracleLogs: Array.isArray(data.miracleLogs) ? data.miracleLogs.slice(0, 80) : [],
                fusions: data.fusions ?? {},
                secretUnlocked: data.secretUnlocked ?? {},
            };
        }
    }
    catch {
        // 保存データが壊れていてもゲームは止めない
    }
    return {
        totalRuns: 0,
        maxFinishedCount: 0,
        maxTargetCount: 0,
        bestRank: "-",
        bestLabel: "-",
        discovered: {},
        discoveredFirstAt: {},
        bestScore: 0,
        totalScore: 0,
        missionCompleted: {},
        miracleLogs: [],
        fusions: {},
        secretUnlocked: {},
    };
}

function saveRecords(): void {
    try {
        localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(savedRecords));
    } catch {
        // localStorage不可の環境では無視
    }
}

function getProbabilityScale(): number {
    if (settings.probabilityMode === "festival") return 5;
    if (settings.probabilityMode === "hard") return 0.35;
    if (settings.probabilityMode === "hell") return 0.08;
    return 1;
}

function getPassiveMiracleBoost(): number {
    if (!isStarted || isFinished) return 1;
    const elapsedSec = Math.max(0, (Date.now() - startTime) / 1000);
    return clamp(1 + Math.floor(elapsedSec / 20) * 0.06, 1, 6);
}

function getCurrentTimeScale(): number {
    if (speedLabelText === "超低速") return 0.28;
    if (speedLabelText === "低速") return 0.55;
    if (speedLabelText === "通常") return 1;
    if (speedLabelText === "高速") return 2;
    return 4;
}

function getSpeedDisplayLabel(): string {
    if (isEnglish) {
        if (speedLabelText === "超低速") return "Very slow";
        if (speedLabelText === "低速") return "Slow";
        if (speedLabelText === "通常") return "Normal";
        if (speedLabelText === "高速") return "Fast";
        return "Ultra";
    }
    return speedLabelText;
}

function getMiraclePauseDuration(def?: SpecialEventDef, repeatedInRun = false): number {
    const slowRate = settings.slowMiracleEffects ? 1.75 : 1;
    if (!def) return Math.round(1200 * slowRate);
    if (def.rank === "SR" || def.rank === "SSR") {
        // 同じSR/SSRが実行中に再発生した場合は、ゆっくり演出ONでも短縮を優先します。
        return repeatedInRun ? 240 : Math.round(520 * slowRate);
    }
    if (def.rank === "UR") return Math.round(1800 * slowRate);
    return Math.round(3000 * slowRate);
}

function getMiracleFeatureText(def: SpecialEventDef): string {
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

function escapeSvgText(text: string): string {
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

function createMiracleImageDataUri(def: SpecialEventDef): string {
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


function openMobileSettingsPopup(): void {
    if (!mobileSettingsOverlay) return;
    mobileSettingsOverlay.style.display = "flex";
    mobileSettingsOpenCount++;
    playUiSound("open");
    if (mobileSettingsOpenCount >= 3) {
        unlockSecret("settings-three-open", "設定室の常連", "スマホ設定画面を3回開きました。設定画面にも観測ログが残ります。");
        mobileSettingsOpenCount = 0;
    }
}

function closeMobileSettingsPopup(): void {
    if (!mobileSettingsOverlay) return;
    mobileSettingsOverlay.style.display = "none";
    playUiSound("close");
}

function setupMobileLayout(): void {
    info.style.flex = "0 0 auto";
    info.style.height = "108px";
    info.style.minHeight = "108px";
    info.style.padding = "10px 10px env(safe-area-inset-bottom, 10px)";
    info.style.overflow = "hidden";
    info.innerHTML = "";

    const dock = document.createElement("div");
    dock.style.display = "grid";
    dock.style.gridTemplateColumns = "1.15fr 1.15fr 1fr";
    dock.style.gap = "8px";
    dock.style.height = "100%";
    dock.style.alignItems = "center";
    info.appendChild(dock);

    mobileDockRunButton = createButton(t("実行", "Run"), () => startExperiment());
    mobileDockRunButton.style.width = "100%";
    mobileDockRunButton.style.height = "66px";
    mobileDockRunButton.style.fontSize = "24px";
    dock.appendChild(mobileDockRunButton);

    mobileDockPauseButton = createButton(t("一時停止", "Pause"), () => {});
    mobileDockPauseButton.onclick = null;
    mobileDockPauseButton.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        togglePause();
    }, { passive: false });
    mobileDockPauseButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
    mobileDockPauseButton.style.width = "100%";
    mobileDockPauseButton.style.height = "66px";
    mobileDockPauseButton.style.fontSize = "22px";
    dock.appendChild(mobileDockPauseButton);

    mobileDockSettingsButton = createButton(t("設定", "Settings"), () => openMobileSettingsPopup());
    mobileDockSettingsButton.style.width = "100%";
    mobileDockSettingsButton.style.height = "66px";
    mobileDockSettingsButton.style.fontSize = "24px";
    dock.appendChild(mobileDockSettingsButton);

    mobileSettingsOverlay = document.createElement("div");
    mobileSettingsOverlay.style.position = "fixed";
    mobileSettingsOverlay.style.inset = "0";
    mobileSettingsOverlay.style.display = "none";
    mobileSettingsOverlay.style.alignItems = "stretch";
    mobileSettingsOverlay.style.justifyContent = "center";
    mobileSettingsOverlay.style.background = "rgba(5,8,18,.18)";
    mobileSettingsOverlay.style.backdropFilter = "blur(1px)";
    mobileSettingsOverlay.style.zIndex = "140";
    mobileSettingsOverlay.style.padding = "0";
    document.body.appendChild(mobileSettingsOverlay);
    mobileSettingsOverlay.onclick = (event) => {
        if (event.target === mobileSettingsOverlay) closeMobileSettingsPopup();
    };

    mobileSettingsPanel = document.createElement("div");
    mobileSettingsPanel.style.width = "100%";
    mobileSettingsPanel.style.height = "100dvh";
    mobileSettingsPanel.style.maxHeight = "100dvh";
    mobileSettingsPanel.style.background = "linear-gradient(180deg,rgba(251,253,255,.62) 0%,rgba(239,244,255,.48) 100%)";
    mobileSettingsPanel.style.backdropFilter = "blur(8px) saturate(1.08)";
    mobileSettingsPanel.style.borderTopLeftRadius = "0";
    mobileSettingsPanel.style.borderTopRightRadius = "0";
    mobileSettingsPanel.style.boxShadow = "0 -12px 40px rgba(0,0,0,.28)";
    mobileSettingsPanel.style.padding = "0 12px 22px 12px";
    mobileSettingsPanel.style.overflowY = "auto";
    mobileSettingsPanel.style.overflowX = "hidden";
    mobileSettingsPanel.style.overscrollBehavior = "contain";
    mobileSettingsPanel.style.touchAction = "pan-y";
    mobileSettingsPanel.style.setProperty("-webkit-overflow-scrolling", "touch");
    mobileSettingsOverlay.appendChild(mobileSettingsPanel);

    const closeRow = document.createElement("div");
    closeRow.style.display = "flex";
    closeRow.style.justifyContent = "space-between";
    closeRow.style.alignItems = "center";
    closeRow.style.marginBottom = "10px";
    closeRow.style.position = "sticky";
    closeRow.style.top = "0";
    closeRow.style.zIndex = "5";
    closeRow.style.padding = "max(10px, env(safe-area-inset-top)) 0 10px 0";
    closeRow.style.background = "linear-gradient(180deg,rgba(251,253,255,.72),rgba(251,253,255,.54))";
    closeRow.style.backdropFilter = "blur(14px)";
    closeRow.style.borderBottom = "1px solid rgba(80,90,120,.18)";
    closeRow.innerHTML = `<div style="font-size:22px;font-weight:900;color:#243018;">${t("設定", "Settings")}</div>`;
    const closeButton = createButton("×", () => closeMobileSettingsPopup());
    closeButton.style.flex = "0 0 56px";
    closeButton.style.width = "56px";
    closeButton.style.height = "56px";
    closeButton.style.padding = "0";
    closeButton.style.fontSize = "30px";
    closeButton.style.position = "relative";
    closeButton.style.zIndex = "6";
    closeRow.appendChild(closeButton);
    mobileSettingsPanel.appendChild(closeRow);

    const inner = document.createElement("div");
    inner.style.display = "flex";
    inner.style.flexDirection = "column";
    inner.style.gap = "14px";
    mobileSettingsPanel.appendChild(inner);

    inner.appendChild(appHeader);
    inner.appendChild(recordHero);
    inner.appendChild(topRow);
    inner.appendChild(controlArea);
    inner.appendChild(buttonArea);
    inner.appendChild(randomGraphArea);

    gameArea.style.flex = "1 1 auto";
}

function updateUiLanguage(): void {
    appTitle.innerHTML = isEnglish
        ? `<div style="font-size:${isMobile ? 30 : 26}px;font-weight:900;color:#26351f;letter-spacing:.03em;">Miracle Ball Lab</div><div style="margin-top:3px;font-size:${isMobile ? 16 : 14}px;font-weight:700;color:#5d6d48;">A lab for observing probability and miracles with falling balls</div>`
        : `<div style="font-size:${isMobile ? 30 : 26}px;font-weight:900;color:#26351f;letter-spacing:.03em;">ミラクルボールラボ</div><div style="margin-top:3px;font-size:${isMobile ? 16 : 14}px;font-weight:700;color:#5d6d48;">ランダムに落ちる玉で、確率と奇跡を観測する実験場</div>`;
    appHeaderNote.textContent = isEnglish ? "Rare effects are luck. Ultra speed is easy to miss." : "レア演出は運。超高速だと見逃しやすいです。";
    for (const item of uiFieldRefs) item.labelEl.textContent = isEnglish ? item.en : item.ja;
    for (const item of bilingualButtons) {
        if (item.button === simpleModeButton) continue;
        if (item.button === cameraShakeButton) continue;
        if (item.button === slowMiracleButton) continue;
        if (item.button === soundButton) continue;
        if (item.button === confettiButton) continue;
        if (item.button === pixiButton) continue;
        item.button.textContent = isEnglish ? item.en : item.ja;
    }
    for (const item of sectionTitles) item.el.textContent = isEnglish ? item.en : item.ja;
    setSelectOptions();
    updateThemeSelectLabels();
    updateSimpleModeButton();
    updateCameraShakeButton();
    updateSlowMiracleButton();
    updateSoundButton();
    updateSkillButtons();
    confettiButton.textContent = confettiEnabled ? t("紙吹雪: ON", "Confetti: ON") : t("紙吹雪: OFF", "Confetti: OFF");
    pixiButton.textContent = pixiEnabled ? t("Pixi背景: ON", "Pixi BG: ON") : t("Pixi背景: OFF", "Pixi BG: OFF");
    gameFullscreenButton.title = t("全画面", "Fullscreen");
    pcPauseButton.textContent = isPaused ? t("再開", "Resume") : t("一時停止", "Pause");
    pcPauseButton.title = pcPauseButton.textContent;
    updateVerticalVideoButton();
    updateObsButton();
    updateTooltipText();
    if (mobileDockRunButton) mobileDockRunButton.textContent = t("実行", "Run");
    if (mobileDockPauseButton) mobileDockPauseButton.textContent = isPaused ? t("再開", "Resume") : t("一時停止", "Pause");
    if (mobileDockSettingsButton) mobileDockSettingsButton.textContent = t("設定", "Settings");
}

async function toggleGameFullscreen(): Promise<void> {
    try {
        if (document.fullscreenElement === gameArea) {
            await document.exitFullscreen();
        } else if (!document.fullscreenElement) {
            await gameArea.requestFullscreen();
        }
    } catch {}
}

document.addEventListener("fullscreenchange", () => {
    isFullscreenMode = document.fullscreenElement === gameArea;
    gameFullscreenButton.textContent = isFullscreenMode ? "🗗" : "⛶";
});

function getProbabilityModeLabel(): string {
    if (settings.probabilityMode === "festival") return "祭り";
    if (settings.probabilityMode === "hard") return "修羅";
    if (settings.probabilityMode === "hell") return "地獄";
    return "通常";
}

function formatProbability(denominator: number): string {
    return `1 / ${denominator.toLocaleString()}`;
}

function findSpecialDef(kind: DropKind): SpecialEventDef | undefined {
    return SPECIAL_EVENT_DEFS.find((x) => x.kind === kind);
}

function getWorldModeByKind(kind: DropKind): WorldMode {
    if (kind === "poseidonMode") return "poseidon";
    if (kind === "zeusuMode") return "zeusu";
    if (kind === "hadesuMode") return "hadesu";
    if (kind === "heartMode") return "heart";
    if (kind === "nekochanMode") return "nekochan";
    return null;
}

function getWorldModePalette(mode: WorldMode): { tint: string; accent: string; subtitle: string; emoji: string; bg: string } {
    if (mode === "poseidon") return { tint: "rgba(36,132,255,0.38)", accent: "#78c8ff", subtitle: "POSEIDON MODE", emoji: "🌊", bg: "radial-gradient(circle at 50% 18%, rgba(40,120,255,.40), rgba(2,18,42,.98))" };
    if (mode === "zeusu") return { tint: "rgba(255,220,0,0.34)", accent: "#ffe75a", subtitle: "ZEUSU MODE", emoji: "⚡", bg: "radial-gradient(circle at 50% 18%, rgba(255,226,92,.46), rgba(35,26,2,.98))" };
    if (mode === "hadesu") return { tint: "rgba(0,0,0,0.50)", accent: "#ff4a4a", subtitle: "HADESU MODE", emoji: "☠️", bg: "radial-gradient(circle at 50% 18%, rgba(24,24,24,.46), rgba(0,0,0,.995))" };
    if (mode === "heart") return { tint: "rgba(255,105,180,0.30)", accent: "#ff70ba", subtitle: "HEART MODE", emoji: "💗", bg: "radial-gradient(circle at 50% 18%, rgba(255,120,190,.42), rgba(38,10,24,.98))" };
    if (mode === "nekochan") return { tint: "rgba(255,186,120,0.28)", accent: "#ffbf76", subtitle: "NEKOCHAN MODE", emoji: "🐈", bg: "radial-gradient(circle at 50% 18%, rgba(255,190,120,.42), rgba(48,26,10,.98))" };
    return { tint: "rgba(0,0,0,0)", accent: "#ffffff", subtitle: "", emoji: "", bg: "" };
}

function applyWorldModeBodyStyles(): void {
    const palette = getWorldModePalette(activeWorldMode);
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        const renderObj: any = (body as any).render;
        if (!renderObj) continue;
        if (!activeWorldMode) {
            if (plugin?.isPin) renderObj.fillStyle = "rgba(89, 97, 115, 0.92)";
            else if (plugin?.isDivider) renderObj.fillStyle = "rgba(196, 101, 101, 0.94)";
            else if (!plugin?.isDrop) renderObj.fillStyle = "rgba(36, 41, 54, 0.92)";
            continue;
        }
        if (plugin?.isPin) renderObj.fillStyle = palette.accent;
        else if (plugin?.isDivider) renderObj.fillStyle = palette.accent;
        else if (!plugin?.isDrop) renderObj.fillStyle = palette.accent;
    }
}

function getRankScore(rank: string): number {
    const order = ["N", "R", "SR", "SSR", "UR", "EX", "GOD"];
    return order.indexOf(rank);
}

function getRankBaseScore(rank: string): number {
    if (rank === "GOD") return 250000;
    if (rank === "EX") return 120000;
    if (rank === "UR") return 60000;
    if (rank === "SSR") return 18000;
    if (rank === "SR") return 6000;
    if (rank === "R") return 1800;
    return 100;
}

function formatDateTime(ts: number | undefined): string {
    if (!ts) return "-";
    try {
        return new Date(ts).toLocaleString("ja-JP");
    } catch {
        return "-";
    }
}

function getDiscoveredCount(): number {
    return SPECIAL_EVENT_DEFS.filter((def) => (savedRecords.discovered[def.kind] ?? 0) + (specialCreated[def.kind] ?? 0) > 0).length;
}

function addScore(amount: number, reason: string, x = geometry.width / 2, y = Math.max(80 * geometry.scale, geometry.height * 0.18)): void {
    runScore += Math.max(0, Math.floor(amount));
    if (!settings.simpleMode && amount > 0) addFloatingText(`+${Math.floor(amount).toLocaleString()} ${reason}`, x, y, "#14532d");
}

function buildMissionDefs(): MissionDef[] {
    return [
        {
            id: "first_sr",
            title: "はじめての大当たり",
            description: "SR以上を1回観測する",
            rewardScore: 8000,
            oncePerRun: true,
            evaluate: () => SPECIAL_EVENT_DEFS.some((def) => getRankScore(def.rank) >= getRankScore("SR") && (specialCreated[def.kind] ?? 0) > 0),
        },
        {
            id: "combo3",
            title: "奇跡コンボ",
            description: "奇跡コンボを3まで伸ばす",
            rewardScore: 12000,
            oncePerRun: true,
            evaluate: () => bestComboThisRun >= 3,
        },
        {
            id: "center_focus",
            title: "中央研究成功",
            description: "中央の受け皿に25%以上集める",
            rewardScore: 10000,
            oncePerRun: true,
            evaluate: () => {
                if (finishedCount < 100) return false;
                const centerIndex = Math.floor(settings.binCount / 2);
                const centerCount = binCounts[centerIndex] ?? 0;
                return finishedCount > 0 && centerCount / finishedCount >= 0.25;
            },
        },
        {
            id: "discard_master",
            title: "捨て区間回避",
            description: "捨て区間率を5%以下に抑える（300球以上）",
            rewardScore: 15000,
            oncePerRun: true,
            evaluate: () => finishedCount >= 300 && finishedCount > 0 && discardedCount / finishedCount <= 0.05,
        },
        {
            id: "big_run",
            title: "長時間実験",
            description: "5,000球以上処理する",
            rewardScore: 18000,
            oncePerRun: true,
            evaluate: () => finishedCount >= 5000,
        },
    ];
}

function checkMissionProgress(): void {
    for (const mission of missionDefs) {
        if (missionProgress[mission.id]) continue;
        if (!mission.evaluate()) continue;
        missionProgress[mission.id] = true;
        savedRecords.missionCompleted[mission.id] = (savedRecords.missionCompleted[mission.id] ?? 0) + 1;
        addScore(mission.rewardScore, `MISSION ${mission.title}`);
        showMilestone(`MISSION CLEAR: ${mission.title}`);
        saveRecords();
    }
}

function updateSkillButtons(): void {
    const mapping: Record<SkillKind, string> = {
        shockwave: `衝撃波 ×${skillState.shockwave}`,
        magnet: `磁石 ×${skillState.magnet}`,
        timeStop: `時止め ×${skillState.timeStop}`,
    };
    const enMapping: Record<SkillKind, string> = {
        shockwave: `Shockwave ×${skillState.shockwave}`,
        magnet: `Magnet ×${skillState.magnet}`,
        timeStop: `Time stop ×${skillState.timeStop}`,
    };
    for (const key of Object.keys(skillButtons) as SkillKind[]) {
        const button = skillButtons[key];
        if (!button) continue;
        button.textContent = isEnglish ? enMapping[key] : mapping[key];
        button.style.opacity = (skillState[key] ?? 0) > 0 ? "1" : ".45";
    }
}

function applyMagnetSkill(): void {
    magnetUntil = Date.now() + MAGNET_DURATION_MS;
    addFloatingText("磁力場 発生", geometry.width / 2, 90 * geometry.scale, "#0f766e");
    triggerCameraShake(6 * geometry.scale, 180);
}

function applyShockwaveSkill(): void {
    const originX = geometry.width / 2;
    const originY = geometry.height * 0.28;
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isDrop) continue;
        const dx = body.position.x - originX;
        const dy = body.position.y - originY;
        const len = Math.max(16, Math.hypot(dx, dy));
        Body.setVelocity(body, { x: body.velocity.x + (dx / len) * 8 * geometry.scale, y: body.velocity.y + (dy / len) * 6 * geometry.scale - 2 * geometry.scale });
    }
    addFloatingText("衝撃波", originX, originY, "#2563eb");
    triggerCameraShake(10 * geometry.scale, 260);
}

function applyTimeStopSkill(): void {
    if (!isStarted || isFinished || isPaused || isMiraclePaused) return;
    isPaused = true;
    Runner.stop(runner);
    updateStopButton();
    updateInfo();
    addFloatingText("時間停止", geometry.width / 2, geometry.height * 0.22, "#7c3aed");
    window.setTimeout(() => {
        if (isFinished || isMiraclePaused) return;
        isPaused = false;
        Runner.run(runner, engine);
        updateStopButton();
        updateInfo();
    }, TIME_STOP_DURATION_MS);
}

function useSkill(kind: SkillKind): void {
    if (!isStarted || isFinished || isMiraclePaused) return;
    if ((skillState[kind] ?? 0) <= 0) return;
    skillState[kind]--;
    lastSkillUsedAt = Date.now();
    registerSkillSecretCombo(kind);
    playUiSound(kind === "timeStop" ? "time" : "skill");
    if (kind === "shockwave") applyShockwaveSkill();
    else if (kind === "magnet") applyMagnetSkill();
    else applyTimeStopSkill();
    addScore(2500, `SKILL ${kind.toUpperCase()}`, geometry.width / 2, geometry.height * 0.16);
    updateSkillButtons();
    updateInfo();
}

async function shareToSns(): Promise<void> {
    const discovered = getDiscoveredCount();
    const clipCount = miracleClips.length;
    const shareText = `ミラクルボールラボ
スコア: ${runScore.toLocaleString()}
処理数: ${finishedCount.toLocaleString()} / ${settings.targetCount.toLocaleString()}
最高レア: ${savedRecords.bestRank} ${savedRecords.bestLabel}
発見済み: ${discovered}/${SPECIAL_EVENT_DEFS.length}
奇跡クリップ: ${clipCount}件
#MiracleBallLabo #ミラクルボールラボ`;
    try {
        await navigator.clipboard.writeText(shareText);
        showMilestone("SNS投稿文をコピーしました");
    } catch {
        showPopup("SNSシェア", `<pre style="white-space:pre-wrap;font-family:inherit;">${shareText}</pre>`);
        return;
    }
    if (navigator.share) {
        try {
            await navigator.share({ text: shareText, title: "MiracleBallLabo" });
        } catch {
            // 共有ダイアログのキャンセルは無視
        }
    }
}

function saveShareCard(): void {
    const width = 1080;
    const height = 1920;
    const shareCanvas = document.createElement("canvas");
    shareCanvas.width = width;
    shareCanvas.height = height;
    const ctx = shareCanvas.getContext("2d");
    if (!ctx) return;

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#1e293b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fillRect(60, 120, width - 120, 720);
    ctx.fillRect(60, 880, width - 120, 820);

    ctx.fillStyle = "#f8fafc";
    ctx.font = '900 64px "Segoe UI", "Noto Sans JP", sans-serif';
    ctx.fillText("MiracleBallLabo", 100, 210);
    ctx.font = '700 34px "Segoe UI", "Noto Sans JP", sans-serif';
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("ミラクルボールラボ 実験シェアカード", 100, 270);

    const previewW = width - 200;
    const previewH = 480;
    try {
        ctx.drawImage(canvas, 100, 320, previewW, previewH);
    } catch {
        ctx.fillStyle = "#0b1220";
        ctx.fillRect(100, 320, previewW, previewH);
    }

    const lines = [
        `スコア ${runScore.toLocaleString()}`,
        `処理 ${finishedCount.toLocaleString()} / ${settings.targetCount.toLocaleString()}`,
        `最高レア ${savedRecords.bestRank} ${savedRecords.bestLabel}`,
        `発見済み ${getDiscoveredCount()} / ${SPECIAL_EVENT_DEFS.length}`,
        `研究Lv ${getResearchLevelInfo().level} / 合成 ${getFusionCount()} / ${FUSION_DEFS.length}`,
        `今日の奇跡率 x${(currentDailyFortune ?? getDailyFortune()).rateBoost.toFixed(2)}`,
        `奇跡コンボ最高 ${bestComboThisRun}`,
        `ミッション達成 ${Object.values(missionProgress).filter(Boolean).length} / ${missionDefs.length}`,
    ];
    ctx.fillStyle = "#f8fafc";
    ctx.font = '900 48px "Segoe UI", "Noto Sans JP", sans-serif';
    ctx.fillText("RESULT", 100, 960);
    ctx.font = '700 42px "Segoe UI", "Noto Sans JP", sans-serif';
    lines.forEach((line, idx) => ctx.fillText(line, 100, 1050 + idx * 90));
    ctx.fillStyle = "#93c5fd";
    ctx.font = '700 30px "Segoe UI", "Noto Sans JP", sans-serif';
    ctx.fillText("#MiracleBallLabo #ミラクルボールラボ", 100, 1760);

    shareCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `miracle-ball-share-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showMilestone("SNSカードを保存しました");
    }, "image/png");
}

function showMissionPopup(): void {
    const rows = missionDefs.map((mission) => {
        const cleared = !!missionProgress[mission.id];
        const totalClear = savedRecords.missionCompleted[mission.id] ?? 0;
        return `<div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
                <div style="font-weight:900;font-size:${isMobile ? 22 : 18}px;color:${cleared ? "#166534" : "#1f2937"};">${cleared ? "✅" : "⬜"} ${mission.title}</div>
                <div style="font-weight:800;color:#475569;">+${mission.rewardScore.toLocaleString()} score</div>
            </div>
            <div style="margin-top:6px;opacity:.82;line-height:1.55;">${mission.description}</div>
            <div style="margin-top:6px;font-size:${isMobile ? 16 : 14}px;opacity:.72;">通算達成 ${totalClear}回</div>
        </div>`;
    }).join("");
    showPopup("ミッション", `<div style="margin-top:8px;border-radius:18px;background:rgba(255,255,255,.72);padding:${isMobile ? "8px 14px" : "8px 16px"};">${rows}</div>`);
}


function saveCurrentScreenshot(): void {
    const shotCanvas = document.createElement("canvas");
    shotCanvas.width = Math.max(1, canvas.width);
    shotCanvas.height = Math.max(1, canvas.height);
    const ctx = shotCanvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0b0d14";
    ctx.fillRect(0, 0, shotCanvas.width, shotCanvas.height);
    try {
        ctx.drawImage(canvas, 0, 0);
    } catch {
        showPopup("スクリーンショット", "<p>現在の画面保存に失敗しました。</p>");
        return;
    }
    shotCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `miracle-ball-screenshot-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        showMilestone("スクリーンショットを保存しました");
    }, "image/png");
}

function showSharePopup(): void {
    showPopup("録画・SNS", `
        <p>奇跡クリップのGIF保存は「リプレイ」から行えます。ここでは投稿文コピー、現在画面のスクリーンショット保存、縦長シェアカード保存を行えます。</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:18px;">
            <button id="sns-copy-button" style="font-size:18px;padding:12px 18px;border-radius:999px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:900;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);">投稿文コピー</button>
            <button id="screenshot-save-button" style="font-size:18px;padding:12px 18px;border-radius:999px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:900;background:linear-gradient(180deg,#fff7ed 0%,#fed7aa 100%);">現在画面を保存</button>
            <button id="sns-card-button" style="font-size:18px;padding:12px 18px;border-radius:999px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:900;background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);">SNSカード保存</button>
        </div>
    `);
    const copyBtn = document.getElementById("sns-copy-button") as HTMLButtonElement | null;
    const shotBtn = document.getElementById("screenshot-save-button") as HTMLButtonElement | null;
    const cardBtn = document.getElementById("sns-card-button") as HTMLButtonElement | null;
    if (copyBtn) copyBtn.onclick = () => { void shareToSns(); };
    if (shotBtn) shotBtn.onclick = () => saveCurrentScreenshot();
    if (cardBtn) cardBtn.onclick = () => saveShareCard();
}

function recordSpecialDiscovery(def: SpecialEventDef): void {
    savedRecords.discovered[def.kind] = (savedRecords.discovered[def.kind] ?? 0) + 1;
    if (!savedRecords.discoveredFirstAt[def.kind]) savedRecords.discoveredFirstAt[def.kind] = Date.now();
    if (getRankScore(def.rank) > getRankScore(savedRecords.bestRank)) {
        savedRecords.bestRank = def.rank;
        savedRecords.bestLabel = def.label;
    }
    addScore(getRankBaseScore(def.rank), `RARE ${def.label}`);
    tryUnlockFusions();
    saveRecords();
}

function incrementSpecialCreated(kind: DropKind): void {
    specialCreated[kind] = (specialCreated[kind] ?? 0) + 1;
    if (kind === "cosmicEgg") cosmicEggCreated++;
    else if (kind === "blackSun") blackSunCreated++;
    else if (kind === "heart") heartCreated++;
    else if (kind === "shootingStar") starCreated++;
    else if (kind === "crown") crownCreated++;
    else if (kind === "silverUfo") silverUfoCreated++;
    else if (kind === "blueFlame") blueFlameCreated++;
    else if (kind === "luckySeven") luckySevenCreated++;
    else if (kind === "timeRift") timeRiftCreated++;
    else if (kind === "labExplosion") labExplosionCreated++;
}

function rollSpecialEvent(): SpecialEventDef | null {
    const fortune = currentDailyFortune ?? getDailyFortune();
    currentDailyFortune = fortune;
    const scale = getProbabilityScale() * getPassiveMiracleBoost() * fortune.rateBoost;
    let threshold = 0;
    const roll = appRandom();
    for (const def of SPECIAL_EVENT_DEFS) {
        threshold += def.rate * scale;
        if (roll < threshold) return def;
    }
    return null;
}

function randomPick(items: string[]): string {
    return items[Math.floor(appRandom() * items.length)] ?? items[0] ?? "";
}

function buildWeirdMiracleText(def: SpecialEventDef): string {
    const weird = [
        `${def.label}が出ました。研究員が一瞬だけ敬語になりました。`,
        `${def.label}を観測。確率が廊下で正座しています。`,
        `これは${def.label}です。ブラウザの中で小さい祭りが始まりました。`,
        `${def.label}発生。普通の玉たちが見なかったことにしています。`,
        `${def.label}です。たぶん今日の運を少し前借りしました。`,
        `${def.label}を確認。捨て区間まで静かに拍手しています。`,
        `${def.label}が来ました。乱数が変な汗をかいています。`,
        `${def.label}。現実が3フレームだけ読み込み直されました。`,
        `${def.label}です。主任が「サンプル数を増やせ」と言っています。`,
        `${def.label}観測。これはもう玉ではなく事件です。`,
    ];
    const danger = getProbabilityDangerText(def.denominator);
    return `${randomPick(weird)}<br>${danger}`;
}

function getProbabilityDangerText(denominator: number): string {
    if (denominator >= 1_000_000_000) return "確率のヤバさ：日常ではなく伝説。出たら画面を二度見してください。";
    if (denominator >= 10_000_000) return "確率のヤバさ：運営に確認したくなる級。ほぼ都市伝説です。";
    if (denominator >= 1_000_000) return "確率のヤバさ：もう事件。普通に動画のオチになります。";
    if (denominator >= 100_000) return "確率のヤバさ：長時間回してやっと会えるかも、くらいです。";
    if (denominator >= 10_000) return "確率のヤバさ：普通にレア。出たらちょっと勝ちです。";
    return "確率のヤバさ：まあまあ珍しい。小さめの奇跡です。";
}



function getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hashTextToNumber(text: string): number {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function getDailyFortune(): DailyFortune {
    const dateKey = getTodayKey();
    const seed = hashTextToNumber(`${dateKey}:miracle-ball-lab`);
    const titles = ["大吉", "中吉", "小吉", "研究日和", "乱数注意", "捨て区間警報", "奇跡濃度高め"];
    const advices = [
        "通常速度で眺めると、演出を見逃しにくい日です。",
        "投下数を少し増やすと、研究ログが育ちやすい日です。",
        "捨て区間に入りやすい気配があります。ピンを軽く揺らすとよさそうです。",
        "録画・SNSカード向けの見栄えが出やすい日です。",
        "同じSR/SSRが続くと演出が短縮されるので、長時間放置に向いています。",
    ];
    const luckyDefs = SPECIAL_EVENT_DEFS.length > 0 ? SPECIAL_EVENT_DEFS : BASE_SPECIAL_EVENT_DEFS;
    const lucky = luckyDefs[seed % luckyDefs.length];
    const rateBoost = 1 + ((seed >>> 5) % 17) / 100;
    return {
        dateKey,
        title: titles[seed % titles.length] ?? "研究日和",
        rateBoost,
        luckyKind: lucky?.label ?? "王",
        luckyBin: (seed % Math.max(1, settings.binCount)) + 1,
        advice: advices[(seed >>> 9) % advices.length] ?? advices[0],
        seed,
    };
}

function getResearchExp(): number {
    const discoveredBonus = getDiscoveredCount() * 4200;
    const fusionBonus = getFusionCount() * 12000;
    const logBonus = miracleLogs.length * 260;
    return Math.max(0, savedRecords.totalScore + runScore + discoveredBonus + fusionBonus + logBonus + savedRecords.totalRuns * 120);
}

function getResearchLevelInfo(): { level: number; title: string; exp: number; current: number; next: number; percent: number } {
    const exp = getResearchExp();
    const level = Math.max(1, Math.floor(Math.sqrt(exp / 900)) + 1);
    const currentLevelExp = Math.pow(level - 1, 2) * 900;
    const nextLevelExp = Math.pow(level, 2) * 900;
    const titles = ["見習い研究員", "確率観測員", "奇跡解析官", "主任研究員", "世界改変監査官", "乱数司祭", "奇跡所長"];
    const title = titles[Math.min(titles.length - 1, Math.floor((level - 1) / 8))] ?? titles[0];
    const current = Math.max(0, exp - currentLevelExp);
    const next = Math.max(1, nextLevelExp - currentLevelExp);
    return { level, title, exp, current, next, percent: clamp((current / next) * 100, 0, 100) };
}

function getFusionCount(): number {
    return Object.keys(savedRecords.fusions ?? {}).length;
}

function getFusionUnlocked(def: FusionDef): boolean {
    return !!savedRecords.fusions?.[def.id];
}

function getFusionReady(def: FusionDef): boolean {
    return def.sourceKinds.every((kind) => (savedRecords.discovered[kind] ?? 0) >= def.requiredCount);
}

function tryUnlockFusions(): void {
    let changed = false;
    for (const fusion of FUSION_DEFS) {
        if (getFusionUnlocked(fusion) || !getFusionReady(fusion)) continue;
        savedRecords.fusions[fusion.id] = Date.now();
        addScore(fusion.rewardScore, `FUSION ${fusion.label}`);
        miracleLogs.unshift({
            label: fusion.label,
            rank: fusion.rank,
            denominator: 0,
            finishedAt: Date.now(),
            finishedCount,
            mode: settings.probabilityMode,
            speedLabel: speedLabelText,
            combo: miracleCombo,
            note: "合成・派生で解放",
        });
        miracleLogs = miracleLogs.slice(0, 80);
        savedRecords.miracleLogs = miracleLogs;
        showMilestone(`合成奇跡 解放: ${fusion.label}`);
        changed = true;
    }
    if (changed) saveRecords();
}

function showDailyFortunePopup(): void {
    const fortune = currentDailyFortune ?? getDailyFortune();
    currentDailyFortune = fortune;
    showPopup("今日の運勢・奇跡率", `
        <div style="display:grid;gap:12px;">
            <div style="font-size:${isMobile ? "30px" : "26px"};font-weight:1000;">${fortune.title}</div>
            <div><b>今日の奇跡率:</b> x${fortune.rateBoost.toFixed(2)}</div>
            <div><b>今日の注目奇跡:</b> ${fortune.luckyKind}</div>
            <div><b>ラッキー受け皿:</b> ${fortune.luckyBin}</div>
            <div style="line-height:1.7;">${fortune.advice}</div>
            <div style="opacity:.7;font-size:${isMobile ? "15px" : "13px"};">日付ごとに固定されます。奇跡率はレア抽選にほんの少しだけ加算されます。</div>
        </div>
    `);
}

function showFusionPopup(): void {
    const rows = FUSION_DEFS.map((fusion) => {
        const unlocked = getFusionUnlocked(fusion);
        const ready = getFusionReady(fusion);
        const sources = fusion.sourceKinds.map((kind) => {
            const def = findSpecialDef(kind);
            const count = savedRecords.discovered[kind] ?? 0;
            return `${def?.label ?? kind} ${count}/${fusion.requiredCount}`;
        }).join(" / ");
        return `<div style="padding:13px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">
                <div style="font-weight:1000;font-size:${isMobile ? "22px" : "18px"};color:${unlocked ? "#166534" : ready ? "#854d0e" : "#334155"};">${unlocked ? "✅" : ready ? "🧪" : "🔒"} ${unlocked || ready ? fusion.label : "未解放の派生奇跡"} [${fusion.rank}]</div>
                <div style="font-weight:900;color:#475569;">+${fusion.rewardScore.toLocaleString()} score</div>
            </div>
            <div style="margin-top:6px;opacity:.80;line-height:1.55;">${unlocked ? fusion.description : "素材奇跡を集めると解放されます。"}</div>
            <div style="margin-top:6px;opacity:.72;">素材: ${sources}</div>
        </div>`;
    }).join("");
    const chainRows = MIRACLE_CHAIN_DEFS.map((chain) => {
        const names = chain.sequence.map((kind) => findSpecialDef(kind)?.label ?? kind).join(" → ");
        const unlocked = !!unlockedChainRunIds[chain.id];
        return `<div style="padding:10px 0;border-bottom:1px dashed rgba(80,90,120,.18);"><b>${unlocked ? "✅" : "🔁"} ${chain.label} [${chain.rank}]</b><div style="margin-top:4px;opacity:.74;">順番: ${names}</div><div style="margin-top:4px;opacity:.74;">${chain.description}</div></div>`;
    }).join("");
    showPopup("奇跡合成・派生", `<p>特定の奇跡を観測すると、合成・派生の研究記録が解放されます。</p>${rows}<h3 style="margin-top:18px;">実験中の奇跡連鎖</h3><p>下記の順番で奇跡が続くと、その実験中だけの連鎖演出が発生します。</p>${chainRows}`);
}

function getSecretDefs(): SecretDef[] {
    return [
        { id: "keyword-miracle", label: "MIRACLE コード", hint: "PCで研究所の合言葉を英字入力", detail: "キーボードで隠しコードを入力しました。今日の研究所は少しだけ騒がしくなります。", rewardScore: 7777 },
        { id: "keyword-lab", label: "LAB コード", hint: "研究所の短縮名を英字入力", detail: "短い研究所コードを入力しました。", rewardScore: 5000 },
        { id: "keyword-neko", label: "NEKO コード", hint: "猫っぽい英字を入力", detail: "ねこちゃんモードの気配を呼びました。", rewardScore: 5000 },
        { id: "keyword-sun", label: "SUN コード", hint: "太陽に関係する英字を入力", detail: "黒い太陽を探す研究者用の短縮コードです。", rewardScore: 5000 },
        { id: "favicon-five-taps", label: "favicon 5連打", hint: "起動画面のロゴを連打", detail: "起動ロゴを5回タップしました。ロード画面にも秘密がありました。", rewardScore: 7777 },
        { id: "pause-seven-taps", label: "時間停止ごっこ", hint: "一時停止を短時間に何度も操作", detail: "一時停止操作を短時間に7回行いました。時間を止めようとする研究記録です。", rewardScore: 9000 },
        { id: "settings-three-open", label: "設定室の常連", hint: "スマホの設定画面を何度か開く", detail: "スマホ設定画面を3回開きました。設定画面にも観測ログが残ります。", rewardScore: 6000 },
        { id: "skill-combo-lab", label: "三種の介入", hint: "実験中に衝撃波→磁石→時止めの順で使う", detail: "盤面介入スキルを決まった順番で使いました。研究員が完全に介入しています。", rewardScore: 12000 },
    ];
}

function unlockSecret(id: string, label: string, detail: string, rewardScore?: number): void {
    if (savedRecords.secretUnlocked[id]) {
        showMilestone(label + " 起動");
        return;
    }
    const def = getSecretDefs().find((x) => x.id === id);
    const score = rewardScore ?? def?.rewardScore ?? 7777;
    savedRecords.secretUnlocked[id] = Date.now();
    addScore(score, "SECRET " + label);
    saveRecords();
    playSecretSound();
    showPopup("秘密操作を発見", "<p><b>" + label + "</b> を解放しました。</p><p>" + detail + "</p><p>報酬: +" + score.toLocaleString() + " score</p><p>研究レベルに少しだけボーナスが入ります。</p>");
}

function showSecretPopup(): void {
    const defs = getSecretDefs();
    const unlockedCount = defs.filter((x) => savedRecords.secretUnlocked[x.id]).length;
    const rows = defs.map((def) => {
        const ts = savedRecords.secretUnlocked[def.id];
        const unlocked = !!ts;
        const title = unlocked ? def.label : "未発見の秘密操作";
        const mark = unlocked ? "✅" : "🔒";
        const titleColor = unlocked ? "#166534" : "#334155";
        const scoreColor = unlocked ? "#166534" : "#64748b";
        const size = isMobile ? "20px" : "17px";
        return "<div style=\"padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);\">" +
            "<div style=\"display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;\">" +
            "<b style=\"font-size:" + size + ";color:" + titleColor + ";\">" + mark + " " + title + "</b>" +
            "<span style=\"font-weight:900;color:" + scoreColor + ";\">+" + def.rewardScore.toLocaleString() + "</span>" +
            "</div>" +
            "<div style=\"margin-top:6px;opacity:.78;line-height:1.55;\">ヒント: " + def.hint + "</div>" +
            "<div style=\"margin-top:4px;opacity:.68;\">" + (unlocked ? new Date(ts).toLocaleString() : "未解放") + "</div>" +
        "</div>";
    }).join("");
    showPopup("秘密操作",
        "<p>秘密操作をゲーム内実績のように整理しました。見つけるとスコアと研究レベルに少しだけ反映されます。</p>" +
        "<p><b>解放状況:</b> " + unlockedCount + " / " + defs.length + "</p>" +
        "<div style=\"border-radius:18px;background:rgba(255,255,255,.70);padding:4px 14px;\">" + rows + "</div>"
    );
}

function handleSecretKey(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (!/^[a-z]$/.test(key)) return;
    secretKeyBuffer = (secretKeyBuffer + key).slice(-SECRET_KEY_MAX_LENGTH);
    for (const [code, info] of Object.entries(SECRET_KEY_SEQUENCES)) {
        if (secretKeyBuffer.endsWith(code)) {
            const id = "keyword-" + code;
            unlockSecret(id, info.label, info.detail);
            secretKeyBuffer = "";
            return;
        }
    }
}

function registerPauseSecretTap(): void {
    const now = Date.now();
    pauseTapHistory = [...pauseTapHistory.filter((x) => now - x < 5000), now];
    if (pauseTapHistory.length >= 7) {
        unlockSecret("pause-seven-taps", "時間停止ごっこ", "一時停止操作を短時間に7回行いました。時間を止めようとする研究記録です。");
        pauseTapHistory = [];
    }
}

function registerSkillSecretCombo(kind: SkillKind): void {
    skillComboBuffer = [...skillComboBuffer, kind].slice(-3);
    if (skillComboBuffer.join(">") === "shockwave>magnet>timeStop") {
        unlockSecret("skill-combo-lab", "三種の介入", "盤面介入スキルを決まった順番で使いました。研究員が完全に介入しています。");
        skillComboBuffer = [];
    }
}
function getThemeOptions(): Array<{ value: ThemeMode; ja: string; en: string }> {
    return [
        { value: "lab", ja: "研究所", en: "Lab" },
        { value: "space", ja: "宇宙", en: "Space" },
        { value: "sunset", ja: "夕焼け", en: "Sunset" },
        { value: "retro", ja: "レトロ", en: "Retro" },
        { value: "midnight", ja: "深夜", en: "Midnight" },
    ];
}

function updateThemeSelectLabels(): void {
    themeSelect.innerHTML = getThemeOptions().map((x) => `<option value="${x.value}">${isEnglish ? x.en : x.ja}</option>`).join("");
    themeSelect.value = currentTheme;
}

function applyTheme(): void {
    const themeMap: Record<ThemeMode, { body: string; panel: string; game: string }> = {
        lab: { body: "linear-gradient(180deg,#11131a 0%,#1b202b 100%)", panel: "linear-gradient(180deg, rgba(246,250,236,.96) 0%, rgba(227,240,204,.88) 100%)", game: "radial-gradient(circle at 50% 30%, rgba(30,36,52,.92), rgba(9,11,18,.98))" },
        space: { body: "linear-gradient(180deg,#050814 0%,#0b1230 100%)", panel: "linear-gradient(180deg, rgba(232,241,255,.92) 0%, rgba(210,223,255,.84) 100%)", game: "radial-gradient(circle at 50% 20%, rgba(30,40,90,.92), rgba(3,6,18,.98))" },
        sunset: { body: "linear-gradient(180deg,#2b1020 0%,#6d2d3d 46%,#f07f43 100%)", panel: "linear-gradient(180deg, rgba(255,245,232,.94) 0%, rgba(255,220,198,.88) 100%)", game: "radial-gradient(circle at 50% 18%, rgba(255,154,96,.50), rgba(45,11,28,.96))" },
        retro: { body: "linear-gradient(180deg,#14313a 0%,#08161c 100%)", panel: "linear-gradient(180deg, rgba(234,255,241,.94) 0%, rgba(202,241,219,.88) 100%)", game: "radial-gradient(circle at 50% 18%, rgba(74,220,198,.24), rgba(9,18,18,.98))" },
        midnight: { body: "linear-gradient(180deg,#060606 0%,#13131f 100%)", panel: "linear-gradient(180deg, rgba(245,244,255,.94) 0%, rgba(220,219,245,.88) 100%)", game: "radial-gradient(circle at 50% 18%, rgba(98,79,255,.22), rgba(3,3,8,.98))" },
    };
    const theme = themeMap[currentTheme];
    document.body.style.background = theme.body;
    info.style.background = theme.panel;
    if (!activeRareBackgroundKind) gameArea.style.background = theme.game;
}

function getSilhouetteHint(def: SpecialEventDef): string {
    const hints: Record<string, string> = {
        crown: "頭上に乗るもの",
        shootingStar: "空を横切るもの",
        heart: "やわらかい奇跡",
        blackSun: "黒くて終末っぽい",
        timeRift: "空間が裂ける",
        silverUfo: "空から来る円盤",
        blueFlame: "冷たい色の火",
        luckySeven: "縁起のいい数字",
        labExplosion: "研究所が危ない",
        cosmicEgg: "宇宙っぽい殻",
    };
    return hints[def.kind] ?? "まだ形がはっきりしない";
}

function addMiracleLog(def: SpecialEventDef): void {
    const repeatCount = repeatedMiracleRunCounts[def.kind] ?? 0;
    miracleLogs.unshift({
        label: def.label,
        rank: def.rank,
        denominator: def.denominator,
        finishedAt: Date.now(),
        finishedCount,
        mode: settings.probabilityMode,
        speedLabel: speedLabelText,
        combo: miracleCombo,
        note: repeatCount >= 2 && (def.rank === "SR" || def.rank === "SSR") ? "同一SR/SSRのため短縮演出" : undefined,
    });
    miracleLogs = miracleLogs.slice(0, 80);
    savedRecords.miracleLogs = miracleLogs;
    saveRecords();
}

function recordMiracleForChains(kind: DropKind): void {
    const now = Date.now();
    recentMiracleKinds = [...recentMiracleKinds.filter((x) => now - x.at <= MIRACLE_CHAIN_WINDOW_MS), { kind, at: now }].slice(-8);
}

function tryTriggerMiracleChains(): void {
    const kinds = recentMiracleKinds.map((x) => x.kind);
    for (const chain of MIRACLE_CHAIN_DEFS) {
        if (unlockedChainRunIds[chain.id]) continue;
        if (chain.sequence.length > kinds.length) continue;
        const tail = kinds.slice(-chain.sequence.length);
        const matched = chain.sequence.every((kind, index) => tail[index] === kind);
        if (!matched) continue;
        unlockedChainRunIds[chain.id] = Date.now();
        addScore(chain.rewardScore, `CHAIN ${chain.label}`);
        miracleLogs.unshift({
            label: chain.label,
            rank: chain.rank,
            denominator: 0,
            finishedAt: Date.now(),
            finishedCount,
            mode: settings.probabilityMode,
            speedLabel: speedLabelText,
            combo: miracleCombo,
            note: "奇跡同士の連鎖で発生",
        });
        miracleLogs = miracleLogs.slice(0, 80);
        savedRecords.miracleLogs = miracleLogs;
        saveRecords();
        triggerChainEndingEffect(chain);
        break;
    }
}

function triggerChainEndingEffect(chain: MiracleChainDef): void {
    if (settings.simpleMode) {
        setSubtitle(`${chain.label} 発生`);
        return;
    }
    fireConfetti(chain.rank.includes("GOD") ? "cosmic" : chain.rank.includes("EX") ? "black" : "miracle");
    triggerCameraShake(chain.rank.includes("GOD") ? 44 * geometry.scale : chain.rank.includes("EX") ? 34 * geometry.scale : 22 * geometry.scale, chain.rank.includes("GOD") ? 1300 : 760);
    maybeShowCommentary(`実況「連鎖奇跡 ${chain.label} を観測しました」`, true);
    setSubtitle(`${chain.label}: ${chain.description}`);
    celebrationOverlay.innerHTML = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 35%, rgba(255,245,180,.32), rgba(20,16,42,.82) 58%, rgba(0,0,0,.94));backdrop-filter:blur(3px);"></div>
        <div style="position:relative;z-index:2;width:min(92vw,900px);padding:${isMobile ? "24px 18px" : "34px 42px"};border-radius:34px;background:rgba(15,23,42,.72);box-shadow:0 30px 90px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.18);color:#fff;animation:chain-ending-pop 3.2s ease-out forwards;">
            <style>@keyframes chain-ending-pop{0%{transform:scale(.86);opacity:0}12%{transform:scale(1.03);opacity:1}82%{transform:scale(1);opacity:1}100%{transform:scale(.98);opacity:0}}</style>
            <div style="font-size:clamp(22px,5vw,44px);font-weight:1000;color:#fde68a;letter-spacing:.08em;">MIRACLE CHAIN</div>
            <div style="margin-top:8px;font-size:clamp(36px,9vw,86px);font-weight:1000;text-shadow:0 8px 30px rgba(0,0,0,.65);">${chain.label}</div>
            <div style="margin-top:12px;font-size:clamp(17px,3vw,28px);line-height:1.65;opacity:.94;">${chain.description}</div>
            <div style="margin-top:16px;font-size:clamp(18px,3vw,30px);font-weight:1000;color:#bbf7d0;">+${chain.rewardScore.toLocaleString()} score</div>
        </div>`;
    celebrationOverlay.style.display = "flex";
    window.setTimeout(() => {
        celebrationOverlay.style.display = "none";
        celebrationOverlay.innerHTML = "";
    }, 3300);
}

function setSubtitle(text: string): void {
    currentSubtitleText = text;
    subtitleOverlay.textContent = text;
    subtitleOverlay.style.display = "block";
    if (subtitleTimer !== undefined) window.clearTimeout(subtitleTimer);
    subtitleTimer = window.setTimeout(() => {
        subtitleOverlay.style.display = "none";
    }, 4200);
}

function updateMiracleCombo(): void {
    const now = Date.now();
    miracleCombo = now - lastMiracleAt <= 12000 ? miracleCombo + 1 : 1;
    lastMiracleAt = now;
    if (miracleCombo >= 2) {
        comboOverlay.textContent = `${t("奇跡コンボ", "Miracle combo")} x${miracleCombo}`;
        comboOverlay.style.display = "block";
        if (comboTimer !== undefined) window.clearTimeout(comboTimer);
        comboTimer = window.setTimeout(() => { comboOverlay.style.display = "none"; }, 4200);
    } else {
        comboOverlay.style.display = "none";
    }
}

function saveMiracleClip(def: SpecialEventDef, subtitle: string): void {
    const frames = replayFrameBuffer.slice(-18);
    miracleClips.unshift({
        id: `${Date.now()}-${Math.floor(appRandom() * 100000)}`,
        label: def.label,
        rank: def.rank,
        denominator: def.denominator,
        finishedCount,
        createdAt: Date.now(),
        subtitle,
        frames,
    });
    miracleClips = miracleClips.slice(0, 24);
}

function replayClipById(id: string): void {
    const clip = miracleClips.find((x) => x.id === id);
    if (!clip || clip.frames.length === 0) {
        showPopup(t("リプレイ", "Replay"), `<p>${t("再生できるクリップがありません。", "No replay clip is available.")}</p>`);
        return;
    }
    const body = `
        <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="font-weight:900;font-size:${isMobile ? "24px" : "20px"};">${clip.label} [${clip.rank}] ${formatProbability(clip.denominator)}</div>
            <img id="replay-image" src="${clip.frames[0]}" style="width:100%;border-radius:20px;border:1px solid rgba(70,80,110,.16);background:#111;object-fit:contain;" />
            <div style="opacity:.8;">${clip.subtitle}</div>
            <div style="display:flex;justify-content:center;">
                <button id="replay-gif-save-button" style="font-size:${isMobile ? "18px" : "16px"};padding:10px 18px;border-radius:999px;border:1px solid rgba(100,90,180,.28);background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);font-weight:900;cursor:pointer;">${t("GIF保存", "Save GIF")}</button>
            </div>
        </div>`;
    showPopup(`${t("リプレイ", "Replay")}: ${clip.label}`, body);
    const gifButton = document.getElementById("replay-gif-save-button") as HTMLButtonElement | null;
    if (gifButton) gifButton.onclick = () => { void exportClipAsGif(id); };
    const img = document.getElementById("replay-image") as HTMLImageElement | null;
    if (!img) return;
    let index = 0;
    const timer = window.setInterval(() => {
        if (helpOverlay.style.display === "none") {
            window.clearInterval(timer);
            return;
        }
        index = (index + 1) % clip.frames.length;
        img.src = clip.frames[index];
    }, 140);
}

async function exportClipAsGif(id: string): Promise<void> {
    const clip = miracleClips.find((x) => x.id === id);
    if (!clip || clip.frames.length === 0) {
        showPopup(t("GIF保存", "Save GIF"), `<p>${t("保存できるフレームがありません。", "No frames available to export.")}</p>`);
        return;
    }
    const ok = await ensureGifReady();
    if (!ok) {
        showPopup(t("GIF保存", "Save GIF"), `<p>${t("gif.js の読み込みに失敗しました。", "Failed to load gif.js.")}</p>`);
        return;
    }

    const previous = helpOverlay.style.display !== "none" ? helpOverlay.innerHTML : "";
    showPopup(t("GIF保存中", "Rendering GIF"), `<p>${t("GIFを書き出しています。少しお待ちください。", "Rendering the GIF. Please wait a moment.")}</p><div id="gif-progress" style="margin-top:12px;font-weight:900;">0%</div>`);

    try {
        const images = await Promise.all(clip.frames.map((src) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("frame load failed"));
            img.src = src;
        })));
        const width = images[0]?.naturalWidth || geometry.width;
        const height = images[0]?.naturalHeight || geometry.height;
        const gif = new (GIF as any)({
            workers: 2,
            quality: 10,
            width,
            height,
            workerScript: gifWorkerUrl,
            background: "#0b0d14",
        });
        for (const image of images) {
            gif.addFrame(image, { delay: 140 });
        }
        gif.on("progress", (value: number) => {
            const progress = document.getElementById("gif-progress");
            if (progress) progress.textContent = `${Math.round(value * 100)}%`;
        });
        gif.on("finished", (blob: Blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const safeLabel = clip.label.replace(/[\/:*?"<>|]/g, "_");
            a.href = url;
            a.download = `${safeLabel}_${clip.rank}_${clip.finishedCount}.gif`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1500);
            showPopup(t("GIF保存完了", "GIF saved"), `<p>${t("GIFを保存しました。", "The GIF has been saved.")}</p>`);
        });
        gif.render();
    } catch {
        if (previous) helpOverlay.innerHTML = previous;
        showPopup(t("GIF保存", "Save GIF"), `<p>${t("GIF保存に失敗しました。もう一度お試しください。", "GIF export failed. Please try again.")}</p>`);
    }
}

function showReplayPopup(): void {
    if (miracleClips.length === 0) {
        showPopup(t("リプレイ", "Replay"), `<p>${t("まだ奇跡クリップがありません。", "No miracle clips yet.")}</p>`);
        return;
    }
    const rows = miracleClips.map((clip, i) => `
        <div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;">
            <div>
                <div style="font-weight:900;">${i + 1}. ${clip.label} [${clip.rank}]</div>
                <div style="opacity:.76;">${formatProbability(clip.denominator)} / ${clip.finishedCount.toLocaleString()}投目 / ${new Date(clip.createdAt).toLocaleTimeString()}</div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;">
                <button data-replay-id="${clip.id}" style="font-size:${isMobile ? "18px" : "16px"};padding:10px 16px;border-radius:999px;border:1px solid rgba(87,112,51,.28);background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);font-weight:900;cursor:pointer;">${t("再生", "Play")}</button>
                <button data-gif-id="${clip.id}" style="font-size:${isMobile ? "18px" : "16px"};padding:10px 16px;border-radius:999px;border:1px solid rgba(100,90,180,.28);background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);font-weight:900;cursor:pointer;">${t("GIF保存", "Save GIF")}</button>
            </div>
        </div>
    `).join("");
    showPopup(t("奇跡クリップ保存", "Miracle clips"), rows);
    helpOverlay.querySelectorAll("[data-replay-id]").forEach((el) => {
        (el as HTMLButtonElement).onclick = () => replayClipById((el as HTMLButtonElement).dataset.replayId || "");
    });
    helpOverlay.querySelectorAll("[data-gif-id]").forEach((el) => {
        (el as HTMLButtonElement).onclick = () => { void exportClipAsGif((el as HTMLButtonElement).dataset.gifId || ""); };
    });
}

function showMiracleLogPopup(): void {
    if (miracleLogs.length === 0) {
        showPopup(t("奇跡発生ログ", "Miracle log"), `<p>${t("まだ奇跡は発生していません。", "No miracles yet.")}</p>`);
        return;
    }
    const rows = miracleLogs.map((log, i) => `
        <div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <div style="font-weight:900;">${i + 1}. ${log.label} [${log.rank}] ${log.denominator > 0 ? formatProbability(log.denominator) : "派生解放"}</div>
            <div style="opacity:.78;">${t("投下位置", "Count")}: ${log.finishedCount.toLocaleString()} / ${t("モード", "Mode")}: ${log.mode} / ${t("速度", "Speed")}: ${isEnglish ? log.speedLabel : log.speedLabel} / combo x${log.combo}${log.note ? ` / ${log.note}` : ""}</div>
            <div style="opacity:.62;">${new Date(log.finishedAt).toLocaleString()}</div>
        </div>`).join("");
    showPopup(t("奇跡発生ログ", "Miracle log"), rows);
}

function getResearchReportHtml(): string {
    const sum = binCounts.reduce((a,b) => a+b, 0) || 1;
    const maxCount = Math.max(...binCounts, 0);
    const minCount = Math.min(...binCounts);
    const topIndex = binCounts.indexOf(maxCount);
    const imbalance = ((maxCount - minCount) / sum) * 100;
    const diagnosis = imbalance > 18 ? t("かなり偏っています。盤面が機嫌を出しています。", "Very biased. The board is showing mood.") :
        imbalance > 10 ? t("少し偏っています。中央か端が主張気味です。", "Slightly biased. Center or edges are asserting themselves.") :
        t("比較的なだらかです。現実寄りの分布です。", "Relatively smooth. A realistic distribution.");
    const recentMiracles = miracleLogs.slice(0, 5).map((x) => `${x.label} [${x.rank}] ${x.denominator > 0 ? formatProbability(x.denominator) : "派生解放"}`).join("<br>") || t("なし", "None");
    const level = getResearchLevelInfo();
    const fortune = currentDailyFortune ?? getDailyFortune();
    return `
        <div style="display:grid;gap:10px;">
            <div><b>研究レベル:</b> Lv.${level.level} ${level.title} (${level.percent.toFixed(1)}%)</div>
            <div><b>今日の奇跡率:</b> x${fortune.rateBoost.toFixed(2)} / 注目: ${fortune.luckyKind}</div>
            <div><b>${t("総投下数", "Total count")}:</b> ${finishedCount.toLocaleString()} / ${settings.targetCount.toLocaleString()}</div>
            <div><b>${t("捨て区間", "Discarded")}:</b> ${discardedCount.toLocaleString()}</div>
            <div><b>${t("最頻受け皿", "Top bin")}:</b> ${topIndex >= 0 ? labels[topIndex] : "-" } (${maxCount.toLocaleString()})</div>
            <div><b>${t("偏り診断", "Bias diagnosis")}:</b> ${diagnosis}</div>
            <div><b>${t("発見済み種類", "Discovered kinds")}:</b> ${SPECIAL_EVENT_DEFS.filter((d) => (savedRecords.discovered[d.kind] ?? 0) + (specialCreated[d.kind] ?? 0) > 0).length} / ${SPECIAL_EVENT_DEFS.length}</div>
            <div><b>合成・派生:</b> ${getFusionCount()} / ${FUSION_DEFS.length}</div>
            <div><b>秘密操作:</b> ${Object.keys(savedRecords.secretUnlocked ?? {}).length}</div>
            <div><b>${t("最近の奇跡", "Recent miracles")}:</b><br>${recentMiracles}</div>
        </div>`;
}

function showResearchReportPopup(): void {
    showPopup(t("研究レポート", "Research report"), getResearchReportHtml());
}

function updateVerticalVideoButton(): void {
    verticalButton.textContent = isVerticalVideoMode ? t("縦動画: ON", "Vertical: ON") : t("縦動画: OFF", "Vertical: OFF");
}

function updateObsButton(): void {
    obsButton.textContent = isObsMode ? "OBS: ON" : "OBS: OFF";
}

function toggleVerticalVideoMode(): void {
    isVerticalVideoMode = !isVerticalVideoMode;
    if (isVerticalVideoMode) {
        gameArea.style.aspectRatio = "9 / 16";
        gameArea.style.height = isMobile ? "74dvh" : "88dvh";
        gameArea.style.maxWidth = isMobile ? "100%" : "500px";
    } else {
        gameArea.style.aspectRatio = "";
        gameArea.style.height = "";
        gameArea.style.maxWidth = "";
    }
    updateVerticalVideoButton();
    scheduleResize();
}

function toggleObsMode(): void {
    isObsMode = !isObsMode;
    controlArea.style.display = isObsMode ? "none" : "grid";
    buttonArea.style.display = isObsMode ? "none" : "grid";
    randomGraphArea.style.display = isObsMode ? "none" : "block";
    info.style.padding = isObsMode ? "8px" : "";
    updateObsButton();
    scheduleResize();
}

function applyRareBackground(kind: DropKind): void {
    const worldMode = getWorldModeByKind(kind);
    if (worldMode) {
        activeWorldMode = worldMode;
        activeRareBackgroundKind = kind;
        gameArea.style.background = getWorldModePalette(worldMode).bg;
        applyWorldModeBodyStyles();
        if (rareBackgroundTimer !== undefined) window.clearTimeout(rareBackgroundTimer);
        return;
    }
    activeRareBackgroundKind = kind;
    const map: Record<string, string> = {
        crown: "radial-gradient(circle at 50% 18%, rgba(255,220,80,.45), rgba(10,10,12,.96))",
        silverUfo: "radial-gradient(circle at 50% 18%, rgba(120,220,255,.30), rgba(4,8,16,.98))",
        blackSun: "radial-gradient(circle at 50% 18%, rgba(255,0,68,.22), rgba(0,0,0,.99))",
        timeRift: "radial-gradient(circle at 50% 18%, rgba(98,42,255,.38), rgba(3,4,12,.99))",
        heart: "radial-gradient(circle at 50% 18%, rgba(255,105,180,.28), rgba(18,8,16,.98))",
        labExplosion: "radial-gradient(circle at 50% 18%, rgba(255,120,48,.36), rgba(20,8,6,.98))",
        cosmicEgg: "radial-gradient(circle at 50% 18%, rgba(0,229,255,.28), rgba(28,0,56,.98))",
    };
    gameArea.style.background = map[kind] || map.crown;
    if (rareBackgroundTimer !== undefined) window.clearTimeout(rareBackgroundTimer);
    rareBackgroundTimer = window.setTimeout(() => {
        activeRareBackgroundKind = null;
        applyTheme();
    }, 3600);
}

function maybeTriggerBoardAnomaly(): void {
    if (settings.simpleMode || targetReachedTime !== null || isPaused || isMiraclePaused || isFinished) return;
    if (Date.now() < anomalyUntil) return;
    if (appRandom() > 0.000035 * getProbabilityScale()) return;
    const choice = Math.floor(appRandom() * 8);
    anomalyUntil = Date.now() + (choice >= 4 ? 4200 : 3000);
    anomalyOldGravityX = engine.gravity.x;
    anomalyHidePins = false;
    anomalyMode = "none";
    anomalyCenterX = geometry.width * (0.25 + appRandom() * 0.5);
    anomalyTick = 0;
    if (choice === 0) {
        anomalyMode = "sideGravity";
        engine.gravity.x = appRandom() < 0.5 ? -0.22 : 0.22;
        anomalyLabel = t("異変: 重力が横に傾いた", "Anomaly: gravity tilted sideways");
    } else if (choice === 1) {
        anomalyMode = "stickyTime";
        engine.timing.timeScale = Math.max(0.5, engine.timing.timeScale * 0.7);
        anomalyLabel = t("異変: 時間が少し粘る", "Anomaly: time became sticky");
    } else if (choice === 2) {
        anomalyMode = "dimPins";
        anomalyHidePins = true;
        anomalyLabel = t("異変: ピンが見えにくい", "Anomaly: pins became dim");
    } else if (choice === 3) {
        anomalyMode = "tremor";
        triggerCameraShake(14 * geometry.scale, 500);
        anomalyLabel = t("異変: 盤面がざわつく", "Anomaly: board is trembling");
    } else if (choice === 4) {
        anomalyMode = "updraft";
        anomalyLabel = t("異変: 下から風が吹いた", "Anomaly: an updraft appeared");
    } else if (choice === 5) {
        anomalyMode = "blackHole";
        anomalyLabel = t("異変: 小さな重力穴が開いた", "Anomaly: a tiny gravity well opened");
    } else if (choice === 6) {
        anomalyMode = "pinPulse";
        anomalyLabel = t("異変: ピンが一斉に震えた", "Anomaly: pins pulsed together");
        for (const body of engine.world.bodies) {
            const plugin = (body as any).plugin;
            if (plugin?.isPin) plugin.wiggleFrames = Math.max(plugin.wiggleFrames ?? 0, 42);
        }
    } else {
        anomalyMode = "reverseRain";
        anomalyLabel = t("異変: 玉が少し浮きたがる", "Anomaly: balls want to float");
    }
    addFloatingText(anomalyLabel, geometry.width / 2, 80 * geometry.scale, "#ffef78");
    setSubtitle(anomalyLabel);
    maybeShowCommentary(`観測装置「${anomalyLabel}」`, true);
}

function updateBoardAnomaly(): void {
    if (anomalyUntil && Date.now() > anomalyUntil) {
        anomalyUntil = 0;
        engine.gravity.x = anomalyOldGravityX;
        anomalyHidePins = false;
        anomalyMode = "none";
        anomalyCenterX = 0;
        anomalyTick = 0;
        engine.timing.timeScale = getCurrentTimeScale();
    }
}

function applyActiveBoardAnomalyForce(body: Matter.Body): void {
    if (!anomalyUntil || anomalyMode === "none") return;
    anomalyTick++;
    if (anomalyMode === "updraft") {
        Body.applyForce(body, body.position, { x: Math.sin((Date.now() + body.id * 17) / 320) * 0.0000012, y: -0.0000024 });
    } else if (anomalyMode === "blackHole") {
        const dx = anomalyCenterX - body.position.x;
        const dy = geometry.height * 0.36 - body.position.y;
        const dist = Math.max(80 * geometry.scale, Math.hypot(dx, dy));
        Body.applyForce(body, body.position, { x: dx / dist * 0.0000032, y: dy / dist * 0.0000022 });
    } else if (anomalyMode === "reverseRain") {
        Body.applyForce(body, body.position, { x: 0, y: -0.0000016 });
    } else if (anomalyMode === "tremor" && anomalyTick % 18 === 0) {
        Body.applyForce(body, body.position, { x: (appRandom() - 0.5) * 0.000012, y: -0.000003 });
    }
}

function vibrateOnMobile(pattern: number | number[]): void {
    if (!isMobile) return;
    try {
        navigator.vibrate?.(pattern);
    } catch {}
}

function triggerScreenFlash(mode: "normal" | "miracle" | "black" | "cosmic" = "miracle"): void {
    if (settings.simpleMode) return;
    const color = mode === "black" ? "rgba(255,0,68,.62)" : mode === "cosmic" ? "rgba(100,70,255,.68)" : mode === "normal" ? "rgba(255,255,255,.45)" : "rgba(255,236,120,.72)";
    flashOverlay.style.background = color;
    flashOverlay.style.display = "block";
    flashOverlay.style.opacity = "1";
    flashOverlay.style.transition = "opacity 720ms ease-out";
    requestAnimationFrame(() => { flashOverlay.style.opacity = "0"; });
    window.setTimeout(() => { flashOverlay.style.display = "none"; }, 760);
}


function closeHelpPopup(): void {
    helpOverlay.style.display = "none";
    helpOverlay.innerHTML = "";
}

function showPopup(title: string, bodyHtml: string): void {
    const panelWidth = isMobile ? "calc(100vw - 20px)" : "min(980px, 94vw)";
    const panelMaxHeight = isMobile ? "calc(100dvh - 20px)" : "88dvh";
    const panelPadding = isMobile ? "22px 18px 18px" : "28px";
    const titleFont = isMobile ? "32px" : "clamp(30px,5vw,58px)";
    const bodyFont = isMobile ? "18px" : "clamp(16px,2.5vw,24px)";
    const closeSize = isMobile ? "54px" : "46px";

    helpOverlay.innerHTML = `
        <div style="position:relative;width:${panelWidth};max-width:${panelWidth};max-height:${panelMaxHeight};overflow:auto;box-sizing:border-box;padding:${panelPadding};border-radius:${isMobile ? "24px" : "26px"};background:rgba(250,253,244,.98);box-shadow:0 24px 80px rgba(0,0,0,.42);border:1px solid rgba(87,112,51,.24);overscroll-behavior:contain;-webkit-overflow-scrolling:touch;">
            <button id="close-help-popup-button" aria-label="閉じる" style="position:sticky;float:right;right:0;top:0;width:${closeSize};height:${closeSize};border-radius:999px;border:1px solid rgba(87,112,51,.28);background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);color:#26351f;font-size:${isMobile ? "34px" : "28px"};font-weight:900;line-height:1;cursor:pointer;box-shadow:0 5px 14px rgba(87,112,51,.16);z-index:2;">×</button>
            <div style="font-size:${titleFont};font-weight:900;margin:0 ${isMobile ? "64px" : "54px"} 18px 0;color:#26351f;line-height:1.18;word-break:keep-all;overflow-wrap:break-word;">${title}</div>
            <div style="font-size:${bodyFont};line-height:${isMobile ? "1.62" : "1.72"};color:#2f3a2a;text-align:left;word-break:normal;overflow-wrap:break-word;">${bodyHtml}</div>
            <div style="margin-top:24px;text-align:center;"><button id="bottom-close-help-popup-button" style="font-size:20px;padding:12px 28px;border-radius:999px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:900;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);color:#26351f;">閉じる</button></div>
        </div>`;
    helpOverlay.style.display = "flex";
    document.getElementById("close-help-popup-button")!.onclick = () => closeHelpPopup();
    document.getElementById("bottom-close-help-popup-button")!.onclick = () => closeHelpPopup();
}


function showMiracleBookPopup(): void {
    const rows = SPECIAL_EVENT_DEFS.slice().reverse().map((def) => {
        const savedCount = savedRecords.discovered[def.kind] ?? 0;
        const nowCount = specialCreated[def.kind] ?? 0;
        const totalCount = savedCount + nowCount;
        const found = totalCount > 0;
        const firstFoundAt = savedRecords.discoveredFirstAt[def.kind];
        const displayName = found ? `${def.symbol} ${def.label}` : `◼︎◼︎◼︎ (${getSilhouetteHint(def)})`;
        const imageHtml = `<div style="position:relative;width:${isMobile ? 98 : 112}px;height:${isMobile ? 98 : 112}px;">
            <img src="${createMiracleImageDataUri(def)}" alt="${escapeSvgText(def.label)}" style="width:100%;height:100%;border-radius:22px;object-fit:cover;box-shadow:0 10px 24px rgba(0,0,0,.18);background:#0f172a;${found ? "" : "filter:saturate(.32) brightness(.72);opacity:.82;"}" />
            ${found ? "" : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:22px;background:rgba(15,23,42,.36);color:#fff;font-size:${isMobile ? 22 : 24}px;font-weight:1000;">?</div>`}
        </div>`;
        const firstFoundText = found && firstFoundAt ? new Date(firstFoundAt).toLocaleString() : "----";
        return `<div style="display:grid;grid-template-columns:${isMobile ? "98px minmax(0,1fr)" : "112px minmax(0,1fr)"};gap:14px;align-items:start;padding:14px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <div>${imageHtml}</div>
            <div style="min-width:0;">
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;padding:4px 10px;border-radius:999px;background:${found ? "rgba(53,98,59,.14)" : "rgba(120,130,140,.14)"};font-weight:900;color:${found ? "#214329" : "#727a86"};">${def.rank}</span>
                    <span style="font-size:${isMobile ? 21 : 22}px;font-weight:900;line-height:1.35;word-break:break-word;color:${found ? "#1d2738" : "#999"};">${displayName}</span>
                </div>
                <div style="margin-top:8px;font-size:${isMobile ? 15 : 16}px;line-height:1.7;opacity:.82;">${getMiracleFeatureText(def)}</div>
                <div style="margin-top:8px;font-size:${isMobile ? 15 : 16}px;line-height:1.6;opacity:.72;">${t("確率", "Odds")} ${formatProbability(def.denominator)} / ${t("累計発見", "Total found")} ${totalCount}${t("回", "x")}</div>
                <div style="margin-top:2px;font-size:${isMobile ? 14 : 15}px;line-height:1.6;opacity:.62;">${t("初回発見", "First found")} ${firstFoundText}</div>
            </div>
        </div>`;
    }).join("");
    showPopup("奇跡図鑑", `
        <p style="margin-top:0;">全ての奇跡を画像つきで表示します。未発見のものは画像だけ薄く見せ、名前は伏せたまま記録されます。</p>
        <div style="margin-top:16px;border-radius:22px;background:rgba(255,255,255,.75);padding:${isMobile ? "4px 14px" : "8px 16px"};box-sizing:border-box;max-width:100%;overflow:hidden;">${rows}</div>
    `);
}

function showRecordsPopup(): void {
    showPopup("最高記録", `
        <p><b>実験回数:</b> ${savedRecords.totalRuns.toLocaleString()}回</p>
        <p><b>最大実処理数:</b> ${savedRecords.maxFinishedCount.toLocaleString()}回</p>
        <p><b>最大指定投下数:</b> ${savedRecords.maxTargetCount.toLocaleString()}回</p>
        <p><b>最高レア:</b> ${savedRecords.bestRank} / ${savedRecords.bestLabel}</p>
        <p><b>最高スコア:</b> ${savedRecords.bestScore.toLocaleString()}</p>
        <p><b>通算スコア:</b> ${savedRecords.totalScore.toLocaleString()}</p>
        <p><b>ミッション達成種類:</b> ${Object.keys(savedRecords.missionCompleted).length} / ${missionDefs.length || buildMissionDefs().length}</p>
        <p>保存はブラウザ内です。別端末や別ブラウザでは共有されません。</p>
        <p style="opacity:.75;">消したい場合はブラウザのサイトデータ削除でリセットできます。</p>
    `);
}

function showAboutPopup(): void {
    showPopup("ミラクルボールラボについて", `
        <p><b>ミラクルボールラボ</b>は、玉を上から落として、ピンに当たりながらどの受け皿に入るかを観測するランダム実験です。</p>
        <p>通常玉にはたまに<b>個体差</b>が付きます。重い玉、跳ね玉、小粒玉、のんびり玉、早足玉、回転玉、うす玉などがあり、同じ通常玉でも少し違う落ち方をします。</p>
        <ul style="text-align:left;line-height:1.7;">${getNormalTraitSummaryHtml()}</ul>
        <p>通常玉だけでなく、金玉、虹玉、巨大玉、図形、王、銀のUFO、青い炎、流れ星、ラッキーセブン、桃色ハート、時空の裂け目、黒い太陽、研究所爆発、そして極秘の最上位奇跡など、たくさんのレア玉がまれに出ます。最上位は<b>1兆分の1</b>級です。</p>
        <p>さらに<b>10億分の1</b>レベルで、<b>poseidon mode / zeusu mode / hadesu mode / heart mode / nekochan mode / 人生名言ボイス</b>が発生します。mode系は出た瞬間から実験終了まで盤面全体の世界観が変わり続けます。</p>
        <p>両端は<b>捨て区間</b>です。ここに入った玉も処理済みとして数えますが、中央の受け皿ランキングには入れません。</p>
        <p>100,000回ごとに達成演出が出ます。指定回数に到達したあと、画面に残っている玉も最後に回収してから実験完了にします。</p>
        <p>奇跡ログ、今日の運勢・奇跡率、研究レベル、奇跡合成・派生、スクリーンショット保存、秘密操作を追加しています。</p>
        <p>実験中は、画面下に研究員の<b>実況ログ</b>が本当にたまに横から流れます。出過ぎると邪魔なので、かなり控えめです。</p>
        <p>まれに<b>盤面変異イベント</b>が発生し、横重力、粘る時間、上昇気流、小さな重力穴、ピン一斉振動などで盤面が短時間だけ変化します。</p>
        <p>特定の奇跡が決まった順番で続くと<b>奇跡同士の連鎖</b>が発生し、専用の連鎖演出とスコアが入ります。実験完了時には短いエンディング演出を挟んで結果画面に進みます。</p>
        <p>背景はデフォルトで favicon.png を盤面に大きく表示します。スマホでは見切れない範囲で最大表示します。画面揺れはデフォルトOFFです。</p>
        <p>奇跡図鑑と発生演出には、全種類でアプリ内生成のオリジナルSVG画像を使います。発生時は該当画像を大きく表示します。「どーん！」の文字演出は控え、画像と発生名を中心に見せます。</p>
        <p><b>補足:</b> 超高速にすると物理演算と画面描画が速く進むため、レア演出が一瞬で流れて見えない可能性がかなり高くなります。レア演出を見たいときは通常か高速がおすすめです。SR/SSRで同じ奇跡演出が実行中に再発生した場合は、2回目以降さらに短く閉じます。</p>
        <p><b>AIからの補足:</b> これは遊びながら確率の偏りを見るシミュレーションです。厳密な科学実験ではなく、乱数はブラウザの <code>Math.random()</code> を使っています。統計っぽく見たい場合は投下数を多めにして、動作が重いときはシンプルON、同時に出す玉数を少なめにしてください。</p>
    `);
}

function showButtonHelpPopup(): void {
    showPopup("ボタン説明", `
        <p><b>実行:</b> 現在の設定で実験を開始します。開始前は待機中です。</p>
        <p><b>超低速 / 低速 / 通常 / 高速 / 超高速:</b> 玉の動く速度を変えます。超低速と低速は観察向け、超高速は処理は速いですがレア演出を見逃しやすくなります。</p>
        <p><b>ストップ / 再開:</b> 実験を一時停止、または再開します。PC版は盤面左下にも一時停止ボタンを追加しています。奇跡演出中でも一時停止を優先できます。スマホ下部にも一時停止ボタンがあります。</p>
        <p><b>リセット:</b> 設定を読み直して、実験を最初から待機状態に戻します。</p>
        <p><b>シンプル:</b> 演出を減らして軽くします。重い場合や大量回数を試す場合に便利です。</p>
        <p><b>演出ゆっくり:</b> 奇跡演出だけを少し長く見せます。デフォルトはOFFです。同じSR/SSRの短縮演出は優先されます。</p><p><b>音:</b> Tone.js を使って、開始・一時停止・スキル・秘密操作・レア玉ごとに違う短い効果音を鳴らします。GOD/EX級は低音とノイズを重ねて強めにしています。ブラウザ仕様上、最初にボタン操作が必要です。</p>
        <p><b>衝撃波 / 磁石 / 時止め:</b> 実験中に使える操作スキルです。衝撃波は玉を散らし、磁石は上位受け皿へ吸わせ、時止めは短時間だけ盤面を静止させます。</p>
        <p><b>ミッション:</b> 実験中の条件達成でスコア報酬を獲得します。</p>
        <p><b>今日の運勢:</b> 日付ごとの奇跡率、注目奇跡、ラッキー受け皿を表示します。奇跡率はレア抽選に少しだけ反映されます。</p>
        <p><b>奇跡合成:</b> 特定の奇跡同士を観測すると、派生奇跡が研究記録として解放されます。さらに実験中に特定の順番で奇跡が続くと、奇跡連鎖演出が発生します。</p>
        <p><b>実況ログ:</b> 画面下に研究員の短い実況がたまに流れます。常に流れるものではなく、観測のアクセント用です。</p>
        <p><b>秘密:</b> 裏コマンドの発見状況を表示します。キーボード入力、ロゴ連打、一時停止連打、スキルの順番操作などを実績風に集められます。</p>
        <p><b>録画・SNS:</b> 投稿文コピー、現在画面のスクリーンショット保存、縦長シェアカード保存ができます。奇跡のGIF保存はリプレイから行います。</p>
        <p><b>紙吹雪:</b> 達成時やレア演出時の紙吹雪をON/OFFします。</p>
        <p><b>Pixi背景:</b> Pixi.jsを使った背景演出をON/OFFします。見た目は楽しいですが、PCやスマホによっては重くなります。</p>
        <p><b>設定反映:</b> 投下数、同時に出す玉数、受け皿数、ピン段数などを反映してリセットします。</p>
        <p><b>背景だけ反映:</b> 背景画像だけを差し替えます。</p>
        <p><b>結果コピー / CSV保存:</b> 実験結果をコピー、またはCSVファイルとして保存します。</p>
        <p><b>ピンをタップ/クリック:</b> 近くのピンを揺らして、詰まり気味の玉を少し動かせます。</p>
        <p><b>SR/SSR演出:</b> 実行中に同じSR/SSR演出が再発生した場合は、2回目以降さらに短く閉じます。</p>
    `);
}

// ======================================================
// Layout / reset
// ======================================================

function applySettingsFromInputs(showInvalidPopup = true): boolean {
    const oldSettings = { ...settings };
    const targetRaw = targetInput.value.trim();
    const activeRaw = activeBallInput.value.trim();
    const binsRaw = binCountInput.value.trim();
    const rowsRaw = pinRowInput.value.trim();

    const target = Math.floor(Number(targetRaw));
    const active = Math.floor(Number(activeRaw));
    const bins = Math.floor(Number(binsRaw));
    const rows = Math.floor(Number(rowsRaw));
    const errors: string[] = [];

    if (!Number.isFinite(target) || target < 1) errors.push("投下数は1以上の数字で入力してください。");
    if (!Number.isFinite(active) || active < 1 || active > 300) errors.push("同時に出す玉数は1〜300で入力してください。");
    if (!Number.isFinite(bins) || bins < 2 || bins > 30) errors.push("下の受け皿数は2〜30で入力してください。");
    if (!Number.isFinite(rows) || rows < 1 || rows > 30) errors.push("ピン段数は1〜30で入力してください。");

    if (errors.length > 0) {
        targetInput.value = String(oldSettings.targetCount);
        activeBallInput.value = String(oldSettings.activeLimit);
        binCountInput.value = String(oldSettings.binCount);
        pinRowInput.value = String(oldSettings.pinRows);
        probabilityModeSelect.value = oldSettings.probabilityMode;
        if (!selectedBackgroundObjectUrl) backgroundInput.value = oldSettings.backgroundImage;
        if (showInvalidPopup) {
            showPopup("入力チェック", `<p>${errors.join("</p><p>")}</p><p>入力前の値に戻しました。</p>`);
        }
        return false;
    }

    settings.targetCount = target;
    settings.activeLimit = active;
    settings.binCount = bins;
    settings.pinRows = rows;
    settings.labelText = createDefaultLabelText(settings.binCount);
    settings.probabilityMode = (probabilityModeSelect.value as ProbabilityMode) || "normal";

    if (selectedBackgroundObjectUrl && backgroundInput.value.startsWith("選択した画像:")) settings.backgroundImage = selectedBackgroundObjectUrl;
    else settings.backgroundImage = backgroundInput.value.trim();

    targetInput.value = String(settings.targetCount);
    activeBallInput.value = String(settings.activeLimit);
    binCountInput.value = String(settings.binCount);
    pinRowInput.value = String(settings.pinRows);
    probabilityModeSelect.value = settings.probabilityMode;
    if (!selectedBackgroundObjectUrl) backgroundInput.value = settings.backgroundImage;
    return true;
}

function createDefaultLabelText(count: number): string {
    return Array.from({ length: count }, (_, i) => String(i + 1)).join("\n");
}

function autoApplyLayoutSetting(): void {
    const before = {
        targetCount: settings.targetCount,
        activeLimit: settings.activeLimit,
        binCount: settings.binCount,
        pinRows: settings.pinRows,
        probabilityMode: settings.probabilityMode,
    };
    const ok = applySettingsFromInputs(true);
    if (!ok) return;
    const changed =
        before.targetCount !== settings.targetCount ||
        before.activeLimit !== settings.activeLimit ||
        before.binCount !== settings.binCount ||
        before.pinRows !== settings.pinRows ||
        before.probabilityMode !== settings.probabilityMode;
    if (changed) resetExperiment(false);
}

function calculateGeometry(): Geometry {
    const visual = window.visualViewport;
    const viewportWidth = Math.max(320, Math.floor(visual?.width ?? window.innerWidth));
    const viewportHeight = Math.max(480, Math.floor(visual?.height ?? window.innerHeight));
    const small = isMobile || viewportWidth < 700;
    const infoHeight = isMobile
        ? Math.round(clamp(viewportHeight * 0.115, 96, 116))
        : Math.round(clamp(viewportHeight * (small ? 0.24 : 0.40), small ? 170 : 300, small ? 270 : 500));
    const width = viewportWidth;
    const height = Math.max(360, viewportHeight - infoHeight);
    const scale = clamp(Math.min(width / BASE_WIDTH, height / BASE_HEIGHT), 0.56, 2.4);
    const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 3);

    const totalBinCount = settings.binCount + 2;
    const visibleStart = 1;
    const wallWidth = clamp(36 * scale, 22, 72);
    const groundHeight = clamp(40 * scale, 26, 76);
    const binLeft = wallWidth;
    const binRight = width - wallWidth;
    const binWidth = (binRight - binLeft) / totalBinCount;
    const groundTop = height - groundHeight;
    const binScale = clamp(binWidth / 90, isMobile ? 0.9 : 0.55, 2.25);
    const ballRadius = clamp(18 * scale * binScale, isMobile ? 8 : 5, isMobile ? 34 : 30);
    const pinRadius = clamp(10 * scale * binScale, isMobile ? 5 : 3, isMobile ? 20 : 18);
    const dividerWidth = clamp(12 * scale * binScale, 5, 22);
    const dividerHeight = clamp(104 * scale, 68, 170);
    const dividerY = groundTop - dividerHeight / 2;
    const labelFont = Math.round(clamp(42 * scale * binScale, isMobile ? 24 : 16, isMobile ? 72 : 60));
    const countFont = Math.round(clamp(28 * scale * binScale, isMobile ? 16 : 12, isMobile ? 50 : 44));
    const percentFont = Math.round(clamp(20 * scale * binScale, isMobile ? 12 : 10, isMobile ? 36 : 32));
    const infoFont = Math.round(clamp(18 * scale, 15, isMobile ? 30 : 26));
    const labelY = groundTop - clamp(118 * scale, 72, 170);
    const countY = groundTop - clamp(74 * scale, 46, 110);
    const percentY = groundTop - clamp(38 * scale, 24, 64);
    const barY = groundTop - clamp(14 * scale, 9, 28);
    const ballCountY = groundTop - ballRadius - 2 * scale;
    const binCenters: number[] = [];
    for (let i = 0; i < settings.binCount; i++) {
        binCenters.push(binLeft + (visibleStart + i) * binWidth + binWidth / 2);
    }
    return { width, height, infoHeight, scale, pixelRatio, wallWidth, groundHeight, groundTop, totalBinCount, binLeft, binRight, binWidth, visibleStart, ballRadius, pinRadius, dividerWidth, dividerHeight, dividerY, ballCountY, labelY, countY, percentY, barY, labelFont, countFont, percentFont, infoFont, binCenters };
}

function applyBackgroundImage(): void {
    const url = settings.backgroundImage.trim();
    if (url.length === 0) {
        canvas.style.backgroundImage = "";
        canvas.style.backgroundColor = "rgba(245,245,245,0.88)";
        gameArea.style.backgroundImage = "";
        gameArea.style.background = "radial-gradient(circle at 50% 0%, #ffffff 0%, #edf3ff 46%, #dfe7f5 100%)";
        return;
    }
    const isDefaultFavicon = url === DEFAULT_BACKGROUND_IMAGE_URL || /\/favicon\.png(?:$|[?#])/i.test(url);
    canvas.style.backgroundImage = `url("${url}")`;
    canvas.style.backgroundRepeat = "no-repeat";
    canvas.style.backgroundPosition = "center";
    canvas.style.backgroundSize = isDefaultFavicon ? (isMobile ? "contain" : "min(72%, 520px) auto") : "cover";
    canvas.style.backgroundColor = isDefaultFavicon ? "rgba(245,250,239,0.92)" : "rgba(17,24,39,0.35)";
    gameArea.style.background = isDefaultFavicon ? "radial-gradient(circle at 50% 36%, rgba(255,255,255,.90) 0%, rgba(225,239,198,.88) 42%, rgba(26,36,25,.92) 100%)" : "#111827";
    gameArea.style.backgroundImage = isDefaultFavicon
        ? `linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.12)), url("${url}")`
        : `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url("${url}")`;
    gameArea.style.backgroundRepeat = "no-repeat";
    gameArea.style.backgroundSize = isDefaultFavicon ? "contain" : "cover";
    gameArea.style.backgroundPosition = "center";
}

function resetExperiment(startNow = false): void {
    geometry = calculateGeometry();
    info.style.height = `${geometry.infoHeight}px`;
    const sidePadding = isMobile ? Math.round(clamp(12 * geometry.scale, 10, 16)) : Math.round(20 * geometry.scale);
    info.style.padding = isMobile
        ? `10px 10px env(safe-area-inset-bottom, 10px)`
        : `${Math.round(14 * geometry.scale)}px ${sidePadding}px`;
    info.style.fontSize = `${geometry.infoFont}px`;

    render.options.width = geometry.width;
    render.options.height = geometry.height;
    render.options.pixelRatio = geometry.pixelRatio;
    render.options.background = "transparent";
    Render.setPixelRatio(render, geometry.pixelRatio);
    Render.setSize(render, geometry.width, geometry.height);
    canvas.style.width = `${geometry.width}px`;
    canvas.style.height = `${geometry.height}px`;
    applyBackgroundImage();

    Composite.clear(engine.world, false);
    finishedCount = 0;
    activeDropCount = 0;
    startTime = Date.now();
    endTime = null;
    targetReachedTime = null;
    lastSpeedCheckTime = Date.now();
    lastSpeedCheckFinishedCount = 0;
    speedPerSecond = 0;
    nextMilestone = MILESTONE_INTERVAL;
    nextGiantEvent = GIANT_EVENT_INTERVAL;
    giantStock = 0;
    isFinished = false;
    isPaused = false;
    isStarted = startNow;
    isMiraclePaused = false;
    if (miraclePauseTimer !== undefined) { window.clearTimeout(miraclePauseTimer); miraclePauseTimer = undefined; }
    updateStopButton();

    labels = parseLabels(createDefaultLabelText(settings.binCount), settings.binCount);
    missionDefs = buildMissionDefs();
    missionProgress = {};
    runScore = 0;
    bestComboThisRun = 0;
    skillState = { shockwave: 2, magnet: 2, timeStop: 1 };
    magnetUntil = 0;
    updateSkillButtons();
    binCounts = Array.from({ length: settings.binCount }, () => 0);
    hitFlash = Array.from({ length: settings.binCount }, () => 0);
    discardedCount = 0;
    goldHits = Array.from({ length: settings.binCount }, () => 0);
    rainbowHits = Array.from({ length: settings.binCount }, () => 0);
    giantHits = Array.from({ length: settings.binCount }, () => 0);
    shapeHits = Array.from({ length: settings.binCount }, () => 0);
    crownHits = Array.from({ length: settings.binCount }, () => 0);
    starHits = Array.from({ length: settings.binCount }, () => 0);
    heartHits = Array.from({ length: settings.binCount }, () => 0);
    blackSunHits = Array.from({ length: settings.binCount }, () => 0);
    cosmicEggHits = Array.from({ length: settings.binCount }, () => 0);
    randomBuckets = Array.from({ length: RANDOM_BUCKET_COUNT }, () => 0);
    randomCallCount = 0;
    floatingTexts = [];
    shakeUntil = 0;
    shakePower = 0;

    goldCreated = 0;
    rainbowCreated = 0;
    giantCreated = 0;
    shapeCreated = 0;
    crownCreated = 0;
    starCreated = 0;
    heartCreated = 0;
    blackSunCreated = 0;
    cosmicEggCreated = 0;
    silverUfoCreated = 0;
    blueFlameCreated = 0;
    luckySevenCreated = 0;
    timeRiftCreated = 0;
    labExplosionCreated = 0;
    specialCreated = {};
    repeatedMiracleRunCounts = {};
    recentMiracleKinds = [];
    unlockedChainRunIds = {};
    lastCommentaryAt = 0;
    if (commentaryTimer !== undefined) { window.clearTimeout(commentaryTimer); commentaryTimer = undefined; }
    commentaryOverlay.style.display = "none";
    commentaryOverlay.innerHTML = "";
    anomalyUntil = 0;
    anomalyHidePins = false;
    anomalyMode = "none";
    currentSubtitleText = "";
    subtitleOverlay.style.display = "none";
    comboOverlay.style.display = "none";

    resultOverlay.style.display = "none";
    milestoneOverlay.style.display = "none";
    celebrationOverlay.style.display = "none";
    clearMiracleOverlayNow();
    canvas.style.transform = "translate(0,0)";
    activeWorldMode = null;
    activeRareBackgroundKind = null;

    Composite.add(engine.world, [...createWallsAndFloor(), ...createPins(), ...createDividers()]);
    applyWorldModeBodyStyles();
    if (startNow) {
        for (let i = 0; i < settings.activeLimit; i++) Composite.add(engine.world, createDrop());
        if (!isMiraclePaused) Runner.run(runner, engine);
    } else {
        Runner.stop(runner);
    }

    updateSimpleModeButton();
    updateInfo();
}

function updateSimpleModeButton(): void {
    simpleModeButton.textContent = settings.simpleMode ? t("シンプル: ON", "Simple: ON") : t("シンプル: OFF", "Simple: OFF");
    simpleModeButton.style.background = settings.simpleMode ? "linear-gradient(180deg, #222 0%, #444 100%)" : "linear-gradient(180deg, #f3f8e8 0%, #dceec2 100%)";
    simpleModeButton.style.color = settings.simpleMode ? "#ffffff" : "#222222";
}

function updateCameraShakeButton(): void {
    cameraShakeButton.textContent = settings.cameraShakeEnabled ? t("画面揺れ: ON", "Shake: ON") : t("画面揺れ: OFF", "Shake: OFF");
    cameraShakeButton.style.background = settings.cameraShakeEnabled ? "linear-gradient(180deg, #f3f8e8 0%, #dceec2 100%)" : "linear-gradient(180deg, #ececec 0%, #d7d7d7 100%)";
    cameraShakeButton.style.color = settings.cameraShakeEnabled ? "#26351f" : "#444444";
}

function updateSlowMiracleButton(): void {
    slowMiracleButton.textContent = settings.slowMiracleEffects ? t("演出ゆっくり: ON", "Slow effects: ON") : t("演出ゆっくり: OFF", "Slow effects: OFF");
    slowMiracleButton.style.background = settings.slowMiracleEffects ? "linear-gradient(180deg, #fff7ed 0%, #fed7aa 100%)" : "linear-gradient(180deg, #ececec 0%, #d7d7d7 100%)";
    slowMiracleButton.style.color = settings.slowMiracleEffects ? "#7c2d12" : "#444444";
}

function updateStopButton(): void {
    stopButton.textContent = isPaused ? t("再開", "Resume") : t("ストップ", "Stop");
    pcPauseButton.textContent = isPaused ? t("再開", "Resume") : t("一時停止", "Pause");
    pcPauseButton.title = isPaused ? t("再開", "Resume") : t("一時停止", "Pause");
    if (mobileDockPauseButton) mobileDockPauseButton.textContent = isPaused ? t("再開", "Resume") : t("一時停止", "Pause");
}

async function startExperiment(): Promise<void> {
    if (!applySettingsFromInputs(true)) return;
    void ensureAnimeReady();
    void ensureTippyReady();
    void ensureGifReady();
    // ブラウザの仕様上、音声開始はユーザー操作後が安全なので、実行ボタン押下時に準備する
    if (soundEnabled && !toneReady) await enableSound(false);
    playUiSound("start");
    engine.timing.timeScale = getCurrentTimeScale();
    resetExperiment(true);
}

function clearMiracleOverlayNow(): void {
    hideMiracleOverlayNow();
}

function setMiracleOverlayAnimationPaused(paused: boolean): void {
    const state = paused ? "paused" : "running";

    miracleOverlay.style.animationPlayState = state;

    miracleOverlay
        .querySelectorAll<HTMLElement>("*")
        .forEach((el) => {
            el.style.animationPlayState = state;
        });
}

function hideMiracleOverlayNow(): void {
    if (miracleOverlayTimer !== undefined) {
        window.clearTimeout(miracleOverlayTimer);
        miracleOverlayTimer = undefined;
    }

    miracleOverlayEndsAt = 0;
    miracleOverlayRemainingMs = 0;
    miracleOverlayFrozen = false;

    setMiracleOverlayAnimationPaused(false);

    miracleOverlay.style.display = "none";
    miracleOverlay.innerHTML = "";
}

function startMiracleOverlayTimer(durationMs: number): void {
    if (miracleOverlayTimer !== undefined) {
        window.clearTimeout(miracleOverlayTimer);
    }

    miracleOverlayEndsAt = Date.now() + durationMs;
    miracleOverlayRemainingMs = durationMs;
    miracleOverlayFrozen = false;

    miracleOverlayTimer = window.setTimeout(() => {
        hideMiracleOverlayNow();
    }, durationMs);
}

function pauseMiracleOverlayTimer(): void {
    if (miracleOverlay.style.display === "none") return;

    if (miracleOverlayTimer !== undefined) {
        miracleOverlayRemainingMs = Math.max(120, miracleOverlayEndsAt - Date.now());
        window.clearTimeout(miracleOverlayTimer);
        miracleOverlayTimer = undefined;
    }

    miracleOverlayFrozen = true;
    setMiracleOverlayAnimationPaused(true);
}

function resumeMiracleOverlayTimer(): void {
    if (!miracleOverlayFrozen) return;

    miracleOverlayFrozen = false;
    setMiracleOverlayAnimationPaused(false);

    const remainingMs = Math.max(120, miracleOverlayRemainingMs || 600);
    startMiracleOverlayTimer(remainingMs);
}

function clearMiracleAutoPause(): void {
    if (miraclePauseTimer !== undefined) {
        window.clearTimeout(miraclePauseTimer);
        miraclePauseTimer = undefined;
    }
    isMiraclePaused = false;
}

function finishMiraclePause(): void {
    isMiraclePaused = false;
    miraclePauseTimer = undefined;
    miraclePauseEndsAt = 0;
    miraclePauseRemainingMs = 0;

    if (isStarted && !isFinished && !isPaused) {
        Runner.run(runner, engine);
    }

    updateInfo();
}

function pauseForMiracle(def?: SpecialEventDef): void {
    if (!isStarted || isFinished || isMiraclePaused) return;

    const repeatedInRun = !!def && (repeatedMiracleRunCounts[def.kind] ?? 0) >= 2;
    const durationMs = getMiraclePauseDuration(def, repeatedInRun);

    isMiraclePaused = true;
    miraclePauseEndsAt = Date.now() + durationMs;
    miraclePauseRemainingMs = durationMs;

    if (miraclePauseTimer !== undefined) {
        window.clearTimeout(miraclePauseTimer);
    }

    Runner.stop(runner);
    updateInfo();

    miraclePauseTimer = window.setTimeout(() => {
        finishMiraclePause();
    }, durationMs);
}

function pauseMiraclePauseTimer(): void {
    if (miraclePauseTimer === undefined) return;

    miraclePauseRemainingMs = Math.max(120, miraclePauseEndsAt - Date.now());
    window.clearTimeout(miraclePauseTimer);
    miraclePauseTimer = undefined;
}

function resumeMiraclePauseTimer(): void {
    if (!isMiraclePaused) return;
    if (miraclePauseTimer !== undefined) return;

    const remainingMs = Math.max(120, miraclePauseRemainingMs || 600);
    miraclePauseEndsAt = Date.now() + remainingMs;

    miraclePauseTimer = window.setTimeout(() => {
        finishMiraclePause();
    }, remainingMs);
}

function togglePause(): void {
    if (!isStarted || isFinished) return;

    registerPauseSecretTap?.();
    playUiSound?.(isPaused ? "resume" : "pause");

    if (isPaused) {
        // 再開
        isPaused = false;

        resumeMiracleOverlayTimer();
        resumeMiraclePauseTimer();

        if (!isMiraclePaused) {
            Runner.run(runner, engine);
        }
    } else {
        // 一時停止
        isPaused = true;

        // 奇跡演出中なら、演出タイマー・CSSアニメーションもその場で止める
        pauseMiracleOverlayTimer();
        pauseMiraclePauseTimer();

        Runner.stop(runner);
    }

    updateStopButton();
    updateInfo();
}

// ======================================================
// Bodies
// ======================================================

function createWallsAndFloor(): Matter.Body[] {
    const leftWall = Bodies.rectangle(geometry.wallWidth / 2, geometry.height / 2, geometry.wallWidth, geometry.height, { isStatic: true, render: { fillStyle: "rgba(36, 41, 54, 0.92)" } });
    const rightWall = Bodies.rectangle(geometry.width - geometry.wallWidth / 2, geometry.height / 2, geometry.wallWidth, geometry.height, { isStatic: true, render: { fillStyle: "rgba(36, 41, 54, 0.92)" } });
    const ground = Bodies.rectangle(geometry.width / 2, geometry.height - geometry.groundHeight / 2, geometry.width - geometry.wallWidth * 2, geometry.groundHeight, { isStatic: true, render: { fillStyle: "rgba(36, 41, 54, 0.92)" } });
    return [leftWall, rightWall, ground];
}

function createPins(): Matter.Body[] {
    const pins: Matter.Body[] = [];
    const pinStartY = clamp(70 * geometry.scale, 40, 120);
    const pinEndY = geometry.groundTop - geometry.dividerHeight - clamp(36 * geometry.scale, 20, 70);
    const spacingY = settings.pinRows > 1 ? (pinEndY - pinStartY) / (settings.pinRows - 1) : 60 * geometry.scale;

    for (let row = 0; row < settings.pinRows; row++) {
        const y = pinStartY + row * spacingY;
        if (row % 2 === 0) {
            for (let col = 0; col < geometry.totalBinCount; col++) {
                const x = geometry.binLeft + geometry.binWidth / 2 + col * geometry.binWidth;
                pins.push(Bodies.circle(x, y, geometry.pinRadius, { isStatic: true, render: { fillStyle: "rgba(89, 97, 115, 0.92)" } }));
            }
        } else {
            for (let col = 1; col < geometry.totalBinCount; col++) {
                const x = geometry.binLeft + col * geometry.binWidth;
                pins.push(Bodies.circle(x, y, geometry.pinRadius, { isStatic: true, render: { fillStyle: "rgba(89, 97, 115, 0.92)" } }));
            }
        }
    }

    for (const pin of pins) {
        (pin as any).plugin = { isPin: true, baseX: pin.position.x, baseY: pin.position.y, wiggleFrames: 0 };
    }
    return pins;
}

function createDividers(): Matter.Body[] {
    const dividers: Matter.Body[] = [];
    for (let i = 1; i < geometry.totalBinCount; i++) {
        const x = geometry.binLeft + geometry.binWidth * i;
        dividers.push(Bodies.rectangle(x, geometry.dividerY, geometry.dividerWidth, geometry.dividerHeight, { isStatic: true, render: { fillStyle: "rgba(196, 101, 101, 0.94)" } }));
    }
    return dividers;
}

function createDropPlugin(kind: DropKind, x: number, y: number, radius: number, extras: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        isDrop: true,
        kind,
        stuckFrames: 0,
        lastX: x,
        lastY: y,
        lifeFrames: 0,
        bornAt: performance.now(),
        hardExpireMs: kind === "giant" ? 9000 : kind === "shape" ? 16000 : 15000,
        originalRadius: radius,
        ...extras,
    };
}

function createRandomShapeBody(x: number, y: number, radius: number, renderOptions: any): Matter.Body {
    const commonOptions: any = { restitution: 0.92, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0011, render: renderOptions };
    const choice = Math.floor(appRandom() * 9);
    let body: Matter.Body;
    let shapeName = "";
    if (choice === 0) { shapeName = "角丸四角形"; body = Bodies.rectangle(x, y, radius * 1.7, radius * 1.7, { ...commonOptions, chamfer: { radius: radius * 0.25 } }); }
    else if (choice === 1) { shapeName = "角丸長方形"; body = Bodies.rectangle(x, y, radius * 2.4, radius * 1.1, { ...commonOptions, chamfer: { radius: radius * 0.22 } }); }
    else if (choice === 2) { shapeName = "三角形"; body = Bodies.polygon(x, y, 3, radius * 1.35, commonOptions); }
    else if (choice === 3) { shapeName = "五角形"; body = Bodies.polygon(x, y, 5, radius * 1.35, commonOptions); }
    else if (choice === 4) { shapeName = "六角形"; body = Bodies.polygon(x, y, 6, radius * 1.35, commonOptions); }
    else if (choice === 5) { shapeName = "八角形"; body = Bodies.polygon(x, y, 8, radius * 1.35, commonOptions); }
    else if (choice === 6) { shapeName = "台形"; body = Bodies.trapezoid(x, y, radius * 2.2, radius * 1.5, 0.35, commonOptions); }
    else if (choice === 7) { shapeName = "短い棒"; body = Bodies.rectangle(x, y, radius * 2.5, radius * 0.9, { ...commonOptions, chamfer: { radius: radius * 0.2 } }); }
    else { shapeName = "多角形"; body = Bodies.polygon(x, y, 7, radius * 1.45, commonOptions); }

    (body as any).plugin = createDropPlugin("shape", x, y, radius, { shapeName });
    return body;
}

function createHeartBody(x: number, y: number, radius: number, renderOptions: any): Matter.Body {
    const options: any = { restitution: 0.96, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0012, render: renderOptions };
    const left = Bodies.circle(x - radius * 0.48, y - radius * 0.25, radius * 0.62, options);
    const right = Bodies.circle(x + radius * 0.48, y - radius * 0.25, radius * 0.62, options);
    const bottom = Bodies.polygon(x, y + radius * 0.25, 3, radius * 1.25, options);
    Body.rotate(bottom, Math.PI);
    const heart = Body.create({ parts: [left, right, bottom], restitution: 0.96, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0012, render: renderOptions });
    (heart as any).plugin = createDropPlugin("heart", x, y, radius, { symbol: "♥", shapeName: "桃色ハート" });
    return heart;
}

function createSymbolBody(x: number, y: number, radius: number, kind: DropKind, fillStyle: string, symbol: string, label: string): Matter.Body {
    const body = Bodies.circle(x, y, radius, { restitution: 0.98, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0013, render: { fillStyle, strokeStyle: "#ffffff", lineWidth: 4 * geometry.scale } as any });
    (body as any).plugin = createDropPlugin(kind, x, y, radius, { symbol, shapeName: label });
    return body;
}

function createTinyFragment(x: number, y: number, baseRadius: number, color: string): Matter.Body {
    const radius = Math.max(2, baseRadius / 10);
    const sides = 3 + Math.floor(appRandom() * 5);
    const body = Bodies.polygon(x, y, sides, radius, { restitution: 0.9, friction: 0.001, frictionStatic: 0, frictionAir: 0.01, density: 0.0008, render: { fillStyle: color, strokeStyle: "rgba(255,255,255,0.95)", lineWidth: 1 } as any });
    (body as any).plugin = { isDecoration: true, kind: "fragment" };
    Body.setVelocity(body, { x: (appRandom() - 0.5) * 14 * geometry.scale, y: -8 * geometry.scale - appRandom() * 8 * geometry.scale });
    Body.setAngularVelocity(body, (appRandom() - 0.5) * 0.7);
    return body;
}

function explodeStuckDrop(body: Matter.Body): void {
    const plugin = (body as any).plugin;
    const originalRadius = plugin?.originalRadius ?? body.circleRadius ?? geometry.ballRadius;
    const kind = plugin?.kind ?? "unknown";
    const color = (body.render as any)?.fillStyle ?? randomColor();

    if (!settings.simpleMode) {
        const label = kind === "giant" ? "巨大玉 分裂" : kind === "shape" ? "図形 分裂" : "詰まり分裂";
        addFloatingText(label, body.position.x, body.position.y - 20 * geometry.scale, "#ff66aa");
        triggerCameraShake(12 * geometry.scale, 280);
    }
    if (settings.simpleMode) return;

    const fragmentCount = kind === "giant" ? 28 : 16 + Math.floor(appRandom() * 10);
    for (let i = 0; i < fragmentCount; i++) Composite.add(engine.world, createTinyFragment(body.position.x + (appRandom() - 0.5) * originalRadius, body.position.y + (appRandom() - 0.5) * originalRadius, originalRadius, color));
}

function createDrop(): Matter.Body {
    const visibleLeft = geometry.binLeft + geometry.visibleStart * geometry.binWidth;
    const visibleRight = geometry.binLeft + (geometry.visibleStart + settings.binCount) * geometry.binWidth;
    const x = visibleLeft + appRandom() * (visibleRight - visibleLeft);
    const startY = clamp(35 * geometry.scale, 20, 80);

    let kind: DropKind = "normal";
    let radius = geometry.ballRadius;
    let fillStyle = randomColor();
    let restitution = 0.8;
    let density = 0.001;
    let isShape = false;
    let isHeart = false;
    let symbol = "";
    let label = "";
    let normalTrait: NormalBallTraitDef | null = null;

    if (activeWorldMode === "poseidon") {
        fillStyle = ["#2a6dff", "#00a8ff", "#67d1ff"][Math.floor(appRandom() * 3)] ?? "#2a6dff";
        symbol = "海";
    } else if (activeWorldMode === "zeusu") {
        fillStyle = ["#ffd400", "#fff176", "#ffb300"][Math.floor(appRandom() * 3)] ?? "#ffd400";
        symbol = appRandom() < 0.55 ? "⚡" : "雷";
    } else if (activeWorldMode === "hadesu") {
        fillStyle = ["#090909", "#232323", "#3a3a3a"][Math.floor(appRandom() * 3)] ?? "#111";
        symbol = appRandom() < 0.45 ? "☠" : "死";
    } else if (activeWorldMode === "heart") {
        fillStyle = ["#ff5fb5", "#ff8ec9", "#ffb7de"][Math.floor(appRandom() * 3)] ?? "#ff5fb5";
        symbol = "♥";
    } else if (activeWorldMode === "nekochan") {
        fillStyle = ["#ffb36b", "#ffd7b0", "#ffc18d"][Math.floor(appRandom() * 3)] ?? "#ffb36b";
        symbol = appRandom() < 0.5 ? "猫" : "🐾";
    }

    if (giantStock > 0) {
        giantStock--;
        kind = "giant";
        radius = geometry.ballRadius * 2.4;
        fillStyle = "#1f2430";
        restitution = 0.95;
        density = 0.0028;
        giantCreated++;
    } else {
        const special = rollSpecialEvent();
        if (special) {
            kind = special.kind;
            radius = Math.max(geometry.ballRadius * special.radiusScale, isMobile ? 22 : 20 * geometry.scale);
            fillStyle = special.fillStyle;
            symbol = special.symbol;
            label = special.label;
            restitution = special.kind === "blackSun" ? 0.9 : 0.98;
            density = special.kind === "labExplosion" ? 0.0019 : 0.0013;
            isHeart = special.kind === "heart";
            incrementSpecialCreated(special.kind);
            repeatedMiracleRunCounts[special.kind] = (repeatedMiracleRunCounts[special.kind] ?? 0) + 1;
            recordSpecialDiscovery(special);
            showMiracle(special.kind, special.symbol, `[${special.rank}] ${formatProbability(special.denominator)}`, buildWeirdMiracleText(special));
        } else {
            const shapeRoll = appRandom();
            if (shapeRoll < SHAPE_RATE * getProbabilityScale()) { kind = "shape"; radius = geometry.ballRadius * clamp(0.85 + appRandom() * 0.35, 0.85, 1.2); fillStyle = randomColor(); isShape = true; shapeCreated++; }
            else {
                const rareRoll = appRandom();
                if (rareRoll < RAINBOW_RATE * getProbabilityScale()) { kind = "rainbow"; radius = geometry.ballRadius * 1.55; fillStyle = "hsl(295, 100%, 70%)"; restitution = 1.0; density = 0.0016; rainbowCreated++; }
                else if (rareRoll < (RAINBOW_RATE + GOLD_RATE) * getProbabilityScale()) { kind = "gold"; radius = geometry.ballRadius * 1.3; fillStyle = "#ffd700"; restitution = 0.92; density = 0.0014; goldCreated++; }
            }
        }
    }
    if (kind === "normal") {
        normalTrait = rollNormalBallTrait();
        if (normalTrait) {
            radius *= normalTrait.radiusScale;
            restitution = normalTrait.restitution;
            density = normalTrait.density;
        }
    }
    const renderOptions: any = { fillStyle, strokeStyle: normalTrait?.strokeStyle ?? "rgba(255,255,255,0.85)", lineWidth: kind === "normal" ? (normalTrait ? 2.5 * geometry.scale : 1 * geometry.scale) : 3 * geometry.scale };
    if (normalTrait?.kind === "ghost") renderOptions.opacity = 0.42;
    if (kind === "gold") { renderOptions.strokeStyle = "#fff4a8"; renderOptions.lineWidth = 3 * geometry.scale; }
    if (kind === "rainbow") { renderOptions.strokeStyle = "#ffffff"; renderOptions.lineWidth = 3 * geometry.scale; }
    if (kind === "heart") { renderOptions.fillStyle = "#ff69b4"; renderOptions.strokeStyle = "#ffe0f0"; renderOptions.lineWidth = 4 * geometry.scale; }
    if (kind === "blackSun") { renderOptions.strokeStyle = "#ff0044"; renderOptions.lineWidth = 5 * geometry.scale; }
    if (kind === "timeRift") { renderOptions.strokeStyle = "#00e5ff"; renderOptions.lineWidth = 5 * geometry.scale; }
    if (kind === "labExplosion") { renderOptions.strokeStyle = "#fff3b0"; renderOptions.lineWidth = 6 * geometry.scale; }
    if (kind === "cosmicEgg") { renderOptions.strokeStyle = "#ffffff"; renderOptions.lineWidth = 6 * geometry.scale; }
    if (activeWorldMode === "poseidon") { renderOptions.strokeStyle = "#d7f2ff"; renderOptions.lineWidth = 3.5 * geometry.scale; }
    if (activeWorldMode === "zeusu") { renderOptions.strokeStyle = "#fff7b0"; renderOptions.lineWidth = 3.8 * geometry.scale; }
    if (activeWorldMode === "hadesu") { renderOptions.strokeStyle = "#ff4a4a"; renderOptions.lineWidth = 3.8 * geometry.scale; }
    if (activeWorldMode === "heart") { renderOptions.strokeStyle = "#ffe3f2"; renderOptions.lineWidth = 3.8 * geometry.scale; }
    if (activeWorldMode === "nekochan") { renderOptions.strokeStyle = "#fff3e4"; renderOptions.lineWidth = 3.8 * geometry.scale; }

    let body: Matter.Body;
    if (findSpecialDef(kind) && kind !== "heart") body = createSymbolBody(x, startY, radius, kind, fillStyle, symbol, label);
    else if (isHeart) body = createHeartBody(x, startY, radius, renderOptions);
    else if (isShape) body = createRandomShapeBody(x, startY, radius, renderOptions);
    else {
        body = Bodies.circle(x, startY, radius, { restitution, friction: 0.01, frictionAir: normalTrait?.frictionAir ?? 0.002, density, render: renderOptions });
        (body as any).plugin = createDropPlugin(kind, x, startY, radius, normalTrait ? { traitKind: normalTrait.kind, traitLabel: normalTrait.label, traitMark: normalTrait.mark } : {});
    }

    const traitVX = normalTrait?.kind === "sprinter" ? (appRandom() < 0.5 ? -1 : 1) * (3.2 + appRandom() * 2.4) * geometry.scale : 0;
    Body.setVelocity(body, { x: (appRandom() - 0.5) * 2 * geometry.scale + traitVX, y: normalTrait?.kind === "sleepy" ? -0.6 * geometry.scale : 0 });
    Body.setAngularVelocity(body, normalTrait?.kind === "spinner" ? (appRandom() < 0.5 ? -1 : 1) * (0.55 + appRandom() * 0.35) : (appRandom() - 0.5) * 0.22);

    if (normalTrait && appRandom() < 0.08) {
        addFloatingText(normalTrait.label, x, 78 * geometry.scale, normalTrait.strokeStyle);
        maybeShowCommentary(`実況「${normalTrait.label} が混ざりました」`);
    }
    if (kind === "gold") addFloatingText("金玉投入", x, 80 * geometry.scale, "#d89b00");
    if (kind === "rainbow") { addFloatingText("虹玉投入", x, 80 * geometry.scale, "#b44cff"); triggerCameraShake(5 * geometry.scale, 180); }
    if (kind === "giant") { addFloatingText("巨大玉投入", x, 90 * geometry.scale, "#111111"); triggerCameraShake(10 * geometry.scale, 260); }
    if (kind === "shape") { addFloatingText(`${(body as any).plugin?.shapeName ?? "謎図形"} 投入`, x, 80 * geometry.scale, fillStyle); triggerCameraShake(5 * geometry.scale, 140); }
    if (kind === "heart") { addFloatingText("奇跡の桃色ハート", x, 85 * geometry.scale, "#ff69b4"); triggerCameraShake(18 * geometry.scale, 420); }
    if (findSpecialDef(kind)) { addFloatingText(`${label} 投入`, x, 85 * geometry.scale, fillStyle); triggerCameraShake(kind === "cosmicEgg" || kind === "labExplosion" ? 34 * geometry.scale : 18 * geometry.scale, kind === "cosmicEgg" || kind === "labExplosion" ? 900 : 400); }

    activeDropCount++;
    return body;
}

// ======================================================
// Interaction / effects / libraries
// ======================================================

function screenToWorld(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * geometry.width, y: ((event.clientY - rect.top) / rect.height) * geometry.height };
}

function activateNearestPin(event: PointerEvent): void {
    const point = screenToWorld(event);
    let nearest: Matter.Body | null = null;
    let nearestDistance = Infinity;
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isPin) continue;
        const distance = Math.hypot(body.position.x - point.x, body.position.y - point.y);
        if (distance < nearestDistance) { nearest = body; nearestDistance = distance; }
    }
    const tapRadius = Math.max(34 * geometry.scale, geometry.pinRadius * 4.5);
    if (!nearest || nearestDistance > tapRadius) return;

    const plugin = (nearest as any).plugin;
    plugin.wiggleFrames = 46;

    for (const body of engine.world.bodies) {
        const p = (body as any).plugin;
        if (!p?.isDrop) continue;
        const distance = Math.hypot(body.position.x - nearest.position.x, body.position.y - nearest.position.y);
        if (distance < tapRadius * 3) {
            Body.setVelocity(body, { x: (body.position.x - nearest.position.x) * 0.08 + (appRandom() - 0.5) * 8 * geometry.scale, y: -5 * geometry.scale });
            Body.setAngularVelocity(body, (appRandom() - 0.5) * 0.5);
        }
    }

    addFloatingText("ピン揺れ", nearest.position.x, nearest.position.y - 20 * geometry.scale, "#00aaff");
    triggerCameraShake(3 * geometry.scale, 100);
}

function updatePinWiggles(): void {
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isPin || !plugin.wiggleFrames) continue;
        const t = plugin.wiggleFrames;
        const power = (t / 46) * 10 * geometry.scale;
        Body.setPosition(body, { x: plugin.baseX + Math.sin(t * 0.85) * power, y: plugin.baseY + Math.cos(t * 0.7) * power * 0.25 });
        plugin.wiggleFrames--;
        if (plugin.wiggleFrames <= 0) { Body.setPosition(body, { x: plugin.baseX, y: plugin.baseY }); plugin.wiggleFrames = 0; }
    }
}

function addFloatingText(text: string, x: number, y: number, color: string): void {
    if (settings.simpleMode) return;
    floatingTexts.push({ text, x, y, life: 60, maxLife: 60, color });
}

function rollNormalBallTrait(): NormalBallTraitDef | null {
    const scale = settings.probabilityMode === "festival" ? 1.25 : settings.probabilityMode === "hell" ? 0.75 : 1;
    let roll = appRandom();
    for (const trait of NORMAL_BALL_TRAITS) {
        roll -= trait.rate * scale;
        if (roll <= 0) return trait;
    }
    return null;
}

function getNormalTraitSummaryHtml(): string {
    return NORMAL_BALL_TRAITS.map((trait) => `<li><b>${trait.label}</b>: ${trait.description}</li>`).join("");
}

function maybeShowCommentary(text?: string, force = false): void {
    if (settings.simpleMode) return;
    if (!force && (!isStarted || isFinished || isPaused || isMiraclePaused)) return;
    const now = Date.now();
    if (!force && now - lastCommentaryAt < COMMENTARY_MIN_INTERVAL_MS) return;
    if (!force && appRandom() > 0.018) return;
    const candidates = [
        "研究員A「いまの玉、ちょっと性格ありますね」",
        "観測装置「乱数の温度は正常です。たぶん。」",
        "研究員B「捨て区間の顔色をうかがっています」",
        "実況「盤面が静かにざわついています」",
        "ねこ研究員「にゃーん。記録しました。」",
        "観測装置「奇跡濃度、微量に上昇」",
        "研究員A「この実験、見た目よりだいぶ騒がしいです」",
        "実況「通常玉にも妙な個体差が出ています」",
    ];
    const message = text || candidates[Math.floor(appRandom() * candidates.length)] || candidates[0];
    lastCommentaryAt = now;
    if (commentaryTimer !== undefined) window.clearTimeout(commentaryTimer);
    commentaryOverlay.innerHTML = `<div style="position:absolute;white-space:nowrap;left:100vw;bottom:0;padding:4px 16px;border-radius:999px;background:rgba(15,23,42,.74);color:#fff;font-weight:900;font-size:${isMobile ? "18px" : "16px"};line-height:1.4;text-shadow:0 2px 8px rgba(0,0,0,.45);box-shadow:0 8px 22px rgba(0,0,0,.22);transition:transform ${COMMENTARY_DISPLAY_MS}ms linear;">${message}</div>`;
    commentaryOverlay.style.display = "block";
    const line = commentaryOverlay.firstElementChild as HTMLElement | null;
    if (line) {
        window.requestAnimationFrame(() => {
            line.style.transform = "translateX(calc(-100vw - 100% - 32px))";
        });
    }
    commentaryTimer = window.setTimeout(() => {
        commentaryOverlay.style.display = "none";
        commentaryOverlay.innerHTML = "";
    }, COMMENTARY_DISPLAY_MS + 300);
}

function triggerCameraShake(power: number, durationMs: number): void {
    if (settings.simpleMode) return;
    if (!settings.cameraShakeEnabled) return;
    shakePower = Math.max(shakePower, power);
    shakeUntil = Math.max(shakeUntil, Date.now() + durationMs);
}

function updateCameraShake(): void {
    if (settings.simpleMode || !settings.cameraShakeEnabled) { canvas.style.transform = "translate(0,0)"; shakePower = 0; return; }
    const now = Date.now();
    if (now < shakeUntil) {
        const ratio = (shakeUntil - now) / 180;
        const power = shakePower * clamp(ratio, 0, 1);
        canvas.style.transform = `translate(${(appRandom() - 0.5) * power}px, ${(appRandom() - 0.5) * power}px)`;
    } else { canvas.style.transform = "translate(0,0)"; shakePower = 0; }
}

function showMilestone(text: string): void {
    // 黄色の小さい達成POPUPは画面中央の演出と重なるため非表示にする。
    // CSVコピーなどの軽い通知も、邪魔にならないようにここでは表示しない。
    void text;
}

function pickCelebrationEffect(): { name: string; icon: string } {
    const icons = ["🎆", "💥", "🌊", "🎂", "👍", "⚡", "🐶", "🐱", "⭐", "🔥", "🪐", "🎉", "🌈", "🦊", "🐸", "🦄", "🍀", "🍙", "🍜", "🍤", "🍣", "🥁", "🎺", "🎸", "🪩", "🛸", "🚀", "🌋", "🗿", "👺", "🥷", "🧊", "🫧", "🌪️", "☄️", "🌕", "🌞", "🦖", "🐉", "🦕"];
    const prefixes = ["大", "超", "激", "謎", "夢", "夜", "朝", "山", "海", "森", "宇宙", "古代", "未来", "昭和", "平成", "令和", "無音", "爆速", "低速", "ぬるぬる"];
    const suffixes = ["花火", "爆発", "祭り", "旋風", "波動", "祝福", "行進", "ダンス", "点滅", "ジャンプ", "拍手", "覚醒", "降臨", "乱舞", "パレード", "お祝い", "びっくり", "フィーバー", "チャンス", "ミラクル"];
    const i = Math.floor(appRandom() * icons.length);
    const prefix = prefixes[Math.floor(appRandom() * prefixes.length)];
    const suffix = suffixes[Math.floor(appRandom() * suffixes.length)];
    return { icon: icons[i], name: `${prefix}${suffix}` };
}

function showFullScreenCelebration(count: number): void {
    if (settings.simpleMode) return;
    vibrateOnMobile([35, 20, 35]);
    fireConfetti("normal");
    const effect = pickCelebrationEffect();
    celebrationOverlay.innerHTML = `
        <div style="position:absolute;inset:0;background:${randomRgba(0.45)};backdrop-filter:blur(4px);"></div>
        <div style="position:relative;z-index:2;padding:30px;border-radius:30px;background:rgba(255,255,255,0.22);box-shadow:0 24px 70px rgba(0,0,0,0.32);animation:celeb-main-pop 2s ease-out forwards;">
            <style>@keyframes celeb-main-pop{0%{transform:scale(.72);opacity:0}18%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:0}}</style>
            <div style="font-size:clamp(70px,17vw,180px);line-height:1;">${effect.icon}</div>
            <div style="margin-top:14px;font-size:clamp(30px,8vw,96px);font-weight:900;color:white;text-shadow:0 6px 22px rgba(0,0,0,.45);">${count.toLocaleString()}回達成！</div>
            <div style="margin-top:8px;font-size:clamp(20px,4vw,46px);font-weight:800;color:white;text-shadow:0 4px 16px rgba(0,0,0,.42);">${effect.name} 演出</div>
        </div>`;
    celebrationOverlay.style.display = "flex";
    window.setTimeout(() => { celebrationOverlay.style.display = "none"; celebrationOverlay.innerHTML = ""; }, 2100);
}


function getMiracleIconHtml(kind: DropKind, fallbackSymbol: string): string {
    const def = findSpecialDef(kind);
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

async function playAnimeMiracleEffect(def?: SpecialEventDef): Promise<void> {
    if (settings.simpleMode) return;
    const ok = await ensureAnimeReady();
    if (!ok) return;
    const overlayCard = miracleOverlay.firstElementChild as HTMLElement | null;
    if (!overlayCard) return;
    const strength = def?.rank === "GOD" ? 1.35 : def?.rank === "EX" ? 1.18 : 1;
    const isRepeatedQuickRare = !!def && (repeatedMiracleRunCounts[def.kind] ?? 0) >= 2 && (def.rank === "SR" || def.rank === "SSR");
    const isQuickRare = isRepeatedQuickRare || def?.rank === "SR" || def?.rank === "SSR";
    anime.remove([overlayCard, canvas, gameArea]);
    anime({
        targets: gameArea,
        scale: [1, 1.018 * strength, 1],
        duration: isRepeatedQuickRare ? 180 : isQuickRare ? 360 : 900,
        easing: "easeOutQuad",
    });
    anime.timeline({ easing: "easeOutExpo" })
        .add({
            targets: overlayCard,
            scale: [0.72, 1.06, 1],
            opacity: [0, 1],
            rotate: [-2.2 * strength, 0],
            duration: isRepeatedQuickRare ? 130 : isQuickRare ? 240 : 620,
        }, 0)
        .add({
            targets: overlayCard,
            translateY: [0, -8 * strength, 0],
            duration: isRepeatedQuickRare ? 180 : isQuickRare ? 320 : 1200,
            easing: "easeInOutSine",
        }, isQuickRare ? 80 : 140)
        .add({
            targets: canvas,
            scale: [1, 1.028 * strength, 1],
            duration: isRepeatedQuickRare ? 180 : isQuickRare ? 320 : 780,
            easing: "easeOutBack",
        }, 0);
}


function speakLifeQuoteEvent(): void {
    const text = "ふふっ、自分の人生で言葉に出来ない程の感動する感情に出会えたらどんに辛いことがあってもまたこの人生をやりたいと思えるらしい";
    if (lifeQuoteOverlayTimer !== undefined) window.clearTimeout(lifeQuoteOverlayTimer);
    subtitleOverlay.innerHTML = `<div style="font-size:${isMobile ? "26px" : "34px"};font-weight:1000;line-height:1.7;text-shadow:0 3px 18px rgba(0,0,0,.55);">${text}</div>`;
    subtitleOverlay.style.display = "block";
    subtitleOverlay.style.left = "50%";
    subtitleOverlay.style.right = "";
    subtitleOverlay.style.bottom = "50%";
    subtitleOverlay.style.transform = "translate(-50%, 50%)";
    subtitleOverlay.style.width = "min(96vw, 1200px)";
    subtitleOverlay.style.maxWidth = "min(96vw, 1200px)";
    subtitleOverlay.style.padding = isMobile ? "22px 18px" : "28px 30px";
    subtitleOverlay.style.borderRadius = "24px";
    subtitleOverlay.style.background = "rgba(0,0,0,.72)";

    let duration = 8800;
    try {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = "ja-JP";
            utter.rate = 0.95;
            utter.pitch = 1.55;
            utter.volume = soundEnabled ? 1 : 0.8;
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find((v) => /ja-JP/i.test(v.lang) && /(female|kyoko|haruka|sakura|Google 日本語|Microsoft.*Haruka)/i.test(v.name))
                || voices.find((v) => /ja-JP/i.test(v.lang));
            if (preferred) utter.voice = preferred;
            utter.onend = () => {
                subtitleOverlay.style.display = "none";
                subtitleOverlay.textContent = "";
                subtitleOverlay.style.bottom = isMobile ? "104px" : "28px";
                subtitleOverlay.style.transform = "translateX(-50%)";
                subtitleOverlay.style.width = "";
                subtitleOverlay.style.maxWidth = "min(92vw, 960px)";
                subtitleOverlay.style.padding = isMobile ? "12px 18px" : "10px 18px";
            };
            window.speechSynthesis.speak(utter);
            duration = 11000;
        }
    } catch {}
    lifeQuoteOverlayTimer = window.setTimeout(() => {
        subtitleOverlay.style.display = "none";
        subtitleOverlay.textContent = "";
        subtitleOverlay.style.bottom = isMobile ? "104px" : "28px";
        subtitleOverlay.style.transform = "translateX(-50%)";
        subtitleOverlay.style.width = "";
        subtitleOverlay.style.maxWidth = "min(92vw, 960px)";
        subtitleOverlay.style.padding = isMobile ? "12px 18px" : "10px 18px";
    }, duration);
}

function showMiracle(kind: DropKind, symbol: string, probabilityText: string, feelingText: string): void {
    const def = findSpecialDef(kind);
    if (def) {
        pauseForMiracle(def);
        updateMiracleCombo();
        addMiracleLog(def);
        recordMiracleForChains(def.kind);
        tryTriggerMiracleChains();
        const subtitle = `${def.label} ${t("発生", "appeared")} / [${def.rank}] ${formatProbability(def.denominator)}`;
        if (kind === "lifeQuoteMode") speakLifeQuoteEvent();
        else setSubtitle(subtitle);
        saveMiracleClip(def, subtitle);
        applyRareBackground(kind);
    }
    triggerScreenFlash(def?.soundMode ?? "miracle");
    vibrateOnMobile(def?.rank === "GOD" ? [90, 50, 160, 60, 220] : def?.rank === "EX" ? [70, 40, 120, 40, 140] : [55, 28, 80]);
    triggerCameraShake(def?.rank === "GOD" ? 46 * geometry.scale : def?.rank === "EX" ? 34 * geometry.scale : 18 * geometry.scale, def?.rank === "GOD" ? 1200 : def?.rank === "EX" ? 760 : 420);
    if (settings.simpleMode) return;
    const repeatedInRun = !!def && (repeatedMiracleRunCounts[def.kind] ?? 0) >= 2;
    const overlayDurationMs = getMiraclePauseDuration(def, repeatedInRun);
    const overlayDurationSec = Math.max(0.24, overlayDurationMs / 1000);
    miracleOverlay.innerHTML = `
        <div style="max-width:900px;animation:miracle-pop ${overlayDurationSec.toFixed(2)}s ease-out forwards;">
            <style>@keyframes miracle-pop{0%{transform:scale(.65);opacity:0}15%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:0}}</style>
            ${getMiracleIconHtml(kind, symbol)}
            <div style="font-size:clamp(36px,8vw,90px);font-weight:900;margin-top:12px;text-shadow:0 8px 30px rgba(0,0,0,.6);">${def?.label ?? "奇跡"} 発生</div>
            <div style="font-size:clamp(22px,4vw,44px);font-weight:900;margin-top:12px;">${probabilityText}</div>
            <div style="font-size:clamp(18px,3vw,32px);margin-top:12px;opacity:.94;line-height:1.5;">${feelingText}</div>
            ${miracleCombo >= 2 ? `<div style="margin-top:10px;font-size:clamp(20px,4vw,40px);font-weight:900;color:#ffe560;">${t("奇跡コンボ", "Miracle combo")} x${miracleCombo}</div>` : ""}
            ${repeatedInRun && (def?.rank === "SR" || def?.rank === "SSR") ? `<div style="margin-top:8px;font-size:clamp(16px,3vw,26px);font-weight:900;color:#bbf7d0;">同じSR/SSRのため短縮演出</div>` : ""}
        </div>`;
    if (miracleOverlayTimer !== undefined) {
        window.clearTimeout(miracleOverlayTimer);
        miracleOverlayTimer = undefined;
    }
    miracleOverlay.style.display = "flex";
    void playAnimeMiracleEffect(def);
    fireConfetti(kind === "blackSun" ? "black" : kind === "cosmicEgg" ? "cosmic" : "miracle");
    playSpecialSound(kind);
    startMiracleOverlayTimer(overlayDurationMs + 120);
}

function getSoundVolume(base = -8): number {
    return base + (isMobile ? -4 : 0);
}

function playUiSound(kind: "start" | "pause" | "resume" | "open" | "close" | "tick" | "skill" | "time"): void {
    if (!soundEnabled || !toneReady || settings.simpleMode) return;
    try {
        const now = Tone.now();
        const synth = new Tone.Synth({
            oscillator: { type: kind === "time" ? "sine" : kind === "skill" ? "triangle" : "square" },
            envelope: { attack: 0.002, decay: 0.06, sustain: 0.05, release: 0.12 },
        }).toDestination();
        synth.volume.value = getSoundVolume(kind === "tick" ? -18 : -14);
        const notes: Record<string, string[]> = {
            start: ["C5", "E5", "G5"],
            pause: ["E4", "C4"],
            resume: ["C4", "E4"],
            open: ["G4", "B4"],
            close: ["B4", "G4"],
            tick: ["C6"],
            skill: ["D5", "A5"],
            time: ["F4", "C5", "F5"],
        };
        notes[kind].forEach((note, index) => synth.triggerAttackRelease(note, "32n", now + index * 0.055));
        window.setTimeout(() => synth.dispose(), 650);
    } catch {}
}

function playSecretSound(): void {
    if (!soundEnabled || !toneReady || settings.simpleMode) return;
    try {
        const now = Tone.now();
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "fatsawtooth" },
            envelope: { attack: 0.01, decay: 0.18, sustain: 0.18, release: 0.42 },
        }).toDestination();
        synth.volume.value = getSoundVolume(-9);
        ["C4", "E4", "G4", "B4", "D5", "G5"].forEach((note, i) => synth.triggerAttackRelease(note, i < 4 ? "16n" : "8n", now + i * 0.075));
        const noise = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.13, sustain: 0 } }).toDestination();
        noise.volume.value = -22;
        noise.triggerAttackRelease("16n", now + 0.08);
        window.setTimeout(() => { synth.dispose(); noise.dispose(); }, 1200);
    } catch {}
}
function updateSoundButton(): void {
    soundButton.textContent = soundEnabled ? t("音: ON", "Sound: ON") : t("音: OFF", "Sound: OFF");
}


async function enableSound(showNotice = true): Promise<void> {
    try {
        await Tone.start();
        toneReady = true;
        soundEnabled = true;
        updateSoundButton();
        if (showNotice) {
            showMilestone(t("音ON", "Sound ON"));
            window.setTimeout(() => playUiSound("start"), 30);
        }
    } catch {
        soundButton.textContent = t("音: 読込失敗", "Sound: Load failed");
    }
}

async function toggleSound(): Promise<void> {
    if (soundEnabled) {
        soundEnabled = false;
        updateSoundButton();
        showMilestone(t("音OFF", "Sound OFF"));
        return;
    }
    soundEnabled = true;
    updateSoundButton();
    await enableSound(true);
}

function getRareSoundFlavor(kind: DropKind): RareSoundFlavor {
    const def = findSpecialDef(kind);
    if (def?.rank === "GOD") return "god";
    if (def?.rank === "EX") return "ex";
    if (def?.rank === "UR") return "ur";
    return "normal";
}

function createRareSequence(flavor: RareSoundFlavor): Array<{ note: string; duration: string; at: number }> {
    const roll = Math.random();
    if (flavor === "god") {
        const patterns = [
            [{ note: "C4", duration: "8n", at: 0 }, { note: "G4", duration: "8n", at: 0.10 }, { note: "C5", duration: "8n", at: 0.22 }, { note: "E5", duration: "4n", at: 0.36 }, { note: "G5", duration: "2n", at: 0.60 }],
            [{ note: "A3", duration: "8n", at: 0 }, { note: "E4", duration: "8n", at: 0.10 }, { note: "A4", duration: "8n", at: 0.22 }, { note: "C5", duration: "8n", at: 0.34 }, { note: "E5", duration: "2n", at: 0.52 }],
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }
    if (flavor === "ex") {
        if (roll < 0.5) return [{ note: "D4", duration: "16n", at: 0 }, { note: "A4", duration: "16n", at: 0.08 }, { note: "D5", duration: "8n", at: 0.16 }, { note: "F5", duration: "8n", at: 0.28 }];
        return [{ note: "G3", duration: "16n", at: 0 }, { note: "B3", duration: "16n", at: 0.08 }, { note: "D4", duration: "8n", at: 0.16 }, { note: "G4", duration: "4n", at: 0.28 }];
    }
    if (flavor === "ur") {
        if (roll < 0.34) return [{ note: "C5", duration: "16n", at: 0 }, { note: "E5", duration: "16n", at: 0.07 }, { note: "G5", duration: "8n", at: 0.14 }];
        if (roll < 0.67) return [{ note: "F4", duration: "16n", at: 0 }, { note: "A4", duration: "16n", at: 0.07 }, { note: "C5", duration: "8n", at: 0.14 }];
        return [{ note: "G4", duration: "16n", at: 0 }, { note: "B4", duration: "16n", at: 0.07 }, { note: "D5", duration: "8n", at: 0.14 }];
    }
    return [{ note: "G5", duration: "8n", at: 0 }];
}

async function playLocalRareAudio(flavor: RareSoundFlavor): Promise<boolean> {
    const candidates = flavor === "god" ? LOCAL_GOD_AUDIO_FILES : LOCAL_RARE_AUDIO_FILES;
    if (!candidates.length) return false;
    const src = candidates[Math.floor(Math.random() * candidates.length)];
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = flavor === "god" ? 0.95 : 0.85;
    try {
        await audio.play();
        return true;
    } catch {
        return false;
    }
}

function playSpecialSound(kind: DropKind): void {
    if (!soundEnabled || !toneReady || settings.simpleMode) return;
    try {
        const flavor = getRareSoundFlavor(kind);
        void playLocalRareAudio(flavor);
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: flavor === "god" ? "square8" : flavor === "ex" ? "sawtooth" : "triangle" },
            envelope: { attack: 0.005, decay: 0.14, sustain: 0.18, release: 0.35 },
        }).toDestination();
        synth.volume.value = getSoundVolume(flavor === "god" ? -5 : flavor === "ex" ? -7 : -9);
        const now = Tone.now();
        if (flavor === "god" || flavor === "ex") {
            const bass = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 4, envelope: { attack: 0.001, decay: 0.38, sustain: 0.02, release: 0.5 } }).toDestination();
            bass.volume.value = getSoundVolume(flavor === "god" ? -7 : -11);
            bass.triggerAttackRelease(flavor === "god" ? "C2" : "D2", "8n", now);
            window.setTimeout(() => bass.dispose(), 1200);
        }
        const sequence = createRareSequence(flavor);
        for (const step of sequence) synth.triggerAttackRelease(step.note, step.duration, now + step.at);
        if (kind === "giant") synth.triggerAttackRelease("C2", "8n", now);
        if (kind === "blackSun" || kind === "cosmicEgg" || kind === "labExplosion") {
            const noise = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.01, decay: 0.28, sustain: 0 } }).toDestination();
            noise.volume.value = -12;
            noise.triggerAttackRelease("8n", now + 0.02);
            window.setTimeout(() => noise.dispose(), 700);
        }
        window.setTimeout(() => synth.dispose(), 1800);
    } catch {
        // 音は補助機能なので失敗しても止めない
    }
}

async function ensureConfetti(): Promise<boolean> {
    return true;
}

async function fireConfetti(mode: "normal" | "miracle" | "black" | "cosmic" = "normal"): Promise<void> {
    if (settings.simpleMode || !confettiEnabled) return;
    const ok = await ensureConfetti();
    if (!ok) return;
    const colors = mode === "cosmic" ? ["#240038", "#7c3cff", "#ffffff", "#00e5ff", "#ffd700"] : mode === "black" ? ["#000000", "#ff0044", "#ffffff"] : mode === "miracle" ? ["#ffd700", "#ff69b4", "#78e7ff", "#ffffff"] : undefined;
    const mainCount = mode === "cosmic" ? 420 : mode === "normal" ? 90 : 220;
    const sideCount = mode === "cosmic" ? 220 : mode === "normal" ? 50 : 120;
    confetti({ particleCount: mainCount, spread: mode === "normal" ? 70 : 140, origin: { y: 0.55 }, colors });
    confetti({ particleCount: sideCount, angle: 60, spread: 80, origin: { x: 0, y: 0.65 }, colors });
    confetti({ particleCount: sideCount, angle: 120, spread: 80, origin: { x: 1, y: 0.65 }, colors });
}

async function togglePixiBackground(): Promise<void> {
    pixiEnabled = !pixiEnabled;
    pixiButton.textContent = pixiEnabled ? t("Pixi背景: ON", "Pixi BG: ON") : t("Pixi背景: OFF", "Pixi BG: OFF");
    if (pixiEnabled) {
        await initPixiBackground();
        if (pixiApp) (pixiApp.canvas as HTMLCanvasElement).style.display = "block";
    } else if (pixiApp) (pixiApp.canvas as HTMLCanvasElement).style.display = "none";
}

async function initPixiBackground(): Promise<void> {
    if (pixiReady) return;
    try {
        pixiApp = new Application();
        await pixiApp.init({ resizeTo: gameArea, backgroundAlpha: 0, antialias: true });
        const pixiCanvas = pixiApp.canvas as HTMLCanvasElement;
        pixiCanvas.style.position = "absolute";
        pixiCanvas.style.inset = "0";
        pixiCanvas.style.width = "100%";
        pixiCanvas.style.height = "100%";
        pixiCanvas.style.pointerEvents = "none";
        pixiLayer.appendChild(pixiCanvas);
        pixiParticles = [];
        for (let i = 0; i < 26; i++) {
            const g = new Graphics();
            const hue = i % 2 === 0 ? 0xffe060 : 0x9dd6ff;
            g.circle(0, 0, 5 + Math.random() * 9).fill({ color: hue, alpha: 0.20 + Math.random() * 0.22 });
            g.x = Math.random() * gameArea.clientWidth;
            g.y = Math.random() * gameArea.clientHeight;
            (g as any).vx = -0.2 + Math.random() * 0.4;
            (g as any).vy = 0.3 + Math.random() * 1.0;
            (g as any).drift = Math.random() * Math.PI * 2;
            pixiApp.stage.addChild(g);
            pixiParticles.push(g);
        }
        pixiApp.ticker.add(() => {
            if (!pixiEnabled) return;
            for (const p of pixiParticles) {
                (p as any).drift += 0.02;
                p.x += (p as any).vx + Math.sin((p as any).drift) * 0.3;
                p.y += (p as any).vy;
                if (p.y > gameArea.clientHeight + 20) { p.y = -20; p.x = Math.random() * gameArea.clientWidth; }
                if (p.x < -20) p.x = gameArea.clientWidth + 20;
                if (p.x > gameArea.clientWidth + 20) p.x = -20;
            }
        });
        pixiReady = true;
    } catch {
        pixiEnabled = false;
        pixiButton.textContent = t("Pixi背景: 読込失敗", "Pixi BG: Load failed");
    }
}


// ======================================================
// Count / display / CSV
// ======================================================

function getBinIndex(x: number): number {
    const physicalIndex = Math.floor((x - geometry.binLeft) / geometry.binWidth);
    if (physicalIndex < geometry.visibleStart || physicalIndex >= geometry.visibleStart + settings.binCount) return -1;
    return physicalIndex - geometry.visibleStart;
}

function updateInfo(): void {
    const now = Date.now();
    const elapsedMs = isStarted ? (targetReachedTime ?? endTime ?? now) - startTime : 0;
    if (now - lastSpeedCheckTime >= 1000 && isStarted && !isPaused && !isMiraclePaused && !isFinished) {
        const diff = finishedCount - lastSpeedCheckFinishedCount;
        const diffSec = (now - lastSpeedCheckTime) / 1000;
        speedPerSecond = diff / diffSec;
        lastSpeedCheckTime = now;
        lastSpeedCheckFinishedCount = finishedCount;
    }
    const remain = Math.max(0, settings.targetCount - finishedCount);
    const eta = speedPerSecond > 0 ? formatElapsedTime((remain / speedPerSecond) * 1000) : "-";
    const maxCount = Math.max(...binCounts, 0);
    const topIndex = binCounts.indexOf(maxCount);
    const topText = maxCount > 0 && topIndex >= 0 ? `${labels[topIndex]} (${maxCount.toLocaleString()}回)` : "-";
    const discoveredKinds = getDiscoveredCount();
    const missionDoneCount = Object.values(missionProgress).filter(Boolean).length;
    const levelInfo = getResearchLevelInfo();
    const fortune = currentDailyFortune ?? getDailyFortune();
    currentDailyFortune = fortune;
    recordHero.innerHTML = `
        <div style="font-size:${isMobile ? 24 : 22}px;">🏆 ${t("最高記録", "Best records")}</div>
        <div style="font-size:${isMobile ? 22 : 20}px;">${t("最高レア", "Best rarity")}: <b>${savedRecords.bestRank}</b> ${savedRecords.bestLabel}</div>
        <div style="font-size:${isMobile ? 20 : 18}px;">研究Lv: <b>${levelInfo.level}</b> ${levelInfo.title} / ${t("今回スコア", "Run score")}: <b>${runScore.toLocaleString()}</b></div>
        <div style="font-size:${isMobile ? 18 : 16}px;opacity:.86;">${t("実験", "Runs")} ${savedRecords.totalRuns.toLocaleString()}${t("回", "")} / ${t("最大", "Max")} ${savedRecords.maxFinishedCount.toLocaleString()}${t("玉", " balls")} / 今日 x${fortune.rateBoost.toFixed(2)}</div>
    `;

    topRow.innerHTML = `
        <div>${t("デバイス", "Device")}: <b>${isMobile ? t("スマホ向け", "Mobile") : t("PC向け", "Desktop")}</b></div>
        <div>${t("ブラウザ", "Browser")}: <b>${browserName}</b></div>
        <div>${t("実行回数", "Progress")}: <b>${finishedCount.toLocaleString()}</b> / ${settings.targetCount.toLocaleString()}</div>
        <div>${t("画面上の玉", "Balls on screen")}: <b>${activeDropCount}</b></div>
        <div>${t("速度", "Speed")}: <b>${getSpeedDisplayLabel()}</b></div>
        <div>${t("確率モード", "Probability mode")}: <b>${isEnglish ? ({normal:"Normal",festival:"Festival",hard:"Hard",hell:"Hell"} as any)[settings.probabilityMode] : getProbabilityModeLabel()}</b></div>
        <div>${t("状態", "Status")}: <b>${!isStarted ? t("待機中", "Idle") : isFinished ? t("完了", "Finished") : isMiraclePaused ? t("奇跡で停止中", "Paused by miracle") : isPaused ? t("停止中", "Paused") : targetReachedTime ? t("残り玉回収中", "Collecting remaining balls") : t("実行中", "Running")}</b></div>
        <div>${t("経過時間", "Elapsed")}: <b>${formatElapsedTime(elapsedMs)}</b></div>
        <div>${t("処理速度", "Throughput")}: <b>${Math.floor(speedPerSecond).toLocaleString()}</b> ${t("回/秒", "/sec")}</div>
        <div>${t("残り時間目安", "ETA")}: <b>${eta}</b></div>
        <div>${t("暫定1位", "Current top")}: <b>${topText}</b></div>
        <div>${t("受け皿", "Bins")}: <b>${settings.binCount}</b> ${t("+ 両端捨て区画", "+ edge discard zones")}</div>
        <div>${t("ピン段数", "Pin rows")}: <b>${settings.pinRows}</b></div>
        <div>${t("発見済み種類", "Discovered kinds")}: <b>${discoveredKinds}</b> / ${SPECIAL_EVENT_DEFS.length}</div>
        <div>研究レベル: <b>Lv.${levelInfo.level}</b> ${levelInfo.title}</div>
        <div>今日の奇跡率: <b>x${fortune.rateBoost.toFixed(2)}</b> / ${fortune.luckyKind}</div>
        <div>合成・派生: <b>${getFusionCount()}</b> / ${FUSION_DEFS.length}</div>
        <div>${t("奇跡ログ件数", "Miracle logs")}: <b>${miracleLogs.length}</b></div>
        <div>${t("スコア", "Score")}: <b>${runScore.toLocaleString()}</b></div>
        <div>${t("ミッション", "Missions")}: <b>${missionDoneCount}</b> / ${missionDefs.length}</div>
        <div>${t("スキル", "Skills")}: <b>衝${skillState.shockwave} / 磁${skillState.magnet} / 時${skillState.timeStop}</b></div>\n        <div>${t("奇跡ブースト", "Miracle boost")}: <b>x${getPassiveMiracleBoost().toFixed(2)}</b></div>
        <div>${t("縦動画", "Vertical")}: <b>${isVerticalVideoMode ? "ON" : "OFF"}</b></div>
        <div>${t("OBSモード", "OBS mode")}: <b>${isObsMode ? "ON" : "OFF"}</b></div>
        <div>${t("捨て区画", "Discarded")}: <b>${discardedCount.toLocaleString()}</b></div>
    `;
    updateRandomGraph();
}

function updateRandomGraph(): void {
    const maxBucket = Math.max(...randomBuckets, 1);
    let html = `<div style="font-weight:900;margin-bottom:6px;color:#273042;">Math.random() 直接分布</div><div style="display:grid;grid-template-columns:repeat(10,1fr);gap:6px;align-items:end;height:${Math.round(clamp(72 * geometry.scale, 54, isMobile ? 130 : 110))}px;">`;
    for (let i = 0; i < RANDOM_BUCKET_COUNT; i++) {
        const count = randomBuckets[i];
        const percent = randomCallCount > 0 ? (count / randomCallCount) * 100 : 0;
        const barHeight = Math.max(2, (count / maxBucket) * 100);
        html += `<div style="text-align:center;font-size:${Math.round(clamp(12 * geometry.scale, isMobile ? 13 : 10, isMobile ? 20 : 16))}px;"><div style="height:${barHeight}%;background:linear-gradient(180deg,#6fb0ff,#3d72ff);border-radius:7px 7px 0 0;margin:0 auto 3px auto;width:72%;box-shadow:0 3px 8px rgba(61,114,255,.25);"></div><div>${i / 10}-${(i + 1) / 10}</div><div>${percent.toFixed(1)}%</div></div>`;
    }
    html += `</div>`;
    randomGraphArea.innerHTML = html;
}

function buildResultCsv(): string {
    const rows: Array<Array<string | number>> = [];
    rows.push(["browser", browserName]);
    rows.push(["device", isMobile ? "mobile" : "desktop"]);
    rows.push(["target_count", settings.targetCount]);
    rows.push(["probability_mode", settings.probabilityMode]);
    rows.push(["finished_count", finishedCount]);
    rows.push(["bin_count", settings.binCount]);
    rows.push(["pin_rows", settings.pinRows]);
    rows.push(["random_call_count", randomCallCount]);
    rows.push(["discarded_count", discardedCount]);
    rows.push(["run_score", runScore]);
    rows.push(["best_combo", bestComboThisRun]);
    rows.push(["missions_cleared", Object.values(missionProgress).filter(Boolean).length]);
    rows.push(["gold_created", goldCreated]);
    rows.push(["rainbow_created", rainbowCreated]);
    rows.push(["giant_created", giantCreated]);
    rows.push(["shape_created", shapeCreated]);
    rows.push(["crown_created", crownCreated]);
    rows.push(["shooting_star_created", starCreated]);
    rows.push(["heart_created", heartCreated]);
    rows.push(["black_sun_created", blackSunCreated]);
    rows.push(["cosmic_egg_created", cosmicEggCreated]);
    rows.push(["silver_ufo_created", silverUfoCreated]);
    rows.push(["blue_flame_created", blueFlameCreated]);
    rows.push(["lucky_seven_created", luckySevenCreated]);
    rows.push(["time_rift_created", timeRiftCreated]);
    rows.push(["lab_explosion_created", labExplosionCreated]);
    rows.push([]);
    rows.push(["bin", "label", "count", "percent", "gold", "rainbow", "giant", "shape", "crown", "star", "heart", "blackSun", "cosmicEgg"]);
    for (let i = 0; i < settings.binCount; i++) {
        const percent = finishedCount > 0 ? (binCounts[i] / finishedCount) * 100 : 0;
        rows.push([i + 1, labels[i], binCounts[i], percent.toFixed(4), goldHits[i], rainbowHits[i], giantHits[i], shapeHits[i], crownHits[i], starHits[i], heartHits[i], blackSunHits[i], cosmicEggHits[i]]);
    }
    return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

async function copyResultCsv(): Promise<void> {
    const csv = buildResultCsv();
    try { await navigator.clipboard.writeText(csv); showMilestone("結果CSVをコピーしました"); }
    catch {
        const textarea = document.createElement("textarea");
        textarea.value = csv;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showMilestone("結果CSVをコピーしました");
    }
}

function downloadResultCsv(): void {
    const blob = new Blob(["\uFEFF" + buildResultCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matter-random-result-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showMilestone("CSVを保存しました");
}

function closeFinalResult(): void {
    resultOverlay.style.display = "none";
    resultOverlay.innerHTML = "";
}

function showEndingThenFinalResult(): void {
    if (settings.simpleMode) {
        showFinalResult();
        return;
    }
    const best = miracleLogs[0];
    const hasGodChain = Object.keys(unlockedChainRunIds).some((id) => MIRACLE_CHAIN_DEFS.find((x) => x.id === id)?.rank.includes("GOD"));
    const title = hasGodChain ? "確率の外側へ到達" : best ? "観測記録を封印" : "実験終了";
    const line = hasGodChain
        ? "研究所は、奇跡同士の連鎖を最終記録として保存しました。"
        : best
            ? `${best.label} を含む研究記録を保存しました。`
            : "通常観測として、静かに研究記録を保存しました。";
    maybeShowCommentary(`実況「${title}」`, true);
    fireConfetti(hasGodChain ? "cosmic" : best ? "miracle" : "normal");
    resultOverlay.innerHTML = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 36%, rgba(255,255,255,.18), rgba(15,23,42,.82) 54%, rgba(0,0,0,.96));"></div>
        <div style="position:relative;max-width:900px;width:min(900px,94vw);padding:${isMobile ? "28px 18px" : "40px 48px"};border-radius:34px;background:rgba(15,23,42,.66);box-shadow:0 30px 90px rgba(0,0,0,.52);text-align:center;animation:ending-fade 2.4s ease-out forwards;">
            <style>@keyframes ending-fade{0%{opacity:0;transform:translateY(18px) scale(.98)}18%{opacity:1;transform:translateY(0) scale(1)}82%{opacity:1}100%{opacity:0;transform:translateY(-8px) scale(.99)}}</style>
            <div style="font-size:clamp(22px,4vw,38px);font-weight:1000;color:#fde68a;letter-spacing:.08em;">ENDING</div>
            <div style="margin-top:10px;font-size:clamp(38px,8vw,82px);font-weight:1000;color:#fff;text-shadow:0 8px 30px rgba(0,0,0,.66);">${title}</div>
            <div style="margin-top:16px;font-size:clamp(18px,3vw,30px);line-height:1.7;color:#e5e7eb;">${line}</div>
            <div style="margin-top:18px;font-size:clamp(16px,2.6vw,24px);color:#cbd5e1;">${finishedCount.toLocaleString()}回の落下を確認しました。</div>
        </div>`;
    resultOverlay.style.display = "flex";
    window.setTimeout(() => showFinalResult(), 2500);
}

function showFinalResult(): void {
    savedRecords.totalRuns++;
    savedRecords.maxFinishedCount = Math.max(savedRecords.maxFinishedCount, finishedCount);
    savedRecords.maxTargetCount = Math.max(savedRecords.maxTargetCount, settings.targetCount);
    savedRecords.bestScore = Math.max(savedRecords.bestScore, runScore);
    savedRecords.totalScore += runScore;
    saveRecords();
    const ranking = binCounts.map((count, index) => ({ label: labels[index], count, percent: finishedCount > 0 ? (count / finishedCount) * 100 : 0 })).sort((a, b) => b.count - a.count);
    const rankingHtml = ranking.map((item, index) => `<div style="margin:7px 0;">${index + 1}位：${item.label}　${item.count.toLocaleString()}回　${item.percent.toFixed(2)}%</div>`).join("");
    resultOverlay.innerHTML = `
        <div style="position:relative;max-width:920px;width:min(920px,94vw);max-height:88dvh;overflow:auto;padding:28px;border-radius:26px;background:rgba(5,8,18,.58);box-shadow:0 24px 80px rgba(0,0,0,.42);">
            <button id="close-result-button" aria-label="閉じる" style="position:absolute;right:14px;top:14px;width:46px;height:46px;border-radius:999px;border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.18);color:#fff;font-size:28px;font-weight:900;line-height:1;cursor:pointer;">×</button>
            <div style="font-size:clamp(38px,8vw,78px);font-weight:900;margin-bottom:18px;">実験完了</div>
            <div style="font-size:clamp(22px,4vw,40px);margin-bottom:18px;">${browserName} / 指定${settings.targetCount.toLocaleString()}回 / 実処理${finishedCount.toLocaleString()}回 / ${formatElapsedTime((targetReachedTime ?? endTime ?? Date.now()) - startTime)}</div>
            <div style="font-size:clamp(20px,3vw,34px);margin-bottom:18px;">スコア <b>${runScore.toLocaleString()}</b> / ミッション ${Object.values(missionProgress).filter(Boolean).length} / ${missionDefs.length} / 奇跡コンボ最高 ${bestComboThisRun}</div>
            <div style="font-size:clamp(18px,3vw,34px);line-height:1.55;">${rankingHtml}</div>
            <div style="margin-top:20px;font-size:clamp(16px,2vw,26px);line-height:1.5;opacity:.95;">確率モードは <b>${getProbabilityModeLabel()}</b> です。一番レアは <b>1兆分の1</b> の極秘イベント。出たら奇跡どころか、画面が伝説になります。</div>
            <div style="margin-top:24px;font-size:clamp(16px,2vw,28px);opacity:.9;">発見済み種類: ${(SPECIAL_EVENT_DEFS.filter((def) => (savedRecords.discovered[def.kind] ?? 0) + (specialCreated[def.kind] ?? 0) > 0).length).toLocaleString()} / ${SPECIAL_EVENT_DEFS.length}　捨て区画: ${discardedCount.toLocaleString()}</div>
            <div style="margin-top:18px;font-size:clamp(16px,2vw,26px);opacity:.95;">${getResearchReportHtml()}</div>
            <div style="margin-top:24px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;"><button id="copy-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">結果コピー</button><button id="download-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">CSV保存</button><button id="share-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);box-shadow:0 5px 14px rgba(90,96,180,.16);">録画・SNS</button><button id="bottom-close-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">閉じる</button></div>
        </div>`;
    resultOverlay.style.display = "flex";
    document.getElementById("copy-result-button")!.onclick = () => copyResultCsv();
    document.getElementById("download-result-button")!.onclick = () => downloadResultCsv();
    document.getElementById("share-result-button")!.onclick = () => showSharePopup();
    document.getElementById("close-result-button")!.onclick = () => closeFinalResult();
    document.getElementById("bottom-close-result-button")!.onclick = () => closeFinalResult();
}

// ======================================================
// Rendering
// ======================================================

function drawDiscardBinLabel(context: CanvasRenderingContext2D, physicalIndex: number): void {
    const x = geometry.binLeft + physicalIndex * geometry.binWidth + geometry.binWidth / 2;
    const labelFont = Math.round(clamp(geometry.labelFont * 0.78, isMobile ? 18 : 13, isMobile ? 36 : 30));
    const countFont = Math.round(clamp(geometry.countFont * 0.88, isMobile ? 13 : 10, isMobile ? 28 : 26));
    context.save();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(80, 86, 100, 0.18)";
    context.fillRect(x - geometry.binWidth / 2, geometry.groundTop - 118 * geometry.scale, geometry.binWidth, 118 * geometry.scale);
    context.font = `900 ${labelFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
    context.fillStyle = "#5b3b3b";
    context.fillText("捨て", x, geometry.labelY - labelFont * 0.55);
    context.fillText("区間", x, geometry.labelY + labelFont * 0.55);
    context.font = `800 ${countFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
    context.fillStyle = "#6b4a4a";
    context.fillText("対象外", x, geometry.countY);
    context.restore();
}

function drawSparkle(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, rotate: number): void {
    context.save();
    context.translate(x, y);
    context.rotate(rotate);
    context.strokeStyle = color;
    context.lineWidth = Math.max(1, size * 0.12);
    context.globalAlpha = 0.9;
    context.beginPath();
    context.moveTo(-size, 0);
    context.lineTo(size, 0);
    context.moveTo(0, -size);
    context.lineTo(0, size);
    context.stroke();
    context.restore();
}


function getSpecialIconColors(kind: DropKind): { main: string; sub: string; text: string; stroke: string } {
    if (kind === "blackSun") return { main: "#090909", sub: "#ff0044", text: "#ffffff", stroke: "#ff0044" };
    if (kind === "cosmicEgg") return { main: "#240038", sub: "#00e5ff", text: "#ffffff", stroke: "#ffffff" };
    if (kind === "silverUfo") return { main: "#d6dde1", sub: "#6e8799", text: "#263238", stroke: "#ffffff" };
    if (kind === "blueFlame") return { main: "#00aaff", sub: "#002bff", text: "#ffffff", stroke: "#dff7ff" };
    if (kind === "timeRift") return { main: "#622aff", sub: "#00e5ff", text: "#ffffff", stroke: "#dff7ff" };
    if (kind === "labExplosion") return { main: "#ff3b30", sub: "#ffd640", text: "#ffffff", stroke: "#fff3b0" };
    if (kind === "poseidonMode") return { main: "#1e88ff", sub: "#002ea6", text: "#ffffff", stroke: "#bde9ff" };
    if (kind === "zeusuMode") return { main: "#ffd400", sub: "#ff9100", text: "#3a2600", stroke: "#fff8c2" };
    if (kind === "hadesuMode") return { main: "#111111", sub: "#5a0000", text: "#ffffff", stroke: "#ff8e8e" };
    if (kind === "heartMode") return { main: "#ff69b4", sub: "#ff2d86", text: "#ffffff", stroke: "#ffe0f0" };
    if (kind === "nekochanMode") return { main: "#ffb36b", sub: "#7f5032", text: "#402000", stroke: "#fff0dd" };
    if (kind === "lifeQuoteMode") return { main: "#ff9ed4", sub: "#8f3f73", text: "#ffffff", stroke: "#ffe0f0" };
    if (kind === "heart") return { main: "#ff69b4", sub: "#ff2d86", text: "#ffffff", stroke: "#ffe0f0" };
    if (kind === "crown" || kind === "goldenDaruma" || kind === "meteorCrown") return { main: "#ffd54a", sub: "#b8860b", text: "#3a2600", stroke: "#fff4a8" };
    if (kind === "crystalDragon") return { main: "#72f1ff", sub: "#3f6bff", text: "#06192f", stroke: "#e8fdff" };
    if (kind === "moonRabbit") return { main: "#eef4ff", sub: "#9dbbff", text: "#223047", stroke: "#ffffff" };
    if (kind === "phantomCastle") return { main: "#9b8cff", sub: "#3b1a84", text: "#ffffff", stroke: "#eeeaff" };
    if (kind === "rainbowWhale") return { main: "#3ee8c9", sub: "#7d5cff", text: "#062923", stroke: "#ffffff" };
    if (kind === "thunderKitsune") return { main: "#ffe45c", sub: "#ff7a00", text: "#3a2600", stroke: "#fff7b0" };
    if (kind === "pocketGalaxy") return { main: "#3547ff", sub: "#ff4dff", text: "#ffffff", stroke: "#dfe4ff" };
    if (kind === "ancientClock") return { main: "#b58b4a", sub: "#4b2e11", text: "#ffffff", stroke: "#ffe6b0" };
    if (kind === "mirrorCat") return { main: "#f5f7ff", sub: "#93a4c7", text: "#233044", stroke: "#ffffff" };
    return { main: "#ffd54a", sub: "#ffffff", text: "#111111", stroke: "#ffffff" };
}

function drawSpecialIcon(context: CanvasRenderingContext2D, kind: DropKind, x: number, y: number, radius: number, symbol: string): void {
    const colors = getSpecialIconColors(kind);
    const r = Math.max(radius * (isMobile ? 1.45 : 1.2), isMobile ? 22 : 18 * geometry.scale);
    const time = Date.now() / 1000;
    context.save();
    context.translate(x, y);
    context.rotate(kind === "timeRift" ? time * 1.8 : 0);

    // 外側の太い縁。スマホでも「ただの光」に見えないよう、必ず実体を描く。
    context.beginPath();
    context.arc(0, 0, r * 1.08, 0, Math.PI * 2);
    context.fillStyle = "rgba(255,255,255,.95)";
    context.fill();

    const grad = context.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.35, colors.main);
    grad.addColorStop(1, colors.sub);
    context.beginPath();
    context.arc(0, 0, r, 0, Math.PI * 2);
    context.fillStyle = grad;
    context.fill();
    context.lineWidth = Math.max(3, r * 0.14);
    context.strokeStyle = colors.stroke;
    context.stroke();

    // 種類ごとの大きいシルエット
    context.save();
    context.globalAlpha = 0.95;
    context.fillStyle = colors.text;
    context.strokeStyle = "rgba(0,0,0,.35)";
    context.lineWidth = Math.max(2, r * 0.07);

    if (kind === "crown" || kind === "meteorCrown") {
        context.beginPath();
        context.moveTo(-r * 0.65, r * 0.25);
        context.lineTo(-r * 0.45, -r * 0.38);
        context.lineTo(-r * 0.15, r * 0.03);
        context.lineTo(0, -r * 0.55);
        context.lineTo(r * 0.15, r * 0.03);
        context.lineTo(r * 0.45, -r * 0.38);
        context.lineTo(r * 0.65, r * 0.25);
        context.closePath();
        context.fillStyle = "#ffd54a";
        context.fill();
        context.stroke();
        context.fillStyle = "#3a2600";
        context.font = `900 ${Math.round(r * 0.62)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(kind === "meteorCrown" ? "冠" : "王", 0, r * 0.15);
    } else if (kind === "silverUfo") {
        context.beginPath();
        context.ellipse(0, r * 0.05, r * 0.82, r * 0.28, 0, 0, Math.PI * 2);
        context.fillStyle = "#dce3e7";
        context.fill(); context.stroke();
        context.beginPath();
        context.arc(0, -r * 0.08, r * 0.36, Math.PI, 0);
        context.fillStyle = "#9bdcff";
        context.fill(); context.stroke();
    } else if (kind === "blueFlame") {
        context.beginPath();
        context.moveTo(0, -r * 0.78);
        context.bezierCurveTo(r * 0.72, -r * 0.1, r * 0.36, r * 0.72, 0, r * 0.78);
        context.bezierCurveTo(-r * 0.62, r * 0.3, -r * 0.55, -r * 0.15, 0, -r * 0.78);
        context.closePath();
        context.fillStyle = "#00c8ff";
        context.fill(); context.stroke();
        context.beginPath();
        context.moveTo(0, -r * 0.32);
        context.bezierCurveTo(r * 0.28, r * 0.12, r * 0.10, r * 0.42, 0, r * 0.5);
        context.bezierCurveTo(-r * 0.22, r * 0.28, -r * 0.18, 0, 0, -r * 0.32);
        context.fillStyle = "#ffffff";
        context.fill();
    } else if (kind === "timeRift" || kind === "pocketGalaxy") {
        context.lineWidth = Math.max(4, r * 0.13);
        for (let i = 0; i < 3; i++) {
            context.beginPath();
            context.arc(0, 0, r * (0.28 + i * 0.18), i * 0.9, Math.PI * 1.6 + i * 0.9);
            context.strokeStyle = i % 2 ? "#ffffff" : "#00e5ff";
            context.stroke();
        }
        context.fillStyle = "#ffffff";
        context.font = `900 ${Math.round(r * 0.44)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText(kind === "timeRift" ? "裂" : "銀", 0, 0);
    } else if (kind === "heart") {
        context.beginPath();
        context.moveTo(0, r * 0.58);
        context.bezierCurveTo(-r * 0.9, -r * 0.02, -r * 0.62, -r * 0.72, 0, -r * 0.36);
        context.bezierCurveTo(r * 0.62, -r * 0.72, r * 0.9, -r * 0.02, 0, r * 0.58);
        context.fillStyle = "#ff4da6";
        context.fill(); context.stroke();
    } else if (kind === "blackSun") {
        for (let i = 0; i < 10; i++) {
            const a = i * Math.PI * 2 / 10;
            context.beginPath();
            context.moveTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75);
            context.lineTo(Math.cos(a) * r * 1.18, Math.sin(a) * r * 1.18);
            context.strokeStyle = "#ff0044";
            context.lineWidth = Math.max(3, r * 0.1);
            context.stroke();
        }
        context.beginPath(); context.arc(0,0,r*.62,0,Math.PI*2); context.fillStyle="#050505"; context.fill(); context.strokeStyle="#ff0044"; context.stroke();
    } else if (kind === "poseidonMode") {
        context.font = `900 ${Math.round(r * 0.88)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("🌊", 0, 0);
    } else if (kind === "zeusuMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("⚡", 0, 0);
    } else if (kind === "hadesuMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("☠️", 0, 0);
    } else if (kind === "heartMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("💗", 0, 0);
    } else if (kind === "nekochanMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("🐈", 0, 0);
    } else if (kind === "lifeQuoteMode") {
        context.fillStyle = "#ffffff";
        context.font = `900 ${Math.round(r * 0.46)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("声", 0, 0);
    } else if (kind === "labExplosion") {
        context.beginPath();
        for (let i = 0; i < 12; i++) {
            const a = i * Math.PI * 2 / 12;
            const rr = i % 2 ? r * 0.45 : r * 0.95;
            const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
            if (i === 0) context.moveTo(px, py); else context.lineTo(px, py);
        }
        context.closePath();
        context.fillStyle = "#ff3b30";
        context.fill(); context.stroke();
        context.fillStyle = "#fff3b0";
        context.font = `900 ${Math.round(r * 0.48)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("爆", 0, 0);
    } else {
        context.font = `900 ${Math.round(symbol.length >= 2 ? r * 0.58 : r * 0.78)}px "Noto Sans JP", "Yu Gothic", "Segoe UI", sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.strokeStyle = "rgba(255,255,255,.85)";
        context.lineWidth = Math.max(3, r * 0.09);
        context.strokeText(symbol, 0, r * 0.03);
        context.fillStyle = colors.text;
        context.fillText(symbol, 0, r * 0.03);
    }
    context.restore();

    context.restore();
}

function drawNormalTraitMarks(context: CanvasRenderingContext2D): void {
    if (settings.simpleMode) return;
    context.save();
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isDrop || plugin.kind !== "normal" || !plugin.traitMark) continue;
        const x = body.position.x;
        const y = body.position.y;
        const radius = body.circleRadius ?? plugin.originalRadius ?? geometry.ballRadius;
        context.globalAlpha = plugin.traitKind === "ghost" ? 0.55 : 0.88;
        context.beginPath();
        context.arc(x, y, radius * 0.66, 0, Math.PI * 2);
        context.fillStyle = "rgba(255,255,255,.42)";
        context.fill();
        context.font = `900 ${Math.round(clamp(radius * 0.66, 9, 20))}px "Noto Sans JP", "Yu Gothic", sans-serif`;
        context.fillStyle = "rgba(15,23,42,.86)";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(String(plugin.traitMark), x, y + radius * 0.03);
    }
    context.restore();
}

function drawSpecialGlows(context: CanvasRenderingContext2D): void {
    if (settings.simpleMode) return;
    const time = Date.now() / 1000;
    context.save();
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isDrop) continue;
        const kind = plugin.kind as DropKind;
        const def = findSpecialDef(kind);
        if (!def && !["gold", "rainbow"].includes(kind)) continue;
        const x = body.position.x;
        const y = body.position.y;
        const radius = body.circleRadius ?? plugin.originalRadius ?? geometry.ballRadius;
        const pulse = 0.75 + Math.sin(time * 9) * 0.25;
        let colors = ["255,215,0", "255,170,0"];
        if (kind === "rainbow") colors = ["190,100,255", "80,180,255"];
        if (def) {
            const c = getSpecialIconColors(kind);
            colors = hexToRgbTriplet(c.main, "255,215,0") ? [hexToRgbTriplet(c.main, "255,215,0"), hexToRgbTriplet(c.sub, "255,170,0")] : colors;
        }

        // 光は控えめ。アイコン本体を見せるため、スマホでは特に薄くする。
        context.save();
        context.globalCompositeOperation = "lighter";
        const glow = context.createRadialGradient(x, y, radius * 0.25, x, y, radius * (isMobile ? 3.0 : 4.5));
        glow.addColorStop(0, `rgba(${colors[0]}, ${0.42 * pulse})`);
        glow.addColorStop(0.72, `rgba(${colors[1]}, ${0.18 * pulse})`);
        glow.addColorStop(1, `rgba(${colors[1]}, 0)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, radius * (isMobile ? 3.0 : 4.5), 0, Math.PI * 2);
        context.fill();
        context.restore();

        if (def) {
            drawSpecialIcon(context, kind, x, y, Math.max(radius, isMobile ? 20 : 14 * geometry.scale), plugin.symbol || def.symbol);
        }

        if (kind === "gold" || kind === "rainbow") {
            for (let i = 0; i < 6; i++) {
                const angle = time * 2.5 + i * Math.PI * 2 / 6;
                drawSparkle(context, x + Math.cos(angle) * radius * 2.6, y + Math.sin(angle) * radius * 2.6, 5 * geometry.scale, "rgba(255,255,220,.95)", angle);
            }
        }
    }
    context.restore();
}

function hexToRgbTriplet(hex: string, fallback: string): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return fallback;
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

Events.on(render, "afterRender", () => {
    const context = render.context;
    context.save();
    drawSpecialGlows(context);
    drawNormalTraitMarks(context);
    context.textAlign = "center";
    context.textBaseline = "middle";
    drawDiscardBinLabel(context, 0);
    drawDiscardBinLabel(context, settings.binCount + 1);
    const maxCount = Math.max(...binCounts, 0);
    for (let i = 0; i < settings.binCount; i++) {
        const x = geometry.binCenters[i];
        const count = binCounts[i];
        const percent = finishedCount > 0 ? (count / finishedCount) * 100 : 0;
        if (!settings.simpleMode && hitFlash[i] > 0) {
            const alpha = hitFlash[i] / 18;
            context.fillStyle = `rgba(255,160,80,${alpha * 0.45})`;
            context.fillRect(x - geometry.binWidth / 2, geometry.groundTop - 118 * geometry.scale, geometry.binWidth, 118 * geometry.scale);
            hitFlash[i]--;
        }
        if (!settings.simpleMode && count === maxCount && maxCount > 0) {
            context.beginPath();
            context.arc(x, geometry.labelY, 32 * geometry.scale, 0, Math.PI * 2);
            context.fillStyle = "rgba(255, 220, 80, 0.45)";
            context.fill();
        }
        context.font = `900 ${geometry.labelFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = activeWorldMode === "poseidon" ? "#e7f6ff" : activeWorldMode === "zeusu" ? "#3e2f00" : activeWorldMode === "hadesu" ? "#ffffff" : activeWorldMode === "heart" ? "#fff4fb" : activeWorldMode === "nekochan" ? "#4a2a11" : "#222";
        context.fillText(labels[i], x, geometry.labelY);
        context.font = `800 ${geometry.countFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = activeWorldMode === "poseidon" ? "#d7efff" : activeWorldMode === "zeusu" ? "#5a4300" : activeWorldMode === "hadesu" ? "#ffb1b1" : activeWorldMode === "heart" ? "#fff0f8" : activeWorldMode === "nekochan" ? "#5a3416" : "#003366";
        context.fillText(count.toLocaleString(), x, geometry.countY);
        context.font = `700 ${geometry.percentFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = activeWorldMode === "poseidon" ? "#d7efff" : activeWorldMode === "zeusu" ? "#5a4300" : activeWorldMode === "hadesu" ? "#ffb1b1" : activeWorldMode === "heart" ? "#fff0f8" : activeWorldMode === "nekochan" ? "#5a3416" : "#444";
        context.fillText(`${percent.toFixed(1)}%`, x, geometry.percentY);
        const barMaxWidth = geometry.binWidth * 0.72;
        const barWidth = Math.min(barMaxWidth, barMaxWidth * (percent / 25));
        const barHeight = clamp(8 * geometry.scale, 4, 18);
        context.fillStyle = activeWorldMode === "poseidon" ? "rgba(215,239,255,.55)" : activeWorldMode === "zeusu" ? "rgba(255,247,176,.45)" : activeWorldMode === "hadesu" ? "rgba(255,120,120,.25)" : activeWorldMode === "heart" ? "rgba(255,224,240,.48)" : activeWorldMode === "nekochan" ? "rgba(255,232,210,.48)" : "#d7dce7";
        context.fillRect(x - barMaxWidth / 2, geometry.barY, barMaxWidth, barHeight);
        context.fillStyle = activeWorldMode === "poseidon" ? "#4b8cff" : activeWorldMode === "zeusu" ? "#ffd400" : activeWorldMode === "hadesu" ? "#ff4a4a" : activeWorldMode === "heart" ? "#ff5fb5" : activeWorldMode === "nekochan" ? "#ff9a52" : "#4b8cff";
        context.fillRect(x - barMaxWidth / 2, geometry.barY, barWidth, barHeight);
    }
    if (activeWorldMode) {
        const palette = getWorldModePalette(activeWorldMode);
        context.save();
        context.fillStyle = palette.tint;
        context.fillRect(0, 0, geometry.width, geometry.height);
        context.strokeStyle = palette.accent;
        context.fillStyle = palette.accent;
        context.globalAlpha = 0.95;
        context.font = `900 ${Math.round(clamp(30 * geometry.scale, 18, 46))}px "Segoe UI Emoji", "Noto Sans JP", sans-serif`;
        context.fillText(`${palette.emoji} ${palette.subtitle} ${palette.emoji}`, geometry.width / 2, 34 * geometry.scale);
        for (let i = 0; i < 12; i++) {
            const angle = Date.now() / 900 + i * Math.PI * 2 / 12;
            const x = geometry.width / 2 + Math.cos(angle) * geometry.width * 0.34;
            const y = geometry.height * 0.34 + Math.sin(angle * 1.3) * geometry.height * 0.22;
            context.globalAlpha = 0.35;
            context.font = `900 ${Math.round(clamp(30 * geometry.scale, 18, 42))}px "Segoe UI Emoji", "Noto Sans JP", sans-serif`;
            context.fillText(palette.emoji, x, y);
        }
        context.restore();
    }
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const item = floatingTexts[i];
        const progress = item.life / item.maxLife;
        const y = item.y - (1 - progress) * 40 * geometry.scale;
        context.globalAlpha = progress;
        context.font = `900 ${Math.round(clamp(24 * geometry.scale, 16, 42))}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = item.color;
        context.fillText(item.text, item.x, y);
        context.globalAlpha = 1;
        item.life--;
        if (item.life <= 0) floatingTexts.splice(i, 1);
    }
    if (isStarted && !isPaused && !isMiraclePaused) {
        replayCaptureTick++;
        if (replayCaptureTick % 5 === 0) {
            try {
                replayFrameBuffer.push(canvas.toDataURL("image/jpeg", 0.42));
                if (replayFrameBuffer.length > 24) replayFrameBuffer.shift();
            } catch {}
        }
    }
    context.restore();
});

// ======================================================
// Physics update
// ======================================================

Events.on(engine, "afterUpdate", () => {
    updateCameraShake();
    updatePinWiggles();
    updateBoardAnomaly();
    maybeTriggerBoardAnomaly();
    maybeShowCommentary();
    gameArea.style.filter = anomalyUntil ? (anomalyHidePins ? "brightness(.84) contrast(1.1)" : "brightness(.95)") : "";
    if (!isStarted || isFinished || isMiraclePaused) return;

    const removeTargets: Matter.Body[] = [];
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;

        if (plugin?.isDecoration) {
            if (body.position.y > geometry.height + 80 * geometry.scale) removeTargets.push(body);
            continue;
        }
        if (!plugin?.isDrop) continue;

        plugin.lifeFrames = (plugin.lifeFrames ?? 0) + 1;

        const nowMs = performance.now();
        const hardExpired = typeof plugin.bornAt === "number" && typeof plugin.hardExpireMs === "number" && nowMs - plugin.bornAt >= plugin.hardExpireMs;
        if (hardExpired) {
            explodeStuckDrop(body);
            finishedCount++;
            discardedCount++;
            if (targetReachedTime === null && finishedCount >= settings.targetCount) targetReachedTime = Date.now();
            activeDropCount--;
            removeTargets.push(body);
            continue;
        }

        // 指定回数に到達した後も、画面に残っている玉は最後に強制回収してカウントする
        if (targetReachedTime !== null && Date.now() - targetReachedTime > FINAL_SWEEP_DELAY_MS) {
            const binIndex = getBinIndex(body.position.x);
            finishedCount++;
            if (binIndex >= 0) {
                binCounts[binIndex]++;
                addScore(100, "DROP", body.position.x, geometry.ballCountY - 24 * geometry.scale);
                if (!settings.simpleMode) hitFlash[binIndex] = 18;
            } else {
                discardedCount++;
            }
            activeDropCount--;
            removeTargets.push(body);
            continue;
        }

        if (magnetUntil > Date.now()) {
            const maxCount = Math.max(...binCounts, 0);
            const topIndex = Math.max(0, binCounts.indexOf(maxCount));
            const targetX = geometry.binCenters[Math.min(topIndex >= 0 ? topIndex : Math.floor(settings.binCount / 2), geometry.binCenters.length - 1)] ?? (geometry.width / 2);
            const dx = targetX - body.position.x;
            Body.applyForce(body, body.position, { x: dx * 0.0000018, y: -0.00000035 });
        }

        applyActiveBoardAnomalyForce(body);

        if (plugin.kind === "shape" || plugin.kind === "giant") {
            const lastX = plugin.lastX ?? body.position.x;
            const lastY = plugin.lastY ?? body.position.y;
            const moveDistance = Math.hypot(body.position.x - lastX, body.position.y - lastY);
            plugin.lastX = body.position.x;
            plugin.lastY = body.position.y;
            const isAboveGoal = plugin.kind === "giant" || body.position.y < geometry.ballCountY - 20 * geometry.scale;
            const isAlmostStopped = isAboveGoal && moveDistance < 0.45 * geometry.scale && body.speed < 0.35;
            plugin.stuckFrames = isAlmostStopped ? (plugin.stuckFrames ?? 0) + 1 : 0;
            if (plugin.stuckFrames === STUCK_NUDGE_FRAMES) {
                Body.setVelocity(body, { x: (appRandom() - 0.5) * 10 * geometry.scale, y: -5 * geometry.scale });
                Body.setAngularVelocity(body, (appRandom() - 0.5) * 0.45);
                addFloatingText(plugin.kind === "giant" ? "巨大玉 救出" : "詰まり救出", body.position.x, body.position.y - 20 * geometry.scale, "#ff8800");
                triggerCameraShake(5 * geometry.scale, 140);
            }
            const shouldExplode = plugin.stuckFrames > STUCK_EXPLODE_FRAMES || (plugin.kind === "giant" && plugin.lifeFrames > STUCK_EXPLODE_FRAMES) || (plugin.kind === "shape" && plugin.lifeFrames > STUCK_EXPLODE_FRAMES * 2);
            if (shouldExplode) {
                explodeStuckDrop(body);
                finishedCount++;
                discardedCount++;
                if (targetReachedTime === null && finishedCount >= settings.targetCount) targetReachedTime = Date.now();
                activeDropCount--;
                removeTargets.push(body);
                continue;
            }
        }

        if (body.position.y > geometry.ballCountY) {
            const kind = (plugin.kind ?? "normal") as DropKind;
            if (kind !== "normal") playSpecialSound(kind);
            const binIndex = getBinIndex(body.position.x);
            finishedCount++;
            if (targetReachedTime === null && finishedCount >= settings.targetCount) targetReachedTime = Date.now();

            if (binIndex >= 0) {
                binCounts[binIndex]++;
                if (!settings.simpleMode) hitFlash[binIndex] = 18;
                triggerCameraShake(3 * geometry.scale, 100);
                if (kind === "gold") { goldHits[binIndex]++; addScore(800, "GOLD", body.position.x, geometry.ballCountY - 60 * geometry.scale); addFloatingText(`金 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 60 * geometry.scale, "#d89b00"); triggerCameraShake(7 * geometry.scale, 180); }
                if (kind === "rainbow") { rainbowHits[binIndex]++; addScore(1600, "RAINBOW", body.position.x, geometry.ballCountY - 60 * geometry.scale); addFloatingText(`虹 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 60 * geometry.scale, "#b44cff"); triggerCameraShake(11 * geometry.scale, 240); }
                if (kind === "giant") { giantHits[binIndex]++; addScore(2200, "GIANT", body.position.x, geometry.ballCountY - 70 * geometry.scale); addFloatingText(`巨大 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 70 * geometry.scale, "#111111"); triggerCameraShake(15 * geometry.scale, 300); }
                if (kind === "shape") { shapeHits[binIndex]++; addScore(1200, "SHAPE", body.position.x, geometry.ballCountY - 70 * geometry.scale); addFloatingText(`${plugin.shapeName ?? "図形"} → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 70 * geometry.scale, "#ffffff"); triggerCameraShake(9 * geometry.scale, 220); }
                if (kind === "crown") { crownHits[binIndex]++; addScore(6000, "CROWN", body.position.x, geometry.ballCountY - 80 * geometry.scale); addFloatingText(`王冠 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#ffd54a"); fireConfetti("miracle"); }
                if (kind === "shootingStar") { starHits[binIndex]++; addScore(18000, "STAR", body.position.x, geometry.ballCountY - 80 * geometry.scale); addFloatingText(`流れ星 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#78e7ff"); fireConfetti("miracle"); }
                if (kind === "heart") { heartHits[binIndex]++; addScore(60000, "HEART", body.position.x, geometry.ballCountY - 80 * geometry.scale); addFloatingText(`桃色ハート → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#ff69b4"); triggerCameraShake(22 * geometry.scale, 480); fireConfetti("miracle"); }
                if (kind === "blackSun") { blackSunHits[binIndex]++; addScore(120000, "BLACK SUN", body.position.x, geometry.ballCountY - 80 * geometry.scale); addFloatingText(`黒い太陽 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#ff0044"); triggerCameraShake(26 * geometry.scale, 600); fireConfetti("black"); }
                if (kind === "cosmicEgg") { cosmicEggHits[binIndex]++; addScore(250000, "COSMIC EGG", body.position.x, geometry.ballCountY - 90 * geometry.scale); addFloatingText(`宇宙卵 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 90 * geometry.scale, "#00e5ff"); triggerCameraShake(38 * geometry.scale, 1200); fireConfetti("cosmic"); }
                const def = findSpecialDef(kind);
                if (def && !["heart", "blackSun", "cosmicEgg"].includes(kind)) {
                    addFloatingText(`${def.label} → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 90 * geometry.scale, def.fillStyle);
                    triggerScreenFlash(def.soundMode ?? "miracle");
                    triggerCameraShake(def.rank === "GOD" ? 40 * geometry.scale : def.rank === "EX" ? 30 * geometry.scale : 24 * geometry.scale, def.rank === "GOD" ? 1100 : 540);
                    fireConfetti(def.soundMode ?? "miracle");
                }

                checkMissionProgress();
                while (finishedCount >= nextMilestone && nextMilestone <= settings.targetCount) {
                    showMilestone(`${nextMilestone.toLocaleString()}回 達成！`);
                    showFullScreenCelebration(nextMilestone);
                    nextMilestone += MILESTONE_INTERVAL;
                }
                while (finishedCount >= nextGiantEvent && nextGiantEvent <= settings.targetCount) {
                    giantStock++;
                    nextGiantEvent += GIANT_EVENT_INTERVAL;
                }
            } else {
                discardedCount++;
            }
            activeDropCount--;
            removeTargets.push(body);
        }
    }

    for (const body of removeTargets) Composite.remove(engine.world, body);

    // 画面上に残っている玉を含めて指定回数に届いている場合は、残り玉回収モードへ入る。
    // これがないと「あと1個が画面上で止まる → 新規投入されない → 完了画面が開かない」状態になることがある。
    if (targetReachedTime === null && finishedCount + activeDropCount >= settings.targetCount) {
        targetReachedTime = Date.now();
    }

    // 指定回数に到達した後は新規投入せず、残り玉の回収だけ行う
    while (targetReachedTime === null && finishedCount + activeDropCount < settings.targetCount && activeDropCount < settings.activeLimit) {
        Composite.add(engine.world, createDrop());
    }
    updateInfo();

    if (targetReachedTime !== null && activeDropCount === 0) {
        isFinished = true;
        endTime = Date.now();
        Runner.stop(runner);
        updateInfo();
        showEndingThenFinalResult();
    }
});

// ======================================================
// Start / resize
// ======================================================

geometry = calculateGeometry();
missionDefs = buildMissionDefs();
applyTheme();
resetExperiment(false);
Render.run(render);
void ensureAnimeReady();
void ensureGifReady();
void ensureTippyReady();
hideBootOverlay();

let resizeTimer: number | undefined;
function scheduleResize(): void {
    if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
        if (!applySettingsFromInputs(false)) return;
        resetExperiment(isStarted && !isFinished);
    }, 300);
}
window.addEventListener("resize", scheduleResize);
window.visualViewport?.addEventListener("resize", scheduleResize);