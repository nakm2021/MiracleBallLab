import type { TimeBallSkin, TimeBallTheme } from "./types";
import { drawStarPath } from "./drawing";

export type TimeBallSkinLabels = {
    normal: string;
    drop: string;
    gloss: string;
    spark: string;
    star: string;
    moon: string;
    darkShard: string;
    swordShard: string;
    coin: string;
    heart: string;
    crown: string;
};

export type TimeBallThemeLabels = {
    morning: string;
    day: string;
    evening: string;
    night: string;
    midnight: string;
};

export function getCurrentTimeBallTheme(date = new Date()): TimeBallTheme {
    const hour = date.getHours();
    if (hour >= 5 && hour <= 10) return "morning";
    if (hour >= 11 && hour <= 16) return "day";
    if (hour >= 17 && hour <= 19) return "evening";
    if (hour >= 20 && hour <= 23) return "night";
    return "midnight";
}

export function getTimeBallThemeLabel(theme: TimeBallTheme, labels: TimeBallThemeLabels): string {
    return labels[theme];
}

export function getTimeBallSkinLabel(skin: TimeBallSkin, labels: TimeBallSkinLabels): string {
    return labels[skin];
}

export function chooseTimeBallSkin(enabled: boolean, random: () => number, now = new Date()): TimeBallSkin {
    if (!enabled) return "normal";
    const theme = getCurrentTimeBallTheme(now);
    const day = now.getDay();
    const roll = random();

    if (day === 6 && roll < 0.05) return "crown";
    if (day === 0 && roll < 0.05) return "heart";
    if (day === 5 && roll < 0.05) return "coin";

    if (theme === "morning") return roll < 0.20 ? "drop" : "normal";
    if (theme === "day") return roll < 0.05 ? "gloss" : "normal";
    if (theme === "evening") return roll < 0.20 ? "spark" : "normal";
    if (theme === "night") {
        if (roll < 0.15) return "star";
        if (roll < 0.20) return "moon";
        return "normal";
    }
    if (roll < 0.20) return "darkShard";
    if (roll < 0.25) return "swordShard";
    return "normal";
}

export function getTimeBallSkinFillStyle(skin: TimeBallSkin, fallback: string): string {
    if (skin === "drop") return "#8ee7ff";
    if (skin === "gloss") return fallback;
    if (skin === "spark") return "#ff9f43";
    if (skin === "star") return "#fff176";
    if (skin === "moon") return "#dbeafe";
    if (skin === "darkShard") return "#111827";
    if (skin === "swordShard") return "#dff7ff";
    if (skin === "coin") return "#f6c945";
    if (skin === "heart") return "#ff7ab6";
    if (skin === "crown") return "#ffd54a";
    return fallback;
}

export function drawTimeBallSkinIcon(context: CanvasRenderingContext2D, skin: TimeBallSkin, x: number, y: number, radius: number, angle: number, fallbackColor: string, simpleMode: boolean): void {
    if (skin === "normal") return;
    const color = getTimeBallSkinFillStyle(skin, fallbackColor);
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.lineJoin = "round";
    context.lineCap = "round";
    context.strokeStyle = "rgba(255,255,255,.88)";
    context.lineWidth = Math.max(1.2, radius * 0.12);
    context.shadowColor = color;
    context.shadowBlur = simpleMode ? 0 : Math.max(0, radius * 0.4);
    context.fillStyle = color;

    if (skin === "drop") {
        context.beginPath();
        context.moveTo(0, -radius * 1.08);
        context.bezierCurveTo(radius * 0.78, -radius * 0.2, radius * 0.62, radius * 0.88, 0, radius * 1.0);
        context.bezierCurveTo(-radius * 0.62, radius * 0.88, -radius * 0.78, -radius * 0.2, 0, -radius * 1.08);
        context.closePath();
        context.fill(); context.stroke();
        context.fillStyle = "rgba(255,255,255,.70)";
        context.beginPath(); context.ellipse(-radius * 0.22, -radius * 0.26, radius * 0.16, radius * 0.28, -0.45, 0, Math.PI * 2); context.fill();
    } else if (skin === "spark") {
        drawStarPath(context, radius * 1.02, 4);
        context.fill(); context.stroke();
        context.fillStyle = "rgba(255,245,200,.95)";
        context.beginPath(); context.arc(0, 0, radius * 0.32, 0, Math.PI * 2); context.fill();
    } else if (skin === "star") {
        drawStarPath(context, radius * 1.06, 5);
        context.fill(); context.stroke();
    } else if (skin === "moon") {
        context.beginPath(); context.arc(0, 0, radius * 0.98, Math.PI * 0.22, Math.PI * 1.78); context.bezierCurveTo(radius * 0.28, radius * 0.46, radius * 0.28, -radius * 0.46, radius * 0.98, -radius * 0.74); context.closePath();
        context.fill(); context.stroke();
    } else if (skin === "darkShard" || skin === "swordShard") {
        context.beginPath();
        context.moveTo(-radius * 0.28, -radius * 1.08);
        context.lineTo(radius * 0.82, -radius * 0.22);
        context.lineTo(radius * 0.26, radius * 1.04);
        context.lineTo(-radius * 0.76, radius * 0.28);
        context.closePath();
        context.fill(); context.stroke();
        if (skin === "swordShard") {
            context.strokeStyle = "rgba(20,40,60,.78)";
            context.lineWidth = Math.max(1, radius * 0.08);
            context.beginPath(); context.moveTo(-radius * 0.15, -radius * 0.72); context.lineTo(radius * 0.18, radius * 0.72); context.stroke();
        }
    } else if (skin === "coin") {
        context.beginPath(); context.ellipse(0, 0, radius * 0.92, radius * 0.76, 0, 0, Math.PI * 2); context.fill(); context.stroke();
        context.strokeStyle = "rgba(95,58,0,.65)"; context.lineWidth = Math.max(1, radius * 0.08);
        context.beginPath(); context.ellipse(0, 0, radius * 0.58, radius * 0.46, 0, 0, Math.PI * 2); context.stroke();
    } else if (skin === "heart") {
        context.beginPath();
        context.moveTo(0, radius * 0.72);
        context.bezierCurveTo(-radius * 1.0, radius * 0.06, -radius * 0.72, -radius * 0.76, 0, -radius * 0.34);
        context.bezierCurveTo(radius * 0.72, -radius * 0.76, radius * 1.0, radius * 0.06, 0, radius * 0.72);
        context.fill(); context.stroke();
    } else if (skin === "crown") {
        context.beginPath();
        context.moveTo(-radius * 0.86, radius * 0.42);
        context.lineTo(-radius * 0.62, -radius * 0.42);
        context.lineTo(-radius * 0.22, radius * 0.08);
        context.lineTo(0, -radius * 0.74);
        context.lineTo(radius * 0.22, radius * 0.08);
        context.lineTo(radius * 0.62, -radius * 0.42);
        context.lineTo(radius * 0.86, radius * 0.42);
        context.closePath();
        context.fill(); context.stroke();
    } else if (skin === "gloss") {
        context.beginPath(); context.arc(0, 0, radius * 0.92, 0, Math.PI * 2); context.fill(); context.stroke();
        context.fillStyle = "rgba(255,255,255,.65)";
        context.beginPath(); context.arc(-radius * 0.28, -radius * 0.32, radius * 0.24, 0, Math.PI * 2); context.fill();
    }
    context.restore();
}
