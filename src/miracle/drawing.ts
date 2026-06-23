import type { DropKind } from "./types";

export function drawSparkle(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, rotate: number): void {
    context.save();
    context.translate(x, y);
    context.rotate(rotate);
    context.strokeStyle = color;
    context.lineWidth = Math.max(1, size * 0.12);
    context.globalAlpha = 0.9;
    context.beginPath();
    context.moveTo(-size, 0);
    context.lineTo(size, 0);
    context.moveTo(0, -size);
    context.lineTo(0, size);
    context.stroke();
    context.restore();
}

export function getSpecialIconColors(kind: DropKind): { main: string; sub: string; text: string; stroke: string } {
    if (kind === "blackSun") return { main: "#090909", sub: "#ff0044", text: "#ffffff", stroke: "#ff0044" };
    if (kind === "cosmicEgg") return { main: "#240038", sub: "#00e5ff", text: "#ffffff", stroke: "#ffffff" };
    if (kind === "silverUfo") return { main: "#d6dde1", sub: "#6e8799", text: "#263238", stroke: "#ffffff" };
    if (kind === "blueFlame") return { main: "#00aaff", sub: "#002bff", text: "#ffffff", stroke: "#dff7ff" };
    if (kind === "timeRift") return { main: "#622aff", sub: "#00e5ff", text: "#ffffff", stroke: "#dff7ff" };
    if (kind === "labExplosion") return { main: "#ff3b30", sub: "#ffd640", text: "#ffffff", stroke: "#fff3b0" };
    if (kind === "poseidonMode") return { main: "#1e88ff", sub: "#002ea6", text: "#ffffff", stroke: "#bde9ff" };
    if (kind === "zeusuMode") return { main: "#ffd400", sub: "#ff9100", text: "#3a2600", stroke: "#fff8c2" };
    if (kind === "hadesuMode") return { main: "#111111", sub: "#5a0000", text: "#ffffff", stroke: "#ff8e8e" };
    if (kind === "heartMode") return { main: "#ff69b4", sub: "#ff2d86", text: "#ffffff", stroke: "#ffe0f0" };
    if (kind === "nekochanMode") return { main: "#ffb36b", sub: "#7f5032", text: "#402000", stroke: "#fff0dd" };
    if (kind === "lifeQuoteMode") return { main: "#ff9ed4", sub: "#8f3f73", text: "#ffffff", stroke: "#ffe0f0" };
    if (kind === "heart") return { main: "#ff69b4", sub: "#ff2d86", text: "#ffffff", stroke: "#ffe0f0" };
    if (kind === "crown" || kind === "goldenDaruma" || kind === "meteorCrown") return { main: "#ffd54a", sub: "#b8860b", text: "#3a2600", stroke: "#fff4a8" };
    if (kind === "crystalDragon") return { main: "#72f1ff", sub: "#3f6bff", text: "#06192f", stroke: "#e8fdff" };
    if (kind === "moonRabbit") return { main: "#eef4ff", sub: "#9dbbff", text: "#223047", stroke: "#ffffff" };
    if (kind === "phantomCastle") return { main: "#9b8cff", sub: "#3b1a84", text: "#ffffff", stroke: "#eeeaff" };
    if (kind === "rainbowWhale") return { main: "#3ee8c9", sub: "#7d5cff", text: "#062923", stroke: "#ffffff" };
    if (kind === "thunderKitsune") return { main: "#ffe45c", sub: "#ff7a00", text: "#3a2600", stroke: "#fff7b0" };
    if (kind === "pocketGalaxy") return { main: "#3547ff", sub: "#ff4dff", text: "#ffffff", stroke: "#dfe4ff" };
    if (kind === "ancientClock") return { main: "#b58b4a", sub: "#4b2e11", text: "#ffffff", stroke: "#ffe6b0" };
    if (kind === "mirrorCat") return { main: "#f5f7ff", sub: "#93a4c7", text: "#233044", stroke: "#ffffff" };
    return { main: "#ffd54a", sub: "#ffffff", text: "#111111", stroke: "#ffffff" };
}

export function drawStarPath(context: CanvasRenderingContext2D, radius: number, points = 5): void {
    context.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / points;
        const r = i % 2 === 0 ? radius : radius * 0.45;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
    }
    context.closePath();
}

export function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
}

export function hexToRgbTriplet(hex: string, fallback: string): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return fallback;
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
