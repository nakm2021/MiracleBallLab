import type { Geometry } from "./types";
import type { RareBoardCatastropheDef } from "./rareBoardCatastrophe";
import { clamp } from "./utils";

export function drawRareBoardCatastropheFrame(
    context: CanvasRenderingContext2D,
    state: {
        catastrophe: RareBoardCatastropheDef | null;
        until: number;
        startedAt: number;
    },
    options: {
        geometry: Geometry;
        uiFont: string;
    },
    nowMs = Date.now(),
    perfNow = performance.now(),
): void {
    if (!state.catastrophe || nowMs > state.until) return;
    const def = state.catastrophe;
    const elapsed = perfNow - state.startedAt;
    const progress = clamp(elapsed / Math.max(1, def.duration), 0, 1);
    const fade = Math.sin(progress * Math.PI);
    const { geometry } = options;
    context.save();
    context.globalCompositeOperation = "source-over";
    context.fillStyle = def.bg;
    context.fillRect(0, 0, geometry.width, geometry.height);

    context.globalCompositeOperation = "lighter";
    context.strokeStyle = def.color;
    context.fillStyle = def.color;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalAlpha = 0.28 + fade * 0.42;

    const waveCount = Math.min(8, def.waves + 2);
    for (let i = 0; i < waveCount; i++) {
        const r = (progress * 480 + i * 70) * geometry.scale;
        context.lineWidth = Math.max(2, 5 * geometry.scale);
        context.beginPath();
        context.arc(geometry.width / 2, geometry.height * 0.42, r % (Math.max(geometry.width, geometry.height) * 0.7), 0, Math.PI * 2);
        context.stroke();
    }

    for (let i = 0; i < def.lightning; i++) {
        const seed = i * 37 + Math.floor(elapsed / 120);
        const x = ((seed * 97) % Math.max(1, Math.floor(geometry.width)));
        const top = 10 * geometry.scale;
        const bottom = geometry.height * (0.25 + ((seed * 13) % 55) / 100);
        context.lineWidth = Math.max(2, 3.5 * geometry.scale);
        context.beginPath();
        context.moveTo(x, top);
        const segments = 5;
        for (let s = 1; s <= segments; s++) {
            const yy = top + (bottom - top) * (s / segments);
            const xx = x + Math.sin(seed + s * 2.1) * 34 * geometry.scale;
            context.lineTo(xx, yy);
        }
        context.stroke();
    }

    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 0.95;
    context.font = `900 ${Math.round(clamp(24 * geometry.scale, 18, 44))}px ${options.uiFont}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(255,255,255,.94)";
    context.strokeStyle = "rgba(0,0,0,.55)";
    context.lineWidth = Math.max(3, 5 * geometry.scale);
    const label = `${def.emoji} ${def.label}`;
    context.strokeText(label, geometry.width / 2, geometry.height * 0.13);
    context.fillText(label, geometry.width / 2, geometry.height * 0.13);
    context.restore();
}
