import type { RareSoundFlavor } from "./constants";

export type RareNoteSequenceItem = { note: string; duration: string; at: number };

export function createRareSequence(flavor: RareSoundFlavor): RareNoteSequenceItem[] {
    const roll = Math.random();
    if (flavor === "god") {
        const patterns = [
            [
                { note: "C4", duration: "8n", at: 0 },
                { note: "G4", duration: "8n", at: 0.1 },
                { note: "C5", duration: "8n", at: 0.22 },
                { note: "E5", duration: "4n", at: 0.36 },
                { note: "G5", duration: "2n", at: 0.6 },
            ],
            [
                { note: "A3", duration: "8n", at: 0 },
                { note: "E4", duration: "8n", at: 0.1 },
                { note: "A4", duration: "8n", at: 0.22 },
                { note: "C5", duration: "8n", at: 0.34 },
                { note: "E5", duration: "2n", at: 0.52 },
            ],
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }
    if (flavor === "ex") {
        if (roll < 0.5)
            return [
                { note: "D4", duration: "16n", at: 0 },
                { note: "A4", duration: "16n", at: 0.08 },
                { note: "D5", duration: "8n", at: 0.16 },
                { note: "F5", duration: "8n", at: 0.28 },
            ];
        return [
            { note: "G3", duration: "16n", at: 0 },
            { note: "B3", duration: "16n", at: 0.08 },
            { note: "D4", duration: "8n", at: 0.16 },
            { note: "G4", duration: "4n", at: 0.28 },
        ];
    }
    if (flavor === "ur") {
        if (roll < 0.34)
            return [
                { note: "C5", duration: "16n", at: 0 },
                { note: "E5", duration: "16n", at: 0.07 },
                { note: "G5", duration: "8n", at: 0.14 },
            ];
        if (roll < 0.67)
            return [
                { note: "F4", duration: "16n", at: 0 },
                { note: "A4", duration: "16n", at: 0.07 },
                { note: "C5", duration: "8n", at: 0.14 },
            ];
        return [
            { note: "G4", duration: "16n", at: 0 },
            { note: "B4", duration: "16n", at: 0.07 },
            { note: "D5", duration: "8n", at: 0.14 },
        ];
    }
    return [{ note: "G5", duration: "8n", at: 0 }];
}
