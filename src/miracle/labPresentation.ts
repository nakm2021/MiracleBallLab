import type { DailyMissionDef } from "./types";
import type { ResearchRankInfo, ThemeCollectionEntry } from "./types";
import type { ExperimentPresetDef } from "./researchFeatures";
import { escapeHtml } from "./utils";

export type DailyMissionView = {
    mission: DailyMissionDef;
    value: number;
    percent: number;
    done: boolean;
    themeLabel: string;
};

export function getDailyMissionHtml(today: string, entries: DailyMissionView[]): string {
    const rows = entries.map(({ mission, value, percent, done, themeLabel }) => `
        <div class="miracle-user-card" style="margin:12px 0;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                <b>${done ? "✅" : "⬜"} ${escapeHtml(mission.title)}</b>
                <span class="miracle-status-pill">+${mission.rewardScore.toLocaleString()}</span>
            </div>
            <div style="margin-top:6px;opacity:.86;">${escapeHtml(mission.description)}</div>
            <div style="margin-top:10px;height:12px;border-radius:999px;background:rgba(100,116,139,.22);overflow:hidden;"><div style="height:100%;width:${percent.toFixed(1)}%;background:linear-gradient(90deg,#86efac,#22d3ee);"></div></div>
            <div style="margin-top:6px;font-size:.92em;opacity:.82;">${value.toLocaleString()} / ${mission.target.toLocaleString()}　報酬テーマ: ${escapeHtml(themeLabel)}</div>
        </div>`
    ).join("");
    return `
        <p>毎日変わる研究ミッションです。達成するとスコアとテーマ解放が進みます。</p>
        ${rows}
        <p style="opacity:.75;">日付: ${escapeHtml(today)} / 実験完了時に自動判定します。</p>
    `;
}

export function getExperimentPresetHtml(presets: ExperimentPresetDef[]): string {
    const rows = presets.map((preset) => `
        <div class="miracle-user-card" style="display:grid;gap:10px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap;">
                <div>
                    <div style="font-size:1.12em;font-weight:1000;">${escapeHtml(preset.title)}</div>
                    <div style="opacity:.82;line-height:1.65;">${escapeHtml(preset.description)}</div>
                </div>
                <button class="miracle-home-button miracle-home-primary" data-preset-id="${preset.id}">反映</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;font-size:.9em;">
                <div><b>投下</b><br>${preset.targetCount.toLocaleString()}</div>
                <div><b>同時</b><br>${preset.activeLimit}</div>
                <div><b>盤面</b><br>${preset.binCount}皿 / ${preset.pinRows}段</div>
                <div><b>速度</b><br>${escapeHtml(preset.speed)}</div>
                <div><b>確率</b><br>${preset.probabilityMode}</div>
                <div><b>演出</b><br>${preset.effectsEnabled ? preset.effectMode : "OFF"}</div>
            </div>
        </div>
    `).join("");
    return `
        <div style="display:grid;gap:14px;">
            <div class="miracle-user-card">
                <b>よく使う設定をまとめて反映します。</b><br>
                <span style="opacity:.78;">投下数、同時玉数、盤面、速度、演出、確率モードを一括で切り替えます。反映すると盤面はリセットされます。</span>
            </div>
            ${rows}
        </div>
    `;
}

export function getResearchRankHtml(rank: ResearchRankInfo): string {
    return `
        <div class="miracle-user-card">
            <p style="font-size:1.3em;margin-top:0;"><b>Lv.${rank.level} ${escapeHtml(rank.label)}</b></p>
            <div style="height:16px;border-radius:999px;background:rgba(100,116,139,.22);overflow:hidden;"><div style="height:100%;width:${rank.progressPercent.toFixed(1)}%;background:linear-gradient(90deg,#fbbf24,#a78bfa,#22d3ee);"></div></div>
            <p>研究ポイント: <b>${rank.score.toLocaleString()}</b>${rank.progressPercent >= 100 ? " / 最高ランク到達" : ` / 次 ${rank.nextScore.toLocaleString()}`}</p>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>ランクに影響するもの</b></p>
            <ul style="line-height:1.8;margin-bottom:0;">
                <li>通算スコア、最高スコア</li>
                <li>実験完了回数</li>
                <li>発見済み奇跡の種類</li>
                <li>奇跡合成・秘密解放</li>
                <li>最高レア度</li>
            </ul>
        </div>
    `;
}

export function getThemeBookHtml(entries: ThemeCollectionEntry[], isEnglish: boolean): string {
    const rows = entries.map((entry) => `
        <div class="miracle-user-card" style="margin:10px 0;opacity:${entry.unlocked ? "1" : ".62"};">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                <b>${entry.unlocked ? "🎨" : "🔒"} ${escapeHtml(isEnglish ? entry.en : entry.ja)}</b>
                <span class="miracle-status-pill">${entry.unlocked ? "解放済み" : "未解放"}</span>
            </div>
            <div style="margin-top:6px;opacity:.84;">${escapeHtml(entry.reason)}</div>
            ${entry.unlocked ? `<button style="margin-top:10px;" data-theme-book-select="${entry.value}">このテーマにする</button>` : ""}
        </div>`).join("");
    const unlocked = entries.filter((x) => x.unlocked).length;
    return `
        <p>テーマの解放状況です。テーマは見た目のカスタマイズ・毎日の遊び直し要素として使えます。</p>
        <p><b>${unlocked} / ${entries.length}</b> 解放済み</p>
        ${rows}
    `;
}
