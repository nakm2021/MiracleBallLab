import type { EventSeasonDef, EventSeasonMissionDef, MiracleCraftRecipeDef, ShopItemDef } from "./researchFeatures";
import { escapeHtml } from "./utils";

export type ShopItemView = {
    item: ShopItemDef;
    purchased: boolean;
    available: boolean;
    status: string;
    categoryLabel: string;
    costLabel: string;
};

export type SeasonMissionView = {
    mission: EventSeasonMissionDef;
    value: number;
    percent: number;
    claimed: boolean;
    ready: boolean;
    rewardLabel: string;
};

export type CraftRecipeView = {
    recipe: MiracleCraftRecipeDef;
    materialLabel: string;
    materialReady: boolean;
    available: boolean;
    status: string;
    unlocked: boolean;
    rewardLabel: string;
};

export function getResearchShopHtml(params: {
    purchasedCount: number;
    gachaPoint: number;
    ticketNormal: number;
    ticketRare: number;
    ticketDivine: number;
    reportLimit: number;
    pointBoosterOn: boolean;
    items: ShopItemView[];
    purchaseHistory: Array<{ label: string; effectLabel: string; costLabel: string; purchasedAt: number }>;
}): string {
    const purchaseRows =
        params.purchaseHistory
            .slice(0, 8)
            .map(
                (entry) => `
        <div style="padding:10px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <b>${escapeHtml(entry.label)}</b>
            <div style="opacity:.78;line-height:1.55;">${escapeHtml(entry.effectLabel)} / ${escapeHtml(entry.costLabel)} / ${new Date(entry.purchasedAt).toLocaleString()}</div>
        </div>
    `,
            )
            .join("") || `<div style="opacity:.72;">まだ購入履歴はありません。</div>`;
    const itemRows = params.items
        .map(
            ({ item, purchased, available, status, categoryLabel, costLabel }) => `
        <div class="miracle-user-card" style="display:grid;gap:10px;opacity:${purchased && !item.repeatable ? ".72" : "1"};">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap;">
                <div>
                    <div style="font-size:1.12em;font-weight:1000;">${escapeHtml(item.label)}</div>
                    <div style="margin-top:4px;opacity:.82;line-height:1.65;">${escapeHtml(item.description)}</div>
                </div>
                <span class="miracle-status-pill">${escapeHtml(categoryLabel)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">
                <div style="font-weight:900;">費用: ${escapeHtml(costLabel)}</div>
                <button class="miracle-home-button ${available ? "miracle-home-primary" : ""}" data-home-action="shop-buy:${item.id}" ${available ? "" : "disabled"}>${escapeHtml(status)}</button>
            </div>
        </div>
    `,
        )
        .join("");
    return `
        <div style="display:grid;gap:14px;">
            <div class="miracle-user-card">
                <b>研究設備と報酬を購入します。</b><br>
                <span style="opacity:.78;">所持: 奇跡ガチャP <b>${params.gachaPoint.toLocaleString()}P</b> / 通常券 <b>${params.ticketNormal}</b> / レア券 <b>${params.ticketRare}</b> / 神域券 <b>${params.ticketDivine}</b></span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
                <div class="miracle-user-card"><b>設備購入</b><br><span style="font-size:1.45em;font-weight:1000;">${params.purchasedCount}</span></div>
                <div class="miracle-user-card"><b>レポート上限</b><br><span style="font-size:1.45em;font-weight:1000;">${params.reportLimit}</span></div>
                <div class="miracle-user-card"><b>完了P増幅</b><br>${params.pointBoosterOn ? "ON" : "OFF"}</div>
            </div>
            ${itemRows}
            <div class="miracle-user-card">
                <b>購入履歴</b>
                <div style="margin-top:8px;">${purchaseRows}</div>
            </div>
        </div>
    `;
}

export function getEventSeasonHtml(params: {
    season: EventSeasonDef;
    themeLabel: string;
    missions: SeasonMissionView[];
    history: Array<{ label: string; rewardLabel: string; claimedAt: number }>;
}): string {
    const rows = params.missions
        .map(
            ({ mission, value, percent, claimed, ready, rewardLabel }) => `
        <div class="miracle-user-card" style="display:grid;gap:10px;border-left:8px solid ${params.season.accent};opacity:${claimed ? ".72" : "1"};">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap;">
                <div>
                    <div style="font-weight:1000;font-size:1.08em;">${claimed ? "受取済み" : ready ? "達成" : "進行中"} ${escapeHtml(mission.label)}</div>
                    <div style="margin-top:5px;opacity:.82;line-height:1.65;">${escapeHtml(mission.description)}</div>
                </div>
                <button class="miracle-home-button ${ready && !claimed ? "miracle-home-primary" : ""}" data-home-action="season-claim:${params.season.id}:${mission.id}" ${ready && !claimed ? "" : "disabled"}>${claimed ? "受取済み" : ready ? "受け取る" : `${value}/${mission.target}`}</button>
            </div>
            <div style="height:12px;border-radius:999px;background:rgba(100,116,139,.22);overflow:hidden;"><div style="height:100%;width:${percent.toFixed(1)}%;background:linear-gradient(90deg,${params.season.accent},#ffffff);"></div></div>
            <div style="opacity:.78;font-size:.92em;">報酬: ${escapeHtml(rewardLabel || "-")}</div>
        </div>
    `,
        )
        .join("");
    const history =
        params.history
            .slice(0, 6)
            .map(
                (entry) => `
        <div style="padding:9px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <b>${escapeHtml(entry.label)}</b>
            <div style="opacity:.76;">${escapeHtml(entry.rewardLabel)} / ${new Date(entry.claimedAt).toLocaleString()}</div>
        </div>
    `,
            )
            .join("") || `<div style="opacity:.72;">まだシーズン報酬はありません。</div>`;
    return `
        <div style="display:grid;gap:14px;">
            <div class="miracle-home-hero" style="border-left:10px solid ${params.season.accent};">
                <div style="font-size:clamp(30px,6vw,56px);font-weight:1000;line-height:1.1;">${escapeHtml(params.season.title)}</div>
                <div style="margin-top:10px;line-height:1.8;">${escapeHtml(params.season.subtitle)}<br>奇跡率ブースト <b>x${params.season.rateBoost.toFixed(2)}</b> / 推奨テーマ <b>${escapeHtml(params.themeLabel)}</b></div>
                <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;"><button data-home-action="season-theme:${params.season.theme}" class="miracle-home-button miracle-home-primary">テーマを使う</button><button data-home-action="craft" class="miracle-home-button">クラフトへ</button></div>
            </div>
            ${rows}
            <div class="miracle-user-card"><b>受取履歴</b><div style="margin-top:8px;">${history}</div></div>
        </div>
    `;
}

export function getMiracleCraftHtml(params: {
    gachaPoint: number;
    recipes: CraftRecipeView[];
    history: Array<{ label: string; rewardLabel: string; craftedAt: number }>;
}): string {
    const rows = params.recipes
        .map(
            ({ recipe, materialLabel, materialReady, available, status, unlocked, rewardLabel }) => `
        <div class="miracle-user-card" style="display:grid;gap:10px;opacity:${unlocked ? ".72" : "1"};">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap;">
                <div>
                    <div style="font-size:1.12em;font-weight:1000;">${unlocked ? "完成済み" : materialReady ? "錬成可能" : "素材待ち"} ${escapeHtml(recipe.label)}</div>
                    <div style="margin-top:5px;opacity:.82;line-height:1.65;">${escapeHtml(recipe.description)}</div>
                </div>
                <button class="miracle-home-button ${available ? "miracle-home-primary" : ""}" data-home-action="craft-do:${recipe.id}" ${available ? "" : "disabled"}>${escapeHtml(status)}</button>
            </div>
            <div style="opacity:.82;line-height:1.65;"><b>素材:</b> ${escapeHtml(materialLabel)}<br><b>費用:</b> ${recipe.costPoint.toLocaleString()}P<br><b>報酬:</b> ${escapeHtml(rewardLabel)}</div>
        </div>
    `,
        )
        .join("");
    const history =
        params.history
            .slice(0, 8)
            .map(
                (entry) => `
        <div style="padding:9px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <b>${escapeHtml(entry.label)}</b>
            <div style="opacity:.76;">${escapeHtml(entry.rewardLabel)} / ${new Date(entry.craftedAt).toLocaleString()}</div>
        </div>
    `,
            )
            .join("") || `<div style="opacity:.72;">まだクラフト履歴はありません。</div>`;
    return `
        <div style="display:grid;gap:14px;">
            <div class="miracle-user-card">
                <b>発見済み奇跡の記録を素材条件にして、研究報酬を錬成します。</b><br>
                <span style="opacity:.78;">素材は図鑑の発見回数を参照します。図鑑記録は消費しません。所持P: <b>${params.gachaPoint.toLocaleString()}P</b></span>
            </div>
            ${rows}
            <div class="miracle-user-card"><b>クラフト履歴</b><div style="margin-top:8px;">${history}</div></div>
        </div>
    `;
}
