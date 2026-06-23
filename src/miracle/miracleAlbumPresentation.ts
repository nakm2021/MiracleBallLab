import type { MiracleLogEntry, ResearchReportEntry } from "./types";
import { escapeHtml } from "./utils";

export function getMiracleAlbumHtml(
    miracleLogs: MiracleLogEntry[],
    reports: ResearchReportEntry[],
    formatProbability: (denominator: number) => string,
): string {
    const miracleRows = miracleLogs.slice(0, 20).map((log, index) => `
        <div class="miracle-user-card" style="display:grid;gap:6px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;"><b>${index + 1}. ${escapeHtml(log.label)} [${escapeHtml(log.rank)}]</b><span style="opacity:.72;">${new Date(log.finishedAt).toLocaleString()}</span></div>
            <div style="opacity:.84;line-height:1.65;">${log.denominator > 0 ? formatProbability(log.denominator) : "派生解放"} / ${log.finishedCount.toLocaleString()}投目 / combo x${log.combo}${log.note ? ` / ${escapeHtml(log.note)}` : ""}</div>
        </div>
    `).join("") || `<p>まだ奇跡はありません。まずは実験を開始してください。</p>`;
    const reportRows = reports.slice(0, 12).map((report) => `
        <div class="miracle-user-card" style="display:grid;gap:6px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;"><b>第${report.runNo}回 実験レポート / ${escapeHtml(report.grade)}</b><span style="opacity:.72;">${new Date(report.createdAt).toLocaleString()}</span></div>
            <div style="opacity:.86;line-height:1.65;">${report.finishedCount.toLocaleString()}投下 / スコア ${report.score.toLocaleString()} / 最頻 ${escapeHtml(report.topLabel)} ${report.topCount.toLocaleString()}回 / 最高 ${escapeHtml(report.bestMiracleLabel)} [${escapeHtml(report.bestMiracleRank)}]</div>
            <div style="opacity:.76;line-height:1.65;">${escapeHtml(report.memo)}</div>
        </div>
    `).join("") || `<p>実験完了後に研究レポートが保存されます。</p>`;
    return `
        <div style="display:grid;gap:14px;">
            <div class="miracle-user-card"><b>神引きコレクション</b><br><span style="opacity:.78;">奇跡ログと研究レポートを保存し、あとから振り返れるようにしました。</span></div>
            <h3 style="margin:0;">奇跡カード</h3>
            ${miracleRows}
            <h3 style="margin:10px 0 0;">研究レポート履歴</h3>
            ${reportRows}
        </div>
    `;
}

export function getMiracleLogHtml(
    miracleLogs: MiracleLogEntry[],
    formatProbability: (denominator: number) => string,
    labels: {
        count: string;
        mode: string;
        speed: string;
    },
): string {
    if (miracleLogs.length === 0) return "";
    return miracleLogs.map((log, i) => `
        <div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <div style="font-weight:900;">${i + 1}. ${escapeHtml(log.label)} [${escapeHtml(log.rank)}] ${log.denominator > 0 ? formatProbability(log.denominator) : "派生解放"}</div>
            <div style="opacity:.78;">${labels.count}: ${log.finishedCount.toLocaleString()} / ${labels.mode}: ${escapeHtml(log.mode)} / ${labels.speed}: ${escapeHtml(log.speedLabel)} / combo x${log.combo}${log.note ? ` / ${escapeHtml(log.note)}` : ""}</div>
            <div style="opacity:.62;">${new Date(log.finishedAt).toLocaleString()}</div>
        </div>`).join("");
}
