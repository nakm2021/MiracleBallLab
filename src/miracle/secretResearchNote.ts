export type SecretResearchNoteDef = {
    id: string;
    title: string;
    hint: string;
    body: string;
    source: "secret" | "run" | "miracle" | "familiar" | "expedition";
};

export type SecretResearchNoteState = {
    unlocked: Record<string, number>;
    lastReadAt: number;
};

export const SECRET_RESEARCH_NOTES: SecretResearchNoteDef[] = [
    { id: "first-run", title: "第001記録：研究所の起動", source: "run", hint: "実験を1回終える", body: "玉は落ちる。だが、研究所は玉だけを見ていない。捨て区画、待機時間、押されたボタンまで、すべてが小さな記録になる。" },
    { id: "first-miracle", title: "第007記録：奇跡の匂い", source: "miracle", hint: "何かしらの奇跡を観測する", body: "奇跡は派手な音で来るとは限らない。ときどき、普通の玉の顔をして、受け皿の端でこちらを見ている。" },
    { id: "discard-zone", title: "第014記録：捨て区画には何かがいる", source: "expedition", hint: "捨て区画巡回の遠征", body: "捨て区画は失敗の置き場ではない。そこには、当たりになれなかった玉たちの小さな足音が残っている。" },
    { id: "under-desk", title: "第021記録：机の下の発見", source: "expedition", hint: "机の下探索の遠征", body: "まめピヨが机の下から古いチケットを拾ってきた。誰が落としたものかは不明。少しだけ温かい。" },
    { id: "midnight-lab", title: "第088記録：深夜の研究所", source: "expedition", hint: "深夜研究所の遠征", body: "深夜だけ、研究所の壁は少し薄くなる。星くらげは壁の向こうを泳ぎ、時計キツネは秒針を盗む。" },
    { id: "familiar-contract", title: "第103記録：契約したもの", source: "familiar", hint: "使い魔と秘密契約する", body: "使い魔は命令ではなく、気分で動く。だからこそ、研究所は少しだけ生き物に近づいた。" },
    { id: "divine-ticket", title: "第404記録：神域チケット", source: "miracle", hint: "EXまたはGOD級の奇跡を観測する", body: "神域チケットは紙ではない。確率が折りたたまれて、たまたま手のひらに乗っているだけだ。" },
];

const STORAGE_KEY = "miracle-ball-lab-secret-notes-v1";

export function createInitialSecretResearchNoteState(): SecretResearchNoteState {
    return { unlocked: {}, lastReadAt: 0 };
}

export function normalizeSecretResearchNoteState(value: unknown): SecretResearchNoteState {
    const base = createInitialSecretResearchNoteState();
    if (!value || typeof value !== "object") return base;
    const raw = value as Partial<SecretResearchNoteState>;
    return {
        unlocked: typeof raw.unlocked === "object" && raw.unlocked ? Object.fromEntries(Object.entries(raw.unlocked).map(([k, v]) => [k, Number(v) || Date.now()])) : {},
        lastReadAt: Number(raw.lastReadAt) || 0,
    };
}

export function loadSecretResearchNoteState(): SecretResearchNoteState {
    try { return normalizeSecretResearchNoteState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); } catch { return createInitialSecretResearchNoteState(); }
}

export function saveSecretResearchNoteState(state: SecretResearchNoteState): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSecretResearchNoteState(state))); } catch {}
}

export function unlockSecretResearchNote(state: SecretResearchNoteState, id: string, now = Date.now()): { state: SecretResearchNoteState; unlockedNow: boolean; note?: SecretResearchNoteDef } {
    const next = normalizeSecretResearchNoteState(state);
    const note = SECRET_RESEARCH_NOTES.find((x) => x.id === id);
    if (!note) return { state: next, unlockedNow: false };
    if (next.unlocked[id]) return { state: next, unlockedNow: false, note };
    next.unlocked[id] = now;
    saveSecretResearchNoteState(next);
    return { state: next, unlockedNow: true, note };
}

export function markSecretResearchNotesRead(state: SecretResearchNoteState, now = Date.now()): SecretResearchNoteState {
    const next = normalizeSecretResearchNoteState(state);
    next.lastReadAt = now;
    saveSecretResearchNoteState(next);
    return next;
}
