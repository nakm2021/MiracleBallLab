import type { ResearchRankInfo } from "./types";
import { escapeHtml } from "./utils";

type WorldRoomAction = {
    label: string;
    action: string;
    primary?: boolean;
};

function getWorldRoomCardHtml(title: string, subtitle: string, accent: string, actions: WorldRoomAction[]): string {
    const buttons = actions
        .map(
            (item) =>
                `<button data-home-action="${escapeHtml(item.action)}" class="miracle-home-button ${item.primary ? "miracle-home-primary" : ""}">${escapeHtml(item.label)}</button>`,
        )
        .join("");
    return `
        <div class="miracle-user-card" style="min-height:190px;display:flex;flex-direction:column;justify-content:space-between;border-left:8px solid ${accent};">
            <div>
                <div style="font-size:1.2em;font-weight:1000;line-height:1.25;">${escapeHtml(title)}</div>
                <div style="margin-top:8px;opacity:.80;line-height:1.7;">${escapeHtml(subtitle)}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">${buttons}</div>
        </div>
    `;
}

export function getResearchWorldMapHtml(params: {
    rank: ResearchRankInfo;
    discoveredKindCount: number;
    gachaPoint: number;
    shopPurchasedCount: number;
    isMobile: boolean;
}): string {
    const rooms = [
        getWorldRoomCardHtml("落下実験ホール", "実験開始、プリセット、魔法陣で盤面へ入ります。", "#f59e0b", [
            { label: "実験開始", action: "start", primary: true },
            { label: "プリセット", action: "presets" },
            { label: "魔法陣", action: "magic" },
        ]),
        getWorldRoomCardHtml("記録保管庫", "研究アーカイブ、アルバム、ログで過去の結果を整理します。", "#38bdf8", [
            { label: "アーカイブ", action: "archive", primary: true },
            { label: "アルバム", action: "album" },
            { label: "奇跡ログ", action: "log" },
        ]),
        getWorldRoomCardHtml("収集展示室", "奇跡図鑑、テーマ図鑑、研究員ランクを確認します。", "#22c55e", [
            { label: "奇跡図鑑", action: "book", primary: true },
            { label: "テーマ", action: "themes" },
            { label: "ランク", action: "rank" },
        ]),
        getWorldRoomCardHtml("ガチャ炉・購買部", "奇跡ガチャ、ガチャ履歴、研究所ショップへ移動します。", "#a855f7", [
            { label: "奇跡ガチャ", action: "gacha", primary: true },
            { label: "ショップ", action: "shop" },
            { label: "ガチャ履歴", action: "gacha-log" },
        ]),
        getWorldRoomCardHtml(
            "季節観測塔",
            "イベントシーズン、限定ミッション、奇跡率ブーストを確認します。",
            "#f97316",
            [
                { label: "シーズン", action: "season", primary: true },
                { label: "クラフト", action: "craft" },
                { label: "テーマ", action: "themes" },
            ],
        ),
        getWorldRoomCardHtml("奇跡工房", "発見済み奇跡の記録を素材条件にして研究報酬を錬成します。", "#14b8a6", [
            { label: "クラフト", action: "craft", primary: true },
            { label: "奇跡合成", action: "fusion" },
            { label: "図鑑", action: "book" },
        ]),
        getWorldRoomCardHtml("ボス実験場", "特殊ルール付きの高難度討伐実験に挑戦します。", "#ef4444", [
            { label: "ボス実験", action: "boss", primary: true },
            { label: "討伐記録", action: "boss-log" },
            { label: "プリセット", action: "presets" },
        ]),
        getWorldRoomCardHtml("使い魔研究室", "使い魔の育成、遠征、チケット確認を行います。", "#ec4899", [
            { label: "使い魔", action: "familiar", primary: true },
            { label: "チケット", action: "tickets" },
            { label: "秘密ノート", action: "notes" },
        ]),
        getWorldRoomCardHtml(
            "オフライン棟",
            "保存済み演出の図鑑と専用研究所をまとめます。動画保存は主任モード専用です。",
            "#64748b",
            [
                { label: "研究所", action: "offline", primary: true },
                { label: "図鑑", action: "offline-book" },
            ],
        ),
    ].join("");
    return `
        <div style="display:grid;gap:16px;">
            <div class="miracle-home-hero">
                <div style="font-size:clamp(30px,6vw,56px);font-weight:1000;line-height:1.1;">MiracleBallLab 研究所</div>
                <div style="margin-top:12px;line-height:1.8;">研究員ランク <b>Lv.${params.rank.level} ${escapeHtml(params.rank.label)}</b> / 図鑑 <b>${params.discoveredKindCount}</b>種類 / 奇跡ガチャP <b>${params.gachaPoint.toLocaleString()}P</b> / ショップ設備 <b>${params.shopPurchasedCount}</b></div>
            </div>
            <div style="display:grid;grid-template-columns:${params.isMobile ? "1fr" : "repeat(2,minmax(0,1fr))"};gap:14px;">${rooms}</div>
        </div>
    `;
}
