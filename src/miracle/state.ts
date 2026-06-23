import type { SkillState } from "./types";

export function createInitialSkillState(): SkillState {
    return { shockwave: 2, magnet: 2, timeStop: 1 };
}

export function createRandomBuckets(count: number): number[] {
    return Array.from({ length: count }, () => 0);
}
