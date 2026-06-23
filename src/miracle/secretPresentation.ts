import type { SecretDef } from "./types";
import { escapeHtml } from "./utils";

export const SECRET_DEFS: SecretDef[] = [
    { id: "keyword-miracle", label: "MIRACLE コード", hint: "PCで研究所の合言葉を英字入力", detail: "キーボードで隠しコードを入力しました。今日の研究所は少しだけ騒がしくなります。", rewardScore: 7777 },
    { id: "keyword-lab", label: "LAB コード", hint: "研究所の短縮名を英字入力", detail: "短い研究所コードを入力しました。", rewardScore: 5000 },
    { id: "keyword-neko", label: "NEKO コード", hint: "猫っぽい英字を入力", detail: "ねこちゃんモードの気配を呼びました。", rewardScore: 5000 },
    { id: "keyword-sun", label: "SUN コード", hint: "太陽に関係する英字を入力", detail: "黒い太陽を探す研究者用の短縮コードです。", rewardScore: 5000 },
    { id: "favicon-five-taps", label: "favicon 5連打", hint: "起動画面のロゴを連打", detail: "起動ロゴを5回タップしました。ロード画面にも秘密がありました。", rewardScore: 7777 },
    { id: "pause-seven-taps", label: "時間停止ごっこ", hint: "一時停止を短時間に何度も操作", detail: "一時停止操作を短時間に7回行いました。時間を止めようとする研究記録です。", rewardScore: 9000 },
    { id: "settings-three-open", label: "設定室の常連", hint: "スマホの設定画面を何度か開く", detail: "スマホ設定画面を3回開きました。設定画面にも観測ログが残ります。", rewardScore: 6000 },
    { id: "familiar-neko", label: "使い魔契約: ねこ式使い魔", hint: "使い魔研究室かPCキー入力で猫系コード", detail: "ねこ式使い魔を解放しました。", rewardScore: 14000 },
    { id: "familiar-kuro", label: "使い魔契約: 黒羽コウモリ", hint: "使い魔研究室かPCキー入力で黒羽系コード", detail: "黒羽コウモリを解放しました。", rewardScore: 14000 },
    { id: "familiar-tokei", label: "使い魔契約: 時計キツネ", hint: "使い魔研究室かPCキー入力で時計系コード", detail: "時計キツネを解放しました。", rewardScore: 14000 },
    { id: "familiar-hoshi", label: "使い魔契約: 星くらげ", hint: "使い魔研究室かPCキー入力で星系コード", detail: "星くらげを解放しました。", rewardScore: 14000 },
    { id: "familiar-miko", label: "使い魔契約: 秘密巫女うさぎ", hint: "使い魔研究室かPCキー入力で短い秘密コード", detail: "秘密巫女うさぎを解放しました。", rewardScore: 14000 },
    { id: "skill-combo-lab", label: "三種の介入", hint: "実験中に衝撃波→磁石→時止めの順で使う", detail: "盤面介入スキルを決まった順番で使いました。研究員が完全に介入しています。", rewardScore: 12000 },
];

export function getSecretUnlockHtml(label: string, detail: string, score: number): string {
    return `<p><b>${escapeHtml(label)}</b> を解放しました。</p><p>${escapeHtml(detail)}</p><p>報酬: +${score.toLocaleString()} score</p><p>研究レベルに少しだけボーナスが入ります。</p>`;
}

export function getSecretHtml(params: {
    defs: SecretDef[];
    unlocked: Record<string, number>;
    isMobile: boolean;
}): string {
    const unlockedCount = params.defs.filter((x) => params.unlocked[x.id]).length;
    const rows = params.defs.map((def) => {
        const ts = params.unlocked[def.id];
        const unlocked = !!ts;
        const title = unlocked ? def.label : "未発見の秘密操作";
        const mark = unlocked ? "✅" : "🔒";
        const titleColor = unlocked ? "#166534" : "#334155";
        const scoreColor = unlocked ? "#166534" : "#64748b";
        const size = params.isMobile ? "20px" : "17px";
        return `<div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">
                <b style="font-size:${size};color:${titleColor};">${mark} ${escapeHtml(title)}</b>
                <span style="font-weight:900;color:${scoreColor};">+${def.rewardScore.toLocaleString()}</span>
            </div>
            <div style="margin-top:6px;opacity:.78;line-height:1.55;">ヒント: ${escapeHtml(def.hint)}</div>
            <div style="margin-top:4px;opacity:.68;">${unlocked ? new Date(ts).toLocaleString() : "未解放"}</div>
        </div>`;
    }).join("");
    return `<p>秘密操作をゲーム内実績のように整理しました。見つけるとスコアと研究レベルに少しだけ反映されます。</p>
        <p><b>解放状況:</b> ${unlockedCount} / ${params.defs.length}</p>
        <div style="border-radius:18px;background:rgba(255,255,255,.70);padding:4px 14px;">${rows}</div>`;
}
