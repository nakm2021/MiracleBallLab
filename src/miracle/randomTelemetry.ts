export interface RandomTelemetry {
    next(): number;
    reset(): void;
    getCallCount(): number;
    getBuckets(): readonly number[];
}

export function createRandomTelemetry(bucketCount: number, source: () => number = Math.random): RandomTelemetry {
    const size = Math.max(1, Math.floor(bucketCount));
    let buckets = Array.from({ length: size }, () => 0);
    let callCount = 0;
    return {
        next() {
            const value = source();
            const normalized = Number.isFinite(value) ? Math.min(1 - Number.EPSILON, Math.max(0, value)) : 0;
            buckets[Math.floor(normalized * size)]++;
            callCount++;
            return normalized;
        },
        reset() {
            buckets = Array.from({ length: size }, () => 0);
            callCount = 0;
        },
        getCallCount: () => callCount,
        getBuckets: () => buckets,
    };
}
