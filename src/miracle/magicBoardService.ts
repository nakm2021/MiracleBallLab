import type { MagicCircleDef } from "./magicCircles";
import type { RareBoardCatastropheKind } from "./rareBoardCatastrophe";
import type { Geometry } from "./types";
import type { MagicPhysicsField } from "./magicPhysicsRendering";
import { clamp } from "./utils";
import Matter from "matter-js";

const Body = Matter.Body;

export type MagicBoardPinSpec = {
    x: number;
    y: number;
    label: string;
    color: string;
    radiusScale: number;
    lifetimeMs?: number;
};

export type MagicBoardFieldSpec = {
    kind: MagicPhysicsField["kind"];
    x: number;
    y: number;
    radius: number;
    strength: number;
    durationMs: number;
    label: string;
};

export type MagicBoardPlan = {
    pins: MagicBoardPinSpec[];
    fields: MagicBoardFieldSpec[];
    restoreGravity?: { y: number; delayMs: number };
    floatingText: { text: string; x: number; y: number; color: string };
};

export type MagicCircleActivationPlan = {
    field: MagicBoardFieldSpec;
    extraFields: MagicBoardFieldSpec[];
    intruderBursts: Array<{ count: number; reason: string }>;
    catastrophes: RareBoardCatastropheKind[];
    tempPins: MagicBoardPinSpec[];
    gravityRestore?: { y: number; delayMs: number };
    wiggleAllPins: boolean;
    confettiMode?: "miracle";
};

export function buildMagicBoardPlan(def: MagicCircleDef, geometry: Geometry): MagicBoardPlan {
    const color = def.color || "#fde68a";
    const top = clamp(74 * geometry.scale, 44, 116);
    const bottom = geometry.groundTop - geometry.dividerHeight - clamp(44 * geometry.scale, 26, 74);
    const midX = geometry.width / 2;
    const midY = (top + bottom) / 2;
    const spanX = Math.max(geometry.binWidth * 2.4, geometry.width * 0.36);
    const spanY = Math.max(geometry.binWidth * 2.1, (bottom - top) * 0.34);
    const pins: MagicBoardPinSpec[] = [];
    const fields: MagicBoardFieldSpec[] = [];

    const pin = (x: number, y: number, label: string, radiusScale = 1.2) => {
        pins.push({ x, y, label, color, radiusScale });
    };
    const pinLine = (points: Array<{ x: number; y: number }>, label: string, radiusScale = 1.2) => {
        for (const point of points) pin(point.x, point.y, label, radiusScale);
    };
    const field = (kind: MagicPhysicsField["kind"], x: number, y: number, radius: number, strength: number, durationMs: number, label: string) => {
        fields.push({ kind, x, y, radius, strength, durationMs, label });
    };

    switch (def.effect) {
        case "star":
            pin(midX, midY, "星核ピン", 2.8);
            field("repel", midX, midY, Math.max(180 * geometry.scale, spanX * 0.82), 0.00015, 9000, "星核だけの盤面");
            break;
        case "sun":
            pin(midX, midY, "太陽核ピン", 2.2);
            for (let i = 0; i < 12; i++) {
                const a = i * Math.PI * 2 / 12;
                pin(midX + Math.cos(a) * spanX * 0.42, midY + Math.sin(a) * spanY * 0.42, "太陽環ピン", 1.15);
            }
            field("repel", midX, midY, spanX * 0.9, 0.00013, 9000, "太陽放射");
            break;
        case "moon":
            for (let i = 0; i < 12; i++) {
                const a = -Math.PI * 0.72 + i * Math.PI * 1.44 / 11;
                pin(midX + Math.cos(a) * spanX * 0.38, midY + Math.sin(a) * spanY * 0.72, "月弧ピン", 1.35);
            }
            field("blackhole", midX, midY, spanX, 0.00008, 9000, "月重力");
            break;
        case "thunder":
            pinLine(Array.from({ length: 9 }, (_v, i) => ({ x: midX + (i % 2 === 0 ? -1 : 1) * spanX * 0.28, y: top + (bottom - top) * (i / 8) })), "稲妻ピン", 1.35);
            field("wave", midX, midY, spanX, 0.00016, 9000, "雷路");
            break;
        case "wave":
            pinLine(Array.from({ length: 16 }, (_v, i) => {
                const x = geometry.wallWidth + geometry.binWidth + (geometry.width - geometry.wallWidth * 2 - geometry.binWidth * 2) * (i / 15);
                return { x, y: midY + Math.sin(i * 0.95) * spanY * 0.34 };
            }), "波頭ピン", 1.15);
            field("vortex", midX, midY, spanX * 1.2, 0.00012, 9000, "潮流レーン");
            break;
        case "earth":
            for (let row = 0; row < 3; row++) {
                for (let i = 0; i < 7 - row; i++) pin(midX + (i - (6 - row) / 2) * geometry.binWidth * 0.86, bottom - row * geometry.binWidth * 0.72, "地層ピン", 1.55);
            }
            field("repel", midX, bottom, spanX, 0.00010, 9000, "地層隆起");
            break;
        case "wind":
            pinLine(Array.from({ length: 18 }, (_v, i) => {
                const a = i * 0.78;
                const r = geometry.binWidth * (0.36 + i * 0.105);
                return { x: midX + Math.cos(a) * r, y: midY + Math.sin(a) * r * 0.72 };
            }), "旋風ピン", 1.05);
            field("vortex", midX, midY, spanX * 1.1, 0.00015, 10000, "旋風迷路");
            break;
        case "gate":
            for (let i = 0; i < 9; i++) {
                const y = top + (bottom - top) * (i / 8);
                pin(midX - spanX * 0.36, y, "門柱ピン", 1.25);
                pin(midX + spanX * 0.36, y, "門柱ピン", 1.25);
            }
            field("vortex", midX, midY, spanX * 0.72, 0.00013, 9000, "門の通路");
            break;
        case "mirror":
            for (let i = 0; i < 8; i++) {
                const y = top + (bottom - top) * (i / 7);
                const offset = Math.sin(i * 1.12) * geometry.binWidth * 0.7;
                pin(midX - geometry.binWidth * 1.1 - offset, y, "鏡像ピン", 1.25);
                pin(midX + geometry.binWidth * 1.1 + offset, y, "鏡像ピン", 1.25);
            }
            field("wave", midX, midY, spanX, 0.00011, 9000, "左右反射");
            break;
        case "dragon":
            for (let i = 0; i < 20; i++) {
                const p = i / 19;
                const x = geometry.wallWidth + geometry.binWidth + (geometry.width - geometry.wallWidth * 2 - geometry.binWidth * 2) * p;
                const y = top + (bottom - top) * p + Math.sin(p * Math.PI * 4) * geometry.binWidth * 0.9;
                pin(x, y, "龍脈ピン", i % 5 === 0 ? 1.75 : 1.12);
            }
            field("vortex", midX, midY, spanX * 1.35, 0.00016, 11000, "龍脈蛇行");
            break;
        case "void":
            pin(midX, midY, "虚無核ピン", 2.45);
            field("blackhole", midX, midY, spanX * 1.25, 0.00016, 11000, "虚無吸引");
            break;
        case "flower":
            pin(midX, midY, "花芯ピン", 1.55);
            for (let petal = 0; petal < 6; petal++) {
                const a = petal * Math.PI * 2 / 6;
                for (let i = 1; i <= 3; i++) pin(midX + Math.cos(a) * geometry.binWidth * 0.62 * i, midY + Math.sin(a) * geometry.binWidth * 0.44 * i, "花弁ピン", 1.05);
            }
            field("repel", midX, midY, spanX * 0.85, 0.00010, 9000, "開花盤面");
            break;
        case "gear":
            for (let i = 0; i < 16; i++) {
                const a = i * Math.PI * 2 / 16;
                const r = i % 2 === 0 ? spanX * 0.44 : spanX * 0.30;
                pin(midX + Math.cos(a) * r, midY + Math.sin(a) * r * 0.72, "歯車ピン", i % 2 === 0 ? 1.35 : 1.05);
            }
            field("vortex", midX, midY, spanX, 0.00014, 10000, "歯車回転");
            break;
        case "meteor":
            for (let i = 0; i < 14; i++) pin(midX - spanX * 0.48 + i * geometry.binWidth * 0.46, top + i * geometry.binWidth * 0.42, "隕石軌道ピン", 1.22);
            field("repel", midX, top + spanY * 0.25, spanX, 0.00013, 9000, "隕石斜面");
            break;
        case "clock":
            pin(midX, midY, "時計軸ピン", 1.65);
            pinLine([
                { x: midX, y: midY - spanY * 0.55 },
                { x: midX, y: midY - spanY * 0.28 },
                { x: midX, y: midY + spanY * 0.18 },
                { x: midX + spanX * 0.18, y: midY + spanY * 0.28 },
                { x: midX + spanX * 0.36, y: midY + spanY * 0.38 },
            ], "時計針ピン", 1.18);
            field("blackhole", midX, midY, spanX * 0.92, 0.00010, 10000, "時間の針");
            break;
        case "crown":
            pinLine([
                { x: midX - spanX * 0.48, y: bottom },
                { x: midX - spanX * 0.36, y: midY },
                { x: midX - spanX * 0.18, y: bottom - spanY * 0.22 },
                { x: midX, y: top + spanY * 0.12 },
                { x: midX + spanX * 0.18, y: bottom - spanY * 0.22 },
                { x: midX + spanX * 0.36, y: midY },
                { x: midX + spanX * 0.48, y: bottom },
            ], "王冠ピン", 1.55);
            field("repel", midX, midY, spanX, 0.00012, 10000, "王冠導線");
            break;
    }

    return {
        pins,
        fields,
        restoreGravity: def.effect === "moon" ? { y: 8, delayMs: 9000 } : undefined,
        floatingText: { text: `盤面変化: ${def.label}`, x: midX, y: top + 18 * geometry.scale, color },
    };
}

export function buildMagicCircleActivationPlan(def: MagicCircleDef, center: { x: number; y: number }, geometry: Geometry): MagicCircleActivationPlan {
    const fieldRadius = clamp(230 * geometry.scale, 150, 420);
    const baseFieldKind: MagicPhysicsField["kind"] = ["wind", "wave", "gate", "dragon"].includes(def.effect)
        ? "vortex"
        : ["void", "moon", "clock"].includes(def.effect)
            ? "blackhole"
            : ["sun", "crown", "flower", "earth"].includes(def.effect)
                ? "repel"
                : "wave";
    const baseField: MagicBoardFieldSpec = {
        kind: baseFieldKind,
        x: center.x,
        y: center.y,
        radius: ["void", "moon", "clock"].includes(def.effect) ? fieldRadius * 1.1 : fieldRadius,
        strength: baseFieldKind === "vortex" ? 0.00009 : baseFieldKind === "blackhole" || baseFieldKind === "repel" ? 0.000075 : 0.00007,
        durationMs: baseFieldKind === "vortex" ? 5600 : baseFieldKind === "blackhole" ? 5200 : baseFieldKind === "repel" ? 4400 : 4800,
        label: def.label,
    };
    const plan: MagicCircleActivationPlan = {
        field: baseField,
        extraFields: [],
        intruderBursts: [{ count: Math.max(4, Math.min(10, Math.round(6 * geometry.scale))), reason: def.label }],
        catastrophes: [],
        tempPins: [],
        wiggleAllPins: false,
    };
    const tempPin = (x: number, y: number, label: string, radiusScale = 1.45, lifetimeMs = 12000) => {
        plan.tempPins.push({ x, y, label, color: def.color || "#fde68a", radiusScale, lifetimeMs });
    };

    switch (def.effect) {
        case "sun":
            plan.intruderBursts.push({ count: 8, reason: def.label });
            break;
        case "moon":
            plan.gravityRestore = { y: 8, delayMs: 3600 };
            break;
        case "star":
            plan.intruderBursts.push({ count: 18, reason: def.label });
            break;
        case "thunder":
            plan.catastrophes.push("lightning");
            break;
        case "wave":
            plan.catastrophes.push("tsunami");
            break;
        case "earth":
            plan.catastrophes.push("earthquake");
            break;
        case "wind":
            plan.catastrophes.push("typhoon");
            break;
        case "gate":
            plan.intruderBursts.push({ count: 24, reason: def.label });
            break;
        case "mirror":
            plan.catastrophes.push("mirror");
            break;
        case "dragon":
            plan.catastrophes.push("dragon");
            plan.extraFields.push({ kind: "vortex", x: center.x, y: center.y, radius: fieldRadius * 1.45, strength: 0.00013, durationMs: 7600, label: "龍脈暴走" });
            plan.intruderBursts.push({ count: 32, reason: "龍脈暴走" });
            break;
        case "void":
            plan.catastrophes.push("void");
            break;
        case "flower":
            for (let i = 0; i < 6; i++) tempPin(center.x + Math.cos(i * Math.PI / 3) * 58 * geometry.scale, center.y + Math.sin(i * Math.PI / 3) * 58 * geometry.scale, "花冠ピン");
            break;
        case "gear":
            plan.wiggleAllPins = true;
            break;
        case "meteor":
            plan.catastrophes.push("meteor");
            plan.intruderBursts.push({ count: 10, reason: def.label });
            break;
        case "clock":
            plan.catastrophes.push("timebreak");
            break;
        case "crown":
            tempPin(center.x, center.y, "王冠観測ピン", 1.45, 20000);
            plan.confettiMode = "miracle";
            break;
    }

    return plan;
}

export function createActiveMagicPhysicsField(params: {
    kind: MagicPhysicsField["kind"];
    x: number;
    y: number;
    radius: number;
    strength: number;
    durationMs: number;
    label: string;
    now: number;
    random: () => number;
}): MagicPhysicsField {
    return {
        x: params.x,
        y: params.y,
        radius: params.radius,
        strength: params.strength * 7.5,
        kind: params.kind,
        until: params.now + params.durationMs,
        spin: params.random() > 0.5 ? 1 : -1,
        label: params.label,
    };
}

export function updateActiveMagicPhysicsFields(fields: MagicPhysicsField[], bodies: Matter.Body[], now: number): void {
    if (fields.length === 0) return;
    for (let i = fields.length - 1; i >= 0; i--) {
        const field = fields[i];
        if (!field || now > field.until) {
            fields.splice(i, 1);
            continue;
        }
        const ageRatio = clamp((field.until - now) / 5000, 0.15, 1);
        for (const body of bodies) {
            const plugin = (body as any).plugin;
            if (!plugin?.isDrop) continue;
            const dx = field.x - body.position.x;
            const dy = field.y - body.position.y;
            const distSq = dx * dx + dy * dy;
            const maxDist = field.radius;
            if (distSq > maxDist * maxDist || distSq < 1) continue;
            const dist = Math.sqrt(distSq);
            const power = (1 - dist / maxDist) * field.strength * ageRatio;
            let fx = 0;
            let fy = 0;
            if (field.kind === "vortex") {
                fx = (-dy / dist) * power * field.spin;
                fy = (dx / dist) * power * field.spin;
            } else if (field.kind === "repel") {
                fx = (-dx / dist) * power;
                fy = (-dy / dist) * power;
            } else if (field.kind === "blackhole") {
                fx = (dx / dist) * power * 1.25;
                fy = (dy / dist) * power * 1.25;
            } else {
                fx = Math.sin(now / 140 + body.id) * power * 0.9;
                fy = Math.cos(now / 170 + body.id) * power * 0.45;
            }
            Body.applyForce(body, body.position, { x: fx, y: fy });
        }
    }
}
