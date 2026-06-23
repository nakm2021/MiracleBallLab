import type { FamiliarKind } from "./types";

export type FamiliarExpeditionPlan = {
    id: string;
    title: string;
    minutes: number;
    description: string;
    xp: number;
    affection: number;
    ticketNormal: number;
    ticketRare: number;
    noteId?: string;
};

export type FamiliarExpeditionState = {
    active?: { planId: string; familiarKind: FamiliarKind; startedAt: number; endsAt: number };
    completedCount: number;
    lastClaimedAt: number;
    history: FamiliarExpeditionHistoryEntry[];
};

export type FamiliarExpeditionHistoryEntry = {
    id: string;
    at: number;
    planId: string;
    title: string;
    familiarKind: FamiliarKind;
    xp: number;
    affection: number;
    ticketNormal: number;
    ticketRare: number;
    noteId?: string;
};

export const FAMILIAR_EXPEDITION_PLANS: FamiliarExpeditionPlan[] = [
    { id: "mini", title: "10分・机の下探索", minutes: 10, description: "短時間で素材を拾う安全な遠征です。", xp: 40, affection: 8, ticketNormal: 1, ticketRare: 0, noteId: "under-desk" },
    { id: "half", title: "30分・捨て区画巡回", minutes: 30, description: "捨て区画の気配を調べます。", xp: 110, affection: 18, ticketNormal: 2, ticketRare: 0, noteId: "discard-zone" },
    { id: "deep", title: "3時間・深夜研究所", minutes: 180, description: "長めの遠征。秘密ノートやレアチケットを狙えます。", xp: 520, affection: 80, ticketNormal: 6, ticketRare: 1, noteId: "midnight-lab" },
];

const STORAGE_KEY = "miracle-ball-lab-familiar-expedition-v1";

function createId(): string {
    return `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialFamiliarExpeditionState(): FamiliarExpeditionState {
    return { completedCount: 0, lastClaimedAt: 0, history: [] };
}

export function normalizeFamiliarExpeditionState(value: unknown): FamiliarExpeditionState {
    const base = createInitialFamiliarExpeditionState();
    if (!value || typeof value !== "object") return base;
    const raw = value as Partial<FamiliarExpeditionState>;
    const active = raw.active && typeof raw.active === "object" ? raw.active : undefined;
    return {
        active: active && typeof active.planId === "string" ? {
            planId: active.planId,
            familiarKind: (active.familiarKind as FamiliarKind) || "mame",
            startedAt: Number(active.startedAt) || Date.now(),
            endsAt: Number(active.endsAt) || Date.now(),
        } : undefined,
        completedCount: Math.max(0, Math.floor(Number(raw.completedCount) || 0)),
        lastClaimedAt: Number(raw.lastClaimedAt) || 0,
        history: Array.isArray(raw.history) ? raw.history.slice(0, 30).map((x) => ({
            id: typeof x?.id === "string" ? x.id : createId(),
            at: Number(x?.at) || Date.now(),
            planId: typeof x?.planId === "string" ? x.planId : "mini",
            title: typeof x?.title === "string" ? x.title : "遠征",
            familiarKind: (x?.familiarKind as FamiliarKind) || "mame",
            xp: Math.max(0, Math.floor(Number(x?.xp) || 0)),
            affection: Math.max(0, Math.floor(Number(x?.affection) || 0)),
            ticketNormal: Math.max(0, Math.floor(Number(x?.ticketNormal) || 0)),
            ticketRare: Math.max(0, Math.floor(Number(x?.ticketRare) || 0)),
            noteId: typeof x?.noteId === "string" ? x.noteId : undefined,
        })) : [],
    };
}

export function loadFamiliarExpeditionState(): FamiliarExpeditionState {
    try { return normalizeFamiliarExpeditionState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); } catch { return createInitialFamiliarExpeditionState(); }
}

export function saveFamiliarExpeditionState(state: FamiliarExpeditionState): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeFamiliarExpeditionState(state))); } catch {}
}

export function getFamiliarExpeditionPlan(id: string | undefined): FamiliarExpeditionPlan | undefined {
    return FAMILIAR_EXPEDITION_PLANS.find((x) => x.id === id);
}

export function startFamiliarExpedition(state: FamiliarExpeditionState, planId: string, familiarKind: FamiliarKind, now = Date.now()): { ok: boolean; state: FamiliarExpeditionState; message: string } {
    const next = normalizeFamiliarExpeditionState(state);
    if (next.active) return { ok: false, state: next, message: "すでに遠征中です" };
    const plan = getFamiliarExpeditionPlan(planId);
    if (!plan) return { ok: false, state: next, message: "遠征先が見つかりません" };
    next.active = { planId, familiarKind, startedAt: now, endsAt: now + plan.minutes * 60 * 1000 };
    saveFamiliarExpeditionState(next);
    return { ok: true, state: next, message: `${plan.title}に出発しました` };
}

export function getFamiliarExpeditionProgress(state: FamiliarExpeditionState, now = Date.now()): { active: boolean; complete: boolean; percent: number; remainingMs: number; plan?: FamiliarExpeditionPlan } {
    const active = normalizeFamiliarExpeditionState(state).active;
    if (!active) return { active: false, complete: false, percent: 0, remainingMs: 0 };
    const plan = getFamiliarExpeditionPlan(active.planId);
    const total = Math.max(1, active.endsAt - active.startedAt);
    const elapsed = Math.max(0, now - active.startedAt);
    return { active: true, complete: now >= active.endsAt, percent: Math.min(100, elapsed / total * 100), remainingMs: Math.max(0, active.endsAt - now), plan };
}

export function claimFamiliarExpedition(state: FamiliarExpeditionState, now = Date.now()): { ok: boolean; state: FamiliarExpeditionState; reward?: FamiliarExpeditionHistoryEntry; message: string } {
    const next = normalizeFamiliarExpeditionState(state);
    const active = next.active;
    if (!active) return { ok: false, state: next, message: "受け取れる遠征はありません" };
    const plan = getFamiliarExpeditionPlan(active.planId);
    if (!plan) { next.active = undefined; saveFamiliarExpeditionState(next); return { ok: false, state: next, message: "遠征データを整理しました" }; }
    if (now < active.endsAt) return { ok: false, state: next, message: "まだ遠征中です" };
    const reward: FamiliarExpeditionHistoryEntry = { id: createId(), at: now, planId: plan.id, title: plan.title, familiarKind: active.familiarKind, xp: plan.xp, affection: plan.affection, ticketNormal: plan.ticketNormal, ticketRare: plan.ticketRare, noteId: plan.noteId };
    next.active = undefined;
    next.completedCount += 1;
    next.lastClaimedAt = now;
    next.history = [reward, ...next.history].slice(0, 30);
    saveFamiliarExpeditionState(next);
    return { ok: true, state: next, reward, message: `${plan.title}から帰還しました` };
}
