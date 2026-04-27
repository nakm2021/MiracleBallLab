export type DropKind = string;

export type ProbabilityMode = "normal" | "festival" | "hard" | "hell";

export type SpecialEventDef = {
    kind: DropKind;
    label: string;
    rank: string;
    rate: number;
    denominator: number;
    symbol: string;
    emoji: string;
    fillStyle: string;
    radiusScale: number;
    soundMode: "miracle" | "black" | "cosmic";
};

export type MiracleLogEntry = {
    label: string;
    rank: string;
    denominator: number;
    finishedAt: number;
    finishedCount: number;
    mode: ProbabilityMode;
    speedLabel: string;
    combo: number;
    note?: string;
};

export type FusionDef = {
    id: string;
    label: string;
    rank: string;
    sourceKinds: DropKind[];
    requiredCount: number;
    description: string;
    rewardScore: number;
};

export type DailyFortune = {
    dateKey: string;
    title: string;
    rateBoost: number;
    luckyKind: string;
    luckyBin: number;
    advice: string;
    seed: number;
};

export type MiracleClip = {
    id: string;
    label: string;
    rank: string;
    denominator: number;
    finishedCount: number;
    createdAt: number;
    subtitle: string;
    frames: string[];
};

export type RemoteMiracleAssetSource = {
    url: string;
    mimeType?: string;
};

export type RemoteMiracleAsset = {
    id: string;
    kind: "video" | "audio";
    rank?: string;
    url?: string;
    mimeType?: string;
    sources?: RemoteMiracleAssetSource[];
    seconds?: number;
    opacity?: number;
    weight?: number;
    volume?: number;
    tags?: string[];
};

export type RemoteMiracleManifest = {
    version: number;
    updatedAt?: string;
    assets: RemoteMiracleAsset[];
};

export type ThemeMode = "lab" | "midnight" | "retro" | "gold" | "ocean" | "space" | "sakura" | "snow" | "volcano" | "forest" | "cyber" | "candy" | "poison" | "temple" | "sunset" | "neon" | "monochrome" | "wafuu" | "glacier" | "thunder";
export type ThemeAutoMode = "fixed" | "time" | "random";
export type EffectMode = "quiet" | "normal" | "flashy" | "recording";
export type WorldMode = "poseidon" | "zeusu" | "hadesu" | "heart" | "nekochan" | null;
export type TimeBallTheme = "morning" | "day" | "evening" | "night" | "midnight";
export type TimeBallSkin = "normal" | "gloss" | "drop" | "spark" | "star" | "moon" | "darkShard" | "swordShard" | "coin" | "heart" | "crown";


export type DailyMissionMetric = "run" | "finished" | "score" | "special" | "discard" | "center";

export type DailyMissionDef = {
    id: string;
    title: string;
    description: string;
    metric: DailyMissionMetric;
    target: number;
    rewardScore: number;
    themeHint: ThemeMode;
};

export type ResearchRankInfo = {
    label: string;
    level: number;
    score: number;
    nextScore: number;
    progressPercent: number;
};

export type ThemeCollectionEntry = {
    value: ThemeMode;
    ja: string;
    en: string;
    unlocked: boolean;
    reason: string;
};

export type ResearchReportEntry = {
    id: string;
    createdAt: number;
    runNo: number;
    targetCount: number;
    finishedCount: number;
    discardedCount: number;
    topLabel: string;
    topCount: number;
    grade: string;
    type: string;
    score: number;
    bestMiracleLabel: string;
    bestMiracleRank: string;
    memo: string;
};

export type SavedRecords = {
    totalRuns: number;
    maxFinishedCount: number;
    maxTargetCount: number;
    bestRank: string;
    bestLabel: string;
    discovered: Record<string, number>;
    discoveredFirstAt: Record<string, number>;
    bestScore: number;
    totalScore: number;
    missionCompleted: Record<string, number>;
    miracleLogs: MiracleLogEntry[];
    fusions: Record<string, number>;
    secretUnlocked: Record<string, number>;
    dailyMissionCompleted: Record<string, number>;
    unlockedThemes: Record<string, number>;
    researchReports?: ResearchReportEntry[];
};

export type MissionDef = {
    id: string;
    title: string;
    description: string;
    rewardScore: number;
    oncePerRun: boolean;
    evaluate: () => boolean;
};

export type SkillKind = "shockwave" | "magnet" | "timeStop";

export type SecretDef = {
    id: string;
    label: string;
    hint: string;
    detail: string;
    rewardScore: number;
};

export type SkillState = {
    shockwave: number;
    magnet: number;
    timeStop: number;
};

export type Settings = {
    targetCount: number;
    activeLimit: number;
    binCount: number;
    pinRows: number;
    labelText: string;
    backgroundImage: string;
    simpleMode: boolean;
    cameraShakeEnabled: boolean;
    slowMiracleEffects: boolean;
    effectsEnabled: boolean;
    commentaryEnabled: boolean;
    boardAnomalyEnabled: boolean;
    normalBallTraitsEnabled: boolean;
    timeBallSkinsEnabled: boolean;
    mobileCompactMode: boolean;
    lowSpecMode: boolean;
    showRecentMiracles: boolean;
    blackModeEnabled: boolean;
    effectMode: EffectMode;
    probabilityMode: ProbabilityMode;
    themeAutoMode: ThemeAutoMode;
};

export type UserPlayStyle = "standard" | "viewer" | "collector" | "recording";

export type UserProfile = {
    nickname: string;
    playStyle: UserPlayStyle;
    favoriteMiracle: string;
    createdAt: number;
    lastOpenedAt: number;
    openCount: number;
    lastPlayedDateKey: string;
    consecutiveDays: number;
    totalSafeStops: number;
};

export type UserPreferences = Partial<Settings> & {
    version: number;
    speedLabelText?: string;
    theme?: ThemeMode;
    themeAutoMode?: ThemeAutoMode;
    soundEnabled?: boolean;
    confettiEnabled?: boolean;
    language?: "ja" | "en";
};

export type Geometry = {
    width: number;
    height: number;
    infoHeight: number;
    scale: number;
    pixelRatio: number;
    wallWidth: number;
    groundHeight: number;
    groundTop: number;
    totalBinCount: number;
    binLeft: number;
    binRight: number;
    binWidth: number;
    visibleStart: number;
    ballRadius: number;
    pinRadius: number;
    dividerWidth: number;
    dividerHeight: number;
    dividerY: number;
    ballCountY: number;
    labelY: number;
    countY: number;
    percentY: number;
    barY: number;
    labelFont: number;
    countFont: number;
    percentFont: number;
    infoFont: number;
    binCenters: number[];
};

export type FloatingText = {
    text: string;
    x: number;
    y: number;
    life: number;
    maxLife: number;
    color: string;
};

export type NormalBallTraitKind = "standard" | "heavy" | "bouncy" | "tiny" | "sleepy" | "sprinter" | "spinner" | "ghost";

export type NormalBallTraitDef = {
    kind: NormalBallTraitKind;
    label: string;
    mark: string;
    description: string;
    rate: number;
    radiusScale: number;
    restitution: number;
    density: number;
    frictionAir: number;
    strokeStyle: string;
};

export type MiracleChainDef = {
    id: string;
    label: string;
    rank: string;
    sequence: DropKind[];
    description: string;
    rewardScore: number;
};

export type BoardAnomalyMode = "none" | "sideGravity" | "stickyTime" | "dimPins" | "tremor" | "updraft" | "blackHole" | "pinPulse" | "reverseRain";

export type RarePinKind = "red" | "blue" | "black" | "rainbow";

export type RarePinDef = {
    kind: RarePinKind;
    label: string;
    description: string;
    fillStyle: string;
    strokeStyle: string;
    rate: number;
};

export type PachinkoYakumonoKind = "start" | "center" | "premium";

export type PachinkoYakumonoDef = {
    kind: PachinkoYakumonoKind;
    label: string;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    height: number;
    oddsScale: number;
    score: number;
    color: string;
};

export type TutorialMissionDef = {
    id: string;
    label: string;
    description: string;
    evaluate: () => boolean;
};

export type TapRipple = {
    x: number;
    y: number;
    life: number;
    maxLife: number;
};

