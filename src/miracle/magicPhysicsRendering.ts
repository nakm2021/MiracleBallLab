import type { Geometry } from "./types";
import { roundRect } from "./drawing";
import { clamp } from "./utils";

export type MagicPhysicsField = {
    x: number;
    y: number;
    radius: number;
    strength: number;
    kind: "vortex" | "repel" | "blackhole" | "wave";
    until: number;
    spin: number;
    label: string;
};

export function drawMagicPhysicsFieldsFrame(context: CanvasRenderingContext2D, fields: MagicPhysicsField[], geometry: Geometry, now = performance.now()): void {
    if (fields.length === 0) return;
    context.save();
    context.globalCompositeOperation = "lighter";
    for (const field of fields) {
        const life = clamp((field.until - now) / 5000, 0, 1);
        const pulse = 0.82 + Math.sin(now / 120) * 0.12;
        const grad = context.createRadialGradient(field.x, field.y, field.radius * 0.05, field.x, field.y, field.radius * pulse);
        const color = field.kind === "blackhole" ? "124,58,237" : field.kind === "repel" ? "250,204,21" : field.kind === "wave" ? "56,189,248" : "34,211,238";
        grad.addColorStop(0, `rgba(${color},${0.20 * life})`);
        grad.addColorStop(0.58, `rgba(${color},${0.08 * life})`);
        grad.addColorStop(1, `rgba(${color},0)`);
        context.fillStyle = grad;
        context.beginPath();
        context.arc(field.x, field.y, field.radius * pulse, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = `rgba(${color},${0.28 * life})`;
        context.lineWidth = Math.max(1.5, 3 * geometry.scale);
        context.beginPath();
        context.arc(field.x, field.y, field.radius * (0.45 + 0.08 * Math.sin(now / 160)), 0, Math.PI * 2);
        context.stroke();
    }
    context.restore();
}

export function drawBrokenResearchNoteFrame(
    context: CanvasRenderingContext2D,
    options: {
        text: string;
        until: number;
        simpleMode: boolean;
        geometry: Geometry;
        uiFont: string;
        roughCanvas: any;
    },
    now = performance.now(),
): void {
    if (!options.text || now > options.until || options.simpleMode) return;
    const { geometry } = options;
    const alpha = clamp((options.until - now) / 900, 0, 1);
    const w = Math.min(geometry.width * 0.70, 620 * geometry.scale);
    const h = 92 * geometry.scale;
    const x = geometry.width / 2 - w / 2;
    const y = geometry.height * 0.12;
    context.save();
    context.globalAlpha = alpha * 0.92;
    context.fillStyle = "rgba(255,251,235,.88)";
    roundRect(context, x, y, w, h, 20 * geometry.scale);
    context.fill();
    const rc = options.roughCanvas;
    if (rc) {
        rc.rectangle(x + 6, y + 6, w - 12, h - 12, { stroke: "rgba(120,53,15,.70)", strokeWidth: 2.2, roughness: 2.8, bowing: 2.2 });
        rc.line(x + 24, y + h * 0.44, x + w - 24, y + h * 0.38, { stroke: "rgba(180,83,9,.34)", strokeWidth: 1.6, roughness: 3.5 });
    }
    context.fillStyle = "rgba(67,20,7,.92)";
    context.font = `900 ${Math.round(clamp(19 * geometry.scale, 14, 28))}px ${options.uiFont}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("壊れた研究ノート", x + w / 2, y + 28 * geometry.scale);
    context.font = `800 ${Math.round(clamp(15 * geometry.scale, 11, 20))}px ${options.uiFont}`;
    context.fillText(options.text.slice(0, 46), x + w / 2, y + 62 * geometry.scale);
    context.restore();
}
