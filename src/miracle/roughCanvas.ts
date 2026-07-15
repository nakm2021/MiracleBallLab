import type { RoughCanvas } from "roughjs/bin/canvas";

let instance: RoughCanvas | null = null;
let loading: Promise<RoughCanvas | null> | null = null;

/** Loads the decorative sketch renderer without blocking the first frame. */
export function prepareRoughCanvas(canvas: HTMLCanvasElement): Promise<RoughCanvas | null> {
    if (instance) return Promise.resolve(instance);
    loading ??= import("roughjs/bundled/rough.esm")
        .then(({ default: rough }) => {
            instance = rough.canvas(canvas);
            return instance;
        })
        .catch(() => null);
    return loading;
}

export function getPreparedRoughCanvas(): RoughCanvas | null {
    return instance;
}
