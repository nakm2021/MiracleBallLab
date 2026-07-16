import { describe, expect, it } from "vitest";
import { createRandomTelemetry } from "./randomTelemetry";

describe("randomTelemetry", () => {
    it("tracks calls in deterministic buckets", () => {
        const values = [0, 0.49, 0.5, 0.999];
        const telemetry = createRandomTelemetry(2, () => values.shift() ?? 0);
        Array.from({ length: 4 }, () => telemetry.next());
        expect(telemetry.getCallCount()).toBe(4);
        expect(telemetry.getBuckets()).toEqual([2, 2]);
    });

    it("normalizes invalid source values and resets statistics", () => {
        const telemetry = createRandomTelemetry(4, () => Number.NaN);
        expect(telemetry.next()).toBe(0);
        telemetry.reset();
        expect(telemetry.getCallCount()).toBe(0);
        expect(telemetry.getBuckets()).toEqual([0, 0, 0, 0]);
    });
});
