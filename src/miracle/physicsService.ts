import Matter from "matter-js";
import type { DropKind, Geometry, PachinkoYakumonoDef, RarePinDef } from "./types";
import { clamp } from "./utils";

const Bodies = Matter.Bodies;
const Body = Matter.Body;

export function createDropPlugin(kind: DropKind, x: number, y: number, radius: number, extras: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        isDrop: true,
        kind,
        stuckFrames: 0,
        lastX: x,
        lastY: y,
        lifeFrames: 0,
        bornAt: performance.now(),
        hardExpireMs: kind === "giant" ? 9000 : kind === "shape" ? 16000 : 15000,
        originalRadius: radius,
        passedYakumonoIds: {},
        ...extras,
    };
}

export function createRandomShapeBody(params: {
    x: number;
    y: number;
    radius: number;
    renderOptions: any;
    random: () => number;
}): Matter.Body {
    const { x, y, radius, renderOptions, random } = params;
    const commonOptions: any = { restitution: 0.92, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0011, render: renderOptions };
    const choice = Math.floor(random() * 9);
    let body: Matter.Body;
    let shapeName = "";
    if (choice === 0) { shapeName = "角丸四角形"; body = Bodies.rectangle(x, y, radius * 1.7, radius * 1.7, { ...commonOptions, chamfer: { radius: radius * 0.25 } }); }
    else if (choice === 1) { shapeName = "角丸長方形"; body = Bodies.rectangle(x, y, radius * 2.4, radius * 1.1, { ...commonOptions, chamfer: { radius: radius * 0.22 } }); }
    else if (choice === 2) { shapeName = "三角形"; body = Bodies.polygon(x, y, 3, radius * 1.35, commonOptions); }
    else if (choice === 3) { shapeName = "五角形"; body = Bodies.polygon(x, y, 5, radius * 1.35, commonOptions); }
    else if (choice === 4) { shapeName = "六角形"; body = Bodies.polygon(x, y, 6, radius * 1.35, commonOptions); }
    else if (choice === 5) { shapeName = "八角形"; body = Bodies.polygon(x, y, 8, radius * 1.35, commonOptions); }
    else if (choice === 6) { shapeName = "台形"; body = Bodies.trapezoid(x, y, radius * 2.2, radius * 1.5, 0.35, commonOptions); }
    else if (choice === 7) { shapeName = "短い棒"; body = Bodies.rectangle(x, y, radius * 2.5, radius * 0.9, { ...commonOptions, chamfer: { radius: radius * 0.2 } }); }
    else { shapeName = "多角形"; body = Bodies.polygon(x, y, 7, radius * 1.45, commonOptions); }

    (body as any).plugin = createDropPlugin("shape", x, y, radius, { shapeName });
    return body;
}

export function createHeartBody(x: number, y: number, radius: number, renderOptions: any): Matter.Body {
    const options: any = { restitution: 0.96, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0012, render: renderOptions };
    const left = Bodies.circle(x - radius * 0.48, y - radius * 0.25, radius * 0.62, options);
    const right = Bodies.circle(x + radius * 0.48, y - radius * 0.25, radius * 0.62, options);
    const bottom = Bodies.polygon(x, y + radius * 0.25, 3, radius * 1.25, options);
    Body.rotate(bottom, Math.PI);
    const heart = Body.create({ parts: [left, right, bottom], restitution: 0.96, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0012, render: renderOptions });
    (heart as any).plugin = createDropPlugin("heart", x, y, radius, { symbol: "♥", shapeName: "桃色ハート" });
    return heart;
}

export function createSymbolBody(params: {
    x: number;
    y: number;
    radius: number;
    kind: DropKind;
    fillStyle: string;
    symbol: string;
    label: string;
    geometry: Geometry;
}): Matter.Body {
    const { x, y, radius, kind, fillStyle, symbol, label, geometry } = params;
    const body = Bodies.circle(x, y, radius, { restitution: 0.98, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0013, render: { fillStyle, strokeStyle: "#ffffff", lineWidth: 4 * geometry.scale } as any });
    (body as any).plugin = createDropPlugin(kind, x, y, radius, { symbol, shapeName: label });
    return body;
}

export function createTinyFragment(params: {
    x: number;
    y: number;
    baseRadius: number;
    color: string;
    geometry: Geometry;
    random: () => number;
}): Matter.Body {
    const { x, y, baseRadius, color, geometry, random } = params;
    const radius = Math.max(2, baseRadius / 10);
    const sides = 3 + Math.floor(random() * 5);
    const body = Bodies.polygon(x, y, sides, radius, { restitution: 0.9, friction: 0.001, frictionStatic: 0, frictionAir: 0.01, density: 0.0008, render: { fillStyle: color, strokeStyle: "rgba(255,255,255,0.95)", lineWidth: 1 } as any });
    (body as any).plugin = { isDecoration: true, kind: "fragment" };
    Body.setVelocity(body, { x: (random() - 0.5) * 14 * geometry.scale, y: -8 * geometry.scale - random() * 8 * geometry.scale });
    Body.setAngularVelocity(body, (random() - 0.5) * 0.7);
    return body;
}

export function createWallsAndFloor(geometry: Geometry): Matter.Body[] {
    const leftWall = Bodies.rectangle(geometry.wallWidth / 2, geometry.height / 2, geometry.wallWidth, geometry.height, { isStatic: true, render: { fillStyle: "rgba(36, 41, 54, 0.92)" } });
    const rightWall = Bodies.rectangle(geometry.width - geometry.wallWidth / 2, geometry.height / 2, geometry.wallWidth, geometry.height, { isStatic: true, render: { fillStyle: "rgba(36, 41, 54, 0.92)" } });
    const ground = Bodies.rectangle(geometry.width / 2, geometry.height - geometry.groundHeight / 2, geometry.width - geometry.wallWidth * 2, geometry.groundHeight, { isStatic: true, render: { fillStyle: "rgba(36, 41, 54, 0.92)" } });
    return [leftWall, rightWall, ground];
}

export function rollRarePin(params: {
    simpleMode: boolean;
    rarePinDefs: RarePinDef[];
    random: () => number;
}): RarePinDef | null {
    if (params.simpleMode) return null;
    for (const def of params.rarePinDefs) {
        if (params.random() < def.rate) return def;
    }
    return null;
}

export function getRarePinDef(kind: string | undefined, rarePinDefs: RarePinDef[]): RarePinDef | null {
    return rarePinDefs.find((x) => x.kind === kind) ?? null;
}

export function getPachinkoYakumonoDef(kind: string, defs: PachinkoYakumonoDef[]): PachinkoYakumonoDef {
    return defs.find((x) => x.kind === kind) ?? defs[0];
}

export function createPachinkoNailGate(params: {
    cx: number;
    cy: number;
    spread: number;
    angleOpen: number;
    length: number;
    geometry: Geometry;
}): Matter.Body[] {
    const { cx, cy, spread, angleOpen, length, geometry } = params;
    const fillStyle = "rgba(120,130,152,0.96)";
    const strokeStyle = "rgba(255,255,255,0.82)";
    const left = Bodies.rectangle(cx - spread / 2, cy, Math.max(5 * geometry.scale, 4), length, { isStatic: true, angle: -angleOpen, render: { fillStyle, strokeStyle, lineWidth: Math.max(1.2, 1.5 * geometry.scale) } as any });
    const right = Bodies.rectangle(cx + spread / 2, cy, Math.max(5 * geometry.scale, 4), length, { isStatic: true, angle: angleOpen, render: { fillStyle, strokeStyle, lineWidth: Math.max(1.2, 1.5 * geometry.scale) } as any });
    (left as any).plugin = { isPin: true, baseX: left.position.x, baseY: left.position.y, wiggleFrames: 0, nailDecor: true };
    (right as any).plugin = { isPin: true, baseX: right.position.x, baseY: right.position.y, wiggleFrames: 0, nailDecor: true };
    return [left, right];
}

export function createPins(params: {
    geometry: Geometry;
    pinRows: number;
    pattern: string;
    rollRarePin: () => RarePinDef | null;
    getPachinkoPinOffset: (pattern: string, row: number, col: number, rowCount: number, colCount: number, baseX: number, y: number) => { x: number; y: number };
    random: () => number;
}): Matter.Body[] {
    const { geometry, pinRows, pattern, rollRarePin, getPachinkoPinOffset, random } = params;
    const pins: Matter.Body[] = [];
    const pinStartY = clamp(70 * geometry.scale, 40, 120);
    const pinEndY = geometry.groundTop - geometry.dividerHeight - clamp(36 * geometry.scale, 20, 70);
    const spacingY = pinRows > 1 ? (pinEndY - pinStartY) / (pinRows - 1) : 60 * geometry.scale;

    for (let row = 0; row < pinRows; row++) {
        const y = pinStartY + row * spacingY;
        const baseEven = row % 2 === 0;
        const baseColCount = baseEven ? geometry.totalBinCount : Math.max(geometry.totalBinCount - 1, 1);
        for (let col = 0; col < baseColCount; col++) {
            const actualCol = baseEven ? col : col + 1;
            const baseX = baseEven
                ? geometry.binLeft + geometry.binWidth / 2 + actualCol * geometry.binWidth
                : geometry.binLeft + actualCol * geometry.binWidth;
            const pos = getPachinkoPinOffset(pattern, row, col, pinRows, baseColCount, baseX, y);
            const rarePin = rollRarePin();
            const pin = Bodies.circle(pos.x, pos.y, geometry.pinRadius, {
                isStatic: true,
                render: {
                    fillStyle: rarePin?.fillStyle ?? "rgba(196,154,58,.98)",
                    strokeStyle: rarePin?.strokeStyle ?? "rgba(255,246,190,.98)",
                    lineWidth: Math.max(1.4, (rarePin ? 3.2 : 2.4) * geometry.scale),
                } as any,
            });
            (pin as any).plugin = { isPin: true, baseX: pos.x, baseY: pos.y, wiggleFrames: 0, rarePinKind: rarePin?.kind, rarePinLabel: rarePin?.label };
            pins.push(pin);
        }
    }

    const nailGateCount = 4 + Math.floor(random() * 5);
    for (let i = 0; i < nailGateCount; i++) {
        const y = pinStartY + ((i + 1) / (nailGateCount + 1)) * (pinEndY - pinStartY);
        const sway = Math.sin(i * 1.7 + pattern.length * 0.31);
        const x = geometry.width / 2 + sway * geometry.binWidth * (1.1 + (i % 3) * 0.45);
        const spread = clamp(geometry.binWidth * (0.8 + (i % 3) * 0.2), 26 * geometry.scale, 74 * geometry.scale);
        const angle = (0.28 + ((i + pattern.length) % 4) * 0.08) * (i % 2 === 0 ? 1 : -1);
        const length = clamp(geometry.binWidth * (0.32 + (i % 2) * 0.10), 22 * geometry.scale, 46 * geometry.scale);
        pins.push(...createPachinkoNailGate({ cx: x, cy: y, spread, angleOpen: angle, length, geometry }));
    }
    return pins;
}

export function createDividers(geometry: Geometry): Matter.Body[] {
    const dividers: Matter.Body[] = [];
    for (let i = 1; i < geometry.totalBinCount; i++) {
        const x = geometry.binLeft + geometry.binWidth * i;
        dividers.push(Bodies.rectangle(x, geometry.dividerY, geometry.dividerWidth, geometry.dividerHeight, { isStatic: true, render: { fillStyle: "rgba(196, 101, 101, 0.94)" } }));
    }
    return dividers;
}

export function createPachinkoYakumonoSensors(params: {
    geometry: Geometry;
    defs: PachinkoYakumonoDef[];
}): Matter.Body[] {
    const { geometry, defs } = params;
    return defs.map((def) => {
        const width = clamp(geometry.width * def.widthRatio, 82 * geometry.scale, 260 * geometry.scale);
        const height = clamp(def.height * geometry.scale, 12, 32);
        const body = Bodies.rectangle(geometry.width * def.xRatio, geometry.height * def.yRatio, width, height, {
            isStatic: true,
            isSensor: true,
            render: {
                fillStyle: "rgba(255,255,255,0.01)",
                strokeStyle: "rgba(255,255,255,0.01)",
                lineWidth: 1,
            } as any,
        });
        (body as any).plugin = { isYakumono: true, yakumonoKind: def.kind, yakumonoLabel: def.label, oddsScale: def.oddsScale, score: def.score, color: def.color };
        return body;
    });
}
