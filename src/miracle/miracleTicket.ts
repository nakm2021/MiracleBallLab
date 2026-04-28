export type MiracleTicketState = {
    normal: number;
    rare: number;
    divine: number;
    totalEarned: number;
    totalSpent: number;
    history: MiracleTicketHistoryEntry[];
};

export type MiracleTicketHistoryEntry = {
    id: string;
    at: number;
    label: string;
    amount: number;
    kind: keyof Omit<MiracleTicketState, "totalEarned" | "totalSpent" | "history">;
    reason: string;
};

export type MiracleTicketReward = {
    normal: number;
    rare: number;
    divine: number;
};

const STORAGE_KEY = "miracle-ball-lab-tickets-v1";

type TicketKind = "normal" | "rare" | "divine";

function createId(): string {
    try {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    } catch {}
    return `ticket-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialMiracleTicketState(): MiracleTicketState {
    return { normal: 0, rare: 0, divine: 0, totalEarned: 0, totalSpent: 0, history: [] };
}

export function normalizeMiracleTicketState(value: unknown): MiracleTicketState {
    const base = createInitialMiracleTicketState();
    if (!value || typeof value !== "object") return base;
    const raw = value as Partial<MiracleTicketState>;
    return {
        normal: Math.max(0, Math.floor(Number(raw.normal) || 0)),
        rare: Math.max(0, Math.floor(Number(raw.rare) || 0)),
        divine: Math.max(0, Math.floor(Number(raw.divine) || 0)),
        totalEarned: Math.max(0, Math.floor(Number(raw.totalEarned) || 0)),
        totalSpent: Math.max(0, Math.floor(Number(raw.totalSpent) || 0)),
        history: Array.isArray(raw.history) ? raw.history.slice(0, 50).map((x) => ({
            id: typeof x?.id === "string" ? x.id : createId(),
            at: Number(x?.at) || Date.now(),
            label: typeof x?.label === "string" ? x.label : "チケット記録",
            amount: Math.max(0, Math.floor(Number(x?.amount) || 0)),
            kind: x?.kind === "rare" || x?.kind === "divine" ? x.kind : "normal",
            reason: typeof x?.reason === "string" ? x.reason : "",
        })) : base.history,
    };
}

export function loadMiracleTicketState(): MiracleTicketState {
    try { return normalizeMiracleTicketState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); } catch { return createInitialMiracleTicketState(); }
}

export function saveMiracleTicketState(state: MiracleTicketState): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeMiracleTicketState(state))); } catch {}
}

function addHistory(state: MiracleTicketState, kind: TicketKind, amount: number, label: string, reason: string): MiracleTicketState {
    const next = normalizeMiracleTicketState(state);
    if (amount <= 0) return next;
    next[kind] += amount;
    next.totalEarned += amount;
    next.history = [{ id: createId(), at: Date.now(), label, amount, kind, reason }, ...next.history].slice(0, 50);
    return next;
}

export function getTicketRewardForRank(rank: string): MiracleTicketReward {
    const upper = rank.toUpperCase();
    if (upper.includes("GOD")) return { normal: 20, rare: 8, divine: 2 };
    if (upper.includes("EX")) return { normal: 14, rare: 5, divine: 1 };
    if (upper.includes("UR")) return { normal: 8, rare: 3, divine: 0 };
    if (upper.includes("SSR")) return { normal: 5, rare: 1, divine: 0 };
    if (upper.includes("SR")) return { normal: 3, rare: 0, divine: 0 };
    return { normal: 1, rare: 0, divine: 0 };
}

export function awardTicketsForRank(state: MiracleTicketState, rank: string, label: string): { state: MiracleTicketState; reward: MiracleTicketReward } {
    const reward = getTicketRewardForRank(rank);
    let next = normalizeMiracleTicketState(state);
    if (reward.normal) next = addHistory(next, "normal", reward.normal, label, `${rank}観測`);
    if (reward.rare) next = addHistory(next, "rare", reward.rare, label, `${rank}観測`);
    if (reward.divine) next = addHistory(next, "divine", reward.divine, label, `${rank}観測`);
    saveMiracleTicketState(next);
    return { state: next, reward };
}

export function spendMiracleTickets(state: MiracleTicketState, cost: Partial<Record<TicketKind, number>>): { ok: boolean; state: MiracleTicketState; message: string } {
    const next = normalizeMiracleTicketState(state);
    const normal = Math.max(0, Math.floor(cost.normal ?? 0));
    const rare = Math.max(0, Math.floor(cost.rare ?? 0));
    const divine = Math.max(0, Math.floor(cost.divine ?? 0));
    if (next.normal < normal || next.rare < rare || next.divine < divine) return { ok: false, state: next, message: "チケットが足りません" };
    next.normal -= normal;
    next.rare -= rare;
    next.divine -= divine;
    next.totalSpent += normal + rare + divine;
    next.history = [{ id: createId(), at: Date.now(), label: "チケット使用", amount: normal + rare + divine, kind: divine ? "divine" : rare ? "rare" : "normal", reason: "研究ブースト" }, ...next.history].slice(0, 50);
    saveMiracleTicketState(next);
    return { ok: true, state: next, message: "チケットを使用しました" };
}
