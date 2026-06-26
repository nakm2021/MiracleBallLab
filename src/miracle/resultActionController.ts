export type ResultActionController = {
    copyResultCsv(): Promise<void>;
    downloadResultCsv(): void;
    closeFinalResult(): void;
};

export function createResultActionController(deps: {
    resultOverlay: HTMLElement;
    buildResultCsv: () => string;
    showMilestone: (message: string) => void;
    now: () => number;
}): ResultActionController {
    const copyResultCsv = async (): Promise<void> => {
        const csv = deps.buildResultCsv();
        try {
            await navigator.clipboard.writeText(csv);
            deps.showMilestone("結果CSVをコピーしました");
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = csv;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            deps.showMilestone("結果CSVをコピーしました");
        }
    };

    const downloadResultCsv = (): void => {
        const blob = new Blob(["\uFEFF" + deps.buildResultCsv()], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `matter-random-result-${deps.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        deps.showMilestone("CSVを保存しました");
    };

    const closeFinalResult = (): void => {
        deps.resultOverlay.style.display = "none";
        deps.resultOverlay.innerHTML = "";
    };

    return { copyResultCsv, downloadResultCsv, closeFinalResult };
}
