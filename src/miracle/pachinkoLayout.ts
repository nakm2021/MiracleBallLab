import type { Geometry } from "./types";
import { clamp } from "./utils";

export const PACHINKO_NAIL_PATTERNS = [
    "standard",
    "wave",
    "hourglass",
    "stairs",
    "crown",
    "diamond",
    "zigzag",
    "spiral",
    "heart",
] as const;

export function pickRandomPachinkoNailPattern(random: () => number): string {
    return PACHINKO_NAIL_PATTERNS[Math.floor(random() * PACHINKO_NAIL_PATTERNS.length)] ?? "standard";
}

export function getPachinkoPinOffset(
    pattern: string,
    row: number,
    col: number,
    rowCount: number,
    colCount: number,
    baseX: number,
    y: number,
    geometry: Geometry,
): { x: number; y: number } {
    const centerX = geometry.width / 2;
    const rowNorm = rowCount <= 1 ? 0 : row / (rowCount - 1);
    const colNorm = colCount <= 1 ? 0 : (col / (colCount - 1)) * 2 - 1;
    let dx = 0;
    let dy = 0;
    const swing = geometry.binWidth * 0.24;
    if (pattern === "wave") {
        dx += Math.sin(row * 0.95 + col * 0.75) * geometry.binWidth * 0.18;
        dy += Math.cos(col * 0.62 + row * 0.4) * 5 * geometry.scale;
    } else if (pattern === "hourglass") {
        const squeeze = 1 - Math.abs(rowNorm * 2 - 1);
        dx += -Math.sign(baseX - centerX || 1) * squeeze * swing;
    } else if (pattern === "stairs") {
        dx += ((row % 4) - 1.5) * geometry.binWidth * 0.1 + (col % 2 === 0 ? 1 : -1) * geometry.binWidth * 0.06;
        dy += ((col % 3) - 1) * 3.6 * geometry.scale;
    } else if (pattern === "crown") {
        dx += Math.sin(colNorm * Math.PI * 2.5) * geometry.binWidth * 0.16;
        if (row < Math.max(2, Math.floor(rowCount * 0.34)))
            dy -= Math.max(0, 1 - Math.abs(colNorm) * 1.7) * 16 * geometry.scale;
    } else if (pattern === "diamond") {
        dx += colNorm * Math.abs(rowNorm * 2 - 1) * geometry.binWidth * 0.28;
    } else if (pattern === "zigzag") {
        dx += (row % 2 === 0 ? 1 : -1) * Math.abs(colNorm) * geometry.binWidth * 0.22;
    } else if (pattern === "spiral") {
        dx += Math.sin(row * 0.48) * colNorm * geometry.binWidth * 0.3 + Math.cos(col * 0.7) * geometry.binWidth * 0.08;
        dy += Math.sin(row * 0.9 + col * 0.4) * 4.5 * geometry.scale;
    } else if (pattern === "heart") {
        const heartPull = Math.sin(rowNorm * Math.PI) * geometry.binWidth * 0.18;
        dx += -Math.sign(colNorm || 1) * heartPull;
        if (rowNorm < 0.45) dy -= Math.max(0, 0.5 - Math.abs(colNorm)) * 10 * geometry.scale;
        if (rowNorm > 0.55) dy += Math.max(0, 1 - Math.abs(colNorm) * 1.5) * 8 * geometry.scale;
    }
    return {
        x: clamp(
            baseX + dx,
            geometry.wallWidth + geometry.pinRadius * 2.2,
            geometry.width - geometry.wallWidth - geometry.pinRadius * 2.2,
        ),
        y: y + dy,
    };
}
