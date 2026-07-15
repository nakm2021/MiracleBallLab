export function getSafeStopResultHtml(params: { isMobile: boolean; researchMemoHtml: string }): string {
    return `
        <div style="max-width:820px;width:min(820px,94vw);padding:${params.isMobile ? "28px 18px" : "38px"};border-radius:30px;background:rgba(15,23,42,.82);box-shadow:0 28px 90px rgba(0,0,0,.50);text-align:center;">
            <div style="font-size:clamp(34px,7vw,72px);font-weight:1000;color:#fff;">安全停止しました</div>
            <div style="margin-top:16px;font-size:clamp(17px,3vw,28px);line-height:1.7;color:#e5e7eb;">物理エンジン、描画、演出タイマーを停止しました。<br>スマホではこの後ブラウザの戻るボタンやタブを閉じる操作で終了してください。</div>
            <div style="margin-top:20px;font-size:clamp(15px,2.4vw,22px);line-height:1.7;color:#cbd5e1;text-align:left;background:rgba(255,255,255,.08);padding:16px;border-radius:18px;">${params.researchMemoHtml}</div>
            <div style="margin-top:22px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;"><button id="safe-close-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(255,255,255,.35);cursor:pointer;font-weight:900;background:rgba(255,255,255,.16);color:#fff;">閉じる</button></div>
        </div>`;
}

export function getEndingResultHtml(params: {
    isMobile: boolean;
    title: string;
    line: string;
    finishedCount: number;
}): string {
    return `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 36%, rgba(255,255,255,.18), rgba(15,23,42,.82) 54%, rgba(0,0,0,.96));"></div>
        <div style="position:relative;max-width:900px;width:min(900px,94vw);padding:${params.isMobile ? "28px 18px" : "40px 48px"};border-radius:34px;background:rgba(15,23,42,.66);box-shadow:0 30px 90px rgba(0,0,0,.52);text-align:center;animation:ending-fade 2.4s ease-out forwards;">
            <style>@keyframes ending-fade{0%{opacity:0;transform:translateY(18px) scale(.98)}18%{opacity:1;transform:translateY(0) scale(1)}82%{opacity:1}100%{opacity:0;transform:translateY(-8px) scale(.99)}}</style>
            <div style="font-size:clamp(22px,4vw,38px);font-weight:1000;color:#fde68a;letter-spacing:.08em;">ENDING</div>
            <div style="margin-top:10px;font-size:clamp(38px,8vw,82px);font-weight:1000;color:#fff;text-shadow:0 8px 30px rgba(0,0,0,.66);">${params.title}</div>
            <div style="margin-top:16px;font-size:clamp(18px,3vw,30px);line-height:1.7;color:#e5e7eb;">${params.line}</div>
            <div style="margin-top:18px;font-size:clamp(16px,2.6vw,24px);color:#cbd5e1;">${params.finishedCount.toLocaleString()}回の落下を確認しました。</div>
        </div>`;
}

export function getFinalResultHtml(params: {
    runSummaryText: string;
    runScore: number;
    missionClearedCount: number;
    missionTotalCount: number;
    bestComboThisRun: number;
    dailyCompletedHtml: string;
    totalGachaPointAward: number;
    currentGachaPoint: number;
    finishGachaPoint: number;
    dailyGachaPoint: number;
    bossResultHtml: string;
    evaluationGrade: string;
    evaluationType: string;
    evaluationDensity: number;
    evaluationNote: string;
    reportRunNo: number;
    rankingHtml: string;
    probabilityModeLabel: string;
    discoveredCount: number;
    specialEventCount: number;
    discardedCount: number;
    researchMemoHtml: string;
    researchReportHtml: string;
}): string {
    return `
        <div style="position:relative;max-width:920px;width:min(920px,94vw);max-height:88dvh;overflow:auto;padding:28px;border-radius:26px;background:rgba(5,8,18,.58);box-shadow:0 24px 80px rgba(0,0,0,.42);">
            <button id="close-result-button" aria-label="閉じる" style="position:absolute;right:14px;top:14px;width:46px;height:46px;border-radius:999px;border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.18);color:#fff;font-size:28px;font-weight:900;line-height:1;cursor:pointer;">×</button>
            <div style="font-size:clamp(38px,8vw,78px);font-weight:900;margin-bottom:18px;">実験完了</div>
            <div style="font-size:clamp(22px,4vw,40px);margin-bottom:18px;">${params.runSummaryText}</div>
            <div style="font-size:clamp(20px,3vw,34px);margin-bottom:18px;">スコア <b>${params.runScore.toLocaleString()}</b> / ミッション ${params.missionClearedCount} / ${params.missionTotalCount} / 奇跡コンボ最高 ${params.bestComboThisRun}</div>
            ${params.dailyCompletedHtml}
            <div style="margin:0 auto 18px;max-width:760px;padding:14px;border-radius:18px;background:rgba(250,204,21,.16);border:1px solid rgba(250,204,21,.35);font-size:clamp(16px,2.4vw,26px);line-height:1.55;">奇跡ガチャP <b>+${params.totalGachaPointAward.toLocaleString()}P</b> / 所持 <b>${params.currentGachaPoint.toLocaleString()}P</b><br><span style="opacity:.80;">実験完了 +${params.finishGachaPoint.toLocaleString()}P${params.dailyGachaPoint > 0 ? ` / デイリー +${params.dailyGachaPoint.toLocaleString()}P` : ""}</span></div>
            ${params.bossResultHtml}
            <div style="margin:0 auto 18px;max-width:760px;padding:16px;border-radius:20px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.20);font-size:clamp(17px,2.6vw,28px);line-height:1.55;text-align:left;"><b>今回の研究評価: ${params.evaluationGrade}</b><br>観測タイプ: ${params.evaluationType}<br>奇跡濃度: ${params.evaluationDensity}%<br><span style="opacity:.82;">${params.evaluationNote}</span><br><span style="opacity:.82;">研究レポート #${params.reportRunNo} を奇跡アルバムに保存しました。</span></div>
            <div style="font-size:clamp(18px,3vw,34px);line-height:1.55;">${params.rankingHtml}</div>
            <div style="margin-top:20px;font-size:clamp(16px,2vw,26px);line-height:1.5;opacity:.95;">確率モードは <b>${params.probabilityModeLabel}</b> です。一番レアは <b>1兆分の1</b> の極秘イベント。出たら奇跡どころか、画面が伝説になります。</div>
            <div style="margin-top:24px;font-size:clamp(16px,2vw,28px);opacity:.9;">発見済み種類: ${params.discoveredCount.toLocaleString()} / ${params.specialEventCount}　捨て区画: ${params.discardedCount.toLocaleString()}</div>
            <div style="margin-top:18px;font-size:clamp(16px,2vw,26px);opacity:.95;text-align:left;background:rgba(255,255,255,.08);padding:16px;border-radius:18px;"><b>研究メモ自動生成</b><br>${params.researchMemoHtml}</div>
            <div style="margin-top:18px;font-size:clamp(16px,2vw,26px);opacity:.95;">${params.researchReportHtml}</div>
            <div style="margin-top:24px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;"><button id="copy-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">結果コピー</button><button id="download-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">CSV保存</button><button id="share-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);box-shadow:0 5px 14px rgba(90,96,180,.16);">録画・SNS</button><button id="bottom-close-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">閉じる</button></div>
        </div>`;
}
