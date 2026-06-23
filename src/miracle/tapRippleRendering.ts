import type { Geometry, TapRipple } from "./types";

export function drawTapRipplesFrame(context: CanvasRenderingContext2D, ripples: TapRipple[], options: { simpleMode: boolean; isPaused: boolean; geometry: Geometry }): void {
    if (options.simpleMode || ripples.length === 0) return;
    context.save();
    for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        const p = 1 - ripple.life / ripple.maxLife;
        const radius = (24 + p * 130) * options.geometry.scale;
        context.globalAlpha = Math.max(0, ripple.life / ripple.maxLife) * 0.72;
        context.strokeStyle = "#93c5fd";
        context.lineWidth = Math.max(2, 5 * options.geometry.scale * (1 - p));
        context.beginPath();
        context.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        context.stroke();
        if (!options.isPaused) ripple.life--;
        if (ripple.life <= 0) ripples.splice(i, 1);
    }
    context.restore();
}
