import Matter, { Events } from "matter-js";
import "tippy.js/dist/tippy.css";
import { Howl } from "howler";
import { createPixiBackground, type PixiBackground } from "./miracle/pixiBackground";
import { fireCanvasBurst, fireLibraryBurst } from "./miracle/celebrationEffects";
import { getPreparedRoughCanvas, prepareRoughCanvas } from "./miracle/roughCanvas";
import { loadAnime, loadTippy, type AnimeApi, type TippyApi } from "./miracle/lazyUiLibraries";
import { loadSettingsUiZoom, saveSettingsUiZoom, SETTINGS_UI_ZOOM_MAX, SETTINGS_UI_ZOOM_MIN } from "./miracle/settingsUiZoom";
import { createRandomTelemetry } from "./miracle/randomTelemetry";
import { completeMultiverseExpedition, createExpeditionSeed, getActiveUniverse, loadMultiverseState, saveMultiverseState, startMultiverseExpedition, type MultiverseResult } from "./miracle/multiverseExpedition";
import { getMultiverseExpeditionHtml, getMultiverseResultHtml } from "./miracle/multiversePresentation";
import { createAdminLogApi, type AdminLogApi, type AdminLogEntry } from "./miracle/adminLog";
import { ADMIN_UNLOCK_STORAGE_KEY, verifyAdminPasscode } from "./miracle/admin";
import { createDefaultSettings, getThemeOptions, getThemeUiPalette } from "./miracle/settings";
import { createInitialSkillState } from "./miracle/state";
import { getRankBaseScore, getRankScore } from "./miracle/rarity";
import { applyThemePaletteToPanel } from "./miracle/ui";
import { shouldPlayRemoteMiracleVideo } from "./miracle/videoEffects";
import { resolveOfflineMiracleSources, revokeOfflineObjectUrls } from "./miracle/offlineCache";
import { createOfflineLabController, type OfflineLabController, type OfflineVideoDownloadMode } from "./miracle/offlineLab";
import { FAMILIAR_DEFS, findFamiliarBySecretCode, gainFamiliarXp, getFamiliarDef, getFamiliarDropXp, getFamiliarLevelInfo, getFamiliarModeLabel, getFamiliarMood, loadFamiliarState, saveFamiliarState, unlockFamiliar } from "./miracle/familiar";
import { awardTicketsForRank, loadMiracleTicketState, saveMiracleTicketState, spendMiracleTickets, type MiracleTicketState } from "./miracle/miracleTicket";
import { FAMILIAR_EXPEDITION_PLANS, claimFamiliarExpedition, getFamiliarExpeditionProgress, loadFamiliarExpeditionState, startFamiliarExpedition, type FamiliarExpeditionState } from "./miracle/familiarExpedition";
import { SECRET_RESEARCH_NOTES, loadSecretResearchNoteState, markSecretResearchNotesRead, unlockSecretResearchNote, type SecretResearchNoteState } from "./miracle/secretResearchNote";
import { BASE_SPECIAL_EVENT_DEFS, FUSION_DEFS, MIRACLE_CHAIN_DEFS, NORMAL_BALL_TRAITS, PACHINKO_YAKUMONO_DEFS, RARE_PIN_DEFS, SPECIAL_EVENT_DEFS } from "./miracle/eventCatalog";
import { getBossResultHtml } from "./miracle/bossExperiment";
import { createBossExperimentController, type BossExperimentController } from "./miracle/bossExperimentController";
import { RARE_BOARD_CATASTROPHE_DEFS, type RareBoardCatastropheDef, type RareBoardCatastropheKind } from "./miracle/rareBoardCatastrophe";
import { EXPERIMENT_PRESETS, type ExperimentPresetDef } from "./miracle/researchFeatures";
import { buildDailyFortune, calculateMiracleRateScale, getPassiveMiracleBoost as getPassiveMiracleBoostBase, getProbabilityScale as getProbabilityScaleBase, rollSpecialEvent as rollSpecialEventBase } from "./miracle/probabilityService";
import { getGachaPointRewardForRank } from "./miracle/rewardService";
import { createResearchCommerceController, type ResearchCommerceController } from "./miracle/researchCommerceController";
import { createShareReplayController, type ShareReplayController } from "./miracle/shareReplayController";
import { buildResearchMemoHtml as buildResearchMemoHtmlBase, evaluateResearchRun, type ResearchEvaluation } from "./miracle/researchEvaluationService";
import { createResultActionController, type ResultActionController } from "./miracle/resultActionController";
import { getUiAccentPaletteByKind } from "./miracle/uiAccentService";
import { unlockLabWallFormulas } from "./miracle/labWallFormulaService";
import { APP_VERSION, BASE_HEIGHT, BASE_WIDTH, BLACK_SUN_RATE, COMMENTARY_DISPLAY_MS, COMMENTARY_MIN_INTERVAL_MS, COSMIC_EGG_RATE, CROWN_RATE, FINAL_SWEEP_DELAY_MS, FIRST_RUN_GUIDE_STORAGE_KEY, GIANT_EVENT_INTERVAL, GOLD_RATE, HEART_RATE, LOCAL_GOD_AUDIO_FILES, LOCAL_RARE_AUDIO_FILES, MAGNET_DURATION_MS, MILESTONE_INTERVAL, MIRACLE_ASSET_BASE_URL, MIRACLE_CHAIN_WINDOW_MS, MIRACLE_MANIFEST_URL, MIRACLE_OMEN_DISPLAY_MS, MIRACLE_OMEN_MIN_INTERVAL_MS, RAINBOW_RATE, RANDOM_BUCKET_COUNT, RECORD_STORAGE_KEY, REMOTE_MIRACLE_BAD_URL_CACHE_MS, REMOTE_MIRACLE_MANIFEST_CACHE_MS, REMOTE_MIRACLE_VIDEO_DISPLAY_MS, SCORE_STORAGE_BONUS_INTERVAL, SECRET_KEY_MAX_LENGTH, SECRET_KEY_SEQUENCES, SHAPE_RATE, SHOOTING_STAR_RATE, SMALL_MIRACLE_MIN_INTERVAL_MS, STUCK_EXPLODE_FRAMES, STUCK_NUDGE_FRAMES, SWORD_IMPACT_RATE, TIME_STOP_DURATION_MS, USER_PREFERENCES_STORAGE_KEY, USER_PROFILE_STORAGE_KEY, type RareSoundFlavor } from "./miracle/constants";
import { getSpecialIconColors } from "./miracle/drawing";
import { MAGIC_CIRCLE_DEFS, classifyMagicCircle, type MagicCircleDef } from "./miracle/magicCircles";
import { buildMagicBoardPlan, buildMagicCircleActivationPlan, createActiveMagicPhysicsField, updateActiveMagicPhysicsFields } from "./miracle/magicBoardService";
import { loadSavedRecords, loadUserPreferences, loadUserProfile, saveSavedRecords, saveUserProfileData } from "./miracle/localData";
import { clamp, escapeHtml, formatDateTime, formatDurationMs, formatElapsedTime, formatProbability, getBrowserName, getDateKey, getTodayKey, hashTextToNumber, isMobileDevice, loadExternalScript, parseLabels } from "./miracle/utils";
import { getDailyMissions, getDailyMissionValue, getResearchRankInfo, getThemeCollection, getThemeForTime, pickRandomTheme } from "./miracle/progression";
import { getMiracleBookRowHtml, getMiracleIconHtml as getMiracleIconHtmlBase } from "./miracle/miraclePresentation";
import { createRareSequence } from "./miracle/soundSequences";
import { installMobileDockGlobalActionGuard } from "./miracle/mobileDock";
import { getRemoteAssetRankScore, getRemoteMiracleAssetLabel, getRemoteMiracleAssetMainUrl, getRemoteMiracleAssetSources, getRemoteMiracleVideoVolume, normalizeRemoteMiracleAssetsFromManifest, selectRemoteMiracleVideoAsset, weightedPickRemoteAsset } from "./miracle/remoteMiracleAssets";
import { buildWeirdMiracleText as buildWeirdMiracleTextWithRandom } from "./miracle/miracleText";
import { getPachinkoPinOffset as getPachinkoPinOffsetForGeometry, pickRandomPachinkoNailPattern as pickRandomPachinkoNailPatternWithRandom } from "./miracle/pachinkoLayout";
import { createAppRoot, createBootOverlay, installAppShellStyles } from "./miracle/appShell";
import { triggerSwordImpactEffect as playSwordImpactScreenEffect } from "./miracle/screenEffects";
import { applyUnifiedMetallicButtonStyle as applyUnifiedMetallicButtonStyleBase, createButton as createButtonBase, createField as createFieldBase, createInput as createInputBase, createTextarea as createTextareaBase, getMetallicButtonBackground, getMetallicPanelBackground } from "./miracle/uiFactory";
import { BROKEN_RESEARCH_NOTE_LINES } from "./miracle/flavorText";
import { getUserGuideHtml } from "./miracle/helpContent";
import { chooseTimeBallSkin as chooseTimeBallSkinBase, drawTimeBallSkinIcon, getCurrentTimeBallTheme, getTimeBallSkinFillStyle, getTimeBallSkinLabel as getTimeBallSkinLabelBase, getTimeBallThemeLabel as getTimeBallThemeLabelBase, type TimeBallSkinLabels, type TimeBallThemeLabels } from "./miracle/timeBallSkins";
import { draw3DBallShadingFrame, drawBoardDepthOverlayFrame, drawLuxuryBoardForegroundFrame, drawMobileRuntimeStableFrame as drawMobileRuntimeStableFrameBase, drawNormalTraitMarksFrame, drawRealisticPinsFrame, drawSpecialGlowsFrame } from "./miracle/ballRendering";
import { drawMagicCircleTraceFrame } from "./miracle/magicCircleRendering";
import { drawDiscardBinLabelFrame, drawPachinkoMachineFrame, drawSpecialIconFrame } from "./miracle/pachinkoRendering";
import { drawFamiliarFrame } from "./miracle/familiarRendering";
import { drawBrokenResearchNoteFrame, drawMagicPhysicsFieldsFrame, type MagicPhysicsField } from "./miracle/magicPhysicsRendering";
import { drawTapRipplesFrame } from "./miracle/tapRippleRendering";
import { drawRareBoardCatastropheFrame } from "./miracle/rareBoardCatastropheRendering";
import { getResearchArchiveHtml, getResearchReportDetailHtml } from "./miracle/researchArchivePresentation";
import { createResearchReportEntry as createResearchReportEntryBase, prependResearchReport } from "./miracle/researchReportService";
import { getFamiliarExpeditionHtml, getFamiliarPopupHtml, getMiracleTicketHtml, getSecretResearchNoteHtml } from "./miracle/familiarPresentation";
import { getMiracleAlbumHtml, getMiracleLogHtml } from "./miracle/miracleAlbumPresentation";
import { getResearchWorldMapHtml } from "./miracle/researchWorldMapPresentation";
import { getDailyMissionHtml, getExperimentPresetHtml, getLabHomeHtml, getResearchRankHtml, getResearchReportSummaryHtml, getThemeBookHtml } from "./miracle/labPresentation";
import { getAboutHtml, getButtonHelpHtml } from "./miracle/aboutPresentation";
import { getAppInfoHtml, getMiracleBookHtml, getRecordsHtml, getUserSettingsHtml } from "./miracle/userPresentation";
import { getDailyFortuneHtml, getFusionHtml, getMissionHtml } from "./miracle/activityPresentation";
import { getSecretHtml, getSecretUnlockHtml, SECRET_DEFS } from "./miracle/secretPresentation";
import { getAdminGateHtml, getAdminMiracleButtonHtml, getAdminPanelHtml, getAdminRemoteVideoEmptyHtml, getAdminRemoteVideoListHtml, getAdminRemoteVideoLoadingHtml, getAdminRemoteVideoRowHtml, getAnagoTempuraSecretHtml, getEmergencyRuntimeLogOverlayHtml, getRuntimeGuardLogHtml } from "./miracle/adminPresentation";
import { getEndingResultHtml, getFinalResultHtml, getSafeStopResultHtml } from "./miracle/resultPresentation";
import { buildResultCsv as buildResultCsvBase } from "./miracle/resultExportService";
import { getAdminMagicCircleAnswerHtml, getMagicCircleSummonOverlayHtml } from "./miracle/magicCirclePresentation";
import { getCommentaryLineHtml, getFullScreenCelebrationHtml, getLifeQuoteHtml, getMiracleOverlayHtml, getNormalTraitSummaryHtml as getNormalTraitSummaryHtmlBase, pickCelebrationEffect as pickCelebrationEffectBase } from "./miracle/effectPresentation";
import { createDividers as createDividersBase, createDropPlugin as createDropPluginBase, createExternalIntruderDrops, createHeartBody as createHeartBodyBase, createPachinkoNailGate as createPachinkoNailGateBase, createPachinkoYakumonoSensors as createPachinkoYakumonoSensorsBase, createPins as createPinsBase, createRandomShapeBody as createRandomShapeBodyBase, createSymbolBody as createSymbolBodyBase, createTinyFragment as createTinyFragmentBase, createWallsAndFloor as createWallsAndFloorBase, getPachinkoYakumonoDef as getPachinkoYakumonoDefBase, getRarePinDef as getRarePinDefBase, rollRarePin as rollRarePinBase } from "./miracle/physicsService";
import { createRemoteMiracleAssetLoader, createRemoteMiracleBadUrlCache, getAdjustedSoundVolume, getFreshRemoteVideoSourceUrl as getFreshRemoteVideoSourceUrlBase, isIOSLikeDevice as isIOSLikeDeviceBase, playSecretToneCue, playUiToneCue, prepareRemoteVideoForSound as prepareRemoteVideoForSoundBase } from "./miracle/videoAudioService";
import { addRuntimeGuardLog as addRuntimeGuardLogBase, createRuntimeErrorLogWriter, installGlobalErrorLogger as installGlobalErrorLoggerBase, readRuntimeGuardLogs as readRuntimeGuardLogsBase, stringifyErrorForAdminLog } from "./miracle/adminService";
import { applyUserPreferences, buildUserPreferences, getAppOnlineStatusHtml as getAppOnlineStatusHtmlBase, getUserPlayStyleLabel as getUserPlayStyleLabelBase, registerAppOpenInProfile } from "./miracle/stateService";
import type {
    DropKind,
    ProbabilityMode,
    SpecialEventDef,
    MiracleLogEntry,
    FusionDef,
    DailyFortune,
    RemoteMiracleAsset,
    ThemeMode,
    ThemeAutoMode,
    DailyMissionDef,
    EffectMode,
    WorldMode,
    TimeBallTheme,
    TimeBallSkin,
    SavedRecords,
    MissionDef,
    SkillKind,
    SkillState,
    Settings,
    UserPlayStyle,
    UserProfile,
    UserPreferences,
    Geometry,
    FloatingText,
    NormalBallTraitKind,
    NormalBallTraitDef,
    MiracleChainDef,
    BoardAnomalyMode,
    RarePinKind,
    PachinkoYakumonoKind,
    PachinkoYakumonoDef,
    TutorialMissionDef,
    TapRipple,
    ResearchReportEntry,
    BossExperimentRecord,
    FamiliarKind,
    FamiliarMode,
    FamiliarState,
} from "./miracle/types";

let offlineLabController: OfflineLabController | null = null;
let researchCommerceController: ResearchCommerceController | null = null;
let bossExperimentController: BossExperimentController | null = null;
let shareReplayController: ShareReplayController | null = null;
let resultActionController: ResultActionController | null = null;

function getResearchCommerceController(): ResearchCommerceController {
    if (!researchCommerceController) {
        researchCommerceController = createResearchCommerceController({
            getRecords: () => savedRecords,
            saveRecords,
            getTickets: () => miracleTicketState,
            setTickets: (state) => { miracleTicketState = state; },
            createId,
            random: appRandom,
            isMobile,
            showPopup,
            closePopup: closeHelpPopup,
            showToast: showSoftToast,
            showMilestone,
            updateTicketButton: (normal) => {
                if (miracleTicketButton) miracleTicketButton.textContent = t(`奇跡チケット ${normal}`, `Tickets ${normal}`);
            },
            getThemeOptions: () => getThemeOptions().map((option) => option.value),
            getThemeDisplayName,
            markThemeUnlocked,
            hashTextToNumber,
            formatProbability,
            applyExperimentPreset,
            addScore: (amount, reason) => addScore(amount, reason),
            revealGachaResult: (best, probabilityText, feelingText) => {
                settings.effectsEnabled = true;
                adminForceNextMiracleEffect = true;
                triggerRareBoardCatastrophe(best);
                showMiracle(best.kind, best.symbol, probabilityText, feelingText);
            },
            playGachaVideo: (best) => { void playGachaRemoteMiracleVideo(best); },
        });
    }
    return researchCommerceController;
}

function getBossExperimentController(): BossExperimentController {
    if (!bossExperimentController) {
        bossExperimentController = createBossExperimentController({
            getRecords: () => savedRecords,
            getStartTime: () => startTime,
            getRunScore: () => runScore,
            getFinishedCount: () => finishedCount,
            getRuntimeState: () => ({ isStarted, isFinished, isPaused, isMiraclePaused }),
            getGeometry: () => geometry,
            getBlackModeEnabled: () => settings.blackModeEnabled,
            getRankScore,
            getThemeDisplayName,
            findSpecialDef,
            createId,
            random: appRandom,
            showPopup,
            closePopup: closeHelpPopup,
            showToast: showSoftToast,
            showMilestone,
            addFloatingText,
            addScore,
            triggerPhaseEffect: (phase) => triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], phase === 2 ? "gravity" : "supernova"),
            celebrateVictory: () => {
                fireConfetti("cosmic", true);
                triggerScreenFlash("cosmic");
            },
            triggerTimeoutEffect: () => triggerScreenFlash("black"),
            finishRun: () => finishActiveBossRun(),
            triggerCameraShake,
            spawnIntruders: spawnExternalIntruderBalls,
            triggerOmen: () => maybeTriggerMiracleOmen(true),
            showCommentary: (message) => maybeShowCommentary(message, true),
            addGachaPoint: (point, reason) => { addGachaPoint(point, reason, false); },
            markThemeUnlocked,
            prepareBossSettings: (boss) => {
                settings.targetCount = boss.targetCount;
                settings.activeLimit = boss.activeLimit;
                settings.effectsEnabled = true;
                settings.boardAnomalyEnabled = true;
                settings.showRecentMiracles = true;
                targetInput.value = String(settings.targetCount);
                activeBallInput.value = String(settings.activeLimit);
            },
            startBossRun: () => startExperiment("boss"),
            uiFont: ROUNDED_UI_FONT,
        });
    }
    return bossExperimentController;
}

function getShareReplayController(): ShareReplayController {
    if (!shareReplayController) {
        shareReplayController = createShareReplayController({
            canvas,
            helpOverlay,
            getGeometry: () => geometry,
            getSummary: () => ({
                runScore,
                finishedCount,
                targetCount: settings.targetCount,
                discoveredCount: getDiscoveredCount(),
                specialEventCount: SPECIAL_EVENT_DEFS.length,
                savedRecords,
                researchLevel: getResearchLevelInfo().level,
                fusionCount: getFusionCount(),
                fusionTotalCount: FUSION_DEFS.length,
                fortuneRateBoost: (currentDailyFortune ?? getDailyFortune()).rateBoost,
                bestComboThisRun,
                missionClearedCount: Object.values(missionProgress).filter(Boolean).length,
                missionTotalCount: missionDefs.length,
            }),
            random: appRandom,
            isMobile,
            t,
            formatProbability,
            showPopup,
            showMilestone,
        });
    }
    return shareReplayController;
}

function getResultActionController(): ResultActionController {
    if (!resultActionController) {
        resultActionController = createResultActionController({
            resultOverlay,
            buildResultCsv,
            showMilestone,
            now: Date.now,
        });
    }
    return resultActionController;
}

function getOfflineLabController(): OfflineLabController {
    if (!offlineLabController) {
        offlineLabController = createOfflineLabController({
            isMobile,
            showPopup,
            closePopup: closeHelpPopup,
            showSoftToast,
            stopRemoteMiracleVideo,
            loadRemoteMiracleAssets,
            getRemoteMiracleAssetSources,
            playRemoteMiracleVideoAsset,
            isHelpOverlayClosed: () => helpOverlay.style.display === "none",
        });
    }
    return offlineLabController;
}

function showOfflineVideoDownloadPopup(mode?: OfflineVideoDownloadMode): Promise<void> {
    if (!isAdminMode) {
        showAdminGatePopup();
        showSoftToast("オフライン動画保存は研究主任モード専用です");
        return Promise.resolve();
    }
    return getOfflineLabController().showOfflineVideoDownloadPopup(mode);
}

function showOfflineMiracleBookPopup(): Promise<void> {
    return getOfflineLabController().showOfflineMiracleBookPopup();
}

function showOfflineLabHomePopup(): Promise<void> {
    return getOfflineLabController().showOfflineLabHomePopup();
}

function showOfflineModeEventPopup(): void {
    getOfflineLabController().showOfflineModeEventPopup();
}

const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Composite = Matter.Composite;

const browserName = getBrowserName();
const isMobile = isMobileDevice();

function ensureMobileViewportMeta(): void {
    if (!isMobile) return;
    let viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement("meta");
        viewport.name = "viewport";
        document.head.appendChild(viewport);
    }
    viewport.content = "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover";
    document.documentElement.style.width = "100%";
    document.documentElement.style.height = "100%";
    document.documentElement.style.margin = "0";
    document.documentElement.style.overflow = "hidden";
    document.body.style.width = "100vw";
    document.body.style.minWidth = "100vw";
    const appHeight = `${Math.max(360, Math.floor(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 720))}px`;
    document.documentElement.style.setProperty("--miracle-app-height", appHeight);
    document.body.style.height = "var(--miracle-app-height, 100vh)";
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
}

ensureMobileViewportMeta();

const uiFontPx = isMobile ? 25 : 20;
const uiButtonFontPx = isMobile ? 26 : 20;
const DEFAULT_BACKGROUND_IMAGE_URL = `${import.meta.env.BASE_URL}favicon.png`;
const ROUNDED_UI_FONT = `"M PLUS Rounded 1c", "Zen Maru Gothic", "Kosugi Maru", "Hiragino Maru Gothic ProN", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif`;
const COMMENTARY_DEFAULT_OFF_MIGRATION_KEY = "miracle_commentary_default_off_migrated_v1";
const PIN_ROWS_DEFAULT_4_MIGRATION_KEY = "miracle_pin_rows_default_4_migrated_v1";
const BIN_COUNT_DEFAULT_4_MIGRATION_KEY = "miracle_bin_count_default_4_migrated_v1";
let settings: Settings = createDefaultSettings(isMobile, DEFAULT_BACKGROUND_IMAGE_URL);
let settingsUiZoom = loadSettingsUiZoom(localStorage);

let selectedBackgroundObjectUrl = "";
let geometry: Geometry;

let finishedCount = 0;
let activeDropCount = 0;
let startTime = Date.now();
let endTime: number | null = null;
let targetReachedTime: number | null = null;
let lastSpeedCheckTime = Date.now();
let lastSpeedCheckFinishedCount = 0;
let speedPerSecond = 0;
let nextMilestone = MILESTONE_INTERVAL;
let nextGiantEvent = GIANT_EVENT_INTERVAL;
let giantStock = 0;
let isFinished = false;
let isPaused = false;
let isStarted = false;
let isMiraclePaused = false;
let miraclePauseTimer: number | undefined;
let miraclePauseEndsAt = 0;
let miraclePauseRemainingMs = 0;
let tiltExperimentEnabled = false;
let tiltExperimentButton: HTMLButtonElement | null = null;
let lastTiltGravityX = 0;
let magicCircleModeEnabled = false;
let magicCircleDrawing = false;
let magicCirclePoints: Array<{ x: number; y: number; t: number }> = [];
let runtimeInfoLastUpdatedAt = 0;
let runtimePanelLastUpdatedAt = 0;
let afterRenderFrameTick = 0;
let lastScreenFlashAt = 0;

function updateMobileViewportHeightVar(): void {
    if (!isMobile) return;
    const height = Math.max(360, Math.floor(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 720));
    document.documentElement.style.setProperty("--miracle-app-height", `${height}px`);
}

function getMobileRuntimeUiIntervalMs(): number {
    return isMobile && isStarted && !isFinished ? 520 : 180;
}

function updateInfoDuringRun(): void {
    if (!isMobile) {
        updateInfo();
        return;
    }
    const now = performance.now();
    if (now - runtimeInfoLastUpdatedAt < getMobileRuntimeUiIntervalMs()) return;
    runtimeInfoLastUpdatedAt = now;
    updateInfo();
}

function updateRuntimePanelsDuringRun(): void {
    if (!isMobile) {
        updateTutorialMissions();
        updateResearchProgressPanel();
        return;
    }
    const now = performance.now();
    if (now - runtimePanelLastUpdatedAt < 620) return;
    runtimePanelLastUpdatedAt = now;
    updateTutorialMissions();
    updateResearchProgressPanel();
}

const howlerCueCache = new Map<string, Howl>();
const activeMagicPhysicsFields: MagicPhysicsField[] = [];
let magicBoardShapeToken = 0;
let brokenResearchNoteUntil = 0;
let brokenResearchNoteText = "";
let temporaryPinPlacementEnabled = false;
const temporaryPinBodies = new Set<Matter.Body>();

let labels: string[] = [];
let binCounts: number[] = [];
let hitFlash: number[] = [];
let discardedCount = 0;

let goldCreated = 0;
let rainbowCreated = 0;
let giantCreated = 0;
let shapeCreated = 0;
let crownCreated = 0;
let starCreated = 0;
let heartCreated = 0;
let blackSunCreated = 0;
let cosmicEggCreated = 0;
let silverUfoCreated = 0;
let blueFlameCreated = 0;
let luckySevenCreated = 0;
let timeRiftCreated = 0;
let labExplosionCreated = 0;

let specialCreated: Record<string, number> = {};
let savedRecords: SavedRecords = loadSavedRecords();
let familiarState: FamiliarState = loadFamiliarState();
let miracleTicketState: MiracleTicketState = loadMiracleTicketState();
let familiarExpeditionState: FamiliarExpeditionState = loadFamiliarExpeditionState();
let secretResearchNoteState: SecretResearchNoteState = loadSecretResearchNoteState();
let multiverseState = loadMultiverseState(localStorage);
let userProfile: UserProfile = loadUserProfile();
let userPreferences: UserPreferences = loadUserPreferences();
let adminLogApi: AdminLogApi;
let missionDefs: MissionDef[] = [];
let missionProgress: Record<string, boolean> = {};
let runScore = 0;
let bestComboThisRun = 0;
let skillState: SkillState = createInitialSkillState();
let magnetUntil = 0;
let lastSkillUsedAt = 0;

let goldHits: number[] = [];
let rainbowHits: number[] = [];
let giantHits: number[] = [];
let shapeHits: number[] = [];
let crownHits: number[] = [];
let starHits: number[] = [];
let heartHits: number[] = [];
let blackSunHits: number[] = [];
let cosmicEggHits: number[] = [];

const randomTelemetry = createRandomTelemetry(RANDOM_BUCKET_COUNT);
let floatingTexts: FloatingText[] = [];
let shakeUntil = 0;
let shakePower = 0;
let speedLabelText = "通常";
let isEnglish = false;
let isFullscreenMode = false;
let isPseudoFullscreenMode = false;
let pseudoFullscreenScrollY = 0;
let isVerticalVideoMode = false;
let isObsMode = false;
let currentTheme: ThemeMode = "lab";
let themeAutoMode: ThemeAutoMode = settings.themeAutoMode;
let miracleLogs: MiracleLogEntry[] = [...(savedRecords.miracleLogs ?? [])];
let currentDailyFortune: DailyFortune | null = null;
let secretKeyBuffer = "";
let bootIconTapCount = 0;
let pauseTapHistory: number[] = [];
let mobileSettingsOpenCount = 0;
let skillComboBuffer: SkillKind[] = [];
let repeatedMiracleRunCounts: Record<string, number> = {};
let currentSubtitleText = "";
let subtitleTimer: number | undefined;
let comboTimer: number | undefined;
let miracleCombo = 0;
let lastMiracleAt = 0;
let activeRareBackgroundKind: DropKind | null = null;
let activeWorldMode: WorldMode = null;
let activeUiAccentKind: DropKind | null = null;
let uiAccentTimer: number | undefined;
let currentPachinkoNailPattern = "standard";
let lifeQuoteOverlayTimer: number | undefined;
let rareBackgroundTimer: number | undefined;
let anomalyUntil = 0;
let anomalyLabel = "";
let anomalyOldGravityX = 0;
let anomalyHidePins = false;
let anomalyMode: BoardAnomalyMode = "none";
let anomalyCenterX = 0;
let anomalyTick = 0;
let lastCommentaryAt = 0;
let commentaryTimer: number | undefined;
let recentMiracleKinds: { kind: DropKind; at: number }[] = [];
let unlockedChainRunIds: Record<string, number> = {};
let recentMiracleMiniLogs: MiracleLogEntry[] = [];
let toastTimer: number | undefined;
let isAppTerminated = false;
let lastMiracleOmenAt = 0;
let lastOmenText = "";
let rarePinTouchCount: Record<RarePinKind, number> = { red: 0, blue: 0, black: 0, rainbow: 0 };
let pachinkoYakumonoHitCount: Record<PachinkoYakumonoKind, number> = { start: 0, center: 0, premium: 0 };
let pachinkoJackpotCount = 0;
const TUTORIAL_MISSIONS_ENABLED = false;
let tutorialMissionProgress: Record<string, boolean> = {};
let tutorialMissionPanelVisible = false;
let tutorialMissionExpanded = !isMobile;
let tutorialMissionCollapseTimer: number | undefined;
let guideModeActive = false;
let guideModeStartedAt = 0;
let welcomeShowcaseDone = false;
let smallMiracleCount = 0;
let tapInterventionCount = 0;
let nextSmallMiracleAt = 0;
let tapRipples: TapRipple[] = [];
let guideTimers: number[] = [];
let familiarButton: HTMLButtonElement | null = null;
let miracleTicketButton: HTMLButtonElement | null = null;
let secretNoteButton: HTMLButtonElement | null = null;
let familiarToggleButton: HTMLButtonElement | null = null;
let familiarMessage = "";
let familiarMessageUntil = 0;
let familiarPulseUntil = 0;
let familiarSaveTimer: number | undefined;

function initAdminLogApi(): void {
    adminLogApi = createAdminLogApi({
        getSpeedLabelText: () => speedLabelText,
        getProbabilityMode: () => settings.probabilityMode,
        getIsAdminMode: () => isAdminMode,
        showAdminGatePopup,
        showPopup,
        showSoftToast,
        getDateKey,
        escapeHtml,
        formatDateTime,
        getRankScore,
        getIsMobile: () => isMobile,
        getUiButtonFontPx: () => uiButtonFontPx,
    });
}

let soundEnabled = true;
let toneReady = false;
let toneModule: any = null;
let toneModuleLoading: Promise<any> | null = null;
let mobileAudioUnlocked = false;
let mobileVideoSoundRetryButton: HTMLButtonElement | null = null;
let mobileAudioPrimeElement: HTMLAudioElement | null = null;
let confettiEnabled = true;
applyUserPreferencesToCurrentState();
initAdminLogApi();
registerAppOpen();
let pixiEnabled = false;
let pixiReady = false;
let pixiBackground: PixiBackground | null = null;
let animeApi: AnimeApi | null = null;
let tippyApi: TippyApi | null = null;
let mobileDockRunButton: HTMLButtonElement | null = null;
let mobileDockPauseButton: HTMLButtonElement | null = null;
let mobileDockSettingsButton: HTMLButtonElement | null = null;
let mobileSettingsOverlay: HTMLDivElement | null = null;
let mobileSettingsPanel: HTMLDivElement | null = null;
let missionButton: HTMLButtonElement | null = null;
let shareButton: HTMLButtonElement | null = null;
let skillButtons: Partial<Record<SkillKind, HTMLButtonElement>> = {};
let adminButton: HTMLButtonElement | null = null;
let isAdminMode = localStorage.getItem(ADMIN_UNLOCK_STORAGE_KEY) === "1";
let adminForceNextMiracleEffect = false;
let activeRemoteMiracleVideoRankScore = -1;
let activeRemoteMiracleVideoLabel = "";
let activeRemoteMiracleVideoVolume = 0.45;
let activeRemoteMiracleObjectUrls: string[] = [];

async function loadToneModule(): Promise<any> {
    if (toneModule) return toneModule;
    if (!toneModuleLoading) {
        toneModuleLoading = import("tone")
            .then((module) => {
                toneModule = module;
                return module;
            })
            .finally(() => {
                toneModuleLoading = null;
            });
    }
    return toneModuleLoading;
}

const engine = Engine.create();
engine.gravity.y = 8;
engine.timing.timeScale = 1;

const render = Render.create({
    element: document.body,
    engine,
    options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: "transparent",
        pixelRatio: 2,
    },
});

const runner = Runner.create();

function ensureRenderLoop(): void {
    // Render.stop() 後に再開できない状態を避けるため、
    // 実行開始・リセット時は一度止めてから必ず描画ループを張り直す。
    try { Render.stop(render); } catch {}
    Render.run(render);
}

function stopRenderLoop(): void {
    try { Render.stop(render); } catch {}
}

function resumeRuntimeLoopsAfterForeground(): void {
    if (isAppTerminated) return;
    ensureRenderLoop();
    if (isStarted && !isFinished && !isPaused && !isMiraclePaused) {
        try {
            Runner.stop(runner);
            Runner.run(runner, engine);
        } catch (error) {
            addRuntimeGuardLog("runner-resume-failed", stringifyErrorForAdminLog(error));
        }
    }
}

// ======================================================
// HTML / UI
// ======================================================

installAppShellStyles(isMobile, ROUNDED_UI_FONT);
const bootMinimumDurationMs = 2000;
const faviconUrl = DEFAULT_BACKGROUND_IMAGE_URL;

const bootOverlay = createBootOverlay({
    faviconUrl,
    minimumDurationMs: bootMinimumDurationMs,
    onIconTap: () => {
    bootIconTapCount++;
    playUiSound("tick");
    if (bootIconTapCount >= 5) {
        unlockSecret("favicon-five-taps", "favicon 5連打", "起動ロゴを5回タップしました。ロード画面にも秘密がありました。");
        bootIconTapCount = 0;
    }
    },
    onKeydown: handleSecretKey,
});

function hideBootOverlay(): void {
    bootOverlay.hide();
}

const appRoot = createAppRoot(isMobile);

function normalizeAppViewportStyles(): void {
    if (!isMobile) return;
    updateMobileViewportHeightVar();
    document.documentElement.style.width = "100%";
    document.documentElement.style.minWidth = "100%";
    document.documentElement.style.height = "100%";
    document.documentElement.style.minHeight = "100%";
    document.body.style.width = "100vw";
    document.body.style.minWidth = "100vw";
    document.body.style.height = "var(--miracle-app-height, 100vh)";
    document.body.style.minHeight = "var(--miracle-app-height, 100vh)";
    appRoot.style.width = "100vw";
    appRoot.style.minWidth = "100vw";
    appRoot.style.height = "var(--miracle-app-height, 100vh)";
    appRoot.style.minHeight = "var(--miracle-app-height, 100vh)";
    appRoot.style.maxWidth = "100vw";
    appRoot.style.maxHeight = "var(--miracle-app-height, 100vh)";
    appRoot.style.overflow = "hidden";
}

normalizeAppViewportStyles();

function applyDesktopDocumentScrollLayout(): void {
    if (isMobile) return;
    document.documentElement.style.height = "auto";
    document.documentElement.style.minHeight = "100%";
    document.documentElement.style.overflowX = "hidden";
    document.documentElement.style.overflowY = "auto";
    document.body.style.height = "auto";
    document.body.style.minHeight = "100vh";
    document.body.style.maxHeight = "";
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";
    document.body.style.position = "static";
    document.body.style.inset = "";
    document.body.style.touchAction = "auto";
    appRoot.style.position = "relative";
    appRoot.style.inset = "";
    appRoot.style.display = "block";
    appRoot.style.height = "auto";
    appRoot.style.minHeight = "100vh";
    appRoot.style.maxHeight = "none";
    appRoot.style.overflowX = "hidden";
    appRoot.style.overflowY = "visible";
}

applyDesktopDocumentScrollLayout();

const gameArea = document.createElement("div");
gameArea.id = "miracle-game-area";
gameArea.style.flex = "1";
gameArea.style.width = "100%";
gameArea.style.maxWidth = "100vw";
gameArea.style.minHeight = "0";
gameArea.style.display = "flex";
gameArea.style.alignItems = "center";
gameArea.style.justifyContent = "center";
gameArea.style.background = "radial-gradient(circle at 50% 0%, #ffffff 0%, #edf3ff 46%, #dfe7f5 100%)";
gameArea.style.overflow = "hidden";
gameArea.style.position = "relative";
appRoot.appendChild(gameArea);

const pixiLayer = document.createElement("div");
pixiLayer.style.position = "absolute";
pixiLayer.style.inset = "0";
pixiLayer.style.zIndex = "0";
pixiLayer.style.pointerEvents = "none";
gameArea.appendChild(pixiLayer);

const canvas = render.canvas;
canvas.style.display = "block";
canvas.style.position = "relative";
canvas.style.zIndex = "1";
canvas.style.transformOrigin = "center center";
canvas.style.borderRadius = isMobile ? "24px" : "26px";
canvas.style.boxShadow = isMobile ? "0 16px 34px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,.60)" : "0 26px 64px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,.62)";
canvas.style.backgroundColor = "rgba(245,245,245,0.88)";
canvas.style.backgroundSize = "cover";
canvas.style.backgroundPosition = "center";
canvas.style.backgroundRepeat = "no-repeat";
canvas.addEventListener("pointerdown", (event) => {
    if (temporaryPinPlacementEnabled) {
        event.preventDefault();
        const pt = getCanvasPointFromEvent(event);
        createTemporaryPinAt(pt.x, pt.y);
        temporaryPinPlacementEnabled = false;
        canvas.style.cursor = "";
        return;
    }
    if (magicCircleModeEnabled) {
        event.preventDefault();
        magicCircleDrawing = true;
        magicCirclePoints = [{ ...getCanvasPointFromEvent(event), t: performance.now() }];
        try { canvas.setPointerCapture(event.pointerId); } catch {}
        return;
    }
    activateNearestPin(event);
}, { passive: false });
canvas.addEventListener("pointermove", (event) => {
    if (!magicCircleModeEnabled || !magicCircleDrawing) return;
    event.preventDefault();
    const pt = getCanvasPointFromEvent(event);
    const last = magicCirclePoints[magicCirclePoints.length - 1];
    if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) > 8 * geometry.scale) {
        magicCirclePoints.push({ ...pt, t: performance.now() });
        if (!settings.simpleMode && magicCirclePoints.length % 4 === 0) createTapRipple(pt.x, pt.y, false);
    }
}, { passive: false });
canvas.addEventListener("pointerup", (event) => {
    if (!magicCircleModeEnabled || !magicCircleDrawing) return;
    event.preventDefault();
    magicCircleDrawing = false;
    magicCircleModeEnabled = false;
    canvas.style.cursor = "";
    const pt = getCanvasPointFromEvent(event);
    magicCirclePoints.push({ ...pt, t: performance.now() });
    const def = classifyMagicCircle(magicCirclePoints);
    activateMagicCircle(def, magicCirclePoints);
    const completedTrace = magicCirclePoints.slice();
    magicCirclePoints = completedTrace;
    window.setTimeout(() => {
        if (!magicCircleDrawing && !magicCircleModeEnabled && magicCirclePoints === completedTrace) {
            magicCirclePoints = [];
        }
    }, 1200);
}, { passive: false });
canvas.addEventListener("pointercancel", () => {
    magicCircleDrawing = false;
    magicCirclePoints = [];
    if (magicCircleModeEnabled) canvas.style.cursor = "crosshair";
});
gameArea.appendChild(canvas);

const gameFullscreenButton = document.createElement("button");
gameFullscreenButton.textContent = "⛶";
gameFullscreenButton.title = "fullscreen";
gameFullscreenButton.style.position = "absolute";
gameFullscreenButton.style.right = isMobile ? "14px" : "16px";
gameFullscreenButton.style.bottom = isMobile ? "14px" : "16px";
gameFullscreenButton.style.zIndex = "3";
gameFullscreenButton.style.width = isMobile ? "54px" : "48px";
gameFullscreenButton.style.height = isMobile ? "54px" : "48px";
gameFullscreenButton.style.borderRadius = "999px";
gameFullscreenButton.style.border = "1px solid rgba(255,255,255,.4)";
gameFullscreenButton.style.background = "rgba(15,21,36,.55)";
gameFullscreenButton.style.backdropFilter = "blur(8px)";
gameFullscreenButton.style.color = "#fff";
gameFullscreenButton.style.fontSize = isMobile ? "28px" : "24px";
gameFullscreenButton.style.fontWeight = "900";
gameFullscreenButton.style.cursor = "pointer";
gameFullscreenButton.onclick = () => toggleGameFullscreen();
gameFullscreenButton.style.display = "none";

const pcPauseButton = document.createElement("button");
pcPauseButton.textContent = "一時停止";
pcPauseButton.title = "一時停止 / 再開";
pcPauseButton.style.position = "absolute";
pcPauseButton.style.left = isMobile ? "14px" : "16px";
pcPauseButton.style.bottom = isMobile ? "82px" : "16px";
pcPauseButton.style.zIndex = "120";
pcPauseButton.style.pointerEvents = "auto";
pcPauseButton.style.display = isMobile ? "none" : "inline-flex";
pcPauseButton.style.alignItems = "center";
pcPauseButton.style.justifyContent = "center";
pcPauseButton.style.minWidth = "86px";
pcPauseButton.style.whiteSpace = "normal";
pcPauseButton.style.lineHeight = "1.15";
pcPauseButton.style.height = "48px";
pcPauseButton.style.padding = "0 18px";
pcPauseButton.style.borderRadius = "999px";
pcPauseButton.style.border = "1px solid rgba(255,255,255,.48)";
pcPauseButton.style.background = "rgba(15,21,36,.62)";
pcPauseButton.style.backdropFilter = "blur(10px)";
pcPauseButton.style.color = "#fff";
pcPauseButton.style.fontSize = "18px";
pcPauseButton.style.fontWeight = "900";
pcPauseButton.style.fontFamily = ROUNDED_UI_FONT;
pcPauseButton.style.cursor = "pointer";
pcPauseButton.onclick = null;
pcPauseButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    togglePause();
}, { passive: false });
pcPauseButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
});
gameArea.appendChild(pcPauseButton);

const pcMagicButton = document.createElement("button");
pcMagicButton.textContent = "魔法陣";
pcMagicButton.title = "魔法陣を書く";
pcMagicButton.style.position = "absolute";
pcMagicButton.style.left = isMobile ? "14px" : "144px";
pcMagicButton.style.bottom = isMobile ? "144px" : "16px";
pcMagicButton.style.zIndex = "120";
pcMagicButton.style.pointerEvents = "auto";
pcMagicButton.style.display = isMobile ? "none" : "inline-flex";
pcMagicButton.style.alignItems = "center";
pcMagicButton.style.justifyContent = "center";
pcMagicButton.style.minWidth = "76px";
pcMagicButton.style.whiteSpace = "normal";
pcMagicButton.style.lineHeight = "1.15";
pcMagicButton.style.height = "48px";
pcMagicButton.style.padding = "0 16px";
pcMagicButton.style.borderRadius = "999px";
pcMagicButton.style.border = "1px solid rgba(255,255,255,.48)";
pcMagicButton.style.background = "rgba(88,28,135,.62)";
pcMagicButton.style.backdropFilter = "blur(10px)";
pcMagicButton.style.color = "#fff";
pcMagicButton.style.fontSize = "17px";
pcMagicButton.style.fontWeight = "900";
pcMagicButton.style.fontFamily = ROUNDED_UI_FONT;
pcMagicButton.style.cursor = "pointer";
pcMagicButton.onclick = () => enableMagicCircleMode();
gameArea.appendChild(pcMagicButton);

const info = document.createElement("div");
info.id = "miracle-info-area";
info.style.flex = "0 0 auto";
info.style.width = "100%";
info.style.maxWidth = "100%";
info.style.boxSizing = "border-box";
info.style.background = "rgba(255, 255, 255, 0.72)";
info.style.backdropFilter = "blur(18px)";
info.style.borderTop = "1px solid rgba(255,255,255,0.78)";
info.style.boxShadow = "0 -8px 28px rgba(0,0,0,0.08)";
info.style.overflow = "auto";
info.style.position = "relative";
info.style.zIndex = isMobile ? "2200" : "2";
info.style.pointerEvents = "auto";
appRoot.appendChild(info);

function getMobileDockHeightPx(): number {
    if (!isMobile) return 0;
    return 108;
}

function getMobileGameViewportSize(): { width: number; height: number } {
    const width = Math.max(320, Math.floor(window.visualViewport?.width || window.innerWidth || document.documentElement.clientWidth || 390));
    const appHeight = Math.max(360, Math.floor(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 720));
    return { width, height: Math.max(260, appHeight - getMobileDockHeightPx()) };
}

function applyMobileGameCanvasLayout(): void {
    if (!isMobile) return;
    const { width, height } = getMobileGameViewportSize();
    gameArea.style.aspectRatio = isVerticalVideoMode ? "9 / 16" : "";
    gameArea.style.flex = "1 1 auto";
    gameArea.style.position = "relative";
    gameArea.style.width = "100vw";
    gameArea.style.maxWidth = "100vw";
    gameArea.style.minWidth = "100vw";
    gameArea.style.height = `${height}px`;
    gameArea.style.minHeight = `${height}px`;
    gameArea.style.maxHeight = `${height}px`;
    gameArea.style.display = "flex";
    gameArea.style.alignItems = "center";
    gameArea.style.justifyContent = "center";
    gameArea.style.overflow = "hidden";
    gameArea.style.transform = "none";

    canvas.style.display = "block";
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.right = "0";
    canvas.style.bottom = "0";
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.minWidth = `${width}px`;
    canvas.style.minHeight = `${height}px`;
    canvas.style.maxWidth = "none";
    canvas.style.maxHeight = "none";
    canvas.style.flex = "none";
    canvas.style.margin = "0";
    canvas.style.objectFit = "fill";
    canvas.style.transformOrigin = "center center";
    canvas.style.transform = "translate(0,0)";
}

function syncMobileMatterCanvasSize(): void {
    if (!isMobile) return;
    const { width, height } = getMobileGameViewportSize();
    render.options.width = width;
    render.options.height = height;
    render.options.pixelRatio = 1;
    render.bounds.min.x = 0;
    render.bounds.min.y = 0;
    render.bounds.max.x = width;
    render.bounds.max.y = height;
    canvas.width = width;
    canvas.height = height;
    canvas.setAttribute("data-pixel-ratio", "1");
    render.context.setTransform(1, 0, 0, 1, 0, 0);
    applyMobileGameCanvasLayout();
}

function isMobileCanvasLayoutBroken(): boolean {
    if (!isMobile) return false;
    const areaRect = gameArea.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    if (areaRect.width <= 0 || areaRect.height <= 0 || canvasRect.width <= 0 || canvasRect.height <= 0) return true;
    return (
        canvasRect.width < areaRect.width * 0.94 ||
        canvasRect.height < areaRect.height * 0.94 ||
        Math.abs(canvasRect.left - areaRect.left) > 3 ||
        Math.abs(canvasRect.top - areaRect.top) > 3
    );
}

function repairMobileBoardLayout(forceResize = false): void {
    if (!isMobile || isAppTerminated) return;
    normalizeAppViewportStyles();
    forceMobileFullViewportLayout();
    const { width, height } = getMobileGameViewportSize();
    const needsRenderResize = forceResize || canvas.width !== width || canvas.height !== height || isMobileCanvasLayoutBroken();
    if (needsRenderResize) syncMobileMatterCanvasSize();
    else applyMobileGameCanvasLayout();
}

function isMobileStableRuntime(): boolean {
    return isMobile && isStarted && !isFinished;
}

function isOverlayOpen(el: HTMLElement | null | undefined): boolean {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function isOverlayOpenById(id: string): boolean {
    return isOverlayOpen(document.getElementById(id) as HTMLElement | null);
}

function restoreMainTouchTargets(): void {
    const popupOpen = isOverlayOpenById("miracle-help-overlay");
    const settingsOpen = isOverlayOpen(mobileSettingsOverlay);
    const resultOpen = typeof resultOverlay !== "undefined" && resultOverlay.style.display !== "none";
    const blocked = popupOpen || settingsOpen || resultOpen;

    gameArea.style.pointerEvents = blocked ? "none" : "auto";
    info.style.pointerEvents = blocked ? "none" : "auto";
    if (mobileSettingsOverlay) mobileSettingsOverlay.style.pointerEvents = settingsOpen ? "auto" : "none";
    if (!isMobile && !blocked) {
        applyDesktopDocumentScrollLayout();
        info.style.pointerEvents = "auto";
        gameArea.style.pointerEvents = "auto";
    }

    const boot = document.getElementById("miracle-boot-overlay") as HTMLElement | null;
    if (boot && boot.style.opacity === "0") {
        boot.style.pointerEvents = "none";
        boot.style.display = "none";
        boot.remove();
    }
}

function forceMobileFullViewportLayout(): void {
    if (!isMobile) return;
    ensureMobileViewportMeta();
    updateMobileViewportHeightVar();
    const viewportHeight = Math.max(360, Math.floor(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 720));
    const viewportWidth = Math.max(320, Math.floor(window.visualViewport?.width || window.innerWidth || document.documentElement.clientWidth || 390));
    const popupOpen = isOverlayOpenById("miracle-help-overlay");
    const settingsOpen = isOverlayOpen(mobileSettingsOverlay);

    document.documentElement.style.width = "100%";
    document.documentElement.style.maxWidth = "100%";
    document.documentElement.style.height = "100%";
    document.documentElement.style.maxHeight = "100%";
    document.documentElement.style.overflow = "hidden";
    document.body.style.width = "100vw";
    document.body.style.maxWidth = "100vw";
    document.body.style.height = "var(--miracle-app-height, 100vh)";
    document.body.style.maxHeight = "var(--miracle-app-height, 100vh)";
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.inset = "0";

    appRoot.style.position = "fixed";
    appRoot.style.inset = "0";
    appRoot.style.width = "100vw";
    appRoot.style.height = "var(--miracle-app-height, 100vh)";
    appRoot.style.maxWidth = "100vw";
    appRoot.style.maxHeight = "var(--miracle-app-height, 100vh)";
    appRoot.style.display = "flex";
    appRoot.style.flexDirection = "column";
    appRoot.style.overflow = "hidden";

    // 以前の固定配置が残ると、canvas が左上に小さくなったり、下部ボタンが押せなくなるため、通常フローへ戻します。
    gameArea.style.position = "relative";
    gameArea.style.left = "";
    gameArea.style.top = "";
    gameArea.style.right = "";
    gameArea.style.bottom = "";
    gameArea.style.flex = "1 1 auto";
    gameArea.style.width = "100vw";
    gameArea.style.maxWidth = "100vw";
    gameArea.style.minWidth = "100vw";
    gameArea.style.zIndex = "1";
    gameArea.style.pointerEvents = popupOpen || settingsOpen ? "none" : "auto";

    info.style.position = "relative";
    info.style.left = "";
    info.style.right = "";
    info.style.bottom = "";
    info.style.flex = "0 0 auto";
    info.style.width = "100vw";
    info.style.minWidth = "100vw";
    info.style.height = "auto";
    info.style.minHeight = "96px";
    info.style.maxHeight = `${Math.max(180, Math.floor(viewportHeight * 0.52))}px`;
    info.style.overflowY = "auto";
    info.style.overflowX = "hidden";
    info.style.zIndex = popupOpen || settingsOpen ? "1" : "2200";
    info.style.pointerEvents = popupOpen || settingsOpen ? "none" : "auto";
    info.style.touchAction = "pan-y";

    applyMobileGameCanvasLayout();
    canvas.style.display = "block";
    canvas.style.transformOrigin = "center center";
    restoreMainTouchTargets();
}

const RUNTIME_GUARD_LOG_STORAGE_KEY = "miracle_runtime_guard_logs_v1";
const RUNTIME_GUARD_LOG_LIMIT = 80;

function readRuntimeGuardLogs() {
    return readRuntimeGuardLogsBase({
        storage: localStorage,
        storageKey: RUNTIME_GUARD_LOG_STORAGE_KEY,
        limit: RUNTIME_GUARD_LOG_LIMIT,
    });
}

function addRuntimeGuardLog(reason: string, detail: string): void {
    addRuntimeGuardLogBase({
        storage: localStorage,
        storageKey: RUNTIME_GUARD_LOG_STORAGE_KEY,
        limit: RUNTIME_GUARD_LOG_LIMIT,
        reason,
        detail,
        writeRuntimeErrorToAdminLog,
    });
}

function recoverMobileLayoutIfBroken(reason: string, forceReset = false): void {
    if (!isMobile || isAppTerminated) return;
    try {
        const vw = Math.max(1, window.visualViewport?.width || window.innerWidth || document.documentElement.clientWidth || 1);
        const vh = Math.max(1, window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 1);
        const rect = canvas.getBoundingClientRect();
        const areaRect = gameArea.getBoundingClientRect();
        const canvasMissing = rect.width < vw * 0.42 || rect.height < Math.min(220, vh * 0.24);
        const areaMissing = areaRect.width < vw * 0.78 || areaRect.height < Math.min(240, vh * 0.24);

        if (isMobileStableRuntime() && !canvasMissing && !areaMissing && !forceReset) return;

        // 実行中は正常な盤面へ触らず、壊れている時だけ DOM/CSS を補正します。
        normalizeAppViewportStyles();
        forceMobileFullViewportLayout();

        if (canvasMissing || areaMissing || forceReset) {
            addRuntimeGuardLog(reason, `layout css recovered / canvas=${Math.round(rect.width)}x${Math.round(rect.height)} / area=${Math.round(areaRect.width)}x${Math.round(areaRect.height)} / viewport=${Math.round(vw)}x${Math.round(vh)}`);
        }
    } catch (error) {
        addRuntimeGuardLog(`${reason}:failed`, stringifyErrorForAdminLog(error));
    }
}

function installMobileRuntimeGuard(): void {
    if (!isMobile) return;
    let lastGuardAt = 0;
    const run = (reason: string, forceReset = false) => {
        const now = Date.now();
        if (!forceReset && now - lastGuardAt < 900) return;
        lastGuardAt = now;
        recoverMobileLayoutIfBroken(reason, forceReset);
    };
    window.addEventListener("resize", () => run("resize"), { passive: true });
    window.addEventListener("orientationchange", () => window.setTimeout(() => run("orientationchange"), 160), { passive: true });
    window.addEventListener("pageshow", () => window.setTimeout(() => {
        resumeRuntimeLoopsAfterForeground();
        run("pageshow");
    }, 80), { passive: true });
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) window.setTimeout(() => {
            resumeRuntimeLoopsAfterForeground();
            run("visibilitychange");
        }, 120);
    });
    window.visualViewport?.addEventListener("resize", () => run("visualViewport"), { passive: true });
    // 常時監視はスマホで描画・入力と競合しやすいため、起動直後だけ軽く補正します。
    window.setTimeout(() => run("startup-watchdog"), 1000);
}

function showRuntimeGuardLogPopup(): void {
    showPopup("スマホ復旧ログ", getRuntimeGuardLogHtml(readRuntimeGuardLogs()));
    document.getElementById("runtime-guard-recover-button")?.addEventListener("click", () => recoverMobileLayoutIfBroken("admin-manual", true));
    document.getElementById("runtime-guard-clear-button")?.addEventListener("click", () => {
        localStorage.removeItem(RUNTIME_GUARD_LOG_STORAGE_KEY);
        showRuntimeGuardLogPopup();
    });
}


function getEmergencyRuntimeLogText(): string {
    const rows = readRuntimeGuardLogs().slice().reverse();
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string; downlink?: number; rtt?: number } };
    const canvasRect = canvas.getBoundingClientRect();
    const gameRect = gameArea.getBoundingClientRect();
    const infoRect = info.getBoundingClientRect();
    const lines = [
        "=== MiracleBallLab Emergency Log ===",
        `time: ${new Date().toLocaleString()}`,
        `url: ${location.href}`,
        `userAgent: ${navigator.userAgent}`,
        `viewport: ${window.innerWidth}x${window.innerHeight}`,
        `visualViewport: ${Math.round(window.visualViewport?.width || 0)}x${Math.round(window.visualViewport?.height || 0)} scale=${window.visualViewport?.scale ?? "-"}`,
        `devicePixelRatio: ${window.devicePixelRatio}`,
        `deviceMemory: ${nav.deviceMemory ?? "-"}`,
        `connection: ${nav.connection?.effectiveType ?? "-"} down=${nav.connection?.downlink ?? "-"} rtt=${nav.connection?.rtt ?? "-"}`,
        `state: isMobile=${isMobile} started=${isStarted} paused=${isPaused} finished=${isFinished} settingsOpen=${isOverlayOpen(mobileSettingsOverlay)} popup=${helpOverlay.style.display}`,
        `canvasRect: ${Math.round(canvasRect.width)}x${Math.round(canvasRect.height)} @ ${Math.round(canvasRect.left)},${Math.round(canvasRect.top)}`,
        `gameAreaRect: ${Math.round(gameRect.width)}x${Math.round(gameRect.height)} @ ${Math.round(gameRect.left)},${Math.round(gameRect.top)}`,
        `infoRect: ${Math.round(infoRect.width)}x${Math.round(infoRect.height)} @ ${Math.round(infoRect.left)},${Math.round(infoRect.top)}`,
        `canvas attr: ${canvas.width}x${canvas.height}`,
        `body scroll: ${document.documentElement.scrollWidth}x${document.documentElement.scrollHeight}`,
        `runtimeLogs: ${rows.length}`,
        "--- logs ---",
        ...rows.map((entry, i) => `${i + 1}. [${new Date(entry.at).toLocaleString()}] ${entry.reason}: ${entry.detail}`),
    ];
    return lines.join("\n");
}

function showEmergencyRuntimeLogOverlay(reason = "manual"): void {
    try {
        addRuntimeGuardLog(`emergency-log:${reason}`, "emergency log overlay opened");
    } catch {
        // ignore
    }
    const existing = document.getElementById("miracle-emergency-log-overlay");
    existing?.remove();
    const overlay = document.createElement("div");
    overlay.id = "miracle-emergency-log-overlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483647";
    overlay.style.background = "rgba(0,0,0,.92)";
    overlay.style.color = "#f8fafc";
    overlay.style.padding = "14px";
    overlay.style.boxSizing = "border-box";
    overlay.style.overflow = "auto";
    overlay.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    overlay.style.touchAction = "auto";
    const text = getEmergencyRuntimeLogText();
    overlay.innerHTML = getEmergencyRuntimeLogOverlayHtml(text);
    document.body.appendChild(overlay);
    const close = document.getElementById("emergency-log-close") as HTMLButtonElement | null;
    const copy = document.getElementById("emergency-log-copy") as HTMLButtonElement | null;
    const recover = document.getElementById("emergency-log-recover") as HTMLButtonElement | null;
    const clear = document.getElementById("emergency-log-clear") as HTMLButtonElement | null;
    const textarea = document.getElementById("emergency-log-textarea") as HTMLTextAreaElement | null;
    close?.addEventListener("click", () => overlay.remove());
    copy?.addEventListener("click", async () => {
        const value = textarea?.value || getEmergencyRuntimeLogText();
        try {
            await navigator.clipboard?.writeText(value);
            copy.textContent = "コピーしました";
        } catch {
            textarea?.focus();
            textarea?.select();
            copy.textContent = "長押しコピーしてください";
        }
    });
    recover?.addEventListener("click", () => {
        recoverMobileLayoutIfBroken("emergency-manual", true);
        window.setTimeout(() => {
            textarea!.value = getEmergencyRuntimeLogText();
        }, 200);
    });
    clear?.addEventListener("click", () => {
        localStorage.removeItem(RUNTIME_GUARD_LOG_STORAGE_KEY);
        textarea!.value = getEmergencyRuntimeLogText();
    });
}

function installEmergencyRuntimeLogOpener(): void {
    if (location.search.includes("debug=1") || location.hash.toLowerCase().includes("debug")) {
        window.setTimeout(() => showEmergencyRuntimeLogOverlay("url"), 300);
    }
    let cornerTapCount = 0;
    let firstTapAt = 0;
    document.addEventListener("pointerup", (event) => {
        if (event.clientX > 72 || event.clientY > 72) return;
        const now = Date.now();
        if (now - firstTapAt > 2400) {
            firstTapAt = now;
            cornerTapCount = 0;
        }
        cornerTapCount++;
        if (cornerTapCount >= 5) {
            cornerTapCount = 0;
            showEmergencyRuntimeLogOverlay("corner-5tap");
        }
    }, { capture: true, passive: true });
}

const appHeader = document.createElement("div");
appHeader.className = "miracle-user-card";
appHeader.style.display = "flex";
appHeader.style.alignItems = "center";
appHeader.style.justifyContent = "space-between";
appHeader.style.gap = "12px";
appHeader.style.flexWrap = "wrap";
appHeader.style.marginBottom = "12px";
appHeader.style.padding = isMobile ? "12px 14px" : "10px 16px";
appHeader.style.borderRadius = "18px";
appHeader.style.background = getMetallicPanelBackground();
appHeader.style.border = "1px solid rgba(148,163,184,.42)";
appHeader.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.70), 0 10px 28px rgba(30,42,58,.14)";
info.appendChild(appHeader);

const appTitle = document.createElement("div");
appHeader.appendChild(appTitle);

const appHeaderNote = document.createElement("div");
appHeaderNote.textContent = "レア演出は運。超高速だと見逃しやすいです。";
appHeaderNote.style.fontSize = `${Math.max(14, uiFontPx - 5)}px`;
appHeaderNote.style.fontWeight = "800";
appHeaderNote.style.color = "#56663f";
appHeader.appendChild(appHeaderNote);

const recordHero = document.createElement("div");
recordHero.className = "miracle-record-hero";
recordHero.style.margin = "0 0 12px 0";
recordHero.style.padding = isMobile ? "14px 18px" : "12px 18px";
recordHero.style.borderRadius = "24px";
recordHero.style.background = "linear-gradient(135deg, #fff6cf 0%, #e3f0cc 55%, #dceec2 100%)";
recordHero.style.border = "1px solid rgba(87,112,51,0.24)";
recordHero.style.boxShadow = "0 10px 26px rgba(87,112,51,0.14)";
recordHero.style.color = "#26351f";
recordHero.style.fontWeight = "900";
recordHero.style.display = "flex";
recordHero.style.alignItems = "center";
recordHero.style.justifyContent = "space-between";
recordHero.style.gap = "12px";
recordHero.style.flexWrap = "wrap";
info.appendChild(recordHero);

const topRow = document.createElement("div");
topRow.style.display = "grid";
topRow.style.gridTemplateColumns = isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(170px, 1fr))";
topRow.style.gap = isMobile ? "10px 14px" : "8px 14px";
topRow.style.alignItems = "center";
// topRowは設定画面/情報エリアの最下部へ移動します。

const controlArea = document.createElement("div");
controlArea.style.display = "grid";
controlArea.style.gridTemplateColumns = isMobile ? "repeat(2,minmax(0,1fr))" : "repeat(auto-fit, minmax(150px, 1fr))";
controlArea.style.gap = isMobile ? "14px" : "10px 14px";
controlArea.style.marginTop = "14px";
controlArea.style.alignItems = "end";
controlArea.style.width = "100%";
controlArea.style.maxWidth = "100%";
controlArea.style.boxSizing = "border-box";
info.appendChild(controlArea);

const buttonArea = document.createElement("div");
buttonArea.style.display = "flex";
buttonArea.style.flexWrap = "wrap";
buttonArea.style.gap = isMobile ? "12px" : "10px";
buttonArea.style.marginTop = "14px";
buttonArea.style.width = "100%";
buttonArea.style.maxWidth = "100%";
buttonArea.style.boxSizing = "border-box";
info.appendChild(buttonArea);

const randomGraphArea = document.createElement("div");
randomGraphArea.style.marginTop = "14px";
info.appendChild(randomGraphArea);
info.appendChild(topRow);

function createField(label: string, input: HTMLElement): { wrapper: HTMLDivElement; labelEl: HTMLLabelElement } {
    return createFieldBase(label, input, { isMobile, uiFontPx, roundedUiFont: ROUNDED_UI_FONT });
}

function createInput(value: string, type = "text"): HTMLInputElement {
    return createInputBase(value, type, { isMobile, uiFontPx, roundedUiFont: ROUNDED_UI_FONT });
}

function createTextarea(value: string): HTMLTextAreaElement {
    return createTextareaBase(value, { isMobile, uiFontPx, roundedUiFont: ROUNDED_UI_FONT });
}

function applyUnifiedMetallicButtonStyle(button: HTMLButtonElement, primary = false): void {
    applyUnifiedMetallicButtonStyleBase(button, primary, { isMobile, uiFontPx, roundedUiFont: ROUNDED_UI_FONT });
}

function createButton(text: string, onClick: () => void): HTMLButtonElement {
    return createButtonBase(text, onClick, { isMobile, uiFontPx, roundedUiFont: ROUNDED_UI_FONT });
}

function setTooltip<T extends HTMLElement>(target: T, ja: string, en: string): T {
    tooltipRefs.push({ el: target, ja, en });
    target.setAttribute("data-tippy-content", isEnglish ? en : ja);
    target.setAttribute("aria-label", isEnglish ? en : ja);
    return target;
}

function updateTooltipText(): void {
    for (const item of tooltipRefs) {
        const content = isEnglish ? item.en : item.ja;
        item.el.setAttribute("data-tippy-content", content);
        item.el.setAttribute("aria-label", content);
        const tip = (item.el as any)._tippy;
        if (tip?.setContent) tip.setContent(content);
    }
}

function ensureExternalStyle(href: string): void {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}


type UiFieldRefs = { wrapper: HTMLDivElement; labelEl: HTMLLabelElement; ja: string; en: string };
const uiFieldRefs: UiFieldRefs[] = [];
const bilingualButtons: Array<{ button: HTMLButtonElement; ja: string; en: string }> = [];
const sectionTitles: Array<{ el: HTMLDivElement; ja: string; en: string }> = [];
const tooltipRefs: Array<{ el: HTMLElement; ja: string; en: string }> = [];

function setButtonLabel(button: HTMLButtonElement, ja: string, en: string): HTMLButtonElement {
    bilingualButtons.push({ button, ja, en });
    button.textContent = isEnglish ? en : ja;
    return button;
}

function createSection(titleJa: string, titleEn: string): HTMLDivElement {
    const section = document.createElement("div");
    section.className = "miracle-section";
    section.style.display = "flex";
    section.style.flexDirection = "column";
    section.style.gap = isMobile ? "8px" : "9px";
    section.style.padding = isMobile ? "11px" : "10px";
    section.style.borderRadius = "22px";
    section.style.background = getMetallicPanelBackground();
    section.style.border = "1px solid rgba(148,163,184,.38)";
    section.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.68), 0 10px 26px rgba(30,42,58,.12)";
    section.style.width = "100%";
    section.style.boxSizing = "border-box";

    const title = document.createElement("div");
    title.style.fontSize = `${Math.max(18, uiFontPx - 1)}px`;
    title.style.fontWeight = "900";
    title.style.color = "#334321";
    title.textContent = isEnglish ? titleEn : titleJa;
    section.appendChild(title);
    sectionTitles.push({ el: title, ja: titleJa, en: titleEn });

    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = isMobile ? "repeat(3,minmax(0,1fr))" : "repeat(auto-fit,minmax(128px,1fr))";
    row.style.alignItems = "center";
    row.style.gap = isMobile ? "8px" : "9px";
    section.appendChild(row);
    buttonArea.appendChild(section);
    return row;
}

function addField(wrapper: HTMLDivElement, labelEl: HTMLLabelElement, ja: string, en: string): void {
    uiFieldRefs.push({ wrapper, labelEl, ja, en });
    labelEl.textContent = isEnglish ? en : ja;
    controlArea.appendChild(wrapper);
}

function setSelectOptions(): void {
    probabilityModeSelect.innerHTML = isEnglish
        ? `
    <option value="normal">Normal: observe true low odds</option>
    <option value="festival">Festival: easier to witness effects</option>
    <option value="hard">Hard: much rarer</option>
    <option value="hell">Hell: miracles almost denied</option>
`
        : `
    <option value="normal">通常モード：低確率を真面目に観測</option>
    <option value="festival">祭りモード：演出を少し観測しやすい</option>
    <option value="hard">修羅モード：かなり出にくい</option>
    <option value="hell">地獄モード：奇跡ほぼ拒否</option>
`;
    probabilityModeSelect.value = settings.probabilityMode;
    effectModeSelect.value = settings.effectMode;
    themeAutoModeSelect.value = themeAutoMode;
}

function t(ja: string, en: string): string {
    return isEnglish ? en : ja;
}

const targetInput = createInput(String(settings.targetCount), "number");
targetInput.min = "1";
targetInput.step = "100";

const activeBallInput = createInput(String(settings.activeLimit), "number");
activeBallInput.min = "1";
activeBallInput.max = "300";

const binCountInput = createInput(String(settings.binCount), "number");
binCountInput.min = "2";
binCountInput.max = "30";

const pinRowInput = createInput(String(settings.pinRows), "number");
pinRowInput.min = "1";
pinRowInput.max = "30";

function compactPrimaryNumberInput(input: HTMLInputElement): void {
    input.style.width = isMobile ? "112px" : "128px";
    input.style.maxWidth = "50%";
    input.style.height = isMobile ? "34px" : "32px";
    input.style.padding = "4px 8px";
    input.style.borderRadius = "13px";
    input.style.fontSize = `${Math.max(13, uiFontPx - 6)}px`;
}
[targetInput, activeBallInput, binCountInput, pinRowInput].forEach(compactPrimaryNumberInput);

const settingsZoomInput = createInput(String(Math.round(settingsUiZoom * 100)), "range");
settingsZoomInput.min = "82";
settingsZoomInput.max = "122";
settingsZoomInput.step = "2";
settingsZoomInput.title = "設定画面の表示倍率";
settingsZoomInput.oninput = () => {
    settingsUiZoom = saveSettingsUiZoom(localStorage, clamp(Number(settingsZoomInput.value) / 100, SETTINGS_UI_ZOOM_MIN, SETTINGS_UI_ZOOM_MAX));
    applySettingsUiZoom();
};
settingsZoomInput.onchange = () => {
    showSoftToast(`設定画面ズーム: ${Math.round(settingsUiZoom * 100)}%`);
};

const backgroundInput = createInput(settings.backgroundImage, "text");
backgroundInput.placeholder = "例: /background.jpg または https://example.com/image.jpg";

const backgroundFileInput = document.createElement("input");
backgroundFileInput.type = "file";
backgroundFileInput.accept = "image/*";
backgroundFileInput.style.width = "100%";
backgroundFileInput.style.boxSizing = "border-box";
backgroundFileInput.style.padding = isMobile ? "16px 16px" : "12px 14px";
backgroundFileInput.style.borderRadius = "14px";
backgroundFileInput.style.border = "1px solid #b8c1d1";
backgroundFileInput.style.background = "#ffffff";
backgroundFileInput.style.fontSize = `${Math.max(18, uiFontPx - 2)}px`;
backgroundFileInput.onchange = () => {
    const file = backgroundFileInput.files?.[0];
    if (!file) return;
    if (selectedBackgroundObjectUrl) URL.revokeObjectURL(selectedBackgroundObjectUrl);
    selectedBackgroundObjectUrl = URL.createObjectURL(file);
    settings.backgroundImage = selectedBackgroundObjectUrl;
    backgroundInput.value = `選択した画像: ${file.name}`;
    applyBackgroundImage();
    showSoftToast(t("背景画像を変更しました", "Background image changed"));
};

const probabilityModeSelect = document.createElement("select");
probabilityModeSelect.value = settings.probabilityMode;
probabilityModeSelect.style.width = "100%";
probabilityModeSelect.style.boxSizing = "border-box";
probabilityModeSelect.style.padding = isMobile ? "16px 16px" : "12px 14px";
probabilityModeSelect.style.borderRadius = "18px";
probabilityModeSelect.style.border = "1px solid #b8c1d1";
probabilityModeSelect.style.background = "#ffffff";
probabilityModeSelect.style.fontSize = `${uiFontPx}px`;
probabilityModeSelect.style.fontWeight = "800";
probabilityModeSelect.onchange = () => {
    showSoftToast(`${t("確率モード", "Probability mode")}: ${probabilityModeSelect.options[probabilityModeSelect.selectedIndex]?.text ?? probabilityModeSelect.value}`);
};

const themeSelect = document.createElement("select");
themeSelect.style.width = "100%";
themeSelect.style.boxSizing = "border-box";
themeSelect.style.padding = isMobile ? "16px 16px" : "12px 14px";
themeSelect.style.borderRadius = "18px";
themeSelect.style.border = "1px solid #b8c1d1";
themeSelect.style.background = "#ffffff";
themeSelect.style.fontSize = `${uiFontPx}px`;
themeSelect.style.fontWeight = "800";
themeSelect.innerHTML = getThemeOptions().map((x) => `<option value="${x.value}">${isEnglish ? x.en : x.ja}</option>`).join("");
themeSelect.value = currentTheme;
themeSelect.onchange = () => {
    currentTheme = (themeSelect.value as ThemeMode) || "lab";
    themeAutoMode = "fixed";
    settings.themeAutoMode = themeAutoMode;
    if (themeAutoModeSelect) themeAutoModeSelect.value = themeAutoMode;
    markThemeUnlocked(currentTheme);
    applyTheme();
    persistUserPreferencesSoon();
    showSoftToast(`${t("テーマ", "Theme")}: ${themeSelect.options[themeSelect.selectedIndex]?.text ?? themeSelect.value}`);
};

const themeAutoModeSelect = document.createElement("select");
themeAutoModeSelect.style.width = "100%";
themeAutoModeSelect.style.boxSizing = "border-box";
themeAutoModeSelect.style.padding = isMobile ? "16px 16px" : "12px 14px";
themeAutoModeSelect.style.borderRadius = "18px";
themeAutoModeSelect.style.border = "1px solid #b8c1d1";
themeAutoModeSelect.style.background = "#ffffff";
themeAutoModeSelect.style.fontSize = `${uiFontPx}px`;
themeAutoModeSelect.style.fontWeight = "800";
function updateThemeAutoModeSelectLabels(): void {
    themeAutoModeSelect.innerHTML = isEnglish
        ? `<option value="fixed">Fixed theme</option><option value="time">Auto by time</option><option value="random">Random per run</option>`
        : `<option value="fixed">固定テーマ</option><option value="time">時間帯で自動</option><option value="random">実験ごとにランダム</option>`;
    themeAutoModeSelect.value = themeAutoMode;
}
updateThemeAutoModeSelectLabels();
themeAutoModeSelect.onchange = () => {
    themeAutoMode = (themeAutoModeSelect.value as ThemeAutoMode) || "fixed";
    settings.themeAutoMode = themeAutoMode;
    applyAutoTheme("select");
    persistUserPreferencesSoon();
};

const effectModeSelect = document.createElement("select");
effectModeSelect.style.width = "100%";
effectModeSelect.style.boxSizing = "border-box";
effectModeSelect.style.padding = isMobile ? "16px 16px" : "12px 14px";
effectModeSelect.style.borderRadius = "18px";
effectModeSelect.style.border = "1px solid #b8c1d1";
effectModeSelect.style.background = "#ffffff";
effectModeSelect.style.fontSize = `${uiFontPx}px`;
effectModeSelect.style.fontWeight = "800";
function updateEffectModeSelectLabels(): void {
    effectModeSelect.innerHTML = isEnglish
        ? `<option value="quiet">Quiet: fewer effects</option><option value="normal">Normal</option><option value="flashy">Flashy</option><option value="recording">Recording: clear and longer</option>`
        : `<option value="quiet">控えめ：演出少なめ</option><option value="normal">通常：標準演出</option><option value="flashy">派手：演出強め</option><option value="recording">録画向け：見栄え優先</option>`;
    effectModeSelect.value = settings.effectMode;
}
updateEffectModeSelectLabels();
setSelectOptions();
effectModeSelect.onchange = () => {
    settings.effectMode = (effectModeSelect.value as EffectMode) || "normal";
    themeAutoMode = (themeAutoModeSelect.value as ThemeAutoMode) || themeAutoMode;
    settings.themeAutoMode = themeAutoMode;
    showSoftToast(`${t("演出モード", "Effect mode")}: ${getEffectModeLabel()}`);
    updateStatusMiniOverlays();
};

binCountInput.addEventListener("blur", () => autoApplyLayoutSetting());
pinRowInput.addEventListener("blur", () => autoApplyLayoutSetting());

const targetField = createField("投下数", targetInput);
addField(targetField.wrapper, targetField.labelEl, "投下数", "Ball count");
const activeField = createField("同時に出す玉数", activeBallInput);
addField(activeField.wrapper, activeField.labelEl, "同時に出す玉数", "Simultaneous balls");
const binField = createField("下の受け皿数", binCountInput);
addField(binField.wrapper, binField.labelEl, "下の受け皿数", "Bottom bins");
const pinField = createField("ピン段数", pinRowInput);
addField(pinField.wrapper, pinField.labelEl, "ピン段数", "Pin rows");
const bgField = createField("背景画像URL", backgroundInput);
// 背景画像URL入力は不要になったため、画面には表示しません。
const bgFileField = createField("背景画像を写真から選択", backgroundFileInput);
addField(bgFileField.wrapper, bgFileField.labelEl, "背景画像を写真から選択", "Choose background photo");
const probField = createField("確率モード", probabilityModeSelect);
addField(probField.wrapper, probField.labelEl, "確率モード", "Probability mode");
const themeField = createField("テーマ切替", themeSelect);
addField(themeField.wrapper, themeField.labelEl, "テーマ切替", "Theme");
const themeAutoField = createField("テーマ運用", themeAutoModeSelect);
addField(themeAutoField.wrapper, themeAutoField.labelEl, "テーマ運用", "Theme mode");
const effectModeField = createField("演出モード", effectModeSelect);
addField(effectModeField.wrapper, effectModeField.labelEl, "演出モード", "Effect mode");
const settingsZoomField = createField("設定画面ズーム", settingsZoomInput);
addField(settingsZoomField.wrapper, settingsZoomField.labelEl, "設定画面ズーム", "Settings zoom");

const utilityButtons = createSection("実験メニュー", "Experiment");
const speedButtons = createSection("投下速度", "Drop speed");
const displayButtons = createSection("表示・演出", "Display & effects");
const settingButtons = createSection("反映・出力", "Apply & export");

const homeButton = setTooltip(setButtonLabel(createButton("研究所ホーム", () => showLabHome()), "研究所ホーム", "Home"), "研究所ホーム画面を開きます。", "Open the lab home screen.");
utilityButtons.appendChild(homeButton);
const worldMapButton = setTooltip(setButtonLabel(createButton("研究所マップ", () => showResearchWorldMapPopup()), "研究所マップ", "Lab map"), "研究所の各部屋から機能へ移動します。", "Move through lab rooms and features.");
utilityButtons.appendChild(worldMapButton);
const miracleGachaButton = setTooltip(setButtonLabel(createButton("奇跡ガチャ", () => showMiracleGachaPopup()), "奇跡ガチャ", "Gacha"), "保存動画や超レア演出と連動するド派手なガチャを開きます。", "Open the dramatic miracle gacha.");
utilityButtons.appendChild(miracleGachaButton);
const researchShopButton = setTooltip(setButtonLabel(createButton("研究所ショップ", () => showResearchShopPopup()), "研究所ショップ", "Shop"), "奇跡ガチャPやチケットで研究所設備を購入します。", "Buy lab facilities with gacha points and tickets.");
utilityButtons.appendChild(researchShopButton);
const seasonButton = setTooltip(setButtonLabel(createButton("イベントシーズン", () => showEventSeasonPopup()), "イベントシーズン", "Season"), "開催中の研究イベントと限定報酬を表示します。", "Show the active research season and rewards.");
utilityButtons.appendChild(seasonButton);
const craftButton = setTooltip(setButtonLabel(createButton("奇跡クラフト", () => showMiracleCraftPopup()), "奇跡クラフト", "Craft"), "発見済み奇跡を素材条件にして報酬を錬成します。", "Craft rewards from discovered miracle records.");
utilityButtons.appendChild(craftButton);
const bossExperimentButton = setTooltip(setButtonLabel(createButton("ボス実験", () => showBossExperimentPopup()), "ボス実験", "Boss"), "特殊ルール付きの高難度ボス実験を開始します。", "Start high-difficulty boss experiments.");
utilityButtons.appendChild(bossExperimentButton);
const multiverseButton = setTooltip(setButtonLabel(createButton("多元宇宙遠征", () => showMultiverseExpeditionPopup()), "多元宇宙遠征", "Multiverse"), "物理法則の異なる宇宙へ遠征し、宇宙片と遺物を持ち帰ります。", "Explore universes with altered laws of physics.");
utilityButtons.appendChild(multiverseButton);
const presetButton = setTooltip(setButtonLabel(createButton("実験プリセット", () => showExperimentPresetPopup()), "実験プリセット", "Presets"), "よく使う設定をまとめて反映します。", "Apply bundled experiment settings.");
utilityButtons.appendChild(presetButton);
const magicCircleButton = setTooltip(setButtonLabel(createButton("魔法陣を書く", () => enableMagicCircleMode()), "魔法陣を書く", "Magic circle"), "画面を指やマウスでなぞって、大量のの盤面魔法を発動します。", "Draw on the board to trigger magic effects.");
utilityButtons.appendChild(magicCircleButton);
tiltExperimentButton = setTooltip(setButtonLabel(createButton("傾き実験: OFF", () => { void toggleTiltExperimentMode(); }), "傾き実験: OFF", "Tilt: OFF"), "スマホを傾けて玉の流れを少し変えます。", "Tilt your phone to influence gravity.");
utilityButtons.appendChild(tiltExperimentButton);
const outsideBallButton = setTooltip(setButtonLabel(createButton("外から玉侵入", () => spawnExternalIntruderBalls(14, "button")), "外から玉侵入", "Intruder balls"), "画面外から玉を侵入させます。", "Spawn balls from outside the screen.");
utilityButtons.appendChild(outsideBallButton);
const temporaryPinButton = setTooltip(setButtonLabel(createButton("観測ピン設置", () => enableTemporaryPinPlacement()), "観測ピン設置", "Temp pin"), "次に盤面をタップした場所へ一時ピンを置きます。", "Place a temporary pin on the board.");
utilityButtons.appendChild(temporaryPinButton);
const runButton = setTooltip(setButtonLabel(createButton("実行", () => startExperiment()), "実行", "Run"), "設定どおりに落下実験を開始します。", "Start the drop experiment with current settings.");
utilityButtons.appendChild(runButton);
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("この実験について", () => showAboutPopup()), "この実験について", "About"), "このプログラムが何をするか説明します。", "Explain what this program does."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("ユーザー設定", () => showUserSettingsPopup()), "ユーザー設定", "User"), "ニックネーム、遊び方、保存データを確認します。", "Manage nickname, play style, and local data."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("アプリ情報", () => showAppInfoPopup()), "アプリ情報", "App info"), "オフライン、プライバシー、保存情報を表示します。", "Show offline, privacy, and saved data information."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("ボタン説明", () => showButtonHelpPopup()), "ボタン説明", "Buttons"), "各ボタンの役割を一覧表示します。", "Show a list of what each button does."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("奇跡図鑑", () => showMiracleBookPopup()), "奇跡図鑑", "Miracle book"), "レア玉の一覧と発見回数を見ます。", "View rare drops and discovery counts."));
missionButton = setTooltip(setButtonLabel(createButton("ミッション", () => showMissionPopup()), "ミッション", "Missions"), "達成条件と報酬スコアを確認します。", "Check missions and score rewards.");
utilityButtons.appendChild(missionButton);
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("最高記録", () => showRecordsPopup()), "最高記録", "Records"), "最高記録や通算記録を表示します。", "Show best and lifetime records."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("奇跡ログ", () => showMiracleLogPopup()), "奇跡ログ", "Miracle log"), "発生した奇跡の履歴を見ます。", "Show the history of miracles."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("奇跡アルバム", () => showMiracleAlbumPopup()), "奇跡アルバム", "Album"), "過去の神引きと研究レポートをカード形式で見ます。", "View miracle highlights and research reports."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("研究アーカイブ", () => showResearchArchivePopup()), "研究アーカイブ", "Archive"), "過去の研究レポートを集計・詳細表示します。", "Browse and inspect saved research reports."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("ガチャ履歴", () => showGachaRewardBookPopup()), "ガチャ履歴", "Gacha log"), "奇跡ガチャの排出と報酬履歴を表示します。", "Show gacha results and reward history."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("今日の運勢", () => showDailyFortunePopup()), "今日の運勢", "Fortune"), "今日の奇跡率とラッキー受け皿を表示します。", "Show today's miracle rate and lucky bin."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("デイリー研究", () => showDailyMissionPopup()), "デイリー研究", "Daily"), "今日だけの強化ミッションを表示します。", "Show enhanced daily missions."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("研究員ランク", () => showResearchRankPopup()), "研究員ランク", "Rank"), "研究員ランクと次の称号を表示します。", "Show researcher rank and progress."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("テーマ図鑑", () => showThemeBookPopup()), "テーマ図鑑", "Themes"), "テーマの一覧と解放条件を表示します。", "Show themes and unlock conditions."));
familiarButton = setTooltip(setButtonLabel(createButton(`使い魔 Lv.${familiarState.level}`, () => showFamiliarPopup()), `使い魔 Lv.${familiarState.level}`, `Familiar Lv.${familiarState.level}`), "使い魔の育成・呼び出し・秘密契約を開きます。", "Open familiar training, summon, and secret contracts.");
utilityButtons.appendChild(familiarButton);
miracleTicketButton = setTooltip(setButtonLabel(createButton(`奇跡チケット ${miracleTicketState.normal}`, () => showMiracleTicketPopup()), `奇跡チケット ${miracleTicketState.normal}`, `Tickets ${miracleTicketState.normal}`), "奇跡観測で集めたチケットを使ってブーストできます。", "Use tickets earned from miracle discoveries.");
utilityButtons.appendChild(miracleTicketButton);
secretNoteButton = setTooltip(setButtonLabel(createButton(`秘密ノート ${Object.keys(secretResearchNoteState.unlocked).length}`, () => showSecretResearchNotePopup()), `秘密ノート ${Object.keys(secretResearchNoteState.unlocked).length}`, `Secret notes ${Object.keys(secretResearchNoteState.unlocked).length}`), "条件達成で解放される秘密研究ノートを表示します。", "Open unlockable secret research notes.");
utilityButtons.appendChild(secretNoteButton);
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("奇跡合成", () => showFusionPopup()), "奇跡合成", "Fusion"), "奇跡同士の合成・派生記録を表示します。", "Show miracle fusion records."));
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("秘密", () => showSecretPopup()), "秘密", "Secret"), "裏コマンドの解放状況を表示します。", "Show secret command unlocks."));
adminButton = setTooltip(setButtonLabel(createButton(isAdminMode ? "主任モード" : "合言葉", () => showAdminGateOrPanel()), isAdminMode ? "主任モード" : "合言葉", isAdminMode ? "Admin" : "Passcode"), "合言葉で研究主任モードを開きます。", "Open the admin mode with a passcode.");
utilityButtons.appendChild(adminButton);
utilityButtons.appendChild(setTooltip(setButtonLabel(createButton("研究レポート", () => showResearchReportPopup()), "研究レポート", "Report"), "現在の実験状況をまとめます。", "Summarize the current experiment."));
const replayButton = setTooltip(setButtonLabel(createButton("リプレイ", () => showReplayPopup()), "リプレイ", "Replay"), "奇跡クリップを再生・GIF保存します。", "Play or export miracle clips as GIF.");
utilityButtons.appendChild(replayButton);
shareButton = setTooltip(setButtonLabel(createButton("録画・SNS", () => showSharePopup()), "録画・SNS", "Share"), "投稿文コピーやSNSカード保存を行います。", "Copy a share caption or save a social card.");
utilityButtons.appendChild(shareButton);

const languageButton = setTooltip(setButtonLabel(createButton("English", () => {
    isEnglish = !isEnglish;
    updateUiLanguage();
    updateStopButton();
    updateInfo();
}), "English", "日本語"), "表示言語を切り替えます。", "Switch the display language.");
utilityButtons.appendChild(languageButton);

// よく使う操作を先頭へまとめる。append済み要素をprependするとDOM上で移動されるため安全です。
utilityButtons.prepend(runButton, bossExperimentButton, miracleGachaButton, researchShopButton, seasonButton, craftButton, presetButton, magicCircleButton, worldMapButton, homeButton);

const speedButtonRefs: Record<string, HTMLButtonElement> = {};

function updateSpeedButtons(): void {
    const themePalette = getThemeUiPalette(currentTheme);
    const uiAccent = getUiAccentPaletteByKind(getCurrentUiAccentKind());
    const onBg = uiAccent?.badge ?? themePalette.badge;
    const onText = uiAccent?.badgeText ?? themePalette.badgeText;
    const onBorder = uiAccent?.border ?? themePalette.buttonBorder;
    const offBg = settings.blackModeEnabled ? "linear-gradient(180deg,#172033 0%,#0f172a 100%)" : themePalette.buttonBg;
    const offText = settings.blackModeEnabled ? "#f8fafc" : themePalette.buttonText;
    const offBorder = settings.blackModeEnabled ? "#64748b" : themePalette.buttonBorder;
    for (const [label, button] of Object.entries(speedButtonRefs)) {
        const selected = speedLabelText === label;
        button.style.background = selected ? onBg : offBg;
        button.style.color = selected ? onText : offText;
        button.style.borderColor = selected ? onBorder : offBorder;
        button.style.boxShadow = selected ? "inset 0 3px 10px rgba(0,0,0,.34), 0 0 0 2px rgba(255,255,255,.28)" : "0 6px 16px rgba(0,0,0,.12)";
        button.style.transform = selected ? "translateY(2px)" : "translateY(0)";
        button.style.filter = selected ? "brightness(.96)" : "";
    }
}

function createSpeedButton(label: string, en: string, jaTip: string, enTip: string): HTMLButtonElement {
    const button = setTooltip(setButtonLabel(createButton(label, () => changeSpeed(label)), label, en), jaTip, enTip);
    speedButtonRefs[label] = button;
    speedButtons.appendChild(button);
    return button;
}

function changeSpeed(label: string): void {
    speedLabelText = label;
    engine.timing.timeScale = getCurrentTimeScale();
    updateSpeedButtons();
    updateInfo();
    saveUserPreferencesFromCurrentState();
    showSoftToast(`${getSpeedDisplayLabel()}${t("に変更しました", " selected")}`);
}

createSpeedButton("超低速", "Very slow", "かなりゆっくり進めます。観察向けです。", "Very slow for close observation.");
createSpeedButton("低速", "Slow", "ゆっくり進めます。", "Run slowly.");
createSpeedButton("通常", "Normal", "標準速度で観測します。", "Observe at standard speed.");
createSpeedButton("高速", "Fast", "やや速めに流します。", "Run the simulation faster.");
createSpeedButton("超高速", "Ultra", "かなり速いので演出を見逃しやすいです。", "Very fast and easier to miss effects.");
updateSpeedButtons();

const stopButton = setTooltip(setButtonLabel(createButton("ストップ", () => togglePause()), "ストップ", "Stop"), "実験を一時停止・再開します。", "Pause or resume the experiment.");
stopButton.addEventListener("touchend", (event) => { event.preventDefault(); togglePause(); }, { passive: false });
displayButtons.appendChild(stopButton);

const terminateButton = setTooltip(setButtonLabel(createButton("終了", () => terminateExperimentSafely()), "終了", "Exit"), "スマホで閉じる前に物理エンジンと描画を停止し、裏側で動き続けないようにします。", "Stop the physics engine and rendering before closing on mobile.");
displayButtons.appendChild(terminateButton);
const shockwaveButton = setTooltip(setButtonLabel(createButton("衝撃波 ×2", () => useSkill("shockwave")), "衝撃波 ×2", "Shockwave ×2"), "画面中央から玉を散らすスキルです。", "Scatter balls from the center.");
const magnetButton = setTooltip(setButtonLabel(createButton("磁石 ×2", () => useSkill("magnet")), "磁石 ×2", "Magnet ×2"), "一定時間、上位の受け皿へ吸い寄せます。", "Pull balls toward the current top bin for a while.");
const timeStopButton = setTooltip(setButtonLabel(createButton("時止め ×1", () => useSkill("timeStop")), "時止め ×1", "Time stop ×1"), "短時間だけ時間を止めて盤面を立て直します。", "Temporarily stop time to regain control.");
skillButtons.shockwave = shockwaveButton;
skillButtons.magnet = magnetButton;
skillButtons.timeStop = timeStopButton;
displayButtons.appendChild(shockwaveButton);
displayButtons.appendChild(magnetButton);
displayButtons.appendChild(timeStopButton);

displayButtons.appendChild(setTooltip(setButtonLabel(createButton("リセット", () => {
    if (!applySettingsFromInputs(true)) return;
    resetExperiment(false);
    showSoftToast(t("リセットしました", "Reset complete"));
}), "リセット", "Reset"), "盤面を作り直して最初からにします。", "Rebuild the board and start fresh."));

const simpleModeButton = setTooltip(setButtonLabel(createButton("シンプル: OFF", () => {
    settings.simpleMode = !settings.simpleMode;
    applyBlackMode();
    updateSimpleModeButton();
    updateBlackModeButton();
    updateInfo();
    showSoftToast(settings.simpleMode ? t("シンプル表示をONにしました", "Simple mode enabled") : t("シンプル表示をOFFにしました", "Simple mode disabled"));
}), "シンプル: OFF", "Simple: OFF"), "演出を軽くして見やすくします。", "Reduce effects for a lighter view.");
displayButtons.appendChild(simpleModeButton);

const blackModeButton = setTooltip(setButtonLabel(createButton("ブラック: OFF", () => {
    settings.blackModeEnabled = !settings.blackModeEnabled;
    applyBlackMode();
    updateBlackModeButton();
    updateInfo();
    showSoftToast(settings.blackModeEnabled ? t("ブラックモードをONにしました", "Black mode enabled") : t("ブラックモードをOFFにしました", "Black mode disabled"));
}), "ブラック: OFF", "Black: OFF"), "UI全体を黒基調にします。デフォルトはOFFです。", "Turn the entire UI dark. Default is off.");
displayButtons.appendChild(blackModeButton);

const slowMiracleButton = setTooltip(setButtonLabel(createButton("演出ゆっくり: OFF", () => {
    settings.slowMiracleEffects = !settings.slowMiracleEffects;
    updateSlowMiracleButton();
    updateInfo();
    showSoftToast(settings.slowMiracleEffects ? t("演出ゆっくりをONにしました", "Slow effects enabled") : t("演出ゆっくりをOFFにしました", "Slow effects disabled"));
}), "演出ゆっくり: OFF", "Slow effects: OFF"), "奇跡演出だけを少し長く見せます。デフォルトはOFFです。", "Show miracle effects a little longer. Default is off.");
displayButtons.appendChild(slowMiracleButton);

const effectsButton = setTooltip(setButtonLabel(createButton("演出: OFF", () => {
    settings.effectsEnabled = !settings.effectsEnabled;
    updateEffectsButton();
    showSoftToast(settings.effectsEnabled ? t("演出をONにしました", "Effects enabled") : t("演出をOFFにしました", "Effects disabled"));
    updateStatusMiniOverlays();
}), "演出: OFF", "Effects: OFF"), "奇跡演出・画面効果・エンディング演出をまとめてON/OFFします。デフォルトはOFFです。", "Toggle visual effects. Default is off.");
displayButtons.appendChild(effectsButton);

const commentaryButton = setTooltip(setButtonLabel(createButton("実況ログ: ON", () => {
    settings.commentaryEnabled = !settings.commentaryEnabled;
    updateCommentaryButton();
    if (!settings.commentaryEnabled) hideCommentaryNow();
    showSoftToast(settings.commentaryEnabled ? t("実況ログをONにしました", "Commentary enabled") : t("実況ログをOFFにしました", "Commentary disabled"));
}), "実況ログ: ON", "Commentary: ON"), "画面下にたまに流れる実況ログをON/OFFします。デフォルトはONです。", "Toggle occasional commentary at the bottom. Default is on.");
displayButtons.appendChild(commentaryButton);

const boardAnomalyButton = setTooltip(setButtonLabel(createButton("盤面変異: ON", () => {
    settings.boardAnomalyEnabled = !settings.boardAnomalyEnabled;
    updateBoardAnomalyButton();
    if (!settings.boardAnomalyEnabled) clearBoardAnomaly();
    showSoftToast(settings.boardAnomalyEnabled ? t("盤面変異イベントをONにしました", "Board anomalies enabled") : t("盤面変異イベントをOFFにしました", "Board anomalies disabled"));
    updateStatusMiniOverlays();
}), "盤面変異: ON", "Anomaly: ON"), "横重力や上昇気流などの盤面変異イベントをON/OFFします。デフォルトはONです。", "Toggle board anomaly events. Default is on.");
displayButtons.appendChild(boardAnomalyButton);

const normalTraitButton = setTooltip(setButtonLabel(createButton("個体差: ON", () => {
    settings.normalBallTraitsEnabled = !settings.normalBallTraitsEnabled;
    updateNormalTraitButton();
    showSoftToast(settings.normalBallTraitsEnabled ? t("通常玉の個体差をONにしました", "Ball traits enabled") : t("通常玉の個体差をOFFにしました", "Ball traits disabled"));
}), "個体差: ON", "Traits: ON"), "通常玉の重い玉・跳ね玉などをON/OFFします。デフォルトはONです。", "Toggle normal ball traits. Default is on.");
displayButtons.appendChild(normalTraitButton);

const timeBallSkinButton = setTooltip(setButtonLabel(createButton("時間帯玉: ON", () => {
    settings.timeBallSkinsEnabled = !settings.timeBallSkinsEnabled;
    updateTimeBallSkinButton();
    updateStatusMiniOverlays();
    showSoftToast(settings.timeBallSkinsEnabled ? t("時間帯で玉の見た目を変えます", "Time ball skins enabled") : t("時間帯玉をOFFにしました", "Time ball skins disabled"));
}), "時間帯玉: ON", "Time skins: ON"), "時刻や曜日で通常玉の見た目だけを変えます。物理挙動は変わりません。デフォルトはONです。", "Change only normal-ball appearance by time/day. Physics does not change. Default is on.");
displayButtons.appendChild(timeBallSkinButton);

familiarToggleButton = setTooltip(setButtonLabel(createButton("使い魔: ON", () => {
    settings.familiarEnabled = !settings.familiarEnabled;
    updateFamiliarButton();
    updateInfo();
    persistUserPreferencesSoon();
    showSoftToast(settings.familiarEnabled ? t("使い魔表示をONにしました", "Familiar enabled") : t("使い魔表示をOFFにしました", "Familiar disabled"));
}), "使い魔: ON", "Familiar: ON"), "使い魔の表示と自動補助をON/OFFします。", "Toggle familiar display and auto assist.");
displayButtons.appendChild(familiarToggleButton);

const mobileCompactButton = setTooltip(setButtonLabel(createButton("スマホ簡易: OFF", () => {
    settings.mobileCompactMode = !settings.mobileCompactMode;
    updateMobileCompactButton();
    applyMobileCompactMode();
    showSoftToast(settings.mobileCompactMode ? t("スマホ簡易表示をONにしました", "Mobile compact enabled") : t("スマホ簡易表示をOFFにしました", "Mobile compact disabled"));
}), "スマホ簡易: OFF", "Compact: OFF"), "スマホで情報量を減らす簡易表示です。", "Reduce on-screen information on mobile.");
displayButtons.appendChild(mobileCompactButton);

const lowSpecButton = setTooltip(setButtonLabel(createButton("低スペック: OFF", () => {
    settings.lowSpecMode = !settings.lowSpecMode;
    applyLowSpecMode();
    updateLowSpecButton();
    updateInfo();
    saveUserPreferencesFromCurrentState();
    showSoftToast(settings.lowSpecMode ? t("低スペックモードをONにしました", "Low-spec mode enabled") : t("低スペックモードをOFFにしました", "Low-spec mode disabled"));
}), "低スペック: OFF", "Low spec: OFF"), "スマホや低スペック端末向けに動画・演出・背景を軽くします。", "Reduce video, effects, and background load for weaker devices.");
displayButtons.appendChild(lowSpecButton);

const offlineBookButton = setTooltip(setButtonLabel(createButton("オフライン図鑑", () => { void showOfflineMiracleBookPopup(); }), "オフライン図鑑", "Offline book"), "保存済み動画、研究ランク、再生テストを表示します。", "Show saved videos, storage rank, and test playback.");
displayButtons.appendChild(offlineBookButton);
const offlineLabButton = setTooltip(setButtonLabel(createButton("オフライン研究所", () => { void showOfflineLabHomePopup(); }), "オフライン研究所", "Offline lab"), "ミッション、称号、ランダム鑑賞、専用ガチャ、自分の動画登録をまとめて開きます。", "Open offline missions, titles, theater, gacha, and custom videos.");
displayButtons.appendChild(offlineLabButton);

const recentMiracleDisplayButton = setTooltip(setButtonLabel(createButton("直近の奇跡: OFF", () => {
    settings.showRecentMiracles = !settings.showRecentMiracles;
    updateRecentMiracleDisplayButton();
    showSoftToast(settings.showRecentMiracles ? t("直近の奇跡表示をONにしました", "Recent miracle display enabled") : t("直近の奇跡表示をOFFにしました", "Recent miracle display disabled"));
    updateRecentMiracleMini();
}), "直近の奇跡: OFF", "Recent: OFF"), "画面右下に直近3件の奇跡を表示します。デフォルトはOFFです。", "Show the latest three miracles. Default is off.");
displayButtons.appendChild(recentMiracleDisplayButton);

const cameraShakeButton = setTooltip(setButtonLabel(createButton("画面揺れ: ON", () => {
    settings.cameraShakeEnabled = !settings.cameraShakeEnabled;
    updateCameraShakeButton();
    showSoftToast(settings.cameraShakeEnabled ? t("画面揺れをONにしました", "Screen shake enabled") : t("画面揺れをOFFにしました", "Screen shake disabled"));
}), "画面揺れ: ON", "Shake: ON"), "画面揺れ演出のON/OFFを切り替えます。", "Toggle screen shake effects on or off.");
displayButtons.appendChild(cameraShakeButton);

const soundButton = setTooltip(setButtonLabel(createButton("音: ON", () => toggleSound()), "音: ON", "Sound: ON"), "効果音のON/OFFを切り替えます。", "Toggle sound effects on or off.");
displayButtons.appendChild(soundButton);

const confettiButton = setTooltip(setButtonLabel(createButton("紙吹雪: ON", () => {
    confettiEnabled = !confettiEnabled;
    confettiButton.textContent = confettiEnabled ? t("紙吹雪: ON", "Confetti: ON") : t("紙吹雪: OFF", "Confetti: OFF");
    showSoftToast(confettiEnabled ? t("紙吹雪をONにしました", "Confetti enabled") : t("紙吹雪をOFFにしました", "Confetti disabled"));
}), "紙吹雪: ON", "Confetti: ON"), "紙吹雪演出のON/OFFです。", "Toggle confetti effects." );
displayButtons.appendChild(confettiButton);

const pixiButton = setTooltip(setButtonLabel(createButton("Pixi背景: OFF", () => togglePixiBackground()), "Pixi背景: OFF", "Pixi BG: OFF"), "Pixi.jsの背景演出を切り替えます。", "Toggle the Pixi.js background effects.");
displayButtons.appendChild(pixiButton);
const verticalButton = setTooltip(setButtonLabel(createButton("縦動画: OFF", () => toggleVerticalVideoMode()), "縦動画: OFF", "Vertical: OFF"), "縦長動画向けの表示に寄せます。", "Adapt the view for vertical video." );
displayButtons.appendChild(verticalButton);
const obsButton = setTooltip(setButtonLabel(createButton("OBS: OFF", () => toggleObsMode()), "OBS: OFF", "OBS: OFF"), "OBS録画しやすい表示に切り替えます。", "Adjust the view for OBS recording." );
displayButtons.appendChild(obsButton);

settingButtons.appendChild(setTooltip(setButtonLabel(createButton("設定反映", () => {
    if (!applySettingsFromInputs(true)) return;
    resetExperiment(false);
    showSoftToast(t("設定を反映しました", "Settings applied"));
}), "設定反映", "Apply settings"), "入力した設定を盤面へ反映します。", "Apply the input settings to the board."));


settingButtons.appendChild(setTooltip(setButtonLabel(createButton("結果コピー", () => copyResultCsv()), "結果コピー", "Copy result"), "結果をCSV形式でコピーします。", "Copy the result as CSV."));
settingButtons.appendChild(setTooltip(setButtonLabel(createButton("CSV保存", () => downloadResultCsv()), "CSV保存", "Save CSV"), "結果CSVを保存します。", "Save the result as CSV."));
updateUiLanguage();
updateAdminButton();
void ensureTippyReady();
if (isMobile) setupMobileLayout();

const resultOverlay = document.createElement("div");
resultOverlay.style.position = "fixed";
resultOverlay.style.left = "0";
resultOverlay.style.top = "0";
resultOverlay.style.width = "100vw";
resultOverlay.style.height = "var(--miracle-app-height, 100vh)";
resultOverlay.style.background = "rgba(5, 8, 18, 0.86)";
resultOverlay.style.color = "#ffffff";
resultOverlay.style.zIndex = "100";
resultOverlay.style.display = "none";
resultOverlay.style.alignItems = "center";
resultOverlay.style.justifyContent = "center";
resultOverlay.style.textAlign = "center";
resultOverlay.style.padding = "28px";
resultOverlay.style.boxSizing = "border-box";
document.body.appendChild(resultOverlay);

resultOverlay.addEventListener("click", (event) => {
    if (event.target === resultOverlay) closeFinalResult();
});
window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && resultOverlay.style.display !== "none") closeFinalResult();
    if (event.key === "1") useSkill("shockwave");
    if (event.key === "2") useSkill("magnet");
    if (event.key === "3") useSkill("timeStop");
});

const milestoneOverlay = document.createElement("div");
milestoneOverlay.style.position = "fixed";
milestoneOverlay.style.left = "50%";
milestoneOverlay.style.top = "34%";
milestoneOverlay.style.transform = "translate(-50%, -50%)";
milestoneOverlay.style.zIndex = "90";
milestoneOverlay.style.padding = "20px 34px";
milestoneOverlay.style.borderRadius = "22px";
milestoneOverlay.style.background = "linear-gradient(135deg, rgba(255,240,120,0.96), rgba(255,165,70,0.96))";
milestoneOverlay.style.color = "#2b2100";
milestoneOverlay.style.fontSize = isMobile ? "48px" : "44px";
milestoneOverlay.style.fontWeight = "900";
milestoneOverlay.style.boxShadow = "0 16px 38px rgba(0,0,0,0.35)";
milestoneOverlay.style.display = "none";
document.body.appendChild(milestoneOverlay);

const celebrationOverlay = document.createElement("div");
celebrationOverlay.style.position = "fixed";
celebrationOverlay.style.left = "0";
celebrationOverlay.style.top = "0";
celebrationOverlay.style.width = "100vw";
celebrationOverlay.style.height = "var(--miracle-app-height, 100vh)";
celebrationOverlay.style.zIndex = "80";
celebrationOverlay.style.pointerEvents = "none";
celebrationOverlay.style.display = "none";
celebrationOverlay.style.overflow = "hidden";
celebrationOverlay.style.alignItems = "center";
celebrationOverlay.style.justifyContent = "center";
celebrationOverlay.style.textAlign = "center";
document.body.appendChild(celebrationOverlay);

const miracleOverlay = document.createElement("div");
miracleOverlay.style.position = "fixed";
miracleOverlay.style.left = "0";
miracleOverlay.style.top = "0";
miracleOverlay.style.width = "100vw";
miracleOverlay.style.height = "var(--miracle-app-height, 100vh)";
miracleOverlay.style.zIndex = "120";
miracleOverlay.style.pointerEvents = "none";
miracleOverlay.style.display = "none";
miracleOverlay.style.alignItems = "center";
miracleOverlay.style.justifyContent = "center";
miracleOverlay.style.textAlign = "center";
miracleOverlay.style.background = "rgba(0,0,0,0.72)";
miracleOverlay.style.color = "#fff";
miracleOverlay.style.padding = "24px";
miracleOverlay.style.boxSizing = "border-box";
document.body.appendChild(miracleOverlay);
const remoteMiracleVideoOverlay = document.createElement("div");
remoteMiracleVideoOverlay.style.position = "fixed";
remoteMiracleVideoOverlay.style.left = "0";
remoteMiracleVideoOverlay.style.top = "0";
remoteMiracleVideoOverlay.style.width = "100vw";
remoteMiracleVideoOverlay.style.height = "var(--miracle-app-height, 100vh)";
remoteMiracleVideoOverlay.style.zIndex = "2147483000";
remoteMiracleVideoOverlay.style.pointerEvents = "none";
remoteMiracleVideoOverlay.style.isolation = "isolate";
remoteMiracleVideoOverlay.style.opacity = "1";
remoteMiracleVideoOverlay.style.display = "none";
remoteMiracleVideoOverlay.style.overflow = "hidden";
remoteMiracleVideoOverlay.style.background = "transparent";
document.body.appendChild(remoteMiracleVideoOverlay);

let miracleOverlayTimer: number | undefined;
let miracleOverlayEndsAt = 0;
let miracleOverlayRemainingMs = 0;
let miracleOverlayFrozen = false;
let activeRemoteMiracleVideo: HTMLVideoElement | null = null;
const REMOTE_MIRACLE_MANIFEST_BACKUP_STORAGE_KEY = "miracleBallLab.remoteManifestBackup.v1";
const remoteMiracleAssetLoader = createRemoteMiracleAssetLoader({
    manifestUrl: MIRACLE_MANIFEST_URL,
    cacheMs: REMOTE_MIRACLE_MANIFEST_CACHE_MS,
    backupStorageKey: REMOTE_MIRACLE_MANIFEST_BACKUP_STORAGE_KEY,
    normalizeManifest: normalizeRemoteMiracleAssetsFromManifest,
    storage: localStorage,
});
let remoteMiracleVideoTimer: number | undefined;
const remoteMiracleBadUrlCache = createRemoteMiracleBadUrlCache({
    cacheMs: REMOTE_MIRACLE_BAD_URL_CACHE_MS,
    getSources: getRemoteMiracleAssetSources,
});

const flashOverlay = document.createElement("div");
flashOverlay.style.position = "fixed";
flashOverlay.style.left = "0";
flashOverlay.style.top = "0";
flashOverlay.style.width = "100vw";
flashOverlay.style.height = "var(--miracle-app-height, 100vh)";
flashOverlay.style.zIndex = "119";
flashOverlay.style.pointerEvents = "none";
flashOverlay.style.display = "none";
flashOverlay.style.background = "rgba(255,255,255,0)";
document.body.appendChild(flashOverlay);

const helpOverlay = document.createElement("div");
helpOverlay.id = "miracle-help-overlay";
helpOverlay.style.position = "fixed";
helpOverlay.style.left = "0";
helpOverlay.style.top = "0";
helpOverlay.style.width = "100vw";
helpOverlay.style.height = "var(--miracle-app-height, 100vh)";
helpOverlay.style.background = "rgba(5, 8, 18, 0.78)";
helpOverlay.style.color = "#1f2a18";
helpOverlay.style.zIndex = "130";
helpOverlay.style.display = "none";
helpOverlay.style.pointerEvents = "none";
helpOverlay.style.alignItems = "center";
helpOverlay.style.justifyContent = "center";
helpOverlay.style.padding = isMobile ? "10px" : "24px";
helpOverlay.style.boxSizing = "border-box";
helpOverlay.style.overflow = "hidden";
helpOverlay.style.touchAction = "pan-y";
document.body.appendChild(helpOverlay);

const subtitleOverlay = document.createElement("div");
subtitleOverlay.style.position = "fixed";
subtitleOverlay.style.left = "50%";
subtitleOverlay.style.bottom = isMobile ? "104px" : "28px";
subtitleOverlay.style.transform = "translateX(-50%)";
subtitleOverlay.style.maxWidth = "min(92vw, 960px)";
subtitleOverlay.style.padding = isMobile ? "12px 18px" : "10px 18px";
subtitleOverlay.style.borderRadius = "18px";
subtitleOverlay.style.background = "rgba(0,0,0,.62)";
subtitleOverlay.style.color = "#fff";
subtitleOverlay.style.fontSize = isMobile ? "24px" : "18px";
subtitleOverlay.style.fontWeight = "900";
subtitleOverlay.style.lineHeight = "1.5";
subtitleOverlay.style.textAlign = "center";
subtitleOverlay.style.zIndex = "121";
subtitleOverlay.style.display = "none";
subtitleOverlay.style.pointerEvents = "none";
document.body.appendChild(subtitleOverlay);

const commentaryOverlay = document.createElement("div");
commentaryOverlay.style.position = "fixed";
commentaryOverlay.style.left = "0";
commentaryOverlay.style.bottom = isMobile ? "62px" : "10px";
commentaryOverlay.style.width = "100vw";
commentaryOverlay.style.height = isMobile ? "34px" : "30px";
commentaryOverlay.style.zIndex = "92";
commentaryOverlay.style.pointerEvents = "none";
commentaryOverlay.style.overflow = "hidden";
commentaryOverlay.style.display = "none";
document.body.appendChild(commentaryOverlay);

const softToastOverlay = document.createElement("div");
softToastOverlay.style.position = "fixed";
softToastOverlay.style.left = "50%";
softToastOverlay.style.top = isMobile ? "76px" : "28px";
softToastOverlay.style.transform = "translate(-50%, -8px)";
softToastOverlay.style.padding = isMobile ? "13px 20px" : "10px 18px";
softToastOverlay.style.borderRadius = "999px";
softToastOverlay.style.background = "rgba(15,23,42,.58)";
softToastOverlay.style.color = "#fff";
softToastOverlay.style.fontSize = isMobile ? "20px" : "18px";
softToastOverlay.style.fontWeight = "900";
softToastOverlay.style.zIndex = "180";
softToastOverlay.style.pointerEvents = "none";
softToastOverlay.style.opacity = "0";
softToastOverlay.style.transition = "opacity .28s ease, transform .28s ease";
document.body.appendChild(softToastOverlay);

const activeEffectBadge = document.createElement("div");
activeEffectBadge.style.position = "fixed";
activeEffectBadge.style.right = isMobile ? "10px" : "18px";
activeEffectBadge.style.top = isMobile ? "116px" : "72px";
activeEffectBadge.style.maxWidth = isMobile ? "64vw" : "360px";
activeEffectBadge.style.padding = isMobile ? "9px 12px" : "8px 12px";
activeEffectBadge.style.borderRadius = "18px";
activeEffectBadge.style.background = "rgba(15,23,42,.70)";
activeEffectBadge.style.color = "#fff";
activeEffectBadge.style.fontWeight = "900";
activeEffectBadge.style.fontSize = isMobile ? "16px" : "15px";
activeEffectBadge.style.zIndex = "93";
activeEffectBadge.style.pointerEvents = "none";
activeEffectBadge.style.display = "none";
activeEffectBadge.style.boxShadow = "0 10px 28px rgba(0,0,0,.24)";
document.body.appendChild(activeEffectBadge);

const recentMiracleMini = document.createElement("div");
recentMiracleMini.style.position = "fixed";
recentMiracleMini.style.right = isMobile ? "10px" : "18px";
recentMiracleMini.style.bottom = isMobile ? "104px" : "52px";
recentMiracleMini.style.width = isMobile ? "min(62vw, 260px)" : "280px";
recentMiracleMini.style.padding = isMobile ? "9px 10px" : "10px 12px";
recentMiracleMini.style.borderRadius = "18px";
recentMiracleMini.style.background = "rgba(255,255,255,.78)";
recentMiracleMini.style.backdropFilter = "blur(7px)";
recentMiracleMini.style.color = "#172033";
recentMiracleMini.style.fontWeight = "900";
recentMiracleMini.style.fontSize = isMobile ? "14px" : "14px";
recentMiracleMini.style.zIndex = "91";
recentMiracleMini.style.pointerEvents = "none";
recentMiracleMini.style.display = "none";
recentMiracleMini.style.boxShadow = "0 10px 26px rgba(0,0,0,.18)";
document.body.appendChild(recentMiracleMini);

const tutorialMissionPanel = document.createElement("div");
tutorialMissionPanel.style.position = "fixed";
tutorialMissionPanel.style.left = isMobile ? "10px" : "18px";
tutorialMissionPanel.style.bottom = isMobile ? "14px" : "auto";
tutorialMissionPanel.style.top = isMobile ? "auto" : "112px";
tutorialMissionPanel.style.width = isMobile ? "auto" : "320px";
tutorialMissionPanel.style.maxWidth = isMobile ? "calc(100vw - 20px)" : "320px";
tutorialMissionPanel.style.maxHeight = isMobile ? "42vh" : "44vh";
tutorialMissionPanel.style.overflow = "auto";
tutorialMissionPanel.style.padding = isMobile ? "9px 12px" : "12px 14px";
tutorialMissionPanel.style.borderRadius = isMobile ? "999px" : "18px";
tutorialMissionPanel.style.background = "rgba(15,23,42,.58)";
tutorialMissionPanel.style.backdropFilter = "blur(10px)";
tutorialMissionPanel.style.color = "#fff";
tutorialMissionPanel.style.fontWeight = "800";
tutorialMissionPanel.style.fontSize = isMobile ? "12px" : "14px";
tutorialMissionPanel.style.lineHeight = "1.35";
tutorialMissionPanel.style.zIndex = "94";
tutorialMissionPanel.style.pointerEvents = "none";
tutorialMissionPanel.style.cursor = isMobile ? "pointer" : "default";
tutorialMissionPanel.style.userSelect = "none";
tutorialMissionPanel.style.display = "none";
tutorialMissionPanel.style.border = "1px solid rgba(255,215,0,.35)";
tutorialMissionPanel.style.boxShadow = "0 10px 28px rgba(0,0,0,.24)";
tutorialMissionPanel.addEventListener("click", (event) => {
    if (!isMobile) return;
    event.stopPropagation();
    tutorialMissionExpanded = true;
    updateTutorialMissions(true);
    scheduleTutorialMissionCollapse();
});
document.body.appendChild(tutorialMissionPanel);

const researchProgressPanel = document.createElement("div");
researchProgressPanel.style.position = "fixed";
researchProgressPanel.style.left = "50%";
researchProgressPanel.style.top = isMobile ? "118px" : "82px";
researchProgressPanel.style.transform = "translateX(-50%)";
researchProgressPanel.style.width = isMobile ? "min(88vw, 520px)" : "min(52vw, 640px)";
researchProgressPanel.style.padding = isMobile ? "8px 12px" : "8px 14px";
researchProgressPanel.style.borderRadius = "999px";
researchProgressPanel.style.background = "rgba(15,23,42,.62)";
researchProgressPanel.style.backdropFilter = "blur(8px)";
researchProgressPanel.style.color = "#fff";
researchProgressPanel.style.fontWeight = "900";
researchProgressPanel.style.fontSize = isMobile ? "12px" : "14px";
researchProgressPanel.style.zIndex = "93";
researchProgressPanel.style.pointerEvents = "none";
researchProgressPanel.style.display = "none";
researchProgressPanel.style.boxShadow = "0 10px 24px rgba(0,0,0,.20)";
document.body.appendChild(researchProgressPanel);

updateStatusMiniOverlays();
updateRecentMiracleMini();

const comboOverlay = document.createElement("div");
comboOverlay.style.position = "fixed";
comboOverlay.style.right = isMobile ? "10px" : "20px";
comboOverlay.style.top = isMobile ? "72px" : "24px";
comboOverlay.style.padding = isMobile ? "10px 14px" : "8px 12px";
comboOverlay.style.borderRadius = "999px";
comboOverlay.style.background = "rgba(255,224,120,.92)";
comboOverlay.style.color = "#2b2100";
comboOverlay.style.fontSize = isMobile ? "22px" : "18px";
comboOverlay.style.fontWeight = "900";
comboOverlay.style.zIndex = "122";
comboOverlay.style.display = "none";
comboOverlay.style.boxShadow = "0 8px 20px rgba(0,0,0,.22)";
document.body.appendChild(comboOverlay);

let lastPopupActionAt = 0;
let lastPopupActionKey = "";

function forcePopupToFront(): void {
    if (helpOverlay.style.display === "none") {
        restoreMainTouchTargets();
        return;
    }
    const boot = document.getElementById("miracle-boot-overlay") as HTMLElement | null;
    if (boot) {
        boot.style.pointerEvents = "none";
        boot.style.display = "none";
        boot.remove();
    }
    helpOverlay.style.position = "fixed";
    helpOverlay.style.inset = "0";
    helpOverlay.style.width = "100vw";
    helpOverlay.style.height = "var(--miracle-app-height, 100vh)";
    helpOverlay.style.pointerEvents = "auto";
    helpOverlay.style.zIndex = "2147483600";
    gameArea.style.pointerEvents = "none";
    info.style.pointerEvents = "none";
    const panel = helpOverlay.querySelector<HTMLElement>(".miracle-popup-panel");
    if (panel) {
        panel.style.pointerEvents = "auto";
        panel.style.touchAction = "manipulation";
    }
    helpOverlay.querySelectorAll<HTMLElement>("button, [data-home-action]").forEach((el) => {
        el.style.pointerEvents = "auto";
        el.style.touchAction = "manipulation";
        el.style.setProperty("-webkit-tap-highlight-color", "rgba(255,255,255,.18)");
    });
}

function handlePopupActionEvent(event: Event): boolean {
    const target = event.target as HTMLElement | null;
    const actionButton = target?.closest?.("[data-home-action]") as HTMLElement | null;
    if (!actionButton) return false;
    const action = actionButton.dataset.homeAction || "";
    const now = performance.now();
    if (lastPopupActionKey === action && now - lastPopupActionAt < 420) {
        event.preventDefault();
        event.stopPropagation();
        return true;
    }
    lastPopupActionAt = now;
    lastPopupActionKey = action;
    event.preventDefault();
    event.stopPropagation();
    forcePopupToFront();
    runLabHomeAction(action);
    return true;
}

["click"].forEach((eventName) => {
    helpOverlay.addEventListener(eventName, (event) => {
        if (handlePopupActionEvent(event)) return;
        if (eventName === "click" && event.target === helpOverlay) closeHelpPopup();
    }, { capture: true, passive: false });
});
window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && helpOverlay.style.display !== "none") closeHelpPopup();
    if (event.key === "Escape" && mobileSettingsOverlay && mobileSettingsOverlay.style.display !== "none") closeMobileSettingsPopup();
});

// ======================================================
// Utility
// ======================================================

function appRandom(): number {
    return randomTelemetry.next();
}

function randomColor(): string {
    return `hsl(${Math.floor(appRandom() * 360)}, ${70 + Math.floor(appRandom() * 25)}%, ${52 + Math.floor(appRandom() * 18)}%)`;
}

function randomRgba(alpha: number): string {
    const hue = Math.floor(appRandom() * 360);
    return `hsla(${hue}, 95%, 58%, ${alpha})`;
}

async function ensureAnimeReady(): Promise<boolean> {
    try {
        animeApi ??= await loadAnime();
        return true;
    } catch {
        return false;
    }
}

async function ensureTippyReady(): Promise<boolean> {
    try {
        tippyApi ??= await loadTippy();
        initButtonTooltips();
        return true;
    } catch {
        return false;
    }
}

async function ensureGifReady(): Promise<boolean> {
    return getShareReplayController().warmupGif();
}

function initButtonTooltips(): void {
    if (!tippyApi) return;
    updateTooltipText();
    for (const item of tooltipRefs) {
        if ((item.el as any)._tippy) continue;
        tippyApi(item.el, {
            content: item.el.getAttribute("data-tippy-content") || "",
            placement: isMobile ? "top" : "bottom",
            animation: "shift-away",
            theme: "light-border",
            maxWidth: isMobile ? 260 : 320,
            delay: isMobile ? [0, 0] : [140, 0],
            touch: ["hold", 350],
            interactive: false,
        });
    }
}

function saveRecords(): void {
    saveSavedRecords(savedRecords);
}

function getGachaPoint(): number {
    return getResearchCommerceController().getGachaPoint();
}

function addGachaPoint(point: number, reason: string, showToast = true): number {
    return getResearchCommerceController().addGachaPoint(point, reason, showToast);
}

function awardExperimentFinishGachaPoint(): number {
    return getResearchCommerceController().awardExperimentFinishGachaPoint(finishedCount);
}

function createId(prefix: string): string {
    try {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
    } catch {}
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isShopItemPurchased(id: string): boolean {
    return getResearchCommerceController().isShopItemPurchased(id);
}

function getResearchReportLimit(): number {
    return getResearchCommerceController().getResearchReportLimit();
}

function buyResearchShopItem(itemId: string): void {
    getResearchCommerceController().buyResearchShopItem(itemId);
}

function getCurrentEventSeason(date = new Date()) {
    return getResearchCommerceController().getCurrentEventSeason(date);
}

function claimSeasonMissionReward(seasonId: string, missionId: string): void {
    getResearchCommerceController().claimSeasonMissionReward(seasonId, missionId);
}

function craftMiracleRecipe(recipeId: string): void {
    getResearchCommerceController().craftMiracleRecipe(recipeId);
}


function saveUserProfile(): void {
    saveUserProfileData(userProfile);
}

function recordAdminEvent(entry: AdminLogEntry): void {
    adminLogApi?.recordAdminEvent(entry);
}

function showAdminStatsPopup(): void {
    adminLogApi?.showAdminStatsPopup();
}

const MAX_GLOBAL_ERROR_LOGS_PER_SESSION = 80;
const writeRuntimeErrorToAdminLog = createRuntimeErrorLogWriter({
    maxLogsPerSession: MAX_GLOBAL_ERROR_LOGS_PER_SESSION,
    recordAdminEvent,
});

function installGlobalErrorLogger(): void {
    installGlobalErrorLoggerBase(writeRuntimeErrorToAdminLog);
}

// createRuntimeErrorLogWriter is a const initializer, so install only after
// the writer exists. Calling this near boot used to enter its temporal dead
// zone and prevented the entire application from starting.
installGlobalErrorLogger();

function applyUserPreferencesToCurrentState(): void {
    const applied = applyUserPreferences({
        prefs: userPreferences,
        settings,
        storage: localStorage,
        storageKey: USER_PREFERENCES_STORAGE_KEY,
        commentaryMigrationKey: COMMENTARY_DEFAULT_OFF_MIGRATION_KEY,
        pinRowsMigrationKey: PIN_ROWS_DEFAULT_4_MIGRATION_KEY,
        binCountMigrationKey: BIN_COUNT_DEFAULT_4_MIGRATION_KEY,
        createDefaultLabelText,
    });
    settings = applied.settings;
    userPreferences = applied.userPreferences;
    if (applied.speedLabelText) speedLabelText = applied.speedLabelText;
    if (applied.currentTheme) currentTheme = applied.currentTheme;
    if (applied.themeAutoMode) {
        themeAutoMode = applied.themeAutoMode;
        settings.themeAutoMode = applied.themeAutoMode;
    }
    if (typeof applied.soundEnabled === "boolean") soundEnabled = applied.soundEnabled;
    if (typeof applied.confettiEnabled === "boolean") confettiEnabled = applied.confettiEnabled;
    if (applied.isEnglish) isEnglish = true;
}

function saveUserPreferencesFromCurrentState(): void {
    const prefs = buildUserPreferences({
        settings,
        selectedBackgroundObjectUrl,
        defaultBackgroundImageUrl: DEFAULT_BACKGROUND_IMAGE_URL,
        speedLabelText,
        currentTheme,
        themeAutoMode,
        soundEnabled,
        confettiEnabled,
        isEnglish,
    });
    userPreferences = prefs;
    try { localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(prefs)); } catch {}
}

let userPreferenceSaveTimer: number | undefined;
function persistUserPreferencesSoon(): void {
    if (userPreferenceSaveTimer !== undefined) window.clearTimeout(userPreferenceSaveTimer);
    userPreferenceSaveTimer = window.setTimeout(() => saveUserPreferencesFromCurrentState(), 250);
}

function registerAppOpen(): void {
    const now = Date.now();
    recordAdminEvent({ type: "app_open", at: now, detail: `${browserName} / ${window.innerWidth}x${window.innerHeight}` });
    userProfile = registerAppOpenInProfile({ profile: userProfile, now, getDateKey });
    saveUserProfile();
}

function getUserPlayStyleLabel(style: UserPlayStyle): string {
    return getUserPlayStyleLabelBase(style, isEnglish);
}

function getAppOnlineStatusHtml(): string {
    return getAppOnlineStatusHtmlBase({
        online: navigator.onLine,
        serviceWorkerReady: "serviceWorker" in navigator,
        appVersion: APP_VERSION,
    });
}

function markThemeUnlocked(theme: ThemeMode): void {
    savedRecords.unlockedThemes = savedRecords.unlockedThemes ?? {};
    if (!savedRecords.unlockedThemes[theme]) {
        savedRecords.unlockedThemes[theme] = Date.now();
        saveRecords();
    }
}

function applyAutoTheme(reason: "boot" | "select" | "run" | "timer"): void {
    if (themeAutoMode === "fixed") {
        settings.themeAutoMode = themeAutoMode;
        return;
    }
    const nextTheme = themeAutoMode === "time" ? getThemeForTime() : reason === "run" ? pickRandomTheme(String(Date.now()) + "-" + String(savedRecords.totalRuns)) : currentTheme;
    if (nextTheme !== currentTheme) {
        currentTheme = nextTheme;
        themeSelect.value = currentTheme;
        markThemeUnlocked(currentTheme);
        applyTheme();
        if (reason !== "boot") showSoftToast("テーマ自動切替: " + getThemeDisplayName(currentTheme));
    }
    settings.themeAutoMode = themeAutoMode;
}

function getThemeDisplayName(theme: ThemeMode): string {
    const option = getThemeOptions().find((x) => x.value === theme);
    return option ? (isEnglish ? option.en : option.ja) : theme;
}

function getDiscoveredKindCount(): number {
    return SPECIAL_EVENT_DEFS.filter((def) => (savedRecords.discovered[def.kind] ?? 0) + (specialCreated[def.kind] ?? 0) > 0).length;
}

function getFusionCountForRank(): number {
    return Object.keys(savedRecords.fusions ?? {}).length;
}

function getSecretCountForRank(): number {
    return Object.keys(savedRecords.secretUnlocked ?? {}).length;
}

function getCurrentResearchRankInfo() {
    return getResearchRankInfo(savedRecords, getDiscoveredKindCount(), getFusionCountForRank(), getSecretCountForRank());
}

function getDailyMissionContext() {
    const centerIndex = Math.floor(settings.binCount / 2);
    const centerHits = (binCounts[centerIndex] ?? 0) + (binCounts[Math.max(0, centerIndex - 1)] ?? 0);
    const specialCount = Object.values(specialCreated).reduce((sum, count) => sum + count, 0);
    return { finishedCount, runScore, specialCount, discardedCount, centerHits };
}

function evaluateAndSaveDailyMissions(): string[] {
    const today = getDateKey();
    const context = getDailyMissionContext();
    const completed: string[] = [];
    savedRecords.dailyMissionCompleted = savedRecords.dailyMissionCompleted ?? {};
    for (const mission of getDailyMissions(today)) {
        if (savedRecords.dailyMissionCompleted[mission.id]) continue;
        const value = getDailyMissionValue(mission, context);
        if (value < mission.target) continue;
        savedRecords.dailyMissionCompleted[mission.id] = Date.now();
        addScore(mission.rewardScore, "DAILY " + mission.title);
        markThemeUnlocked(mission.themeHint);
        completed.push(mission.title);
    }
    if (completed.length > 0) {
        addGachaPoint(completed.length * 2, `デイリー研究達成 ${completed.length}件`, false);
        saveRecords();
        showSoftToast("デイリー研究達成: " + completed.join(" / ") + ` / 奇跡ガチャP +${(completed.length * 2).toLocaleString()}`);
    }
    return completed;
}

function showDailyMissionPopup(): void {
    const today = getDateKey();
    const context = getDailyMissionContext();
    const completedMap = savedRecords.dailyMissionCompleted ?? {};
    const entries = getDailyMissions(today).map((mission) => {
        const value = Math.min(getDailyMissionValue(mission, context), mission.target);
        const percent = mission.target > 0 ? Math.min(100, (value / mission.target) * 100) : 0;
        const done = !!completedMap[mission.id] || value >= mission.target;
        return { mission, value, percent, done, themeLabel: getThemeDisplayName(mission.themeHint) };
    });
    showPopup("デイリー研究", getDailyMissionHtml(today, entries));
}

function showResearchRankPopup(): void {
    const rank = getCurrentResearchRankInfo();
    showPopup("研究員ランク", getResearchRankHtml(rank));
}

function showThemeBookPopup(): void {
    const entries = getThemeCollection(savedRecords, getDiscoveredKindCount(), getFusionCountForRank(), getSecretCountForRank());
    showPopup("テーマ図鑑", getThemeBookHtml(entries, isEnglish));
    window.setTimeout(() => {
        document.querySelectorAll<HTMLButtonElement>("[data-theme-book-select]").forEach((button) => {
            button.onclick = () => {
                const theme = button.dataset.themeBookSelect as ThemeMode;
                currentTheme = theme;
                themeAutoMode = "fixed";
                settings.themeAutoMode = themeAutoMode;
                themeSelect.value = theme;
                themeAutoModeSelect.value = themeAutoMode;
                markThemeUnlocked(theme);
                applyTheme();
                persistUserPreferencesSoon();
                showSoftToast("テーマ: " + getThemeDisplayName(theme));
            };
        });
    }, 0);
}

function exportLocalUserData(): void {
    const data = {
        appName: "MiracleBallLab",
        appVersion: APP_VERSION,
        exportedAt: new Date().toISOString(),
        userProfile,
        userPreferences,
        savedRecords,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `miracle-ball-lab-user-data-${getDateKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showSoftToast(t("ユーザーデータを書き出しました", "User data exported"));
}

function resetLocalUserData(): void {
    const ok = window.confirm("ブラウザ内のユーザー設定・記録・図鑑を削除します。元に戻せません。よろしいですか？");
    if (!ok) return;
    try {
        localStorage.removeItem(RECORD_STORAGE_KEY);
        localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
        localStorage.removeItem(USER_PREFERENCES_STORAGE_KEY);
        localStorage.removeItem(FIRST_RUN_GUIDE_STORAGE_KEY);
    } catch {}
    window.location.reload();
}

function applyPlayStylePreset(style: UserPlayStyle): void {
    userProfile.playStyle = style;
    if (style === "viewer") {
        settings.effectsEnabled = true;
        settings.effectMode = "flashy";
        settings.slowMiracleEffects = true;
        settings.showRecentMiracles = true;
    } else if (style === "collector") {
        settings.effectsEnabled = true;
        settings.effectMode = "normal";
        settings.showRecentMiracles = true;
        settings.probabilityMode = settings.probabilityMode === "normal" ? "festival" : settings.probabilityMode;
    } else if (style === "recording") {
        settings.effectsEnabled = true;
        settings.effectMode = "recording";
        settings.cameraShakeEnabled = false;
        settings.showRecentMiracles = true;
        isVerticalVideoMode = true;
    }
    effectModeSelect.value = settings.effectMode;
    probabilityModeSelect.value = settings.probabilityMode;
    updateUiLanguage();
    updateStatusMiniOverlays();
    saveUserProfile();
    saveUserPreferencesFromCurrentState();
}

function syncSettingsInputsFromState(): void {
    targetInput.value = String(settings.targetCount);
    activeBallInput.value = String(settings.activeLimit);
    binCountInput.value = String(settings.binCount);
    pinRowInput.value = String(settings.pinRows);
    probabilityModeSelect.value = settings.probabilityMode;
    effectModeSelect.value = settings.effectMode;
    themeAutoModeSelect.value = themeAutoMode;
}

function refreshSettingButtons(): void {
    updateSimpleModeButton();
    updateBlackModeButton();
    updateCameraShakeButton();
    updateSlowMiracleButton();
    updateEffectsButton();
    updateCommentaryButton();
    updateBoardAnomalyButton();
    updateNormalTraitButton();
    updateTimeBallSkinButton();
    updateMobileCompactButton();
    updateLowSpecButton();
    updateRecentMiracleDisplayButton();
    updateSpeedButtons();
    updateStatusMiniOverlays();
    updateInfo();
}

function applyExperimentPreset(preset: ExperimentPresetDef): void {
    const wasRunning = isStarted && !isFinished;
    settings.targetCount = preset.targetCount;
    settings.activeLimit = preset.activeLimit;
    settings.binCount = preset.binCount;
    settings.pinRows = preset.pinRows;
    settings.labelText = createDefaultLabelText(settings.binCount);
    settings.probabilityMode = preset.probabilityMode;
    settings.effectMode = preset.effectMode;
    settings.simpleMode = preset.simpleMode;
    settings.effectsEnabled = preset.effectsEnabled;
    settings.slowMiracleEffects = preset.slowMiracleEffects;
    settings.boardAnomalyEnabled = preset.boardAnomalyEnabled;
    settings.normalBallTraitsEnabled = preset.normalBallTraitsEnabled;
    settings.showRecentMiracles = preset.showRecentMiracles;
    settings.mobileCompactMode = preset.mobileCompactMode;
    settings.lowSpecMode = preset.lowSpecMode;
    speedLabelText = preset.speed;
    engine.timing.timeScale = getCurrentTimeScale();
    syncSettingsInputsFromState();
    if (settings.lowSpecMode) applyLowSpecMode();
    applyMobileCompactMode();
    refreshSettingButtons();
    saveUserPreferencesFromCurrentState();
    resetExperiment(false);
    showSoftToast(`${preset.title}プリセットを反映しました${wasRunning ? "。実験はリセットしました" : ""}`);
}

function showExperimentPresetPopup(): void {
    showPopup("実験プリセット", getExperimentPresetHtml(EXPERIMENT_PRESETS));
    document.querySelectorAll<HTMLButtonElement>("[data-preset-id]").forEach((button) => {
        button.onclick = () => {
            const preset = EXPERIMENT_PRESETS.find((x) => x.id === button.dataset.presetId);
            if (!preset) return;
            applyExperimentPreset(preset);
            closeHelpPopup();
        };
    });
}

function getProbabilityScale(): number {
    return getProbabilityScaleBase(settings.probabilityMode);
}

function getPassiveMiracleBoost(): number {
    return getPassiveMiracleBoostBase({
        isStarted,
        isFinished,
        startedAt: startTime,
        now: Date.now(),
    });
}

function getCurrentTimeScale(): number {
    if (speedLabelText === "超低速") return 0.28;
    if (speedLabelText === "低速") return 0.55;
    if (speedLabelText === "通常") return 1;
    if (speedLabelText === "高速") return 2;
    return 4;
}

function getSpeedDisplayLabel(): string {
    if (isEnglish) {
        if (speedLabelText === "超低速") return "Very slow";
        if (speedLabelText === "低速") return "Slow";
        if (speedLabelText === "通常") return "Normal";
        if (speedLabelText === "高速") return "Fast";
        return "Ultra";
    }
    return speedLabelText;
}

function getMiraclePauseDuration(def?: SpecialEventDef, repeatedInRun = false): number {
    const modeRate = settings.effectMode === "recording" ? 1.25 : settings.effectMode === "quiet" ? 0.7 : 1;
    const slowRate = (settings.slowMiracleEffects ? 1.75 : 1) * modeRate;
    if (!def) return Math.round(1200 * slowRate);
    if (def.rank === "SR" || def.rank === "SSR") {
        // 同じSR/SSRが実行中に再発生した場合は、ゆっくり演出ONでも短縮を優先します。
        return repeatedInRun ? 240 : Math.round(520 * slowRate);
    }
    if (def.rank === "UR") return Math.round(1800 * slowRate);
    return Math.round(3000 * slowRate);
}

function openMobileSettingsPopup(): void {
    if (!mobileSettingsOverlay) return;
    recoverMobileLayoutIfBroken("open-settings");
    mobileSettingsOverlay.style.zIndex = "2147483300";
    mobileSettingsOverlay.style.pointerEvents = "auto";
    mobileSettingsOverlay.style.display = "flex";
    if (mobileSettingsPanel) {
        mobileSettingsPanel.style.pointerEvents = "auto";
        mobileSettingsPanel.querySelectorAll<HTMLElement>("button, input, select, textarea, label").forEach((el) => {
            el.style.pointerEvents = "auto";
            el.style.touchAction = "manipulation";
        });
    }
    mobileSettingsOpenCount++;
    playUiSound("open");
    if (mobileSettingsOpenCount >= 3) {
        unlockSecret("settings-three-open", "設定室の常連", "スマホ設定画面を3回開きました。設定画面にも観測ログが残ります。");
        mobileSettingsOpenCount = 0;
    }
}

function closeMobileSettingsPopup(): void {
    if (!mobileSettingsOverlay) return;
    mobileSettingsOverlay.style.display = "none";
    mobileSettingsOverlay.style.pointerEvents = "none";
    playUiSound("close");
    restoreMainTouchTargets();
    recoverMobileLayoutIfBroken("close-settings");
}

function setupMobileLayout(): void {
    info.style.flex = "0 0 auto";
    info.style.height = "108px";
    info.style.minHeight = "108px";
    info.style.padding = "10px 10px env(safe-area-inset-bottom, 10px)";
    info.style.overflow = "hidden";
    info.innerHTML = "";

    const dock = document.createElement("div");
    dock.style.display = "grid";
    dock.style.gridTemplateColumns = "1.05fr 1.05fr 1fr 1fr";
    dock.style.gap = "8px";
    dock.style.height = "100%";
    dock.style.alignItems = "center";
    dock.style.position = "relative";
    dock.style.zIndex = "2201";
    dock.style.pointerEvents = "auto";
    info.style.position = "relative";
    info.style.zIndex = "2200";
    info.style.pointerEvents = "auto";
    info.appendChild(dock);

    const bindDockImmediateAction = (button: HTMLButtonElement, action: () => void): void => {
        let lastActivatedAt = 0;
        button.onclick = null;
        button.style.touchAction = "manipulation";
        button.style.setProperty("-webkit-tap-highlight-color", "transparent");
        const activate = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
            const now = performance.now();
            if (now - lastActivatedAt < 260) return;
            lastActivatedAt = now;
            action();
        };
        button.addEventListener("touchstart", activate, { passive: false });
        button.addEventListener("pointerdown", activate, { passive: false });
        button.addEventListener("pointerup", (event) => {
            event.preventDefault();
            event.stopPropagation();
        }, { passive: false });
        button.addEventListener("touchend", activate, { passive: false });
        button.addEventListener("click", activate, { passive: false });
    };

    mobileDockRunButton = createButton(t("実行", "Run"), () => startExperiment());
    mobileDockRunButton.style.width = "100%";
    mobileDockRunButton.style.height = "66px";
    mobileDockRunButton.style.fontSize = "21px";
    bindDockImmediateAction(mobileDockRunButton, () => startExperiment());
    dock.appendChild(mobileDockRunButton);

    mobileDockPauseButton = createButton(t("一時停止", "Pause"), () => {});
    bindDockImmediateAction(mobileDockPauseButton, () => togglePause());
    mobileDockPauseButton.style.width = "100%";
    mobileDockPauseButton.style.height = "66px";
    mobileDockPauseButton.style.fontSize = "20px";
    dock.appendChild(mobileDockPauseButton);

    const mobileDockMagicButton = createButton(t("魔法陣", "Magic"), () => enableMagicCircleMode());
    mobileDockMagicButton.style.width = "100%";
    mobileDockMagicButton.style.height = "66px";
    mobileDockMagicButton.style.fontSize = "19px";
    bindDockImmediateAction(mobileDockMagicButton, () => enableMagicCircleMode());
    dock.appendChild(mobileDockMagicButton);

    mobileDockSettingsButton = createButton(t("設定", "Settings"), () => openMobileSettingsPopup());
    mobileDockSettingsButton.style.width = "100%";
    mobileDockSettingsButton.style.height = "66px";
    mobileDockSettingsButton.style.fontSize = "20px";
    bindDockImmediateAction(mobileDockSettingsButton, () => openMobileSettingsPopup());
    dock.appendChild(mobileDockSettingsButton);

    mobileSettingsOverlay = document.createElement("div");
    mobileSettingsOverlay.style.position = "fixed";
    mobileSettingsOverlay.style.inset = "0";
    mobileSettingsOverlay.style.display = "none";
    mobileSettingsOverlay.style.pointerEvents = "none";
    mobileSettingsOverlay.style.alignItems = "stretch";
    mobileSettingsOverlay.style.justifyContent = "center";
    mobileSettingsOverlay.style.background = "rgba(5,8,18,.22)";
    mobileSettingsOverlay.style.backdropFilter = "blur(8px)";
    mobileSettingsOverlay.style.zIndex = "2147483300";
    mobileSettingsOverlay.style.padding = "0";
    document.body.appendChild(mobileSettingsOverlay);
    mobileSettingsOverlay.onclick = (event) => {
        if (event.target === mobileSettingsOverlay) closeMobileSettingsPopup();
    };

    mobileSettingsPanel = document.createElement("div");
    mobileSettingsPanel.className = "miracle-mobile-panel";
    mobileSettingsPanel.style.width = "100%";
    mobileSettingsPanel.style.height = "var(--miracle-app-height, 100vh)";
    mobileSettingsPanel.style.maxHeight = "var(--miracle-app-height, 100vh)";
    mobileSettingsPanel.style.background = "linear-gradient(135deg,rgba(255,255,255,.20),rgba(190,205,224,.12),rgba(255,255,255,.16))";
    mobileSettingsPanel.style.backdropFilter = "blur(30px) saturate(1.55) contrast(1.08)";
    mobileSettingsPanel.style.borderTopLeftRadius = "0";
    mobileSettingsPanel.style.borderTopRightRadius = "0";
    mobileSettingsPanel.style.boxShadow = "0 -12px 40px rgba(0,0,0,.28)";
    mobileSettingsPanel.style.padding = "0 12px 22px 12px";
    mobileSettingsPanel.style.overflowY = "auto";
    mobileSettingsPanel.style.overflowX = "hidden";
    mobileSettingsPanel.style.overscrollBehavior = "contain";
    mobileSettingsPanel.style.pointerEvents = "auto";
    mobileSettingsPanel.style.touchAction = "pan-y";
    mobileSettingsPanel.style.setProperty("-webkit-overflow-scrolling", "touch");
    mobileSettingsOverlay.appendChild(mobileSettingsPanel);

    const closeRow = document.createElement("div");
    closeRow.className = "miracle-mobile-settings-header";
    closeRow.style.display = "flex";
    closeRow.style.justifyContent = "space-between";
    closeRow.style.alignItems = "center";
    closeRow.style.marginBottom = "10px";
    closeRow.style.position = "sticky";
    closeRow.style.top = "0";
    closeRow.style.zIndex = "5";
    closeRow.style.padding = "max(10px, env(safe-area-inset-top)) 0 10px 0";
    closeRow.style.background = "linear-gradient(180deg,rgba(251,253,255,.52),rgba(251,253,255,.34))";
    closeRow.style.backdropFilter = "blur(22px)";
    closeRow.style.borderBottom = "1px solid rgba(80,90,120,.18)";
    closeRow.innerHTML = `<div style="font-size:22px;font-weight:900;color:#243018;">${t("設定", "Settings")}</div>`;
    const closeButton = createButton("×", () => closeMobileSettingsPopup());
    closeButton.style.flex = "0 0 56px";
    closeButton.style.width = "56px";
    closeButton.style.height = "56px";
    closeButton.style.padding = "0";
    closeButton.style.fontSize = "30px";
    closeButton.style.position = "relative";
    closeButton.style.zIndex = "6";
    closeRow.appendChild(closeButton);
    mobileSettingsPanel.appendChild(closeRow);

    const inner = document.createElement("div");
    inner.style.display = "flex";
    inner.style.flexDirection = "column";
    inner.style.gap = "14px";
    mobileSettingsPanel.appendChild(inner);

    inner.appendChild(appHeader);
    inner.appendChild(recordHero);
    inner.appendChild(controlArea);
    inner.appendChild(buttonArea);
    inner.appendChild(topRow);
    randomGraphArea.style.display = "none";

    applySettingsUiZoom();

    gameArea.style.flex = "1 1 auto";
    // helpOverlay / resultOverlay はこの直後に作成されるため、
    // スマホ初期化中に同期実行すると ReferenceError で起動が止まる場合があります。
    // 1 tick 遅らせて、DOM 部品が揃ってから画面補正します。
    window.setTimeout(() => forceMobileFullViewportLayout(), 0);
}

installMobileDockGlobalActionGuard({
    isMobile,
    isAppTerminated: () => isAppTerminated,
    mobileSettingsOverlay: () => mobileSettingsOverlay,
    resultOverlay: () => resultOverlay,
    info,
    isOverlayOpen,
    isOverlayOpenById,
    startExperiment: () => startExperiment(),
    togglePause: () => togglePause(),
    enableMagicCircleMode: () => enableMagicCircleMode(),
    openMobileSettingsPopup: () => openMobileSettingsPopup(),
});
installMobileRuntimeGuard();
installEmergencyRuntimeLogOpener();

function applySettingsUiZoom(): void {
    const zoomText = String(settingsUiZoom);
    if (mobileSettingsPanel) {
        (mobileSettingsPanel.style as any).zoom = zoomText;
    }
    if (!isMobile) {
        (controlArea.style as any).zoom = zoomText;
        (buttonArea.style as any).zoom = zoomText;
    }
    settingsZoomInput.value = String(Math.round(settingsUiZoom * 100));
}

function updateUiLanguage(): void {
    appTitle.innerHTML = isEnglish
        ? `<div style="font-size:${isMobile ? 30 : 26}px;font-weight:900;color:${settings.blackModeEnabled ? "#f8fafc" : "#26351f"};letter-spacing:.03em;">MiracleBallLab</div><div style="margin-top:3px;font-size:${isMobile ? 16 : 14}px;font-weight:700;color:${settings.blackModeEnabled ? "#cbd5e1" : "#5d6d48"};">Pachinko-style board. Lotteries run only when balls pass a gate.</div>`
        : `<div style="font-size:${isMobile ? 30 : 26}px;font-weight:900;color:${settings.blackModeEnabled ? "#f8fafc" : "#26351f"};letter-spacing:.03em;">ミラクルボールラボ</div><div style="margin-top:3px;font-size:${isMobile ? 16 : 14}px;font-weight:700;color:${settings.blackModeEnabled ? "#cbd5e1" : "#5d6d48"};">役物を通過したときだけ抽選するパチンコ風ラボ</div>`;
    appHeaderNote.textContent = isEnglish ? "Rare effects trigger at gates. Black mode is optional." : "レア演出は役物通過時に抽選。ブラックモードは任意です。";
    for (const item of uiFieldRefs) item.labelEl.textContent = isEnglish ? item.en : item.ja;
    for (const item of bilingualButtons) {
        if (item.button === simpleModeButton) continue;
        if (item.button === blackModeButton) continue;
        if (item.button === cameraShakeButton) continue;
        if (item.button === slowMiracleButton) continue;
        if (item.button === effectsButton) continue;
        if (item.button === commentaryButton) continue;
        if (item.button === boardAnomalyButton) continue;
        if (item.button === normalTraitButton) continue;
        if (item.button === mobileCompactButton) continue;
        if (item.button === lowSpecButton) continue;
        if (item.button === familiarToggleButton) continue;
        if (item.button === soundButton) continue;
        if (item.button === confettiButton) continue;
        if (item.button === pixiButton) continue;
        item.button.textContent = isEnglish ? item.en : item.ja;
    }
    for (const item of sectionTitles) item.el.textContent = isEnglish ? item.en : item.ja;
    setSelectOptions();
    updateThemeSelectLabels();
    updateThemeAutoModeSelectLabels();
    updateEffectModeSelectLabels();
    updateSimpleModeButton();
    updateBlackModeButton();
    updateCameraShakeButton();
    updateSlowMiracleButton();
    updateEffectsButton();
    updateCommentaryButton();
    updateBoardAnomalyButton();
    updateNormalTraitButton();
    updateTimeBallSkinButton();
    updateMobileCompactButton();
    updateLowSpecButton();
    updateRecentMiracleDisplayButton();
    updateSoundButton();
    updateSkillButtons();
    confettiButton.textContent = confettiEnabled ? t("紙吹雪: ON", "Confetti: ON") : t("紙吹雪: OFF", "Confetti: OFF");
    pixiButton.textContent = pixiEnabled ? t("Pixi背景: ON", "Pixi BG: ON") : t("Pixi背景: OFF", "Pixi BG: OFF");
    gameFullscreenButton.title = t("全画面", "Fullscreen");
    pcPauseButton.textContent = isPaused ? t("再開", "Resume") : t("一時停止", "Pause");
    pcPauseButton.title = pcPauseButton.textContent;
    updateVerticalVideoButton();
    updateObsButton();
    updateTooltipText();
    if (mobileDockRunButton) mobileDockRunButton.textContent = t("実行", "Run");
    if (mobileDockPauseButton) mobileDockPauseButton.textContent = isPaused ? t("再開", "Resume") : t("一時停止", "Pause");
    if (mobileDockSettingsButton) mobileDockSettingsButton.textContent = t("設定", "Settings");
}

function updateFullscreenButtonState(): void {
    const active = isPseudoFullscreenMode || document.fullscreenElement === gameArea;
    isFullscreenMode = active;
    gameFullscreenButton.textContent = active ? "🗗" : "⛶";
    gameFullscreenButton.title = active ? t("全画面を解除", "Exit fullscreen") : t("全画面", "Fullscreen");
}

function enterPseudoGameFullscreen(): void {
    if (isPseudoFullscreenMode) return;
    pseudoFullscreenScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    isPseudoFullscreenMode = true;
    isFullscreenMode = true;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    gameArea.style.position = "fixed";
    gameArea.style.left = "0";
    gameArea.style.top = "0";
    gameArea.style.right = "0";
    gameArea.style.bottom = "0";
    gameArea.style.width = "100vw";
    gameArea.style.height = "var(--miracle-app-height, 100vh)";
    gameArea.style.maxWidth = "100vw";
    gameArea.style.maxHeight = "var(--miracle-app-height, 100vh)";
    gameArea.style.zIndex = "99999";
    gameArea.style.borderRadius = "0";
    canvas.style.borderRadius = "0";

    updateFullscreenButtonState();
    window.setTimeout(scheduleResize, 50);
}

function exitPseudoGameFullscreen(): void {
    if (!isPseudoFullscreenMode) return;
    isPseudoFullscreenMode = false;
    isFullscreenMode = false;

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.body.style.touchAction = "";

    gameArea.style.position = "relative";
    gameArea.style.left = "";
    gameArea.style.top = "";
    gameArea.style.right = "";
    gameArea.style.bottom = "";
    gameArea.style.width = "";
    gameArea.style.height = "";
    gameArea.style.maxWidth = "";
    gameArea.style.maxHeight = "";
    gameArea.style.zIndex = "";
    gameArea.style.borderRadius = "";
    canvas.style.borderRadius = isMobile ? "24px" : "26px";

    updateFullscreenButtonState();
    window.setTimeout(() => {
        window.scrollTo(0, pseudoFullscreenScrollY);
        scheduleResize();
    }, 50);
}

async function toggleGameFullscreen(): Promise<void> {
    try {
        if (isPseudoFullscreenMode) {
            exitPseudoGameFullscreen();
            return;
        }

        if (document.fullscreenElement === gameArea) {
            await document.exitFullscreen();
            return;
        }

        if (isMobile) {
            enterPseudoGameFullscreen();
            return;
        }

        if (!document.fullscreenElement) {
            await gameArea.requestFullscreen();
        }
    } catch {
        enterPseudoGameFullscreen();
    }
}

document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && isPseudoFullscreenMode) return;
    updateFullscreenButtonState();
    window.setTimeout(scheduleResize, 50);
});

function getProbabilityModeLabel(): string {
    if (settings.probabilityMode === "festival") return "祭り";
    if (settings.probabilityMode === "hard") return "修羅";
    if (settings.probabilityMode === "hell") return "地獄";
    return "通常";
}

function findSpecialDef(kind: DropKind): SpecialEventDef | undefined {
    return SPECIAL_EVENT_DEFS.find((x) => x.kind === kind);
}

function shouldForceMiracleEffects(def?: SpecialEventDef): boolean {
    // 設定の「演出」がOFFでも、UR以上は見逃すともったいないので強制表示します。
    return !!def && (def.rank === "UR" || def.rank === "EX" || def.rank === "GOD");
}

function getWorldModeByKind(kind: DropKind): WorldMode {
    if (kind === "poseidonMode") return "poseidon";
    if (kind === "zeusuMode") return "zeusu";
    if (kind === "hadesuMode") return "hadesu";
    if (kind === "heartMode") return "heart";
    if (kind === "nekochanMode") return "nekochan";
    return null;
}

function getWorldModePalette(mode: WorldMode): { tint: string; accent: string; subtitle: string; emoji: string; bg: string } {
    if (mode === "poseidon") return { tint: "rgba(36,132,255,0.38)", accent: "#78c8ff", subtitle: "POSEIDON MODE", emoji: "🌊", bg: "radial-gradient(circle at 50% 18%, rgba(40,120,255,.40), rgba(2,18,42,.98))" };
    if (mode === "zeusu") return { tint: "rgba(255,220,0,0.34)", accent: "#ffe75a", subtitle: "ZEUSU MODE", emoji: "⚡", bg: "radial-gradient(circle at 50% 18%, rgba(255,226,92,.46), rgba(35,26,2,.98))" };
    if (mode === "hadesu") return { tint: "rgba(0,0,0,0.50)", accent: "#ff4a4a", subtitle: "HADESU MODE", emoji: "☠️", bg: "radial-gradient(circle at 50% 18%, rgba(24,24,24,.46), rgba(0,0,0,.995))" };
    if (mode === "heart") return { tint: "rgba(255,105,180,0.30)", accent: "#ff70ba", subtitle: "HEART MODE", emoji: "💗", bg: "radial-gradient(circle at 50% 18%, rgba(255,120,190,.42), rgba(38,10,24,.98))" };
    if (mode === "nekochan") return { tint: "rgba(255,186,120,0.28)", accent: "#ffbf76", subtitle: "NEKOCHAN MODE", emoji: "🐈", bg: "radial-gradient(circle at 50% 18%, rgba(255,190,120,.42), rgba(48,26,10,.98))" };
    return { tint: "rgba(0,0,0,0)", accent: "#ffffff", subtitle: "", emoji: "", bg: "" };
}

function applyWorldModeBodyStyles(): void {
    const palette = getWorldModePalette(activeWorldMode);
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        const renderObj: any = (body as any).render;
        if (!renderObj) continue;
        if (!activeWorldMode) {
            if (plugin?.isPin) renderObj.fillStyle = "rgba(89, 97, 115, 0.92)";
            else if (plugin?.isDivider) renderObj.fillStyle = "rgba(196, 101, 101, 0.94)";
            else if (!plugin?.isDrop) renderObj.fillStyle = "rgba(36, 41, 54, 0.92)";
            continue;
        }
        if (plugin?.isPin) renderObj.fillStyle = palette.accent;
        else if (plugin?.isDivider) renderObj.fillStyle = palette.accent;
        else if (!plugin?.isDrop) renderObj.fillStyle = palette.accent;
    }
}

function getCurrentUiAccentKind(): DropKind | null {
    if (activeUiAccentKind) return activeUiAccentKind;
    if (activeWorldMode === 'poseidon') return 'poseidonMode';
    if (activeWorldMode === 'zeusu') return 'zeusuMode';
    if (activeWorldMode === 'hadesu') return 'hadesuMode';
    if (activeWorldMode === 'heart') return 'heartMode';
    if (activeWorldMode === 'nekochan') return 'nekochanMode';
    return null;
}

function setUiAccent(kind: DropKind | null, durationMs = 0): void {
    activeUiAccentKind = kind;
    if (uiAccentTimer !== undefined) {
        window.clearTimeout(uiAccentTimer);
        uiAccentTimer = undefined;
    }
    if (kind && durationMs > 0) {
        uiAccentTimer = window.setTimeout(() => {
            activeUiAccentKind = null;
            applyTheme();
            updateUiLanguage();
        }, durationMs);
    }
    applyTheme();
    updateUiLanguage();
}

function applyDynamicUiPalette(): void {
    if (settings.blackModeEnabled) return;
    const palette = getUiAccentPaletteByKind(getCurrentUiAccentKind());
    if (!palette) return;
    info.style.background = palette.panel;
    info.style.color = palette.fieldText;
    appHeader.style.background = palette.section;
    recordHero.style.background = getMetallicPanelBackground(settings.blackModeEnabled);
    controlArea.style.background = getMetallicPanelBackground(settings.blackModeEnabled);
    buttonArea.style.background = getMetallicPanelBackground(settings.blackModeEnabled);
    randomGraphArea.style.background = getMetallicPanelBackground(settings.blackModeEnabled);
    if (mobileSettingsPanel) {
        mobileSettingsPanel.style.background = settings.blackModeEnabled ? "linear-gradient(135deg,rgba(15,23,42,.38),rgba(51,65,85,.22),rgba(148,163,184,.12))" : "linear-gradient(135deg,rgba(255,255,255,.20),rgba(190,205,224,.12),rgba(255,255,255,.16))";
        mobileSettingsPanel.style.color = palette.fieldText;
        applyThemePaletteToPanel(mobileSettingsPanel, {
            body: palette.panel,
            panel: palette.panel,
            game: palette.section,
            section: palette.section,
            fieldBg: palette.fieldBg,
            fieldText: palette.fieldText,
            fieldBorder: palette.border,
            buttonBg: palette.badge,
            buttonText: palette.badgeText,
            buttonBorder: palette.border,
            title: palette.title,
            badge: palette.badge,
            badgeText: palette.badgeText,
            mutedText: palette.subtitle,
        });
    }
    recentMiracleMini.style.background = 'rgba(255,255,255,.84)';
    recentMiracleMini.style.color = palette.fieldText;
    activeEffectBadge.style.background = palette.badge;
    activeEffectBadge.style.color = palette.badgeText;
    for (const item of sectionTitles) item.el.style.color = palette.title;
    for (const item of uiFieldRefs) item.labelEl.style.color = palette.fieldText;
    for (const el of Array.from(info.querySelectorAll('input, textarea, select')) as Array<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        el.style.background = palette.fieldBg;
        el.style.color = palette.fieldText;
        el.style.borderColor = palette.border;
    }
    for (const el of Array.from(info.querySelectorAll('button')) as HTMLButtonElement[]) {
        el.style.borderColor = palette.border;
        if (!el.style.background || el.style.background.includes('ececec') || el.style.background.includes('f3f8e8') || el.style.background.includes('dceec2')) {
            el.style.background = palette.badge;
            el.style.color = palette.badgeText;
        }
    }
}

function getDiscoveredCount(): number {
    return SPECIAL_EVENT_DEFS.filter((def) => (savedRecords.discovered[def.kind] ?? 0) + (specialCreated[def.kind] ?? 0) > 0).length;
}

function addScore(amount: number, reason: string, x = geometry.width / 2, y = Math.max(80 * geometry.scale, geometry.height * 0.18)): void {
    runScore += Math.max(0, Math.floor(amount));
    if (!settings.simpleMode && amount > 0) addFloatingText(`+${Math.floor(amount).toLocaleString()} ${reason}`, x, y, "#14532d");
}

function persistFamiliarSoon(): void {
    if (familiarSaveTimer !== undefined) window.clearTimeout(familiarSaveTimer);
    familiarSaveTimer = window.setTimeout(() => saveFamiliarState(familiarState), 250);
}

function getCurrentFamiliarDef() {
    return getFamiliarDef(familiarState.kind) ?? FAMILIAR_DEFS[0];
}

function setFamiliarMessage(message: string, durationMs = 3500): void {
    familiarMessage = message;
    familiarMessageUntil = Date.now() + durationMs;
}

function awardFamiliarXp(amount: number, reason: string, affection = 1): void {
    const before = familiarState.level;
    familiarState = gainFamiliarXp(familiarState, amount, affection);
    persistFamiliarSoon();
    if (familiarState.level > before) {
        familiarPulseUntil = Date.now() + 2200;
        addScore(2500 * familiarState.level, "FAMILIAR LV" + familiarState.level);
        setFamiliarMessage(`使い魔 Lv.${familiarState.level} / ${reason}`, 5200);
        playSecretSound();
        triggerCameraShake(10 * geometry.scale, 240);
    }
}

function contractFamiliar(kind: FamiliarKind, sourceLabel: string): void {
    const def = getFamiliarDef(kind);
    if (!def) return;
    const result = unlockFamiliar(familiarState, kind);
    familiarState = { ...result.state, kind, name: def.name };
    saveFamiliarState(familiarState);
    updateFamiliarButton();
    updateInfo();
    if (result.unlockedNow) {
        unlockSecret(`familiar-${kind}`, `使い魔契約: ${def.name}`, `${sourceLabel}で${def.name}を解放しました。`, 14000);
        unlockNote("familiar-contract");
    } else {
        showSoftToast(`${def.name}を呼び出しました`);
    }
    setFamiliarMessage(`${def.name} がついてきます`, 4200);
}

function setFamiliarMode(mode: FamiliarMode): void {
    familiarState.mode = mode;
    saveFamiliarState(familiarState);
    updateFamiliarButton();
    setFamiliarMessage(`使い魔モード: ${getFamiliarModeLabel(mode)}`, 3200);
}

function handleFamiliarDropResult(kind: DropKind, binIndex: number): void {
    if (!settings.familiarEnabled) return;
    const baseXp = getFamiliarDropXp(kind, binIndex);
    const modeBonus = familiarState.mode === "lucky" && kind !== "normal" ? 8 : familiarState.mode === "guard" && binIndex < 0 ? 4 : 0;
    if (baseXp + modeBonus > 0) awardFamiliarXp(baseXp + modeBonus, kind === "normal" ? "観測" : String(kind), kind === "normal" ? 1 : 3);
    if (binIndex < 0 && familiarState.mode === "guard" && Date.now() - familiarState.lastAssistAt > 8000 && appRandom() < 0.13) {
        familiarState.lastAssistAt = Date.now();
        familiarState.assistCount++;
        addScore(1200 + familiarState.level * 80, "FAMILIAR GUARD");
        addFloatingText("使い魔見張り", geometry.width / 2, geometry.ballCountY - 90 * geometry.scale, getCurrentFamiliarDef().accent);
        setFamiliarMessage("使い魔が捨て区画を見張りました", 2800);
        persistFamiliarSoon();
    }
}

function maybeFamiliarAssist(): void {
    if (!settings.familiarEnabled || !isStarted || isFinished || isPaused || isMiraclePaused) return;
    const now = Date.now();
    const minInterval = familiarState.mode === "chaos" ? 10500 : familiarState.mode === "lucky" ? 13500 : 18000;
    if (now - familiarState.lastAssistAt < minInterval) return;
    const chance = Math.min(0.006 + familiarState.level * 0.00075, 0.035);
    if (appRandom() > chance) return;
    familiarState.lastAssistAt = now;
    familiarState.assistCount++;
    familiarPulseUntil = now + 900;
    const def = getCurrentFamiliarDef();
    if (familiarState.mode === "chaos") {
        triggerCameraShake(8 * geometry.scale, 160);
        addFloatingText(`${def.name} 暴走`, geometry.width / 2, geometry.height * 0.28, def.accent);
        for (const body of engine.world.bodies) {
            const plugin = (body as any).plugin;
            if (!plugin?.isDrop) continue;
            Body.applyForce(body, body.position, { x: (appRandom() - 0.5) * 0.000055, y: -0.000018 });
        }
    } else if (familiarState.mode === "lucky") {
        maybeTriggerMiracleOmen(true);
        familiarState.jackpotWhisperCount++;
        addScore(1000 + familiarState.level * 120, "FAMILIAR LUCK");
        addFloatingText(`${def.name} 予兆`, geometry.width / 2, geometry.height * 0.24, def.accent);
    } else {
        addScore(650 + familiarState.level * 90, "FAMILIAR ASSIST");
        addFloatingText(`${def.name} 補助`, geometry.width / 2, geometry.height * 0.24, def.accent);
    }
    awardFamiliarXp(3 + Math.floor(familiarState.level / 2), "補助発動", 2);
}

function drawFamiliar(context: CanvasRenderingContext2D): void {
    drawFamiliarFrame(context, {
        enabled: settings.familiarEnabled,
        def: getCurrentFamiliarDef(),
        level: familiarState.level,
        message: familiarMessage,
        messageUntil: familiarMessageUntil,
        pulseUntil: familiarPulseUntil,
        geometry,
        isMobile,
        lowSpecMode: settings.lowSpecMode,
        blackModeEnabled: settings.blackModeEnabled,
    });
}

function updateFamiliarButton(): void {
    if (familiarButton) familiarButton.textContent = t(`使い魔 Lv.${familiarState.level}`, `Familiar Lv.${familiarState.level}`);
    if (miracleTicketButton) miracleTicketButton.textContent = t(`奇跡チケット ${miracleTicketState.normal}`, `Tickets ${miracleTicketState.normal}`);
    if (secretNoteButton) secretNoteButton.textContent = t(`秘密ノート ${Object.keys(secretResearchNoteState.unlocked).length}`, `Secret notes ${Object.keys(secretResearchNoteState.unlocked).length}`);
    if (familiarToggleButton) familiarToggleButton.textContent = settings.familiarEnabled ? t("使い魔: ON", "Familiar: ON") : t("使い魔: OFF", "Familiar: OFF");
}

function refreshMiracleExpansionButtons(): void {
    updateFamiliarButton();
}

function unlockNote(id: string, toast = true): void {
    const result = unlockSecretResearchNote(secretResearchNoteState, id);
    secretResearchNoteState = result.state;
    if (result.unlockedNow && result.note) {
        addScore(2400, "SECRET NOTE");
        if (toast) showSoftToast(`秘密ノート解放: ${result.note.title}`);
        refreshMiracleExpansionButtons();
    }
}

function showMiracleTicketPopup(): void {
    showPopup("奇跡チケット", getMiracleTicketHtml(miracleTicketState));
    const use = (cost: { normal?: number; rare?: number; divine?: number }, score: number, label: string) => {
        const result = spendMiracleTickets(miracleTicketState, cost);
        miracleTicketState = result.state;
        if (!result.ok) { showSoftToast(result.message); return; }
        addScore(score, label);
        showSoftToast(`${label}を発動しました`);
        refreshMiracleExpansionButtons();
        updateInfo();
        showMiracleTicketPopup();
    };
    document.getElementById("ticket-small-boost")?.addEventListener("click", () => use({ normal: 3 }, 5000, "TICKET BOOST"));
    document.getElementById("ticket-rare-boost")?.addEventListener("click", () => use({ normal: 8, rare: 1 }, 18000, "RARE TICKET"));
    document.getElementById("ticket-divine-boost")?.addEventListener("click", () => use({ divine: 1 }, 85000, "DIVINE TICKET"));
}

function showSecretResearchNotePopup(): void {
    secretResearchNoteState = markSecretResearchNotesRead(secretResearchNoteState);
    showPopup("秘密研究ノート", getSecretResearchNoteHtml(SECRET_RESEARCH_NOTES, secretResearchNoteState));
    refreshMiracleExpansionButtons();
}

function applyExpeditionReward(reward: { xp: number; affection: number; ticketNormal: number; ticketRare: number; noteId?: string; title: string }): void {
    familiarState = gainFamiliarXp(familiarState, reward.xp, reward.affection);
    saveFamiliarState(familiarState);
    miracleTicketState.normal += reward.ticketNormal;
    miracleTicketState.rare += reward.ticketRare;
    miracleTicketState.totalEarned += reward.ticketNormal + reward.ticketRare;
    saveMiracleTicketState(miracleTicketState);
    if (reward.noteId) unlockNote(reward.noteId);
    addScore(1500 + reward.xp * 6, "EXPEDITION");
    setFamiliarMessage(`${reward.title} 帰還`, 4200);
    refreshMiracleExpansionButtons();
    updateInfo();
}

function showFamiliarExpeditionPopup(): void {
    const progress = getFamiliarExpeditionProgress(familiarExpeditionState);
    showPopup("使い魔遠征", getFamiliarExpeditionHtml(familiarExpeditionState, progress, FAMILIAR_EXPEDITION_PLANS, formatDurationMs));
    document.querySelectorAll<HTMLButtonElement>("[data-expedition-plan]").forEach((button) => {
        button.onclick = () => {
            const result = startFamiliarExpedition(familiarExpeditionState, button.dataset.expeditionPlan ?? "mini", familiarState.kind);
            familiarExpeditionState = result.state;
            showSoftToast(result.message);
            showFamiliarExpeditionPopup();
        };
    });
    document.getElementById("expedition-claim")?.addEventListener("click", () => {
        const result = claimFamiliarExpedition(familiarExpeditionState);
        familiarExpeditionState = result.state;
        if (result.ok && result.reward) applyExpeditionReward(result.reward);
        showSoftToast(result.message);
        showFamiliarExpeditionPopup();
    });
}

function showFamiliarPopup(): void {
    const def = getCurrentFamiliarDef();
    const level = getFamiliarLevelInfo(familiarState.xp);
    showPopup("使い魔研究室", getFamiliarPopupHtml(def, familiarState, level, getFamiliarMood(familiarState), FAMILIAR_DEFS));
    document.querySelectorAll<HTMLButtonElement>("[data-familiar-mode]").forEach((button) => {
        button.onclick = () => setFamiliarMode((button.dataset.familiarMode as FamiliarMode) || "assist");
    });
    document.querySelectorAll<HTMLButtonElement>("[data-familiar-call]").forEach((button) => {
        button.onclick = () => contractFamiliar(button.dataset.familiarCall as FamiliarKind, "図鑑");
    });
    document.getElementById("familiar-expedition-button")?.addEventListener("click", () => showFamiliarExpeditionPopup());
    document.getElementById("familiar-ticket-button")?.addEventListener("click", () => showMiracleTicketPopup());
    document.getElementById("familiar-note-button")?.addEventListener("click", () => showSecretResearchNotePopup());
    const input = document.getElementById("familiar-secret-input") as HTMLInputElement | null;
    const button = document.getElementById("familiar-secret-button") as HTMLButtonElement | null;
    const tryContract = () => {
        const found = findFamiliarBySecretCode(input?.value ?? "");
        if (!found) { showSoftToast("秘密コードは反応しませんでした"); return; }
        contractFamiliar(found.kind, "秘密コード");
    };
    button?.addEventListener("click", tryContract);
    input?.addEventListener("keydown", (event) => { if (event.key === "Enter") tryContract(); });
}

function buildMissionDefs(): MissionDef[] {
    return [
        {
            id: "first_sr",
            title: "はじめての大当たり",
            description: "SR以上を1回観測する",
            rewardScore: 8000,
            oncePerRun: true,
            evaluate: () => SPECIAL_EVENT_DEFS.some((def) => getRankScore(def.rank) >= getRankScore("SR") && (specialCreated[def.kind] ?? 0) > 0),
        },
        {
            id: "combo3",
            title: "奇跡コンボ",
            description: "奇跡コンボを3まで伸ばす",
            rewardScore: 12000,
            oncePerRun: true,
            evaluate: () => bestComboThisRun >= 3,
        },
        {
            id: "center_focus",
            title: "中央研究成功",
            description: "中央の受け皿に25%以上集める",
            rewardScore: 10000,
            oncePerRun: true,
            evaluate: () => {
                if (finishedCount < 100) return false;
                const centerIndex = Math.floor(settings.binCount / 2);
                const centerCount = binCounts[centerIndex] ?? 0;
                return finishedCount > 0 && centerCount / finishedCount >= 0.25;
            },
        },
        {
            id: "discard_master",
            title: "捨て区間回避",
            description: "捨て区間率を5%以下に抑える（300球以上）",
            rewardScore: 15000,
            oncePerRun: true,
            evaluate: () => finishedCount >= 300 && finishedCount > 0 && discardedCount / finishedCount <= 0.05,
        },
        {
            id: "big_run",
            title: "長時間実験",
            description: "5,000球以上処理する",
            rewardScore: 18000,
            oncePerRun: true,
            evaluate: () => finishedCount >= 5000,
        },
    ];
}

function buildTutorialMissionDefs(): TutorialMissionDef[] {
    if (!TUTORIAL_MISSIONS_ENABLED) return [];
    return [
        {
            id: "watch_100",
            label: "100球を観測",
            description: "まずは100個の落下を見届ける",
            evaluate: () => finishedCount >= 100,
        },
        {
            id: "tap_board",
            label: "盤面に介入",
            description: "画面をタップして波紋を1回出す",
            evaluate: () => tapInterventionCount >= 1,
        },
        {
            id: "small_event",
            label: "小さな奇跡",
            description: "図鑑外の小イベントを1回観測する",
            evaluate: () => smallMiracleCount >= 1,
        },
        {
            id: "omen_or_pin",
            label: "予兆かレアピン",
            description: "奇跡予兆、またはレアピン接触を1回見る",
            evaluate: () => !!lastOmenText || Object.values(rarePinTouchCount).some((x) => x > 0),
        },
    ];
}

function shouldShowTutorialMissions(): boolean {
    if (!TUTORIAL_MISSIONS_ENABLED) return false;
    return guideModeActive || savedRecords.totalRuns <= 0;
}

function scheduleTutorialMissionCollapse(): void {
    if (!isMobile) return;
    if (tutorialMissionCollapseTimer !== undefined) window.clearTimeout(tutorialMissionCollapseTimer);
    tutorialMissionCollapseTimer = window.setTimeout(() => {
        if (isAppTerminated) return;
        tutorialMissionExpanded = false;
        updateTutorialMissions(false);
    }, 5000);
}

function renderTutorialMissionBadge(clearCount: number, totalCount: number): void {
    tutorialMissionPanel.style.left = "10px";
    tutorialMissionPanel.style.right = "auto";
    tutorialMissionPanel.style.bottom = "14px";
    tutorialMissionPanel.style.top = "auto";
    tutorialMissionPanel.style.width = "auto";
    tutorialMissionPanel.style.maxWidth = "calc(100vw - 20px)";
    tutorialMissionPanel.style.maxHeight = "none";
    tutorialMissionPanel.style.padding = "9px 12px";
    tutorialMissionPanel.style.borderRadius = "999px";
    tutorialMissionPanel.style.background = "rgba(15,23,42,.52)";
    tutorialMissionPanel.style.fontSize = "12px";
    tutorialMissionPanel.innerHTML = `<span style="white-space:nowrap;">研究ミッション ${clearCount}/${totalCount}</span>`;
}

function renderTutorialMissionDetail(rows: string, clearCount: number, totalCount: number): void {
    tutorialMissionPanel.style.left = isMobile ? "10px" : "18px";
    tutorialMissionPanel.style.right = isMobile ? "10px" : "auto";
    tutorialMissionPanel.style.bottom = isMobile ? "14px" : "auto";
    tutorialMissionPanel.style.top = isMobile ? "auto" : "112px";
    tutorialMissionPanel.style.width = isMobile ? "auto" : "320px";
    tutorialMissionPanel.style.maxWidth = isMobile ? "calc(100vw - 20px)" : "320px";
    tutorialMissionPanel.style.maxHeight = isMobile ? "42vh" : "44vh";
    tutorialMissionPanel.style.padding = isMobile ? "12px 14px" : "12px 14px";
    tutorialMissionPanel.style.borderRadius = "18px";
    tutorialMissionPanel.style.background = "rgba(15,23,42,.68)";
    tutorialMissionPanel.style.fontSize = isMobile ? "13px" : "14px";
    const collapseHint = isMobile ? `<span style="opacity:.68;font-size:.86em;">タップで5秒後に折りたたみ</span>` : "";
    tutorialMissionPanel.innerHTML = `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;"><b>はじめての研究ミッション</b><span style="opacity:.78;">${clearCount}/${totalCount}</span></div>${collapseHint}${rows}`;
}

function updateTutorialMissions(forceExpand = false): void {
    if (!TUTORIAL_MISSIONS_ENABLED) {
        tutorialMissionPanel.style.display = "none";
        tutorialMissionPanelVisible = false;
        return;
    }
    if (!shouldShowTutorialMissions()) {
        tutorialMissionPanel.style.display = "none";
        tutorialMissionPanelVisible = false;
        return;
    }
    const defs = buildTutorialMissionDefs();
    let changed = false;
    for (const mission of defs) {
        if (!tutorialMissionProgress[mission.id] && mission.evaluate()) {
            tutorialMissionProgress[mission.id] = true;
            changed = true;
            addScore(1200, "GUIDE", geometry.width / 2, 96 * geometry.scale);
            showSoftToast(t(`ミッション達成: ${mission.label}`, `Mission clear: ${mission.label}`));
            maybeShowCommentary(`実況「${mission.label}を確認しました」`, true);
        }
    }
    const clearCount = defs.filter((mission) => tutorialMissionProgress[mission.id]).length;
    const rows = defs.map((mission) => {
        const done = tutorialMissionProgress[mission.id];
        return `<div style="display:flex;gap:8px;align-items:flex-start;margin-top:4px;opacity:${done ? ".72" : "1"};"><span>${done ? "✅" : "□"}</span><span><b>${mission.label}</b><br><span style="opacity:.72;font-size:.92em;">${mission.description}</span></span></div>`;
    });
    if (changed && isMobile) {
        tutorialMissionExpanded = true;
        scheduleTutorialMissionCollapse();
    }
    if (forceExpand && isMobile) tutorialMissionExpanded = true;
    if (isMobile && !tutorialMissionExpanded) {
        renderTutorialMissionBadge(clearCount, defs.length);
    } else {
        renderTutorialMissionDetail(rows.join(""), clearCount, defs.length);
    }
    tutorialMissionPanel.style.display = settings.mobileCompactMode && clearCount >= defs.length ? "none" : "block";
    tutorialMissionPanelVisible = tutorialMissionPanel.style.display !== "none";
    if (changed && clearCount >= defs.length) {
        showMilestone("はじめての研究ミッション 完了");
        try { localStorage.setItem(FIRST_RUN_GUIDE_STORAGE_KEY, "1"); } catch {}
        window.setTimeout(() => {
            if (!isAppTerminated && tutorialMissionPanelVisible) tutorialMissionPanel.style.display = "none";
        }, isMobile ? 8000 : 5000);
    }
}

function updateResearchProgressPanel(): void {
    if (!isStarted || isFinished || settings.simpleMode || settings.mobileCompactMode) {
        researchProgressPanel.style.display = "none";
        return;
    }
    const progress = clamp(finishedCount / Math.max(1, settings.targetCount), 0, 1);
    const miracleDensity = clamp((miracleCombo * 12 + Object.values(specialCreated).reduce((a, b) => a + b, 0) * 8 + smallMiracleCount * 2 + (lastOmenText ? 8 : 0)) / 100, 0, 1);
    researchProgressPanel.innerHTML = `<div style="display:flex;align-items:center;gap:10px;"><span style="white-space:nowrap;">研究進捗 ${Math.round(progress * 100)}%</span><div style="flex:1;height:8px;border-radius:999px;background:rgba(255,255,255,.22);overflow:hidden;"><div style="height:100%;width:${Math.round(progress * 100)}%;background:linear-gradient(90deg,#fde68a,#86efac,#93c5fd);"></div></div><span style="white-space:nowrap;">奇跡濃度 ${Math.round(miracleDensity * 100)}%</span></div>`;
    researchProgressPanel.style.display = "block";
}

function scheduleFirstRunShowcase(): void {
    for (const timer of guideTimers) window.clearTimeout(timer);
    guideTimers = [];
    const alreadySeen = (() => { try { return localStorage.getItem(FIRST_RUN_GUIDE_STORAGE_KEY) === "1"; } catch { return false; } })();
    guideModeActive = !alreadySeen || savedRecords.totalRuns <= 0;
    guideModeStartedAt = Date.now();
    welcomeShowcaseDone = false;
    if (!guideModeActive) return;
    if (isMobile) {
        try { localStorage.setItem(FIRST_RUN_GUIDE_STORAGE_KEY, "1"); } catch {}
        guideModeActive = false;
        return;
    }
    const schedule = (delay: number, action: () => void) => {
        const id = window.setTimeout(() => { if (isStarted && !isFinished && !isAppTerminated) action(); }, delay);
        guideTimers.push(id);
    };
    schedule(900, () => showWelcomeShowcase());
    schedule(1800, () => { void playFirstRunShowcaseVideo(); });
    schedule(5200, () => maybeShowCommentary("研究員A「まずは盤面を観測してみましょう」", true));
    schedule(9200, () => triggerSmallMiracleEvent("pinSpark"));
    schedule(11200, () => { if (appRandom() < 0.85) void playFirstRunShowcaseVideo(); });
    schedule(14500, () => maybeTriggerMiracleOmen(true));
    schedule(21000, () => triggerSmallMiracleEvent("faviconWink"));
    schedule(30000, () => {
        maybeShowCommentary("観測装置「ここからは通常確率で記録を続けます」", true);
        try { localStorage.setItem(FIRST_RUN_GUIDE_STORAGE_KEY, "1"); } catch {}
    });
}

function showWelcomeShowcase(): void {
    if (welcomeShowcaseDone || settings.simpleMode) return;
    welcomeShowcaseDone = true;
    showSoftToast(t("研究所起動成功", "Lab booted"));
    maybeShowCommentary("実況「ようこそ、MiracleBallLabへ」", true);
    addFloatingText("WELCOME MIRACLE", geometry.width / 2, 88 * geometry.scale, "#fde68a");
    fireConfetti("normal");
}

function triggerSmallMiracleEvent(forcedId?: string): void {
    if (isAppTerminated || !isStarted || isFinished || isPaused || isMiraclePaused || settings.simpleMode) return;
    const events = ["pinSpark", "lucky777", "labComment", "faviconWink", "miniWave"];
    const id = forcedId ?? events[Math.floor(appRandom() * events.length)] ?? "pinSpark";
    smallMiracleCount++;
    nextSmallMiracleAt = Date.now() + SMALL_MIRACLE_MIN_INTERVAL_MS + appRandom() * 12000;
    if (id === "pinSpark") {
        addFloatingText("ピンが光った", geometry.width / 2, geometry.height * 0.24, "#fde68a");
        for (const body of engine.world.bodies) {
            const plugin = (body as any).plugin;
            if (plugin?.isPin && appRandom() < 0.18) plugin.wiggleFrames = Math.max(plugin.wiggleFrames ?? 0, 24);
        }
    } else if (id === "lucky777") {
        addFloatingText("LUCKY 777", geometry.width / 2, geometry.height * 0.22, "#facc15");
        addScore(777, "LUCKY", geometry.width / 2, geometry.height * 0.30);
        fireConfetti("normal");
    } else if (id === "faviconWink") {
        addFloatingText("favicon が一瞬光った", geometry.width / 2, geometry.height * 0.18, "#86efac");
        triggerCameraShake(3 * geometry.scale, 180);
    } else if (id === "miniWave") {
        addFloatingText("盤面に小さな波紋", geometry.width / 2, geometry.height * 0.20, "#93c5fd");
        createTapRipple(geometry.width / 2, geometry.height * 0.36, false);
    } else {
        maybeShowCommentary("研究員B「いま、小さな奇跡みたいな反応がありました」", true);
        addFloatingText("小さな奇跡", geometry.width / 2, geometry.height * 0.24, "#ffffff");
    }
    updateTutorialMissions();
}

function maybeTriggerSmallMiracleEvent(): void {
    if (settings.effectsEnabled === false && !guideModeActive) return;
    const now = Date.now();
    if (nextSmallMiracleAt <= 0) nextSmallMiracleAt = now + 7000 + appRandom() * 10000;
    const guideBoost = guideModeActive && now - guideModeStartedAt < 30000;
    if (now < nextSmallMiracleAt && !guideBoost) return;
    const rate = guideBoost ? 0.018 : 0.0025 * Math.max(0.75, getEffectIntensity());
    if (appRandom() < rate) triggerSmallMiracleEvent();
}

function createTapRipple(x: number, y: number, pushDrops = true): void {
    tapRipples.push({ x, y, life: 34, maxLife: 34 });
    if (!pushDrops) return;
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isDrop) continue;
        const dx = body.position.x - x;
        const dy = body.position.y - y;
        const dist = Math.max(24, Math.hypot(dx, dy));
        const range = 150 * geometry.scale;
        if (dist > range) continue;
        const power = (1 - dist / range) * 0.00008;
        Body.applyForce(body, body.position, { x: (dx / dist) * power, y: (dy / dist) * power - 0.000018 });
    }
}

function handleTapIntervention(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (geometry.width / Math.max(1, rect.width));
    const y = (event.clientY - rect.top) * (geometry.height / Math.max(1, rect.height));
    if (x < 0 || x > geometry.width || y < 0 || y > geometry.height) return;
    tapInterventionCount++;
    createTapRipple(x, y, true);
    addFloatingText("観測波紋", x, y, "#93c5fd");
    if (tapInterventionCount % 3 === 1) maybeShowCommentary("実況「ユーザーが盤面へ介入しました」", true);
    updateTutorialMissions();
}

function drawTapRipples(context: CanvasRenderingContext2D): void {
    drawTapRipplesFrame(context, tapRipples, {
        simpleMode: settings.simpleMode,
        isPaused,
        geometry,
    });
}

function getResearchEvaluation(): ResearchEvaluation {
    return evaluateResearchRun({
        specialCreated,
        chainCount: Object.keys(unlockedChainRunIds).length,
        finishedCount,
        discardedCount,
        binCount: settings.binCount,
        binCounts,
        bestComboThisRun,
        smallMiracleCount,
        hasOmen: !!lastOmenText,
        runScore,
        clamp,
    });
}

function checkMissionProgress(): void {
    for (const mission of missionDefs) {
        if (missionProgress[mission.id]) continue;
        if (!mission.evaluate()) continue;
        missionProgress[mission.id] = true;
        savedRecords.missionCompleted[mission.id] = (savedRecords.missionCompleted[mission.id] ?? 0) + 1;
        addScore(mission.rewardScore, `MISSION ${mission.title}`);
        showMilestone(`MISSION CLEAR: ${mission.title}`);
        saveRecords();
    }
    updateTutorialMissions();
}

function updateSkillButtons(): void {
    const mapping: Record<SkillKind, string> = {
        shockwave: `衝撃波 ×${skillState.shockwave}`,
        magnet: `磁石 ×${skillState.magnet}`,
        timeStop: `時止め ×${skillState.timeStop}`,
    };
    const enMapping: Record<SkillKind, string> = {
        shockwave: `Shockwave ×${skillState.shockwave}`,
        magnet: `Magnet ×${skillState.magnet}`,
        timeStop: `Time stop ×${skillState.timeStop}`,
    };
    for (const key of Object.keys(skillButtons) as SkillKind[]) {
        const button = skillButtons[key];
        if (!button) continue;
        button.textContent = isEnglish ? enMapping[key] : mapping[key];
        button.style.opacity = (skillState[key] ?? 0) > 0 ? "1" : ".45";
    }
}

function applyMagnetSkill(): void {
    magnetUntil = Date.now() + MAGNET_DURATION_MS;
    addFloatingText("磁力場 発生", geometry.width / 2, 90 * geometry.scale, "#0f766e");
    triggerCameraShake(6 * geometry.scale, 180);
}

function applyShockwaveSkill(): void {
    const originX = geometry.width / 2;
    const originY = geometry.height * 0.28;
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isDrop) continue;
        const dx = body.position.x - originX;
        const dy = body.position.y - originY;
        const len = Math.max(16, Math.hypot(dx, dy));
        Body.setVelocity(body, { x: body.velocity.x + (dx / len) * 8 * geometry.scale, y: body.velocity.y + (dy / len) * 6 * geometry.scale - 2 * geometry.scale });
    }
    addFloatingText("衝撃波", originX, originY, "#2563eb");
    triggerCameraShake(10 * geometry.scale, 260);
}

function applyTimeStopSkill(): void {
    if (!isStarted || isFinished || isPaused || isMiraclePaused) return;
    isPaused = true;
    Runner.stop(runner);
    updateStopButton();
    updateInfo();
    addFloatingText("時間停止", geometry.width / 2, geometry.height * 0.22, "#7c3aed");
    window.setTimeout(() => {
        if (isFinished || isMiraclePaused) return;
        isPaused = false;
        Runner.run(runner, engine);
        updateStopButton();
        updateInfo();
    }, TIME_STOP_DURATION_MS);
}

function useSkill(kind: SkillKind): void {
    if (!isStarted || isFinished || isMiraclePaused) return;
    if ((skillState[kind] ?? 0) <= 0) return;
    skillState[kind]--;
    lastSkillUsedAt = Date.now();
    registerSkillSecretCombo(kind);
    playUiSound(kind === "timeStop" ? "time" : "skill");
    if (kind === "shockwave") applyShockwaveSkill();
    else if (kind === "magnet") applyMagnetSkill();
    else applyTimeStopSkill();
    addScore(2500, `SKILL ${kind.toUpperCase()}`, geometry.width / 2, geometry.height * 0.16);
    updateSkillButtons();
    updateInfo();
}

function showMissionPopup(): void {
    showPopup("ミッション", getMissionHtml({
        missions: missionDefs,
        progress: missionProgress,
        totalCompleted: savedRecords.missionCompleted,
        isMobile,
    }));
}

function showSharePopup(): void {
    getShareReplayController().showSharePopup();
}

function recordSpecialDiscovery(def: SpecialEventDef): void {
    savedRecords.discovered[def.kind] = (savedRecords.discovered[def.kind] ?? 0) + 1;
    if (!savedRecords.discoveredFirstAt[def.kind]) savedRecords.discoveredFirstAt[def.kind] = Date.now();
    if (getRankScore(def.rank) > getRankScore(savedRecords.bestRank)) {
        savedRecords.bestRank = def.rank;
        savedRecords.bestLabel = def.label;
    }
    addScore(getRankBaseScore(def.rank), `RARE ${def.label}`);
    const gachaReward = getGachaPointRewardForRank(def.rank);
    if (gachaReward > 0) {
        addGachaPoint(gachaReward, `${def.rank}以上発見: ${def.label}`, false);
        if (getRankScore(def.rank) >= getRankScore("SSR")) showSoftToast(`奇跡ガチャP +${gachaReward.toLocaleString()}：${def.label}`);
    }
    tryUnlockFusions();
    saveRecords();
}

function incrementSpecialCreated(kind: DropKind): void {
    specialCreated[kind] = (specialCreated[kind] ?? 0) + 1;
    if (kind === "cosmicEgg") cosmicEggCreated++;
    else if (kind === "blackSun") blackSunCreated++;
    else if (kind === "heart") heartCreated++;
    else if (kind === "shootingStar") starCreated++;
    else if (kind === "crown") crownCreated++;
    else if (kind === "silverUfo") silverUfoCreated++;
    else if (kind === "blueFlame") blueFlameCreated++;
    else if (kind === "luckySeven") luckySevenCreated++;
    else if (kind === "timeRift") timeRiftCreated++;
    else if (kind === "labExplosion") labExplosionCreated++;
}

function rollSpecialEventWithScale(extraScale = 1): SpecialEventDef | null {
    const fortune = currentDailyFortune ?? getDailyFortune();
    currentDailyFortune = fortune;
    const season = getCurrentEventSeason();
    const scale = calculateMiracleRateScale({
        probabilityMode: settings.probabilityMode,
        passiveBoost: getPassiveMiracleBoost(),
        dailyBoost: fortune.rateBoost,
        seasonBoost: season.rateBoost,
        extraScale,
    });
    return rollSpecialEventBase(SPECIAL_EVENT_DEFS, scale, appRandom());
}

function rollSpecialEvent(): SpecialEventDef | null {
    return rollSpecialEventWithScale(1);
}

function buildWeirdMiracleText(def: SpecialEventDef): string {
    return buildWeirdMiracleTextWithRandom(def, appRandom);
}



function getDailyFortune(): DailyFortune {
    return buildDailyFortune({
        dateKey: getTodayKey(),
        binCount: settings.binCount,
        specialDefs: SPECIAL_EVENT_DEFS,
        fallbackDefs: BASE_SPECIAL_EVENT_DEFS,
        hashTextToNumber,
    });
}

function getResearchExp(): number {
    const discoveredBonus = getDiscoveredCount() * 4200;
    const fusionBonus = getFusionCount() * 12000;
    const logBonus = miracleLogs.length * 260;
    return Math.max(0, savedRecords.totalScore + runScore + discoveredBonus + fusionBonus + logBonus + savedRecords.totalRuns * 120);
}

function getResearchLevelInfo(): { level: number; title: string; exp: number; current: number; next: number; percent: number } {
    const exp = getResearchExp();
    const level = Math.max(1, Math.floor(Math.sqrt(exp / 900)) + 1);
    const currentLevelExp = Math.pow(level - 1, 2) * 900;
    const nextLevelExp = Math.pow(level, 2) * 900;
    const titles = ["見習い研究員", "確率観測員", "奇跡解析官", "主任研究員", "世界改変監査官", "乱数司祭", "奇跡所長"];
    const title = titles[Math.min(titles.length - 1, Math.floor((level - 1) / 8))] ?? titles[0];
    const current = Math.max(0, exp - currentLevelExp);
    const next = Math.max(1, nextLevelExp - currentLevelExp);
    return { level, title, exp, current, next, percent: clamp((current / next) * 100, 0, 100) };
}

function getFusionCount(): number {
    return Object.keys(savedRecords.fusions ?? {}).length;
}

function getFusionUnlocked(def: FusionDef): boolean {
    return !!savedRecords.fusions?.[def.id];
}

function getFusionReady(def: FusionDef): boolean {
    return def.sourceKinds.every((kind) => (savedRecords.discovered[kind] ?? 0) >= def.requiredCount);
}

function tryUnlockFusions(): void {
    let changed = false;
    for (const fusion of FUSION_DEFS) {
        if (getFusionUnlocked(fusion) || !getFusionReady(fusion)) continue;
        savedRecords.fusions[fusion.id] = Date.now();
        addScore(fusion.rewardScore, `FUSION ${fusion.label}`);
        miracleLogs.unshift({
            label: fusion.label,
            rank: fusion.rank,
            denominator: 0,
            finishedAt: Date.now(),
            finishedCount,
            mode: settings.probabilityMode,
            speedLabel: speedLabelText,
            combo: miracleCombo,
            note: "合成・派生で解放",
        });
        miracleLogs = miracleLogs.slice(0, 80);
        recentMiracleMiniLogs = miracleLogs.slice(0, 3);
        updateRecentMiracleMini();
        savedRecords.miracleLogs = miracleLogs;
        showMilestone(`合成奇跡 解放: ${fusion.label}`);
        changed = true;
    }
    if (changed) saveRecords();
}

function showDailyFortunePopup(): void {
    const fortune = currentDailyFortune ?? getDailyFortune();
    currentDailyFortune = fortune;
    showPopup("今日の運勢・奇跡率", getDailyFortuneHtml(fortune, isMobile));
}

function showFusionPopup(): void {
    const fusions = FUSION_DEFS.map((fusion) => {
        const unlocked = getFusionUnlocked(fusion);
        const ready = getFusionReady(fusion);
        const sources = fusion.sourceKinds.map((kind) => {
            const def = findSpecialDef(kind);
            const count = savedRecords.discovered[kind] ?? 0;
            return `${def?.label ?? kind} ${count}/${fusion.requiredCount}`;
        }).join(" / ");
        return { fusion, unlocked, ready, sources };
    });
    const chains = MIRACLE_CHAIN_DEFS.map((chain) => {
        const names = chain.sequence.map((kind) => findSpecialDef(kind)?.label ?? kind).join(" → ");
        const unlocked = !!unlockedChainRunIds[chain.id];
        return { chain, names, unlocked };
    });
    showPopup("奇跡合成・派生", getFusionHtml({ fusions, chains, isMobile }));
}

function unlockSecret(id: string, label: string, detail: string, rewardScore?: number): void {
    if (savedRecords.secretUnlocked[id]) {
        showMilestone(label + " 起動");
        return;
    }
    const def = SECRET_DEFS.find((x) => x.id === id);
    const score = rewardScore ?? def?.rewardScore ?? 7777;
    savedRecords.secretUnlocked[id] = Date.now();
    addScore(score, "SECRET " + label);
    saveRecords();
    playSecretSound();
    showPopup("秘密操作を発見", getSecretUnlockHtml(label, detail, score));
}

function showAdminGateOrPanel(): void {
    if (isAdminMode) {
        showAdminPanelPopup();
        return;
    }
    showAdminGatePopup();
}

function updateAdminButton(): void {
    if (!adminButton) return;
    const palette = getThemeUiPalette(currentTheme);
    adminButton.textContent = isAdminMode ? t("主任モード", "Admin") : t("合言葉", "Passcode");
    adminButton.style.background = palette.buttonBg;
    adminButton.style.color = palette.buttonText;
    adminButton.style.borderColor = palette.buttonBorder;
    adminButton.style.boxShadow = isAdminMode ? "0 0 0 3px rgba(248,113,113,.30)" : "";
}

function showAdminGatePopup(): void {
    showPopup("合言葉", getAdminGateHtml({ isMobile, uiFontPx, uiButtonFontPx, roundedUiFont: ROUNDED_UI_FONT }));
    const input = document.getElementById("admin-passcode-input") as HTMLInputElement | null;
    const button = document.getElementById("admin-unlock-button") as HTMLButtonElement | null;
    const message = document.getElementById("admin-passcode-message") as HTMLDivElement | null;
    const unlock = async () => {
        if (!input || !button) return;
        button.disabled = true;
        try {
            const ok = await verifyAdminPasscode(input.value);
            if (ok) {
                isAdminMode = true;
                localStorage.setItem(ADMIN_UNLOCK_STORAGE_KEY, "1");
                recordAdminEvent({ type: "admin_unlock", at: Date.now(), detail: "passcode ok" });
                updateAdminButton();
                playUiSound("open");
                showSoftToast("研究主任モードを解放しました");
                showAdminPanelPopup();
                return;
            }
            if (message) message.textContent = "照合失敗：合言葉が違います。";
            playUiSound("close");
        } catch {
            if (message) message.textContent = "このブラウザでは照合に失敗しました。";
        } finally {
            button.disabled = false;
        }
    };
    button?.addEventListener("click", () => { void unlock(); });
    input?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") void unlock();
    });
    window.setTimeout(() => input?.focus(), 60);
}

function showAdminPanelPopup(): void {
    if (!isAdminMode) {
        showAdminGatePopup();
        return;
    }
    const miracleButtons = SPECIAL_EVENT_DEFS
        .slice()
        .sort((a, b) => b.denominator - a.denominator)
        .map((def) => getAdminMiracleButtonHtml(def, { isMobile, formatProbability }))
        .join("");
    showPopup("研究主任モード", getAdminPanelHtml({ miracleButtons, isMobile, uiButtonFontPx }));
    document.getElementById("admin-cosmic-egg-button")!.onclick = () => triggerAdminMiracle("cosmicEgg");
    document.getElementById("admin-sword-button")!.onclick = () => triggerAdminMiracle("swordImpact");
    document.getElementById("admin-all-effects-button")!.onclick = () => adminEnableAllEffects();
    document.getElementById("admin-r2-video-button")!.onclick = () => { void showAdminRemoteVideoTestPopup(); };
    document.getElementById("admin-offline-video-save-button")!.onclick = () => { void showOfflineVideoDownloadPopup(); };
    document.getElementById("admin-log-button")!.onclick = () => showAdminStatsPopup();
    document.getElementById("admin-runtime-guard-log-button")!.onclick = () => showRuntimeGuardLogPopup();
    document.getElementById("admin-magic-answer-button")!.onclick = () => showAdminMagicCircleAnswerPopup();
    document.getElementById("admin-tempura-secret-button")!.onclick = () => showAnagoTempuraSecretPopup();
    document.getElementById("admin-skill-button")!.onclick = () => adminAddSkillStock();
    document.getElementById("admin-unlock-book-button")!.onclick = () => adminUnlockMiracleBookForTest();
    document.getElementById("admin-lock-button")!.onclick = () => adminLockMode();
    document.querySelectorAll<HTMLButtonElement>(".admin-miracle-button").forEach((button) => {
        button.onclick = () => triggerAdminMiracle(button.dataset.kind || "");
    });
}

function showAnagoTempuraSecretPopup(): void {
    showPopup("隠し要素：穴子の天ぷら", getAnagoTempuraSecretHtml());
}

function triggerAdminMiracle(kind: string): void {
    const def = findSpecialDef(kind);
    if (!def) {
        showSoftToast("対象の奇跡が見つかりません");
        return;
    }
    adminForceNextMiracleEffect = true;
    showMiracle(def.kind, def.symbol, `[${def.rank}] ${formatProbability(def.denominator)}`, buildWeirdMiracleText(def));
    showSoftToast(`${def.label} を強制発動しました`);
}

async function showAdminRemoteVideoTestPopup(): Promise<void> {
    if (!isAdminMode) {
        showAdminGatePopup();
        return;
    }

    showPopup("R2動画確認", getAdminRemoteVideoLoadingHtml(MIRACLE_MANIFEST_URL));

    const assets = await loadRemoteMiracleAssets(true);
    const videos = assets.filter((asset) => asset.kind === "video");

    if (videos.length === 0) {
        showPopup("R2動画確認", getAdminRemoteVideoEmptyHtml());
        return;
    }

    const rows = videos.map((asset, index) => {
        return getAdminRemoteVideoRowHtml({
            index,
            id: asset.id,
            rank: String(asset.rank ?? "common").toUpperCase(),
            mainUrl: getRemoteMiracleAssetMainUrl(asset),
            opacity: asset.opacity ?? 0.45,
            weight: asset.weight ?? 1,
            isMobile,
        });
    }).join("");

    showPopup("R2動画確認", getAdminRemoteVideoListHtml({ count: videos.length, rows, isMobile }));

    document.querySelectorAll<HTMLButtonElement>(".admin-r2-video-play-button").forEach((button) => {
        button.onclick = () => {
            const asset = videos.find((x) => x.id === button.dataset.assetId);
            if (!asset) {
                showSoftToast("対象動画が見つかりません");
                return;
            }

            closeHelpPopup();
            showSoftToast(`${getRemoteMiracleAssetLabel(asset)} を再生します`);
            void playRemoteMiracleVideoAsset(asset, true);
        };
    });

    document.querySelectorAll<HTMLButtonElement>(".admin-r2-video-open-button").forEach((button) => {
        button.onclick = () => {
            const asset = videos.find((x) => x.id === button.dataset.assetId);
            if (!asset) {
                showSoftToast("対象動画が見つかりません");
                return;
            }

            const url = getRemoteMiracleAssetMainUrl(asset);
            if (!url) {
                showSoftToast("URLがありません");
                return;
            }

            window.open(url, "_blank", "noopener,noreferrer");
        };
    });

    const reloadButton = document.getElementById("admin-r2-video-reload-button") as HTMLButtonElement | null;
    if (reloadButton) {
        reloadButton.onclick = () => {
            void showAdminRemoteVideoTestPopup();
        };
    }

    const stopButton = document.getElementById("admin-r2-video-stop-button") as HTMLButtonElement | null;
    if (stopButton) {
        stopButton.onclick = () => {
            stopRemoteMiracleVideo();
            showSoftToast("R2動画を停止しました");
        };
    }
}

function adminEnableAllEffects(): void {
    settings.effectsEnabled = true;
    settings.cameraShakeEnabled = true;
    settings.boardAnomalyEnabled = true;
    settings.normalBallTraitsEnabled = true;
    settings.timeBallSkinsEnabled = true;
    settings.commentaryEnabled = true;
    settings.simpleMode = false;
    settings.effectMode = "recording";
    effectModeSelect.value = "recording";
    updateEffectsButton();
    updateCameraShakeButton();
    updateBoardAnomalyButton();
    updateNormalTraitButton();
    updateTimeBallSkinButton();
    updateCommentaryButton();
    updateSimpleModeButton();
    updateInfo();
    showSoftToast("演出系を全部ONにしました");
}

function adminAddSkillStock(): void {
    skillState.shockwave += 99;
    skillState.magnet += 99;
    skillState.timeStop += 99;
    updateSkillButtons();
    updateInfo();
    showSoftToast("スキル回数を+99しました");
}

function adminUnlockMiracleBookForTest(): void {
    const now = Date.now();
    SPECIAL_EVENT_DEFS.forEach((def) => {
        savedRecords.discovered[def.kind] = Math.max(savedRecords.discovered[def.kind] ?? 0, 1);
        savedRecords.discoveredFirstAt[def.kind] = savedRecords.discoveredFirstAt[def.kind] || now;
    });
    saveRecords();
    updateStatusMiniOverlays();
    showSoftToast("図鑑をテスト解放しました");
}

function adminLockMode(): void {
    isAdminMode = false;
    localStorage.removeItem(ADMIN_UNLOCK_STORAGE_KEY);
    updateAdminButton();
    closeHelpPopup();
    showSoftToast("管理者モードを解除しました");
}

function showSecretPopup(): void {
    showPopup("秘密操作", getSecretHtml({
        defs: SECRET_DEFS,
        unlocked: savedRecords.secretUnlocked,
        isMobile,
    }));
}

function handleSecretKey(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (!/^[a-z]$/.test(key)) return;
    secretKeyBuffer = (secretKeyBuffer + key).slice(-SECRET_KEY_MAX_LENGTH);
    for (const [code, info] of Object.entries(SECRET_KEY_SEQUENCES)) {
        if (secretKeyBuffer.endsWith(code)) {
            const familiarDef = findFamiliarBySecretCode(code);
            if (familiarDef) contractFamiliar(familiarDef.kind, "PC秘密キー");
            const id = familiarDef ? `familiar-${familiarDef.kind}` : "keyword-" + code;
            if (!familiarDef) unlockSecret(id, info.label, info.detail);
            secretKeyBuffer = "";
            return;
        }
    }
}

function registerPauseSecretTap(): void {
    const now = Date.now();
    pauseTapHistory = [...pauseTapHistory.filter((x) => now - x < 5000), now];
    if (pauseTapHistory.length >= 7) {
        unlockSecret("pause-seven-taps", "時間停止ごっこ", "一時停止操作を短時間に7回行いました。時間を止めようとする研究記録です。");
        pauseTapHistory = [];
    }
}

function registerSkillSecretCombo(kind: SkillKind): void {
    skillComboBuffer = [...skillComboBuffer, kind].slice(-3);
    if (skillComboBuffer.join(">") === "shockwave>magnet>timeStop") {
        unlockSecret("skill-combo-lab", "三種の介入", "盤面介入スキルを決まった順番で使いました。研究員が完全に介入しています。");
        skillComboBuffer = [];
    }
}
function updateThemeSelectLabels(): void {
    themeSelect.innerHTML = getThemeOptions().map((x) => `<option value="${x.value}">${isEnglish ? x.en : x.ja}</option>`).join("");
    themeSelect.value = currentTheme;
}

function setThemeCssVariables(palette: ReturnType<typeof getThemeUiPalette>): void {
    document.body.classList.add("miracle-theme-active");
    document.documentElement.style.setProperty("--miracle-theme-panel", palette.panel);
    document.documentElement.style.setProperty("--miracle-theme-game", palette.game);
    document.documentElement.style.setProperty("--miracle-theme-section", palette.section);
    document.documentElement.style.setProperty("--miracle-theme-field-bg", palette.fieldBg);
    document.documentElement.style.setProperty("--miracle-theme-text", palette.fieldText);
    document.documentElement.style.setProperty("--miracle-theme-title", palette.title);
    document.documentElement.style.setProperty("--miracle-theme-border", palette.buttonBorder);
    document.documentElement.style.setProperty("--miracle-theme-button-bg", palette.buttonBg);
    document.documentElement.style.setProperty("--miracle-theme-button-text", palette.buttonText);
    document.documentElement.style.setProperty("--miracle-theme-button-border", palette.buttonBorder);
}

function applyTheme(): void {
    const palette = getThemeUiPalette(currentTheme);
    setThemeCssVariables(palette);
    document.body.style.background = palette.body;
    appRoot.style.background = palette.body;
    info.style.background = palette.panel;
    info.style.color = palette.fieldText;
    // 盤面側は背景画像・Matter.js描画を優先する。
    // テーマCSSで gameArea の background を強制すると、実行中にピンや玉が見えづらくなるため、
    // 盤面背景は applyBackgroundImage() に集約する。
    if (!activeRareBackgroundKind) applyBackgroundImage();
    appHeader.style.background = getMetallicPanelBackground(settings.blackModeEnabled);
    appHeader.style.color = palette.fieldText;
    appHeader.style.borderColor = "rgba(148,163,184,.42)";
    appHeader.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.70), 0 10px 28px rgba(30,42,58,.14)";
    appHeaderNote.style.color = palette.mutedText;
    recordHero.style.background = getMetallicPanelBackground(settings.blackModeEnabled);
    recordHero.style.color = palette.fieldText;
    recordHero.style.borderColor = palette.buttonBorder;
    controlArea.style.background = getMetallicPanelBackground(settings.blackModeEnabled);
    buttonArea.style.background = getMetallicPanelBackground(settings.blackModeEnabled);
    randomGraphArea.style.background = getMetallicPanelBackground(settings.blackModeEnabled);
    applyThemePaletteToPanel(info, palette);
    if (mobileSettingsPanel) {
        mobileSettingsPanel.style.background = settings.blackModeEnabled ? "linear-gradient(135deg,rgba(15,23,42,.38),rgba(51,65,85,.22),rgba(148,163,184,.12))" : "linear-gradient(135deg,rgba(255,255,255,.20),rgba(190,205,224,.12),rgba(255,255,255,.16))";
        mobileSettingsPanel.style.color = palette.fieldText;
        mobileSettingsPanel.style.borderColor = palette.buttonBorder;
        applyThemePaletteToPanel(mobileSettingsPanel, palette);
        const mobileHeader = mobileSettingsPanel.querySelector<HTMLElement>(".miracle-mobile-settings-header");
        if (mobileHeader) {
            mobileHeader.style.background = palette.section;
            mobileHeader.style.color = palette.title;
            mobileHeader.style.borderColor = palette.buttonBorder;
        }
    }
    for (const item of sectionTitles) item.el.style.color = palette.title;
    for (const item of uiFieldRefs) item.labelEl.style.color = palette.fieldText;
    activeEffectBadge.style.background = palette.badge;
    activeEffectBadge.style.color = palette.badgeText;
    recentMiracleMini.style.background = palette.section;
    recentMiracleMini.style.color = palette.fieldText;
    repaintThemeDecorations(palette);
    updateAdminButton();
    updateSpeedButtons();
    updateBlackModeButton();
    updateSimpleModeButton();
    updateCameraShakeButton();
    updateSlowMiracleButton();
    updateEffectsButton();
    updateCommentaryButton();
    updateBoardAnomalyButton();
    updateNormalTraitButton();
    updateTimeBallSkinButton();
    updateMobileCompactButton();
    updateRecentMiracleDisplayButton();
    updateVerticalVideoButton();
    updateObsButton();
    updateTiltButton();
    applyDynamicUiPalette();
}

function getSilhouetteHint(def: SpecialEventDef): string {
    const hints: Record<string, string> = {
        crown: "頭上に乗るもの",
        shootingStar: "空を横切るもの",
        heart: "やわらかい奇跡",
        blackSun: "黒くて終末っぽい",
        timeRift: "空間が裂ける",
        silverUfo: "空から来る円盤",
        blueFlame: "冷たい色の火",
        luckySeven: "縁起のいい数字",
        labExplosion: "研究所が危ない",
        cosmicEgg: "宇宙っぽい殻",
    };
    return hints[def.kind] ?? "まだ形がはっきりしない";
}

function addMiracleLog(def: SpecialEventDef): void {
    recordAdminEvent({ type: "miracle", at: Date.now(), label: def.label, rank: def.rank, count: finishedCount, targetCount: settings.targetCount });
    const ticketResult = awardTicketsForRank(miracleTicketState, def.rank, def.label);
    miracleTicketState = ticketResult.state;
    const ticketSummary = [ticketResult.reward.normal ? `通常${ticketResult.reward.normal}` : "", ticketResult.reward.rare ? `レア${ticketResult.reward.rare}` : "", ticketResult.reward.divine ? `神域${ticketResult.reward.divine}` : ""].filter(Boolean).join(" / ");
    if (ticketSummary) showSoftToast(`奇跡チケット獲得: ${ticketSummary}`);
    unlockNote("first-miracle", false);
    if (def.rank.includes("EX") || def.rank.includes("GOD")) unlockNote("divine-ticket", false);
    refreshMiracleExpansionButtons();
    const repeatCount = repeatedMiracleRunCounts[def.kind] ?? 0;
    miracleLogs.unshift({
        label: def.label,
        rank: def.rank,
        denominator: def.denominator,
        finishedAt: Date.now(),
        finishedCount,
        mode: settings.probabilityMode,
        speedLabel: speedLabelText,
        combo: miracleCombo,
        note: repeatCount >= 2 && (def.rank === "SR" || def.rank === "SSR") ? "同一SR/SSRのため短縮演出" : undefined,
    });
    miracleLogs = miracleLogs.slice(0, 80);
    recentMiracleMiniLogs = miracleLogs.slice(0, 3);
    updateRecentMiracleMini();
    savedRecords.miracleLogs = miracleLogs;
    saveRecords();
}

function recordMiracleForChains(kind: DropKind): void {
    const now = Date.now();
    recentMiracleKinds = [...recentMiracleKinds.filter((x) => now - x.at <= MIRACLE_CHAIN_WINDOW_MS), { kind, at: now }].slice(-8);
}

function tryTriggerMiracleChains(): void {
    const kinds = recentMiracleKinds.map((x) => x.kind);
    for (const chain of MIRACLE_CHAIN_DEFS) {
        if (unlockedChainRunIds[chain.id]) continue;
        if (chain.sequence.length > kinds.length) continue;
        const tail = kinds.slice(-chain.sequence.length);
        const matched = chain.sequence.every((kind, index) => tail[index] === kind);
        if (!matched) continue;
        unlockedChainRunIds[chain.id] = Date.now();
        addScore(chain.rewardScore, `CHAIN ${chain.label}`);
        miracleLogs.unshift({
            label: chain.label,
            rank: chain.rank,
            denominator: 0,
            finishedAt: Date.now(),
            finishedCount,
            mode: settings.probabilityMode,
            speedLabel: speedLabelText,
            combo: miracleCombo,
            note: "奇跡同士の連鎖で発生",
        });
        miracleLogs = miracleLogs.slice(0, 80);
        savedRecords.miracleLogs = miracleLogs;
        saveRecords();
        triggerChainEndingEffect(chain);
        break;
    }
}

function triggerChainEndingEffect(chain: MiracleChainDef): void {
    if (!settings.effectsEnabled || settings.simpleMode) {
        setSubtitle(`${chain.label} 発生`);
        return;
    }
    fireConfetti(chain.rank.includes("GOD") ? "cosmic" : chain.rank.includes("EX") ? "black" : "miracle");
    triggerCameraShake(chain.rank.includes("GOD") ? 44 * geometry.scale : chain.rank.includes("EX") ? 34 * geometry.scale : 22 * geometry.scale, chain.rank.includes("GOD") ? 1300 : 760);
    maybeShowCommentary(`実況「連鎖奇跡 ${chain.label} を観測しました」`, true);
    setSubtitle(`${chain.label}: ${chain.description}`);
    celebrationOverlay.innerHTML = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 35%, rgba(255,245,180,.32), rgba(20,16,42,.82) 58%, rgba(0,0,0,.94));backdrop-filter:blur(3px);"></div>
        <div style="position:relative;z-index:2;width:min(92vw,900px);padding:${isMobile ? "24px 18px" : "34px 42px"};border-radius:34px;background:rgba(15,23,42,.72);box-shadow:0 30px 90px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.18);color:#fff;animation:chain-ending-pop 3.2s ease-out forwards;">
            <style>@keyframes chain-ending-pop{0%{transform:scale(.86);opacity:0}12%{transform:scale(1.03);opacity:1}82%{transform:scale(1);opacity:1}100%{transform:scale(.98);opacity:0}}</style>
            <div style="font-size:clamp(22px,5vw,44px);font-weight:1000;color:#fde68a;letter-spacing:.08em;">MIRACLE CHAIN</div>
            <div style="margin-top:8px;font-size:clamp(36px,9vw,86px);font-weight:1000;text-shadow:0 8px 30px rgba(0,0,0,.65);">${chain.label}</div>
            <div style="margin-top:12px;font-size:clamp(17px,3vw,28px);line-height:1.65;opacity:.94;">${chain.description}</div>
            <div style="margin-top:16px;font-size:clamp(18px,3vw,30px);font-weight:1000;color:#bbf7d0;">+${chain.rewardScore.toLocaleString()} score</div>
        </div>`;
    celebrationOverlay.style.display = "flex";
    window.setTimeout(() => {
        celebrationOverlay.style.display = "none";
        celebrationOverlay.innerHTML = "";
    }, 3300);
}

function setSubtitle(text: string): void {
    currentSubtitleText = text;
    subtitleOverlay.textContent = text;
    subtitleOverlay.style.display = "block";
    if (subtitleTimer !== undefined) window.clearTimeout(subtitleTimer);
    subtitleTimer = window.setTimeout(() => {
        subtitleOverlay.style.display = "none";
    }, 4200);
}

function updateMiracleCombo(): void {
    const now = Date.now();
    miracleCombo = now - lastMiracleAt <= 12000 ? miracleCombo + 1 : 1;
    lastMiracleAt = now;
    if (miracleCombo >= 2) {
        comboOverlay.textContent = `${t("奇跡コンボ", "Miracle combo")} x${miracleCombo}`;
        comboOverlay.style.display = "block";
        if (comboTimer !== undefined) window.clearTimeout(comboTimer);
        comboTimer = window.setTimeout(() => { comboOverlay.style.display = "none"; }, 4200);
    } else {
        comboOverlay.style.display = "none";
    }
}

function saveMiracleClip(def: SpecialEventDef, subtitle: string): void {
    getShareReplayController().saveMiracleClip(def, subtitle);
}

function showReplayPopup(): void {
    getShareReplayController().showReplayPopup();
}

function showUserGuidePopup(): void {
    showPopup("遊び方", getUserGuideHtml());
}

async function playGachaRemoteMiracleVideo(def: SpecialEventDef): Promise<void> {
    if (settings.simpleMode) return;
    try {
        const assets = await loadRemoteMiracleAssets(true);
        for (let i = 0; i < 6; i++) {
            const asset = selectRemoteMiracleVideoAsset(assets, def, isRemoteMiracleAssetUsable, appRandom);
            if (!asset) return;
            const played = await playRemoteMiracleVideoAsset(asset, true);
            if (played) return;
        }
    } catch (error) {
        console.warn("[Miracle Gacha] video failed", error);
    }
}

function showAdminMagicCircleAnswerPopup(): void {
    showPopup("魔法陣の回答一覧", getAdminMagicCircleAnswerHtml(MAGIC_CIRCLE_DEFS, isMobile));
}

function getCanvasPointFromEvent(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * geometry.width;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * geometry.height;
    return { x: clamp(x, 0, geometry.width), y: clamp(y, 0, geometry.height) };
}

function getRoughCanvas(): any {
    const prepared = getPreparedRoughCanvas();
    if (!prepared) void prepareRoughCanvas(render.canvas);
    return prepared;
}

function playHowlerCue(kind: string, volume = 0.38, rate = 1): void {
    if (!soundEnabled || settings.simpleMode) return;
    try {
        const key = kind;
        let howl = howlerCueCache.get(key);
        if (!howl) {
            const srcMap: Record<string, string> = {
                magic: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=",
                gacha: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=",
                crystal: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="
            };
            howl = new Howl({ src: [srcMap[key] ?? srcMap.magic], volume, rate, html5: false });
            howlerCueCache.set(key, howl);
        }
        howl.rate(rate);
        howl.volume(volume);
        howl.play();
        // Howler 管理の入口として使い、実際の音階は既存 Tone 音源で重ねます。
        const Tone = toneModule;
        if (toneReady && Tone) {
            const synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: kind === "gacha" ? "sawtooth" : "triangle" },
                envelope: { attack: 0.005, decay: 0.18, sustain: 0.08, release: 0.22 }
            }).toDestination();
            synth.volume.value = kind === "gacha" ? -18 : -21;
            const now = Tone.now();
            const notes = kind === "gacha" ? ["C4", "E4", "G4", "B4"] : kind === "crystal" ? ["A5", "E6", "B6"] : ["D5", "A5", "E6"];
            notes.forEach((note, i) => synth.triggerAttackRelease(note, "16n", now + i * 0.055));
            window.setTimeout(() => synth.dispose(), 900);
        }
    } catch {
        // 音演出は失敗してもゲーム本体を止めない
    }
}

async function fireLibraryParticleBurst(mode: "magic" | "gacha" | "title" | "tempura", x = geometry.width / 2, y = geometry.height * 0.35): Promise<void> {
    if (settings.simpleMode || !confettiEnabled) return;
    if (isMobile && isStarted && !isFinished) return;
    try {
        const canvasRect = render.canvas.getBoundingClientRect();
        const source = {
            x: canvasRect.left + x / Math.max(1, geometry.width) * canvasRect.width,
            y: canvasRect.top + y / Math.max(1, geometry.height) * canvasRect.height,
        };
        await fireLibraryBurst(render.canvas, mode, source);
    } catch {
        // Optional effects must never stop gameplay.
    }
}

function addMagicPhysicsField(kind: MagicPhysicsField["kind"], x: number, y: number, radius: number, strength: number, durationMs: number, label: string): void {
    activeMagicPhysicsFields.push(createActiveMagicPhysicsField({
        x,
        y,
        kind,
        radius,
        strength,
        durationMs,
        label,
        now: performance.now(),
        random: appRandom,
    }));
    addFloatingText(`物理変態化: ${label}`, x, y - radius * 0.35, "#e0f2fe");
}

function updateMagicPhysicsFields(): void {
    updateActiveMagicPhysicsFields(activeMagicPhysicsFields, engine.world.bodies, performance.now());
}

function drawMagicPhysicsFields(context: CanvasRenderingContext2D): void {
    drawMagicPhysicsFieldsFrame(context, activeMagicPhysicsFields, geometry);
}

function showBrokenResearchNote(reason: string): void {
    brokenResearchNoteText = `${reason}：${BROKEN_RESEARCH_NOTE_LINES[Math.floor(appRandom() * BROKEN_RESEARCH_NOTE_LINES.length)] ?? BROKEN_RESEARCH_NOTE_LINES[0]}`;
    brokenResearchNoteUntil = performance.now() + 5200;
}

function drawBrokenResearchNote(context: CanvasRenderingContext2D): void {
    drawBrokenResearchNoteFrame(context, {
        text: brokenResearchNoteText,
        until: brokenResearchNoteUntil,
        simpleMode: settings.simpleMode,
        geometry,
        uiFont: ROUNDED_UI_FONT,
        roughCanvas: getRoughCanvas(),
    });
}

function createTemporaryPinAt(x: number, y: number, label = "観測ピン", lifetimeMs = 14000): void {
    const radius = Math.max(geometry.pinRadius * 1.35, 6 * geometry.scale);
    const pin = Bodies.circle(x, y, radius, {
        isStatic: true,
        restitution: 1.08,
        friction: 0,
        render: { fillStyle: "rgba(250,204,21,.96)", strokeStyle: "rgba(255,255,255,.95)", lineWidth: Math.max(1, 2 * geometry.scale) } as any,
    });
    (pin as any).plugin = { isPin: true, isTempPin: true, label, baseX: x, baseY: y, wiggleFrames: 80, wiggleTotal: 80, wigglePower: 1.25, bendDirection: 1 };
    temporaryPinBodies.add(pin);
    Composite.add(engine.world, pin);
    addFloatingText(label, x, y - 22 * geometry.scale, "#facc15");
    window.setTimeout(() => {
        if (!temporaryPinBodies.has(pin)) return;
        temporaryPinBodies.delete(pin);
        Composite.remove(engine.world, pin);
    }, lifetimeMs);
}

function clearMagicAndBoardPins(): void {
    for (const body of [...engine.world.bodies]) {
        const plugin = (body as any).plugin;
        if (!plugin?.isPin) continue;
        temporaryPinBodies.delete(body);
        Composite.remove(engine.world, body);
    }
}

function createMagicBoardPinAt(x: number, y: number, label: string, color: string, radiusScale = 1.45): Matter.Body {
    const radius = Math.max(geometry.pinRadius * radiusScale, 7 * geometry.scale);
    const pin = Bodies.circle(
        clamp(x, geometry.wallWidth + radius, geometry.width - geometry.wallWidth - radius),
        clamp(y, radius * 1.4, geometry.groundTop - geometry.dividerHeight - radius),
        radius,
        {
            isStatic: true,
            restitution: 1.24,
            friction: 0,
            render: {
                fillStyle: color,
                strokeStyle: "rgba(255,255,255,.96)",
                lineWidth: Math.max(1.8, 3 * geometry.scale),
            } as any,
        },
    );
    (pin as any).plugin = {
        isPin: true,
        isTempPin: true,
        isMagicBoardPin: true,
        magicColor: color,
        label,
        baseX: pin.position.x,
        baseY: pin.position.y,
        wiggleFrames: 110,
        wiggleTotal: 110,
        wigglePower: 1.85,
        bendDirection: appRandom() > 0.5 ? 1 : -1,
    };
    temporaryPinBodies.add(pin);
    Composite.add(engine.world, pin);
    return pin;
}

function restorePinsAfterMagic(token: number, delayMs = 18000): void {
    window.setTimeout(() => {
        if (token !== magicBoardShapeToken || isAppTerminated) return;
        for (const body of [...temporaryPinBodies]) {
            const plugin = (body as any).plugin;
            if (!plugin?.isMagicBoardPin) continue;
            temporaryPinBodies.delete(body);
            Composite.remove(engine.world, body);
        }
        if (isStarted && !isFinished) Composite.add(engine.world, createPins());
        addFloatingText("通常ピン配置へ復帰", geometry.width / 2, geometry.height * 0.20, "#dbeafe");
    }, delayMs);
}

function reshapeBoardWithMagicCircle(def: MagicCircleDef, center: { x: number; y: number }): void {
    magicBoardShapeToken++;
    const token = magicBoardShapeToken;
    activeMagicPhysicsFields.length = 0;
    clearMagicAndBoardPins();
    const plan = buildMagicBoardPlan(def, geometry);
    for (const pin of plan.pins) createMagicBoardPinAt(pin.x, pin.y, pin.label, pin.color, pin.radiusScale);
    for (const field of plan.fields) addMagicPhysicsField(field.kind, field.x, field.y, field.radius, field.strength, field.durationMs, field.label);
    if (plan.restoreGravity) {
        engine.gravity.y = 3.6;
        window.setTimeout(() => {
            if (!tiltExperimentEnabled && token === magicBoardShapeToken) engine.gravity.y = plan.restoreGravity!.y;
        }, plan.restoreGravity.delayMs);
    }
    addFloatingText(plan.floatingText.text, plan.floatingText.x, plan.floatingText.y, plan.floatingText.color);
    restorePinsAfterMagic(token);
}

function enableTemporaryPinPlacement(): void {
    temporaryPinPlacementEnabled = true;
    magicCircleModeEnabled = false;
    magicCircleDrawing = false;
    magicCirclePoints = [];
    canvas.style.cursor = "copy";
    showSoftToast("盤面をタップすると一時的な観測ピンを設置します");
}

function spawnExternalIntruderBalls(count = 12, reason = "event"): void {
    const bodies = createExternalIntruderDrops({ count, geometry, random: appRandom });
    Composite.add(engine.world, bodies);
    activeDropCount += bodies.length;
    triggerCameraShake(18 * geometry.scale, 420);
    addFloatingText("画面外から玉が侵入", geometry.width / 2, geometry.height * 0.18, "#dbeafe");
    maybeShowCommentary(`外部侵入イベント「${reason}」`, true);
}

function showMagicCircleSummonOverlay(def: MagicCircleDef, center: { x: number; y: number }): void {
    const isDragon = def.effect === "dragon" || /龍|竜|dragon/i.test(`${def.label} ${def.chant}`);
    const isVoid = def.effect === "void";
    const isThunder = def.effect === "thunder";
    const isWave = def.effect === "wave";
    const icon = isDragon ? "🐉" : isVoid ? "🕳️" : isThunder ? "⚡" : isWave ? "🌊" : def.emoji || "✦";
    const title = isDragon ? "龍脈召喚" : `${def.label} 発動`;
    const subtitle = isDragon
        ? "盤面の奥から巨大な龍がうねり、玉の流れを書き換えます。"
        : `${def.chant} / 魔法陣が盤面へ干渉します。`;
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "126";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.overflow = "hidden";
    overlay.innerHTML = getMagicCircleSummonOverlayHtml({ def, icon, title, subtitle, isDragon });
    document.body.appendChild(overlay);
    window.setTimeout(() => overlay.remove(), 2050);
    if (isDragon) {
        for (let i = 0; i < 3; i++) {
            window.setTimeout(() => spawnExternalIntruderBalls(8, "龍脈召喚"), 220 + i * 360);
        }
        triggerCameraShake(48 * geometry.scale, 1300);
    }
}

function activateMagicCircle(def: MagicCircleDef, points: Array<{ x: number; y: number; t: number }>): void {
    const center = points.length > 0
        ? points.reduce((acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }), { x: 0, y: 0 })
        : { x: geometry.width / 2, y: geometry.height * 0.36 };
    showMagicCircleSummonOverlay(def, center);
    addFloatingText(`${def.emoji} ${def.label}`, center.x, center.y, def.color);
    addFloatingText(`魔法陣発動: ${def.chant}`, center.x, center.y - 34 * geometry.scale, def.color);
    createTapRipple(center.x, center.y, true);
    for (let i = 0; i < 10; i++) {
        const a = i * Math.PI * 2 / 10;
        createTapRipple(center.x + Math.cos(a) * 80 * geometry.scale, center.y + Math.sin(a) * 80 * geometry.scale, i % 2 === 0);
    }
    fireConfetti(def.effect === "void" ? "black" : "miracle", true);
    void fireLibraryParticleBurst(def.kind === "tempura" ? "tempura" : "magic", center.x, center.y);
    playHowlerCue(def.effect === "gear" || def.effect === "mirror" ? "crystal" : "magic", 0.42, 0.85 + appRandom() * 0.35);
    showBrokenResearchNote(def.label);
    showSoftToast(`魔法陣発動: ${def.label} / ${def.chant}`);
    reshapeBoardWithMagicCircle(def, center);
    const activationPlan = buildMagicCircleActivationPlan(def, center, geometry);
    addMagicPhysicsField(activationPlan.field.kind, activationPlan.field.x, activationPlan.field.y, activationPlan.field.radius, activationPlan.field.strength, activationPlan.field.durationMs, activationPlan.field.label);
    for (const field of activationPlan.extraFields) addMagicPhysicsField(field.kind, field.x, field.y, field.radius, field.strength, field.durationMs, field.label);
    for (const burst of activationPlan.intruderBursts) spawnExternalIntruderBalls(burst.count, burst.reason);
    for (const kind of activationPlan.catastrophes) triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], kind);
    for (const pin of activationPlan.tempPins) createTemporaryPinAt(pin.x, pin.y, pin.label, pin.lifetimeMs ?? 12000);
    if (activationPlan.gravityRestore) {
        engine.gravity.y = 4.2;
        window.setTimeout(() => {
            if (tiltExperimentEnabled) return;
            engine.gravity.y = activationPlan.gravityRestore!.y;
        }, activationPlan.gravityRestore.delayMs);
    }
    if (activationPlan.wiggleAllPins) {
        for (const body of engine.world.bodies) {
            const plugin = (body as any).plugin;
            if (plugin?.isPin) plugin.wiggleFrames = Math.max(plugin.wiggleFrames ?? 0, 120);
        }
    }
    if (activationPlan.confettiMode) fireConfetti(activationPlan.confettiMode);
    triggerCameraShake(26 * geometry.scale, 620);
}

function enableMagicCircleMode(): void {
    magicCircleModeEnabled = true;
    magicCircleDrawing = false;
    temporaryPinPlacementEnabled = false;
    magicCirclePoints = [];
    canvas.style.cursor = "crosshair";
    showSoftToast("盤面を指でなぞって魔法陣を描いてください。描いた線が光ります");
}

function updateTiltButton(): void {
    if (!tiltExperimentButton) return;
    tiltExperimentButton.textContent = tiltExperimentEnabled ? "傾き実験: ON" : "傾き実験: OFF";
}

function handleDeviceOrientation(event: DeviceOrientationEvent): void {
    if (!tiltExperimentEnabled) return;
    const gamma = typeof event.gamma === "number" ? event.gamma : 0;
    lastTiltGravityX = clamp(gamma / 45, -0.9, 0.9);
    if (!rareBoardCatastrophe) engine.gravity.x = lastTiltGravityX;
}

async function toggleTiltExperimentMode(): Promise<void> {
    if (!tiltExperimentEnabled) {
        try {
            const req = (DeviceOrientationEvent as any).requestPermission as undefined | (() => Promise<string>);
            if (typeof req === "function") {
                const result = await req.call(DeviceOrientationEvent);
                if (result !== "granted") {
                    showSoftToast("傾きセンサーの許可が必要です");
                    return;
                }
            }
        } catch {
            // PCや非対応端末では許可APIが無い場合があります。
        }
        tiltExperimentEnabled = true;
        window.addEventListener("deviceorientation", handleDeviceOrientation);
        showSoftToast("スマホ傾き実験モードをONにしました");
    } else {
        tiltExperimentEnabled = false;
        window.removeEventListener("deviceorientation", handleDeviceOrientation);
        lastTiltGravityX = 0;
        if (!rareBoardCatastrophe) engine.gravity.x = 0;
        showSoftToast("スマホ傾き実験モードをOFFにしました");
    }
    updateTiltButton();
}

function showMiracleGachaPopup(): void {
    getResearchCommerceController().showMiracleGachaPopup();
}

function showGachaRewardBookPopup(): void {
    getResearchCommerceController().showGachaRewardBookPopup();
}

function showResearchShopPopup(): void {
    getResearchCommerceController().showResearchShopPopup();
}

function showEventSeasonPopup(): void {
    getResearchCommerceController().showEventSeasonPopup();
}

function showMiracleCraftPopup(): void {
    getResearchCommerceController().showMiracleCraftPopup();
}

function showBossExperimentPopup(): void {
    getBossExperimentController().showPopup();
}

function showMultiverseExpeditionPopup(): void {
    showPopup("多元宇宙遠征", getMultiverseExpeditionHtml(multiverseState, createExpeditionSeed()));
    bindLabHomeButtons();
}

function startSelectedMultiverseExpedition(universeId: string): void {
    multiverseState = startMultiverseExpedition(multiverseState, universeId, createExpeditionSeed());
    saveMultiverseState(localStorage, multiverseState);
    const universe = getActiveUniverse(multiverseState);
    if (!universe) return;
    settings.targetCount = universe.targetCount;
    settings.activeLimit = universe.activeLimit;
    settings.probabilityMode = universe.probabilityMode;
    settings.effectsEnabled = true;
    settings.boardAnomalyEnabled = true;
    settings.effectMode = "flashy";
    currentTheme = universe.theme as ThemeMode;
    themeAutoMode = "fixed";
    settings.themeAutoMode = "fixed";
    targetInput.value = String(universe.targetCount);
    activeBallInput.value = String(universe.activeLimit);
    probabilityModeSelect.value = universe.probabilityMode;
    themeSelect.value = currentTheme;
    themeAutoModeSelect.value = "fixed";
    effectModeSelect.value = "flashy";
    closeHelpPopup();
    applyTheme();
    startExperiment();
    if (universe.law === "reverse") engine.gravity.x = -0.48;
    if (universe.law === "singularity") triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], "gravity");
    if (universe.law === "overclock") engine.timing.timeScale = Math.max(engine.timing.timeScale, 1.45);
    if (universe.law === "entropy") triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], "supernova");
    if (universe.law === "echo") adminForceNextMiracleEffect = true;
    showMilestone(`${universe.icon} ${universe.name}：宇宙法則「${universe.lawLabel}」が盤面を支配します`);
}

function completeActiveMultiverseExpedition(): MultiverseResult | null {
    if (!multiverseState.active) return null;
    multiverseState = completeMultiverseExpedition(multiverseState, {
        score: runScore,
        finishedCount,
        specialCount: Object.values(specialCreated).reduce((sum, count) => sum + count, 0),
    });
    saveMultiverseState(localStorage, multiverseState);
    return multiverseState.lastResult;
}

function startBossExperiment(bossId: string): void {
    getBossExperimentController().start(bossId);
}

function activateBossForRun(): void {
    getBossExperimentController().activateForRun();
}

function getBossElapsedMs(now = Date.now()): number {
    return getBossExperimentController().getElapsedMs(now);
}

function getBossRemainingMs(now = Date.now()): number {
    return getBossExperimentController().getRemainingMs(now);
}

function finishActiveBossRun(): void {
    if (isFinished) return;
    targetReachedTime = targetReachedTime ?? Date.now();
    endTime = Date.now();
    isFinished = true;
    isPaused = false;
    Runner.stop(runner);
    updateStopButton();
    updateInfo();
    tutorialMissionPanel.style.display = "none";
    researchProgressPanel.style.display = "none";
    window.setTimeout(() => {
        if (!isAppTerminated && resultOverlay.style.display === "none") showEndingThenFinalResult();
    }, 220);
}

function maybeFinishBossExperimentByTime(): boolean {
    return getBossExperimentController().maybeFinishByTime();
}

function damageBossForYakumono(kind: PachinkoYakumonoKind, def: PachinkoYakumonoDef, drop: Matter.Body): void {
    getBossExperimentController().damageForYakumono(kind, def, drop);
}

function damageBossForDrop(kind: DropKind, binIndex: number, body: Matter.Body): void {
    getBossExperimentController().damageForDrop(kind, binIndex, body);
}

function maybeBossAttack(): void {
    getBossExperimentController().maybeAttack();
}

function recordBossResult(): BossExperimentRecord | null {
    return getBossExperimentController().recordResult();
}

function drawBossEnemy(context: CanvasRenderingContext2D, compact = false): void {
    getBossExperimentController().drawEnemy(context, compact);
}

function drawBossHud(context: CanvasRenderingContext2D): void {
    getBossExperimentController().drawHud(context);
}

function showResearchWorldMapPopup(): void {
    const rank = getCurrentResearchRankInfo();
    showPopup("研究所マップ", getResearchWorldMapHtml({
        rank,
        discoveredKindCount: getDiscoveredKindCount(),
        gachaPoint: getGachaPoint(),
        shopPurchasedCount: Object.keys(savedRecords.shopPurchased ?? {}).length,
        isMobile,
    }));
}

function runLabHomeAction(action: string): void {
    if (!action) return;
    if (action.startsWith("shop-buy:")) {
        buyResearchShopItem(action.slice("shop-buy:".length));
        return;
    }
    if (action.startsWith("season-claim:")) {
        const [, seasonId, missionId] = action.split(":");
        if (seasonId && missionId) claimSeasonMissionReward(seasonId, missionId);
        return;
    }
    if (action.startsWith("season-theme:")) {
        const theme = action.slice("season-theme:".length) as ThemeMode;
        currentTheme = theme;
        themeAutoMode = "fixed";
        settings.themeAutoMode = themeAutoMode;
        themeSelect.value = theme;
        themeAutoModeSelect.value = themeAutoMode;
        markThemeUnlocked(theme);
        applyTheme();
        persistUserPreferencesSoon();
        showSoftToast("テーマ: " + getThemeDisplayName(theme));
        return;
    }
    if (action.startsWith("craft-do:")) {
        craftMiracleRecipe(action.slice("craft-do:".length));
        return;
    }
    if (action.startsWith("boss-start:")) {
        startBossExperiment(action.slice("boss-start:".length));
        return;
    }
    if (action.startsWith("multiverse-start:")) {
        startSelectedMultiverseExpedition(action.slice("multiverse-start:".length));
        return;
    }
    if (action === "start") {
        closeHelpPopup();
        startExperiment();
        scheduleViewportStabilize(true);
        return;
    }
    if (action === "map") { showResearchWorldMapPopup(); return; }
    if (action === "daily") { showDailyMissionPopup(); return; }
    if (action === "album") { showMiracleAlbumPopup(); return; }
    if (action === "book") { showMiracleBookPopup(); return; }
    if (action === "archive") { showResearchArchivePopup(); return; }
    if (action === "presets") { showExperimentPresetPopup(); return; }
    if (action === "gacha") { showMiracleGachaPopup(); return; }
    if (action === "shop") { showResearchShopPopup(); return; }
    if (action === "season") { showEventSeasonPopup(); return; }
    if (action === "craft") { showMiracleCraftPopup(); return; }
    if (action === "boss") { showBossExperimentPopup(); return; }
    if (action === "multiverse") { showMultiverseExpeditionPopup(); return; }
    if (action === "boss-log") { showBossExperimentPopup(); return; }
    if (action === "fusion") { showFusionPopup(); return; }
    if (action === "gacha-log") { showGachaRewardBookPopup(); return; }
    if (action === "themes") { showThemeBookPopup(); return; }
    if (action === "rank") { showResearchRankPopup(); return; }
    if (action === "log") { showMiracleLogPopup(); return; }
    if (action === "magic") { closeHelpPopup(); enableMagicCircleMode(); return; }
    if (action === "familiar") { showFamiliarPopup(); return; }
    if (action === "tickets") { showMiracleTicketPopup(); return; }
    if (action === "notes") { showSecretResearchNotePopup(); return; }
    if (action === "offline") { void showOfflineLabHomePopup(); return; }
    if (action === "offline-save") { void showOfflineVideoDownloadPopup(); return; }
    if (action === "offline-book") { void showOfflineMiracleBookPopup(); return; }
    if (action === "guide") { showUserGuidePopup(); return; }
}

function bindLabHomeButtons(): void {
    forcePopupToFront();
    helpOverlay.querySelectorAll<HTMLElement>("[data-home-action]").forEach((button) => {
        button.setAttribute("role", "button");
        button.style.pointerEvents = "auto";
        button.style.touchAction = "manipulation";
        const activate = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
            handlePopupActionEvent(event);
        };
        button.onclick = activate;
        // スマホでは pointer/touch/click を全部バインドすると、1タップで複数回実行されます。
        // 研究所ホーム内のボタンは click に一本化して、開始処理の多重発火を防ぎます。
        button.addEventListener("click", activate, { passive: false });
    });
}

function showLabHome(): void {
    const rank = getCurrentResearchRankInfo();
    const discoveredKinds = getDiscoveredKindCount();
    const reports = savedRecords.researchReports ?? [];
    const latestReport = reports[0];
    const season = getCurrentEventSeason();
    const homeHtml = getLabHomeHtml({
        dailyTitle: getDailyFortune().title,
        seasonTitle: season.title,
        seasonRateBoost: season.rateBoost,
        rankLevel: rank.level,
        rankLabel: rank.label,
        discoveredKinds,
        totalRuns: savedRecords.totalRuns,
        gachaPoint: getGachaPoint(),
        latestReportText: latestReport ? `${new Date(latestReport.createdAt).toLocaleString()} / ${latestReport.grade} / ${latestReport.finishedCount.toLocaleString()}投下` : "まだ研究レポートはありません。",
        shopPurchasedCount: Object.keys(savedRecords.shopPurchased ?? {}).length,
        reportLimit: getResearchReportLimit(),
        pointBoosterOn: isShopItemPurchased("gacha-point-booster"),
        labWallFormulas: savedRecords.labWallFormulas ?? [],
        isMobile,
        userGuideHtml: getUserGuideHtml(),
    });
    showPopup("研究所ホーム", homeHtml);
    bindLabHomeButtons();
}

function createResearchReportEntry(): ResearchReportEntry {
    return createResearchReportEntryBase({
        now: Date.now(),
        random: appRandom,
        runNo: savedRecords.totalRuns + 1,
        targetCount: settings.targetCount,
        finishedCount,
        discardedCount,
        labels,
        binCounts,
        evaluation: getResearchEvaluation(),
        runScore,
        bestMiracle: miracleLogs[0],
        memoHtml: generateResearchMemoHtml(),
    });
}

function saveCurrentResearchReport(): ResearchReportEntry {
    const report = createResearchReportEntry();
    savedRecords.researchReports = prependResearchReport({
        reports: savedRecords.researchReports,
        report,
        limit: getResearchReportLimit(),
    });
    return report;
}

function showMiracleAlbumPopup(): void {
    const reports = savedRecords.researchReports ?? [];
    showPopup("奇跡アルバム", getMiracleAlbumHtml(miracleLogs, reports, formatProbability));
}

function showResearchArchivePopup(): void {
    const reports = savedRecords.researchReports ?? [];
    showPopup("研究アーカイブ", getResearchArchiveHtml(reports));
    document.getElementById("archive-export-button")?.addEventListener("click", () => exportLocalUserData());
    document.getElementById("archive-album-button")?.addEventListener("click", () => showMiracleAlbumPopup());
    document.querySelectorAll<HTMLButtonElement>("[data-report-id]").forEach((button) => {
        button.onclick = () => {
            const report = reports.find((x) => x.id === button.dataset.reportId);
            if (report) showResearchReportDetailPopup(report);
        };
    });
}

function showResearchReportDetailPopup(report: ResearchReportEntry): void {
    showPopup(`第${report.runNo}回 研究レポート`, getResearchReportDetailHtml(report));
    document.getElementById("archive-detail-back-button")?.addEventListener("click", () => showResearchArchivePopup());
    document.getElementById("archive-detail-copy-button")?.addEventListener("click", async () => {
        const text = `第${report.runNo}回 研究レポート / ${report.grade} / ${report.type} / ${report.finishedCount}投下 / score ${report.score} / ${report.memo}`;
        try {
            await navigator.clipboard.writeText(text);
            showSoftToast("研究レポートをコピーしました");
        } catch {
            showSoftToast("コピーできませんでした");
        }
    });
}

function showMiracleLogPopup(): void {
    if (miracleLogs.length === 0) {
        showPopup(t("奇跡発生ログ", "Miracle log"), `<p>${t("まだ奇跡は発生していません。", "No miracles yet.")}</p>`);
        return;
    }
    const rows = getMiracleLogHtml(miracleLogs, formatProbability, {
        count: t("投下位置", "Count"),
        mode: t("モード", "Mode"),
        speed: t("速度", "Speed"),
    });
    showPopup(t("奇跡発生ログ", "Miracle log"), rows);
}

function getResearchReportHtml(): string {
    const sum = binCounts.reduce((a,b) => a+b, 0) || 1;
    const maxCount = Math.max(...binCounts, 0);
    const minCount = Math.min(...binCounts);
    const topIndex = binCounts.indexOf(maxCount);
    const imbalance = ((maxCount - minCount) / sum) * 100;
    const diagnosis = imbalance > 18 ? t("かなり偏っています。盤面が機嫌を出しています。", "Very biased. The board is showing mood.") :
        imbalance > 10 ? t("少し偏っています。中央か端が主張気味です。", "Slightly biased. Center or edges are asserting themselves.") :
        t("比較的なだらかです。現実寄りの分布です。", "Relatively smooth. A realistic distribution.");
    const recentMiracles = miracleLogs.slice(0, 5).map((x) => `${x.label} [${x.rank}] ${x.denominator > 0 ? formatProbability(x.denominator) : "派生解放"}`).join("<br>") || t("なし", "None");
    const level = getResearchLevelInfo();
    const fortune = currentDailyFortune ?? getDailyFortune();
    return getResearchReportSummaryHtml({
        levelLabel: `Lv.${level.level} ${level.title}`,
        levelPercent: level.percent,
        fortuneRateBoost: fortune.rateBoost,
        fortuneLuckyKind: fortune.luckyKind,
        totalCountLabel: t("総投下数", "Total count"),
        finishedCount,
        targetCount: settings.targetCount,
        discardedLabel: t("捨て区間", "Discarded"),
        discardedCount,
        topBinLabel: t("最頻受け皿", "Top bin"),
        topLabel: topIndex >= 0 ? labels[topIndex] : "-",
        maxCount,
        biasLabel: t("偏り診断", "Bias diagnosis"),
        diagnosis,
        discoveredLabel: t("発見済み種類", "Discovered kinds"),
        discoveredKinds: SPECIAL_EVENT_DEFS.filter((d) => (savedRecords.discovered[d.kind] ?? 0) + (specialCreated[d.kind] ?? 0) > 0).length,
        specialCount: SPECIAL_EVENT_DEFS.length,
        fusionCount: getFusionCount(),
        fusionTotal: FUSION_DEFS.length,
        secretCount: Object.keys(savedRecords.secretUnlocked ?? {}).length,
        rarePinSummary: RARE_PIN_DEFS.map((x) => `${x.label} ${(rarePinTouchCount[x.kind] ?? 0).toLocaleString()}`).join(" / "),
        researchMemoHtml: generateResearchMemoHtml(),
        recentMiraclesLabel: t("最近の奇跡", "Recent miracles"),
        recentMiraclesHtml: recentMiracles,
    });
}

function showResearchReportPopup(): void {
    showPopup(t("研究レポート", "Research report"), getResearchReportHtml());
}

function updateVerticalVideoButton(): void {
    verticalButton.textContent = isVerticalVideoMode ? t("縦動画: ON", "Vertical: ON") : t("縦動画: OFF", "Vertical: OFF");
}

function updateObsButton(): void {
    obsButton.textContent = isObsMode ? "OBS: ON" : "OBS: OFF";
}

function toggleVerticalVideoMode(): void {
    isVerticalVideoMode = !isVerticalVideoMode;
    if (isMobile) {
        applyMobileGameCanvasLayout();
    } else if (isVerticalVideoMode) {
        gameArea.style.aspectRatio = "9 / 16";
        gameArea.style.height = "88dvh";
        gameArea.style.maxWidth = "500px";
    } else {
        gameArea.style.aspectRatio = "";
        gameArea.style.height = "";
        gameArea.style.maxWidth = "";
    }
    updateVerticalVideoButton();
    showSoftToast(isVerticalVideoMode ? t("縦動画モードをONにしました", "Vertical video enabled") : t("縦動画モードをOFFにしました", "Vertical video disabled"));
    scheduleResize();
}

function toggleObsMode(): void {
    isObsMode = !isObsMode;
    controlArea.style.display = isObsMode ? "none" : "grid";
    buttonArea.style.display = isObsMode ? "none" : "grid";
    randomGraphArea.style.display = isObsMode ? "none" : "block";
    info.style.padding = isObsMode ? "8px" : "";
    updateObsButton();
    showSoftToast(isObsMode ? t("OBSモードをONにしました", "OBS mode enabled") : t("OBSモードをOFFにしました", "OBS mode disabled"));
    scheduleResize();
}

let rareBoardCatastrophe: RareBoardCatastropheDef | null = null;
let rareBoardCatastropheUntil = 0;
let rareBoardCatastropheStartedAt = 0;
let rareBoardOldGravityX = 0;
let rareBoardOldGravityY = 8;

function shouldTriggerRareBoardCatastrophe(def?: SpecialEventDef): boolean {
    if (!def || settings.simpleMode || !settings.effectsEnabled) return false;
    return getRankScore(def.rank) >= getRankScore("SSR");
}

function triggerRareBoardCatastrophe(def?: SpecialEventDef, forcedKind?: RareBoardCatastropheKind): void {
    if (!def || settings.simpleMode) return;
    const pool = RARE_BOARD_CATASTROPHE_DEFS;
    const selected = forcedKind ? pool.find((x) => x.kind === forcedKind) : pool[Math.floor(appRandom() * pool.length)];
    if (!selected) return;
    rareBoardCatastrophe = selected;
    rareBoardCatastropheStartedAt = performance.now();
    rareBoardCatastropheUntil = Date.now() + selected.duration;
    rareBoardOldGravityX = engine.gravity.x;
    rareBoardOldGravityY = engine.gravity.y;
    engine.gravity.x = selected.gravityX;
    engine.gravity.y = selected.gravityY;
    triggerCameraShake(selected.shake * geometry.scale, selected.duration, true);
    addFloatingText(`${selected.emoji} ${selected.label}`, geometry.width / 2, geometry.height * 0.20, selected.color);
    maybeShowCommentary(`緊急警報「${selected.label}」`, true);
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (plugin?.isPin && appRandom() < 0.45) plugin.wiggleFrames = Math.max(plugin.wiggleFrames ?? 0, 70);
        if (plugin?.isDrop) {
            Body.applyForce(body, body.position, { x: (appRandom() - 0.5) * 0.012 * geometry.scale, y: -appRandom() * 0.010 * geometry.scale });
        }
    }
    for (let i = 0; i < selected.waves; i++) {
        createTapRipple(geometry.width * (0.18 + appRandom() * 0.64), geometry.height * (0.22 + appRandom() * 0.48), true);
    }
    if (!settings.lowSpecMode) {
        for (let i = 0; i < selected.fragments; i++) {
            Composite.add(engine.world, createTinyFragment(geometry.width * (0.15 + appRandom() * 0.7), geometry.height * (0.12 + appRandom() * 0.35), geometry.ballRadius * 1.2, selected.color));
        }
    }
    window.setTimeout(() => {
        if (rareBoardCatastrophe !== selected) return;
        engine.gravity.x = rareBoardOldGravityX;
        engine.gravity.y = rareBoardOldGravityY;
        rareBoardCatastrophe = null;
    }, selected.duration);
}

function drawRareBoardCatastrophe(context: CanvasRenderingContext2D): void {
    drawRareBoardCatastropheFrame(context, {
        catastrophe: rareBoardCatastrophe,
        until: rareBoardCatastropheUntil,
        startedAt: rareBoardCatastropheStartedAt,
    }, {
        geometry,
        uiFont: ROUNDED_UI_FONT,
    });
}

function applyRareBackground(kind: DropKind): void {
    const worldMode = getWorldModeByKind(kind);
    if (worldMode) {
        activeWorldMode = worldMode;
        activeRareBackgroundKind = kind;
        gameArea.style.background = getWorldModePalette(worldMode).bg;
        applyWorldModeBodyStyles();
        if (rareBackgroundTimer !== undefined) window.clearTimeout(rareBackgroundTimer);
        return;
    }
    activeRareBackgroundKind = kind;
    const map: Record<string, string> = {
        crown: "radial-gradient(circle at 50% 18%, rgba(255,220,80,.45), rgba(10,10,12,.96))",
        silverUfo: "radial-gradient(circle at 50% 18%, rgba(120,220,255,.30), rgba(4,8,16,.98))",
        blackSun: "radial-gradient(circle at 50% 18%, rgba(255,0,68,.22), rgba(0,0,0,.99))",
        timeRift: "radial-gradient(circle at 50% 18%, rgba(98,42,255,.38), rgba(3,4,12,.99))",
        swordImpact: "radial-gradient(circle at 50% 18%, rgba(226,245,255,.42), rgba(5,12,22,.99))",
        heart: "radial-gradient(circle at 50% 18%, rgba(255,105,180,.28), rgba(18,8,16,.98))",
        labExplosion: "radial-gradient(circle at 50% 18%, rgba(255,120,48,.36), rgba(20,8,6,.98))",
        cosmicEgg: "radial-gradient(circle at 50% 18%, rgba(0,229,255,.28), rgba(28,0,56,.98))",
    };
    gameArea.style.background = map[kind] || map.crown;
    if (rareBackgroundTimer !== undefined) window.clearTimeout(rareBackgroundTimer);
    rareBackgroundTimer = window.setTimeout(() => {
        activeRareBackgroundKind = null;
        applyTheme();
    }, 3600);
}

function maybeTriggerBoardAnomaly(): void {
    if (!settings.effectsEnabled || !settings.boardAnomalyEnabled || settings.simpleMode || targetReachedTime !== null || isPaused || isMiraclePaused || isFinished) return;
    if (isMobileStableRuntime()) return;
    if (Date.now() < anomalyUntil) return;
    if (appRandom() > 0.000035 * getProbabilityScale() * Math.max(0.65, getEffectIntensity())) return;
    const choice = Math.floor(appRandom() * 8);
    anomalyUntil = Date.now() + (choice >= 4 ? 4200 : 3000);
    anomalyOldGravityX = engine.gravity.x;
    anomalyHidePins = false;
    anomalyMode = "none";
    anomalyCenterX = geometry.width * (0.25 + appRandom() * 0.5);
    anomalyTick = 0;
    if (choice === 0) {
        anomalyMode = "sideGravity";
        engine.gravity.x = appRandom() < 0.5 ? -0.22 : 0.22;
        anomalyLabel = t("異変: 重力が横に傾いた", "Anomaly: gravity tilted sideways");
    } else if (choice === 1) {
        anomalyMode = "stickyTime";
        engine.timing.timeScale = Math.max(0.5, engine.timing.timeScale * 0.7);
        anomalyLabel = t("異変: 時間が少し粘る", "Anomaly: time became sticky");
    } else if (choice === 2) {
        anomalyMode = "dimPins";
        anomalyHidePins = true;
        anomalyLabel = t("異変: ピンが見えにくい", "Anomaly: pins became dim");
    } else if (choice === 3) {
        anomalyMode = "tremor";
        triggerCameraShake(14 * geometry.scale, 500);
        anomalyLabel = t("異変: 盤面がざわつく", "Anomaly: board is trembling");
    } else if (choice === 4) {
        anomalyMode = "updraft";
        anomalyLabel = t("異変: 下から風が吹いた", "Anomaly: an updraft appeared");
    } else if (choice === 5) {
        anomalyMode = "blackHole";
        anomalyLabel = t("異変: 小さな重力穴が開いた", "Anomaly: a tiny gravity well opened");
    } else if (choice === 6) {
        anomalyMode = "pinPulse";
        anomalyLabel = t("異変: ピンが一斉に震えた", "Anomaly: pins pulsed together");
        for (const body of engine.world.bodies) {
            const plugin = (body as any).plugin;
            if (plugin?.isPin) plugin.wiggleFrames = Math.max(plugin.wiggleFrames ?? 0, 42);
        }
    } else {
        anomalyMode = "reverseRain";
        anomalyLabel = t("異変: 玉が少し浮きたがる", "Anomaly: balls want to float");
    }
    addFloatingText(anomalyLabel, geometry.width / 2, 80 * geometry.scale, "#ffef78");
    setSubtitle(anomalyLabel);
    maybeShowCommentary(`観測装置「${anomalyLabel}」`, true);
    updateStatusMiniOverlays();
}

function updateBoardAnomaly(): void {
    if (anomalyUntil && Date.now() > anomalyUntil) {
        anomalyUntil = 0;
        engine.gravity.x = anomalyOldGravityX;
        anomalyHidePins = false;
        anomalyMode = "none";
        anomalyCenterX = 0;
        anomalyTick = 0;
        engine.timing.timeScale = getCurrentTimeScale();
        updateStatusMiniOverlays();
    }
}

function applyActiveBoardAnomalyForce(body: Matter.Body): void {
    if (!anomalyUntil || anomalyMode === "none") return;
    anomalyTick++;
    if (anomalyMode === "updraft") {
        Body.applyForce(body, body.position, { x: Math.sin((Date.now() + body.id * 17) / 320) * 0.0000012, y: -0.0000024 });
    } else if (anomalyMode === "blackHole") {
        const dx = anomalyCenterX - body.position.x;
        const dy = geometry.height * 0.36 - body.position.y;
        const dist = Math.max(80 * geometry.scale, Math.hypot(dx, dy));
        Body.applyForce(body, body.position, { x: dx / dist * 0.0000032, y: dy / dist * 0.0000022 });
    } else if (anomalyMode === "reverseRain") {
        Body.applyForce(body, body.position, { x: 0, y: -0.0000016 });
    } else if (anomalyMode === "tremor" && anomalyTick % 18 === 0) {
        Body.applyForce(body, body.position, { x: (appRandom() - 0.5) * 0.000012, y: -0.000003 });
    }
}

function vibrateOnMobile(pattern: number | number[]): void {
    if (!isMobile) return;
    try {
        navigator.vibrate?.(pattern);
    } catch {}
}

function triggerScreenFlash(mode: "normal" | "miracle" | "black" | "cosmic" = "miracle"): void {
    if (settings.simpleMode) return;
    const now = Date.now();
    if (isMobile && isStarted && !isFinished) return;
    if (isMobile && isStarted && !isFinished && now - lastScreenFlashAt < 1800) return;
    lastScreenFlashAt = now;
    const mobileAlphaScale = isMobile ? 0.42 : 1;
    const color = mode === "black"
        ? `rgba(255,0,68,${0.62 * mobileAlphaScale})`
        : mode === "cosmic"
            ? `rgba(100,70,255,${0.68 * mobileAlphaScale})`
            : mode === "normal"
                ? `rgba(255,255,255,${0.45 * mobileAlphaScale})`
                : `rgba(255,236,120,${0.72 * mobileAlphaScale})`;
    flashOverlay.style.background = color;
    flashOverlay.style.display = "block";
    flashOverlay.style.opacity = "1";
    flashOverlay.style.transition = `opacity ${isMobile ? 360 : 720}ms ease-out`;
    requestAnimationFrame(() => { flashOverlay.style.opacity = "0"; });
    window.setTimeout(() => { flashOverlay.style.display = "none"; }, isMobile ? 400 : 760);
}


function triggerSwordImpactEffect(): void {
    if (settings.simpleMode) return;
    playSwordImpactScreenEffect();
}

function closeHelpPopup(): void {
    helpOverlay.style.display = "none";
    helpOverlay.style.pointerEvents = "none";
    helpOverlay.innerHTML = "";
    restoreMainTouchTargets();
    applyDesktopDocumentScrollLayout();
    forceMobileFullViewportLayout();
}

function showPopup(title: string, bodyHtml: string): void {
    if (mobileSettingsOverlay && mobileSettingsOverlay.style.display !== "none") {
        mobileSettingsOverlay.style.display = "none";
    }
    const panelWidth = isMobile ? "calc(100vw - 20px)" : "min(980px, 94vw)";
    const panelMaxHeight = isMobile ? "calc(var(--miracle-app-height, 100vh) - 20px)" : "88dvh";
    const panelPadding = isMobile ? "30px 24px 24px" : "42px 40px 36px";
    const titleFont = isMobile ? "32px" : "clamp(30px,5vw,58px)";
    const bodyFont = isMobile ? "18px" : "clamp(16px,2.5vw,24px)";
    const closeSize = isMobile ? "54px" : "46px";
    const palette = getThemeUiPalette(currentTheme);

    helpOverlay.innerHTML = `
        <style>
            .miracle-popup-panel::before{
                content:"";
                position:absolute;
                inset:0;
                border-radius:inherit;
                background-image:url(${DEFAULT_BACKGROUND_IMAGE_URL});
                background-size:${isMobile ? "118px 118px" : "150px 150px"};
                background-repeat:repeat;
                background-position:center;
                opacity:.075;
                pointer-events:none;
                z-index:0;
            }
            .miracle-popup-panel > *{
                position:relative;
                z-index:1;
            }
            .miracle-popup-panel .miracle-user-card{
                background:${getMetallicPanelBackground(settings.blackModeEnabled)};
                color:${palette.fieldText};
                border:1px solid rgba(148,163,184,.42);
                box-sizing:border-box;
                padding:${isMobile ? "22px" : "28px"} !important;
                border-radius:22px;
                line-height:1.72;
            }
            .miracle-popup-panel .miracle-home-hero{
                background:${getMetallicPanelBackground(settings.blackModeEnabled)};
                color:${palette.fieldText};
                border:1px solid rgba(148,163,184,.42);
                box-sizing:border-box;
                padding:${isMobile ? "24px 24px 26px" : "34px 36px 36px"} !important;
                border-radius:24px;
            }
            .miracle-popup-panel .miracle-user-card > :first-child,
            .miracle-popup-panel .miracle-home-hero > :first-child{margin-top:0 !important;}
            .miracle-popup-panel .miracle-user-card > :last-child,
            .miracle-popup-panel .miracle-home-hero > :last-child{margin-bottom:0 !important;}
            .miracle-popup-panel .miracle-home-hero div:first-child{margin-bottom:${isMobile ? "14px" : "18px"};}
            .miracle-popup-panel .miracle-home-button{width:${isMobile ? "min(100%, 148px)" : "168px"};height:${isMobile ? "46px" : "48px"};min-height:${isMobile ? "46px" : "48px"};font-size:${isMobile ? "12px" : "13px"};font-weight:1000;padding:5px 10px;border-radius:999px;border:1px solid rgba(70,88,112,.42);background:${getMetallicButtonBackground(false)};color:#142033;cursor:pointer;box-sizing:border-box;white-space:normal;overflow-wrap:anywhere;word-break:keep-all;line-height:1.08;text-align:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.92), inset 0 -5px 10px rgba(30,42,58,.16), 0 8px 18px rgba(30,42,58,.14);text-shadow:0 1px 0 rgba(255,255,255,.55);overflow:hidden;}
            .miracle-popup-panel .miracle-home-primary{background:${getMetallicButtonBackground(true)};color:#3b2600;border-color:rgba(126,87,0,.55);}
            @media (max-width: 640px){
                .miracle-popup-panel .miracle-user-card{padding:20px !important;}
                .miracle-popup-panel .miracle-home-hero{padding:22px 22px 24px !important;}
            }
        </style>
        <div class="miracle-popup-panel" style="position:relative;width:${panelWidth};max-width:${panelWidth};max-height:${panelMaxHeight};overflow:auto;box-sizing:border-box;padding:${panelPadding};border-radius:${isMobile ? "24px" : "26px"};background:${getMetallicPanelBackground(settings.blackModeEnabled)};color:${palette.fieldText};box-shadow:inset 0 1px 0 rgba(255,255,255,.66), inset 0 -18px 40px rgba(15,23,42,.10), 0 28px 90px rgba(0,0,0,.46);border:1px solid rgba(148,163,184,.48);overscroll-behavior:contain;-webkit-overflow-scrolling:touch;">
            <button id="close-help-popup-button" aria-label="閉じる" style="position:sticky;float:right;right:0;top:0;width:${closeSize};height:${closeSize};border-radius:999px;border:1px solid rgba(70,88,112,.42);background:${getMetallicButtonBackground(false)};color:#142033;font-size:${isMobile ? "34px" : "28px"};font-weight:900;line-height:1;cursor:pointer;box-shadow:0 5px 14px rgba(87,112,51,.16);z-index:2;">×</button>
            <div style="font-size:${titleFont};font-weight:900;margin:0 ${isMobile ? "76px" : "70px"} 26px 0;padding-left:${isMobile ? "4px" : "6px"};color:${palette.title};line-height:1.18;word-break:keep-all;overflow-wrap:break-word;">${title}</div>
            <div style="font-size:${bodyFont};line-height:${isMobile ? "1.68" : "1.76"};color:${palette.fieldText};text-align:left;word-break:normal;overflow-wrap:break-word;padding:0 ${isMobile ? "2px" : "6px"};">${bodyHtml}</div>
            <div style="margin-top:24px;text-align:center;"><button id="bottom-close-help-popup-button" style="font-size:20px;padding:12px 28px;border-radius:999px;border:1px solid rgba(70,88,112,.42);cursor:pointer;font-weight:900;background:${getMetallicButtonBackground(false)};box-shadow:inset 0 1px 0 rgba(255,255,255,.92), inset 0 -5px 10px rgba(30,42,58,.16), 0 8px 18px rgba(30,42,58,.14);color:#142033;">閉じる</button></div>
        </div>`;
    helpOverlay.style.pointerEvents = "auto";
    helpOverlay.style.display = "flex";
    forceMobileFullViewportLayout();
    forcePopupToFront();
    window.setTimeout(forcePopupToFront, 0);
    window.setTimeout(forcePopupToFront, 120);
    document.getElementById("close-help-popup-button")!.onclick = () => closeHelpPopup();
    document.getElementById("bottom-close-help-popup-button")!.onclick = () => closeHelpPopup();
}


function showMiracleBookPopup(): void {
    const rows = SPECIAL_EVENT_DEFS.slice().reverse().map((def) => {
        const savedCount = savedRecords.discovered[def.kind] ?? 0;
        const nowCount = specialCreated[def.kind] ?? 0;
        return getMiracleBookRowHtml(def, {
            savedCount,
            currentCount: nowCount,
            firstFoundAt: savedRecords.discoveredFirstAt[def.kind],
            isMobile,
            oddsLabel: t("確率", "Odds"),
            oddsText: formatProbability(def.denominator),
            totalFoundLabel: t("累計発見", "Total found"),
            countSuffix: t("回", "x"),
            firstFoundLabel: t("初回発見", "First found"),
        });
    }).join("");
    showPopup("奇跡図鑑", getMiracleBookHtml(rows, isMobile));
}

function showUserSettingsPopup(): void {
    const discoveredKinds = getDiscoveredCount();
    showPopup(t("ユーザー設定", "User settings"), getUserSettingsHtml({
        profile: userProfile,
        savedRecords,
        discoveredKinds,
        specialCount: SPECIAL_EVENT_DEFS.length,
        isMobile,
        playStyleLabel: getUserPlayStyleLabel(userProfile.playStyle),
    }));
    const nicknameInput = document.getElementById("user-nickname-input") as HTMLInputElement | null;
    const playStyleSelect = document.getElementById("user-play-style-select") as HTMLSelectElement | null;
    const favoriteInput = document.getElementById("user-favorite-input") as HTMLInputElement | null;
    document.getElementById("save-user-profile-button")?.addEventListener("click", () => {
        userProfile.nickname = (nicknameInput?.value.trim() || "研究員").slice(0, 24);
        userProfile.favoriteMiracle = (favoriteInput?.value.trim() || "まだ未設定").slice(0, 40);
        applyPlayStylePreset((playStyleSelect?.value as UserPlayStyle) || "standard");
        showSoftToast(t("ユーザー設定を保存しました", "User settings saved"));
        showUserSettingsPopup();
    });
    document.getElementById("guest-name-button")?.addEventListener("click", () => {
        if (nicknameInput) nicknameInput.value = "研究員";
    });
    document.getElementById("export-user-data-button")?.addEventListener("click", () => exportLocalUserData());
    document.getElementById("reset-local-data-button")?.addEventListener("click", () => resetLocalUserData());
}

function showAppInfoPopup(): void {
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    showPopup(t("アプリ情報", "App info"), getAppInfoHtml({ appVersion: APP_VERSION, onlineStatusHtml: getAppOnlineStatusHtml(), standalone }));
}

function showRecordsPopup(): void {
    const rank = getCurrentResearchRankInfo();
    const unlockedThemes = getThemeCollection(savedRecords, getDiscoveredKindCount(), getFusionCountForRank(), getSecretCountForRank()).filter((x) => x.unlocked).length;
    showPopup("最高記録", getRecordsHtml({
        savedRecords,
        rankLevel: rank.level,
        rankLabel: rank.label,
        unlockedThemes,
        themeCount: getThemeOptions().length,
        missionCount: Object.keys(savedRecords.missionCompleted).length,
        missionTotal: missionDefs.length || buildMissionDefs().length,
    }));
}

function showAboutPopup(): void {
    showPopup("ミラクルボールラボについて", getAboutHtml({ normalTraitSummaryHtml: getNormalTraitSummaryHtml(), isMobile }));
    document.getElementById("mobile-audio-unlock-from-about")?.addEventListener("click", async () => {
        await unlockMobileAudio(true);
    });
}

function showButtonHelpPopup(): void {
    showPopup("ボタン説明", getButtonHelpHtml());
}

// ======================================================
// Layout / reset
// ======================================================

function applySettingsFromInputs(showInvalidPopup = true): boolean {
    const oldSettings = { ...settings };
    const targetRaw = targetInput.value.trim();
    const activeRaw = activeBallInput.value.trim();
    const binsRaw = binCountInput.value.trim();
    const rowsRaw = pinRowInput.value.trim();

    const target = Math.floor(Number(targetRaw));
    const active = Math.floor(Number(activeRaw));
    const bins = Math.floor(Number(binsRaw));
    const rows = Math.floor(Number(rowsRaw));
    const errors: string[] = [];

    if (!Number.isFinite(target) || target < 1) errors.push("投下数は1以上の数字で入力してください。");
    if (!Number.isFinite(active) || active < 1 || active > 300) errors.push("同時に出す玉数は1〜300で入力してください。");
    if (!Number.isFinite(bins) || bins < 2 || bins > 30) errors.push("下の受け皿数は2〜30で入力してください。");
    if (!Number.isFinite(rows) || rows < 1 || rows > 30) errors.push("ピン段数は1〜30で入力してください。");

    if (errors.length > 0) {
        targetInput.value = String(oldSettings.targetCount);
        activeBallInput.value = String(oldSettings.activeLimit);
        binCountInput.value = String(oldSettings.binCount);
        pinRowInput.value = String(oldSettings.pinRows);
        probabilityModeSelect.value = oldSettings.probabilityMode;
        effectModeSelect.value = oldSettings.effectMode;
        if (showInvalidPopup) {
            showPopup("入力チェック", `<p>${errors.join("</p><p>")}</p><p>入力前の値に戻しました。</p>`);
        }
        return false;
    }

    settings.targetCount = target;
    settings.activeLimit = active;
    settings.binCount = bins;
    settings.pinRows = rows;
    settings.labelText = createDefaultLabelText(settings.binCount);
    settings.probabilityMode = (probabilityModeSelect.value as ProbabilityMode) || "normal";
    settings.effectMode = (effectModeSelect.value as EffectMode) || "normal";

    if (selectedBackgroundObjectUrl && backgroundInput.value.startsWith("選択した画像:")) settings.backgroundImage = selectedBackgroundObjectUrl;

    targetInput.value = String(settings.targetCount);
    activeBallInput.value = String(settings.activeLimit);
    binCountInput.value = String(settings.binCount);
    pinRowInput.value = String(settings.pinRows);
    probabilityModeSelect.value = settings.probabilityMode;
    effectModeSelect.value = settings.effectMode;
    persistUserPreferencesSoon();
    return true;
}

function createDefaultLabelText(count: number): string {
    return Array.from({ length: count }, (_, i) => String(i + 1)).join("\n");
}

function autoApplyLayoutSetting(): void {
    const before = {
        targetCount: settings.targetCount,
        activeLimit: settings.activeLimit,
        binCount: settings.binCount,
        pinRows: settings.pinRows,
        probabilityMode: settings.probabilityMode,
    };
    const ok = applySettingsFromInputs(true);
    if (!ok) return;
    const changed =
        before.targetCount !== settings.targetCount ||
        before.activeLimit !== settings.activeLimit ||
        before.binCount !== settings.binCount ||
        before.pinRows !== settings.pinRows ||
        before.probabilityMode !== settings.probabilityMode;
    if (changed) {
        resetExperiment(false);
        showSoftToast(t("盤面設定を反映しました", "Board settings applied"));
    }
}

function calculateGeometry(): Geometry {
    const visual = window.visualViewport;
    const layoutWidth = document.documentElement.clientWidth || window.innerWidth;
    const layoutHeight = document.documentElement.clientHeight || window.innerHeight;
    const mobileViewportWidth = Math.min(visual?.width || window.innerWidth || layoutWidth, window.innerWidth || layoutWidth, layoutWidth || window.innerWidth);
    const mobileViewportHeight = Math.min(visual?.height || window.innerHeight || layoutHeight, window.innerHeight || layoutHeight, layoutHeight || window.innerHeight);
    const viewportWidth = Math.max(320, Math.floor(isMobile ? mobileViewportWidth : (visual?.width ?? window.innerWidth)));
    const viewportHeight = Math.max(480, Math.floor(isMobile ? mobileViewportHeight : (visual?.height ?? window.innerHeight)));
    const mobileGameSize = isMobile ? getMobileGameViewportSize() : null;
    const small = isMobile || viewportWidth < 700;
    const fullscreenLike = isFullscreenMode || isPseudoFullscreenMode;
    const infoHeight = fullscreenLike
        ? 0
        : isMobile
            ? getMobileDockHeightPx()
            : Math.round(clamp(viewportHeight * (small ? 0.24 : 0.40), small ? 170 : 300, small ? 270 : 500));
    const width = mobileGameSize?.width ?? viewportWidth;
    const height = fullscreenLike ? viewportHeight : (mobileGameSize?.height ?? Math.max(360, viewportHeight - infoHeight));
    const scale = clamp(Math.min(width / BASE_WIDTH, height / BASE_HEIGHT), 0.56, 2.4);
    const pixelRatio = settings.lowSpecMode || settings.simpleMode
        ? 1
        : isMobile
            ? 1
            : clamp(window.devicePixelRatio || 1, 1, 2);

    const totalBinCount = settings.binCount + 2;
    const visibleStart = 1;
    const wallWidth = clamp(36 * scale, 22, 72);
    const groundHeight = clamp(40 * scale, 26, 76);
    const binLeft = wallWidth;
    const binRight = width - wallWidth;
    const binWidth = (binRight - binLeft) / totalBinCount;
    const groundTop = height - groundHeight;
    const binScale = clamp(binWidth / 90, isMobile ? 0.9 : 0.55, 2.25);
    const ballRadius = clamp(18 * scale * binScale, isMobile ? 8 : 5, isMobile ? 34 : 30);
    const pinRadius = clamp(13 * scale * binScale, isMobile ? 7 : 5, isMobile ? 26 : 24);
    const dividerWidth = clamp(12 * scale * binScale, 5, 22);
    const dividerHeight = clamp(104 * scale, 68, 170);
    const dividerY = groundTop - dividerHeight / 2;
    const labelFont = Math.round(clamp(42 * scale * binScale, isMobile ? 24 : 16, isMobile ? 72 : 60));
    const countFont = Math.round(clamp(28 * scale * binScale, isMobile ? 16 : 12, isMobile ? 50 : 44));
    const percentFont = Math.round(clamp(20 * scale * binScale, isMobile ? 12 : 10, isMobile ? 36 : 32));
    const infoFont = Math.round(clamp(18 * scale, 15, isMobile ? 30 : 26));
    const labelY = groundTop - clamp(118 * scale, 72, 170);
    const countY = groundTop - clamp(74 * scale, 46, 110);
    const percentY = groundTop - clamp(38 * scale, 24, 64);
    const barY = groundTop - clamp(14 * scale, 9, 28);
    const ballCountY = groundTop - ballRadius - 2 * scale;
    const binCenters: number[] = [];
    for (let i = 0; i < settings.binCount; i++) {
        binCenters.push(binLeft + (visibleStart + i) * binWidth + binWidth / 2);
    }
    return { width, height, infoHeight, scale, pixelRatio, wallWidth, groundHeight, groundTop, totalBinCount, binLeft, binRight, binWidth, visibleStart, ballRadius, pinRadius, dividerWidth, dividerHeight, dividerY, ballCountY, labelY, countY, percentY, barY, labelFont, countFont, percentFont, infoFont, binCenters };
}

function applyBackgroundImage(): void {
    const url = settings.backgroundImage.trim();
    if (settings.blackModeEnabled) {
        canvas.style.backgroundImage = "";
        canvas.style.backgroundColor = "#000";
        gameArea.style.backgroundImage = "";
        gameArea.style.background = "#000";
        return;
    }
    if (url.length === 0) {
        canvas.style.backgroundImage = "";
        canvas.style.backgroundColor = "rgba(245,245,245,0.88)";
        gameArea.style.backgroundImage = "";
        gameArea.style.background = "radial-gradient(circle at 50% 0%, #ffffff 0%, #edf3ff 46%, #dfe7f5 100%)";
        return;
    }
    const isDefaultFavicon = url === DEFAULT_BACKGROUND_IMAGE_URL || /\/favicon\.png(?:$|[?#])/i.test(url);
    canvas.style.backgroundImage = `url("${url}")`;
    canvas.style.backgroundRepeat = "no-repeat";
    canvas.style.backgroundPosition = "center";
    canvas.style.backgroundSize = "cover";
    canvas.style.backgroundColor = isDefaultFavicon ? "rgba(245,250,239,0.92)" : "rgba(17,24,39,0.35)";
    gameArea.style.background = isMobile
        ? (isDefaultFavicon ? "radial-gradient(circle at 50% 36%, rgba(255,255,255,.90) 0%, rgba(225,239,198,.88) 42%, rgba(26,36,25,.92) 100%)" : "#111827")
        : (isDefaultFavicon ? "radial-gradient(circle at 50% 36%, rgba(255,255,255,.90) 0%, rgba(225,239,198,.88) 42%, rgba(26,36,25,.92) 100%)" : "#111827");
    gameArea.style.backgroundImage = isMobile
        ? ""
        : (isDefaultFavicon
            ? `linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.12)), url("${url}")`
            : `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url("${url}")`);
    gameArea.style.backgroundRepeat = "no-repeat";
    gameArea.style.backgroundSize = "cover";
    gameArea.style.backgroundPosition = "center";
}

function fullscreenLikeCanvasHeight(): string {
    return isFullscreenMode || isPseudoFullscreenMode ? "var(--miracle-app-height, 100vh)" : "100%";
}

function scheduleViewportStabilize(startAgain = false): void {
    if (isAppTerminated) return;
    applyDesktopDocumentScrollLayout();
    normalizeAppViewportStyles();
    const keepRunning = startAgain || (isStarted && !isFinished);
    const allowBoardReset = !isStarted || isFinished;
    const delays = [0, 80, 220, 520];
    for (const delay of delays) {
        window.setTimeout(() => {
            if (isAppTerminated) return;
            normalizeAppViewportStyles();
            forceMobileFullViewportLayout();
            const currentWidth = Math.floor(window.innerWidth || document.documentElement.clientWidth || geometry.width);
            const currentHeight = Math.floor(window.innerHeight || document.documentElement.clientHeight || geometry.height);
            const canvasTooSmall = isMobile && (canvas.clientWidth < currentWidth * 0.86 || canvas.clientHeight < Math.max(320, currentHeight * 0.32));
            if (allowBoardReset && (keepRunning || canvasTooSmall)) resetExperiment(keepRunning && !isFinished);
            appRoot.style.width = "100vw";
            appRoot.style.height = isMobile ? "var(--miracle-app-height, 100vh)" : "auto";
            appRoot.style.minHeight = isMobile ? "var(--miracle-app-height, 100vh)" : "100vh";
            appRoot.style.display = isMobile ? "flex" : "block";
            appRoot.style.overflowY = isMobile ? "hidden" : "visible";
            gameArea.style.width = "100%";
            gameArea.style.minHeight = isMobile ? "0" : "";
            canvas.style.maxWidth = "100vw";
            canvas.style.maxHeight = fullscreenLikeCanvasHeight();
            applyMobileGameCanvasLayout();
            if (!isMobile) {
                info.style.height = "auto";
                info.style.maxHeight = "none";
                info.style.overflow = "visible";
            }
        }, delay);
    }
}

function forceViewportRelayout(startAgain = false): void {
    if (isAppTerminated) return;
    ensureMobileViewportMeta();
    normalizeAppViewportStyles();
    const shouldKeepRunning = startAgain || (isStarted && !isFinished);
    resetExperiment(shouldKeepRunning);
    window.setTimeout(() => {
        if (!isAppTerminated) resetExperiment(shouldKeepRunning && !isFinished);
    }, 80);
    window.setTimeout(() => normalizeAppViewportStyles(), 180);
}

function resetExperiment(startNow = false): void {
    applyDesktopDocumentScrollLayout();
    normalizeAppViewportStyles();
    ensureRenderLoop();
    geometry = calculateGeometry();
    info.style.height = isMobile ? `${geometry.infoHeight}px` : "auto";
    info.style.maxHeight = isMobile ? "" : "none";
    info.style.overflow = isMobile ? "hidden" : "visible";
    const sidePadding = isMobile ? Math.round(clamp(12 * geometry.scale, 10, 16)) : Math.round(20 * geometry.scale);
    info.style.padding = isMobile
        ? `10px 10px env(safe-area-inset-bottom, 10px)`
        : `${Math.round(14 * geometry.scale)}px ${sidePadding}px`;
    info.style.fontSize = `${geometry.infoFont}px`;

    render.options.width = geometry.width;
    render.options.height = geometry.height;
    render.options.pixelRatio = geometry.pixelRatio;
    render.options.background = "transparent";
    Render.setPixelRatio(render, geometry.pixelRatio);
    Render.setSize(render, geometry.width, geometry.height);
    canvas.style.width = `${geometry.width}px`;
    canvas.style.height = `${geometry.height}px`;
    canvas.style.maxWidth = "100vw";
    canvas.style.maxHeight = fullscreenLikeCanvasHeight();
    syncMobileMatterCanvasSize();
    appRoot.style.width = "100vw";
    appRoot.style.minWidth = "100vw";
    appRoot.style.height = isMobile ? "var(--miracle-app-height, 100vh)" : "auto";
    appRoot.style.minHeight = isMobile ? "var(--miracle-app-height, 100vh)" : "100vh";
    appRoot.style.display = isMobile ? "flex" : "block";
    appRoot.style.overflowY = isMobile ? "hidden" : "visible";
    gameArea.style.width = "100%";
    gameArea.style.minWidth = "100%";
    gameArea.style.minHeight = isMobile ? "0" : "";
    normalizeAppViewportStyles();
    forceMobileFullViewportLayout();
    applyMobileGameCanvasLayout();
    applyDesktopDocumentScrollLayout();
    applyBackgroundImage();

    for (const pin of temporaryPinBodies) Composite.remove(engine.world, pin);
    temporaryPinBodies.clear();
    magicBoardShapeToken++;
    activeMagicPhysicsFields.length = 0;
    Composite.clear(engine.world, false);
    finishedCount = 0;
    activeDropCount = 0;
    startTime = Date.now();
    endTime = null;
    targetReachedTime = null;
    lastSpeedCheckTime = Date.now();
    lastSpeedCheckFinishedCount = 0;
    speedPerSecond = 0;
    nextMilestone = MILESTONE_INTERVAL;
    nextGiantEvent = GIANT_EVENT_INTERVAL;
    giantStock = 0;
    isFinished = false;
    isPaused = false;
    isStarted = startNow;
    if (startNow) {
        activateBossForRun();
    } else {
        getBossExperimentController().clear(false);
    }
    isMiraclePaused = false;
    if (miraclePauseTimer !== undefined) { window.clearTimeout(miraclePauseTimer); miraclePauseTimer = undefined; }
    updateStopButton();

    labels = parseLabels(createDefaultLabelText(settings.binCount), settings.binCount);
    missionDefs = buildMissionDefs();
    missionProgress = {};
    runScore = 0;
    bestComboThisRun = 0;
    skillState = { shockwave: 2, magnet: 2, timeStop: 1 };
    magnetUntil = 0;
    updateSkillButtons();
    binCounts = Array.from({ length: settings.binCount }, () => 0);
    hitFlash = Array.from({ length: settings.binCount }, () => 0);
    discardedCount = 0;
    goldHits = Array.from({ length: settings.binCount }, () => 0);
    rainbowHits = Array.from({ length: settings.binCount }, () => 0);
    giantHits = Array.from({ length: settings.binCount }, () => 0);
    shapeHits = Array.from({ length: settings.binCount }, () => 0);
    crownHits = Array.from({ length: settings.binCount }, () => 0);
    starHits = Array.from({ length: settings.binCount }, () => 0);
    heartHits = Array.from({ length: settings.binCount }, () => 0);
    blackSunHits = Array.from({ length: settings.binCount }, () => 0);
    cosmicEggHits = Array.from({ length: settings.binCount }, () => 0);
    randomTelemetry.reset();
    floatingTexts = [];
    shakeUntil = 0;
    shakePower = 0;

    goldCreated = 0;
    rainbowCreated = 0;
    giantCreated = 0;
    shapeCreated = 0;
    crownCreated = 0;
    starCreated = 0;
    heartCreated = 0;
    blackSunCreated = 0;
    cosmicEggCreated = 0;
    silverUfoCreated = 0;
    blueFlameCreated = 0;
    luckySevenCreated = 0;
    timeRiftCreated = 0;
    labExplosionCreated = 0;
    specialCreated = {};
    repeatedMiracleRunCounts = {};
    recentMiracleKinds = [];
    unlockedChainRunIds = {};
    rarePinTouchCount = { red: 0, blue: 0, black: 0, rainbow: 0 };
    pachinkoYakumonoHitCount = { start: 0, center: 0, premium: 0 };
    pachinkoJackpotCount = 0;
    tutorialMissionProgress = {};
    guideModeActive = false;
    guideModeStartedAt = 0;
    welcomeShowcaseDone = false;
    smallMiracleCount = 0;
    tapInterventionCount = 0;
    nextSmallMiracleAt = 0;
    tapRipples = [];
    for (const timer of guideTimers) window.clearTimeout(timer);
    guideTimers = [];
    lastOmenText = "";
    lastCommentaryAt = 0;
    if (commentaryTimer !== undefined) { window.clearTimeout(commentaryTimer); commentaryTimer = undefined; }
    commentaryOverlay.style.display = "none";
    commentaryOverlay.innerHTML = "";
    recentMiracleMiniLogs = [];
    updateRecentMiracleMini();
    updateStatusMiniOverlays();
    updateTutorialMissions();
    updateResearchProgressPanel();
    maybeFamiliarAssist();
    anomalyUntil = 0;
    anomalyHidePins = false;
    anomalyMode = "none";
    currentSubtitleText = "";
    subtitleOverlay.style.display = "none";
    comboOverlay.style.display = "none";

    resultOverlay.style.display = "none";
    milestoneOverlay.style.display = "none";
    celebrationOverlay.style.display = "none";
    clearMiracleOverlayNow();
    canvas.style.transform = "translate(0,0)";
    activeWorldMode = null;
    activeUiAccentKind = null;
    if (uiAccentTimer !== undefined) { window.clearTimeout(uiAccentTimer); uiAccentTimer = undefined; }
    currentPachinkoNailPattern = pickRandomPachinkoNailPattern();
    activeRareBackgroundKind = null;

    Composite.add(engine.world, [...createWallsAndFloor(), ...createPins(), ...createDividers(), ...createPachinkoYakumonoSensors()]);
    applyWorldModeBodyStyles();

    // Matter.js の描画ループをここで必ず再開する。
    // これがないと、背景だけ表示されてピン・玉・受け皿が描画されないことがある。
    ensureRenderLoop();

    if (startNow) {
        scheduleFirstRunShowcase();
        for (let i = 0; i < settings.activeLimit; i++) Composite.add(engine.world, createDrop());
        Runner.stop(runner);
        if (!isMiraclePaused) Runner.run(runner, engine);
    } else {
        Runner.stop(runner);
    }

    applyBlackMode();
    updateSimpleModeButton();
    updateBlackModeButton();
    updateInfo();
}

function applyBlackMode(): void {
    document.body.classList.toggle("miracle-black-mode", settings.blackModeEnabled);
    if (settings.blackModeEnabled) {
        appRoot.style.background = "#020617";
        info.style.background = "linear-gradient(180deg, rgba(7,12,24,.98) 0%, rgba(10,18,32,.96) 100%)";
        info.style.color = "#f8fafc";
        gameArea.style.background = "#020617";
        canvas.style.backgroundColor = "#020617";
        activeEffectBadge.style.background = "rgba(7,12,24,.86)";
        recentMiracleMini.style.background = "rgba(7,12,24,.92)";
        recentMiracleMini.style.color = "#f8fafc";
    } else {
        appRoot.style.background = "";
        info.style.background = "linear-gradient(180deg,rgba(255,255,255,.90) 0%,rgba(244,247,252,.90) 100%)";
        info.style.color = "#172033";
        recentMiracleMini.style.background = "rgba(255,255,255,.78)";
        recentMiracleMini.style.color = "#172033";
        applyBackgroundImage();
    }
    applyTheme();
    updateUiLanguage();
}

function repaintThemeDecorations(palette: ReturnType<typeof getThemeUiPalette>): void {
    const panelSelectors = [
        "#miracle-info-area > div",
        ".miracle-section",
        ".miracle-user-card",
        ".miracle-record-hero",
        ".miracle-popup-panel",
        ".miracle-mobile-panel",
        ".miracle-mobile-settings-header",
    ].join(",");

    document.querySelectorAll<HTMLElement>(panelSelectors).forEach((panel) => {
        panel.style.background = getMetallicPanelBackground(settings.blackModeEnabled);
        panel.style.color = palette.fieldText;
        panel.style.borderColor = "rgba(148,163,184,.42)";
        panel.style.borderRadius = "26px";
        panel.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.66), 0 10px 28px rgba(30,42,58,.14)";
    });

    document.querySelectorAll<HTMLButtonElement>("button:not([data-fixed-style='1'])").forEach((button) => {
        const primary = button.classList.contains("miracle-home-primary");
        const isPopupCloseButton = button.id === "close-help-popup-button" || button.id === "bottom-close-help-popup-button";
        const isMainOverlayButton = button === gameFullscreenButton || button === pcPauseButton || button === mobileDockRunButton || button === mobileDockPauseButton || button === mobileDockSettingsButton;
        const shouldUnifySize = !isPopupCloseButton && !isMainOverlayButton && Boolean(button.closest(".miracle-section, .miracle-mobile-panel") || button.classList.contains("miracle-home-button"));
        if (shouldUnifySize) {
            applyUnifiedMetallicButtonStyle(button, primary);
            if (button.classList.contains("miracle-home-button")) {
                button.style.width = isMobile ? "min(100%, 148px)" : "168px";
                button.style.height = isMobile ? "46px" : "48px";
                button.style.minHeight = button.style.height;
                button.style.maxHeight = button.style.height;
            }
        } else {
            button.style.background = getMetallicButtonBackground(primary);
            button.style.color = primary ? "#3b2600" : "#142033";
            button.style.borderColor = primary ? "rgba(126,87,0,.55)" : "rgba(70,88,112,.42)";
            button.style.borderRadius = "999px";
            button.style.boxShadow = primary
                ? "inset 0 1px 0 rgba(255,255,255,.82), inset 0 -5px 10px rgba(105,62,0,.20), 0 8px 18px rgba(126,87,0,.18)"
                : "inset 0 1px 0 rgba(255,255,255,.92), inset 0 -5px 10px rgba(30,42,58,.16), 0 8px 18px rgba(30,42,58,.14)";
        }
    });

    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select").forEach((field) => {
        field.style.background = palette.fieldBg;
        field.style.color = palette.fieldText;
        field.style.borderColor = palette.buttonBorder;
        field.style.borderRadius = field.tagName.toLowerCase() === "textarea" ? "22px" : "999px";
    });
}

function updateBlackModeButton(): void {
    const themePalette = getThemeUiPalette(currentTheme);
    blackModeButton.textContent = settings.blackModeEnabled ? t("ブラック: ON", "Black: ON") : t("ブラック: OFF", "Black: OFF");
    blackModeButton.style.background = settings.blackModeEnabled ? "linear-gradient(180deg,#000 0%,#171717 100%)" : themePalette.buttonBg;
    blackModeButton.style.color = settings.blackModeEnabled ? "#f8fafc" : themePalette.buttonText;
    blackModeButton.style.borderColor = settings.blackModeEnabled ? "#64748b" : themePalette.buttonBorder;
    blackModeButton.style.boxShadow = settings.blackModeEnabled ? "inset 0 3px 10px rgba(0,0,0,.42), 0 0 0 2px rgba(255,255,255,.22)" : "0 6px 16px rgba(0,0,0,.12)";
    blackModeButton.style.transform = settings.blackModeEnabled ? "translateY(2px)" : "translateY(0)";
}

function updateSimpleModeButton(): void {
    const themePalette = getThemeUiPalette(currentTheme);
    simpleModeButton.textContent = settings.simpleMode ? t("シンプル: ON", "Simple: ON") : t("シンプル: OFF", "Simple: OFF");
    simpleModeButton.style.background = settings.simpleMode ? themePalette.badge : themePalette.buttonBg;
    simpleModeButton.style.color = settings.simpleMode ? themePalette.badgeText : themePalette.buttonText;
    simpleModeButton.style.borderColor = themePalette.buttonBorder;
    simpleModeButton.style.boxShadow = settings.simpleMode ? "inset 0 3px 10px rgba(0,0,0,.34), 0 0 0 2px rgba(255,255,255,.22)" : "0 6px 16px rgba(0,0,0,.12)";
    simpleModeButton.style.transform = settings.simpleMode ? "translateY(2px)" : "translateY(0)";
}

function updateCameraShakeButton(): void {
    const themePalette = getThemeUiPalette(currentTheme);
    cameraShakeButton.textContent = settings.cameraShakeEnabled ? t("画面揺れ: ON", "Shake: ON") : t("画面揺れ: OFF", "Shake: OFF");
    cameraShakeButton.style.background = settings.cameraShakeEnabled ? themePalette.badge : themePalette.buttonBg;
    cameraShakeButton.style.color = settings.cameraShakeEnabled ? themePalette.badgeText : themePalette.buttonText;
    cameraShakeButton.style.borderColor = themePalette.buttonBorder;
}

function updateSlowMiracleButton(): void {
    const themePalette = getThemeUiPalette(currentTheme);
    slowMiracleButton.textContent = settings.slowMiracleEffects ? t("演出ゆっくり: ON", "Slow effects: ON") : t("演出ゆっくり: OFF", "Slow effects: OFF");
    slowMiracleButton.style.background = settings.slowMiracleEffects ? themePalette.badge : themePalette.buttonBg;
    slowMiracleButton.style.color = settings.slowMiracleEffects ? themePalette.badgeText : themePalette.buttonText;
    slowMiracleButton.style.borderColor = themePalette.buttonBorder;
}

function paintToggleButton(button: HTMLButtonElement, enabled: boolean, onColor = "linear-gradient(180deg, #f3f8e8 0%, #dceec2 100%)"): void {
    const themePalette = getThemeUiPalette(currentTheme);
    const uiAccent = getUiAccentPaletteByKind(getCurrentUiAccentKind());
    const onBg = uiAccent?.badge ?? themePalette.badge ?? onColor;
    const onText = uiAccent?.badgeText ?? themePalette.badgeText;
    const onBorder = uiAccent?.border ?? themePalette.buttonBorder;
    const offBg = settings.blackModeEnabled ? "linear-gradient(180deg,#172033 0%, #0f172a 100%)" : themePalette.buttonBg;
    const offText = settings.blackModeEnabled ? "#f8fafc" : themePalette.buttonText;
    const offBorder = settings.blackModeEnabled ? "#64748b" : themePalette.buttonBorder;
    button.style.background = enabled ? onBg : offBg;
    button.style.color = enabled ? onText : offText;
    button.style.borderColor = enabled ? onBorder : offBorder;
    button.style.boxShadow = enabled ? "inset 0 3px 10px rgba(0,0,0,.24), 0 0 0 2px rgba(255,255,255,.22)" : "0 6px 16px rgba(0,0,0,.12)";
    button.style.transform = enabled ? "translateY(2px)" : "translateY(0)";
}

function updateEffectsButton(): void {
    effectsButton.textContent = settings.effectsEnabled ? t("演出: ON", "Effects: ON") : t("演出: OFF", "Effects: OFF");
    paintToggleButton(effectsButton, settings.effectsEnabled, "linear-gradient(180deg, #fff7ed 0%, #fed7aa 100%)");
}

function updateCommentaryButton(): void {
    commentaryButton.textContent = settings.commentaryEnabled ? t("実況ログ: ON", "Commentary: ON") : t("実況ログ: OFF", "Commentary: OFF");
    paintToggleButton(commentaryButton, settings.commentaryEnabled);
}

function updateBoardAnomalyButton(): void {
    boardAnomalyButton.textContent = settings.boardAnomalyEnabled ? t("盤面変異: ON", "Anomaly: ON") : t("盤面変異: OFF", "Anomaly: OFF");
    paintToggleButton(boardAnomalyButton, settings.boardAnomalyEnabled);
}

function updateNormalTraitButton(): void {
    normalTraitButton.textContent = settings.normalBallTraitsEnabled ? t("個体差: ON", "Traits: ON") : t("個体差: OFF", "Traits: OFF");
    paintToggleButton(normalTraitButton, settings.normalBallTraitsEnabled);
}

function updateTimeBallSkinButton(): void {
    timeBallSkinButton.textContent = settings.timeBallSkinsEnabled ? t("時間帯玉: ON", "Time skins: ON") : t("時間帯玉: OFF", "Time skins: OFF");
    paintToggleButton(timeBallSkinButton, settings.timeBallSkinsEnabled, "linear-gradient(180deg, #eef2ff 0%, #c7d2fe 100%)");
}

function updateMobileCompactButton(): void {
    mobileCompactButton.textContent = settings.mobileCompactMode ? t("スマホ簡易: ON", "Compact: ON") : t("スマホ簡易: OFF", "Compact: OFF");
    paintToggleButton(mobileCompactButton, settings.mobileCompactMode);
}

function updateLowSpecButton(): void {
    lowSpecButton.textContent = settings.lowSpecMode ? t("低スペック: ON", "Low spec: ON") : t("低スペック: OFF", "Low spec: OFF");
    paintToggleButton(lowSpecButton, settings.lowSpecMode, "linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%)");
}

function applyLowSpecMode(): void {
    if (!settings.lowSpecMode) return;
    settings.simpleMode = true;
    settings.effectsEnabled = false;
    settings.slowMiracleEffects = false;
    settings.mobileCompactMode = true;
    settings.showRecentMiracles = false;
    settings.cameraShakeEnabled = false;
    settings.boardAnomalyEnabled = false;
    settings.effectMode = "quiet";
    if (pixiEnabled) {
        pixiEnabled = false;
        pixiBackground?.setVisible(false);
    }
    if (settings.activeLimit > 10) settings.activeLimit = 10;
    activeBallInput.value = String(settings.activeLimit);
    effectModeSelect.value = settings.effectMode;
    updateSimpleModeButton();
    updateEffectsButton();
    updateSlowMiracleButton();
    updateMobileCompactButton();
    updateRecentMiracleDisplayButton();
    updateCameraShakeButton();
    updateBoardAnomalyButton();
    pixiButton.textContent = t("Pixi背景: OFF", "Pixi BG: OFF");
    applyMobileCompactMode();
}

function updateRecentMiracleDisplayButton(): void {
    recentMiracleDisplayButton.textContent = settings.showRecentMiracles ? t("直近の奇跡: ON", "Recent: ON") : t("直近の奇跡: OFF", "Recent: OFF");
    paintToggleButton(recentMiracleDisplayButton, settings.showRecentMiracles, "linear-gradient(180deg, #eef2ff 0%, #c7d2fe 100%)");
}

function getEffectModeLabel(): string {
    const labels: Record<EffectMode, string> = isEnglish
        ? { quiet: "Quiet", normal: "Normal", flashy: "Flashy", recording: "Recording" }
        : { quiet: "控えめ", normal: "通常", flashy: "派手", recording: "録画向け" };
    return labels[settings.effectMode] ?? labels.normal;
}

function getEffectIntensity(force = false): number {
    if ((!settings.effectsEnabled && !force) || settings.simpleMode) return 0;
    if (settings.effectMode === "quiet") return 0.55;
    if (settings.effectMode === "flashy") return 1.45;
    if (settings.effectMode === "recording") return 1.2;
    return 1;
}

function showSoftToast(message: string): void {
    persistUserPreferencesSoon();
    softToastOverlay.textContent = message;
    if (toastTimer !== undefined) window.clearTimeout(toastTimer);
    softToastOverlay.style.opacity = "1";
    softToastOverlay.style.transform = "translate(-50%, 0)";
    toastTimer = window.setTimeout(() => {
        softToastOverlay.style.opacity = "0";
        softToastOverlay.style.transform = "translate(-50%, -8px)";
    }, 1450);
}

function hideCommentaryNow(): void {
    if (commentaryTimer !== undefined) { window.clearTimeout(commentaryTimer); commentaryTimer = undefined; }
    commentaryOverlay.style.display = "none";
    commentaryOverlay.innerHTML = "";
}

function clearBoardAnomaly(): void {
    anomalyUntil = 0;
    engine.gravity.x = anomalyOldGravityX;
    anomalyHidePins = false;
    anomalyMode = "none";
    anomalyCenterX = 0;
    anomalyTick = 0;
    engine.timing.timeScale = getCurrentTimeScale();
    updateStatusMiniOverlays();
}

function applyMobileCompactMode(): void {
    const compact = isMobile && settings.mobileCompactMode;
    commentaryOverlay.style.bottom = compact ? "78px" : (isMobile ? "62px" : "10px");
    updateStatusMiniOverlays();
    updateRecentMiracleMini();
}

function updateRecentMiracleMini(): void {
    if (!settings.showRecentMiracles) {
        recentMiracleMini.style.display = "none";
    tutorialMissionPanel.style.display = "none";
    researchProgressPanel.style.display = "none";
        return;
    }
    if (settings.mobileCompactMode && isMobile) {
        recentMiracleMini.style.display = "none";
    tutorialMissionPanel.style.display = "none";
    researchProgressPanel.style.display = "none";
        return;
    }
    const rows = recentMiracleMiniLogs.slice(0, 3);
    if (rows.length === 0) {
        recentMiracleMini.style.display = "none";
    tutorialMissionPanel.style.display = "none";
    researchProgressPanel.style.display = "none";
        return;
    }
    recentMiracleMini.innerHTML = `<div style="font-size:${isMobile ? "13px" : "13px"};opacity:.72;margin-bottom:4px;">${t("直近の奇跡", "Recent miracles")}</div>` + rows.map((x) => `<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x.rank} ${x.label}</div>`).join("");
    recentMiracleMini.style.display = "block";
}

function updateStatusMiniOverlays(): void {
    const labels: string[] = [];
    if (!settings.effectsEnabled) labels.push(t("演出OFF", "Effects OFF"));
    if (settings.timeBallSkinsEnabled) labels.push(getTimeBallThemeLabel(getCurrentTimeBallTheme()));
    labels.push(`${t("演出", "Mode")}: ${getEffectModeLabel()}`);
    if (anomalyUntil && anomalyMode !== "none") {
        const remain = Math.max(0, (anomalyUntil - Date.now()) / 1000);
        labels.unshift(`${anomalyLabel} ${remain.toFixed(1)}s`);
    }
    if (activeWorldMode) labels.unshift(`${t("世界", "World")}: ${activeWorldMode}`);
    if (isMiraclePaused) labels.unshift(t("奇跡演出中", "Miracle effect"));
    if (settings.mobileCompactMode && isMobile) {
        labels.splice(1);
    }
    activeEffectBadge.innerHTML = labels.map((x) => `<div>${x}</div>`).join("");
    activeEffectBadge.style.display = labels.length > 0 ? "block" : "none";
}

function updateStopButton(): void {
    stopButton.textContent = isPaused ? t("再開", "Resume") : t("ストップ", "Stop");
    pcPauseButton.textContent = isPaused ? t("再開", "Resume") : t("一時停止", "Pause");
    pcPauseButton.title = isPaused ? t("再開", "Resume") : t("一時停止", "Pause");
    if (mobileDockPauseButton) mobileDockPauseButton.textContent = isPaused ? t("再開", "Resume") : t("一時停止", "Pause");
}

function startExperiment(mode: "normal" | "boss" = "normal"): void {
    if (mode !== "boss") getBossExperimentController().clear(true);
    if (isMobile) {
        normalizeAppViewportStyles();
        forceMobileFullViewportLayout();
    }
    if (!applySettingsFromInputs(true)) return;
    applyAutoTheme("run");
    userProfile.lastPlayedDateKey = getDateKey();
    saveUserProfile();
    void ensureAnimeReady();
    void ensureTippyReady();
    void ensureGifReady();
    // ブラウザの仕様上、音声開始はユーザー操作後が安全なので準備する。
    // iPhoneでは音声解放のPromiseが長引くことがあるため、実験開始は待たずに即実行する。
    void unlockMobileAudio(false);
    if (soundEnabled && !toneReady) void enableSound(false);
    playUiSound("start");
    recordAdminEvent({ type: "run_start", at: Date.now(), targetCount: settings.targetCount, detail: `${settings.activeLimit} active / ${settings.binCount} bins / ${settings.pinRows} rows` });
    engine.timing.timeScale = getCurrentTimeScale();
    resetExperiment(true);
}

function clearMiracleOverlayNow(): void {
    hideMiracleOverlayNow();
}

function setMiracleOverlayAnimationPaused(paused: boolean): void {
    const state = paused ? "paused" : "running";

    miracleOverlay.style.animationPlayState = state;

    miracleOverlay
        .querySelectorAll<HTMLElement>("*")
        .forEach((el) => {
            el.style.animationPlayState = state;
        });
}

function markRemoteMiracleAssetBad(asset: RemoteMiracleAsset): void {
    remoteMiracleBadUrlCache.markBad(asset);
}

function getUsableRemoteMiracleAssetSources(asset: RemoteMiracleAsset, ignoreBadCache = false) {
    return remoteMiracleBadUrlCache.getUsableSources(asset, ignoreBadCache);
}

function isRemoteMiracleAssetUsable(asset: RemoteMiracleAsset): boolean {
    return remoteMiracleBadUrlCache.isUsable(asset);
}

async function loadRemoteMiracleAssets(force = false): Promise<RemoteMiracleAsset[]> {
    return remoteMiracleAssetLoader.load(force);
}

function stopRemoteMiracleVideo(): void {
    hideMobileVideoSoundRetryButton();

    if (remoteMiracleVideoTimer !== undefined) {
        window.clearTimeout(remoteMiracleVideoTimer);
        remoteMiracleVideoTimer = undefined;
    }

    if (activeRemoteMiracleVideo) {
        try {
            activeRemoteMiracleVideo.pause();
            activeRemoteMiracleVideo.querySelectorAll("source").forEach((source) => {
                source.removeAttribute("src");
                source.removeAttribute("type");
            });
            activeRemoteMiracleVideo.removeAttribute("src");
            activeRemoteMiracleVideo.load();
        } catch {
            // 動画停止失敗は無視
        }
        activeRemoteMiracleVideo = null;
    }

    if (activeRemoteMiracleObjectUrls.length > 0) {
        revokeOfflineObjectUrls(activeRemoteMiracleObjectUrls);
        activeRemoteMiracleObjectUrls = [];
    }

    remoteMiracleVideoOverlay.innerHTML = "";
    remoteMiracleVideoOverlay.style.display = "none";
    activeRemoteMiracleVideoRankScore = -1;
    activeRemoteMiracleVideoLabel = "";
    if (isMobile && !isAppTerminated) {
        repairMobileBoardLayout(true);
        window.requestAnimationFrame(() => repairMobileBoardLayout(true));
        window.setTimeout(() => repairMobileBoardLayout(true), 160);
    }
}

function pauseRemoteMiracleVideo(): void {
    if (!activeRemoteMiracleVideo) return;
    try {
        activeRemoteMiracleVideo.pause();
    } catch {
        // 無視
    }
}

function resumeRemoteMiracleVideo(): void {
    if (!activeRemoteMiracleVideo) return;
    try {
        prepareRemoteVideoForSound(activeRemoteMiracleVideo, activeRemoteMiracleVideoVolume);
        const result = activeRemoteMiracleVideo.play();
        if (result && typeof result.catch === "function") {
            result.catch(() => {
                if (isMobile) showMobileVideoSoundRetryButton(activeRemoteMiracleVideo!, activeRemoteMiracleVideoVolume);
            });
        }
    } catch {
        if (isMobile) showMobileVideoSoundRetryButton(activeRemoteMiracleVideo, activeRemoteMiracleVideoVolume);
    }
}


function isIOSLikeDevice(): boolean {
    return isIOSLikeDeviceBase(navigator);
}

function hideMobileVideoSoundRetryButton(): void {
    if (!mobileVideoSoundRetryButton) return;
    mobileVideoSoundRetryButton.remove();
    mobileVideoSoundRetryButton = null;
}

function prepareRemoteVideoForSound(video: HTMLVideoElement, volume = 0.45): void {
    prepareRemoteVideoForSoundBase(video, { soundEnabled, isMobile, mobileAudioUnlocked, volume });
}

async function unlockMobileAudio(showNotice = false): Promise<boolean> {
    if (mobileAudioUnlocked && toneReady) {
        if (showNotice) showSoftToast("音声はすでに有効です");
        return true;
    }

    soundEnabled = true;
    try {
        const Tone = await loadToneModule();
        await Tone.start();
        toneReady = true;
    } catch {
        // Tone.js が失敗しても、動画音声の解放は続けて試します。
    }

    try {
        const AudioCtx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
            || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
            const ctx = new AudioCtx();
            if (ctx.state === "suspended") await ctx.resume();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            gain.gain.value = 0.00001;
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start(0);
            oscillator.stop(ctx.currentTime + 0.03);
            window.setTimeout(() => ctx.close().catch(() => undefined), 120);
        }
    } catch {
        // 無音の短い音で解放できない環境もあるため無視します。
    }

    try {
        if (!mobileAudioPrimeElement) {
            mobileAudioPrimeElement = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==");
            mobileAudioPrimeElement.preload = "auto";
            mobileAudioPrimeElement.volume = 0.01;
        }
        mobileAudioPrimeElement.currentTime = 0;
        await mobileAudioPrimeElement.play();
        mobileAudioPrimeElement.pause();
        mobileAudioPrimeElement.currentTime = 0;
    } catch {
        // iOSのバージョンによってはここが失敗しても、次の動画タップで復帰できます。
    }

    mobileAudioUnlocked = true;
    updateSoundButton();
    applyRemoteMiracleVideoSoundState();

    if (showNotice) {
        showSoftToast(isIOSLikeDevice() ? "音声を有効にしました。動画演出時に音が出ない場合は、表示される音声ボタンを1回タップしてください。" : "音声を有効にしました");
        window.setTimeout(() => playUiSound("start"), 30);
    }

    return true;
}

function showMobileVideoSoundRetryButton(video: HTMLVideoElement | null, volume = 0.45): void {
    if (!video || !isMobile) return;
    if (mobileVideoSoundRetryButton) return;

    mobileVideoSoundRetryButton = document.createElement("button");
    mobileVideoSoundRetryButton.textContent = "音声を有効にして動画再生";
    mobileVideoSoundRetryButton.style.position = "fixed";
    mobileVideoSoundRetryButton.style.left = "50%";
    mobileVideoSoundRetryButton.style.bottom = "calc(24px + env(safe-area-inset-bottom, 0px))";
    mobileVideoSoundRetryButton.style.transform = "translateX(-50%)";
    mobileVideoSoundRetryButton.style.zIndex = "300000";
    mobileVideoSoundRetryButton.style.padding = "15px 20px";
    mobileVideoSoundRetryButton.style.borderRadius = "999px";
    mobileVideoSoundRetryButton.style.border = "2px solid rgba(255,255,255,0.92)";
    mobileVideoSoundRetryButton.style.background = "rgba(0,0,0,0.82)";
    mobileVideoSoundRetryButton.style.color = "#fff";
    mobileVideoSoundRetryButton.style.fontSize = "18px";
    mobileVideoSoundRetryButton.style.fontWeight = "1000";
    mobileVideoSoundRetryButton.style.boxShadow = "0 14px 36px rgba(0,0,0,0.45)";
    mobileVideoSoundRetryButton.style.cursor = "pointer";
    mobileVideoSoundRetryButton.style.pointerEvents = "auto";

    mobileVideoSoundRetryButton.onclick = async () => {
        try {
            await unlockMobileAudio(false);
            prepareRemoteVideoForSound(video, volume);
            video.currentTime = 0;
            await video.play();
            hideMobileVideoSoundRetryButton();

            if (remoteMiracleVideoTimer !== undefined) window.clearTimeout(remoteMiracleVideoTimer);
            remoteMiracleVideoTimer = window.setTimeout(() => {
                stopRemoteMiracleVideo();
            }, REMOTE_MIRACLE_VIDEO_DISPLAY_MS);
        } catch (error) {
            console.warn("[Miracle R2] video sound retry failed", error);
            showSoftToast("音声付き再生に失敗しました。iPhoneのマナーモードOFFと音量を確認してください。");
        }
    };

    const cleanupRetryButton = () => {
        if (video.ended || video.paused || video.error || video.readyState === HTMLMediaElement.HAVE_NOTHING) {
            hideMobileVideoSoundRetryButton();
        }
    };
    video.addEventListener("ended", hideMobileVideoSoundRetryButton, { once: true });
    video.addEventListener("error", hideMobileVideoSoundRetryButton, { once: true });
    video.addEventListener("emptied", hideMobileVideoSoundRetryButton, { once: true });
    video.addEventListener("abort", hideMobileVideoSoundRetryButton, { once: true });
    video.addEventListener("pause", cleanupRetryButton);

    document.body.appendChild(mobileVideoSoundRetryButton);
}

function getFreshRemoteVideoSourceUrl(url: string, asset: RemoteMiracleAsset): string {
    return getFreshRemoteVideoSourceUrlBase(url, asset, remoteMiracleAssetLoader.getLoadedAt());
}

function applyRemoteMiracleVideoSoundState(): void {
    if (!activeRemoteMiracleVideo) return;

    try {
        prepareRemoteVideoForSound(activeRemoteMiracleVideo, activeRemoteMiracleVideoVolume);
    } catch {
        // 無視
    }
}

async function playRemoteMiracleVideoAsset(asset: RemoteMiracleAsset, force = false): Promise<boolean> {
    if (isAppTerminated) return false;
    if (asset.kind !== "video") return false;
    if (!force && settings.simpleMode) return false;

    const usableSources = getUsableRemoteMiracleAssetSources(asset, force);
    if (usableSources.length === 0) return false;

    const nextRankScore = getRemoteAssetRankScore(asset);
    const nextLabel = getRemoteMiracleAssetLabel(asset);
    if (!shouldPlayRemoteMiracleVideo(nextRankScore, activeRemoteMiracleVideoRankScore, !!activeRemoteMiracleVideo && remoteMiracleVideoOverlay.style.display !== "none", force)) {
        recordAdminEvent({ type: "video_skip_lower_rank", at: Date.now(), label: nextLabel, rank: String(asset.rank ?? "common").toUpperCase(), detail: `active ${activeRemoteMiracleVideoLabel}` });
        return false;
    }

    const offlineResolvedSources = await resolveOfflineMiracleSources(usableSources);
    const playbackSources = offlineResolvedSources.sources.length > 0 ? offlineResolvedSources.sources : usableSources;

    stopRemoteMiracleVideo();

    const video = document.createElement("video");
    const remoteVideoVolume = getRemoteMiracleVideoVolume(asset);
    video.loop = false;
    prepareRemoteVideoForSound(video, remoteVideoVolume);
    video.preload = "auto";

    video.style.position = "absolute";
    video.style.left = "0";
    video.style.top = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.opacity = String(isMobile ? clamp(Number(asset.opacity ?? 0.72), 0.48, 0.82) : clamp(Number(asset.opacity ?? 0.92), 0.82, 1));
    video.style.filter = isMobile ? "none" : "saturate(1.35) contrast(1.18) brightness(1.08)";
    video.style.mixBlendMode = "normal";
    video.style.zIndex = "1";
    video.style.pointerEvents = "none";

    for (const sourceDef of playbackSources) {
        const source = document.createElement("source");
        source.src = getFreshRemoteVideoSourceUrl(sourceDef.url, asset);
        if (sourceDef.mimeType) source.type = sourceDef.mimeType;
        video.appendChild(source);
    }

    // iPhone/Safari はDOMに載っていない video を読み込み開始しない場合があるため、
    // 先にオーバーレイへ載せてから load/play を試します。
    remoteMiracleVideoOverlay.innerHTML = "";
    remoteMiracleVideoOverlay.appendChild(video);
    remoteMiracleVideoOverlay.style.display = "block";
    remoteMiracleVideoOverlay.style.background = isMobile ? "transparent" : "rgba(0,0,0,.52)";
    remoteMiracleVideoOverlay.style.zIndex = "2147483000";
    remoteMiracleVideoOverlay.style.opacity = "1";

    const ready = await new Promise<boolean>((resolve) => {
        let settled = false;
        let timer: number | undefined;

        const finish = (ok: boolean) => {
            if (settled) return;
            settled = true;

            if (timer !== undefined) {
                window.clearTimeout(timer);
            }

            video.removeEventListener("canplay", onReady);
            video.removeEventListener("loadeddata", onReady);
            video.removeEventListener("loadedmetadata", onReady);
            video.removeEventListener("error", onError);

            resolve(ok);
        };

        const onReady = () => finish(true);
        const onError = () => finish(false);

        video.addEventListener("canplay", onReady, { once: true });
        video.addEventListener("loadeddata", onReady, { once: true });
        video.addEventListener("loadedmetadata", onReady, { once: true });
        video.addEventListener("error", onError, { once: true });

        timer = window.setTimeout(() => {
            finish(false);
        }, 5000);

        try {
            video.load();
        } catch {
            finish(false);
        }
    });

    if (!ready) {
        revokeOfflineObjectUrls(offlineResolvedSources.objectUrls);
        console.warn("[Miracle R2] video file not found or not ready", asset);
        recordAdminEvent({ type: "video_fail", at: Date.now(), label: getRemoteMiracleAssetLabel(asset), rank: String(asset.rank ?? "common").toUpperCase(), detail: "not ready" });
        if (!isMobile && offlineResolvedSources.sources.length === 0) markRemoteMiracleAssetBad(asset);

        if (force) {
            showSoftToast("R2動画の読み込みに失敗しました。manifest.json のファイル名を確認してください");
        }

        hideMobileVideoSoundRetryButton();
        remoteMiracleVideoOverlay.innerHTML = "";
        remoteMiracleVideoOverlay.style.display = "none";
        return false;
    }

    video.addEventListener("ended", () => {
        if (!activeRemoteMiracleVideo || activeRemoteMiracleVideo !== video) return;
        hideMobileVideoSoundRetryButton();
        stopRemoteMiracleVideo();
    });

    video.addEventListener("error", () => {
        console.warn("[Miracle R2] video load failed", asset);
        recordAdminEvent({ type: "video_fail", at: Date.now(), label: getRemoteMiracleAssetLabel(asset), rank: String(asset.rank ?? "common").toUpperCase(), detail: "load error" });
        if (offlineResolvedSources.sources.length === 0) markRemoteMiracleAssetBad(asset);
        stopRemoteMiracleVideo();

        if (force) {
            showSoftToast("R2動画の読み込みに失敗しました。manifest.json のファイル名を確認してください");
        }
    }, { once: true });

    activeRemoteMiracleVideo = video;
    activeRemoteMiracleObjectUrls = offlineResolvedSources.objectUrls;
    activeRemoteMiracleVideoRankScore = nextRankScore;
    activeRemoteMiracleVideoLabel = nextLabel;
    activeRemoteMiracleVideoVolume = remoteVideoVolume;

    try {
        await video.play();
        recordAdminEvent({ type: "video_play", at: Date.now(), label: nextLabel, rank: String(asset.rank ?? "common").toUpperCase() });
        if (isMobile && soundEnabled && video.muted) showMobileVideoSoundRetryButton(video, remoteVideoVolume);

        if (remoteMiracleVideoTimer !== undefined) {
            window.clearTimeout(remoteMiracleVideoTimer);
        }

        remoteMiracleVideoTimer = window.setTimeout(() => {
            stopRemoteMiracleVideo();
        }, REMOTE_MIRACLE_VIDEO_DISPLAY_MS);

        return true;
    } catch (error) {
        console.warn("[Miracle R2] video autoplay/load failed", error);
        recordAdminEvent({ type: "video_fail", at: Date.now(), label: getRemoteMiracleAssetLabel(asset), rank: String(asset.rank ?? "common").toUpperCase(), detail: "autoplay failed" });

        // Chrome/Edge/PCでも、ユーザー操作から離れたタイミングでは音声付き autoplay が
        // ブロックされることがあります。映像だけは確実に見せるため、PC/スマホ共通で
        // ミュート再生へフォールバックします。
        try {
            video.muted = true;
            video.defaultMuted = true;
            video.setAttribute("muted", "");
            video.volume = 0;
            await video.play();
            recordAdminEvent({ type: "video_play", at: Date.now(), label: `${nextLabel} / muted autoplay fallback`, rank: String(asset.rank ?? "common").toUpperCase() });
            if (isMobile) showMobileVideoSoundRetryButton(video, remoteVideoVolume);
            if (remoteMiracleVideoTimer !== undefined) window.clearTimeout(remoteMiracleVideoTimer);
            remoteMiracleVideoTimer = window.setTimeout(() => {
                stopRemoteMiracleVideo();
            }, REMOTE_MIRACLE_VIDEO_DISPLAY_MS);
            return true;
        } catch {}

        if (!isMobile && offlineResolvedSources.sources.length === 0) markRemoteMiracleAssetBad(asset);
        stopRemoteMiracleVideo();

        if (force) {
            showSoftToast("R2動画を再生できませんでした。manifest.json のファイル名を確認してください");
        }

        return false;
    }

}

async function playFirstRunShowcaseVideo(): Promise<void> {
    if (isAppTerminated || settings.simpleMode) return;
    const assets = await loadRemoteMiracleAssets();
    const videos = assets.filter((asset) => asset.kind === "video" && isRemoteMiracleAssetUsable(asset));
    if (videos.length === 0) return;
    for (let i = 0; i < 4; i++) {
        const asset = weightedPickRemoteAsset(videos, appRandom);
        if (!asset) return;
        const played = await playRemoteMiracleVideoAsset(asset, false);
        if (played) {
            showSoftToast(t("初回サービス演出を再生しました", "First-run showcase video played"));
            return;
        }
    }
}

async function playRemoteMiracleVideo(def?: SpecialEventDef): Promise<void> {
    if (isAppTerminated) return;
    if (settings.simpleMode && !def) return;
    const allowMobileRuntimeVideo = isMobile && isStarted && !isFinished && !!def;
    if (!allowMobileRuntimeVideo && !settings.effectsEnabled && !shouldForceMiracleEffects(def)) return;

    // 通常レア演出側でも、管理者モードのR2動画確認と同じく
    // manifestを強制再読込して動画候補を取り直します。
    const assets = await loadRemoteMiracleAssets(true);
    const forceVideo = !!def;
    const videos = assets.filter((asset) => asset.kind === "video");
    if (videos.length === 0) {
        recordAdminEvent({ type: "video_fail", at: Date.now(), label: def?.label ?? "miracle", rank: def?.rank ?? "unknown", detail: "no video assets in manifest" });
        return;
    }

    const tried = new Set<string>();
    for (let i = 0; i < 10; i++) {
        const asset = selectRemoteMiracleVideoAsset(assets, def, isRemoteMiracleAssetUsable, appRandom) ?? weightedPickRemoteAsset(videos, appRandom) ?? videos[0];
        if (!asset) return;
        tried.add(asset.id || getRemoteMiracleAssetMainUrl(asset));

        const played = await playRemoteMiracleVideoAsset(asset, forceVideo);
        if (played) return;
    }

    // ランク一致・使用可能判定で落ちた場合の最終保険です。
    // 管理者モードで再生できる動画を通常演出側でも同じ再生関数へ流します。
    for (const asset of videos) {
        const key = asset.id || getRemoteMiracleAssetMainUrl(asset);
        if (tried.has(key)) continue;
        const played = await playRemoteMiracleVideoAsset(asset, true);
        if (played) return;
    }

    recordAdminEvent({ type: "video_fail", at: Date.now(), label: def?.label ?? "miracle", rank: def?.rank ?? "unknown", detail: "normal miracle video route exhausted" });
}

function hideMiracleOverlayNow(stopRemoteVideo = false): void {
    if (miracleOverlayTimer !== undefined) {
        window.clearTimeout(miracleOverlayTimer);
        miracleOverlayTimer = undefined;
    }

    miracleOverlayEndsAt = 0;
    miracleOverlayRemainingMs = 0;
    miracleOverlayFrozen = false;

    setMiracleOverlayAnimationPaused(false);

    miracleOverlay.style.display = "none";
    miracleOverlay.innerHTML = "";

    if (stopRemoteVideo) {
        stopRemoteMiracleVideo();
    }
}

function startMiracleOverlayTimer(durationMs: number): void {
    if (miracleOverlayTimer !== undefined) {
        window.clearTimeout(miracleOverlayTimer);
    }

    miracleOverlayEndsAt = Date.now() + durationMs;
    miracleOverlayRemainingMs = durationMs;
    miracleOverlayFrozen = false;

    miracleOverlayTimer = window.setTimeout(() => {
        hideMiracleOverlayNow();
    }, durationMs);
}

function pauseMiracleOverlayTimer(): void {
    if (miracleOverlay.style.display === "none") return;

    if (miracleOverlayTimer !== undefined) {
        miracleOverlayRemainingMs = Math.max(120, miracleOverlayEndsAt - Date.now());
        window.clearTimeout(miracleOverlayTimer);
        miracleOverlayTimer = undefined;
    }

    miracleOverlayFrozen = true;
    setMiracleOverlayAnimationPaused(true);

    pauseRemoteMiracleVideo();
}

function resumeMiracleOverlayTimer(): void {
    if (!miracleOverlayFrozen) return;

    miracleOverlayFrozen = false;
    setMiracleOverlayAnimationPaused(false);
    resumeRemoteMiracleVideo();

    const remainingMs = Math.max(120, miracleOverlayRemainingMs || 600);
    startMiracleOverlayTimer(remainingMs);
}

function clearMiracleAutoPause(): void {
    if (miraclePauseTimer !== undefined) {
        window.clearTimeout(miraclePauseTimer);
        miraclePauseTimer = undefined;
    }
    isMiraclePaused = false;
}

function finishMiraclePause(): void {
    isMiraclePaused = false;
    miraclePauseTimer = undefined;
    miraclePauseEndsAt = 0;
    miraclePauseRemainingMs = 0;

    if (isStarted && !isFinished && !isPaused) {
        Runner.run(runner, engine);
    }

    updateInfo();
}

function pauseForMiracle(def?: SpecialEventDef): void {
    if (!isStarted || isFinished || isMiraclePaused) return;

    const repeatedInRun = !!def && (repeatedMiracleRunCounts[def.kind] ?? 0) >= 2;
    const durationMs = getMiraclePauseDuration(def, repeatedInRun);

    isMiraclePaused = true;
    miraclePauseEndsAt = Date.now() + durationMs;
    miraclePauseRemainingMs = durationMs;

    if (miraclePauseTimer !== undefined) {
        window.clearTimeout(miraclePauseTimer);
    }

    Runner.stop(runner);
    updateInfo();

    miraclePauseTimer = window.setTimeout(() => {
        finishMiraclePause();
    }, durationMs);
}

function pauseMiraclePauseTimer(): void {
    if (miraclePauseTimer === undefined) return;

    miraclePauseRemainingMs = Math.max(120, miraclePauseEndsAt - Date.now());
    window.clearTimeout(miraclePauseTimer);
    miraclePauseTimer = undefined;
}

function resumeMiraclePauseTimer(): void {
    if (!isMiraclePaused) return;
    if (miraclePauseTimer !== undefined) return;

    const remainingMs = Math.max(120, miraclePauseRemainingMs || 600);
    miraclePauseEndsAt = Date.now() + remainingMs;

    miraclePauseTimer = window.setTimeout(() => {
        finishMiraclePause();
    }, remainingMs);
}

function togglePause(): void {
    recoverMobileLayoutIfBroken("pause-toggle");
    if (!isStarted || isFinished) return;

    registerPauseSecretTap?.();
    playUiSound?.(isPaused ? "resume" : "pause");

    if (isPaused) {
        // 再開
        isPaused = false;

        resumeMiracleOverlayTimer();
        resumeMiraclePauseTimer();

        if (!isMiraclePaused) {
            Runner.run(runner, engine);
        }
    } else {
        // 一時停止
        isPaused = true;

        // 奇跡演出中なら、演出タイマー・CSSアニメーションもその場で止める
        pauseMiracleOverlayTimer();
        pauseMiraclePauseTimer();

        Runner.stop(runner);
    }

    updateStopButton();
    updateInfo();
    scheduleViewportStabilize(false);
}

// ======================================================
// Bodies
// ======================================================

function createWallsAndFloor(): Matter.Body[] {
    return createWallsAndFloorBase(geometry);
}


function rollRarePin() {
    return rollRarePinBase({ simpleMode: settings.simpleMode, rarePinDefs: RARE_PIN_DEFS, random: appRandom });
}

function getRarePinDef(kind: RarePinKind | undefined) {
    return getRarePinDefBase(kind, RARE_PIN_DEFS);
}

function maybeTriggerMiracleOmen(force = false): void {
    if (isAppTerminated || !settings.effectsEnabled || settings.simpleMode || isPaused || isMiraclePaused || isFinished) return;
    if (isMobile && isStarted) return;
    const now = Date.now();
    if (!force && now - lastMiracleOmenAt < MIRACLE_OMEN_MIN_INTERVAL_MS) return;
    if (!force && appRandom() > 0.00065 * getProbabilityScale() * Math.max(0.75, getEffectIntensity())) return;
    lastMiracleOmenAt = now;
    const messages = [
        t("予兆: ピンが一瞬だけざわついた", "Omen: the pins briefly trembled"),
        t("予兆: 確率の匂いが変わりました", "Omen: the smell of probability changed"),
        t("予兆: 研究所の明かりが少し落ちました", "Omen: the lab lights dimmed"),
        t("予兆: favicon が盤面の奥で光った気がします", "Omen: the favicon seemed to glow inside the board"),
        t("予兆: 何か来るかもしれません", "Omen: something may be coming"),
    ];
    lastOmenText = messages[Math.floor(appRandom() * messages.length)] ?? messages[0];
    maybeShowCommentary(`実況「${lastOmenText}」`, true);
    addFloatingText(lastOmenText.replace(/^予兆: /, ""), geometry.width / 2, 72 * geometry.scale, "#facc15");
    if (settings.cameraShakeEnabled) triggerCameraShake(4 * geometry.scale, 220);
    const oldFilter = gameArea.style.filter;
    gameArea.style.filter = `${oldFilter ? oldFilter + " " : ""}brightness(.92) saturate(1.25)`;
    window.setTimeout(() => {
        if (!isAppTerminated) gameArea.style.filter = oldFilter;
    }, MIRACLE_OMEN_DISPLAY_MS);
    updateTutorialMissions();
}

function generateResearchMemoHtml(): string {
    return buildResearchMemoHtmlBase({
        elapsed: formatElapsedTime((targetReachedTime ?? endTime ?? Date.now()) - startTime),
        finishedCount,
        discardedCount,
        labels,
        binCounts,
        bestMiracle: miracleLogs[0],
        lastOmenText,
        rarePinSummary: RARE_PIN_DEFS.map((x) => `${x.label}${rarePinTouchCount[x.kind] ?? 0}`).join(" / "),
        pachinkoStartHits: pachinkoYakumonoHitCount.start,
        pachinkoCenterHits: pachinkoYakumonoHitCount.center,
        pachinkoPremiumHits: pachinkoYakumonoHitCount.premium,
        pachinkoJackpotCount,
        discoveredCount: SPECIAL_EVENT_DEFS.filter((d) => (savedRecords.discovered[d.kind] ?? 0) + (specialCreated[d.kind] ?? 0) > 0).length,
        specialEventCount: SPECIAL_EVENT_DEFS.length,
    });
}

function terminateExperimentSafely(): void {
    recordAdminEvent({ type: "safe_exit", at: Date.now(), count: finishedCount, targetCount: settings.targetCount });
    if (isAppTerminated) return;
    isAppTerminated = true;
    userProfile.totalSafeStops += 1;
    saveUserProfile();
    isPaused = true;
    isStarted = false;
    isFinished = true;
scheduleViewportStabilize(false);
    try { Runner.stop(runner); } catch {}
    stopRenderLoop();
    try { Engine.clear(engine); } catch {}
    try { Composite.clear(engine.world, false); } catch {}
    for (const timer of [miracleOverlayTimer, miraclePauseTimer, subtitleTimer, comboTimer, rareBackgroundTimer, lifeQuoteOverlayTimer, commentaryTimer, toastTimer, resizeTimer]) {
        if (timer !== undefined) window.clearTimeout(timer);
    }
    stopRemoteMiracleVideo();
    miracleOverlay.style.display = "none";
    celebrationOverlay.style.display = "none";
    milestoneOverlay.style.display = "none";
    commentaryOverlay.style.display = "none";
    activeEffectBadge.style.display = "none";
    recentMiracleMini.style.display = "none";
    tutorialMissionPanel.style.display = "none";
    researchProgressPanel.style.display = "none";
    updateStopButton();
    updateInfo();
    resultOverlay.innerHTML = getSafeStopResultHtml({
        isMobile,
        researchMemoHtml: generateResearchMemoHtml(),
    });
    resultOverlay.style.display = "flex";
    document.getElementById("safe-close-result-button")!.onclick = () => closeFinalResult();
    showSoftToast(t("安全停止しました", "Safely stopped"));
}

function pickRandomPachinkoNailPattern(): string {
    return pickRandomPachinkoNailPatternWithRandom(appRandom);
}

function getPachinkoPinOffset(pattern: string, row: number, col: number, rowCount: number, colCount: number, baseX: number, y: number): { x: number; y: number } {
    return getPachinkoPinOffsetForGeometry(pattern, row, col, rowCount, colCount, baseX, y, geometry);
}

function createPachinkoNailGate(cx: number, cy: number, spread: number, angleOpen: number, length: number): Matter.Body[] {
    return createPachinkoNailGateBase({ cx, cy, spread, angleOpen, length, geometry });
}

function createPins(): Matter.Body[] {
    return createPinsBase({
        geometry,
        pinRows: settings.pinRows,
        pattern: currentPachinkoNailPattern || "standard",
        rollRarePin,
        getPachinkoPinOffset,
        random: appRandom,
    });
}

function createDividers(): Matter.Body[] {
    return createDividersBase(geometry);
}

function createPachinkoYakumonoSensors(): Matter.Body[] {
    return createPachinkoYakumonoSensorsBase({ geometry, defs: PACHINKO_YAKUMONO_DEFS });
}

function getPachinkoYakumonoDef(kind: PachinkoYakumonoKind): PachinkoYakumonoDef {
    return getPachinkoYakumonoDefBase(kind, PACHINKO_YAKUMONO_DEFS);
}

function createDropPlugin(kind: DropKind, x: number, y: number, radius: number, extras: Record<string, unknown> = {}): Record<string, unknown> {
    return createDropPluginBase(kind, x, y, radius, extras);
}

function createRandomShapeBody(x: number, y: number, radius: number, renderOptions: any): Matter.Body {
    return createRandomShapeBodyBase({ x, y, radius, renderOptions, random: appRandom });
}

function createHeartBody(x: number, y: number, radius: number, renderOptions: any): Matter.Body {
    return createHeartBodyBase(x, y, radius, renderOptions);
}

function createSymbolBody(x: number, y: number, radius: number, kind: DropKind, fillStyle: string, symbol: string, label: string): Matter.Body {
    return createSymbolBodyBase({ x, y, radius, kind, fillStyle, symbol, label, geometry });
}

function createTinyFragment(x: number, y: number, baseRadius: number, color: string): Matter.Body {
    return createTinyFragmentBase({ x, y, baseRadius, color, geometry, random: appRandom });
}

function explodeStuckDrop(body: Matter.Body): void {
    const plugin = (body as any).plugin;
    const originalRadius = plugin?.originalRadius ?? body.circleRadius ?? geometry.ballRadius;
    const kind = plugin?.kind ?? "unknown";
    const color = (body.render as any)?.fillStyle ?? randomColor();

    if (!settings.simpleMode && !isMobileStableRuntime()) {
        const label = kind === "giant" ? "巨大玉 分裂" : kind === "shape" ? "図形 分裂" : "詰まり分裂";
        addFloatingText(label, body.position.x, body.position.y - 20 * geometry.scale, "#ff66aa");
        triggerCameraShake(12 * geometry.scale, 280);
    }
    if (settings.simpleMode) return;

    const fragmentCount = kind === "giant" ? 28 : 16 + Math.floor(appRandom() * 10);
    for (let i = 0; i < fragmentCount; i++) Composite.add(engine.world, createTinyFragment(body.position.x + (appRandom() - 0.5) * originalRadius, body.position.y + (appRandom() - 0.5) * originalRadius, originalRadius, color));
}

function getTimeBallThemeLabel(theme: TimeBallTheme): string {
    const labels: TimeBallThemeLabels = {
        morning: t("朝露観測モード", "Morning dew mode"),
        day: t("通常観測モード", "Standard observation mode"),
        evening: t("夕焼け反応モード", "Sunset reaction mode"),
        night: t("星夜観測モード", "Starry night mode"),
        midnight: t("深夜異常観測モード", "Midnight anomaly mode"),
    };
    return getTimeBallThemeLabelBase(theme, labels);
}

function getTimeBallSkinLabel(skin: TimeBallSkin): string {
    const labels: TimeBallSkinLabels = {
        normal: t("通常玉", "Normal ball"),
        drop: t("朝露のしずく", "Morning drop"),
        gloss: t("光沢サンプル球", "Gloss sample"),
        spark: t("薄暮の火種", "Sunset spark"),
        star: t("夜空の星片", "Star fragment"),
        moon: t("月影サンプル", "Moon sample"),
        darkShard: t("黒い欠片", "Dark shard"),
        swordShard: t("剣の破片", "Sword shard"),
        coin: t("金曜のコイン", "Friday coin"),
        heart: t("日曜のハート", "Sunday heart"),
        crown: t("土曜の小さな王冠", "Saturday crown"),
    };
    return getTimeBallSkinLabelBase(skin, labels);
}

function chooseTimeBallSkin(): TimeBallSkin {
    return chooseTimeBallSkinBase(settings.timeBallSkinsEnabled, appRandom);
}

function createDrop(): Matter.Body {
    const visibleLeft = geometry.binLeft + geometry.visibleStart * geometry.binWidth;
    const visibleRight = geometry.binLeft + (geometry.visibleStart + settings.binCount) * geometry.binWidth;
    const x = visibleLeft + appRandom() * (visibleRight - visibleLeft);
    const startY = clamp(35 * geometry.scale, 20, 80);
    maybeTriggerMiracleOmen(false);

    let kind: DropKind = "normal";
    let radius = geometry.ballRadius;
    let fillStyle = randomColor();
    let restitution = 0.8;
    let density = 0.001;
    let isShape = false;
    let isHeart = false;
    let symbol = "";
    let label = "";
    let normalTrait: NormalBallTraitDef | null = null;
    let timeBallSkin: TimeBallSkin = "normal";

    if (activeWorldMode === "poseidon") {
        fillStyle = ["#2a6dff", "#00a8ff", "#67d1ff"][Math.floor(appRandom() * 3)] ?? "#2a6dff";
        symbol = "海";
    } else if (activeWorldMode === "zeusu") {
        fillStyle = ["#ffd400", "#fff176", "#ffb300"][Math.floor(appRandom() * 3)] ?? "#ffd400";
        symbol = appRandom() < 0.55 ? "⚡" : "雷";
    } else if (activeWorldMode === "hadesu") {
        fillStyle = ["#090909", "#232323", "#3a3a3a"][Math.floor(appRandom() * 3)] ?? "#111";
        symbol = appRandom() < 0.45 ? "☠" : "死";
    } else if (activeWorldMode === "heart") {
        fillStyle = ["#ff5fb5", "#ff8ec9", "#ffb7de"][Math.floor(appRandom() * 3)] ?? "#ff5fb5";
        symbol = "♥";
    } else if (activeWorldMode === "nekochan") {
        fillStyle = ["#ffb36b", "#ffd7b0", "#ffc18d"][Math.floor(appRandom() * 3)] ?? "#ffb36b";
        symbol = appRandom() < 0.5 ? "猫" : "🐾";
    }

    if (giantStock > 0) {
        giantStock--;
        kind = "giant";
        radius = geometry.ballRadius * 2.4;
        fillStyle = "#1f2430";
        restitution = 0.95;
        density = 0.0028;
        giantCreated++;
    } else {
        // パチンコ仕様: 玉生成時点では基本的に通常玉です。
        // レア演出・特殊玉化の抽選は、役物センサーを通過した瞬間だけ行います。
        const shapeRoll = appRandom();
        if (shapeRoll < SHAPE_RATE * 0.18 * getProbabilityScale()) { kind = "shape"; radius = geometry.ballRadius * clamp(0.85 + appRandom() * 0.35, 0.85, 1.2); fillStyle = randomColor(); isShape = true; shapeCreated++; }
        else {
            const rareRoll = appRandom();
            if (rareRoll < RAINBOW_RATE * 0.18 * getProbabilityScale()) { kind = "rainbow"; radius = geometry.ballRadius * 1.55; fillStyle = "hsl(295, 100%, 70%)"; restitution = 1.0; density = 0.0016; rainbowCreated++; }
            else if (rareRoll < (RAINBOW_RATE + GOLD_RATE) * 0.18 * getProbabilityScale()) { kind = "gold"; radius = geometry.ballRadius * 1.3; fillStyle = "#ffd700"; restitution = 0.92; density = 0.0014; goldCreated++; }
        }
    }
    if (kind === "normal" && settings.normalBallTraitsEnabled) {
        normalTrait = rollNormalBallTrait();
        if (normalTrait) {
            radius *= normalTrait.radiusScale;
            restitution = normalTrait.restitution;
            density = normalTrait.density;
        }
    }
    if (kind === "normal") {
        timeBallSkin = chooseTimeBallSkin();
        fillStyle = getTimeBallSkinFillStyle(timeBallSkin, fillStyle);
    }

    const renderOptions: any = { fillStyle, strokeStyle: normalTrait?.strokeStyle ?? "rgba(255,255,255,0.85)", lineWidth: kind === "normal" ? (normalTrait ? 2.5 * geometry.scale : 1 * geometry.scale) : 3 * geometry.scale };
    if (kind === "normal" && timeBallSkin !== "normal") {
        renderOptions.fillStyle = "rgba(255,255,255,0.10)";
        renderOptions.strokeStyle = "rgba(255,255,255,0.32)";
    }
    if (normalTrait?.kind === "ghost") renderOptions.opacity = 0.42;
    if (kind === "gold") { renderOptions.strokeStyle = "#fff4a8"; renderOptions.lineWidth = 3 * geometry.scale; }
    if (kind === "rainbow") { renderOptions.strokeStyle = "#ffffff"; renderOptions.lineWidth = 3 * geometry.scale; }
    if (kind === "heart") { renderOptions.fillStyle = "#ff69b4"; renderOptions.strokeStyle = "#ffe0f0"; renderOptions.lineWidth = 4 * geometry.scale; }
    if (kind === "blackSun") { renderOptions.strokeStyle = "#ff0044"; renderOptions.lineWidth = 5 * geometry.scale; }
    if (kind === "timeRift") { renderOptions.strokeStyle = "#00e5ff"; renderOptions.lineWidth = 5 * geometry.scale; }
    if (kind === "labExplosion") { renderOptions.strokeStyle = "#fff3b0"; renderOptions.lineWidth = 6 * geometry.scale; }
    if (kind === "cosmicEgg") { renderOptions.strokeStyle = "#ffffff"; renderOptions.lineWidth = 6 * geometry.scale; }
    if (activeWorldMode === "poseidon") { renderOptions.strokeStyle = "#d7f2ff"; renderOptions.lineWidth = 3.5 * geometry.scale; }
    if (activeWorldMode === "zeusu") { renderOptions.strokeStyle = "#fff7b0"; renderOptions.lineWidth = 3.8 * geometry.scale; }
    if (activeWorldMode === "hadesu") { renderOptions.strokeStyle = "#ff4a4a"; renderOptions.lineWidth = 3.8 * geometry.scale; }
    if (activeWorldMode === "heart") { renderOptions.strokeStyle = "#ffe3f2"; renderOptions.lineWidth = 3.8 * geometry.scale; }
    if (activeWorldMode === "nekochan") { renderOptions.strokeStyle = "#fff3e4"; renderOptions.lineWidth = 3.8 * geometry.scale; }

    let body: Matter.Body;
    if (findSpecialDef(kind) && kind !== "heart") body = createSymbolBody(x, startY, radius, kind, fillStyle, symbol, label);
    else if (isHeart) body = createHeartBody(x, startY, radius, renderOptions);
    else if (isShape) body = createRandomShapeBody(x, startY, radius, renderOptions);
    else {
        body = Bodies.circle(x, startY, radius, { restitution, friction: 0.01, frictionAir: normalTrait?.frictionAir ?? 0.002, density, render: renderOptions });
        (body as any).plugin = createDropPlugin(kind, x, startY, radius, { ...(normalTrait ? { traitKind: normalTrait.kind, traitLabel: normalTrait.label, traitMark: normalTrait.mark } : {}), timeBallSkin, timeBallSkinLabel: getTimeBallSkinLabel(timeBallSkin) });
    }

    const traitVX = normalTrait?.kind === "sprinter" ? (appRandom() < 0.5 ? -1 : 1) * (3.2 + appRandom() * 2.4) * geometry.scale : 0;
    Body.setVelocity(body, { x: (appRandom() - 0.5) * 2 * geometry.scale + traitVX, y: normalTrait?.kind === "sleepy" ? -0.6 * geometry.scale : 0 });
    Body.setAngularVelocity(body, normalTrait?.kind === "spinner" ? (appRandom() < 0.5 ? -1 : 1) * (0.55 + appRandom() * 0.35) : (appRandom() - 0.5) * 0.22);

    if (normalTrait && appRandom() < 0.08) {
        addFloatingText(normalTrait.label, x, 78 * geometry.scale, normalTrait.strokeStyle);
        maybeShowCommentary(`実況「${normalTrait.label} が混ざりました」`);
    }
    if (timeBallSkin !== "normal" && appRandom() < 0.025) {
        addFloatingText(getTimeBallSkinLabel(timeBallSkin), x, 74 * geometry.scale, getTimeBallSkinFillStyle(timeBallSkin, fillStyle));
    }
    if (kind === "gold") addFloatingText("金玉投入", x, 80 * geometry.scale, "#d89b00");
    if (kind === "rainbow") { addFloatingText("虹玉投入", x, 80 * geometry.scale, "#b44cff"); triggerCameraShake(5 * geometry.scale, 180); }
    if (kind === "giant") { addFloatingText("巨大玉投入", x, 90 * geometry.scale, "#111111"); triggerCameraShake(10 * geometry.scale, 260); }
    if (kind === "shape") { addFloatingText(`${(body as any).plugin?.shapeName ?? "謎図形"} 投入`, x, 80 * geometry.scale, fillStyle); triggerCameraShake(5 * geometry.scale, 140); }
    if (kind === "heart") { addFloatingText("奇跡の桃色ハート", x, 85 * geometry.scale, "#ff69b4"); triggerCameraShake(18 * geometry.scale, 420); }
    if (findSpecialDef(kind)) { addFloatingText(`${label} 投入`, x, 85 * geometry.scale, fillStyle); triggerCameraShake(kind === "cosmicEgg" || kind === "labExplosion" ? 34 * geometry.scale : 18 * geometry.scale, kind === "cosmicEgg" || kind === "labExplosion" ? 900 : 400); }

    activeDropCount++;
    return body;
}

// ======================================================
// Interaction / effects / libraries
// ======================================================

function screenToWorld(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * geometry.width, y: ((event.clientY - rect.top) / rect.height) * geometry.height };
}

function activateNearestPin(event: PointerEvent): void {
    const point = screenToWorld(event);
    let nearest: Matter.Body | null = null;
    let nearestDistance = Infinity;
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isPin) continue;
        const distance = Math.hypot(body.position.x - point.x, body.position.y - point.y);
        if (distance < nearestDistance) { nearest = body; nearestDistance = distance; }
    }
    const tapRadius = Math.max(42 * geometry.scale, geometry.pinRadius * 5.4);
    if (!nearest || nearestDistance > tapRadius) return;

    const plugin = (nearest as any).plugin;
    plugin.baseX = plugin.baseX ?? nearest.position.x;
    plugin.baseY = plugin.baseY ?? nearest.position.y;
    const dir = nearest.position.x >= point.x ? 1 : -1;
    plugin.wiggleFrames = 132;
    plugin.wiggleTotal = 132;
    plugin.wigglePower = 2.35;
    plugin.bendDirection = dir;

    for (const body of engine.world.bodies) {
        const p = (body as any).plugin;
        if (!p?.isDrop) continue;
        const distance = Math.hypot(body.position.x - nearest.position.x, body.position.y - nearest.position.y);
        if (distance < tapRadius * 3) {
            Body.setVelocity(body, { x: (body.position.x - nearest.position.x) * 0.12 + (appRandom() - 0.5) * 12 * geometry.scale, y: -7 * geometry.scale });
            Body.setAngularVelocity(body, (appRandom() - 0.5) * 0.82);
        }
    }

    addFloatingText("ゴムピンしなり", nearest.position.x, nearest.position.y - 22 * geometry.scale, "#facc15");
    vibrateOnMobile([20, 18, 35]);
    triggerCameraShake(9 * geometry.scale, 220);
}

function updatePinWiggles(): void {
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isPin || !plugin.wiggleFrames) continue;
        plugin.baseX = plugin.baseX ?? body.position.x;
        plugin.baseY = plugin.baseY ?? body.position.y;
        const total = Math.max(1, plugin.wiggleTotal ?? 96);
        if (!plugin.wiggleTotal) plugin.wiggleTotal = total;
        const t = plugin.wiggleFrames;
        const progress = clamp(t / total, 0, 1);
        const phase = (1 - progress) * Math.PI;
        const elastic = Math.sin(phase * 8.5) * progress;
        const dir = Number(plugin.bendDirection ?? (body.id % 2 === 0 ? 1 : -1));
        const power = (plugin.wigglePower ?? 1) * Math.max(10 * geometry.scale, geometry.pinRadius * 1.38);
        plugin.bendAmount = clamp(elastic * dir * 5.2, -5.2, 5.2);
        Body.setPosition(body, {
            x: plugin.baseX + elastic * dir * power,
            y: plugin.baseY + Math.sin(phase * 5.5) * progress * power * 0.18,
        });
        plugin.wiggleFrames--;
        if (plugin.wiggleFrames <= 0) {
            Body.setPosition(body, { x: plugin.baseX, y: plugin.baseY });
            plugin.wiggleFrames = 0;
            plugin.wiggleTotal = 0;
            plugin.bendAmount = 0;
        }
    }
}

function addFloatingText(text: string, x: number, y: number, color: string): void {
    if (settings.simpleMode) return;
    floatingTexts.push({ text, x, y, life: 60, maxLife: 60, color });
}

function rollNormalBallTrait(): NormalBallTraitDef | null {
    const scale = settings.probabilityMode === "festival" ? 1.25 : settings.probabilityMode === "hell" ? 0.75 : 1;
    let roll = appRandom();
    for (const trait of NORMAL_BALL_TRAITS) {
        roll -= trait.rate * scale;
        if (roll <= 0) return trait;
    }
    return null;
}

function getNormalTraitSummaryHtml(): string {
    return getNormalTraitSummaryHtmlBase(NORMAL_BALL_TRAITS);
}

function maybeShowCommentary(text?: string, force = false): void {
    if (!settings.effectsEnabled || !settings.commentaryEnabled || settings.simpleMode) return;
    if (!force && (!isStarted || isFinished || isPaused || isMiraclePaused)) return;
    const now = Date.now();
    if (!force && now - lastCommentaryAt < COMMENTARY_MIN_INTERVAL_MS) return;
    const commentRate = settings.effectMode === "quiet" ? 0.006 : settings.effectMode === "flashy" ? 0.028 : settings.effectMode === "recording" ? 0.018 : 0.012;
    if (!force && appRandom() > commentRate) return;
    const candidates = [
        "研究員A「いまの玉、ちょっと性格ありますね」",
        "観測装置「乱数の温度は正常です。たぶん。」",
        "研究員B「捨て区間の顔色をうかがっています」",
        "実況「盤面が静かにざわついています」",
        "ねこ研究員「にゃーん。記録しました。」",
        "観測装置「奇跡濃度、微量に上昇」",
        "研究員A「この実験、見た目よりだいぶ騒がしいです」",
        "実況「通常玉にも妙な個体差が出ています」",
    ];
    const message = text || candidates[Math.floor(appRandom() * candidates.length)] || candidates[0];
    lastCommentaryAt = now;
    if (commentaryTimer !== undefined) window.clearTimeout(commentaryTimer);
    commentaryOverlay.innerHTML = getCommentaryLineHtml({ message, isMobile, displayMs: COMMENTARY_DISPLAY_MS });
    commentaryOverlay.style.display = "block";
    const line = commentaryOverlay.firstElementChild as HTMLElement | null;
    if (line) {
        window.requestAnimationFrame(() => {
            line.style.transform = "translateX(calc(-100vw - 100% - 32px))";
        });
    }
    commentaryTimer = window.setTimeout(() => {
        commentaryOverlay.style.display = "none";
        commentaryOverlay.innerHTML = "";
    }, COMMENTARY_DISPLAY_MS + 300);
}

function triggerCameraShake(power: number, durationMs: number, force = false): void {
    if ((!settings.effectsEnabled && !force) || settings.simpleMode) return;
    if (!settings.cameraShakeEnabled) return;
    const intensity = getEffectIntensity(force);
    shakePower = Math.max(shakePower, power * intensity);
    shakeUntil = Math.max(shakeUntil, Date.now() + durationMs);
}

function updateCameraShake(): void {
    if (settings.simpleMode || !settings.cameraShakeEnabled) { canvas.style.transform = "translate(0,0)"; shakePower = 0; return; }
    const now = Date.now();
    if (now < shakeUntil) {
        const ratio = (shakeUntil - now) / 180;
        const power = shakePower * clamp(ratio, 0, 1);
        canvas.style.transform = `translate(${(appRandom() - 0.5) * power}px, ${(appRandom() - 0.5) * power}px)`;
    } else { canvas.style.transform = "translate(0,0)"; shakePower = 0; }
}

function showMilestone(text: string): void {
    // 黄色の小さい達成POPUPは画面中央の演出と重なるため非表示にする。
    // CSVコピーなどの軽い通知も、邪魔にならないようにここでは表示しない。
    void text;
}

function pickCelebrationEffect(): { name: string; icon: string } {
    return pickCelebrationEffectBase(appRandom);
}

function showFullScreenCelebration(count: number): void {
    if (settings.simpleMode) return;
    if (isMobile && isStarted && !isFinished) return;
    vibrateOnMobile([35, 20, 35]);
    fireConfetti("normal");
    const effect = pickCelebrationEffect();
    celebrationOverlay.innerHTML = getFullScreenCelebrationHtml({
        count,
        background: randomRgba(0.45),
        effect,
    });
    celebrationOverlay.style.display = "flex";
    window.setTimeout(() => { celebrationOverlay.style.display = "none"; celebrationOverlay.innerHTML = ""; }, 2100);
}


function getMiracleIconHtml(kind: DropKind, fallbackSymbol: string): string {
    return getMiracleIconHtmlBase(kind, fallbackSymbol, findSpecialDef(kind));
}

async function playAnimeMiracleEffect(def?: SpecialEventDef): Promise<void> {
    if (settings.simpleMode) return;
    const ok = await ensureAnimeReady();
    if (!ok) return;
    const anime = animeApi;
    if (!anime) return;
    const overlayCard = miracleOverlay.firstElementChild as HTMLElement | null;
    if (!overlayCard) return;
    const strength = def?.rank === "GOD" ? 1.35 : def?.rank === "EX" ? 1.18 : 1;
    const isRepeatedQuickRare = !!def && (repeatedMiracleRunCounts[def.kind] ?? 0) >= 2 && (def.rank === "SR" || def.rank === "SSR");
    const isQuickRare = isRepeatedQuickRare || def?.rank === "SR" || def?.rank === "SSR";
    anime.remove([overlayCard, canvas, gameArea]);
    if (!isMobile) {
        anime({
            targets: gameArea,
            scale: [1, 1.018 * strength, 1],
            duration: isRepeatedQuickRare ? 180 : isQuickRare ? 360 : 900,
            easing: "easeOutQuad",
        });
    }
    const timeline = anime.timeline({ easing: "easeOutExpo" })
        .add({
            targets: overlayCard,
            scale: [0.72, 1.06, 1],
            opacity: [0, 1],
            rotate: [-2.2 * strength, 0],
            duration: isRepeatedQuickRare ? 130 : isQuickRare ? 240 : 620,
        }, 0)
        .add({
            targets: overlayCard,
            translateY: [0, -8 * strength, 0],
            duration: isRepeatedQuickRare ? 180 : isQuickRare ? 320 : 1200,
            easing: "easeInOutSine",
        }, isQuickRare ? 80 : 140);
    if (!isMobile) {
        timeline.add({
            targets: canvas,
            scale: [1, 1.028 * strength, 1],
            duration: isRepeatedQuickRare ? 180 : isQuickRare ? 320 : 780,
            easing: "easeOutBack",
        }, 0);
    }
    if (isMobile) applyMobileGameCanvasLayout();
}


function speakLifeQuoteEvent(): void {
    const text = "ふふっ、自分の人生で言葉に出来ない程の感動する感情に出会えたらどんに辛いことがあってもまたこの人生をやりたいと思えるらしい";
    if (lifeQuoteOverlayTimer !== undefined) window.clearTimeout(lifeQuoteOverlayTimer);
    subtitleOverlay.innerHTML = getLifeQuoteHtml({ text, isMobile });
    subtitleOverlay.style.display = "block";
    subtitleOverlay.style.left = "50%";
    subtitleOverlay.style.right = "";
    subtitleOverlay.style.bottom = "50%";
    subtitleOverlay.style.transform = "translate(-50%, 50%)";
    subtitleOverlay.style.width = "min(96vw, 1200px)";
    subtitleOverlay.style.maxWidth = "min(96vw, 1200px)";
    subtitleOverlay.style.padding = isMobile ? "22px 18px" : "28px 30px";
    subtitleOverlay.style.borderRadius = "24px";
    subtitleOverlay.style.background = "rgba(0,0,0,.72)";

    let duration = 8800;
    try {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = "ja-JP";
            utter.rate = 0.95;
            utter.pitch = 1.55;
            utter.volume = soundEnabled ? 1 : 0.8;
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find((v) => /ja-JP/i.test(v.lang) && /(female|kyoko|haruka|sakura|Google 日本語|Microsoft.*Haruka)/i.test(v.name))
                || voices.find((v) => /ja-JP/i.test(v.lang));
            if (preferred) utter.voice = preferred;
            utter.onend = () => {
                subtitleOverlay.style.display = "none";
                subtitleOverlay.textContent = "";
                subtitleOverlay.style.bottom = isMobile ? "104px" : "28px";
                subtitleOverlay.style.transform = "translateX(-50%)";
                subtitleOverlay.style.width = "";
                subtitleOverlay.style.maxWidth = "min(92vw, 960px)";
                subtitleOverlay.style.padding = isMobile ? "12px 18px" : "10px 18px";
            };
            window.speechSynthesis.speak(utter);
            duration = 11000;
        }
    } catch {}
    lifeQuoteOverlayTimer = window.setTimeout(() => {
        subtitleOverlay.style.display = "none";
        subtitleOverlay.textContent = "";
        subtitleOverlay.style.bottom = isMobile ? "104px" : "28px";
        subtitleOverlay.style.transform = "translateX(-50%)";
        subtitleOverlay.style.width = "";
        subtitleOverlay.style.maxWidth = "min(92vw, 960px)";
        subtitleOverlay.style.padding = isMobile ? "12px 18px" : "10px 18px";
    }, duration);
}

function showMiracle(kind: DropKind, symbol: string, probabilityText: string, feelingText: string): void {
    const def = findSpecialDef(kind);
    const forceRareEffect = shouldForceMiracleEffects(def) || adminForceNextMiracleEffect;
    adminForceNextMiracleEffect = false;
    const shouldPlayEffects = settings.effectsEnabled || forceRareEffect;
    const suppressMobileFullScreenEffects = isMobile && isStarted && !isFinished;
    if (def) {
        if (shouldPlayEffects && !suppressMobileFullScreenEffects) pauseForMiracle(def);
        updateMiracleCombo();
        addMiracleLog(def);
        recordMiracleForChains(def.kind);
        tryTriggerMiracleChains();
        const subtitle = `${def.label} ${t("発生", "appeared")} / [${def.rank}] ${formatProbability(def.denominator)}`;
        if (kind === "lifeQuoteMode" && !suppressMobileFullScreenEffects) speakLifeQuoteEvent();
        else setSubtitle(subtitle);
        saveMiracleClip(def, subtitle);
        if (shouldPlayEffects && !suppressMobileFullScreenEffects) applyRareBackground(kind);
        if (!suppressMobileFullScreenEffects && shouldTriggerRareBoardCatastrophe(def)) triggerRareBoardCatastrophe(def);
        updateRecentMiracleMini();
        updateStatusMiniOverlays();
    }
    if (suppressMobileFullScreenEffects && def) {
        vibrateOnMobile(def.rank === "GOD" ? [70, 35, 110] : def.rank === "EX" ? [50, 28, 80] : [34, 22, 48]);
        addFloatingText(`${def.label} 発生`, geometry.width / 2, geometry.height * 0.18, def.fillStyle);
        playSpecialSound(kind);
        void playRemoteMiracleVideo(def);
        return;
    }
    if (!shouldPlayEffects) return;
    triggerScreenFlash(def?.soundMode ?? "miracle");
    vibrateOnMobile(def?.rank === "GOD" ? [90, 50, 160, 60, 220] : def?.rank === "EX" ? [70, 40, 120, 40, 140] : [55, 28, 80]);
    triggerCameraShake(def?.rank === "GOD" ? 46 * geometry.scale : def?.rank === "EX" ? 34 * geometry.scale : 18 * geometry.scale, def?.rank === "GOD" ? 1200 : def?.rank === "EX" ? 760 : 420, forceRareEffect);
    if (kind === "swordImpact") triggerSwordImpactEffect();

    // 動画演出は、シンプル/低スペック寄りでもレア演出が発生したら試行します。
    // 以前はこの下の simpleMode return により、PC通常演出側だけ動画に到達しないケースがありました。
    if (def) void playRemoteMiracleVideo(def);

    playSpecialSound(kind);

    if (settings.simpleMode) return;
    const repeatedInRun = !!def && (repeatedMiracleRunCounts[def.kind] ?? 0) >= 2;
    const overlayDurationMs = getMiraclePauseDuration(def, repeatedInRun);
    const overlayDurationSec = Math.max(0.24, overlayDurationMs / 1000);
    miracleOverlay.innerHTML = getMiracleOverlayHtml({
        iconHtml: getMiracleIconHtml(kind, symbol),
        label: def?.label ?? "奇跡",
        probabilityText,
        feelingText,
        comboText: miracleCombo >= 2 ? `<div style="margin-top:10px;font-size:clamp(20px,4vw,40px);font-weight:900;color:#ffe560;">${t("奇跡コンボ", "Miracle combo")} x${miracleCombo}</div>` : "",
        repeatedText: repeatedInRun && (def?.rank === "SR" || def?.rank === "SSR") ? `<div style="margin-top:8px;font-size:clamp(16px,3vw,26px);font-weight:900;color:#bbf7d0;">同じSR/SSRのため短縮演出</div>` : "",
        durationSec: overlayDurationSec,
    });
    if (miracleOverlayTimer !== undefined) {
        window.clearTimeout(miracleOverlayTimer);
        miracleOverlayTimer = undefined;
    }
    miracleOverlay.style.display = "flex";

    void playAnimeMiracleEffect(def);

    fireConfetti(kind === "blackSun" ? "black" : kind === "cosmicEgg" ? "cosmic" : "miracle", forceRareEffect);
    startMiracleOverlayTimer(overlayDurationMs + 120);
}

function getSoundVolume(base = -8): number {
    return getAdjustedSoundVolume(base, isMobile);
}

function playUiSound(kind: "start" | "pause" | "resume" | "open" | "close" | "tick" | "skill" | "time"): void {
    if (!soundEnabled || !toneReady || settings.simpleMode) return;
    try {
        playUiToneCue({
            toneModule,
            kind,
            volume: getSoundVolume(kind === "tick" ? -18 : -14),
        });
    } catch {}
}

function playSecretSound(): void {
    if (!soundEnabled || !toneReady || settings.simpleMode) return;
    try {
        playSecretToneCue({
            toneModule,
            volume: getSoundVolume(-9),
        });
    } catch {}
}
function updateSoundButton(): void {
    soundButton.textContent = soundEnabled ? t("音: ON", "Sound: ON") : t("音: OFF", "Sound: OFF");
}


async function enableSound(showNotice = true): Promise<void> {
    try {
        const Tone = await loadToneModule();
        await Tone.start();
        toneReady = true;
        mobileAudioUnlocked = true;
        soundEnabled = true;
        updateSoundButton();
        applyRemoteMiracleVideoSoundState();

        if (showNotice) {
            showMilestone(t("音ON", "Sound ON"));
            window.setTimeout(() => playUiSound("start"), 30);
        }
    } catch {
        soundButton.textContent = t("音: 読込失敗", "Sound: Load failed");
    }
}

async function toggleSound(): Promise<void> {
    if (soundEnabled) {
        soundEnabled = false;
        updateSoundButton();
        applyRemoteMiracleVideoSoundState();
        showMilestone(t("音OFF", "Sound OFF"));
        showSoftToast(t("音をOFFにしました", "Sound disabled"));
        return;
    }

    soundEnabled = true;
    updateSoundButton();
    await enableSound(true);
    applyRemoteMiracleVideoSoundState();
    showSoftToast(t("音をONにしました", "Sound enabled"));
}

function getRareSoundFlavor(kind: DropKind): RareSoundFlavor {
    const def = findSpecialDef(kind);
    if (def?.rank === "GOD") return "god";
    if (def?.rank === "EX") return "ex";
    if (def?.rank === "UR") return "ur";
    return "normal";
}

async function playLocalRareAudio(flavor: RareSoundFlavor, repeatCount = 1): Promise<boolean> {
    const candidates = flavor === "god" ? LOCAL_GOD_AUDIO_FILES : LOCAL_RARE_AUDIO_FILES;
    if (!candidates.length) return false;
    let played = false;
    for (let i = 0; i < repeatCount; i++) {
        const src = candidates[Math.floor(Math.random() * candidates.length)];
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = flavor === 'god' ? 0.95 : 0.85;
        try {
            await audio.play();
            played = true;
            await new Promise<void>((resolve) => {
                const fallbackMs = flavor === 'god' ? 1850 : flavor === 'ex' ? 1450 : 1050;
                const timer = window.setTimeout(() => resolve(), fallbackMs);
                audio.addEventListener('ended', () => { window.clearTimeout(timer); resolve(); }, { once: true });
                audio.addEventListener('error', () => { window.clearTimeout(timer); resolve(); }, { once: true });
            });
        } catch {
            // synth fallback only
        }
    }
    return played;
}

async function ensureSpecialSoundTone(): Promise<any | null> {
    if (!soundEnabled) return null;
    try {
        const Tone = await loadToneModule();
        await Tone.start();
        try {
            const context = typeof Tone.getContext === "function" ? Tone.getContext() : null;
            const rawContext = context?.rawContext ?? context?._context ?? null;
            if (rawContext?.state === "suspended" && typeof rawContext.resume === "function") {
                await rawContext.resume();
            }
        } catch {
            // Tone.start() で復帰できていれば十分です。
        }
        toneReady = true;
        if (isMobile) mobileAudioUnlocked = true;
        applyRemoteMiracleVideoSoundState();
        return Tone;
    } catch {
        toneReady = false;
        return null;
    }
}

function playSpecialSound(kind: DropKind): void {
    void playSpecialSoundAsync(kind);
}

async function playSpecialSoundAsync(kind: DropKind): Promise<void> {
    if (!soundEnabled) return;
    try {
        const flavor = getRareSoundFlavor(kind);
        const repeatCount = flavor === "god" || flavor === "ex" ? 3 : 1;
        void playLocalRareAudio(flavor, repeatCount);
        const Tone = await ensureSpecialSoundTone();
        if (!Tone) return;
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: flavor === "god" ? "square8" : flavor === "ex" ? "sawtooth" : "triangle" },
            envelope: { attack: 0.005, decay: 0.14, sustain: 0.18, release: 0.35 },
        }).toDestination();
        synth.volume.value = getSoundVolume(flavor === "god" ? -5 : flavor === "ex" ? -7 : -9);
        const now = Tone.now();
        const cycleLength = flavor === "god" ? 1.55 : flavor === "ex" ? 1.12 : 0.52;
        for (let cycle = 0; cycle < repeatCount; cycle++) {
            const cycleAt = now + cycle * cycleLength;
            if (flavor === "god" || flavor === "ex") {
                const bass = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 4, envelope: { attack: 0.001, decay: 0.38, sustain: 0.02, release: 0.5 } }).toDestination();
                bass.volume.value = getSoundVolume(flavor === "god" ? -7 : -11);
                bass.triggerAttackRelease(flavor === "god" ? "C2" : "D2", "8n", cycleAt);
                window.setTimeout(() => bass.dispose(), Math.round((cycleLength + 0.75) * 1000));
            }
            const sequence = createRareSequence(flavor);
            for (const step of sequence) synth.triggerAttackRelease(step.note, step.duration, cycleAt + step.at);
            if (kind === "giant") synth.triggerAttackRelease("C2", "8n", cycleAt);
            if (kind === "blackSun" || kind === "cosmicEgg" || kind === "labExplosion") {
                const noise = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.01, decay: 0.28, sustain: 0 } }).toDestination();
                noise.volume.value = -12;
                noise.triggerAttackRelease("8n", cycleAt + 0.02);
                window.setTimeout(() => noise.dispose(), Math.round((cycleLength + 0.4) * 1000));
            }
        }
        window.setTimeout(() => synth.dispose(), Math.round((repeatCount * cycleLength + 1.0) * 1000));
    } catch {
        // 音は補助機能なので失敗しても止めない
    }
}

async function ensureConfetti(): Promise<boolean> {
    return true;
}

async function fireConfetti(mode: "normal" | "miracle" | "black" | "cosmic" = "normal", force = false): Promise<void> {
    if ((!settings.effectsEnabled && !force) || settings.simpleMode || !confettiEnabled) return;
    if (isMobile && isStarted && !isFinished) return;
    const ok = await ensureConfetti();
    if (!ok) return;
    const intensity = getEffectIntensity(force);
    await fireCanvasBurst(mode, intensity);
    if (force || mode !== "normal") void fireLibraryParticleBurst(mode === "cosmic" ? "gacha" : mode === "black" ? "magic" : "title");
}

async function togglePixiBackground(): Promise<void> {
    pixiEnabled = !pixiEnabled;
    pixiButton.textContent = pixiEnabled ? t("Pixi背景: ON", "Pixi BG: ON") : t("Pixi背景: OFF", "Pixi BG: OFF");
    showSoftToast(pixiEnabled ? t("Pixi背景をONにしました", "Pixi background enabled") : t("Pixi背景をOFFにしました", "Pixi background disabled"));
    if (pixiEnabled) {
        await initPixiBackground();
        pixiBackground?.setVisible(true);
    } else {
        pixiBackground?.setVisible(false);
    }
}

async function initPixiBackground(): Promise<void> {
    if (pixiReady) return;
    try {
        pixiBackground = await createPixiBackground(gameArea);
        pixiLayer.appendChild(pixiBackground.canvas);
        pixiBackground.setVisible(pixiEnabled);
        pixiReady = true;
    } catch {
        pixiEnabled = false;
        pixiButton.textContent = t("Pixi背景: 読込失敗", "Pixi BG: Load failed");
    }
}


// ======================================================
// Count / display / CSV
// ======================================================

function getBinIndex(x: number): number {
    const physicalIndex = Math.floor((x - geometry.binLeft) / geometry.binWidth);
    if (physicalIndex < geometry.visibleStart || physicalIndex >= geometry.visibleStart + settings.binCount) return -1;
    return physicalIndex - geometry.visibleStart;
}

function updateInfo(): void {
    const now = Date.now();
    const elapsedMs = isStarted ? (targetReachedTime ?? endTime ?? now) - startTime : 0;
    if (now - lastSpeedCheckTime >= 1000 && isStarted && !isPaused && !isMiraclePaused && !isFinished) {
        const diff = finishedCount - lastSpeedCheckFinishedCount;
        const diffSec = (now - lastSpeedCheckTime) / 1000;
        speedPerSecond = diff / diffSec;
        lastSpeedCheckTime = now;
        lastSpeedCheckFinishedCount = finishedCount;
    }
    const remain = Math.max(0, settings.targetCount - finishedCount);
    const eta = speedPerSecond > 0 ? formatElapsedTime((remain / speedPerSecond) * 1000) : "-";
    const boss = getBossExperimentController().getSnapshot();
    const bossRemainingText = boss.active ? formatElapsedTime(getBossRemainingMs(now)) : "";
    const progressText = boss.active
        ? `${finishedCount.toLocaleString()}投下 / 残り ${bossRemainingText}`
        : `${finishedCount.toLocaleString()} / ${settings.targetCount.toLocaleString()}`;
    const maxCount = Math.max(...binCounts, 0);
    const topIndex = binCounts.indexOf(maxCount);
    const topText = maxCount > 0 && topIndex >= 0 ? `${labels[topIndex]} (${maxCount.toLocaleString()}回)` : "-";
    const discoveredKinds = getDiscoveredCount();
    const missionDoneCount = Object.values(missionProgress).filter(Boolean).length;
    const levelInfo = getResearchLevelInfo();
    const rankInfo = getCurrentResearchRankInfo();
    const fortune = currentDailyFortune ?? getDailyFortune();
    currentDailyFortune = fortune;
    recordHero.innerHTML = `
        <div style="font-size:${isMobile ? 24 : 22}px;">🏆 ${t("最高記録", "Best records")} / ${escapeHtml(userProfile.nickname)}</div>
        <div style="font-size:${isMobile ? 22 : 20}px;">${t("最高レア", "Best rarity")}: <b>${savedRecords.bestRank}</b> ${savedRecords.bestLabel}</div>
        <div style="font-size:${isMobile ? 20 : 18}px;">研究Lv: <b>${levelInfo.level}</b> ${levelInfo.title} / ランク: <b>Lv.${rankInfo.level}</b> ${rankInfo.label} / ${t("今回スコア", "Run score")}: <b>${runScore.toLocaleString()}</b></div>
        <div style="font-size:${isMobile ? 18 : 16}px;opacity:.86;">${t("実験", "Runs")} ${savedRecords.totalRuns.toLocaleString()}${t("回", "")} / ${t("最大", "Max")} ${savedRecords.maxFinishedCount.toLocaleString()}${t("玉", " balls")} / 今日 x${fortune.rateBoost.toFixed(2)}</div>
    `;

    topRow.innerHTML = `
        <div>${t("デバイス", "Device")}: <b>${isMobile ? t("スマホ向け", "Mobile") : t("PC向け", "Desktop")}</b></div>
        <div>${t("ユーザー", "User")}: <b>${escapeHtml(userProfile.nickname)}</b> / ${getUserPlayStyleLabel(userProfile.playStyle)}</div>
        <div>${t("通信", "Network")}: <b>${navigator.onLine ? t("オンライン", "Online") : t("オフライン", "Offline")}</b></div>
        <div>${t("ブラウザ", "Browser")}: <b>${browserName}</b></div>
        <div>${boss.active ? "ボス戦" : t("実行回数", "Progress")}: <b>${progressText}</b></div>
        <div>${t("役物通過", "Gate hits")}: <b>${Object.values(pachinkoYakumonoHitCount).reduce((a, b) => a + b, 0).toLocaleString()}</b> / ${t("当選", "Jackpots")}: <b>${pachinkoJackpotCount.toLocaleString()}</b></div>
        <div>${t("画面上の玉", "Balls on screen")}: <b>${activeDropCount}</b></div>
        <div>${t("速度", "Speed")}: <b>${getSpeedDisplayLabel()}</b></div>
        <div>${t("確率モード", "Probability mode")}: <b>${isEnglish ? ({normal:"Normal",festival:"Festival",hard:"Hard",hell:"Hell"} as any)[settings.probabilityMode] : getProbabilityModeLabel()}</b></div>
        <div>${t("状態", "Status")}: <b>${!isStarted ? t("待機中", "Idle") : isFinished ? t("完了", "Finished") : boss.active ? "討伐中" : isMiraclePaused ? t("奇跡で停止中", "Paused by miracle") : isPaused ? t("停止中", "Paused") : targetReachedTime ? t("残り玉回収中", "Collecting remaining balls") : t("実行中", "Running")}</b></div>
        <div>${t("経過時間", "Elapsed")}: <b>${formatElapsedTime(elapsedMs)}</b></div>
        <div>${t("処理速度", "Throughput")}: <b>${Math.floor(speedPerSecond).toLocaleString()}</b> ${t("回/秒", "/sec")}</div>
        <div>${t("残り時間目安", "ETA")}: <b>${eta}</b></div>
        <div>${t("暫定1位", "Current top")}: <b>${topText}</b></div>
        <div>${t("受け皿", "Bins")}: <b>${settings.binCount}</b> ${t("+ 両端捨て区画", "+ edge discard zones")}</div>
        <div>${t("ピン段数", "Pin rows")}: <b>${settings.pinRows}</b></div>
        <div>${t("発見済み種類", "Discovered kinds")}: <b>${discoveredKinds}</b> / ${SPECIAL_EVENT_DEFS.length}</div>
        <div>研究レベル: <b>Lv.${levelInfo.level}</b> ${levelInfo.title}</div>
        <div>今日の奇跡率: <b>x${fortune.rateBoost.toFixed(2)}</b> / ${fortune.luckyKind}</div>
        <div>合成・派生: <b>${getFusionCount()}</b> / ${FUSION_DEFS.length}</div>
        <div>${t("奇跡ログ件数", "Miracle logs")}: <b>${miracleLogs.length}</b></div>
        <div>${t("スコア", "Score")}: <b>${runScore.toLocaleString()}</b></div>
        ${boss.active ? `<div>ボス: <b>${escapeHtml(boss.active.name)}</b> 残り <b>${bossRemainingText}</b> / HP <b>${boss.hp.toLocaleString()}</b> / ${boss.maxHp.toLocaleString()} PHASE ${boss.phase}</div>` : ""}
        <div>${t("ミッション", "Missions")}: <b>${missionDoneCount}</b> / ${missionDefs.length}</div>
        <div>${t("スキル", "Skills")}: <b>衝${skillState.shockwave} / 磁${skillState.magnet} / 時${skillState.timeStop}</b></div>\n        <div>${t("使い魔", "Familiar")}: <b>${getCurrentFamiliarDef().emoji} Lv.${familiarState.level}</b> / ${getFamiliarModeLabel(familiarState.mode)} / ${settings.familiarEnabled ? "ON" : "OFF"}</div>\n        <div>${t("奇跡ブースト", "Miracle boost")}: <b>x${getPassiveMiracleBoost().toFixed(2)}</b></div>
        <div>${t("縦動画", "Vertical")}: <b>${isVerticalVideoMode ? "ON" : "OFF"}</b></div>
        <div>${t("OBSモード", "OBS mode")}: <b>${isObsMode ? "ON" : "OFF"}</b></div>
        <div>${t("演出", "Effects")}: <b>${settings.effectsEnabled ? "ON" : "OFF"}</b> / ${getEffectModeLabel()}</div>
        <div>${t("実況ログ", "Commentary")}: <b>${settings.commentaryEnabled ? "ON" : "OFF"}</b></div>
        <div>${t("盤面変異", "Board anomaly")}: <b>${settings.boardAnomalyEnabled ? "ON" : "OFF"}</b></div>
        <div>${t("通常玉個体差", "Ball traits")}: <b>${settings.normalBallTraitsEnabled ? "ON" : "OFF"}</b></div>
        <div>${t("時間帯玉", "Time ball skins")}: <b>${settings.timeBallSkinsEnabled ? "ON" : "OFF"}</b> / ${getTimeBallThemeLabel(getCurrentTimeBallTheme())}</div>
        <div>${t("捨て区画", "Discarded")}: <b>${discardedCount.toLocaleString()}</b></div>
    `;
    updateRandomGraph();
    updateStatusMiniOverlays();
}

function updateRandomGraph(): void {
    randomGraphArea.style.display = "none";
    randomGraphArea.innerHTML = "";
}

function buildResultCsv(): string {
    const boss = getBossExperimentController().getSnapshot();
    return buildResultCsvBase({
        browserName,
        device: isMobile ? "mobile" : "desktop",
        targetCount: settings.targetCount,
        probabilityMode: settings.probabilityMode,
        finishedCount,
        binCount: settings.binCount,
        pinRows: settings.pinRows,
        randomCallCount: randomTelemetry.getCallCount(),
        discardedCount,
        runScore,
        boss: {
            id: boss.active?.id ?? "",
            name: boss.active?.name ?? "",
            damage: boss.damage,
            hpRemaining: boss.hp,
            cleared: boss.cleared,
            timedOut: boss.timedOut,
            timeLimitSec: boss.active?.timeLimitSec ?? "",
            elapsedSec: boss.active ? Math.round(getBossElapsedMs((endTime ?? Date.now())) / 1000) : "",
        },
        bestComboThisRun,
        missionsCleared: Object.values(missionProgress).filter(Boolean).length,
        createdCounts: {
            gold: goldCreated,
            rainbow: rainbowCreated,
            giant: giantCreated,
            shape: shapeCreated,
            crown: crownCreated,
            shooting_star: starCreated,
            heart: heartCreated,
            black_sun: blackSunCreated,
            cosmic_egg: cosmicEggCreated,
            silver_ufo: silverUfoCreated,
            blue_flame: blueFlameCreated,
            lucky_seven: luckySevenCreated,
            time_rift: timeRiftCreated,
            lab_explosion: labExplosionCreated,
        },
        labels,
        binCounts,
        hits: {
            gold: goldHits,
            rainbow: rainbowHits,
            giant: giantHits,
            shape: shapeHits,
            crown: crownHits,
            star: starHits,
            heart: heartHits,
            blackSun: blackSunHits,
            cosmicEgg: cosmicEggHits,
        },
    });
}

async function copyResultCsv(): Promise<void> {
    await getResultActionController().copyResultCsv();
}

function downloadResultCsv(): void {
    getResultActionController().downloadResultCsv();
}

function closeFinalResult(): void {
    getResultActionController().closeFinalResult();
}

function showEndingThenFinalResult(): void {
    if (!settings.effectsEnabled || settings.simpleMode) {
        showFinalResult();
        return;
    }
    const best = miracleLogs[0];
    const hasGodChain = Object.keys(unlockedChainRunIds).some((id) => MIRACLE_CHAIN_DEFS.find((x) => x.id === id)?.rank.includes("GOD"));
    const title = hasGodChain ? "確率の外側へ到達" : best ? "観測記録を封印" : "実験終了";
    const line = hasGodChain
        ? "研究所は、奇跡同士の連鎖を最終記録として保存しました。"
        : best
            ? `${best.label} を含む研究記録を保存しました。`
            : "通常観測として、静かに研究記録を保存しました。";
    maybeShowCommentary(`実況「${title}」`, true);
    fireConfetti(hasGodChain ? "cosmic" : best ? "miracle" : "normal");
    resultOverlay.innerHTML = getEndingResultHtml({
        isMobile,
        title,
        line,
        finishedCount,
    });
    resultOverlay.style.display = "flex";
    window.setTimeout(() => showFinalResult(), 2500);
}

function showFinalResult(): void {
    recordAdminEvent({ type: "run_finish", at: Date.now(), count: finishedCount, targetCount: settings.targetCount, detail: `score ${runScore}` });
    savedRecords.totalRuns++;
    const wallFormulaUnlock = unlockLabWallFormulas({ records: savedRecords, now: Date.now() });
    savedRecords = wallFormulaUnlock.records;
    if (wallFormulaUnlock.unlocked.length > 0) {
        const latest = wallFormulaUnlock.unlocked[wallFormulaUnlock.unlocked.length - 1];
        showSoftToast(`研究所の壁に数式が出現: ${latest?.formula ?? "???"}`);
    }
    unlockNote("first-run", false);
    savedRecords.maxFinishedCount = Math.max(savedRecords.maxFinishedCount, finishedCount);
    savedRecords.maxTargetCount = Math.max(savedRecords.maxTargetCount, settings.targetCount);
    const dailyCompleted = evaluateAndSaveDailyMissions();
    const finishGachaPoint = awardExperimentFinishGachaPoint();
    const dailyGachaPoint = dailyCompleted.length * 2;
    const totalGachaPointAward = finishGachaPoint + dailyGachaPoint;
    savedRecords.bestScore = Math.max(savedRecords.bestScore, runScore);
    savedRecords.totalScore += runScore;
    const currentReport = saveCurrentResearchReport();
    const bossResult = recordBossResult();
    const multiverseResult = completeActiveMultiverseExpedition();
    saveRecords();
    const ranking = binCounts.map((count, index) => ({ label: labels[index], count, percent: finishedCount > 0 ? (count / finishedCount) * 100 : 0 })).sort((a, b) => b.count - a.count);
    const rankingHtml = ranking.map((item, index) => `<div style="margin:7px 0;">${index + 1}位：${item.label}　${item.count.toLocaleString()}回　${item.percent.toFixed(2)}%</div>`).join("");
    const evaluation = getResearchEvaluation();
    const runSummaryText = bossResult
        ? `${browserName} / ボス戦 ${bossResult.cleared ? "討伐成功" : "討伐失敗"} / 実処理${finishedCount.toLocaleString()}回 / ${formatElapsedTime((endTime ?? Date.now()) - startTime)}`
        : `${browserName} / 指定${settings.targetCount.toLocaleString()}回 / 実処理${finishedCount.toLocaleString()}回 / ${formatElapsedTime((targetReachedTime ?? endTime ?? Date.now()) - startTime)}`;
    resultOverlay.innerHTML = getFinalResultHtml({
        runSummaryText,
        runScore,
        missionClearedCount: Object.values(missionProgress).filter(Boolean).length,
        missionTotalCount: missionDefs.length,
        bestComboThisRun,
        dailyCompletedHtml: dailyCompleted.length > 0 ? `<div style="margin:0 auto 18px;max-width:760px;padding:14px;border-radius:18px;background:rgba(34,197,94,.16);border:1px solid rgba(134,239,172,.35);font-size:clamp(16px,2.4vw,24px);">デイリー研究達成: ${dailyCompleted.map(escapeHtml).join(" / ")}</div>` : "",
        totalGachaPointAward,
        currentGachaPoint: getGachaPoint(),
        finishGachaPoint,
        dailyGachaPoint,
        bossResultHtml: getMultiverseResultHtml(multiverseResult) + getBossResultHtml(bossResult),
        evaluationGrade: evaluation.grade,
        evaluationType: evaluation.type,
        evaluationDensity: evaluation.density,
        evaluationNote: evaluation.note,
        reportRunNo: currentReport.runNo,
        rankingHtml,
        probabilityModeLabel: getProbabilityModeLabel(),
        discoveredCount: SPECIAL_EVENT_DEFS.filter((def) => (savedRecords.discovered[def.kind] ?? 0) + (specialCreated[def.kind] ?? 0) > 0).length,
        specialEventCount: SPECIAL_EVENT_DEFS.length,
        discardedCount,
        researchMemoHtml: generateResearchMemoHtml(),
        researchReportHtml: getResearchReportHtml(),
    });
    resultOverlay.style.display = "flex";
    document.getElementById("copy-result-button")!.onclick = () => copyResultCsv();
    document.getElementById("download-result-button")!.onclick = () => downloadResultCsv();
    document.getElementById("share-result-button")!.onclick = () => showSharePopup();
    document.getElementById("close-result-button")!.onclick = () => closeFinalResult();
    document.getElementById("bottom-close-result-button")!.onclick = () => closeFinalResult();
}

// ======================================================
// Rendering
// ======================================================

function drawDiscardBinLabel(context: CanvasRenderingContext2D, physicalIndex: number): void {
    drawDiscardBinLabelFrame(context, physicalIndex, geometry, isMobile);
}


function drawSpecialIcon(context: CanvasRenderingContext2D, kind: DropKind, x: number, y: number, radius: number, symbol: string): void {
    drawSpecialIconFrame(context, kind, x, y, radius, symbol, { isMobile, geometry });
}

function drawTimeBallSkins(context: CanvasRenderingContext2D): void {
    if (!settings.timeBallSkinsEnabled) return;
    context.save();
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isDrop || plugin.kind !== "normal") continue;
        const skin = plugin.timeBallSkin as TimeBallSkin | undefined;
        if (!skin || skin === "normal") continue;
        const radius = body.circleRadius ?? plugin.originalRadius ?? geometry.ballRadius;
        const color = (body.render as any)?.fillStyle ?? randomColor();
        drawTimeBallSkinIcon(context, skin, body.position.x, body.position.y, radius * 0.92, body.angle, color, settings.simpleMode);
    }
    context.restore();
}

function draw3DBallShading(context: CanvasRenderingContext2D): void {
    draw3DBallShadingFrame(context, engine.world.bodies, {
        simpleMode: settings.simpleMode,
        lowSpecMode: settings.lowSpecMode,
        isMobile,
    });
}

function drawNormalTraitMarks(context: CanvasRenderingContext2D): void {
    drawNormalTraitMarksFrame(context, engine.world.bodies, geometry.ballRadius, settings.simpleMode);
}

function drawRealisticPins(context: CanvasRenderingContext2D): void {
    drawRealisticPinsFrame(context, engine.world.bodies, geometry);
}

function drawMagicCircleTrace(context: CanvasRenderingContext2D): void {
    drawMagicCircleTraceFrame(context, magicCirclePoints, {
        enabled: magicCircleModeEnabled,
        simpleMode: settings.simpleMode,
        geometry,
        uiFont: ROUNDED_UI_FONT,
        roughCanvas: getRoughCanvas(),
    });
}

function drawBoardDepthOverlay(context: CanvasRenderingContext2D): void {
    drawBoardDepthOverlayFrame(context, geometry, settings.simpleMode, isMobileStableRuntime());
}

function drawLuxuryBoardForeground(context: CanvasRenderingContext2D): void {
    drawLuxuryBoardForegroundFrame(context, geometry, isMobileStableRuntime());
}

function drawMobileRuntimeStableFrame(context: CanvasRenderingContext2D): void {
    drawMobileRuntimeStableFrameBase(context, geometry);
}

function drawSpecialGlows(context: CanvasRenderingContext2D): void {
    drawSpecialGlowsFrame(context, engine.world.bodies, {
        simpleMode: settings.simpleMode,
        isMobile,
        geometry,
        findSpecialDef,
        drawSpecialIcon,
    });
}

function drawPachinkoMachine(context: CanvasRenderingContext2D): void {
    drawPachinkoMachineFrame(context, {
        geometry,
        yakumonoDefs: PACHINKO_YAKUMONO_DEFS,
        blackModeEnabled: settings.blackModeEnabled,
        uiFont: ROUNDED_UI_FONT,
        currentPattern: currentPachinkoNailPattern,
        getYakumonoAlpha: kindYakumonoAlpha,
    });
}

function kindYakumonoAlpha(kind: PachinkoYakumonoKind): number {
    const count = pachinkoYakumonoHitCount[kind] ?? 0;
    return count > 0 ? 0.5 + Math.sin(performance.now() / 140) * 0.2 : 0;
}

Events.on(render, "afterRender", () => {
    afterRenderFrameTick++;
    const context = render.context;
    const mobileRuntime = isMobile && isStarted && !isPaused && !isMiraclePaused && !isFinished;
    context.save();
    drawPachinkoMachine(context);
    if (!mobileRuntime) {
        drawRareBoardCatastrophe(context);
        drawBoardDepthOverlay(context);
        drawTapRipples(context);
        drawMagicPhysicsFields(context);
        drawBrokenResearchNote(context);
    } else {
        drawMobileRuntimeStableFrame(context);
    }
    drawBossEnemy(context, mobileRuntime);
    drawMagicCircleTrace(context);
    drawRealisticPins(context);
    if (!mobileRuntime) {
        draw3DBallShading(context);
        drawSpecialGlows(context);
        drawTimeBallSkins(context);
        drawNormalTraitMarks(context);
        drawFamiliar(context);
    }
    context.textAlign = "center";
    context.textBaseline = "middle";
    drawDiscardBinLabel(context, 0);
    drawDiscardBinLabel(context, settings.binCount + 1);
    const maxCount = Math.max(...binCounts, 0);
    const visibleBinCount = Math.min(settings.binCount, geometry.binCenters.length);
    for (let i = 0; i < visibleBinCount; i++) {
        const x = geometry.binCenters[i];
        if (x === undefined) continue;
        const count = binCounts[i] ?? 0;
        const label = labels[i] ?? String(i + 1);
        const percent = finishedCount > 0 ? (count / finishedCount) * 100 : 0;
        if (!mobileRuntime && !settings.simpleMode && (hitFlash[i] ?? 0) > 0) {
            const alpha = (hitFlash[i] ?? 0) / 18;
            context.fillStyle = `rgba(255,160,80,${alpha * 0.45})`;
            context.fillRect(x - geometry.binWidth / 2, geometry.groundTop - 118 * geometry.scale, geometry.binWidth, 118 * geometry.scale);
            if (!isPaused) hitFlash[i] = Math.max(0, (hitFlash[i] ?? 0) - 1);
        }
        if (!mobileRuntime && !settings.simpleMode && count === maxCount && maxCount > 0) {
            context.beginPath();
            context.arc(x, geometry.labelY, 32 * geometry.scale, 0, Math.PI * 2);
            context.fillStyle = "rgba(255, 220, 80, 0.45)";
            context.fill();
        }
        context.font = `900 ${geometry.labelFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = activeWorldMode === "poseidon" ? "#e7f6ff" : activeWorldMode === "zeusu" ? "#3e2f00" : activeWorldMode === "hadesu" ? "#ffffff" : activeWorldMode === "heart" ? "#fff4fb" : activeWorldMode === "nekochan" ? "#4a2a11" : "#222";
        context.fillText(label, x, geometry.labelY);
        context.font = `800 ${geometry.countFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = activeWorldMode === "poseidon" ? "#d7efff" : activeWorldMode === "zeusu" ? "#5a4300" : activeWorldMode === "hadesu" ? "#ffb1b1" : activeWorldMode === "heart" ? "#fff0f8" : activeWorldMode === "nekochan" ? "#5a3416" : "#003366";
        context.fillText(count.toLocaleString(), x, geometry.countY);
        context.font = `700 ${geometry.percentFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = activeWorldMode === "poseidon" ? "#d7efff" : activeWorldMode === "zeusu" ? "#5a4300" : activeWorldMode === "hadesu" ? "#ffb1b1" : activeWorldMode === "heart" ? "#fff0f8" : activeWorldMode === "nekochan" ? "#5a3416" : "#444";
        context.fillText(`${percent.toFixed(1)}%`, x, geometry.percentY);
        const barMaxWidth = geometry.binWidth * 0.72;
        const barWidth = Math.min(barMaxWidth, barMaxWidth * (percent / 25));
        const barHeight = clamp(8 * geometry.scale, 4, 18);
        context.fillStyle = activeWorldMode === "poseidon" ? "rgba(215,239,255,.55)" : activeWorldMode === "zeusu" ? "rgba(255,247,176,.45)" : activeWorldMode === "hadesu" ? "rgba(255,120,120,.25)" : activeWorldMode === "heart" ? "rgba(255,224,240,.48)" : activeWorldMode === "nekochan" ? "rgba(255,232,210,.48)" : "#d7dce7";
        context.fillRect(x - barMaxWidth / 2, geometry.barY, barMaxWidth, barHeight);
        context.fillStyle = activeWorldMode === "poseidon" ? "#4b8cff" : activeWorldMode === "zeusu" ? "#ffd400" : activeWorldMode === "hadesu" ? "#ff4a4a" : activeWorldMode === "heart" ? "#ff5fb5" : activeWorldMode === "nekochan" ? "#ff9a52" : "#4b8cff";
        context.fillRect(x - barMaxWidth / 2, geometry.barY, barWidth, barHeight);
    }
    if (!mobileRuntime && activeWorldMode) {
        const palette = getWorldModePalette(activeWorldMode);
        context.save();
        context.fillStyle = palette.tint;
        context.fillRect(0, 0, geometry.width, geometry.height);
        context.strokeStyle = palette.accent;
        context.fillStyle = palette.accent;
        context.globalAlpha = 0.95;
        context.font = `900 ${Math.round(clamp(30 * geometry.scale, 18, 46))}px "Segoe UI Emoji", "Noto Sans JP", sans-serif`;
        context.fillText(`${palette.emoji} ${palette.subtitle} ${palette.emoji}`, geometry.width / 2, 34 * geometry.scale);
        for (let i = 0; i < 12; i++) {
            const angle = Date.now() / 900 + i * Math.PI * 2 / 12;
            const x = geometry.width / 2 + Math.cos(angle) * geometry.width * 0.34;
            const y = geometry.height * 0.34 + Math.sin(angle * 1.3) * geometry.height * 0.22;
            context.globalAlpha = 0.35;
            context.font = `900 ${Math.round(clamp(30 * geometry.scale, 18, 42))}px "Segoe UI Emoji", "Noto Sans JP", sans-serif`;
            context.fillText(palette.emoji, x, y);
        }
        context.restore();
    }
    if (!mobileRuntime) drawLuxuryBoardForeground(context);
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const item = floatingTexts[i];
        const progress = item.life / item.maxLife;
        const y = item.y - (1 - progress) * 40 * geometry.scale;
        context.globalAlpha = progress;
        context.font = `900 ${Math.round(clamp(24 * geometry.scale, 16, 42))}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = item.color;
        context.fillText(item.text, item.x, y);
        context.globalAlpha = 1;
        if (!isPaused) item.life--;
        if (item.life <= 0) floatingTexts.splice(i, 1);
    }
    if (isStarted && !isPaused && !isMiraclePaused && !isMobile) {
        getShareReplayController().captureReplayFrame();
    }
    drawBossHud(context);
    context.restore();
});


function promoteDropToPachinkoSpecial(drop: Matter.Body, special: SpecialEventDef): void {
    const plugin = (drop as any).plugin ?? {};
    plugin.kind = special.kind;
    plugin.symbol = special.symbol;
    plugin.shapeName = special.label;
    plugin.pachinkoJackpot = true;
    plugin.pachinkoRank = special.rank;
    plugin.originalRadius = Math.max(plugin.originalRadius ?? geometry.ballRadius, geometry.ballRadius * special.radiusScale);
    (drop as any).plugin = plugin;
    drop.render.fillStyle = special.fillStyle;
    drop.render.strokeStyle = special.rank === "GOD" ? "#ffffff" : special.rank === "EX" ? "#ff0044" : "#fff7cc";
    drop.render.lineWidth = Math.max(drop.render.lineWidth ?? 1, (special.rank === "GOD" ? 6 : special.rank === "EX" ? 5 : 4) * geometry.scale);
    Body.scale(drop, 1.08, 1.08);
    Body.setVelocity(drop, { x: drop.velocity.x + (appRandom() - 0.5) * 5 * geometry.scale, y: Math.min(drop.velocity.y, -4.2 * geometry.scale) });
    Body.setAngularVelocity(drop, (appRandom() - 0.5) * 0.8);
}

function handlePachinkoYakumonoPassage(yakumono: Matter.Body, drop: Matter.Body): void {
    const yakumonoPlugin = (yakumono as any).plugin;
    const dropPlugin = (drop as any).plugin;
    if (!yakumonoPlugin?.isYakumono || !dropPlugin?.isDrop) return;

    const kind = yakumonoPlugin.yakumonoKind as PachinkoYakumonoKind;
    dropPlugin.passedYakumonoIds = dropPlugin.passedYakumonoIds ?? {};
    if (dropPlugin.passedYakumonoIds[kind]) return;
    dropPlugin.passedYakumonoIds[kind] = true;

    const def = getPachinkoYakumonoDef(kind);
    pachinkoYakumonoHitCount[kind] = (pachinkoYakumonoHitCount[kind] ?? 0) + 1;
    addScore(def.score, `PACHINKO ${def.label}`, drop.position.x, drop.position.y - 24 * geometry.scale);
    addFloatingText(`${def.label} 通過`, drop.position.x, drop.position.y - 18 * geometry.scale, def.color);
    damageBossForYakumono(kind, def, drop);

    const special = rollSpecialEventWithScale(def.oddsScale);
    if (!special) {
        if (kind !== "start" && appRandom() < 0.22) {
            maybeTriggerMiracleOmen(true);
            triggerCameraShake(4 * geometry.scale, 150);
        }
        return;
    }

    pachinkoJackpotCount++;
    promoteDropToPachinkoSpecial(drop, special);
    dropPlugin.specialSoundHandled = true;
    if (special.rank === "GOD") setUiAccent(special.kind, 0);
    else if (special.rank === "EX") setUiAccent(special.kind, 12000);
    incrementSpecialCreated(special.kind);
    repeatedMiracleRunCounts[special.kind] = (repeatedMiracleRunCounts[special.kind] ?? 0) + 1;
    recordSpecialDiscovery(special);
    showMiracle(special.kind, special.symbol, `[${special.rank}] ${def.label}通過 ${formatProbability(special.denominator)}`, buildWeirdMiracleText(special));
    maybeShowCommentary(`実況「${def.label}通過で ${special.label} に当選しました」`, true);
    triggerCameraShake(special.rank === "GOD" ? 42 * geometry.scale : special.rank === "EX" ? 30 * geometry.scale : 18 * geometry.scale, special.rank === "GOD" ? 1100 : 520);
}

function handleRarePinCollision(pin: Matter.Body, drop: Matter.Body): void {
    const pinPlugin = (pin as any).plugin;
    const dropPlugin = (drop as any).plugin;
    if (!pinPlugin?.rarePinKind || !dropPlugin?.isDrop) return;
    const kind = pinPlugin.rarePinKind as RarePinKind;
    rarePinTouchCount[kind] = (rarePinTouchCount[kind] ?? 0) + 1;
    pinPlugin.wiggleFrames = Math.max(pinPlugin.wiggleFrames ?? 0, 30);
    const rarePin = getRarePinDef(kind);
    if (rarePin && appRandom() < 0.12) addFloatingText(rarePin.label, pin.position.x, pin.position.y - 18 * geometry.scale, rarePin.fillStyle);
    updateTutorialMissions();
    if (kind === "red") {
        Body.setVelocity(drop, { x: drop.velocity.x * 1.15 + (appRandom() - 0.5) * 3.4 * geometry.scale, y: Math.min(drop.velocity.y, -2.2 * geometry.scale) });
    } else if (kind === "blue") {
        const dx = geometry.width / 2 - drop.position.x;
        Body.applyForce(drop, drop.position, { x: dx * 0.000004, y: -0.0000012 });
    } else if (kind === "black") {
        if ((dropPlugin.kind ?? "normal") === "normal" && appRandom() < 0.045) {
            dropPlugin.kind = "gold";
            dropPlugin.symbol = "金";
            drop.render.fillStyle = "#ffd700";
            drop.render.strokeStyle = "#fff4a8";
            drop.render.lineWidth = 3 * geometry.scale;
            addFloatingText("黒ピン変質", drop.position.x, drop.position.y - 18 * geometry.scale, "#ffd700");
            maybeShowCommentary("実況「黒ピンで通常玉が変質しました」", true);
        }
    } else if (kind === "rainbow") {
        if (appRandom() < 0.18) maybeTriggerMiracleOmen(true);
    }
}

Events.on(engine, "collisionStart", (event) => {
    if (isAppTerminated) return;
    for (const pair of event.pairs) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        const ap = (a as any).plugin;
        const bp = (b as any).plugin;
        if (ap?.isYakumono && bp?.isDrop) handlePachinkoYakumonoPassage(a, b);
        else if (bp?.isYakumono && ap?.isDrop) handlePachinkoYakumonoPassage(b, a);
        if (ap?.isPin && bp?.isDrop) handleRarePinCollision(a, b);
        else if (bp?.isPin && ap?.isDrop) handleRarePinCollision(b, a);
    }
});

// ======================================================
// Physics update
// ======================================================

Events.on(engine, "afterUpdate", () => {
    if (isAppTerminated) return;
    updateCameraShake();
    updateMagicPhysicsFields();
    updatePinWiggles();
    updateBoardAnomaly();
    maybeTriggerBoardAnomaly();
    maybeTriggerSmallMiracleEvent();
    maybeBossAttack();
    maybeShowCommentary();
    updateTutorialMissions();
    updateResearchProgressPanel();
    gameArea.style.filter = !isMobileStableRuntime() && anomalyUntil ? (anomalyHidePins ? "brightness(.84) contrast(1.1)" : "brightness(.95)") : "";
    if (!isStarted || isFinished || isMiraclePaused) return;
    const isBossRun = !!getBossExperimentController().getSnapshot().active;
    if (maybeFinishBossExperimentByTime()) return;

    const removeTargets: Matter.Body[] = [];
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;

        if (plugin?.isDecoration) {
            if (body.position.y > geometry.height + 80 * geometry.scale) removeTargets.push(body);
            continue;
        }
        if (!plugin?.isDrop) continue;

        plugin.lifeFrames = (plugin.lifeFrames ?? 0) + 1;

        const nowMs = performance.now();
        const hardExpired = typeof plugin.bornAt === "number" && typeof plugin.hardExpireMs === "number" && nowMs - plugin.bornAt >= plugin.hardExpireMs;
        if (hardExpired) {
            explodeStuckDrop(body);
            finishedCount++;
            discardedCount++;
            if (!isBossRun && targetReachedTime === null && finishedCount >= settings.targetCount) targetReachedTime = Date.now();
            activeDropCount--;
            removeTargets.push(body);
            continue;
        }

        // 指定回数に到達した後も、画面に残っている玉は最後に強制回収してカウントする
        if (targetReachedTime !== null && Date.now() - targetReachedTime > FINAL_SWEEP_DELAY_MS) {
            const kind = (plugin.kind ?? "normal") as DropKind;
            const binIndex = getBinIndex(body.position.x);
            finishedCount++;
            if (binIndex >= 0) {
                binCounts[binIndex]++;
                addScore(100, "DROP", body.position.x, geometry.ballCountY - 24 * geometry.scale);
                if (!settings.simpleMode) hitFlash[binIndex] = 18;
                damageBossForDrop(kind, binIndex, body);
                handleFamiliarDropResult(kind, binIndex);
            } else {
                discardedCount++;
                handleFamiliarDropResult(kind, -1);
            }
            activeDropCount--;
            removeTargets.push(body);
            continue;
        }

        if (magnetUntil > Date.now()) {
            const maxCount = Math.max(...binCounts, 0);
            const topIndex = Math.max(0, binCounts.indexOf(maxCount));
            const targetX = geometry.binCenters[Math.min(topIndex >= 0 ? topIndex : Math.floor(settings.binCount / 2), geometry.binCenters.length - 1)] ?? (geometry.width / 2);
            const dx = targetX - body.position.x;
            Body.applyForce(body, body.position, { x: dx * 0.0000018, y: -0.00000035 });
        }

        applyActiveBoardAnomalyForce(body);

        if (plugin.kind === "shape" || plugin.kind === "giant") {
            const lastX = plugin.lastX ?? body.position.x;
            const lastY = plugin.lastY ?? body.position.y;
            const moveDistance = Math.hypot(body.position.x - lastX, body.position.y - lastY);
            plugin.lastX = body.position.x;
            plugin.lastY = body.position.y;
            const isAboveGoal = plugin.kind === "giant" || body.position.y < geometry.ballCountY - 20 * geometry.scale;
            const isAlmostStopped = isAboveGoal && moveDistance < 0.45 * geometry.scale && body.speed < 0.35;
            plugin.stuckFrames = isAlmostStopped ? (plugin.stuckFrames ?? 0) + 1 : 0;
            if (plugin.stuckFrames === STUCK_NUDGE_FRAMES) {
                Body.setVelocity(body, { x: (appRandom() - 0.5) * 10 * geometry.scale, y: -5 * geometry.scale });
                Body.setAngularVelocity(body, (appRandom() - 0.5) * 0.45);
                addFloatingText(plugin.kind === "giant" ? "巨大玉 救出" : "詰まり救出", body.position.x, body.position.y - 20 * geometry.scale, "#ff8800");
                triggerCameraShake(5 * geometry.scale, 140);
            }
            const shouldExplode = plugin.stuckFrames > STUCK_EXPLODE_FRAMES || (plugin.kind === "giant" && plugin.lifeFrames > STUCK_EXPLODE_FRAMES) || (plugin.kind === "shape" && plugin.lifeFrames > STUCK_EXPLODE_FRAMES * 2);
            if (shouldExplode) {
                explodeStuckDrop(body);
                finishedCount++;
                discardedCount++;
                if (!isBossRun && targetReachedTime === null && finishedCount >= settings.targetCount) targetReachedTime = Date.now();
                activeDropCount--;
                removeTargets.push(body);
                continue;
            }
        }

        if (body.position.y > geometry.ballCountY) {
            const kind = (plugin.kind ?? "normal") as DropKind;
            if (kind !== "normal" && !plugin.specialSoundHandled && !plugin.pachinkoJackpot) playSpecialSound(kind);
            const binIndex = getBinIndex(body.position.x);
            finishedCount++;
            if (!isBossRun && targetReachedTime === null && finishedCount >= settings.targetCount) targetReachedTime = Date.now();

            if (binIndex >= 0) {
                binCounts[binIndex]++;
                if (!settings.simpleMode) hitFlash[binIndex] = 18;
                triggerCameraShake(3 * geometry.scale, 100);
                if (kind === "gold") { goldHits[binIndex]++; addScore(800, "GOLD", body.position.x, geometry.ballCountY - 60 * geometry.scale); addFloatingText(`金 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 60 * geometry.scale, "#d89b00"); triggerCameraShake(7 * geometry.scale, 180); }
                if (kind === "rainbow") { rainbowHits[binIndex]++; addScore(1600, "RAINBOW", body.position.x, geometry.ballCountY - 60 * geometry.scale); addFloatingText(`虹 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 60 * geometry.scale, "#b44cff"); triggerCameraShake(11 * geometry.scale, 240); }
                if (kind === "giant") { giantHits[binIndex]++; addScore(2200, "GIANT", body.position.x, geometry.ballCountY - 70 * geometry.scale); addFloatingText(`巨大 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 70 * geometry.scale, "#111111"); triggerCameraShake(15 * geometry.scale, 300); }
                if (kind === "shape") { shapeHits[binIndex]++; addScore(1200, "SHAPE", body.position.x, geometry.ballCountY - 70 * geometry.scale); addFloatingText(`${plugin.shapeName ?? "図形"} → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 70 * geometry.scale, "#ffffff"); triggerCameraShake(9 * geometry.scale, 220); }
                if (kind === "crown") { crownHits[binIndex]++; addScore(6000, "CROWN", body.position.x, geometry.ballCountY - 80 * geometry.scale); addFloatingText(`王冠 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#ffd54a"); fireConfetti("miracle"); }
                if (kind === "shootingStar") { starHits[binIndex]++; addScore(18000, "STAR", body.position.x, geometry.ballCountY - 80 * geometry.scale); addFloatingText(`流れ星 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#78e7ff"); fireConfetti("miracle"); }
                if (kind === "heart") { heartHits[binIndex]++; addScore(60000, "HEART", body.position.x, geometry.ballCountY - 80 * geometry.scale); addFloatingText(`桃色ハート → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#ff69b4"); triggerCameraShake(22 * geometry.scale, 480); fireConfetti("miracle"); }
                if (kind === "blackSun") { blackSunHits[binIndex]++; addScore(120000, "BLACK SUN", body.position.x, geometry.ballCountY - 80 * geometry.scale); addFloatingText(`黒い太陽 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#ff0044"); triggerCameraShake(26 * geometry.scale, 600); fireConfetti("black"); }
                if (kind === "cosmicEgg") { cosmicEggHits[binIndex]++; addScore(250000, "COSMIC EGG", body.position.x, geometry.ballCountY - 90 * geometry.scale); addFloatingText(`宇宙卵 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 90 * geometry.scale, "#00e5ff"); triggerCameraShake(38 * geometry.scale, 1200); fireConfetti("cosmic"); }
                const def = findSpecialDef(kind);
                if (def && !["heart", "blackSun", "cosmicEgg"].includes(kind)) {
                    addFloatingText(`${def.label} → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 90 * geometry.scale, def.fillStyle);
                    triggerScreenFlash(def.soundMode ?? "miracle");
                    triggerCameraShake(def.rank === "GOD" ? 40 * geometry.scale : def.rank === "EX" ? 30 * geometry.scale : 24 * geometry.scale, def.rank === "GOD" ? 1100 : 540);
                    fireConfetti(def.soundMode ?? "miracle");
                }

                damageBossForDrop(kind, binIndex, body);
                handleFamiliarDropResult(kind, binIndex);
                checkMissionProgress();
                while (!isBossRun && finishedCount >= nextMilestone && nextMilestone <= settings.targetCount) {
                    showMilestone(`${nextMilestone.toLocaleString()}回 達成！`);
                    showFullScreenCelebration(nextMilestone);
                    nextMilestone += MILESTONE_INTERVAL;
                }
                while (!isBossRun && finishedCount >= nextGiantEvent && nextGiantEvent <= settings.targetCount) {
                    giantStock++;
                    nextGiantEvent += GIANT_EVENT_INTERVAL;
                }
            } else {
                discardedCount++;
                handleFamiliarDropResult(kind, -1);
            }
            activeDropCount--;
            removeTargets.push(body);
        }
    }

    for (const body of removeTargets) Composite.remove(engine.world, body);
    if (isFinished) {
        updateInfoDuringRun();
        return;
    }

    // 画面上に残っている玉を含めて指定回数に届いている場合は、残り玉回収モードへ入る。
    // これがないと「あと1個が画面上で止まる → 新規投入されない → 完了画面が開かない」状態になることがある。
    if (!isBossRun && targetReachedTime === null && finishedCount + activeDropCount >= settings.targetCount) {
        targetReachedTime = Date.now();
    }

    // 指定回数に到達した後は新規投入せず、残り玉の回収だけ行う
    while (targetReachedTime === null && (isBossRun || finishedCount + activeDropCount < settings.targetCount) && activeDropCount < settings.activeLimit) {
        Composite.add(engine.world, createDrop());
    }
    updateInfoDuringRun();

    if (targetReachedTime !== null && activeDropCount === 0) {
        isFinished = true;
scheduleViewportStabilize(false);
        endTime = Date.now();
        Runner.stop(runner);
        updateInfo();
        tutorialMissionPanel.style.display = "none";
        researchProgressPanel.style.display = "none";
        showEndingThenFinalResult();
    }
});

// ======================================================
// Start / resize
// ======================================================

geometry = calculateGeometry();
missionDefs = buildMissionDefs();
markThemeUnlocked(currentTheme);
applyAutoTheme("boot");
applyTheme();
if (settings.lowSpecMode) applyLowSpecMode();
updateLowSpecButton();
if (getFamiliarExpeditionProgress(familiarExpeditionState).complete) {
    window.setTimeout(() => showSoftToast("使い魔遠征が完了しています"), 800);
}
updateFamiliarButton();
resetExperiment(false);
ensureRenderLoop();
void prepareRoughCanvas(render.canvas);
void ensureAnimeReady();
void ensureGifReady();
void ensureTippyReady();
void loadRemoteMiracleAssets();
hideBootOverlay();
window.setTimeout(() => scheduleViewportStabilize(false), 180);
window.setTimeout(() => {
    if (!isStarted && !isAppTerminated && helpOverlay.style.display === "none") showLabHome();
}, bootMinimumDurationMs + 650);

window.setInterval(() => {
    if (!isMobile || isAppTerminated) return;
    if (helpOverlay.style.display !== "none") return;
    if (isStarted && !isFinished && flashOverlay.style.display !== "none") {
        flashOverlay.style.display = "none";
        flashOverlay.style.opacity = "0";
    }
    if (isMobileCanvasLayoutBroken()) repairMobileBoardLayout(true);
}, 900);

let resizeTimer: number | undefined;
function scheduleResize(): void {
    if (isAppTerminated) return;
    if (isMobile && isStarted && !isFinished) {
        // iPhone はアドレスバー等で visualViewport が細かく揺れるため、
        // 実行中は正常な盤面に一切レイアウト補正をかけない。
        if (isMobileCanvasLayoutBroken()) repairMobileBoardLayout(true);
        return;
    }
    if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
        if (!applySettingsFromInputs(false)) return;
        scheduleViewportStabilize(isStarted && !isFinished);
    }, 300);
}
window.addEventListener("resize", scheduleResize);
window.addEventListener("orientationchange", () => { window.setTimeout(() => scheduleViewportStabilize(isStarted && !isFinished), 120); });
window.addEventListener("pageshow", () => { window.setTimeout(() => {
    resumeRuntimeLoopsAfterForeground();
    scheduleViewportStabilize(isStarted && !isFinished);
}, 80); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) window.setTimeout(() => {
    resumeRuntimeLoopsAfterForeground();
    scheduleViewportStabilize(isStarted && !isFinished);
}, 80); });
window.visualViewport?.addEventListener("resize", scheduleResize);
window.visualViewport?.addEventListener("scroll", scheduleResize);
window.addEventListener("online", () => { showOfflineModeEventPopup(); updateInfo(); });
window.addEventListener("offline", () => { showOfflineModeEventPopup(); updateInfo(); });
if (!navigator.onLine) {
    window.setTimeout(() => showOfflineModeEventPopup(), bootMinimumDurationMs + 1200);
}
