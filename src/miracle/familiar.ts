import type { DropKind, FamiliarDef, FamiliarKind, FamiliarMode, FamiliarState } from "./types";

export const FAMILIAR_STORAGE_KEY = "miracle-ball-lab-familiar-v1";

export const FAMILIAR_DEFS: FamiliarDef[] = [
    { kind: "mame", name: "まめピヨ", emoji: "🐣", color: "#facc15", accent: "#f97316", description: "最初から一緒にいる小さな研究助手。通常玉でも少しずつ育ちます。", secretCode: "" },
    { kind: "neko", name: "ねこ式使い魔", emoji: "🐈", color: "#fb7185", accent: "#be123c", description: "奇跡の気配に反応して、たまに小さな予兆を出します。", secretCode: "nekomata" },
    { kind: "kuro", name: "黒羽コウモリ", emoji: "🦇", color: "#111827", accent: "#a78bfa", description: "捨て区画に落ちた玉を見張る夜型の使い魔です。", secretCode: "kurohane" },
    { kind: "tokei", name: "時計キツネ", emoji: "🦊", color: "#38bdf8", accent: "#0f766e", description: "時間停止と相性がよく、コンボの研究を手伝います。", secretCode: "tokeikitsune" },
    { kind: "hoshi", name: "星くらげ", emoji: "🪼", color: "#818cf8", accent: "#f0abfc", description: "発見済みの奇跡が増えるほど、画面をふわっと漂います。", secretCode: "hoshikurage" },
    { kind: "miko", name: "秘密巫女うさぎ", emoji: "🐇", color: "#f9a8d4", accent: "#db2777", description: "スマホでも秘密契約できる、超レア寄りの使い魔です。", secretCode: "miko" },
];

export function createInitialFamiliarState(now = Date.now()): FamiliarState {
    return {
        kind: "mame",
        name: "まめピヨ",
        level: 1,
        xp: 0,
        affection: 0,
        mode: "assist",
        unlocked: { mame: now },
        secretContracts: {},
        lastAssistAt: 0,
        assistCount: 0,
        jackpotWhisperCount: 0,
    };
}

export function normalizeFamiliarState(value: unknown): FamiliarState {
    const base = createInitialFamiliarState();
    if (!value || typeof value !== "object") return base;
    const raw = value as Partial<FamiliarState>;
    const kind = FAMILIAR_DEFS.some((x) => x.kind === raw.kind) ? raw.kind as FamiliarKind : base.kind;
    const def = getFamiliarDef(kind) ?? FAMILIAR_DEFS[0];
    return {
        ...base,
        ...raw,
        kind,
        name: typeof raw.name === "string" && raw.name.trim() ? raw.name : def.name,
        level: Math.max(1, Math.floor(Number(raw.level) || 1)),
        xp: Math.max(0, Math.floor(Number(raw.xp) || 0)),
        affection: Math.max(0, Math.floor(Number(raw.affection) || 0)),
        mode: isFamiliarMode(raw.mode) ? raw.mode as FamiliarMode : "assist",
        unlocked: { ...base.unlocked, ...(raw.unlocked ?? {}) },
        secretContracts: { ...(raw.secretContracts ?? {}) },
        lastAssistAt: Number(raw.lastAssistAt) || 0,
        assistCount: Math.max(0, Math.floor(Number(raw.assistCount) || 0)),
        jackpotWhisperCount: Math.max(0, Math.floor(Number(raw.jackpotWhisperCount) || 0)),
    };
}

export function loadFamiliarState(): FamiliarState {
    try {
        return normalizeFamiliarState(JSON.parse(localStorage.getItem(FAMILIAR_STORAGE_KEY) || "null"));
    } catch {
        return createInitialFamiliarState();
    }
}

export function saveFamiliarState(state: FamiliarState): void {
    try { localStorage.setItem(FAMILIAR_STORAGE_KEY, JSON.stringify(normalizeFamiliarState(state))); } catch {}
}

export function getFamiliarDef(kind: FamiliarKind): FamiliarDef | undefined {
    return FAMILIAR_DEFS.find((x) => x.kind === kind);
}

export function getFamiliarLevelInfo(xp: number): { level: number; nextXp: number; progressPercent: number } {
    const safeXp = Math.max(0, Math.floor(xp));
    const level = Math.max(1, Math.floor(Math.sqrt(safeXp / 95)) + 1);
    const currentBase = Math.pow(level - 1, 2) * 95;
    const nextXp = Math.pow(level, 2) * 95;
    const progressPercent = Math.max(0, Math.min(100, ((safeXp - currentBase) / Math.max(1, nextXp - currentBase)) * 100));
    return { level, nextXp, progressPercent };
}

export function gainFamiliarXp(state: FamiliarState, amount: number, affection = 1): FamiliarState {
    const next = normalizeFamiliarState(state);
    next.xp += Math.max(0, Math.floor(amount));
    next.affection += Math.max(0, Math.floor(affection));
    const info = getFamiliarLevelInfo(next.xp);
    next.level = info.level;
    return next;
}

export function unlockFamiliar(state: FamiliarState, kind: FamiliarKind, now = Date.now()): { state: FamiliarState; unlockedNow: boolean } {
    const next = normalizeFamiliarState(state);
    if (next.unlocked[kind]) return { state: next, unlockedNow: false };
    next.unlocked[kind] = now;
    next.secretContracts[kind] = now;
    return { state: next, unlockedNow: true };
}

export function findFamiliarBySecretCode(code: string): FamiliarDef | undefined {
    const normalized = code.trim().toLowerCase().replace(/\s+/g, "");
    if (!normalized) return undefined;
    return FAMILIAR_DEFS.find((x) => x.secretCode && x.secretCode.toLowerCase() === normalized);
}

export function getFamiliarMood(state: FamiliarState): string {
    if (state.affection >= 5000) return "完全になついています";
    if (state.affection >= 1500) return "かなり信頼しています";
    if (state.affection >= 400) return "少しなついています";
    return "まだ様子を見ています";
}

export function getFamiliarModeLabel(mode: FamiliarMode): string {
    if (mode === "guard") return "見張り";
    if (mode === "lucky") return "幸運";
    if (mode === "chaos") return "暴走";
    return "補助";
}

export function getFamiliarDropXp(kind: DropKind, binIndex: number): number {
    if (kind === "normal") return binIndex >= 0 ? 1 : 0;
    if (kind === "gold") return 8;
    if (kind === "rainbow") return 18;
    if (kind === "crown" || kind === "shootingStar") return 45;
    if (kind === "heart" || kind === "blackSun") return 90;
    if (kind === "cosmicEgg") return 180;
    return 24;
}

function isFamiliarMode(value: unknown): value is FamiliarMode {
    return value === "assist" || value === "guard" || value === "lucky" || value === "chaos";
}
