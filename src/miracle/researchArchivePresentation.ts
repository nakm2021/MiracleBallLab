import type { ResearchReportEntry } from "./types";
import { escapeHtml } from "./utils";

export function getResearchArchiveHtml(reports: ResearchReportEntry[]): string {
    const bestScore = reports.slice().sort((a, b) => b.score - a.score)[0];
    const bestMiracle = reports.find((x) => x.bestMiracleRank !== "-");
    const averageScore =
        reports.length > 0 ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length) : 0;
    const totalFinished = reports.reduce((sum, report) => sum + report.finishedCount, 0);
    const gradeCounts = reports.reduce<Record<string, number>>((acc, report) => {
        acc[report.grade] = (acc[report.grade] ?? 0) + 1;
        return acc;
    }, {});
    const typeCounts = reports.reduce<Record<string, number>>((acc, report) => {
        acc[report.type] = (acc[report.type] ?? 0) + 1;
        return acc;
    }, {});
    const typeSummary =
        Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([type, count]) => `${escapeHtml(type)} ${count}`)
            .join(" / ") || "-";
    const rows =
        reports
            .map(
                (report) => `
        <div class="miracle-user-card" style="display:grid;gap:8px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
                <b>第${report.runNo}回 / ${escapeHtml(report.grade)} / ${escapeHtml(report.type)}</b>
                <span style="opacity:.72;">${new Date(report.createdAt).toLocaleString()}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;opacity:.86;">
                <div>処理 ${report.finishedCount.toLocaleString()}</div>
                <div>スコア ${report.score.toLocaleString()}</div>
                <div>最頻 ${escapeHtml(report.topLabel)} ${report.topCount.toLocaleString()}</div>
                <div>最高 ${escapeHtml(report.bestMiracleLabel)} [${escapeHtml(report.bestMiracleRank)}]</div>
            </div>
            <div style="opacity:.76;line-height:1.65;">${escapeHtml(report.memo)}</div>
            <div><button class="miracle-home-button" data-report-id="${escapeHtml(report.id)}">詳細</button></div>
        </div>
    `,
            )
            .join("") ||
        `<div class="miracle-user-card">まだ研究レポートはありません。実験を完了するとここに保存されます。</div>`;
    return `
        <div style="display:grid;gap:14px;">
            <div class="miracle-user-card">
                <b>過去の研究レポートを集計します。</b><br>
                <span style="opacity:.78;">実験完了時に保存された直近30件のレポートから、傾向とベスト記録を見返せます。</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
                <div class="miracle-user-card"><b>保存数</b><br><span style="font-size:1.45em;font-weight:1000;">${reports.length}</span></div>
                <div class="miracle-user-card"><b>平均スコア</b><br><span style="font-size:1.45em;font-weight:1000;">${averageScore.toLocaleString()}</span></div>
                <div class="miracle-user-card"><b>総処理</b><br><span style="font-size:1.45em;font-weight:1000;">${totalFinished.toLocaleString()}</span></div>
                <div class="miracle-user-card"><b>最高スコア</b><br>${bestScore ? `${bestScore.score.toLocaleString()} / 第${bestScore.runNo}回` : "-"}</div>
                <div class="miracle-user-card"><b>最高奇跡</b><br>${bestMiracle ? `${escapeHtml(bestMiracle.bestMiracleLabel)} [${escapeHtml(bestMiracle.bestMiracleRank)}]` : "-"}</div>
                <div class="miracle-user-card"><b>グレード</b><br>${
                    Object.entries(gradeCounts)
                        .sort()
                        .map(([grade, count]) => `${escapeHtml(grade)} ${count}`)
                        .join(" / ") || "-"
                }</div>
            </div>
            <div class="miracle-user-card"><b>観測タイプ傾向</b><br><span style="opacity:.82;">${typeSummary}</span></div>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button id="archive-export-button" class="miracle-home-button miracle-home-primary">JSON書き出し</button>
                <button id="archive-album-button" class="miracle-home-button">アルバムへ</button>
            </div>
            ${rows}
        </div>
    `;
}

export function getResearchReportDetailHtml(report: ResearchReportEntry): string {
    return `
        <div style="display:grid;gap:14px;">
            <div class="miracle-user-card">
                <b>${escapeHtml(report.grade)} / ${escapeHtml(report.type)}</b><br>
                <span style="opacity:.78;">${new Date(report.createdAt).toLocaleString()}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
                <div class="miracle-user-card"><b>指定投下</b><br>${report.targetCount.toLocaleString()}</div>
                <div class="miracle-user-card"><b>実処理</b><br>${report.finishedCount.toLocaleString()}</div>
                <div class="miracle-user-card"><b>捨て区画</b><br>${report.discardedCount.toLocaleString()}</div>
                <div class="miracle-user-card"><b>スコア</b><br>${report.score.toLocaleString()}</div>
                <div class="miracle-user-card"><b>最頻受け皿</b><br>${escapeHtml(report.topLabel)} ${report.topCount.toLocaleString()}</div>
                <div class="miracle-user-card"><b>最高奇跡</b><br>${escapeHtml(report.bestMiracleLabel)} [${escapeHtml(report.bestMiracleRank)}]</div>
            </div>
            <div class="miracle-user-card"><b>研究メモ</b><br><span style="opacity:.82;line-height:1.75;">${escapeHtml(report.memo)}</span></div>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button id="archive-detail-back-button" class="miracle-home-button miracle-home-primary">一覧へ戻る</button>
                <button id="archive-detail-copy-button" class="miracle-home-button">内容コピー</button>
            </div>
        </div>
    `;
}
