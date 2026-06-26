import type { LabWallFormulaEntry, SavedRecords } from "./types";

export type LabWallFormulaDef = {
    id: string;
    requiredRuns: number;
    formula: string;
    title: string;
    note: string;
};

export const LAB_WALL_FORMULA_DEFS: LabWallFormulaDef[] = [
    {
        id: "first-scratch",
        requiredRuns: 3,
        formula: "P(奇跡) ≠ 0",
        title: "最初のひっかき傷",
        note: "白い壁に、誰が書いたのか分からない小さな式が浮かんでいる。消しても、次に見ると少し濃くなる。",
    },
    {
        id: "observer-residue",
        requiredRuns: 7,
        formula: "観測者 + 玉 × 期待 = 偏り",
        title: "観測者の残り香",
        note: "式の横に、研究員の筆跡ではない丸い点が並ぶ。玉が通った数ではなく、見られた数を数えているようだ。",
    },
    {
        id: "discard-door",
        requiredRuns: 13,
        formula: "端 = 入口 / 0.000…",
        title: "捨て区間の扉",
        note: "捨て区間を示す矢印だけが、壁の裏側へ伸びている。そこに受け皿はないはずなのに、時々カチリと音がする。",
    },
    {
        id: "lab-answers-back",
        requiredRuns: 21,
        formula: "Lab(t+1) = Lab(t) + あなた",
        title: "研究所からの返答",
        note: "最後の項だけ、何度見ても自分の名前に読めそうで読めない。研究所はもう、実験結果だけを記録していない。",
    },
];

export function getUnlockedLabWallFormulaDefs(totalRuns: number): LabWallFormulaDef[] {
    return LAB_WALL_FORMULA_DEFS.filter((def) => totalRuns >= def.requiredRuns);
}

export function unlockLabWallFormulas(params: {
    records: SavedRecords;
    now: number;
}): { records: SavedRecords; unlocked: LabWallFormulaEntry[] } {
    const existing = new Set((params.records.labWallFormulas ?? []).map((entry) => entry.id));
    const unlocked = getUnlockedLabWallFormulaDefs(params.records.totalRuns)
        .filter((def) => !existing.has(def.id))
        .map((def) => ({
            id: def.id,
            formula: def.formula,
            title: def.title,
            note: def.note,
            unlockedAt: params.now,
            runCount: params.records.totalRuns,
        }));

    if (unlocked.length === 0) return { records: params.records, unlocked };

    return {
        records: {
            ...params.records,
            labWallFormulas: [
                ...unlocked.slice().reverse(),
                ...(params.records.labWallFormulas ?? []),
            ].slice(0, 80),
        },
        unlocked,
    };
}
