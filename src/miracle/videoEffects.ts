export function shouldPlayRemoteMiracleVideo(nextRankScore: number, activeRankScore: number, isActive: boolean, force = false): boolean {
    if (force) return true;
    if (!isActive) return true;
    return nextRankScore >= activeRankScore;
}
