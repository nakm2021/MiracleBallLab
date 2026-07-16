import type anime from "animejs";

export type AnimeApi = typeof anime;
export type TippyApi = typeof import("tippy.js").default;

let animePromise: Promise<AnimeApi> | null = null;
let tippyPromise: Promise<TippyApi> | null = null;

export function loadAnime(): Promise<AnimeApi> {
    animePromise ??= import("animejs").then((module) => ("default" in module ? module.default : module) as AnimeApi);
    return animePromise;
}

export function loadTippy(): Promise<TippyApi> {
    tippyPromise ??= import("tippy.js").then((module) => module.default);
    return tippyPromise;
}
