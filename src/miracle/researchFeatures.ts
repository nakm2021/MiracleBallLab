import type { DropKind, EffectMode, ProbabilityMode, ThemeMode } from "./types";

export type ShopItemDef = {
    id: string;
    label: string;
    category: "facility" | "theme" | "ticket" | "preset";
    description: string;
    costPoint: number;
    costTickets?: { normal?: number; rare?: number; divine?: number };
    repeatable?: boolean;
    theme?: ThemeMode;
};

export const RESEARCH_SHOP_ITEMS: ShopItemDef[] = [
    {
        id: "archive-expansion",
        label: "アーカイブ拡張棚",
        category: "facility",
        description: "研究レポートの保存上限を30件から60件へ増やします。",
        costPoint: 8,
        costTickets: { normal: 1 },
    },
    {
        id: "gacha-point-booster",
        label: "実験完了P増幅器",
        category: "facility",
        description: "実験完了時の奇跡ガチャPが毎回+1されます。",
        costPoint: 12,
        costTickets: { normal: 2 },
    },
    {
        id: "cyber-theme-pass",
        label: "サイバー研究許可証",
        category: "theme",
        description: "テーマ「サイバー」をショップから解放します。",
        costPoint: 6,
        theme: "cyber",
    },
    {
        id: "glacier-theme-pass",
        label: "氷河研究許可証",
        category: "theme",
        description: "テーマ「氷河」をショップから解放します。",
        costPoint: 16,
        costTickets: { rare: 1 },
        theme: "glacier",
    },
    {
        id: "recording-studio",
        label: "録画スタジオ設備",
        category: "preset",
        description: "購入時に鑑賞・録画向け設定へ切り替え、録画導線を研究所に常設します。",
        costPoint: 5,
    },
    {
        id: "ticket-bundle",
        label: "奇跡チケット束",
        category: "ticket",
        description: "通常チケット5枚とレアチケット1枚へ交換します。何度でも購入できます。",
        costPoint: 10,
        repeatable: true,
    },
];

export type EventSeasonMissionMetric = "run" | "discovered" | "gacha" | "craft" | "score";

export type EventSeasonMissionDef = {
    id: string;
    label: string;
    description: string;
    metric: EventSeasonMissionMetric;
    target: number;
    rewardPoint: number;
    rewardTheme?: ThemeMode;
    rewardTickets?: { normal?: number; rare?: number; divine?: number };
};

export type EventSeasonDef = {
    id: string;
    title: string;
    subtitle: string;
    accent: string;
    rateBoost: number;
    theme: ThemeMode;
    missions: EventSeasonMissionDef[];
};

export const EVENT_SEASONS: EventSeasonDef[] = [
    {
        id: "deep-sea",
        title: "深海研究週間",
        subtitle: "沈んだ奇跡を拾い上げる、静かな収集シーズンです。",
        accent: "#0ea5e9",
        rateBoost: 1.08,
        theme: "ocean",
        missions: [
            { id: "run-2", label: "潜航実験", description: "実験を2回完了する", metric: "run", target: 2, rewardPoint: 4, rewardTheme: "ocean" },
            { id: "discover-5", label: "深海標本", description: "奇跡図鑑を5種類以上にする", metric: "discovered", target: 5, rewardPoint: 6, rewardTickets: { normal: 3 } },
            { id: "craft-1", label: "海底工房", description: "奇跡クラフトを1回行う", metric: "craft", target: 1, rewardPoint: 8, rewardTheme: "glacier" },
        ],
    },
    {
        id: "thunder-fes",
        title: "雷雲フェス",
        subtitle: "派手な演出とガチャ炉の反応が強まる短期観測です。",
        accent: "#facc15",
        rateBoost: 1.12,
        theme: "thunder",
        missions: [
            { id: "score-120k", label: "帯電スコア", description: "通算スコア120,000以上にする", metric: "score", target: 120000, rewardPoint: 6, rewardTheme: "thunder" },
            { id: "gacha-3", label: "雷鳴ガチャ", description: "奇跡ガチャ報酬を3件以上記録する", metric: "gacha", target: 3, rewardPoint: 8, rewardTickets: { rare: 1 } },
            { id: "discover-8", label: "閃光図鑑", description: "奇跡図鑑を8種類以上にする", metric: "discovered", target: 8, rewardPoint: 10, rewardTickets: { normal: 5 } },
        ],
    },
    {
        id: "god-domain",
        title: "神域観測祭",
        subtitle: "研究所全体が神域級の記録を待つ、長期成長シーズンです。",
        accent: "#a855f7",
        rateBoost: 1.16,
        theme: "temple",
        missions: [
            { id: "run-5", label: "神域巡回", description: "実験を5回完了する", metric: "run", target: 5, rewardPoint: 10, rewardTheme: "temple" },
            { id: "craft-3", label: "神域錬成", description: "奇跡クラフトを3種類解放する", metric: "craft", target: 3, rewardPoint: 14, rewardTickets: { rare: 2 } },
            { id: "score-500k", label: "神域論文", description: "通算スコア500,000以上にする", metric: "score", target: 500000, rewardPoint: 18, rewardTheme: "wafuu", rewardTickets: { divine: 1 } },
        ],
    },
];

export type MiracleCraftRecipeDef = {
    id: string;
    label: string;
    description: string;
    materialKinds: DropKind[];
    requiredCount: number;
    costPoint: number;
    rewardPoint: number;
    rewardTheme?: ThemeMode;
    rewardTickets?: { normal?: number; rare?: number; divine?: number };
};

export const MIRACLE_CRAFT_RECIPES: MiracleCraftRecipeDef[] = [
    {
        id: "royal-observatory",
        label: "王冠観測台",
        description: "王と流れ星の記録から、観測設備をクラフトします。",
        materialKinds: ["crown", "shootingStar"],
        requiredCount: 1,
        costPoint: 4,
        rewardPoint: 8,
        rewardTheme: "gold",
        rewardTickets: { normal: 2 },
    },
    {
        id: "heart-lucky-amulet",
        label: "幸運心拍アミュレット",
        description: "桃色ハートとラッキーセブンを研究素材化します。",
        materialKinds: ["heart", "luckySeven"],
        requiredCount: 1,
        costPoint: 6,
        rewardPoint: 12,
        rewardTheme: "candy",
        rewardTickets: { rare: 1 },
    },
    {
        id: "rift-forge",
        label: "時裂炉",
        description: "青い炎と時空の裂け目から、クラフト炉を強化します。",
        materialKinds: ["blueFlame", "timeRift"],
        requiredCount: 1,
        costPoint: 8,
        rewardPoint: 16,
        rewardTheme: "space",
        rewardTickets: { normal: 4, rare: 1 },
    },
    {
        id: "black-lab-core",
        label: "黒日研究炉心",
        description: "黒い太陽と研究所爆発の記録を封入する上位クラフトです。",
        materialKinds: ["blackSun", "labExplosion"],
        requiredCount: 1,
        costPoint: 14,
        rewardPoint: 28,
        rewardTheme: "poison",
        rewardTickets: { rare: 2, divine: 1 },
    },
];

export type ExperimentPresetId = "balanced" | "speed" | "showcase" | "collector" | "mobile";

export type ExperimentPresetDef = {
    id: ExperimentPresetId;
    title: string;
    description: string;
    targetCount: number;
    activeLimit: number;
    binCount: number;
    pinRows: number;
    speed: string;
    effectMode: EffectMode;
    probabilityMode: ProbabilityMode;
    simpleMode: boolean;
    effectsEnabled: boolean;
    slowMiracleEffects: boolean;
    boardAnomalyEnabled: boolean;
    normalBallTraitsEnabled: boolean;
    showRecentMiracles: boolean;
    mobileCompactMode: boolean;
    lowSpecMode: boolean;
};

export const EXPERIMENT_PRESETS: ExperimentPresetDef[] = [
    {
        id: "balanced",
        title: "標準研究",
        description: "普段使い向け。軽さと演出のバランスを取ります。",
        targetCount: 500,
        activeLimit: 15,
        binCount: 4,
        pinRows: 4,
        speed: "通常",
        effectMode: "normal",
        probabilityMode: "normal",
        simpleMode: false,
        effectsEnabled: true,
        slowMiracleEffects: false,
        boardAnomalyEnabled: true,
        normalBallTraitsEnabled: true,
        showRecentMiracles: false,
        mobileCompactMode: false,
        lowSpecMode: false,
    },
    {
        id: "speed",
        title: "高速周回",
        description: "記録とポイントを早めに集めるための軽量設定です。",
        targetCount: 1000,
        activeLimit: 10,
        binCount: 4,
        pinRows: 4,
        speed: "超高速",
        effectMode: "quiet",
        probabilityMode: "normal",
        simpleMode: true,
        effectsEnabled: false,
        slowMiracleEffects: false,
        boardAnomalyEnabled: false,
        normalBallTraitsEnabled: true,
        showRecentMiracles: false,
        mobileCompactMode: true,
        lowSpecMode: true,
    },
    {
        id: "showcase",
        title: "鑑賞・録画",
        description: "演出を見せる回。録画やSNS用の見栄えを優先します。",
        targetCount: 500,
        activeLimit: 12,
        binCount: 4,
        pinRows: 5,
        speed: "通常",
        effectMode: "recording",
        probabilityMode: "festival",
        simpleMode: false,
        effectsEnabled: true,
        slowMiracleEffects: true,
        boardAnomalyEnabled: true,
        normalBallTraitsEnabled: true,
        showRecentMiracles: true,
        mobileCompactMode: false,
        lowSpecMode: false,
    },
    {
        id: "collector",
        title: "図鑑収集",
        description: "発見数を増やすため、祭りモードと履歴表示を使います。",
        targetCount: 1500,
        activeLimit: 18,
        binCount: 5,
        pinRows: 5,
        speed: "高速",
        effectMode: "normal",
        probabilityMode: "festival",
        simpleMode: false,
        effectsEnabled: true,
        slowMiracleEffects: false,
        boardAnomalyEnabled: true,
        normalBallTraitsEnabled: true,
        showRecentMiracles: true,
        mobileCompactMode: false,
        lowSpecMode: false,
    },
    {
        id: "mobile",
        title: "スマホ安定",
        description: "発熱やカクつきを抑え、スマホで触りやすくします。",
        targetCount: 500,
        activeLimit: 8,
        binCount: 4,
        pinRows: 4,
        speed: "高速",
        effectMode: "quiet",
        probabilityMode: "normal",
        simpleMode: false,
        effectsEnabled: true,
        slowMiracleEffects: false,
        boardAnomalyEnabled: false,
        normalBallTraitsEnabled: true,
        showRecentMiracles: false,
        mobileCompactMode: true,
        lowSpecMode: false,
    },
];
