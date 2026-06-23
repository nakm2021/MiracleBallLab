import type { Geometry } from "./types";
import { clamp } from "./utils";

export type MagicCircleTracePoint = { x: number; y: number; t?: number };

export function drawMagicCircleTraceFrame(
    context: CanvasRenderingContext2D,
    points: MagicCircleTracePoint[],
    options: {
        enabled: boolean;
        simpleMode: boolean;
        geometry: Geometry;
        uiFont: string;
        roughCanvas: any;
    },
    timeMs = performance.now(),
): void {
    if (!options.enabled && points.length === 0) return;
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalCompositeOperation = "lighter";
    if (points.length >= 2) {
        const pulse = 0.55 + Math.sin(timeMs / 120) * 0.25;
        context.strokeStyle = `rgba(180,235,255,${0.58 + pulse * 0.28})`;
        context.lineWidth = Math.max(5 * options.geometry.scale, 4);
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) context.lineTo(points[i].x, points[i].y);
        context.stroke();
        context.strokeStyle = "rgba(255,255,255,.92)";
        context.lineWidth = Math.max(1.5 * options.geometry.scale, 1.2);
        context.stroke();
        const rc = options.roughCanvas;
        if (rc && points.length > 4 && !options.simpleMode) {
            const xs = points.map((p) => p.x);
            const ys = points.map((p) => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const w = Math.max(24 * options.geometry.scale, maxX - minX);
            const h = Math.max(24 * options.geometry.scale, maxY - minY);
            rc.ellipse(minX + w / 2, minY + h / 2, w * 1.16, h * 1.16, {
                stroke: "rgba(255,255,255,.56)",
                strokeWidth: Math.max(1.2, 2 * options.geometry.scale),
                roughness: 2.4,
                bowing: 1.6,
            });
        }
    }
    if (options.enabled) {
        const last = points[points.length - 1];
        const cx = last?.x ?? options.geometry.width / 2;
        const cy = last?.y ?? options.geometry.height * 0.32;
        const r = Math.max(28 * options.geometry.scale, 20);
        context.strokeStyle = "rgba(255,255,255,.70)";
        context.lineWidth = Math.max(2 * options.geometry.scale, 1.5);
        context.beginPath();
        context.arc(cx, cy, r, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = "rgba(255,255,255,.90)";
        context.font = `900 ${Math.round(clamp(18 * options.geometry.scale, 13, 28))}px ${options.uiFont}`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("描画中", cx, cy - r - 14 * options.geometry.scale);
    }
    context.restore();
}
