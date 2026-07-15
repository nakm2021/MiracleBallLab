import type { Application, Graphics } from "pixi.js";

export interface PixiBackground {
    readonly canvas: HTMLCanvasElement;
    setVisible(visible: boolean): void;
    destroy(): void;
}

/**
 * Loads Pixi only when the optional animated background is enabled.
 * Keeping this behind an async boundary prevents the renderer from inflating
 * the application's initial JavaScript payload.
 */
export async function createPixiBackground(container: HTMLElement): Promise<PixiBackground> {
    const { Application, Graphics } = await import("pixi.js");
    const app: Application = new Application();
    await app.init({ resizeTo: container, backgroundAlpha: 0, antialias: true });

    const canvas = app.canvas as HTMLCanvasElement;
    Object.assign(canvas.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
    });

    const particles: Graphics[] = [];
    for (let i = 0; i < 26; i++) {
        const particle = new Graphics();
        const hue = i % 2 === 0 ? 0xffe060 : 0x9dd6ff;
        particle.circle(0, 0, 5 + Math.random() * 9).fill({ color: hue, alpha: 0.2 + Math.random() * 0.22 });
        particle.x = Math.random() * container.clientWidth;
        particle.y = Math.random() * container.clientHeight;
        const motion = particle as Graphics & { vx: number; vy: number; drift: number };
        motion.vx = -0.2 + Math.random() * 0.4;
        motion.vy = 0.3 + Math.random();
        motion.drift = Math.random() * Math.PI * 2;
        app.stage.addChild(particle);
        particles.push(particle);
    }

    app.ticker.add(() => {
        for (const particle of particles) {
            const motion = particle as Graphics & { vx: number; vy: number; drift: number };
            motion.drift += 0.02;
            particle.x += motion.vx + Math.sin(motion.drift) * 0.3;
            particle.y += motion.vy;
            if (particle.y > container.clientHeight + 20) {
                particle.y = -20;
                particle.x = Math.random() * container.clientWidth;
            }
            if (particle.x < -20) particle.x = container.clientWidth + 20;
            if (particle.x > container.clientWidth + 20) particle.x = -20;
        }
    });

    return {
        canvas,
        setVisible: (visible) => {
            canvas.style.display = visible ? "block" : "none";
        },
        destroy: () => app.destroy(true, { children: true }),
    };
}
