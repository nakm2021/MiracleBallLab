import type { MiracleCraftRecipeDef, ShopItemDef } from "./researchFeatures";
import type { MiracleTicketState } from "./miracleTicket";
import type { SpecialEventDef } from "./types";

export function getShopCostLabel(item: ShopItemDef): string {
    const parts = [`${item.costPoint.toLocaleString()}P`];
    const tickets = item.costTickets ?? {};
    if (tickets.normal) parts.push(`通常券${tickets.normal}`);
    if (tickets.rare) parts.push(`レア券${tickets.rare}`);
    if (tickets.divine) parts.push(`神域券${tickets.divine}`);
    return parts.join(" / ");
}

export function canBuyShopItem(params: {
    item: ShopItemDef;
    purchased: boolean;
    gachaPoint: number;
    tickets: MiracleTicketState;
}): { ok: boolean; reason: string } {
    const { item } = params;
    if (!item.repeatable && params.purchased) return { ok: false, reason: "購入済み" };
    if (params.gachaPoint < item.costPoint) return { ok: false, reason: "P不足" };
    const tickets = item.costTickets ?? {};
    if ((params.tickets.normal ?? 0) < (tickets.normal ?? 0)) return { ok: false, reason: "通常券不足" };
    if ((params.tickets.rare ?? 0) < (tickets.rare ?? 0)) return { ok: false, reason: "レア券不足" };
    if ((params.tickets.divine ?? 0) < (tickets.divine ?? 0)) return { ok: false, reason: "神域券不足" };
    return { ok: true, reason: "購入可能" };
}

export function getCraftMaterialStatus(params: {
    recipe: MiracleCraftRecipeDef;
    specialDefs: SpecialEventDef[];
    discovered: Record<string, number>;
}): { ready: boolean; label: string } {
    const parts = params.recipe.materialKinds.map((kind) => {
        const def = params.specialDefs.find((x) => x.kind === kind);
        const count = params.discovered[kind] ?? 0;
        return `${def?.label ?? kind} ${count}/${params.recipe.requiredCount}`;
    });
    return {
        ready: params.recipe.materialKinds.every((kind) => (params.discovered[kind] ?? 0) >= params.recipe.requiredCount),
        label: parts.join(" / "),
    };
}

export function canCraftRecipe(params: {
    recipe: MiracleCraftRecipeDef;
    unlocked: boolean;
    materialReady: boolean;
    gachaPoint: number;
}): { ok: boolean; reason: string } {
    if (params.unlocked) return { ok: false, reason: "解放済み" };
    if (!params.materialReady) return { ok: false, reason: "素材不足" };
    if (params.gachaPoint < params.recipe.costPoint) return { ok: false, reason: "P不足" };
    return { ok: true, reason: "クラフト" };
}

export function getRewardParts(params: {
    point?: number;
    themeLabel?: string;
    tickets?: { normal?: number; rare?: number; divine?: number };
}): string[] {
    return [
        params.point ? `奇跡ガチャP+${params.point}` : "",
        params.themeLabel ? `テーマ:${params.themeLabel}` : "",
        params.tickets?.normal ? `通常券+${params.tickets.normal}` : "",
        params.tickets?.rare ? `レア券+${params.tickets.rare}` : "",
        params.tickets?.divine ? `神域券+${params.tickets.divine}` : "",
    ].filter(Boolean);
}
