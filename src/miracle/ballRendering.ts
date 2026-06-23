import type Matter from "matter-js";

export type BallShadingOptions = {
    simpleMode: boolean;
    lowSpecMode: boolean;
    isMobile: boolean;
};

export function draw3DBallShadingFrame(context: CanvasRenderingContext2D, bodies: Matter.Body[], options: BallShadingOptions, timeMs = performance.now()): void {
    const dropBodies = bodies.filter((body) => (body as any).plugin?.isDrop);
    const maxShaded = options.simpleMode ? 90 : (options.isMobile || options.lowSpecMode ? 140 : 720);
    const step = dropBodies.length > maxShaded ? Math.ceil(dropBodies.length / maxShaded) : 1;
    const timeSec = timeMs * 0.001;
    context.save();
    for (let bodyIndex = 0; bodyIndex < dropBodies.length; bodyIndex += step) {
        const body = dropBodies[bodyIndex];
        const plugin = (body as any).plugin;
        const radius = body.circleRadius ?? plugin?.originalRadius ?? 0;
        if (!radius || radius <= 0) continue;
        const x = body.position.x;
        const y = body.position.y;
        const kind = String(plugin?.kind ?? "normal");
        const isDarkBall = kind === "blackSun" || kind === "darkMatter";
        const metallicBall = kind !== "ghost" && kind !== "heart";
        const phase = timeSec * 1.8 + (body.id % 29) * 0.31 + body.angle * 0.35;
        const stripeShift = Math.sin(phase) * radius * 0.30;
        const stripeShift2 = Math.cos(phase * 0.72 + 0.6) * radius * 0.22;

        context.save();
        context.beginPath();
        context.arc(x, y, radius * 0.987, 0, Math.PI * 2);
        context.clip();

        const silverSheen = context.createLinearGradient(x - radius * 1.04, y - radius * 1.08, x + radius * 1.02, y + radius * 1.06);
        silverSheen.addColorStop(0, isDarkBall ? "rgba(255,255,255,.36)" : "rgba(255,255,255,.72)");
        silverSheen.addColorStop(0.18, isDarkBall ? "rgba(220,230,245,.16)" : "rgba(232,238,248,.46)");
        silverSheen.addColorStop(0.46, "rgba(255,255,255,0)");
        silverSheen.addColorStop(0.74, "rgba(24,32,44,.10)");
        silverSheen.addColorStop(1, "rgba(0,0,0,.25)");
        context.fillStyle = silverSheen;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        if (metallicBall) {
            const sweep = context.createLinearGradient(x - radius * 0.96 + stripeShift, y - radius * 0.14, x + radius * 0.98 + stripeShift, y + radius * 0.14);
            sweep.addColorStop(0, "rgba(255,255,255,0)");
            sweep.addColorStop(0.14, "rgba(220,230,245,.18)");
            sweep.addColorStop(0.30, "rgba(250,252,255,.48)");
            sweep.addColorStop(0.48, "rgba(255,255,255,.98)");
            sweep.addColorStop(0.58, "rgba(208,220,240,.56)");
            sweep.addColorStop(0.76, "rgba(255,255,255,.08)");
            sweep.addColorStop(1, "rgba(255,255,255,0)");
            context.fillStyle = sweep;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();

            const sweep2 = context.createLinearGradient(x - radius * 0.84 + stripeShift2, y - radius * 0.05, x + radius * 0.84 + stripeShift2, y + radius * 0.06);
            sweep2.addColorStop(0, "rgba(255,255,255,0)");
            sweep2.addColorStop(0.42, "rgba(230,238,250,.10)");
            sweep2.addColorStop(0.52, "rgba(255,255,255,.48)");
            sweep2.addColorStop(0.62, "rgba(210,220,238,.10)");
            sweep2.addColorStop(1, "rgba(255,255,255,0)");
            context.fillStyle = sweep2;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }

        const topCool = context.createLinearGradient(x, y - radius * 0.98, x, y + radius * 0.98);
        topCool.addColorStop(0, "rgba(224,236,255,.24)");
        topCool.addColorStop(0.24, "rgba(255,255,255,0)");
        topCool.addColorStop(0.76, "rgba(0,0,0,.06)");
        topCool.addColorStop(1, "rgba(0,0,0,.13)");
        context.fillStyle = topCool;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = isDarkBall ? "rgba(255,255,255,.66)" : "rgba(255,255,255,.94)";
        context.beginPath();
        context.ellipse(x - radius * 0.30, y - radius * 0.42, radius * 0.29, radius * 0.18, -0.56, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = "rgba(255,255,255,.82)";
        context.beginPath();
        context.arc(x - radius * 0.42, y - radius * 0.52, Math.max(1.2, radius * 0.08), 0, Math.PI * 2);
        context.fill();

        context.fillStyle = metallicBall ? "rgba(255,255,255,.42)" : "rgba(255,255,255,.16)";
        context.beginPath();
        context.ellipse(x - radius * 0.02 + stripeShift * 0.25, y - radius * 0.10, radius * 0.50, radius * 0.12, -0.38, 0, Math.PI * 2);
        context.fill();

        if (!options.lowSpecMode) {
            context.fillStyle = "rgba(255,255,255,.22)";
            context.beginPath();
            context.ellipse(x + radius * 0.44, y - radius * 0.02, radius * 0.10, radius * 0.34, 0.2, 0, Math.PI * 2);
            context.fill();

            const lowerShade = context.createRadialGradient(x + radius * 0.22, y + radius * 0.40, radius * 0.18, x + radius * 0.16, y + radius * 0.42, radius * 1.02);
            lowerShade.addColorStop(0, "rgba(0,0,0,0)");
            lowerShade.addColorStop(0.70, "rgba(0,0,0,.08)");
            lowerShade.addColorStop(1, "rgba(0,0,0,.24)");
            context.fillStyle = lowerShade;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }

        context.restore();

        context.strokeStyle = metallicBall ? "rgba(255,255,255,.38)" : "rgba(255,255,255,.24)";
        context.lineWidth = Math.max(1, radius * 0.085);
        context.beginPath();
        context.arc(x, y, radius * 0.968, Math.PI * 0.80, Math.PI * 1.88);
        context.stroke();

        context.strokeStyle = metallicBall ? "rgba(16,22,30,.24)" : "rgba(0,0,0,.14)";
        context.lineWidth = Math.max(1, radius * 0.06);
        context.beginPath();
        context.arc(x, y, radius * 0.94, Math.PI * 0.04, Math.PI * 1.00);
        context.stroke();
    }
    context.restore();
}
