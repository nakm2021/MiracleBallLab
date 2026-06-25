import type Matter from "matter-js";
import { BOSS_EXPERIMENT_DEFS, getBossAssetUrl, getBossDef, getBossExperimentPopupHtml, type BossExperimentDef } from "./bossExperiment";
import { drawBossEnemyFrame, drawBossHudFrame, type BossRenderOptions, type BossRenderState } from "./bossRendering";
import {
    calculateBossDamage,
    createBossExperimentRecord,
    getBossAttackInterval,
    getBossDropDamage,
    getBossElapsedMs,
    getBossPhase,
    getBossRemainingMs,
    getBossRewardParts,
    getBossYakumonoDamage,
    prependBossRecord,
} from "./bossService";
import type {
    BossExperimentRecord,
    DropKind,
    Geometry,
    PachinkoYakumonoDef,
    PachinkoYakumonoKind,
    SavedRecords,
    SpecialEventDef,
    ThemeMode,
} from "./types";

export type BossExperimentSnapshot = {
    selectedId: string | null;
    active: BossExperimentDef | null;
    hp: number;
    maxHp: number;
    damage: number;
    phase: number;
    lastAttackAt: number;
    damageFlashUntil: number;
    cleared: boolean;
    timedOut: boolean;
};

export type BossExperimentController = ReturnType<typeof createBossExperimentController>;

export function createBossExperimentController(deps: {
    getRecords: () => SavedRecords;
    getStartTime: () => number;
    getRunScore: () => number;
    getFinishedCount: () => number;
    getRuntimeState: () => {
        isStarted: boolean;
        isFinished: boolean;
        isPaused: boolean;
        isMiraclePaused: boolean;
    };
    getGeometry: () => Geometry;
    getBlackModeEnabled: () => boolean;
    getRankScore: (rank: string) => number;
    getThemeDisplayName: (theme: ThemeMode) => string;
    findSpecialDef: (kind: DropKind) => SpecialEventDef | undefined;
    createId: (prefix: string) => string;
    random: () => number;
    showPopup: (title: string, html: string) => void;
    closePopup: () => void;
    showToast: (message: string) => void;
    showMilestone: (message: string) => void;
    addFloatingText: (text: string, x: number, y: number, color: string) => void;
    addScore: (amount: number, reason: string, x?: number, y?: number) => void;
    triggerPhaseEffect: (phase: number) => void;
    celebrateVictory: () => void;
    triggerTimeoutEffect: () => void;
    finishRun: (outcome: "victory" | "timeout", bossName: string) => void;
    triggerCameraShake: (power: number, durationMs: number) => void;
    spawnIntruders: (count: number, reason: string) => void;
    triggerOmen: () => void;
    showCommentary: (message: string) => void;
    addGachaPoint: (point: number, reason: string) => void;
    markThemeUnlocked: (theme: ThemeMode) => void;
    prepareBossSettings: (boss: BossExperimentDef) => void;
    startBossRun: () => void;
    uiFont: string;
}): {
    getSnapshot: () => BossExperimentSnapshot;
    clear: (clearSelection?: boolean) => void;
    showPopup: () => void;
    start: (bossId: string) => void;
    activateForRun: () => void;
    getElapsedMs: (now?: number) => number;
    getRemainingMs: (now?: number) => number;
    damage: (amount: number, reason: string, x?: number, y?: number) => void;
    damageForYakumono: (kind: PachinkoYakumonoKind, def: PachinkoYakumonoDef, drop: Matter.Body) => void;
    damageForDrop: (kind: DropKind, binIndex: number, body: Matter.Body) => void;
    maybeAttack: () => void;
    maybeFinishByTime: () => boolean;
    recordResult: () => BossExperimentRecord | null;
    drawEnemy: (context: CanvasRenderingContext2D, compact?: boolean) => void;
    drawHud: (context: CanvasRenderingContext2D) => void;
} {
    const images: Record<string, HTMLImageElement> = {};
    const state: BossExperimentSnapshot = {
        selectedId: null,
        active: null,
        hp: 0,
        maxHp: 0,
        damage: 0,
        phase: 1,
        lastAttackAt: 0,
        damageFlashUntil: 0,
        cleared: false,
        timedOut: false,
    };

    function getImage(boss: BossExperimentDef): HTMLImageElement | null {
        if (images[boss.id]) return images[boss.id];
        if (typeof Image === "undefined") return null;
        const image = new Image();
        image.decoding = "async";
        image.loading = "eager";
        image.src = getBossAssetUrl(boss);
        images[boss.id] = image;
        return image;
    }

    function clear(clearSelection = true): void {
        if (clearSelection) state.selectedId = null;
        state.active = null;
        state.hp = 0;
        state.maxHp = 0;
        state.damage = 0;
        state.phase = 1;
        state.lastAttackAt = 0;
        state.damageFlashUntil = 0;
        state.cleared = false;
        state.timedOut = false;
    }

    function showPopup(): void {
        deps.showPopup("ボス実験モード", getBossExperimentPopupHtml({
            bosses: BOSS_EXPERIMENT_DEFS,
            cleared: deps.getRecords().bossCleared ?? {},
            records: deps.getRecords().bossRecords ?? [],
        }));
    }

    function start(bossId: string): void {
        const boss = getBossDef(bossId);
        if (!boss) return;
        state.selectedId = boss.id;
        deps.prepareBossSettings(boss);
        deps.closePopup();
        deps.showToast(`${boss.name} 討伐実験を開始します`);
        deps.startBossRun();
    }

    function activateForRun(): void {
        state.active = getBossDef(state.selectedId);
        if (state.active) getImage(state.active);
        state.maxHp = state.active?.hp ?? 0;
        state.hp = state.maxHp;
        state.damage = 0;
        state.phase = 1;
        state.lastAttackAt = 0;
        state.damageFlashUntil = 0;
        state.cleared = false;
        state.timedOut = false;
    }

    function elapsed(now = Date.now()): number {
        return getBossElapsedMs(state.active, deps.getStartTime(), now);
    }

    function remaining(now = Date.now()): number {
        return getBossRemainingMs(state.active, deps.getStartTime(), now);
    }

    function damage(amount: number, reason: string, x?: number, y?: number): void {
        const runtime = deps.getRuntimeState();
        if (!state.active || state.hp <= 0 || !runtime.isStarted || runtime.isFinished) return;
        const geometry = deps.getGeometry();
        const drawX = x ?? geometry.width / 2;
        const drawY = y ?? geometry.height * 0.20;
        const value = calculateBossDamage(amount, state.maxHp);
        if (value <= 0) return;
        state.hp = Math.max(0, state.hp - value);
        state.damage += value;
        state.damageFlashUntil = Date.now() + 260;
        deps.addFloatingText(`BOSS -${value.toLocaleString()} ${reason}`, drawX, drawY, state.active.color);
        deps.addScore(Math.floor(value * 0.2), `BOSS ${reason}`, drawX, drawY + 22 * geometry.scale);
        const nextPhase = getBossPhase(state.hp, state.maxHp);
        if (nextPhase !== state.phase) {
            state.phase = nextPhase;
            deps.triggerPhaseEffect(state.phase);
            deps.showMilestone(`BOSS PHASE ${state.phase}`);
        }
        if (state.hp <= 0) {
            state.cleared = true;
            deps.celebrateVictory();
            deps.showMilestone(`${state.active.name} 討伐成功`);
            deps.finishRun("victory", state.active.name);
        }
    }

    function damageForYakumono(kind: PachinkoYakumonoKind, def: PachinkoYakumonoDef, drop: Matter.Body): void {
        if (!state.active) return;
        const geometry = deps.getGeometry();
        damage(getBossYakumonoDamage(kind, state.active.weakness), def.label, drop.position.x, drop.position.y - 44 * geometry.scale);
    }

    function damageForDrop(kind: DropKind, binIndex: number, body: Matter.Body): void {
        if (!state.active || binIndex < 0) return;
        const def = deps.findSpecialDef(kind);
        const value = getBossDropDamage({ kind, def, weakness: state.active.weakness, getRankScore: deps.getRankScore });
        if (value > 0) damage(value, def?.label ?? (kind === "gold" ? "金玉" : "虹玉"), body.position.x, body.position.y);
    }

    function maybeAttack(): void {
        const runtime = deps.getRuntimeState();
        if (!state.active || !runtime.isStarted || runtime.isFinished || runtime.isPaused || runtime.isMiraclePaused || state.hp <= 0) return;
        const now = Date.now();
        if (now - state.lastAttackAt < getBossAttackInterval(state.phase)) return;
        state.lastAttackAt = now;
        deps.triggerCameraShake((10 + state.phase * 5) * deps.getGeometry().scale, 360);
        if (state.phase >= 2 && deps.random() < 0.55) deps.spawnIntruders(4 + state.phase * 2, "BOSS ATTACK");
        if (state.phase >= 3) deps.triggerOmen();
        deps.showCommentary(`BOSS「${state.active.name} が盤面へ干渉」`);
    }

    function maybeFinishByTime(): boolean {
        const runtime = deps.getRuntimeState();
        if (!state.active || runtime.isFinished || runtime.isPaused || runtime.isMiraclePaused || state.hp <= 0 || remaining() > 0) return false;
        state.timedOut = true;
        state.cleared = false;
        deps.triggerTimeoutEffect();
        deps.showMilestone(`${state.active.name} 時間切れ`);
        deps.finishRun("timeout", state.active.name);
        return true;
    }

    function recordResult(): BossExperimentRecord | null {
        if (!state.active) return null;
        const rewardParts = getBossRewardParts({
            cleared: state.cleared,
            rewardPoint: state.active.rewardPoint,
            rewardTheme: state.active.rewardTheme,
            getThemeDisplayName: deps.getThemeDisplayName,
        });
        const records = deps.getRecords();
        if (state.cleared) {
            deps.addGachaPoint(state.active.rewardPoint, `ボス討伐:${state.active.name}`);
            if (state.active.rewardTheme) deps.markThemeUnlocked(state.active.rewardTheme);
            records.bossCleared = records.bossCleared ?? {};
            records.bossCleared[state.active.id] = Date.now();
        }
        const record = createBossExperimentRecord({
            id: deps.createId("boss"),
            boss: state.active,
            cleared: state.cleared,
            timedOut: state.timedOut,
            damage: state.damage,
            maxHp: state.maxHp,
            score: deps.getRunScore(),
            finishedCount: deps.getFinishedCount(),
            createdAt: Date.now(),
            rewardParts,
        });
        records.bossRecords = prependBossRecord(records.bossRecords, record);
        return record;
    }

    function renderState(): BossRenderState {
        return {
            boss: state.active,
            isStarted: deps.getRuntimeState().isStarted,
            hp: state.hp,
            maxHp: state.maxHp,
            phase: state.phase,
            lastAttackAt: state.lastAttackAt,
            damageFlashUntil: state.damageFlashUntil,
            remainingMs: remaining(),
        };
    }

    function renderOptions(): BossRenderOptions {
        return {
            geometry: deps.getGeometry(),
            uiFont: deps.uiFont,
            blackModeEnabled: deps.getBlackModeEnabled(),
            bossImage: state.active ? getImage(state.active) : null,
        };
    }

    return {
        getSnapshot: () => state,
        clear,
        showPopup,
        start,
        activateForRun,
        getElapsedMs: elapsed,
        getRemainingMs: remaining,
        damage,
        damageForYakumono,
        damageForDrop,
        maybeAttack,
        maybeFinishByTime,
        recordResult,
        drawEnemy: (context, compact = false) => drawBossEnemyFrame(context, renderState(), renderOptions(), compact),
        drawHud: (context) => drawBossHudFrame(context, renderState(), renderOptions()),
    };
}
