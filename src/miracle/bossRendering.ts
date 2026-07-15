import type { Geometry } from "./types";
import type { BossExperimentDef } from "./bossExperiment";
import { roundRect } from "./drawing";
import { clamp } from "./utils";

export type BossRenderState = {
    boss: BossExperimentDef | null;
    isStarted: boolean;
    hp: number;
    maxHp: number;
    phase: number;
    lastAttackAt: number;
    damageFlashUntil: number;
    remainingMs: number;
};

export type BossRenderOptions = {
    geometry: Geometry;
    uiFont: string;
    blackModeEnabled: boolean;
    bossImage: HTMLImageElement | null;
};

export function drawBossEnemyFrame(
    context: CanvasRenderingContext2D,
    state: BossRenderState,
    options: BossRenderOptions,
    compact = false,
    now = Date.now(),
): void {
    const { boss } = state;
    const { geometry, uiFont, blackModeEnabled, bossImage } = options;
    if (!boss || !state.isStarted) return;
    const t = now / 1000;
    const hpRate = state.maxHp > 0 ? clamp(state.hp / state.maxHp, 0, 1) : 0;
    const attackPulse = Math.max(0, 1 - (now - state.lastAttackAt) / 720);
    const damagePulse = Math.max(0, (state.damageFlashUntil - now) / 260);
    const phaseScale = 1 + (state.phase - 1) * 0.1;
    const cx = geometry.width / 2;
    const cy = compact ? geometry.height * 0.21 : geometry.height * 0.29;
    const imageReady = !!bossImage && bossImage.complete && bossImage.naturalWidth > 0 && bossImage.naturalHeight > 0;
    const targetHeight =
        clamp(geometry.height * (compact ? 0.34 : 0.43), 210 * geometry.scale, 430 * geometry.scale) * phaseScale;
    const targetWidth = imageReady
        ? targetHeight * (bossImage.naturalWidth / bossImage.naturalHeight)
        : targetHeight * 0.66;
    const alpha = state.hp <= 0 ? 0.32 : compact ? 0.72 : 0.88;

    context.save();
    context.globalAlpha = alpha;
    context.translate(cx, cy + Math.sin(t * 2.1) * 5 * geometry.scale);
    context.scale(1 + damagePulse * 0.05, 1 - damagePulse * 0.03);

    const auraRadius = targetHeight * (0.62 + attackPulse * 0.14);
    const aura = context.createRadialGradient(0, 0, targetHeight * 0.08, 0, 0, auraRadius);
    aura.addColorStop(0, damagePulse > 0 ? "rgba(255,255,255,.72)" : `${boss.color}66`);
    aura.addColorStop(0.45, `${boss.color}2f`);
    aura.addColorStop(1, "rgba(15,23,42,0)");
    context.fillStyle = aura;
    context.beginPath();
    context.ellipse(
        0,
        targetHeight * 0.02,
        targetWidth * (0.82 + attackPulse * 0.16),
        targetHeight * (0.56 + attackPulse * 0.1),
        0,
        0,
        Math.PI * 2,
    );
    context.fill();

    context.save();
    context.rotate(Math.sin(t * 1.45) * 0.014);
    if (imageReady && bossImage) {
        context.shadowColor = boss.color;
        context.shadowBlur = 26 * geometry.scale * (0.65 + attackPulse * 0.55);
        context.drawImage(bossImage, -targetWidth / 2, -targetHeight * 0.43, targetWidth, targetHeight);
    } else {
        context.fillStyle = boss.color;
        context.beginPath();
        context.arc(0, 0, targetHeight * 0.16, 0, Math.PI * 2);
        context.fill();
    }
    context.restore();

    if (damagePulse > 0 && imageReady) {
        context.save();
        context.globalCompositeOperation = "source-atop";
        context.globalAlpha = 0.34 * damagePulse;
        context.fillStyle = "#fff";
        context.fillRect(-targetWidth / 2, -targetHeight * 0.43, targetWidth, targetHeight);
        context.restore();
    }

    context.save();
    context.rotate(t * (boss.id === "gravity-kraken" ? 0.7 : boss.id === "thunder-emperor" ? -0.55 : 0.44));
    context.strokeStyle = `${boss.color}99`;
    context.lineWidth = Math.max(2 * geometry.scale, targetHeight * 0.008);
    for (let i = 0; i < 3; i++) {
        context.beginPath();
        context.ellipse(
            0,
            0,
            targetWidth * (0.42 + i * 0.1),
            targetHeight * (0.18 + i * 0.045),
            i * 0.55,
            0,
            Math.PI * 2,
        );
        context.stroke();
    }
    context.restore();

    context.globalAlpha *= 0.92;
    context.fillStyle = blackModeEnabled ? "rgba(255,255,255,.86)" : "rgba(15,23,42,.74)";
    context.font = `900 ${Math.round(clamp(18 * geometry.scale, 13, 28))}px ${uiFont}`;
    context.textAlign = "center";
    context.fillText(boss.name, 0, -targetHeight * 0.48);

    if (hpRate <= 0.33 && Math.sin(t * 12) > 0) {
        context.strokeStyle = "rgba(255,255,255,.82)";
        context.lineWidth = Math.max(2 * geometry.scale, targetHeight * 0.012);
        context.beginPath();
        context.ellipse(0, targetHeight * 0.02, targetWidth * 0.56, targetHeight * 0.28, 0, 0, Math.PI * 2);
        context.stroke();
    }
    context.restore();
}

export function drawBossHudFrame(
    context: CanvasRenderingContext2D,
    state: BossRenderState,
    options: BossRenderOptions,
): void {
    const { boss } = state;
    const { geometry, uiFont } = options;
    if (!boss || !state.isStarted) return;
    const w = Math.min(geometry.width * 0.82, 680 * geometry.scale);
    const h = 62 * geometry.scale;
    const x = geometry.width / 2 - w / 2;
    const y = 42 * geometry.scale;
    const percent = state.maxHp > 0 ? clamp(state.hp / state.maxHp, 0, 1) : 0;
    const timeLeft = Math.ceil(state.remainingMs / 1000);
    context.save();
    context.globalAlpha = 0.94;
    context.fillStyle = "rgba(15,23,42,.76)";
    roundRect(context, x, y, w, h, 18 * geometry.scale);
    context.fill();
    context.fillStyle = "rgba(255,255,255,.18)";
    roundRect(
        context,
        x + 14 * geometry.scale,
        y + 34 * geometry.scale,
        w - 28 * geometry.scale,
        14 * geometry.scale,
        999,
    );
    context.fill();
    context.fillStyle = boss.color;
    roundRect(
        context,
        x + 14 * geometry.scale,
        y + 34 * geometry.scale,
        (w - 28 * geometry.scale) * percent,
        14 * geometry.scale,
        999,
    );
    context.fill();
    context.fillStyle = "#fff";
    context.font = `900 ${Math.round(clamp(17 * geometry.scale, 13, 25))}px ${uiFont}`;
    context.textAlign = "center";
    context.fillText(
        `${boss.name} PHASE ${state.phase}  TIME ${timeLeft}s  HP ${state.hp.toLocaleString()} / ${state.maxHp.toLocaleString()}`,
        geometry.width / 2,
        y + 22 * geometry.scale,
    );
    context.restore();
}
