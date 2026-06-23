import type { MiracleLogEntry, ResearchReportEntry } from "./types";

export function stripResearchMemoHtml(html: string): string {
    const text = html.replace(/<br\s*\/?>(\n)?/gi, " / ").replace(/<[^>]+>/g, "");
    return text.replace(/\s+/g, " ").trim();
}

export function createResearchReportEntry(params: {
    now: number;
    random: () => number;
    runNo: number;
    targetCount: number;
    finishedCount: number;
    discardedCount: number;
    labels: string[];
    binCounts: number[];
    evaluation: { grade: string; type: string };
    runScore: number;
    bestMiracle?: MiracleLogEntry;
    memoHtml: string;
}): ResearchReportEntry {
    const ranking = params.binCounts
        .map((count, index) => ({ label: params.labels[index] ?? "-", count }))
        .sort((a, b) => b.count - a.count);
    const top = ranking[0] ?? { label: "-", count: 0 };

    return {
        id: `report-${params.now}-${Math.floor(params.random() * 100000)}`,
        createdAt: params.now,
        runNo: params.runNo,
        targetCount: params.targetCount,
        finishedCount: params.finishedCount,
        discardedCount: params.discardedCount,
        topLabel: top.label,
        topCount: top.count,
        grade: params.evaluation.grade,
        type: params.evaluation.type,
        score: params.runScore,
        bestMiracleLabel: params.bestMiracle?.label ?? "なし",
        bestMiracleRank: params.bestMiracle?.rank ?? "-",
        memo: stripResearchMemoHtml(params.memoHtml).slice(0, 260),
    };
}

export function prependResearchReport(params: {
    reports: ResearchReportEntry[] | undefined;
    report: ResearchReportEntry;
    limit: number;
}): ResearchReportEntry[] {
    return [
        params.report,
        ...((params.reports ?? []).filter((x) => x.id !== params.report.id)),
    ].slice(0, params.limit);
}
