import type { FamiliarDef, Geometry } from "./types";
import { roundRect } from "./drawing";
import { clamp } from "./utils";

export function drawFamiliarFrame(
    context: CanvasRenderingContext2D,
    options: {
        enabled: boolean;
        def: FamiliarDef;
        level: number;
        message: string;
        messageUntil: number;
        pulseUntil: number;
        geometry: Geometry;
        isMobile: boolean;
        lowSpecMode: boolean;
        blackModeEnabled: boolean;
    },
    now = Date.now(),
): void {
    if (!options.enabled) return;
    const { geometry, def } = options;
    const scale = geometry.scale;
    const baseX = options.isMobile ? geometry.width - 52 * scale : geometry.width - 72 * scale;
    const baseY = options.isMobile ? 70 * scale : 82 * scale;
    const bob = Math.sin(now / 420) * 5 * scale;
    const pulse = now < options.pulseUntil ? 1 + Math.sin(now / 80) * 0.09 : 1;
    const r = Math.max(24 * scale, options.isMobile ? 30 : 28) * pulse;
    context.save();
    context.globalAlpha = options.lowSpecMode ? 0.88 : 0.96;
    context.shadowColor = def.accent;
    context.shadowBlur = options.lowSpecMode ? 0 : 18 * scale;
    context.fillStyle = def.color;
    context.beginPath();
    context.arc(baseX, baseY + bob, r, 0, Math.PI * 2);
    context.fill();
    context.lineWidth = Math.max(2, 3 * scale);
    context.strokeStyle = def.accent;
    context.stroke();
    context.shadowBlur = 0;
    context.font = `900 ${Math.round(r * 1.05)}px "Segoe UI Emoji", "Noto Sans JP", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#ffffff";
    context.fillText(def.emoji, baseX, baseY + bob + 1 * scale);
    context.font = `900 ${Math.round(clamp(12 * scale, 11, 18))}px "Noto Sans JP", sans-serif`;
    context.fillStyle = options.blackModeEnabled ? "#f8fafc" : "#111827";
    context.fillText(`Lv.${options.level}`, baseX, baseY + bob + r + 13 * scale);
    if (options.message && now < options.messageUntil) {
        const w = Math.min(geometry.width * 0.72, 360 * scale);
        const h = 34 * scale;
        const x = Math.max(12 * scale, baseX - w + 22 * scale);
        const y = baseY + bob + r + 28 * scale;
        context.globalAlpha = 0.92;
        context.fillStyle = options.blackModeEnabled ? "rgba(15,23,42,.92)" : "rgba(255,255,255,.92)";
        roundRect(context, x, y, w, h, 14 * scale);
        context.fill();
        context.globalAlpha = 1;
        context.fillStyle = def.accent;
        context.font = `900 ${Math.round(clamp(13 * scale, 12, 19))}px "Noto Sans JP", sans-serif`;
        context.fillText(options.message, x + w / 2, y + h / 2);
    }
    context.restore();
}
