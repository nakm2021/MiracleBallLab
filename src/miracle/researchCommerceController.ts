import { canBuyShopItem, canCraftRecipe, getCraftMaterialStatus, getRewardParts, getShopCostLabel } from "./commerceService";
import { BASE_SPECIAL_EVENT_DEFS, SPECIAL_EVENT_DEFS } from "./eventCatalog";
import { getGachaResultHtml, getGachaRewardBookHtml, getGachaSpinHtml, getMiracleGachaHtml } from "./gachaPresentation";
import { pickGachaRewardTheme, pickMiracleGachaDef } from "./gachaService";
import { awardTicketsForRank, saveMiracleTicketState, spendMiracleTickets, type MiracleTicketState } from "./miracleTicket";
import { getRankScore } from "./rarity";
import { EVENT_SEASONS, EXPERIMENT_PRESETS, MIRACLE_CRAFT_RECIPES, RESEARCH_SHOP_ITEMS, type EventSeasonDef, type ShopItemDef } from "./researchFeatures";
import { getEventSeasonHtml, getMiracleCraftHtml, getResearchShopHtml } from "./researchCommercePresentation";
import { getSeasonClaimKey, getSeasonMissionValue } from "./rewardService";
import { getCurrentEventSeason } from "./seasonService";
import type { GachaRewardEntry, SavedRecords, SpecialEventDef, ThemeMode } from "./types";

const GACHA_ONCE_COST = 100_000;
const GACHA_TEN_COST = 900_000;

export type ResearchCommerceController = ReturnType<typeof createResearchCommerceController>;

export function createResearchCommerceController(deps: {
    getRecords: () => SavedRecords;
    saveRecords: () => void;
    getTickets: () => MiracleTicketState;
    setTickets: (state: MiracleTicketState) => void;
    createId: (prefix: string) => string;
    random: () => number;
    now?: () => number;
    isMobile: boolean;
    showPopup: (title: string, html: string) => void;
    closePopup: () => void;
    showToast: (message: string) => void;
    showMilestone: (message: string) => void;
    updateTicketButton: (normalTickets: number) => void;
    getThemeOptions: () => ThemeMode[];
    getThemeDisplayName: (theme: ThemeMode) => string;
    markThemeUnlocked: (theme: ThemeMode) => void;
    hashTextToNumber: (text: string) => number;
    formatProbability: (denominator: number) => string;
    applyExperimentPreset: (preset: (typeof EXPERIMENT_PRESETS)[number]) => void;
    addScore: (amount: number, reason: string) => void;
    revealGachaResult: (best: SpecialEventDef, probabilityText: string, feelingText: string) => void;
    playGachaVideo: (best: SpecialEventDef) => void;
}): {
    getGachaPoint: () => number;
    addGachaPoint: (point: number, reason: string, showToast?: boolean) => number;
    awardExperimentFinishGachaPoint: (finishedCount: number) => number;
    isShopItemPurchased: (id: string) => boolean;
    getResearchReportLimit: () => number;
    getCurrentEventSeason: (date?: Date) => EventSeasonDef;
    showMiracleGachaPopup: () => void;
    showGachaRewardBookPopup: () => void;
    showResearchShopPopup: () => void;
    showEventSeasonPopup: () => void;
    showMiracleCraftPopup: () => void;
    buyResearchShopItem: (itemId: string) => void;
    claimSeasonMissionReward: (seasonId: string, missionId: string) => void;
    craftMiracleRecipe: (recipeId: string) => void;
} {
    const now = deps.now ?? Date.now;
    const records = () => deps.getRecords();

    function getGachaPoint(): number {
        return Math.max(0, Math.floor(records().gachaPoint ?? 0));
    }

    function setGachaPoint(point: number): void {
        records().gachaPoint = Math.max(0, Math.floor(point));
    }

    function addGachaPoint(point: number, reason: string, showToast = true): number {
        const safePoint = Math.max(0, Math.floor(point));
        if (safePoint <= 0) return getGachaPoint();
        setGachaPoint(getGachaPoint() + safePoint);
        deps.saveRecords();
        if (showToast) deps.showToast(`奇跡ガチャP +${safePoint.toLocaleString()}：${reason}`);
        return getGachaPoint();
    }

    function spendGachaPoint(point: number): boolean {
        const safePoint = Math.max(0, Math.floor(point));
        if (getGachaPoint() < safePoint) return false;
        setGachaPoint(getGachaPoint() - safePoint);
        deps.saveRecords();
        return true;
    }

    function isShopItemPurchased(id: string): boolean {
        return !!(records().shopPurchased ?? {})[id];
    }

    function getResearchReportLimit(): number {
        return isShopItemPurchased("archive-expansion") ? 60 : 30;
    }

    function awardExperimentFinishGachaPoint(finishedCount: number): number {
        const point = 1 + (finishedCount >= 1000 ? 1 : 0) + (isShopItemPurchased("gacha-point-booster") ? 1 : 0);
        addGachaPoint(point, finishedCount >= 1000 ? "実験完了 + 1000玉以上投下" : "実験完了", false);
        return point;
    }

    function recordGachaReward(entry: GachaRewardEntry): void {
        records().gachaRewards = [entry, ...((records().gachaRewards ?? []).filter((x) => x.id !== entry.id))].slice(0, 80);
        deps.saveRecords();
    }

    function grantTicketBundle(normal: number, rare: number, divine: number, label: string): void {
        const state = deps.getTickets();
        state.normal += normal;
        state.rare += rare;
        state.divine += divine;
        state.totalEarned += normal + rare + divine;
        const kind: "normal" | "rare" | "divine" = divine ? "divine" : rare ? "rare" : "normal";
        state.history = [{
            id: deps.createId("ticket"),
            at: now(),
            label,
            amount: normal + rare + divine,
            kind,
            reason: "研究所ショップ",
        }, ...state.history].slice(0, 50);
        saveMiracleTicketState(state);
        deps.setTickets(state);
        deps.updateTicketButton(state.normal);
    }

    function applyShopItemEffect(item: ShopItemDef): string {
        if (item.theme) {
            deps.markThemeUnlocked(item.theme);
            return `テーマ「${deps.getThemeDisplayName(item.theme)}」を解放`;
        }
        if (item.id === "ticket-bundle") {
            grantTicketBundle(5, 1, 0, item.label);
            return "通常チケット+5 / レアチケット+1";
        }
        if (item.id === "recording-studio") {
            const preset = EXPERIMENT_PRESETS.find((x) => x.id === "showcase");
            if (preset) deps.applyExperimentPreset(preset);
            return "鑑賞・録画プリセットを反映";
        }
        if (item.id === "archive-expansion") return "研究レポート保存上限 60件";
        if (item.id === "gacha-point-booster") return "実験完了時の奇跡ガチャP +1";
        return "研究所設備を更新";
    }

    function buyResearchShopItem(itemId: string): void {
        const item = RESEARCH_SHOP_ITEMS.find((x) => x.id === itemId);
        if (!item) return;
        const availability = canBuyShopItem({
            item,
            purchased: isShopItemPurchased(item.id),
            gachaPoint: getGachaPoint(),
            tickets: deps.getTickets(),
        });
        if (!availability.ok) {
            deps.showToast(`${item.label}: ${availability.reason}`);
            return;
        }
        if (!spendGachaPoint(item.costPoint)) {
            deps.showToast("奇跡ガチャPが足りません");
            return;
        }
        const ticketCost = item.costTickets ?? {};
        if (ticketCost.normal || ticketCost.rare || ticketCost.divine) {
            const result = spendMiracleTickets(deps.getTickets(), ticketCost);
            deps.setTickets(result.state);
            if (!result.ok) {
                addGachaPoint(item.costPoint, "ショップ購入失敗の返却", false);
                deps.showToast(result.message);
                return;
            }
            deps.updateTicketButton(result.state.normal);
        }
        const effectLabel = applyShopItemEffect(item);
        records().shopPurchased = records().shopPurchased ?? {};
        if (!item.repeatable) records().shopPurchased![item.id] = now();
        records().shopPurchases = [{
            id: deps.createId("shop"),
            itemId: item.id,
            label: item.label,
            purchasedAt: now(),
            costLabel: getShopCostLabel(item),
            effectLabel,
        }, ...(records().shopPurchases ?? [])].slice(0, 80);
        deps.saveRecords();
        deps.showToast(`${item.label}を購入: ${effectLabel}`);
        showResearchShopPopup();
    }

    function claimSeasonMissionReward(seasonId: string, missionId: string): void {
        const season = EVENT_SEASONS.find((x) => x.id === seasonId);
        const mission = season?.missions.find((x) => x.id === missionId);
        if (!season || !mission) return;
        const key = getSeasonClaimKey(season.id, mission.id);
        records().seasonRewardClaimed = records().seasonRewardClaimed ?? {};
        if (records().seasonRewardClaimed![key]) {
            deps.showToast("このシーズン報酬は受け取り済みです");
            return;
        }
        if (getSeasonMissionValue(records(), mission.metric) < mission.target) {
            deps.showToast(`${mission.label}: まだ条件未達成です`);
            return;
        }
        if (mission.rewardPoint > 0) addGachaPoint(mission.rewardPoint, `シーズン:${mission.label}`, false);
        if (mission.rewardTheme) deps.markThemeUnlocked(mission.rewardTheme);
        if (mission.rewardTickets) grantTicketBundle(mission.rewardTickets.normal ?? 0, mission.rewardTickets.rare ?? 0, mission.rewardTickets.divine ?? 0, `シーズン:${mission.label}`);
        const rewardParts = getRewardParts({
            point: mission.rewardPoint,
            themeLabel: mission.rewardTheme ? deps.getThemeDisplayName(mission.rewardTheme) : undefined,
            tickets: mission.rewardTickets,
        });
        const claimedAt = now();
        records().seasonRewardClaimed![key] = claimedAt;
        records().seasonRewards = [{
            id: deps.createId("season"),
            seasonId: season.id,
            missionId: mission.id,
            label: mission.label,
            claimedAt,
            rewardLabel: rewardParts.join(" / "),
        }, ...(records().seasonRewards ?? [])].slice(0, 80);
        deps.saveRecords();
        deps.showToast(`シーズン報酬: ${rewardParts.join(" / ")}`);
        showEventSeasonPopup();
    }

    function craftMiracleRecipe(recipeId: string): void {
        const recipe = MIRACLE_CRAFT_RECIPES.find((x) => x.id === recipeId);
        if (!recipe) return;
        const material = getCraftMaterialStatus({ recipe, specialDefs: SPECIAL_EVENT_DEFS, discovered: records().discovered });
        const availability = canCraftRecipe({
            recipe,
            unlocked: !!(records().crafted ?? {})[recipe.id],
            materialReady: material.ready,
            gachaPoint: getGachaPoint(),
        });
        if (!availability.ok) {
            deps.showToast(`${recipe.label}: ${availability.reason}`);
            return;
        }
        if (!spendGachaPoint(recipe.costPoint)) {
            deps.showToast("奇跡ガチャPが足りません");
            return;
        }
        if (recipe.rewardPoint) addGachaPoint(recipe.rewardPoint, `クラフト:${recipe.label}`, false);
        if (recipe.rewardTheme) deps.markThemeUnlocked(recipe.rewardTheme);
        if (recipe.rewardTickets) grantTicketBundle(recipe.rewardTickets.normal ?? 0, recipe.rewardTickets.rare ?? 0, recipe.rewardTickets.divine ?? 0, `クラフト:${recipe.label}`);
        const rewardParts = getRewardParts({
            point: recipe.rewardPoint,
            themeLabel: recipe.rewardTheme ? deps.getThemeDisplayName(recipe.rewardTheme) : undefined,
            tickets: recipe.rewardTickets,
        });
        const craftedAt = now();
        records().crafted = records().crafted ?? {};
        records().crafted![recipe.id] = craftedAt;
        records().craftHistory = [{
            id: deps.createId("craft"),
            recipeId: recipe.id,
            label: recipe.label,
            craftedAt,
            rewardLabel: rewardParts.join(" / "),
        }, ...(records().craftHistory ?? [])].slice(0, 80);
        deps.addScore(12_000 + recipe.rewardPoint * 400, `CRAFT ${recipe.label}`);
        deps.saveRecords();
        deps.showMilestone(`奇跡クラフト: ${recipe.label}`);
        showMiracleCraftPopup();
    }

    function grantGachaReward(def: SpecialEventDef, count: number): GachaRewardEntry {
        const ticketResult = awardTicketsForRank(deps.getTickets(), def.rank, `ガチャ:${def.label}`);
        deps.setTickets(ticketResult.state);
        const theme = pickGachaRewardTheme({
            def,
            index: count,
            now: now(),
            themes: deps.getThemeOptions(),
            getRankScore,
            hashTextToNumber: deps.hashTextToNumber,
        });
        if (theme) deps.markThemeUnlocked(theme);
        const rewardParts = [
            "演出カード",
            theme ? `テーマ:${deps.getThemeDisplayName(theme)}` : "",
            ticketResult.reward.normal ? `通常チケット+${ticketResult.reward.normal}` : "",
            ticketResult.reward.rare ? `レアチケット+${ticketResult.reward.rare}` : "",
            ticketResult.reward.divine ? `神域チケット+${ticketResult.reward.divine}` : "",
        ].filter(Boolean);
        const entry: GachaRewardEntry = {
            id: deps.createId("gacha"),
            createdAt: now(),
            label: def.label,
            rank: def.rank,
            kind: def.kind,
            count,
            rewardLabel: rewardParts.join(" / "),
            theme,
            ticketNormal: ticketResult.reward.normal,
            ticketRare: ticketResult.reward.rare,
            ticketDivine: ticketResult.reward.divine,
        };
        recordGachaReward(entry);
        deps.updateTicketButton(ticketResult.state.normal);
        return entry;
    }

    function showGachaResultPopup(rewards: GachaRewardEntry[], best: SpecialEventDef): void {
        deps.showPopup("ガチャ結果", getGachaResultHtml(rewards, best, (kind) => SPECIAL_EVENT_DEFS.find((x) => x.kind === kind), deps.isMobile));
        document.getElementById("gacha-result-history-button")?.addEventListener("click", showGachaRewardBookPopup);
        document.getElementById("gacha-result-again-button")?.addEventListener("click", showMiracleGachaPopup);
    }

    function showMiracleGachaPopup(): void {
        deps.showPopup("奇跡ガチャ", getMiracleGachaHtml({
            point: getGachaPoint(),
            onceCost: GACHA_ONCE_COST,
            tenCost: GACHA_TEN_COST,
            recentRewards: records().gachaRewards ?? [],
        }));
        document.getElementById("miracle-gacha-history-button")?.addEventListener("click", showGachaRewardBookPopup);
        const run = (count: 1 | 10) => {
            const cost = count === 10 ? GACHA_TEN_COST : GACHA_ONCE_COST;
            if (!spendGachaPoint(cost)) {
                deps.showToast(`奇跡ガチャPが足りません。必要: ${cost.toLocaleString()}P / 所持: ${getGachaPoint().toLocaleString()}P`);
                showMiracleGachaPopup();
                return;
            }
            deps.showPopup("奇跡ガチャ抽選中", getGachaSpinHtml(count, cost));
            window.setTimeout(() => {
                const defs = Array.from({ length: count }, () => pickMiracleGachaDef({
                    specialDefs: SPECIAL_EVENT_DEFS,
                    fallbackDefs: BASE_SPECIAL_EVENT_DEFS,
                    getRankScore,
                    random: deps.random,
                }));
                const rewards = defs.map((def, index) => grantGachaReward(def, index + 1));
                const best = defs.slice().sort((a, b) => getRankScore(b.rank) - getRankScore(a.rank))[0] ?? defs[0]!;
                const probabilityText = `[${best.rank}] ${deps.formatProbability(best.denominator)}`;
                const feelingText = count === 10 ? "10連ガチャ研究装置が最高反応を観測しました。" : "ガチャ研究装置が未知の奇跡を観測しました。";
                deps.showToast(count === 10
                    ? `10連結果: ${defs.map((def, index) => `${index + 1}. ${def.label} [${def.rank}]`).join(" / ")}`
                    : `ガチャ結果: ${best.label} [${best.rank}] / ${rewards[0]?.rewardLabel ?? "演出カード"}`);
                deps.closePopup();
                deps.revealGachaResult(best, probabilityText, feelingText);
                deps.playGachaVideo(best);
                window.setTimeout(() => showGachaResultPopup(rewards, best), 1450);
            }, 1950);
        };
        document.getElementById("miracle-gacha-once-button")?.addEventListener("click", () => run(1));
        document.getElementById("miracle-gacha-ten-button")?.addEventListener("click", () => run(10));
    }

    function showGachaRewardBookPopup(): void {
        deps.showPopup("ガチャ履歴", getGachaRewardBookHtml(records().gachaRewards ?? []));
    }

    function showResearchShopPopup(): void {
        const items = RESEARCH_SHOP_ITEMS.map((item) => {
            const purchased = isShopItemPurchased(item.id);
            const availability = canBuyShopItem({ item, purchased, gachaPoint: getGachaPoint(), tickets: deps.getTickets() });
            const categoryLabel = item.category === "facility" ? "設備" : item.category === "theme" ? "テーマ" : item.category === "ticket" ? "交換" : "プリセット";
            return {
                item,
                purchased,
                available: availability.ok,
                status: purchased && !item.repeatable ? "購入済み" : availability.reason,
                categoryLabel,
                costLabel: getShopCostLabel(item),
            };
        });
        const tickets = deps.getTickets();
        deps.showPopup("研究所ショップ", getResearchShopHtml({
            purchasedCount: Object.keys(records().shopPurchased ?? {}).length,
            gachaPoint: getGachaPoint(),
            ticketNormal: tickets.normal,
            ticketRare: tickets.rare,
            ticketDivine: tickets.divine,
            reportLimit: getResearchReportLimit(),
            pointBoosterOn: isShopItemPurchased("gacha-point-booster"),
            items,
            purchaseHistory: records().shopPurchases ?? [],
        }));
    }

    function showEventSeasonPopup(): void {
        const season = getCurrentEventSeason(EVENT_SEASONS);
        const missions = season.missions.map((mission) => {
            const value = Math.min(getSeasonMissionValue(records(), mission.metric), mission.target);
            const claimed = !!(records().seasonRewardClaimed ?? {})[getSeasonClaimKey(season.id, mission.id)];
            return {
                mission,
                value,
                percent: mission.target > 0 ? Math.min(100, value / mission.target * 100) : 0,
                claimed,
                ready: value >= mission.target,
                rewardLabel: [
                    mission.rewardPoint ? `P+${mission.rewardPoint}` : "",
                    mission.rewardTheme ? `テーマ:${deps.getThemeDisplayName(mission.rewardTheme)}` : "",
                    mission.rewardTickets?.normal ? `通常券+${mission.rewardTickets.normal}` : "",
                    mission.rewardTickets?.rare ? `レア券+${mission.rewardTickets.rare}` : "",
                    mission.rewardTickets?.divine ? `神域券+${mission.rewardTickets.divine}` : "",
                ].filter(Boolean).join(" / "),
            };
        });
        deps.showPopup("イベントシーズン", getEventSeasonHtml({
            season,
            themeLabel: deps.getThemeDisplayName(season.theme),
            missions,
            history: records().seasonRewards ?? [],
        }));
    }

    function showMiracleCraftPopup(): void {
        const recipes = MIRACLE_CRAFT_RECIPES.map((recipe) => {
            const material = getCraftMaterialStatus({ recipe, specialDefs: SPECIAL_EVENT_DEFS, discovered: records().discovered });
            const unlocked = !!(records().crafted ?? {})[recipe.id];
            const availability = canCraftRecipe({ recipe, unlocked, materialReady: material.ready, gachaPoint: getGachaPoint() });
            return {
                recipe,
                materialLabel: material.label,
                materialReady: material.ready,
                available: availability.ok,
                status: availability.reason,
                unlocked,
                rewardLabel: [
                    recipe.rewardPoint ? `P+${recipe.rewardPoint}` : "",
                    recipe.rewardTheme ? `テーマ:${deps.getThemeDisplayName(recipe.rewardTheme)}` : "",
                    recipe.rewardTickets?.normal ? `通常券+${recipe.rewardTickets.normal}` : "",
                    recipe.rewardTickets?.rare ? `レア券+${recipe.rewardTickets.rare}` : "",
                    recipe.rewardTickets?.divine ? `神域券+${recipe.rewardTickets.divine}` : "",
                ].filter(Boolean).join(" / "),
            };
        });
        deps.showPopup("奇跡クラフト", getMiracleCraftHtml({
            gachaPoint: getGachaPoint(),
            recipes,
            history: records().craftHistory ?? [],
        }));
    }

    return {
        getGachaPoint,
        addGachaPoint,
        awardExperimentFinishGachaPoint,
        isShopItemPurchased,
        getResearchReportLimit,
        getCurrentEventSeason: (date = new Date()) => getCurrentEventSeason(EVENT_SEASONS, date),
        showMiracleGachaPopup,
        showGachaRewardBookPopup,
        showResearchShopPopup,
        showEventSeasonPopup,
        showMiracleCraftPopup,
        buyResearchShopItem,
        claimSeasonMissionReward,
        craftMiracleRecipe,
    };
}
