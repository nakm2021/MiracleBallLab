import type Matter from "matter-js";
import type { DropKind, Geometry, SpecialEventDef } from "./types";
import { drawSparkle, getSpecialIconColors, hexToRgbTriplet, roundRect } from "./drawing";
import { clamp } from "./utils";

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

export function drawNormalTraitMarksFrame(context: CanvasRenderingContext2D, bodies: Matter.Body[], ballRadius: number, simpleMode: boolean): void {
    if (simpleMode) return;
    context.save();
    for (const body of bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isDrop || plugin.kind !== "normal" || !plugin.traitMark) continue;
        const x = body.position.x;
        const y = body.position.y;
        const radius = body.circleRadius ?? plugin.originalRadius ?? ballRadius;
        context.globalAlpha = plugin.traitKind === "ghost" ? 0.55 : 0.88;
        context.beginPath();
        context.arc(x, y, radius * 0.66, 0, Math.PI * 2);
        context.fillStyle = "rgba(255,255,255,.42)";
        context.fill();
        context.font = `900 ${Math.round(clamp(radius * 0.66, 9, 20))}px "Noto Sans JP", "Yu Gothic", sans-serif`;
        context.fillStyle = "rgba(15,23,42,.86)";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(String(plugin.traitMark), x, y + radius * 0.03);
    }
    context.restore();
}

export function drawRealisticPinsFrame(context: CanvasRenderingContext2D, bodies: Matter.Body[], geometry: Geometry): void {
    context.save();
    for (const body of bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isPin) continue;
        try { (body.render as any).visible = false; } catch {}
        const rawRadius = body.circleRadius ?? geometry.pinRadius;
        const radius = clamp(Math.max(rawRadius * 1.28, geometry.pinRadius * 1.42, 4 * geometry.scale), 3, 92 * geometry.scale);
        const baseX = Number(plugin.baseX ?? body.position.x);
        const baseY = Number(plugin.baseY ?? body.position.y);
        const magicColor = plugin.isMagicBoardPin ? String(plugin.magicColor || (body.render as any)?.fillStyle || "#fde68a") : "";
        const bend = clamp(Number(plugin.bendAmount ?? 0), -3.2, 3.2);
        const headX = body.position.x + bend * radius * 0.18;
        const headY = body.position.y + Math.abs(bend) * radius * 0.05;
        const stretch = 1 + Math.min(0.55, Math.abs(bend) * 0.09);
        const squash = Math.max(0.62, 1 - Math.abs(bend) * 0.05);
        const rx = Math.max(2, radius * stretch);
        const ry = Math.max(2, radius * squash);

        context.save();
        context.lineCap = "round";
        context.lineJoin = "round";

        const anchorX = baseX;
        const anchorY = baseY + radius * 0.58;
        const controlX = (anchorX + headX) / 2 + bend * radius * 0.78;
        const controlY = (anchorY + headY) / 2 - radius * 0.35;
        context.strokeStyle = "rgba(20,24,34,.32)";
        context.lineWidth = Math.max(2, radius * 0.28);
        context.beginPath();
        context.moveTo(anchorX + radius * 0.10, anchorY + radius * 0.18);
        context.quadraticCurveTo(controlX + radius * 0.10, controlY + radius * 0.18, headX + radius * 0.10, headY + radius * 0.08);
        context.stroke();

        const stemGrad = context.createLinearGradient(anchorX - radius, anchorY, headX + radius, headY);
        stemGrad.addColorStop(0, "rgba(255,255,245,.95)");
        stemGrad.addColorStop(0.34, "rgba(244,202,92,.95)");
        stemGrad.addColorStop(0.68, "rgba(122,78,22,.92)");
        stemGrad.addColorStop(1, "rgba(255,247,190,.88)");
        context.strokeStyle = stemGrad;
        context.lineWidth = Math.max(2, radius * 0.18);
        context.beginPath();
        context.moveTo(anchorX, anchorY);
        context.quadraticCurveTo(controlX, controlY, headX, headY + radius * 0.06);
        context.stroke();

        context.fillStyle = "rgba(0,0,0,.20)";
        context.beginPath();
        context.ellipse(baseX + radius * 0.16, baseY + radius * 0.62, Math.max(2, radius * 0.90), Math.max(2, radius * 0.30), 0, 0, Math.PI * 2);
        context.fill();

        context.translate(headX, headY);
        context.rotate(bend * 0.10);

        const base = context.createRadialGradient(-rx * 0.30, -ry * 0.36, Math.max(1, radius * 0.12), 0, 0, Math.max(2, radius * 1.18));
        if (magicColor) {
            base.addColorStop(0, "rgba(255,255,255,.98)");
            base.addColorStop(0.22, magicColor);
            base.addColorStop(0.56, magicColor);
            base.addColorStop(0.82, "rgba(15,23,42,.86)");
            base.addColorStop(1, magicColor);
        } else {
            base.addColorStop(0, "rgba(255,255,248,.98)");
            base.addColorStop(0.20, "rgba(255,236,148,.98)");
            base.addColorStop(0.48, "rgba(214,149,35,.98)");
            base.addColorStop(0.76, "rgba(129,81,18,.98)");
            base.addColorStop(1, "rgba(255,239,145,.92)");
        }
        context.fillStyle = base;
        context.beginPath();
        context.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        context.fill();

        const shine = context.createLinearGradient(-rx, -ry, rx, ry);
        shine.addColorStop(0, "rgba(255,255,255,.92)");
        shine.addColorStop(0.30, "rgba(255,255,255,.16)");
        shine.addColorStop(0.52, "rgba(255,255,255,0)");
        shine.addColorStop(0.68, "rgba(255,245,180,.34)");
        shine.addColorStop(1, "rgba(0,0,0,.20)");
        context.fillStyle = shine;
        context.beginPath();
        context.ellipse(0, 0, rx * 0.96, ry * 0.96, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = "rgba(255,255,255,.72)";
        context.beginPath();
        context.ellipse(-rx * 0.28, -ry * 0.34, Math.max(1, rx * 0.25), Math.max(1, ry * 0.16), -0.55, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "rgba(255,246,190,.96)";
        context.lineWidth = Math.max(1, radius * 0.12);
        context.beginPath();
        context.ellipse(0, 0, rx * 0.88, ry * 0.88, 0, Math.PI * 0.82, Math.PI * 1.82);
        context.stroke();
        context.strokeStyle = "rgba(52,32,7,.34)";
        context.lineWidth = Math.max(1, radius * 0.08);
        context.beginPath();
        context.ellipse(0, 0, rx * 0.95, ry * 0.95, 0, Math.PI * 0.02, Math.PI * 0.92);
        context.stroke();
        context.restore();
    }
    context.restore();
}

export function drawBoardDepthOverlayFrame(context: CanvasRenderingContext2D, geometry: Geometry, simpleMode: boolean, stableRuntime: boolean, timeMs = performance.now()): void {
    context.save();
    context.globalCompositeOperation = "source-over";
    const scale = geometry.scale || 1;
    const left = Math.max(geometry.wallWidth * 0.58, 10 * scale);
    const top = Math.max(10 * scale, 8);
    const right = geometry.width - left;
    const bottom = Math.max(geometry.groundTop - 12 * scale, top + 40 * scale);
    const w = Math.max(20 * scale, right - left);
    const h = Math.max(20 * scale, bottom - top);
    const radius = Math.max(18 * scale, 14);
    const richAlpha = simpleMode ? 0.55 : 1;

    const frame = context.createLinearGradient(left, top, right, bottom);
    frame.addColorStop(0, `rgba(255,255,255,${0.58 * richAlpha})`);
    frame.addColorStop(0.18, `rgba(210,223,238,${0.30 * richAlpha})`);
    frame.addColorStop(0.45, `rgba(94,111,132,${0.32 * richAlpha})`);
    frame.addColorStop(0.70, `rgba(255,230,145,${0.30 * richAlpha})`);
    frame.addColorStop(1, `rgba(255,255,255,${0.42 * richAlpha})`);
    context.strokeStyle = frame;
    context.lineWidth = Math.max(5 * scale, 3);
    roundRect(context, left, top, w, h, radius);
    context.stroke();

    context.strokeStyle = `rgba(255,255,255,${0.34 * richAlpha})`;
    context.lineWidth = Math.max(2 * scale, 1.5);
    roundRect(context, left + 7 * scale, top + 7 * scale, Math.max(8, w - 14 * scale), Math.max(8, h - 14 * scale), Math.max(8, radius - 7 * scale));
    context.stroke();

    context.strokeStyle = `rgba(0,0,0,${0.26 * richAlpha})`;
    context.lineWidth = Math.max(2 * scale, 1);
    roundRect(context, left + 3 * scale, top + 3 * scale, Math.max(8, w - 6 * scale), Math.max(8, h - 6 * scale), Math.max(8, radius - 3 * scale));
    context.stroke();

    const glass = context.createLinearGradient(0, 0, geometry.width, geometry.height);
    glass.addColorStop(0, `rgba(255,255,255,${0.24 * richAlpha})`);
    glass.addColorStop(0.22, `rgba(255,255,255,${0.07 * richAlpha})`);
    glass.addColorStop(0.38, "rgba(255,255,255,0)");
    glass.addColorStop(0.68, "rgba(0,0,0,0)");
    glass.addColorStop(1, `rgba(0,0,0,${0.16 * richAlpha})`);
    context.fillStyle = glass;
    context.fillRect(0, 0, geometry.width, geometry.height);

    if (!simpleMode && !stableRuntime) {
        context.save();
        context.globalCompositeOperation = "screen";
        const sweepX = (timeMs / 42) % (geometry.width + geometry.height) - geometry.height;
        const sweep = context.createLinearGradient(sweepX, 0, sweepX + geometry.height * 0.55, geometry.height);
        sweep.addColorStop(0, "rgba(255,255,255,0)");
        sweep.addColorStop(0.42, "rgba(255,255,255,0)");
        sweep.addColorStop(0.50, "rgba(255,255,255,.18)");
        sweep.addColorStop(0.58, "rgba(255,255,255,0)");
        sweep.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = sweep;
        context.fillRect(0, 0, geometry.width, geometry.height);
        context.restore();

        const railW = Math.max(16 * scale, 8);
        const rail = context.createLinearGradient(0, top, railW, top);
        rail.addColorStop(0, "rgba(255,255,255,.28)");
        rail.addColorStop(0.45, "rgba(255,255,255,.06)");
        rail.addColorStop(1, "rgba(0,0,0,.20)");
        context.fillStyle = rail;
        roundRect(context, left - railW * 0.45, top + 10 * scale, railW, Math.max(10, h - 20 * scale), railW / 2);
        context.fill();
        context.save();
        context.translate(geometry.width, 0);
        context.scale(-1, 1);
        context.fillStyle = rail;
        roundRect(context, left - railW * 0.45, top + 10 * scale, railW, Math.max(10, h - 20 * scale), railW / 2);
        context.fill();
        context.restore();

        const corners: Array<[number, number, number]> = [
            [left + radius * 0.7, top + radius * 0.7, 0],
            [right - radius * 0.7, top + radius * 0.7, Math.PI * 0.5],
            [left + radius * 0.7, bottom - radius * 0.7, Math.PI * 1.5],
            [right - radius * 0.7, bottom - radius * 0.7, Math.PI],
        ];
        for (const [cx, cy, angle] of corners) {
            context.save();
            context.translate(cx, cy);
            context.rotate(angle);
            const glow = context.createRadialGradient(0, 0, 0, 0, 0, radius * 1.6);
            glow.addColorStop(0, "rgba(255,240,170,.26)");
            glow.addColorStop(0.45, "rgba(255,255,255,.10)");
            glow.addColorStop(1, "rgba(255,255,255,0)");
            context.fillStyle = glow;
            context.beginPath();
            context.arc(0, 0, radius * 1.6, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = "rgba(255,240,170,.35)";
            context.lineWidth = Math.max(1, 1.3 * scale);
            context.beginPath();
            context.moveTo(-radius * 0.8, 0);
            context.lineTo(radius * 0.8, 0);
            context.moveTo(0, -radius * 0.8);
            context.lineTo(0, radius * 0.8);
            context.stroke();
            context.restore();
        }
    }

    const bottomDepth = context.createLinearGradient(0, geometry.groundTop - 150 * scale, 0, geometry.height);
    bottomDepth.addColorStop(0, "rgba(0,0,0,0)");
    bottomDepth.addColorStop(0.65, `rgba(0,0,0,${0.08 * richAlpha})`);
    bottomDepth.addColorStop(1, `rgba(0,0,0,${0.22 * richAlpha})`);
    context.fillStyle = bottomDepth;
    context.fillRect(0, Math.max(0, geometry.groundTop - 150 * scale), geometry.width, Math.max(0, geometry.height - (geometry.groundTop - 150 * scale)));

    context.restore();
}

export function drawLuxuryBoardForegroundFrame(context: CanvasRenderingContext2D, geometry: Geometry, stableRuntime: boolean, timeMs = performance.now()): void {
    const scale = geometry.scale || 1;
    const left = Math.max(geometry.wallWidth * 0.44, 8 * scale);
    const top = Math.max(8 * scale, 6);
    const right = geometry.width - left;
    const bottom = Math.max(geometry.groundTop - 8 * scale, top + 50 * scale);
    const w = Math.max(40 * scale, right - left);
    const h = Math.max(40 * scale, bottom - top);
    const radius = Math.max(22 * scale, 16);
    const time = timeMs / 1000;

    context.save();
    context.globalCompositeOperation = "source-over";

    const chrome = context.createLinearGradient(left, top, right, bottom);
    chrome.addColorStop(0, "rgba(255,255,255,.82)");
    chrome.addColorStop(0.16, "rgba(195,210,228,.42)");
    chrome.addColorStop(0.36, "rgba(66,82,105,.36)");
    chrome.addColorStop(0.58, "rgba(255,238,150,.46)");
    chrome.addColorStop(0.78, "rgba(86,102,126,.30)");
    chrome.addColorStop(1, "rgba(255,255,255,.70)");
    context.strokeStyle = chrome;
    context.lineWidth = Math.max(7 * scale, 4);
    roundRect(context, left, top, w, h, radius);
    context.stroke();

    context.strokeStyle = "rgba(255,255,255,.38)";
    context.lineWidth = Math.max(2.5 * scale, 1.5);
    roundRect(context, left + 8 * scale, top + 8 * scale, Math.max(10, w - 16 * scale), Math.max(10, h - 16 * scale), Math.max(8, radius - 8 * scale));
    context.stroke();

    if (!stableRuntime) {
        context.save();
        context.globalCompositeOperation = "screen";
        const glass = context.createLinearGradient(0, 0, geometry.width, geometry.height);
        glass.addColorStop(0, "rgba(255,255,255,.25)");
        glass.addColorStop(0.28, "rgba(255,255,255,.05)");
        glass.addColorStop(0.46, "rgba(255,255,255,0)");
        glass.addColorStop(0.78, "rgba(255,255,255,.08)");
        glass.addColorStop(1, "rgba(255,255,255,.18)");
        context.fillStyle = glass;
        context.fillRect(0, 0, geometry.width, bottom);

        const sweepX = ((time * 95) % (geometry.width + geometry.height)) - geometry.height;
        const sweep = context.createLinearGradient(sweepX, 0, sweepX + geometry.height * 0.62, geometry.height);
        sweep.addColorStop(0, "rgba(255,255,255,0)");
        sweep.addColorStop(0.45, "rgba(255,255,255,0)");
        sweep.addColorStop(0.51, "rgba(255,255,255,.22)");
        sweep.addColorStop(0.58, "rgba(255,255,255,0)");
        sweep.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = sweep;
        context.fillRect(0, 0, geometry.width, bottom);
        context.restore();
    }

    const depth = context.createLinearGradient(0, bottom - 80 * scale, 0, geometry.height);
    depth.addColorStop(0, "rgba(0,0,0,0)");
    depth.addColorStop(1, "rgba(0,0,0,.26)");
    context.fillStyle = depth;
    context.fillRect(0, Math.max(0, bottom - 80 * scale), geometry.width, geometry.height - Math.max(0, bottom - 80 * scale));

    for (const side of [-1, 1]) {
        const cx = side < 0 ? left + 18 * scale : right - 18 * scale;
        const glow = context.createLinearGradient(cx - side * 10 * scale, top, cx + side * 10 * scale, bottom);
        glow.addColorStop(0, "rgba(255,255,255,.28)");
        glow.addColorStop(0.45, "rgba(135,205,255,.10)");
        glow.addColorStop(1, "rgba(255,236,160,.20)");
        context.fillStyle = glow;
        roundRect(context, cx - 5 * scale, top + 18 * scale, 10 * scale, Math.max(10, h - 36 * scale), 999);
        context.fill();
    }

    context.restore();
}

export function drawMobileRuntimeStableFrame(context: CanvasRenderingContext2D, geometry: Geometry): void {
    const scale = geometry.scale || 1;
    const left = Math.max(geometry.wallWidth * 0.50, 8 * scale);
    const top = Math.max(8 * scale, 6);
    const right = geometry.width - left;
    const bottom = Math.max(geometry.groundTop - 8 * scale, top + 50 * scale);
    const w = Math.max(40 * scale, right - left);
    const h = Math.max(40 * scale, bottom - top);
    const radius = Math.max(22 * scale, 16);

    context.save();
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = "rgba(190,202,216,.72)";
    context.lineWidth = Math.max(5 * scale, 3);
    roundRect(context, left, top, w, h, radius);
    context.stroke();
    context.strokeStyle = "rgba(30,38,52,.72)";
    context.lineWidth = Math.max(2 * scale, 1.5);
    roundRect(context, left + 5 * scale, top + 5 * scale, Math.max(8, w - 10 * scale), Math.max(8, h - 10 * scale), Math.max(8, radius - 5 * scale));
    context.stroke();
    context.restore();
}

export function drawSpecialGlowsFrame(
    context: CanvasRenderingContext2D,
    bodies: Matter.Body[],
    options: {
        simpleMode: boolean;
        isMobile: boolean;
        geometry: Geometry;
        findSpecialDef: (kind: DropKind) => SpecialEventDef | undefined;
        drawSpecialIcon: (context: CanvasRenderingContext2D, kind: DropKind, x: number, y: number, radius: number, symbol: string) => void;
    },
    timeSec = Date.now() / 1000,
): void {
    if (options.simpleMode) return;
    context.save();
    for (const body of bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isDrop) continue;
        const kind = plugin.kind as DropKind;
        const def = options.findSpecialDef(kind);
        if (!def && !["gold", "rainbow"].includes(kind)) continue;
        const x = body.position.x;
        const y = body.position.y;
        const radius = body.circleRadius ?? plugin.originalRadius ?? options.geometry.ballRadius;
        const pulse = 0.75 + Math.sin(timeSec * 9) * 0.25;
        let colors = ["255,215,0", "255,170,0"];
        if (kind === "rainbow") colors = ["190,100,255", "80,180,255"];
        if (def) {
            const c = getSpecialIconColors(kind);
            colors = hexToRgbTriplet(c.main, "255,215,0") ? [hexToRgbTriplet(c.main, "255,215,0"), hexToRgbTriplet(c.sub, "255,170,0")] : colors;
        }

        context.save();
        context.globalCompositeOperation = "lighter";
        const glow = context.createRadialGradient(x, y, radius * 0.25, x, y, radius * (options.isMobile ? 3.0 : 4.5));
        glow.addColorStop(0, `rgba(${colors[0]}, ${0.42 * pulse})`);
        glow.addColorStop(0.72, `rgba(${colors[1]}, ${0.18 * pulse})`);
        glow.addColorStop(1, `rgba(${colors[1]}, 0)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, radius * (options.isMobile ? 3.0 : 4.5), 0, Math.PI * 2);
        context.fill();
        context.restore();

        if (def) {
            options.drawSpecialIcon(context, kind, x, y, Math.max(radius, options.isMobile ? 20 : 14 * options.geometry.scale), plugin.symbol || def.symbol);
        }

        if (kind === "gold" || kind === "rainbow") {
            for (let i = 0; i < 6; i++) {
                const angle = timeSec * 2.5 + i * Math.PI * 2 / 6;
                drawSparkle(context, x + Math.cos(angle) * radius * 2.6, y + Math.sin(angle) * radius * 2.6, 5 * options.geometry.scale, "rgba(255,255,220,.95)", angle);
            }
        }
    }
    context.restore();
}
