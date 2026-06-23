import type { DropKind, Geometry, PachinkoYakumonoDef, PachinkoYakumonoKind } from "./types";
import { getSpecialIconColors, hexToRgbTriplet, roundRect } from "./drawing";
import { clamp } from "./utils";

export function drawDiscardBinLabelFrame(context: CanvasRenderingContext2D, physicalIndex: number, geometry: Geometry, isMobile: boolean): void {
    const x = geometry.binLeft + physicalIndex * geometry.binWidth + geometry.binWidth / 2;
    const labelFont = Math.round(clamp(geometry.labelFont * 0.78, isMobile ? 18 : 13, isMobile ? 36 : 30));
    const countFont = Math.round(clamp(geometry.countFont * 0.88, isMobile ? 13 : 10, isMobile ? 28 : 26));
    context.save();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(80, 86, 100, 0.18)";
    context.fillRect(x - geometry.binWidth / 2, geometry.groundTop - 118 * geometry.scale, geometry.binWidth, 118 * geometry.scale);
    context.font = `900 ${labelFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
    context.fillStyle = "#5b3b3b";
    context.fillText("捨て", x, geometry.labelY - labelFont * 0.55);
    context.fillText("区間", x, geometry.labelY + labelFont * 0.55);
    context.font = `800 ${countFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
    context.fillStyle = "#6b4a4a";
    context.fillText("対象外", x, geometry.countY);
    context.restore();
}

export function drawSpecialIconFrame(context: CanvasRenderingContext2D, kind: DropKind, x: number, y: number, radius: number, symbol: string, options: { isMobile: boolean; geometry: Geometry }, timeSec = Date.now() / 1000): void {
    const colors = getSpecialIconColors(kind);
    const r = Math.max(radius * (options.isMobile ? 1.45 : 1.2), options.isMobile ? 22 : 18 * options.geometry.scale);
    context.save();
    context.translate(x, y);
    context.rotate(kind === "timeRift" ? timeSec * 1.8 : 0);

    context.beginPath();
    context.arc(0, 0, r * 1.08, 0, Math.PI * 2);
    context.fillStyle = "rgba(255,255,255,.95)";
    context.fill();

    const grad = context.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.35, colors.main);
    grad.addColorStop(1, colors.sub);
    context.beginPath();
    context.arc(0, 0, r, 0, Math.PI * 2);
    context.fillStyle = grad;
    context.fill();
    context.lineWidth = Math.max(3, r * 0.14);
    context.strokeStyle = colors.stroke;
    context.stroke();

    context.save();
    context.globalAlpha = 0.95;
    context.fillStyle = colors.text;
    context.strokeStyle = "rgba(0,0,0,.35)";
    context.lineWidth = Math.max(2, r * 0.07);

    if (kind === "crown" || kind === "meteorCrown") {
        context.beginPath();
        context.moveTo(-r * 0.65, r * 0.25);
        context.lineTo(-r * 0.45, -r * 0.38);
        context.lineTo(-r * 0.15, r * 0.03);
        context.lineTo(0, -r * 0.55);
        context.lineTo(r * 0.15, r * 0.03);
        context.lineTo(r * 0.45, -r * 0.38);
        context.lineTo(r * 0.65, r * 0.25);
        context.closePath();
        context.fillStyle = "#ffd54a";
        context.fill();
        context.stroke();
        context.fillStyle = "#3a2600";
        context.font = `900 ${Math.round(r * 0.62)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(kind === "meteorCrown" ? "冠" : "王", 0, r * 0.15);
    } else if (kind === "silverUfo") {
        context.beginPath();
        context.ellipse(0, r * 0.05, r * 0.82, r * 0.28, 0, 0, Math.PI * 2);
        context.fillStyle = "#dce3e7";
        context.fill(); context.stroke();
        context.beginPath();
        context.arc(0, -r * 0.08, r * 0.36, Math.PI, 0);
        context.fillStyle = "#9bdcff";
        context.fill(); context.stroke();
    } else if (kind === "blueFlame") {
        context.beginPath();
        context.moveTo(0, -r * 0.78);
        context.bezierCurveTo(r * 0.72, -r * 0.1, r * 0.36, r * 0.72, 0, r * 0.78);
        context.bezierCurveTo(-r * 0.62, r * 0.3, -r * 0.55, -r * 0.15, 0, -r * 0.78);
        context.closePath();
        context.fillStyle = "#00c8ff";
        context.fill(); context.stroke();
        context.beginPath();
        context.moveTo(0, -r * 0.32);
        context.bezierCurveTo(r * 0.28, r * 0.12, r * 0.10, r * 0.42, 0, r * 0.5);
        context.bezierCurveTo(-r * 0.22, r * 0.28, -r * 0.18, 0, 0, -r * 0.32);
        context.fillStyle = "#ffffff";
        context.fill();
    } else if (kind === "timeRift" || kind === "pocketGalaxy") {
        context.lineWidth = Math.max(4, r * 0.13);
        for (let i = 0; i < 3; i++) {
            context.beginPath();
            context.arc(0, 0, r * (0.28 + i * 0.18), i * 0.9, Math.PI * 1.6 + i * 0.9);
            context.strokeStyle = i % 2 ? "#ffffff" : "#00e5ff";
            context.stroke();
        }
        context.fillStyle = "#ffffff";
        context.font = `900 ${Math.round(r * 0.44)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText(kind === "timeRift" ? "裂" : "銀", 0, 0);
    } else if (kind === "heart") {
        context.beginPath();
        context.moveTo(0, r * 0.58);
        context.bezierCurveTo(-r * 0.9, -r * 0.02, -r * 0.62, -r * 0.72, 0, -r * 0.36);
        context.bezierCurveTo(r * 0.62, -r * 0.72, r * 0.9, -r * 0.02, 0, r * 0.58);
        context.fillStyle = "#ff4da6";
        context.fill(); context.stroke();
    } else if (kind === "blackSun") {
        for (let i = 0; i < 10; i++) {
            const a = i * Math.PI * 2 / 10;
            context.beginPath();
            context.moveTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75);
            context.lineTo(Math.cos(a) * r * 1.18, Math.sin(a) * r * 1.18);
            context.strokeStyle = "#ff0044";
            context.lineWidth = Math.max(3, r * 0.1);
            context.stroke();
        }
        context.beginPath(); context.arc(0, 0, r * .62, 0, Math.PI * 2); context.fillStyle = "#050505"; context.fill(); context.strokeStyle = "#ff0044"; context.stroke();
    } else if (kind === "poseidonMode") {
        context.font = `900 ${Math.round(r * 0.88)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("🌊", 0, 0);
    } else if (kind === "zeusuMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("⚡", 0, 0);
    } else if (kind === "hadesuMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("☠️", 0, 0);
    } else if (kind === "heartMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("💗", 0, 0);
    } else if (kind === "nekochanMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("🐈", 0, 0);
    } else if (kind === "lifeQuoteMode") {
        context.fillStyle = "#ffffff";
        context.font = `900 ${Math.round(r * 0.46)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("声", 0, 0);
    } else if (kind === "labExplosion") {
        context.beginPath();
        for (let i = 0; i < 12; i++) {
            const a = i * Math.PI * 2 / 12;
            const rr = i % 2 ? r * 0.45 : r * 0.95;
            const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
            if (i === 0) context.moveTo(px, py); else context.lineTo(px, py);
        }
        context.closePath();
        context.fillStyle = "#ff3b30";
        context.fill(); context.stroke();
        context.fillStyle = "#fff3b0";
        context.font = `900 ${Math.round(r * 0.48)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("爆", 0, 0);
    } else {
        context.font = `900 ${Math.round(symbol.length >= 2 ? r * 0.58 : r * 0.78)}px "Noto Sans JP", "Yu Gothic", "Segoe UI", sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.strokeStyle = "rgba(255,255,255,.85)";
        context.lineWidth = Math.max(3, r * 0.09);
        context.strokeText(symbol, 0, r * 0.03);
        context.fillStyle = colors.text;
        context.fillText(symbol, 0, r * 0.03);
    }
    context.restore();

    context.restore();
}

export function drawPachinkoMachineFrame(
    context: CanvasRenderingContext2D,
    options: {
        geometry: Geometry;
        yakumonoDefs: PachinkoYakumonoDef[];
        blackModeEnabled: boolean;
        uiFont: string;
        currentPattern: string;
        getYakumonoAlpha: (kind: PachinkoYakumonoKind) => number;
    },
    timeMs = performance.now(),
): void {
    const { geometry } = options;
    const time = timeMs / 1000;
    context.save();
    context.globalCompositeOperation = "destination-over";
    const framePad = Math.max(geometry.wallWidth * 0.38, 8 * geometry.scale);
    const panelGradient = context.createLinearGradient(0, 0, 0, geometry.height);
    panelGradient.addColorStop(0, options.blackModeEnabled ? "rgba(0,0,0,.94)" : "rgba(68,10,20,.86)");
    panelGradient.addColorStop(0.55, options.blackModeEnabled ? "rgba(10,10,10,.76)" : "rgba(22,18,24,.46)");
    panelGradient.addColorStop(1, options.blackModeEnabled ? "rgba(0,0,0,.98)" : "rgba(102,19,32,.82)");
    context.fillStyle = panelGradient;
    context.fillRect(0, 0, geometry.width, geometry.height);

    context.strokeStyle = options.blackModeEnabled ? "rgba(255,255,255,.22)" : "rgba(255,214,96,.75)";
    context.lineWidth = Math.max(8 * geometry.scale, 4);
    context.strokeRect(framePad, framePad, geometry.width - framePad * 2, geometry.height - geometry.groundHeight - framePad * 1.4);

    const cx = geometry.width / 2;
    const cy = geometry.height * 0.43;
    const ringRadius = Math.min(geometry.width, geometry.height) * 0.18;
    context.beginPath();
    context.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    context.strokeStyle = options.blackModeEnabled ? "rgba(255,255,255,.30)" : "rgba(255,230,130,.82)";
    context.lineWidth = Math.max(10 * geometry.scale, 5);
    context.stroke();
    context.beginPath();
    context.arc(cx, cy, ringRadius * 0.62 + Math.sin(time * 2) * 3 * geometry.scale, 0, Math.PI * 2);
    context.strokeStyle = "rgba(255,255,255,.18)";
    context.lineWidth = Math.max(4 * geometry.scale, 2);
    context.stroke();

    for (const def of options.yakumonoDefs) {
        const x = geometry.width * def.xRatio;
        const y = geometry.height * def.yRatio;
        const w = clamp(geometry.width * def.widthRatio, 82 * geometry.scale, 260 * geometry.scale);
        const h = clamp(def.height * geometry.scale, 12, 32);
        const glow = options.getYakumonoAlpha(def.kind);
        context.fillStyle = `rgba(${hexToRgbTriplet(def.color, "250,204,21")},${0.24 + glow * 0.32})`;
        roundRect(context, x - w / 2, y - h / 2, w, h, h / 2);
        context.fill();
        context.strokeStyle = `rgba(${hexToRgbTriplet(def.color, "250,204,21")},.92)`;
        context.lineWidth = Math.max(2 * geometry.scale, 1);
        context.stroke();
        context.font = `900 ${Math.round(clamp(15 * geometry.scale, 11, 24))}px ${options.uiFont}`;
        context.fillStyle = options.blackModeEnabled ? "#f8fafc" : "#fff7cc";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(def.label, x, y);
    }

    context.font = `900 ${Math.round(clamp(18 * geometry.scale, 12, 28))}px ${options.uiFont}`;
    context.fillStyle = options.blackModeEnabled ? "rgba(255,255,255,.72)" : "rgba(255,239,200,.86)";
    context.textAlign = "center";
    context.fillText(`MIRACLE BALL LAB / ${options.currentPattern.toUpperCase()}`, geometry.width / 2, Math.max(26 * geometry.scale, 20));
    context.restore();
}
