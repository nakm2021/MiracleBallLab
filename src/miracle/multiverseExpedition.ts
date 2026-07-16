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

const RELICS = ["反重力の羽根", "黒星の心臓", "零秒歯車", "生命樹の種", "終焉炉の鍵", "鏡像プリズム", "観測者の王冠"];

export function createInitialMultiverseState(): MultiverseState {
    return {
        version: 1,
        shards: 0,
        rank: 1,
        totalExpeditions: 0,
        bestScore: 0,
        discovered: {},
        unlockedRelics: [],
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
    const shards = Math.max(8, Math.round((performance / 900 + universe.risk * 7) * (1 + state.rank * 0.025)));
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
    };
}

export function getActiveUniverse(state: MultiverseState): UniverseDef | null {
    return UNIVERSES.find((world) => world.id === state.active?.universeId) ?? null;
}
