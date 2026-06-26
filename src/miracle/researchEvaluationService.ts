import { escapeHtml } from "./utils";
import type { MiracleLogEntry } from "./types";

export type ResearchEvaluation = {
    grade: string;
    type: string;
    density: number;
    note: string;
};

export function evaluateResearchRun(params: {
    specialCreated: Record<string, number>;
    chainCount: number;
    finishedCount: number;
    discardedCount: number;
    binCount: number;
    binCounts: number[];
    bestComboThisRun: number;
    smallMiracleCount: number;
    hasOmen: boolean;
    runScore: number;
    clamp: (value: number, min: number, max: number) => number;
}): ResearchEvaluation {
    const specialCount = Object.values(params.specialCreated).reduce((a, b) => a + b, 0);
    const discardRate = params.finishedCount > 0 ? params.discardedCount / params.finishedCount : 0;
    const centerIndex = Math.floor(params.binCount / 2);
    const centerCount = params.binCounts[centerIndex] ?? 0;
    const centerRate = params.finishedCount > 0 ? centerCount / params.finishedCount : 0;
    const density = Math.round(params.clamp(
        specialCount * 16 + params.chainCount * 24 + params.bestComboThisRun * 7 + params.smallMiracleCount * 3 + (params.hasOmen ? 10 : 0),
        0,
        100,
    ));
    const score = params.runScore + specialCount * 9000 + params.chainCount * 18000 + density * 350 - discardRate * 12000;
    const grade = score > 120000 ? "S" : score > 70000 ? "A" : score > 35000 ? "B" : score > 12000 ? "C" : "D";
    const type = specialCount > 0 ? "奇跡観測型" : discardRate <= 0.06 ? "安定研究型" : centerRate >= 0.22 ? "中央集中型" : params.smallMiracleCount >= 2 ? "予兆多発型" : "基礎観測型";
    const note = grade === "S"
        ? "研究所の記録に残るかなり濃い実験です。"
        : grade === "A"
            ? "見せ場のある良い観測回です。"
            : grade === "B"
                ? "小さな変化を拾えた研究回です。"
                : grade === "C"
                    ? "次回の奇跡に向けた土台作りの回です。"
                    : "静かな基礎データとして保存されました。";
    return { grade, type, density, note };
}

export function buildResearchMemoText(params: {
    elapsed: string;
    finishedCount: number;
    discardedCount: number;
    labels: string[];
    binCounts: number[];
    bestMiracle?: MiracleLogEntry;
    lastOmenText?: string;
    rarePinSummary: string;
    pachinkoStartHits: number;
    pachinkoCenterHits: number;
    pachinkoPremiumHits: number;
    pachinkoJackpotCount: number;
    discoveredCount: number;
    specialEventCount: number;
}): string {
    const sum = params.binCounts.reduce((a, b) => a + b, 0) || 1;
    const maxCount = Math.max(...params.binCounts, 0);
    const minCount = Math.min(...params.binCounts);
    const topIndex = params.binCounts.indexOf(maxCount);
    const discardRate = params.finishedCount > 0 ? (params.discardedCount / params.finishedCount) * 100 : 0;
    const imbalance = ((maxCount - minCount) / sum) * 100;
    const mood = imbalance > 18
        ? "大きな偏りがあり、盤面がかなり主張した回でした。"
        : imbalance > 10
            ? "少し偏りがあり、中央か端に流れが寄った回でした。"
            : "分布は比較的落ち着いており、安定した観測になりました。";
    const miracleLine = params.bestMiracle
        ? `今回もっとも印象的だった奇跡は「${params.bestMiracle.label}」です。`
        : "今回は大きな奇跡は出ませんでしたが、通常観測として記録する価値があります。";
    const omenLine = params.lastOmenText
        ? `途中で「${params.lastOmenText}」という予兆が観測されました。`
        : "今回は目立った奇跡予兆は観測されませんでした。";
    return `今回の研究では ${params.finishedCount.toLocaleString()} 個のボールを処理しました。所要時間は ${params.elapsed}、捨て区間は ${params.discardedCount.toLocaleString()} 個（${discardRate.toFixed(2)}%）です。もっとも多かった受け皿は「${topIndex >= 0 ? params.labels[topIndex] : "-"}」で ${maxCount.toLocaleString()} 回でした。${mood}
${miracleLine}
${omenLine}
レアピン接触記録は ${params.rarePinSummary} です。役物通過は START:${params.pachinkoStartHits} / 役物:${params.pachinkoCenterHits} / PREMIUM:${params.pachinkoPremiumHits}、当選は ${params.pachinkoJackpotCount} 回です。奇跡図鑑は ${params.discoveredCount} / ${params.specialEventCount} 種類まで解放されています。`;
}

export function buildResearchMemoHtml(params: Parameters<typeof buildResearchMemoText>[0]): string {
    return escapeHtml(buildResearchMemoText(params)).replace(/\n/g, "<br>");
}
