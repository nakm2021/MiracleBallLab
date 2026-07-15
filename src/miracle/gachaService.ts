import type { SpecialEventDef, ThemeMode } from "./types";

export function pickMiracleGachaDef(params: {
    specialDefs: SpecialEventDef[];
    fallbackDefs: SpecialEventDef[];
    getRankScore: (rank: string) => number;
    random: () => number;
}): SpecialEventDef {
    const pool = params.specialDefs.length > 0 ? params.specialDefs : params.fallbackDefs;
    const weighted: SpecialEventDef[] = [];
    for (const def of pool) {
        const score = params.getRankScore(def.rank);
        const weight =
            score >= params.getRankScore("GOD")
                ? 1
                : score >= params.getRankScore("EX")
                  ? 1
                  : score >= params.getRankScore("SSR")
                    ? 4
                    : score >= params.getRankScore("SR")
                      ? 28
                      : 220;
        for (let i = 0; i < weight; i++) weighted.push(def);
    }
    return weighted[Math.floor(params.random() * weighted.length)] ?? pool[0];
}

export function pickGachaRewardTheme(params: {
    def: SpecialEventDef;
    index: number;
    now: number;
    themes: ThemeMode[];
    getRankScore: (rank: string) => number;
    hashTextToNumber: (text: string) => number;
}): ThemeMode | undefined {
    if (params.getRankScore(params.def.rank) < params.getRankScore("SR")) return undefined;
    if (params.themes.length === 0) return undefined;
    const seed = params.hashTextToNumber(`${params.def.kind}-${params.now}-${params.index}`);
    return params.themes[Math.abs(seed) % params.themes.length] ?? "lab";
}
