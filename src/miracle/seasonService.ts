import type { EventSeasonDef } from "./researchFeatures";

export function getCurrentEventSeason(seasons: readonly EventSeasonDef[], date = new Date()): EventSeasonDef {
    if (seasons.length === 0) throw new Error("At least one event season is required");
    const day = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
    const index = Math.abs(Math.floor(day / 7)) % seasons.length;
    return seasons[index] ?? seasons[0]!;
}
