export type MultiverseLaw = "reverse" | "singularity" | "overclock" | "abundance" | "entropy" | "echo";

export interface UniverseDef {
    id: string;
    name: string;
    subtitle: string;
    icon: string;
    law: MultiverseLaw;
    lawLabel: string;
    description: string;
    color: string;
    targetCount: number;
    activeLimit: number;
    probabilityMode: "normal" | "festival" | "hard" | "hell";
    theme: string;
    risk: number;
}

export interface MultiverseState {
    version: 1;
    shards: number;
    rank: number;
    totalExpeditions: number;
    bestScore: number;
    discovered: Record<string, number>;
    unlockedRelics: string[];
    equippedRelics: string[];
    blessings: string[];
    curses: string[];
    familiarForm: string;
    achievements: string[];
    titles: string[];
    chronicle: MultiverseResult[];
    dailyBest: Record<string, number>;
    trueEndingUnlocked: boolean;
    active: { universeId: string; seed: string; startedAt: number } | null;
    lastResult: MultiverseResult | null;
}

export interface MultiverseResult {
    universeId: string;
    universeName: string;
    score: number;
    finishedCount: number;
    shards: number;
    grade: string;
    relic: string | null;
    completedAt: number;
}

export const MULTIVERSE_STORAGE_KEY = "miracle_multiverse_expedition_v1";

export const UNIVERSES: UniverseDef[] = [
    {
        id: "upside-down",
        name: "反転天球アストラ",
        subtitle: "空へ落ちる宇宙",
        icon: "↟",
        law: "reverse",
        lawLabel: "反転重力",
        description: "上下の意味が崩壊した天球。軽い玉ほど運命へ逆らう。",
        color: "#67e8f9",
        targetCount: 420,
        activeLimit: 38,
        probabilityMode: "hard",
        theme: "space",
        risk: 2,
    },
    {
        id: "event-horizon",
        name: "事象境界ノクス",
        subtitle: "光さえ帰れない研究区",
        icon: "◉",
        law: "singularity",
        lawLabel: "特異点",
        description: "盤面中央に見えない引力源が脈動する。奇跡は中心へ収束する。",
        color: "#c084fc",
        targetCount: 520,
        activeLimit: 44,
        probabilityMode: "hell",
        theme: "midnight",
        risk: 5,
    },
    {
        id: "clockwork",
        name: "超時空クロノギア",
        subtitle: "一秒が千回砕ける宇宙",
        icon: "⌬",
        law: "overclock",
        lawLabel: "時間加速",
        description: "時間密度が不安定。高速観測ほど宇宙片の結晶化が進む。",
        color: "#fbbf24",
        targetCount: 777,
        activeLimit: 64,
        probabilityMode: "festival",
        theme: "cyber",
        risk: 4,
    },
    {
        id: "bloom",
        name: "生命海エデン・ゼロ",
        subtitle: "すべての玉が芽吹く宇宙",
        icon: "✿",
        law: "abundance",
        lawLabel: "無限増殖",
        description: "生命性を得た玉が互いを呼ぶ。使い魔との共鳴率が最大になる。",
        color: "#86efac",
        targetCount: 600,
        activeLimit: 72,
        probabilityMode: "festival",
        theme: "forest",
        risk: 3,
    },
    {
        id: "red-ruin",
        name: "終焉炉ラグナ・コア",
        subtitle: "崩壊を燃料にする宇宙",
        icon: "◇",
        law: "entropy",
        lawLabel: "崩壊熱",
        description: "盤面は時間とともに不安定化する。高危険・高報酬の最終観測区。",
        color: "#fb7185",
        targetCount: 666,
        activeLimit: 50,
        probabilityMode: "hell",
        theme: "volcano",
        risk: 6,
    },
    {
        id: "mirror",
        name: "鏡像界ミラージュ",
        subtitle: "選ばなかった未来の宇宙",
        icon: "∞",
        law: "echo",
        lawLabel: "奇跡反響",
        description: "発生した現象が別の時間軸から反響する。連鎖と合成に特化。",
        color: "#f0abfc",
        targetCount: 500,
        activeLimit: 56,
        probabilityMode: "festival",
        theme: "neon",
        risk: 4,
    },
];

export const RELICS = [
    "反重力の羽根",
    "黒星の心臓",
    "零秒歯車",
    "生命樹の種",
    "終焉炉の鍵",
    "鏡像プリズム",
    "観測者の王冠",
];
export const BLESSINGS = [
    { id: "golden-division", name: "黄金増殖", effect: "宇宙片報酬 +20%", curse: "重力密度上昇" },
    { id: "time-thief", name: "時間泥棒", effect: "高速宇宙の評価上昇", curse: "観測時間が不安定化" },
    { id: "twin-cosmos", name: "双子宇宙", effect: "奇跡反響ボーナス", curse: "必要観測数 +10%" },
    { id: "familiar-union", name: "使い魔融合", effect: "使い魔共鳴で報酬増加", curse: "通常報酬減少" },
    { id: "doomsday-pact", name: "終末契約", effect: "高評価閾値を緩和", curse: "崩壊熱が常時発生" },
    { id: "observer-price", name: "観測者の代償", effect: "航路とボスを先読み", curse: "遺物発見が遅くなる" },
];
export const ACHIEVEMENTS = [
    { id: "first-jump", name: "次元跳躍者" },
    { id: "six-worlds", name: "六界観測者" },
    { id: "relic-master", name: "遺物蒐集王" },
    { id: "omega", name: "確率の外側" },
    { id: "veteran", name: "百界帰還者" },
];

export function createInitialMultiverseState(): MultiverseState {
    return {
        version: 1,
        shards: 0,
        rank: 1,
        totalExpeditions: 0,
        bestScore: 0,
        discovered: {},
        unlockedRelics: [],
        equippedRelics: [],
        blessings: [],
        curses: [],
        familiarForm: "原初形態",
        achievements: [],
        titles: ["次元研究員"],
        chronicle: [],
        dailyBest: {},
        trueEndingUnlocked: false,
        active: null,
        lastResult: null,
    };
}

export function loadMultiverseState(storage: Pick<Storage, "getItem">): MultiverseState {
    try {
        const parsed = JSON.parse(storage.getItem(MULTIVERSE_STORAGE_KEY) ?? "null") as Partial<MultiverseState> | null;
        if (!parsed || typeof parsed !== "object") return createInitialMultiverseState();
        return {
            ...createInitialMultiverseState(),
            ...parsed,
            version: 1,
            shards: Math.max(0, Number(parsed.shards) || 0),
            rank: Math.max(1, Number(parsed.rank) || 1),
            discovered: parsed.discovered && typeof parsed.discovered === "object" ? parsed.discovered : {},
            unlockedRelics: Array.isArray(parsed.unlockedRelics)
                ? parsed.unlockedRelics.filter((x): x is string => typeof x === "string")
                : [],
            equippedRelics: Array.isArray(parsed.equippedRelics)
                ? parsed.equippedRelics.filter((x): x is string => typeof x === "string").slice(0, 3)
                : [],
            blessings: Array.isArray(parsed.blessings)
                ? parsed.blessings.filter((x): x is string => typeof x === "string")
                : [],
            curses: Array.isArray(parsed.curses) ? parsed.curses.filter((x): x is string => typeof x === "string") : [],
            achievements: Array.isArray(parsed.achievements)
                ? parsed.achievements.filter((x): x is string => typeof x === "string")
                : [],
            titles: Array.isArray(parsed.titles)
                ? parsed.titles.filter((x): x is string => typeof x === "string")
                : ["次元研究員"],
            chronicle: Array.isArray(parsed.chronicle) ? parsed.chronicle.slice(0, 40) : [],
            dailyBest: parsed.dailyBest && typeof parsed.dailyBest === "object" ? parsed.dailyBest : {},
        };
    } catch {
        return createInitialMultiverseState();
    }
}

export function saveMultiverseState(storage: Pick<Storage, "setItem">, state: MultiverseState): void {
    try {
        storage.setItem(MULTIVERSE_STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* non-critical local progression */
    }
}

export function createExpeditionSeed(now = new Date()): string {
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(
        now.getTime() / 86400000,
    )
        .toString(36)
        .toUpperCase()}`;
}

export function startMultiverseExpedition(
    state: MultiverseState,
    universeId: string,
    seed: string,
    now = Date.now(),
): MultiverseState {
    if (!UNIVERSES.some((world) => world.id === universeId)) return state;
    return {
        ...state,
        active: { universeId, seed: seed.trim().slice(0, 32) || createExpeditionSeed(), startedAt: now },
    };
}

export function completeMultiverseExpedition(
    state: MultiverseState,
    stats: { score: number; finishedCount: number; specialCount: number },
    now = Date.now(),
): MultiverseState {
    if (!state.active) return state;
    const universe = UNIVERSES.find((world) => world.id === state.active?.universeId);
    if (!universe) return { ...state, active: null };
    const performance = stats.score + stats.finishedCount * 8 + stats.specialCount * 240;
    const buildMultiplier =
        (state.blessings.includes("golden-division") ? 1.2 : 1) * (1 + state.equippedRelics.length * 0.06);
    const shards = Math.max(
        8,
        Math.round((performance / 900 + universe.risk * 7) * (1 + state.rank * 0.025) * buildMultiplier),
    );
    const grade =
        performance >= 18000
            ? "Ω"
            : performance >= 10000
              ? "S"
              : performance >= 6000
                ? "A"
                : performance >= 3000
                  ? "B"
                  : "C";
    const totalExpeditions = state.totalExpeditions + 1;
    const relicCandidate = RELICS[Math.min(RELICS.length - 1, Math.floor((totalExpeditions - 1) / 2))];
    const relic = totalExpeditions % 2 === 0 && !state.unlockedRelics.includes(relicCandidate) ? relicCandidate : null;
    const totalShards = state.shards + shards;
    const result: MultiverseResult = {
        universeId: universe.id,
        universeName: universe.name,
        score: stats.score,
        finishedCount: stats.finishedCount,
        shards,
        grade,
        relic,
        completedAt: now,
    };
    const dailyKey = state.active.seed.split("-")[0] || "daily";
    const achievements = [...state.achievements];
    if (!achievements.includes("first-jump")) achievements.push("first-jump");
    if (Object.keys(state.discovered).length >= 5 && !achievements.includes("six-worlds"))
        achievements.push("six-worlds");
    if (result.grade === "Ω" && !achievements.includes("omega")) achievements.push("omega");
    const trueEndingUnlocked =
        state.trueEndingUnlocked || (Object.keys(state.discovered).length >= 5 && state.unlockedRelics.length >= 6);
    return {
        ...state,
        shards: totalShards,
        rank: Math.min(99, 1 + Math.floor(Math.sqrt(totalShards / 45))),
        totalExpeditions,
        bestScore: Math.max(state.bestScore, stats.score),
        discovered: { ...state.discovered, [universe.id]: (state.discovered[universe.id] ?? 0) + 1 },
        unlockedRelics: relic ? [...state.unlockedRelics, relic] : state.unlockedRelics,
        active: null,
        lastResult: result,
        chronicle: [result, ...state.chronicle].slice(0, 40),
        dailyBest: { ...state.dailyBest, [dailyKey]: Math.max(state.dailyBest[dailyKey] ?? 0, stats.score) },
        achievements,
        titles:
            trueEndingUnlocked && !state.titles.includes("最後の観測者")
                ? [...state.titles, "最後の観測者"]
                : state.titles,
        trueEndingUnlocked,
    };
}

export function toggleRelic(state: MultiverseState, relic: string): MultiverseState {
    if (!state.unlockedRelics.includes(relic)) return state;
    const equipped = state.equippedRelics.includes(relic)
        ? state.equippedRelics.filter((x) => x !== relic)
        : [...state.equippedRelics, relic].slice(-3);
    return { ...state, equippedRelics: equipped };
}

export function chooseBlessing(state: MultiverseState, id: string): MultiverseState {
    const blessing = BLESSINGS.find((x) => x.id === id);
    if (!blessing || state.blessings.includes(id)) return state;
    return {
        ...state,
        blessings: [...state.blessings, id].slice(-4),
        curses: [...state.curses, blessing.curse].slice(-4),
    };
}

export function evolveFamiliar(state: MultiverseState): MultiverseState {
    const forms = ["原初形態", "星界共鳴体", "超越融合体", "終極観測獣"];
    const index = forms.indexOf(state.familiarForm);
    const cost = (index + 1) * 120;
    return index < 0 || index >= forms.length - 1 || state.shards < cost
        ? state
        : { ...state, shards: state.shards - cost, familiarForm: forms[index + 1] };
}

export function getSeededRoute(seed: string, universeId: string): Array<{ label: string; icon: string }> {
    let hash = 2166136261;
    for (const char of `${seed}:${universeId}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    const nodes = [
        { label: "未知現象", icon: "?" },
        { label: "奇跡祭壇", icon: "✦" },
        { label: "星間商人", icon: "¤" },
        { label: "ゴースト競争", icon: "♙" },
    ];
    return Array.from({ length: 5 }, (_, i) =>
        i === 4 ? { label: "宇宙ボス", icon: "♛" } : nodes[Math.abs(hash + i * 7919) % nodes.length],
    );
}

export function getActiveUniverse(state: MultiverseState): UniverseDef | null {
    return UNIVERSES.find((world) => world.id === state.active?.universeId) ?? null;
}
