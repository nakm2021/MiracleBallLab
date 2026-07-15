export type LibraryBurstMode = "magic" | "gacha" | "title" | "tempura";
export type CanvasBurstMode = "normal" | "miracle" | "black" | "cosmic";

let jsConfettiInstance: import("js-confetti").default | null = null;

/** Optional celebration libraries live in their own chunk and load on first use. */
export async function fireLibraryBurst(
    canvas: HTMLCanvasElement,
    mode: LibraryBurstMode,
    source: { x: number; y: number },
): Promise<void> {
    const [partyModule, jsConfettiModule] = await Promise.all([import("party-js"), import("js-confetti")]);
    const party = partyModule.default;
    party.confetti(source as Parameters<typeof party.confetti>[0], {
        count: mode === "gacha" ? party.variation.range(80, 150) : party.variation.range(35, 80),
        size: party.variation.range(0.8, mode === "tempura" ? 2 : 1.45),
        spread: party.variation.range(40, 85),
    });

    jsConfettiInstance ??= new jsConfettiModule.default({ canvas });
    const emojis =
        mode === "tempura"
            ? ["🍤", "✨", "🍚"]
            : mode === "gacha"
              ? ["💎", "👑", "✨", "🌈"]
              : mode === "title"
                ? ["🏅", "✨", "🎉"]
                : ["🔯", "✨", "⚡", "🌙"];
    await jsConfettiInstance.addConfetti({
        emojis,
        emojiSize: mode === "gacha" ? 44 : 34,
        confettiNumber: mode === "gacha" ? 55 : 30,
    });
}

export async function fireCanvasBurst(mode: CanvasBurstMode, intensity: number): Promise<void> {
    const { default: confetti } = await import("canvas-confetti");
    const colors =
        mode === "cosmic"
            ? ["#240038", "#7c3cff", "#ffffff", "#00e5ff", "#ffd700"]
            : mode === "black"
              ? ["#000000", "#ff0044", "#ffffff"]
              : mode === "miracle"
                ? ["#ffd700", "#ff69b4", "#78e7ff", "#ffffff"]
                : undefined;
    const mainCount = Math.round((mode === "cosmic" ? 420 : mode === "normal" ? 90 : 220) * intensity);
    const sideCount = Math.round((mode === "cosmic" ? 220 : mode === "normal" ? 50 : 120) * intensity);
    confetti({ particleCount: mainCount, spread: mode === "normal" ? 70 : 140, origin: { y: 0.55 }, colors });
    confetti({ particleCount: sideCount, angle: 60, spread: 80, origin: { x: 0, y: 0.65 }, colors });
    confetti({ particleCount: sideCount, angle: 120, spread: 80, origin: { x: 1, y: 0.65 }, colors });
}
