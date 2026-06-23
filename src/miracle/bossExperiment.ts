import type { ThemeMode } from "./types";
import type { BossExperimentRecord } from "./types";
import { escapeHtml } from "./utils";

export type BossWeakness = "start" | "center" | "premium" | "miracle";

export type BossExperimentDef = {
    id: string;
    name: string;
    title: string;
    assetPath: string;
    hp: number;
    targetCount: number;
    timeLimitSec: number;
    activeLimit: number;
    weakness: BossWeakness;
    color: string;
    rewardPoint: number;
    rewardTheme?: ThemeMode;
    description: string;
};

export const BOSS_EXPERIMENT_DEFS: BossExperimentDef[] = [
    { id: "gravity-kraken", name: "重力クラーケン", title: "第一封印実験", assetPath: "assets/generated/boss-kraken.png", hp: 260000, targetCount: 900, timeLimitSec: 55, activeLimit: 16, weakness: "center", color: "#0ea5e9", rewardPoint: 8, rewardTheme: "ocean", description: "中央役物に弱い深海型ボス。盤面に重い潮流を発生させます。" },
    { id: "thunder-emperor", name: "雷帝ヤクモノ", title: "帯電討伐実験", assetPath: "assets/generated/boss-thunder.png", hp: 420000, targetCount: 1300, timeLimitSec: 65, activeLimit: 18, weakness: "premium", color: "#facc15", rewardPoint: 14, rewardTheme: "thunder", description: "PREMIUM通過で大きく削れる高火力ボス。レア玉ダメージも伸びます。" },
    { id: "solar-lion", name: "獅子王ソルレオ", title: "太陽咆哮実験", assetPath: "assets/generated/boss-lion.png", hp: 360000, targetCount: 1200, timeLimitSec: 60, activeLimit: 17, weakness: "start", color: "#f59e0b", rewardPoint: 12, rewardTheme: "gold", description: "START通過で咆哮を崩せる神獣型ボス。黄金のたてがみが盤面を照らします。" },
    { id: "crimson-dragon", name: "紅蓮竜ヴォルガ", title: "火山竜討伐実験", assetPath: "assets/generated/boss-dragon.png", hp: 520000, targetCount: 1400, timeLimitSec: 70, activeLimit: 18, weakness: "premium", color: "#ef4444", rewardPoint: 16, rewardTheme: "volcano", description: "PREMIUM通過に弱い竜型ボス。火山の熱で玉の軌道を荒らします。" },
    { id: "rune-golem", name: "古代ゴーレム・ノア", title: "巨石防衛実験", assetPath: "assets/generated/boss-golem.png", hp: 680000, targetCount: 1600, timeLimitSec: 80, activeLimit: 18, weakness: "center", color: "#64748b", rewardPoint: 18, rewardTheme: "retro", description: "中央役物で装甲を砕く巨石ボス。高HPですが削り切れば大きな報酬になります。" },
    { id: "inferno-phoenix", name: "不死鳥イグニス", title: "再燃飛翔実験", assetPath: "assets/generated/boss-phoenix.png", hp: 460000, targetCount: 1350, timeLimitSec: 68, activeLimit: 18, weakness: "miracle", color: "#f97316", rewardPoint: 16, rewardTheme: "sunset", description: "奇跡発生で羽根を散らせる鳥型ボス。終盤ほど炎の存在感が増します。" },
    { id: "glacier-titan", name: "氷河巨人グレイシャ", title: "凍結巨人実験", assetPath: "assets/generated/boss-glacier.png", hp: 720000, targetCount: 1700, timeLimitSec: 85, activeLimit: 19, weakness: "center", color: "#38bdf8", rewardPoint: 20, rewardTheme: "glacier", description: "中央役物で氷殻を割る巨人型ボス。硬いぶん討伐報酬も重めです。" },
    { id: "venom-hydra", name: "毒蛇ヒュドラ", title: "多頭毒牙実験", assetPath: "assets/generated/boss-hydra.png", hp: 560000, targetCount: 1450, timeLimitSec: 72, activeLimit: 18, weakness: "start", color: "#8b5cf6", rewardPoint: 17, rewardTheme: "poison", description: "START通過で毒牙のリズムを崩す蛇型ボス。複数の頭が盤面へ圧をかけます。" },
    { id: "oni-shogun", name: "鬼武者カゲトラ", title: "和風決闘実験", assetPath: "assets/generated/boss-oni.png", hp: 620000, targetCount: 1550, timeLimitSec: 76, activeLimit: 19, weakness: "premium", color: "#dc2626", rewardPoint: 19, rewardTheme: "wafuu", description: "PREMIUM通過で大きく斬り返せる武者型ボス。赤い霊気で演出が締まります。" },
    { id: "thorn-queen", name: "茨女王ヴェルダ", title: "森羅拘束実験", assetPath: "assets/generated/boss-forest.png", hp: 600000, targetCount: 1500, timeLimitSec: 74, activeLimit: 18, weakness: "miracle", color: "#22c55e", rewardPoint: 18, rewardTheme: "forest", description: "奇跡発生で蔦をほどく森の女王。植物型の大きなシルエットが盤面に根を張ります。" },
    { id: "cyber-fortress", name: "機械要塞ゼロギア", title: "電脳要塞実験", assetPath: "assets/generated/boss-mech.png", hp: 820000, targetCount: 1900, timeLimitSec: 95, activeLimit: 20, weakness: "premium", color: "#06b6d4", rewardPoint: 24, rewardTheme: "cyber", description: "PREMIUM通過で炉心を撃ち抜くメカ型ボス。最高クラスの耐久を持つ要塞です。" },
    { id: "void-director", name: "虚無主任影", title: "神域最終実験", assetPath: "assets/generated/boss-void.png", hp: 760000, targetCount: 1800, timeLimitSec: 90, activeLimit: 20, weakness: "miracle", color: "#a855f7", rewardPoint: 26, rewardTheme: "temple", description: "奇跡そのものを弱点にする最終級ボス。SSR以上で大ダメージ。" },
    { id: "abyss-leviathan", name: "深淵リヴァイアサン", title: "海淵咆哮実験", assetPath: "assets/generated/boss-leviathan.png", hp: 700000, targetCount: 1650, timeLimitSec: 82, activeLimit: 19, weakness: "center", color: "#0284c7", rewardPoint: 21, rewardTheme: "ocean", description: "中央役物で潮流を割る海獣型ボス。クラーケンとは違う巨大魚竜シルエットです。" },
    { id: "lunar-sphinx", name: "月読スフィンクス", title: "月砂守護実験", assetPath: "assets/generated/boss-sphinx.png", hp: 540000, targetCount: 1420, timeLimitSec: 70, activeLimit: 18, weakness: "start", color: "#c084fc", rewardPoint: 17, rewardTheme: "temple", description: "START通過で守護紋を揺らすスフィンクス型ボス。獅子王とは別の月光守護獣です。" },
    { id: "chrono-mantis", name: "時空カマキリ・クロノス", title: "時間切断実験", assetPath: "assets/generated/boss-mantis.png", hp: 640000, targetCount: 1580, timeLimitSec: 78, activeLimit: 19, weakness: "miracle", color: "#14b8a6", rewardPoint: 20, rewardTheme: "neon", description: "奇跡発生で時間鎌を鈍らせる昆虫型ボス。鋭い腕と時計輪が特徴です。" },
    { id: "candy-behemoth", name: "キャンディ巨獣ボンボン", title: "甘味暴走実験", assetPath: "assets/generated/boss-candy.png", hp: 480000, targetCount: 1320, timeLimitSec: 64, activeLimit: 17, weakness: "premium", color: "#fb7185", rewardPoint: 15, rewardTheme: "candy", description: "PREMIUM通過で砂糖装甲を割る甘味型ボス。かわいい見た目ですがかなり硬いです。" },
];

export function getBossDef(id: string | null): BossExperimentDef | null {
    return BOSS_EXPERIMENT_DEFS.find((x) => x.id === id) ?? null;
}

export function getBossWeaknessLabel(weakness: BossWeakness): string {
    if (weakness === "start") return "START通過";
    if (weakness === "center") return "役物通過";
    if (weakness === "premium") return "PREMIUM通過";
    return "奇跡発生";
}

export function getBossAssetUrl(boss: BossExperimentDef, baseUrl = import.meta.env.BASE_URL): string {
    return `${baseUrl}${boss.assetPath}`;
}

export function getBossResultHtml(record: BossExperimentRecord | null): string {
    if (!record) return "";
    return `<div style="margin:0 auto 18px;max-width:760px;padding:16px;border-radius:20px;background:${record.cleared ? "rgba(34,197,94,.18)" : "rgba(239,68,68,.16)"};border:1px solid rgba(255,255,255,.24);font-size:clamp(17px,2.6vw,28px);line-height:1.55;text-align:left;"><b>ボス実験: ${escapeHtml(record.bossName)} / ${record.cleared ? "討伐成功" : "討伐失敗"}</b><br>ダメージ ${record.damage.toLocaleString()} / ${record.maxHp.toLocaleString()}<br>結果: ${escapeHtml(record.rewardLabel)}</div>`;
}
