import Matter, { Events } from "matter-js";
import anime from "animejs";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import GIF from "gif.js";
import gifWorkerUrl from "gif.js/dist/gif.worker.js?url";
import * as Tone from "tone";
import confetti from "canvas-confetti";
import rough from "roughjs/bundled/rough.esm";
import { Howl } from "howler";
import JSConfetti from "js-confetti";
import party from "party-js";
import { Application, Graphics } from "pixi.js";
import { createAdminLogApi, type AdminLogApi, type AdminLogEntry } from "./miracle/adminLog";
import { ADMIN_UNLOCK_STORAGE_KEY, verifyAdminPasscode } from "./miracle/admin";
import { createDefaultSettings, getThemeOptions, getThemeUiPalette } from "./miracle/settings";
import { createInitialSkillState, createRandomBuckets } from "./miracle/state";
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
import { APP_VERSION, BASE_HEIGHT, BASE_WIDTH, BLACK_SUN_RATE, COMMENTARY_DISPLAY_MS, COMMENTARY_MIN_INTERVAL_MS, COSMIC_EGG_RATE, CROWN_RATE, FINAL_SWEEP_DELAY_MS, FIRST_RUN_GUIDE_STORAGE_KEY, GIANT_EVENT_INTERVAL, GOLD_RATE, HEART_RATE, LOCAL_GOD_AUDIO_FILES, LOCAL_RARE_AUDIO_FILES, MAGNET_DURATION_MS, MILESTONE_INTERVAL, MIRACLE_ASSET_BASE_URL, MIRACLE_CHAIN_WINDOW_MS, MIRACLE_MANIFEST_URL, MIRACLE_OMEN_DISPLAY_MS, MIRACLE_OMEN_MIN_INTERVAL_MS, RAINBOW_RATE, RANDOM_BUCKET_COUNT, RECORD_STORAGE_KEY, REMOTE_MIRACLE_BAD_URL_CACHE_MS, REMOTE_MIRACLE_MANIFEST_CACHE_MS, REMOTE_MIRACLE_VIDEO_DISPLAY_MS, SCORE_STORAGE_BONUS_INTERVAL, SECRET_KEY_MAX_LENGTH, SECRET_KEY_SEQUENCES, SHAPE_RATE, SHOOTING_STAR_RATE, SMALL_MIRACLE_MIN_INTERVAL_MS, STUCK_EXPLODE_FRAMES, STUCK_NUDGE_FRAMES, SWORD_IMPACT_RATE, TIME_STOP_DURATION_MS, USER_PREFERENCES_STORAGE_KEY, USER_PROFILE_STORAGE_KEY, type RareSoundFlavor } from "./miracle/constants";
import { drawSparkle, drawStarPath, getSpecialIconColors, hexToRgbTriplet, roundRect } from "./miracle/drawing";
import { MAGIC_CIRCLE_DEFS, getMagicCircleMarkSvg, type MagicCircleDef } from "./miracle/magicCircles";
import { loadSavedRecords, loadUserPreferences, loadUserProfile, saveSavedRecords, saveUserProfileData } from "./miracle/localData";
import { clamp, escapeCsv, escapeHtml, formatDateTime, formatDurationMs, formatElapsedTime, formatProbability, getBrowserName, getDateKey, getTodayKey, hashTextToNumber, isMobileDevice, loadExternalScript, parseLabels } from "./miracle/utils";
import { getDailyMissions, getDailyMissionValue, getResearchRankInfo, getThemeCollection, getThemeForTime, pickRandomTheme } from "./miracle/progression";
import type {
    DropKind,
    ProbabilityMode,
    SpecialEventDef,
    MiracleLogEntry,
    FusionDef,
    DailyFortune,
    MiracleClip,
    RemoteMiracleAsset,
    RemoteMiracleAssetSource,
    RemoteMiracleManifest,
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
    SecretDef,
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
    RarePinDef,
    PachinkoYakumonoKind,
    PachinkoYakumonoDef,
    TutorialMissionDef,
    TapRipple,
    ResearchReportEntry,
    FamiliarKind,
    FamiliarMode,
    FamiliarState,
} from "./miracle/types";

let offlineLabController: OfflineLabController | null = null;

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
function ensureMobileViewportMeta(): void {
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
    document.body.style.height = "100dvh";
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
}

ensureMobileViewportMeta();

const isMobile = isMobileDevice();
const uiFontPx = isMobile ? 25 : 20;
const uiButtonFontPx = isMobile ? 26 : 20;
const DEFAULT_BACKGROUND_IMAGE_URL = `${import.meta.env.BASE_URL}favicon.png`;
const ROUNDED_UI_FONT = `"M PLUS Rounded 1c", "Zen Maru Gothic", "Kosugi Maru", "Hiragino Maru Gothic ProN", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif`;
const MIRACLE_GACHA_ONCE_COST = 100000;
const MIRACLE_GACHA_TEN_COST = 900000;
const SETTINGS_UI_ZOOM_STORAGE_KEY = "miracle_settings_ui_zoom_v1";
type GachaPointSavedRecords = SavedRecords & { gachaPoint?: number };


let settings: Settings = createDefaultSettings(isMobile, DEFAULT_BACKGROUND_IMAGE_URL);
let settingsUiZoom = clamp(Number(localStorage.getItem(SETTINGS_UI_ZOOM_STORAGE_KEY) ?? "1"), 0.82, 1.22);

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
let roughCanvas: any = null;
let jsConfetti: InstanceType<typeof JSConfetti> | null = null;
const howlerCueCache = new Map<string, Howl>();
interface MagicPhysicsField { x: number; y: number; radius: number; strength: number; kind: "vortex" | "repel" | "blackhole" | "wave"; until: number; spin: number; label: string; }
const activeMagicPhysicsFields: MagicPhysicsField[] = [];
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

let randomBuckets = createRandomBuckets(RANDOM_BUCKET_COUNT);
let randomCallCount = 0;
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
let miracleClips: MiracleClip[] = [];
let replayFrameBuffer: string[] = [];
let replayCaptureTick = 0;
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
let mobileAudioUnlocked = false;
let mobileVideoSoundRetryButton: HTMLButtonElement | null = null;
let mobileAudioPrimeElement: HTMLAudioElement | null = null;
let confettiEnabled = true;
applyUserPreferencesToCurrentState();
initAdminLogApi();
installGlobalErrorLogger();
registerAppOpen();
let pixiEnabled = false;
let pixiReady = false;
let pixiApp: Application | null = null;
let pixiParticles: Graphics[] = [];
let animeReady = false;
let tippyReady = false;
let gifReady = false;
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

// ======================================================
// HTML / UI
// ======================================================

document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.width = "100%";
document.documentElement.style.maxWidth = "100%";
document.documentElement.style.height = "100%";
document.documentElement.style.overflow = "hidden";
document.documentElement.style.overscrollBehavior = "none";

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.background = "linear-gradient(180deg, #eef3ff 0%, #f7f4ef 100%)";
document.body.style.fontFamily = ROUNDED_UI_FONT;
document.body.style.overflow = "hidden";
document.body.style.overflowX = "hidden";
document.body.style.width = "100%";
document.body.style.maxWidth = "100%";
document.body.style.height = "100dvh";
document.body.style.position = "fixed";
document.body.style.left = "0";
document.body.style.top = "0";
document.body.style.right = "0";
document.body.style.bottom = "0";
document.body.style.overscrollBehavior = "none";
document.body.style.touchAction = "pan-y";

const globalStyle = document.createElement("style");
globalStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { max-width: 100%; overflow: hidden; }
  body { overscroll-behavior-x: none; font-family: "M PLUS Rounded 1c", "Zen Maru Gothic", "Kosugi Maru", "Hiragino Maru Gothic ProN", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif; }
  button, input, textarea, select, pre, code { font-family: inherit; }
  #miracle-horizontal-guard { width: 100%; max-width: 100%; overflow-x: hidden; }
  body.miracle-black-mode { background:#020617 !important; color:#f8fafc !important; }
  body.miracle-black-mode #miracle-horizontal-guard,
  body.miracle-black-mode #miracle-game-area { background:#020617 !important; color:#f8fafc !important; }
  body.miracle-black-mode #miracle-info-area {
    background:linear-gradient(180deg, rgba(7,12,24,.98) 0%, rgba(10,18,32,.96) 100%) !important;
    color:#f8fafc !important;
  }
  body.miracle-black-mode #miracle-info-area > div,
  body.miracle-black-mode #miracle-info-area section,
  body.miracle-black-mode .miracle-popup-panel,
  body.miracle-black-mode .miracle-mobile-panel {
    background:linear-gradient(180deg, rgba(15,23,42,.96) 0%, rgba(8,15,30,.92) 100%) !important;
    color:#f8fafc !important;
    border-color:rgba(148,163,184,.34) !important;
    box-shadow:0 18px 40px rgba(0,0,0,.45) !important;
  }
  body.miracle-black-mode button {
    background:linear-gradient(180deg,#172033 0%, #0f172a 100%) !important;
    color:#f8fafc !important;
    border-color:#64748b !important;
    box-shadow:0 0 0 1px rgba(255,255,255,.05), 0 8px 22px rgba(0,0,0,.45) !important;
    text-shadow:0 1px 0 rgba(0,0,0,.35);
  }
  body.miracle-black-mode input,
  body.miracle-black-mode textarea,
  body.miracle-black-mode select {
    background:#0f172a !important;
    color:#f8fafc !important;
    border-color:#64748b !important;
    box-shadow:0 0 0 1px rgba(255,255,255,.05), 0 8px 22px rgba(0,0,0,.45) !important;
  }
  body.miracle-black-mode button:hover { filter:brightness(1.15); }
  body.miracle-black-mode canvas { background-color:#020617 !important; }

  body.miracle-theme-active #miracle-info-area {
    background: var(--miracle-theme-panel) !important;
    color: var(--miracle-theme-text) !important;
  }
  body.miracle-theme-active #miracle-info-area .miracle-section,
  body.miracle-theme-active #miracle-info-area .miracle-user-card,
  body.miracle-theme-active #miracle-info-area .miracle-record-hero,
  body.miracle-theme-active .miracle-popup-panel,
  body.miracle-theme-active .miracle-mobile-panel {
    background: var(--miracle-theme-section) !important;
    color: var(--miracle-theme-text) !important;
    border-color: var(--miracle-theme-border) !important;
  }
  body.miracle-theme-active #miracle-info-area button:not([data-fixed-style="1"]),
  body.miracle-theme-active .miracle-popup-panel button:not([data-fixed-style="1"]),
  body.miracle-theme-active .miracle-mobile-panel button:not([data-fixed-style="1"]) {
    background: var(--miracle-theme-button-bg) !important;
    color: var(--miracle-theme-button-text) !important;
    border-color: var(--miracle-theme-button-border) !important;
    text-shadow: none !important;
  }
  body.miracle-theme-active #miracle-info-area input,
  body.miracle-theme-active #miracle-info-area textarea,
  body.miracle-theme-active #miracle-info-area select,
  body.miracle-theme-active .miracle-popup-panel input,
  body.miracle-theme-active .miracle-popup-panel textarea,
  body.miracle-theme-active .miracle-popup-panel select,
  body.miracle-theme-active .miracle-mobile-panel input,
  body.miracle-theme-active .miracle-mobile-panel textarea,
  body.miracle-theme-active .miracle-mobile-panel select {
    background: var(--miracle-theme-field-bg) !important;
    color: var(--miracle-theme-text) !important;
    border-color: var(--miracle-theme-border) !important;
  }
  body.miracle-theme-active #miracle-info-area label,
  body.miracle-theme-active #miracle-info-area .miracle-section > div:first-child,
  body.miracle-theme-active .miracle-popup-panel h1,
  body.miracle-theme-active .miracle-popup-panel h2,
  body.miracle-theme-active .miracle-popup-panel h3 {
    color: var(--miracle-theme-title) !important;
  }
  body.miracle-theme-active .miracle-popup-panel,
  body.miracle-theme-active .miracle-popup-panel div,
  body.miracle-theme-active .miracle-popup-panel p,
  body.miracle-theme-active .miracle-popup-panel li,
  body.miracle-theme-active .miracle-popup-panel td,
  body.miracle-theme-active .miracle-popup-panel th,
  body.miracle-theme-active .miracle-mobile-panel,
  body.miracle-theme-active .miracle-mobile-panel div,
  body.miracle-theme-active .miracle-mobile-panel p,
  body.miracle-theme-active .miracle-mobile-panel li,
  body.miracle-theme-active .miracle-mobile-panel td,
  body.miracle-theme-active .miracle-mobile-panel th,
  body.miracle-theme-active .miracle-mobile-panel label {
    color: var(--miracle-theme-text) !important;
  }
  body.miracle-theme-active .miracle-mobile-settings-header {
    background: var(--miracle-theme-section) !important;
    color: var(--miracle-theme-title) !important;
    border-color: var(--miracle-theme-border) !important;
  }
  body.miracle-theme-active .miracle-mobile-settings-header div {
    color: var(--miracle-theme-title) !important;
  }

  /* テーマ色を全体へ強めに反映する。
     以前は一部パネル内だけが対象だったため、スマホ下部ボタンや動的に追加したボタンが
     黄緑系のまま残ることがありました。 */
  body.miracle-theme-active button:not([data-fixed-style="1"]) {
    background: var(--miracle-theme-button-bg) !important;
    color: var(--miracle-theme-button-text) !important;
    border-color: var(--miracle-theme-button-border) !important;
    text-shadow: none !important;
  }
  body.miracle-theme-active input,
  body.miracle-theme-active textarea,
  body.miracle-theme-active select {
    background: var(--miracle-theme-field-bg) !important;
    color: var(--miracle-theme-text) !important;
    border-color: var(--miracle-theme-border) !important;
  }
  body.miracle-theme-active #miracle-info-area > div,
  body.miracle-theme-active .miracle-section,
  body.miracle-theme-active .miracle-user-card,
  body.miracle-theme-active .miracle-record-hero,
  body.miracle-theme-active .miracle-popup-panel,
  body.miracle-theme-active .miracle-mobile-panel {
    background: var(--miracle-theme-section) !important;
    color: var(--miracle-theme-text) !important;
    border-color: var(--miracle-theme-border) !important;
  }

  /* 画面・パネル・入力欄・ボタンの角丸を統一する。 */
  #miracle-game-area,
  #miracle-info-area,
  #miracle-info-area > div,
  .miracle-section,
  .miracle-user-card,
  .miracle-record-hero,
  .miracle-popup-panel,
  .miracle-mobile-panel,
  .miracle-mobile-settings-header {
    border-radius: 26px !important;
  }
  #miracle-info-area {
    border-radius: 30px 30px 0 0 !important;
    overflow: auto;
  }
  button, input, textarea, select {
    border-radius: 999px !important;
  }
  textarea {
    border-radius: 22px !important;
  }
`;
document.head.appendChild(globalStyle);

const bootStartedAt = Date.now();
const bootMinimumDurationMs = 2000;
const faviconUrl = DEFAULT_BACKGROUND_IMAGE_URL;

function preloadImage(src: string): Promise<void> {
    return new Promise((resolve) => {
        let settled = false;
        const timeoutId = window.setTimeout(done, 1200);
        function done(): void {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeoutId);
            resolve();
        }
        const img = new Image();
        img.decoding = "sync";
        img.loading = "eager";
        img.referrerPolicy = "no-referrer";
        img.onload = done;
        img.onerror = () => window.setTimeout(done, 250);
        img.src = src;
        if (img.complete) done();
    });
}

const bootFaviconReady = preloadImage(faviconUrl);
const bootOverlay = document.createElement("div");
bootOverlay.id = "miracle-boot-overlay";
bootOverlay.style.position = "fixed";
bootOverlay.style.inset = "0";
bootOverlay.style.zIndex = "9999";
bootOverlay.style.display = "flex";
bootOverlay.style.flexDirection = "column";
bootOverlay.style.alignItems = "center";
bootOverlay.style.justifyContent = "center";
bootOverlay.style.gap = "18px";
bootOverlay.style.background = "radial-gradient(circle at 50% 38%, #f9fff0 0%, #dceec2 42%, #152019 100%)";
bootOverlay.style.color = "#f8fff0";
bootOverlay.style.textAlign = "center";
bootOverlay.style.transition = "opacity 420ms ease";
bootOverlay.style.pointerEvents = "auto";

const bootIcon = document.createElement("img");
bootIcon.src = faviconUrl;
bootIcon.alt = "ミラクルボールラボ";
bootIcon.decoding = "sync";
bootIcon.loading = "eager";
bootIcon.setAttribute("fetchpriority", "high");
bootIcon.style.width = "min(36vw,156px)";
bootIcon.style.height = "min(36vw,156px)";
bootIcon.style.borderRadius = "30px";
bootIcon.style.objectFit = "contain";
bootIcon.style.filter = "drop-shadow(0 16px 28px rgba(0,0,0,.34))";
bootIcon.style.background = "rgba(255,255,255,.92)";
bootIcon.style.padding = "10px";
bootIcon.style.display = "block";

const bootTitle = document.createElement("div");
bootTitle.textContent = "ミラクルボールラボ";
bootTitle.style.fontSize = "clamp(28px,8vw,58px)";
bootTitle.style.fontWeight = "1000";
bootTitle.style.letterSpacing = ".04em";
bootTitle.style.textShadow = "0 6px 22px rgba(0,0,0,.36)";

const bootLabel = document.createElement("div");
bootLabel.textContent = "ロード中...";
bootLabel.style.fontSize = "clamp(15px,4vw,22px)";
bootLabel.style.fontWeight = "900";
bootLabel.style.opacity = ".92";

const bootBarFrame = document.createElement("div");
bootBarFrame.style.width = "min(64vw,360px)";
bootBarFrame.style.height = "10px";
bootBarFrame.style.borderRadius = "999px";
bootBarFrame.style.background = "rgba(255,255,255,.24)";
bootBarFrame.style.overflow = "hidden";
bootBarFrame.style.boxShadow = "inset 0 0 0 1px rgba(255,255,255,.18)";

const bootBar = document.createElement("div");
bootBar.style.width = "42%";
bootBar.style.height = "100%";
bootBar.style.borderRadius = "999px";
bootBar.style.background = "rgba(255,255,255,.88)";
bootBar.style.animation = "miracle-boot-bar 1.05s ease-in-out infinite";
bootBarFrame.appendChild(bootBar);

const bootAnimationStyle = document.createElement("style");
bootAnimationStyle.textContent = "@keyframes miracle-boot-bar{0%{transform:translateX(-120%)}100%{transform:translateX(260%)}}";

bootOverlay.appendChild(bootIcon);
bootOverlay.appendChild(bootTitle);
bootOverlay.appendChild(bootLabel);
bootOverlay.appendChild(bootBarFrame);
bootOverlay.appendChild(bootAnimationStyle);
document.body.appendChild(bootOverlay);
bootIcon.addEventListener("click", () => {
    bootIconTapCount++;
    playUiSound("tick");
    if (bootIconTapCount >= 5) {
        unlockSecret("favicon-five-taps", "favicon 5連打", "起動ロゴを5回タップしました。ロード画面にも秘密がありました。");
        bootIconTapCount = 0;
    }
});
document.addEventListener("keydown", handleSecretKey);

let bootOverlayHidden = false;
function hideBootOverlay(): void {
    if (bootOverlayHidden) return;
    bootOverlayHidden = true;
    void Promise.all([
        bootFaviconReady,
        new Promise<void>((resolve) => {
            const wait = Math.max(0, bootMinimumDurationMs - (Date.now() - bootStartedAt));
            window.setTimeout(() => resolve(), wait);
        }),
    ]).then(() => {
        bootOverlay.style.opacity = "0";
        window.setTimeout(() => bootOverlay.remove(), 460);
    }).catch(() => {
        bootOverlay.style.opacity = "0";
        window.setTimeout(() => bootOverlay.remove(), 460);
    });
}

// 初期化中にどこかで処理が止まっても、ロード画面だけが残り続けないようにする保険。
window.setTimeout(() => hideBootOverlay(), bootMinimumDurationMs + 300);
window.setTimeout(() => {
    if (!document.body.contains(bootOverlay)) return;
    bootOverlay.style.opacity = "0";
    window.setTimeout(() => bootOverlay.remove(), 460);
}, 4000);

const appRoot = document.createElement("div");
appRoot.id = "miracle-horizontal-guard";
appRoot.style.position = "fixed";
appRoot.style.left = "0";
appRoot.style.top = "0";
appRoot.style.right = "0";
appRoot.style.bottom = "0";
appRoot.style.width = "100vw";
appRoot.style.maxWidth = "100vw";
appRoot.style.height = "100dvh";
appRoot.style.boxSizing = "border-box";
appRoot.style.display = "flex";
appRoot.style.flexDirection = "column";
appRoot.style.overflow = "hidden";
document.body.appendChild(appRoot);

function normalizeAppViewportStyles(): void {
    if (!isMobile) return;
    document.documentElement.style.width = "100%";
    document.documentElement.style.minWidth = "100%";
    document.documentElement.style.height = "100%";
    document.documentElement.style.minHeight = "100%";
    document.body.style.width = "100vw";
    document.body.style.minWidth = "100vw";
    document.body.style.height = "100dvh";
    document.body.style.minHeight = "100dvh";
    appRoot.style.width = "100vw";
    appRoot.style.minWidth = "100vw";
    appRoot.style.height = "100dvh";
    appRoot.style.minHeight = "100dvh";
    appRoot.style.maxWidth = "100vw";
    appRoot.style.maxHeight = "100dvh";
    appRoot.style.overflow = "hidden";
}

normalizeAppViewportStyles();

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
gameArea.appendChild(gameFullscreenButton);

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
appRoot.appendChild(info);

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
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "6px";
    wrapper.style.minWidth = "0";

    const labelElement = document.createElement("label");
    labelElement.textContent = label;
    labelElement.style.fontWeight = "800";
    labelElement.style.color = "#273042";
    labelElement.style.fontSize = `${Math.max(12, uiFontPx - 6)}px`;

    wrapper.appendChild(labelElement);
    wrapper.appendChild(input);
    return { wrapper, labelEl: labelElement };
}

function createInput(value: string, type = "text"): HTMLInputElement {
    const input = document.createElement("input");
    input.type = type;
    input.value = value;
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    input.style.padding = isMobile ? "12px 12px" : "9px 11px";
    input.style.borderRadius = "18px";
    input.style.border = "1px solid rgba(85,105,130,.40)";
    input.style.background = "linear-gradient(180deg,rgba(255,255,255,.92),rgba(228,236,246,.82))";
    input.style.boxShadow = "inset 0 2px 8px rgba(15,23,42,.10), 0 1px 0 rgba(255,255,255,.65)";
    input.style.fontSize = `${uiFontPx}px`;
    input.style.outline = "none";
    input.style.fontFamily = ROUNDED_UI_FONT;
    return input;
}

function createTextarea(value: string): HTMLTextAreaElement {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.rows = isMobile ? 5 : 4;
    textarea.style.width = "100%";
    textarea.style.boxSizing = "border-box";
    textarea.style.padding = isMobile ? "12px 12px" : "9px 11px";
    textarea.style.borderRadius = "18px";
    textarea.style.border = "1px solid rgba(85,105,130,.40)";
    textarea.style.background = "linear-gradient(180deg,rgba(255,255,255,.92),rgba(228,236,246,.82))";
    textarea.style.boxShadow = "inset 0 2px 8px rgba(15,23,42,.10), 0 1px 0 rgba(255,255,255,.65)";
    textarea.style.fontSize = `${uiFontPx}px`;
    textarea.style.outline = "none";
    textarea.style.resize = "vertical";
    textarea.style.fontFamily = ROUNDED_UI_FONT;
    return textarea;
}

function getMetallicButtonBackground(primary = false): string {
    return primary
        ? "linear-gradient(180deg,#fff7bf 0%,#ffd65a 22%,#c58a10 54%,#fff1a6 100%)"
        : "linear-gradient(180deg,#ffffff 0%,#dfe8f3 18%,#8fa3b7 50%,#f9fbff 100%)";
}

function applyUnifiedMetallicButtonStyle(button: HTMLButtonElement, primary = false): void {
    button.style.width = "100%";
    button.style.minWidth = "0";
    button.style.height = isMobile ? "46px" : "44px";
    button.style.minHeight = isMobile ? "46px" : "44px";
    button.style.maxHeight = isMobile ? "46px" : "44px";
    button.style.padding = isMobile ? "5px 8px" : "5px 10px";
    button.style.border = primary ? "1px solid rgba(126,87,0,.55)" : "1px solid rgba(70,88,112,.42)";
    button.style.borderRadius = "999px";
    button.style.background = getMetallicButtonBackground(primary);
    button.style.boxShadow = primary
        ? "inset 0 1px 0 rgba(255,255,255,.82), inset 0 -5px 10px rgba(105,62,0,.20), 0 8px 18px rgba(126,87,0,.18)"
        : "inset 0 1px 0 rgba(255,255,255,.92), inset 0 -5px 10px rgba(30,42,58,.16), 0 8px 18px rgba(30,42,58,.14)";
    button.style.color = primary ? "#3b2600" : "#142033";
    button.style.cursor = "pointer";
    button.style.boxSizing = "border-box";
    button.style.whiteSpace = "normal";
    button.style.overflowWrap = "anywhere";
    button.style.wordBreak = "keep-all";
    button.style.lineHeight = "1.08";
    button.style.textAlign = "center";
    button.style.fontFamily = ROUNDED_UI_FONT;
    button.style.fontWeight = "1000";
    button.style.fontSize = isMobile ? "12px" : "13px";
    button.style.textShadow = "0 1px 0 rgba(255,255,255,.55)";
    button.style.overflow = "hidden";
}

function getMetallicPanelBackground(dark = false): string {
    return dark
        ? "linear-gradient(135deg,rgba(15,23,42,.86) 0%,rgba(30,41,59,.72) 46%,rgba(148,163,184,.24) 100%)"
        : "linear-gradient(135deg,rgba(255,255,255,.76) 0%,rgba(222,235,247,.62) 38%,rgba(180,198,218,.46) 70%,rgba(255,255,255,.66) 100%)";
}

function createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = text;
    applyUnifiedMetallicButtonStyle(button);
    button.onclick = onClick;
    return button;
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
    settingsUiZoom = clamp(Number(settingsZoomInput.value) / 100, 0.82, 1.22);
    applySettingsUiZoom();
};
settingsZoomInput.onchange = () => {
    localStorage.setItem(SETTINGS_UI_ZOOM_STORAGE_KEY, String(settingsUiZoom));
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
const miracleGachaButton = setTooltip(setButtonLabel(createButton("奇跡ガチャ", () => showMiracleGachaPopup()), "奇跡ガチャ", "Gacha"), "保存動画や超レア演出と連動するド派手なガチャを開きます。", "Open the dramatic miracle gacha.");
utilityButtons.appendChild(miracleGachaButton);
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

const fullScreenButton = setTooltip(setButtonLabel(createButton("全画面", () => toggleGameFullscreen()), "全画面", "Fullscreen"), "実験画面だけを大きく表示します。", "Expand only the game screen." );
utilityButtons.appendChild(fullScreenButton);
// よく使う操作を先頭へまとめる。append済み要素をprependするとDOM上で移動されるため安全です。
utilityButtons.prepend(runButton, miracleGachaButton, magicCircleButton, homeButton);

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

const offlineVideoButton = setTooltip(setButtonLabel(createButton("動画保存", () => { void showOfflineVideoDownloadPopup(); }), "動画保存", "Save videos"), "動画演出をブラウザ内に保存して、オフラインでも再生しやすくします。", "Save video effects in this browser for offline playback.");
displayButtons.appendChild(offlineVideoButton);
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
resultOverlay.style.height = "100dvh";
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
celebrationOverlay.style.height = "100dvh";
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
miracleOverlay.style.height = "100dvh";
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
remoteMiracleVideoOverlay.style.height = "100dvh";
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
let remoteMiracleAssets: RemoteMiracleAsset[] = [];
let remoteMiracleAssetsLoadedAt = 0;
let remoteMiracleAssetsLoading: Promise<RemoteMiracleAsset[]> | null = null;
let activeRemoteMiracleVideo: HTMLVideoElement | null = null;
const REMOTE_MIRACLE_MANIFEST_BACKUP_STORAGE_KEY = "miracleBallLab.remoteManifestBackup.v1";
let remoteMiracleVideoTimer: number | undefined;
let remoteMiracleBadUrls = new Map<string, number>();

const flashOverlay = document.createElement("div");
flashOverlay.style.position = "fixed";
flashOverlay.style.left = "0";
flashOverlay.style.top = "0";
flashOverlay.style.width = "100vw";
flashOverlay.style.height = "100dvh";
flashOverlay.style.zIndex = "119";
flashOverlay.style.pointerEvents = "none";
flashOverlay.style.display = "none";
flashOverlay.style.background = "rgba(255,255,255,0)";
document.body.appendChild(flashOverlay);

const helpOverlay = document.createElement("div");
helpOverlay.style.position = "fixed";
helpOverlay.style.left = "0";
helpOverlay.style.top = "0";
helpOverlay.style.width = "100vw";
helpOverlay.style.height = "100dvh";
helpOverlay.style.background = "rgba(5, 8, 18, 0.78)";
helpOverlay.style.color = "#1f2a18";
helpOverlay.style.zIndex = "130";
helpOverlay.style.display = "none";
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
tutorialMissionPanel.style.pointerEvents = isMobile ? "auto" : "none";
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

helpOverlay.addEventListener("click", (event) => {
    const actionButton = (event.target as HTMLElement | null)?.closest?.("[data-home-action]") as HTMLElement | null;
    if (actionButton) {
        event.preventDefault();
        event.stopPropagation();
        runLabHomeAction(actionButton.dataset.homeAction || "");
        return;
    }
    if (event.target === helpOverlay) closeHelpPopup();
}, true);
helpOverlay.addEventListener("pointerup", (event) => {
    const actionButton = (event.target as HTMLElement | null)?.closest?.("[data-home-action]") as HTMLElement | null;
    if (!actionButton) return;
    event.preventDefault();
    event.stopPropagation();
    runLabHomeAction(actionButton.dataset.homeAction || "");
}, { capture: true, passive: false });
window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && helpOverlay.style.display !== "none") closeHelpPopup();
    if (event.key === "Escape" && mobileSettingsOverlay && mobileSettingsOverlay.style.display !== "none") closeMobileSettingsPopup();
});

// ======================================================
// Utility
// ======================================================

function appRandom(): number {
    const value = Math.random();
    const index = Math.min(RANDOM_BUCKET_COUNT - 1, Math.floor(value * RANDOM_BUCKET_COUNT));
    randomBuckets[index]++;
    randomCallCount++;
    return value;
}

function randomColor(): string {
    return `hsl(${Math.floor(appRandom() * 360)}, ${70 + Math.floor(appRandom() * 25)}%, ${52 + Math.floor(appRandom() * 18)}%)`;
}

function randomRgba(alpha: number): string {
    const hue = Math.floor(appRandom() * 360);
    return `hsla(${hue}, 95%, 58%, ${alpha})`;
}

async function ensureAnimeReady(): Promise<boolean> {
    animeReady = true;
    return true;
}

async function ensureTippyReady(): Promise<boolean> {
    tippyReady = true;
    initButtonTooltips();
    return true;
}

async function ensureGifReady(): Promise<boolean> {
    gifReady = true;
    return true;
}

function initButtonTooltips(): void {
    updateTooltipText();
    for (const item of tooltipRefs) {
        if ((item.el as any)._tippy) continue;
        tippy(item.el, {
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
    return Math.max(0, Math.floor(((savedRecords as GachaPointSavedRecords).gachaPoint ?? 0)));
}

function setGachaPoint(point: number): void {
    (savedRecords as GachaPointSavedRecords).gachaPoint = Math.max(0, Math.floor(point));
}

function addGachaPoint(point: number, reason: string, showToast = true): number {
    const safePoint = Math.max(0, Math.floor(point));
    if (safePoint <= 0) return getGachaPoint();
    setGachaPoint(getGachaPoint() + safePoint);
    saveRecords();
    if (showToast) showSoftToast(`奇跡ガチャP +${safePoint.toLocaleString()}：${reason}`);
    return getGachaPoint();
}

function spendGachaPoint(point: number): boolean {
    const safePoint = Math.max(0, Math.floor(point));
    if (getGachaPoint() < safePoint) return false;
    setGachaPoint(getGachaPoint() - safePoint);
    saveRecords();
    return true;
}

function getGachaPointRewardForRank(rank: string): number {
    const score = getRankScore(rank);
    if (rank === "GOD" || rank === "EX" || score >= getRankScore("GOD")) return 10;
    if (score >= getRankScore("SSR")) return 3;
    if (score >= getRankScore("SR")) return 1;
    return 0;
}

function awardExperimentFinishGachaPoint(): number {
    let point = 1;
    if (finishedCount >= 1000) point += 1;
    addGachaPoint(point, finishedCount >= 1000 ? "実験完了 + 1000玉以上投下" : "実験完了", false);
    return point;
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

let globalErrorLogCount = 0;
const MAX_GLOBAL_ERROR_LOGS_PER_SESSION = 80;

function stringifyErrorForAdminLog(value: unknown): string {
    try {
        if (value instanceof Error) {
            return [value.name, value.message, value.stack].filter(Boolean).join(" | ").slice(0, 900);
        }
        if (typeof value === "string") return value.slice(0, 900);
        const json = JSON.stringify(value, (_key, current) => {
            if (typeof current === "function") return `[Function ${current.name || "anonymous"}]`;
            if (current instanceof Error) return { name: current.name, message: current.message, stack: current.stack };
            return current;
        });
        return (json || String(value)).slice(0, 900);
    } catch {
        return String(value).slice(0, 900);
    }
}

function writeRuntimeErrorToAdminLog(label: string, detail: string): void {
    if (globalErrorLogCount >= MAX_GLOBAL_ERROR_LOGS_PER_SESSION) return;
    globalErrorLogCount += 1;
    try {
        recordAdminEvent({
            type: "video_fail",
            at: Date.now(),
            label,
            rank: "ERROR",
            detail,
        });
    } catch {
        // ログ保存自体の失敗でさらにエラーを増やさない。
    }
}

function installGlobalErrorLogger(): void {
    const originalConsoleError = console.error.bind(console);
    let logging = false;

    window.addEventListener("error", (event) => {
        const detail = `${event.message || "runtime error"} @ ${event.filename || "unknown"}:${event.lineno || 0}:${event.colno || 0}${event.error ? " | " + stringifyErrorForAdminLog(event.error) : ""}`;
        writeRuntimeErrorToAdminLog("runtime_error", detail);
    });

    window.addEventListener("unhandledrejection", (event) => {
        writeRuntimeErrorToAdminLog("unhandled_rejection", stringifyErrorForAdminLog(event.reason));
    });

    console.error = (...args: unknown[]) => {
        originalConsoleError(...args);
        if (logging) return;
        logging = true;
        try {
            writeRuntimeErrorToAdminLog("console_error", args.map(stringifyErrorForAdminLog).join(" / "));
        } finally {
            logging = false;
        }
    };
}

function applyUserPreferencesToCurrentState(): void {
    const prefs = userPreferences;
    if (!prefs || typeof prefs !== "object") return;
    settings = { ...settings, ...prefs };
    if (prefs.speedLabelText) speedLabelText = prefs.speedLabelText;
    if (prefs.theme) currentTheme = prefs.theme;
    if (prefs.themeAutoMode) themeAutoMode = prefs.themeAutoMode;
    if (prefs.themeAutoMode) settings.themeAutoMode = prefs.themeAutoMode;
    if (typeof prefs.soundEnabled === "boolean") soundEnabled = prefs.soundEnabled;
    if (typeof prefs.confettiEnabled === "boolean") confettiEnabled = prefs.confettiEnabled;
    if (prefs.language === "en") isEnglish = true;
}

function saveUserPreferencesFromCurrentState(): void {
    const prefs: UserPreferences = {
        version: 1,
        targetCount: settings.targetCount,
        activeLimit: settings.activeLimit,
        binCount: settings.binCount,
        pinRows: settings.pinRows,
        labelText: settings.labelText,
        backgroundImage: settings.backgroundImage === selectedBackgroundObjectUrl ? DEFAULT_BACKGROUND_IMAGE_URL : settings.backgroundImage,
        simpleMode: settings.simpleMode,
        cameraShakeEnabled: settings.cameraShakeEnabled,
        slowMiracleEffects: settings.slowMiracleEffects,
        effectsEnabled: settings.effectsEnabled,
        commentaryEnabled: settings.commentaryEnabled,
        boardAnomalyEnabled: settings.boardAnomalyEnabled,
        normalBallTraitsEnabled: settings.normalBallTraitsEnabled,
        timeBallSkinsEnabled: settings.timeBallSkinsEnabled,
        mobileCompactMode: settings.mobileCompactMode,
        lowSpecMode: settings.lowSpecMode,
        showRecentMiracles: settings.showRecentMiracles,
        familiarEnabled: settings.familiarEnabled,
        blackModeEnabled: settings.blackModeEnabled,
        effectMode: settings.effectMode,
        probabilityMode: settings.probabilityMode,
        speedLabelText,
        theme: currentTheme,
        themeAutoMode,
        soundEnabled,
        confettiEnabled,
        language: isEnglish ? "en" : "ja",
    };
    userPreferences = prefs;
    try { localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(prefs)); } catch {}
}

let userPreferenceSaveTimer: number | undefined;
function persistUserPreferencesSoon(): void {
    if (userPreferenceSaveTimer !== undefined) window.clearTimeout(userPreferenceSaveTimer);
    userPreferenceSaveTimer = window.setTimeout(() => saveUserPreferencesFromCurrentState(), 250);
}

function registerAppOpen(): void {
    recordAdminEvent({ type: "app_open", at: Date.now(), detail: `${browserName} / ${window.innerWidth}x${window.innerHeight}` });
    const today = getDateKey();
    const last = userProfile.lastPlayedDateKey;
    const yesterday = getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    userProfile.openCount += 1;
    userProfile.lastOpenedAt = Date.now();
    if (last !== today) {
        userProfile.consecutiveDays = last === yesterday ? userProfile.consecutiveDays + 1 : 1;
        userProfile.lastPlayedDateKey = today;
    }
    saveUserProfile();
}

function getUserPlayStyleLabel(style: UserPlayStyle): string {
    const ja: Record<UserPlayStyle, string> = { standard: "標準", viewer: "演出を見る", collector: "図鑑収集", recording: "録画・SNS" };
    const en: Record<UserPlayStyle, string> = { standard: "Standard", viewer: "Effects", collector: "Collection", recording: "Recording" };
    return isEnglish ? en[style] : ja[style];
}

function getAppOnlineStatusHtml(): string {
    const online = navigator.onLine;
    const swReady = "serviceWorker" in navigator;
    return `
        <span class="miracle-status-pill">${online ? "オンライン" : "オフライン"}</span>
        <span class="miracle-status-pill">${swReady ? "オフライン起動準備あり" : "Service Workerなし"}</span>
        <span class="miracle-status-pill">v${APP_VERSION}</span>
    `;
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
    const rows = getDailyMissions(today).map((mission) => {
        const value = Math.min(getDailyMissionValue(mission, context), mission.target);
        const percent = mission.target > 0 ? Math.min(100, (value / mission.target) * 100) : 0;
        const done = !!completedMap[mission.id] || value >= mission.target;
        return `
            <div class="miracle-user-card" style="margin:12px 0;">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                    <b>${done ? "✅" : "⬜"} ${escapeHtml(mission.title)}</b>
                    <span class="miracle-status-pill">+${mission.rewardScore.toLocaleString()}</span>
                </div>
                <div style="margin-top:6px;opacity:.86;">${escapeHtml(mission.description)}</div>
                <div style="margin-top:10px;height:12px;border-radius:999px;background:rgba(100,116,139,.22);overflow:hidden;"><div style="height:100%;width:${percent.toFixed(1)}%;background:linear-gradient(90deg,#86efac,#22d3ee);"></div></div>
                <div style="margin-top:6px;font-size:.92em;opacity:.82;">${value.toLocaleString()} / ${mission.target.toLocaleString()}　報酬テーマ: ${getThemeDisplayName(mission.themeHint)}</div>
            </div>`;
    }).join("");
    showPopup("デイリー研究", `
        <p>毎日変わる研究ミッションです。達成するとスコアとテーマ解放が進みます。</p>
        ${rows}
        <p style="opacity:.75;">日付: ${today} / 実験完了時に自動判定します。</p>
    `);
}

function showResearchRankPopup(): void {
    const rank = getCurrentResearchRankInfo();
    showPopup("研究員ランク", `
        <div class="miracle-user-card">
            <p style="font-size:1.3em;margin-top:0;"><b>Lv.${rank.level} ${escapeHtml(rank.label)}</b></p>
            <div style="height:16px;border-radius:999px;background:rgba(100,116,139,.22);overflow:hidden;"><div style="height:100%;width:${rank.progressPercent.toFixed(1)}%;background:linear-gradient(90deg,#fbbf24,#a78bfa,#22d3ee);"></div></div>
            <p>研究ポイント: <b>${rank.score.toLocaleString()}</b>${rank.progressPercent >= 100 ? " / 最高ランク到達" : ` / 次 ${rank.nextScore.toLocaleString()}`}</p>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>ランクに影響するもの</b></p>
            <ul style="line-height:1.8;margin-bottom:0;">
                <li>通算スコア、最高スコア</li>
                <li>実験完了回数</li>
                <li>発見済み奇跡の種類</li>
                <li>奇跡合成・秘密解放</li>
                <li>最高レア度</li>
            </ul>
        </div>
    `);
}

function showThemeBookPopup(): void {
    const entries = getThemeCollection(savedRecords, getDiscoveredKindCount(), getFusionCountForRank(), getSecretCountForRank());
    const rows = entries.map((entry) => `
        <div class="miracle-user-card" style="margin:10px 0;opacity:${entry.unlocked ? "1" : ".62"};">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                <b>${entry.unlocked ? "🎨" : "🔒"} ${escapeHtml(isEnglish ? entry.en : entry.ja)}</b>
                <span class="miracle-status-pill">${entry.unlocked ? "解放済み" : "未解放"}</span>
            </div>
            <div style="margin-top:6px;opacity:.84;">${escapeHtml(entry.reason)}</div>
            ${entry.unlocked ? `<button style="margin-top:10px;" data-theme-book-select="${entry.value}">このテーマにする</button>` : ""}
        </div>`).join("");
    const unlocked = entries.filter((x) => x.unlocked).length;
    showPopup("テーマ図鑑", `
        <p>テーマの解放状況です。テーマは見た目のカスタマイズ・毎日の遊び直し要素として使えます。</p>
        <p><b>${unlocked} / ${entries.length}</b> 解放済み</p>
        ${rows}
    `);
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

function getProbabilityScale(): number {
    if (settings.probabilityMode === "festival") return 5;
    if (settings.probabilityMode === "hard") return 0.35;
    if (settings.probabilityMode === "hell") return 0.08;
    return 1;
}

function getPassiveMiracleBoost(): number {
    if (!isStarted || isFinished) return 1;
    const elapsedSec = Math.max(0, (Date.now() - startTime) / 1000);
    return clamp(1 + Math.floor(elapsedSec / 20) * 0.06, 1, 6);
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

function getMiracleFeatureText(def: SpecialEventDef): string {
    const prefix = def.label.replace(/mode$/i, "モード").replace(/\s+/g, "");
    const specialMap: Record<string, string> = {
        cosmicEgg: "研究ログの最後にだけ名前が残る、極秘扱いの奇跡です。",
        labExplosion: "研究所の空気まで騒がしくなる、全部盛り級の事故演出です。",
        poseidonMode: "盤面が海の気配に染まり、最後まで世界観を持っていきます。",
        zeusuMode: "雷鳴の主役。出た瞬間から画面のテンションが明らかに変わります。",
        hadesuMode: "暗さと重さで押してくる、低温なのに圧のある奇跡です。",
        heartMode: "かわいさで盤面を支配する、甘めの暴走イベントです。",
        nekochanMode: "急に猫派の世界になります。説明不能ですが人気は高いです。",
        lifeQuoteMode: "急に言葉で殴ってくる、音声つきの哲学枠です。",
        blackSun: "光るのに不穏。見た瞬間に普通のレアとは別物だとわかります。",
        timeRift: "時間の縫い目みたいな演出で、盤面の空気を一段変えます。",
        obsidianKing: "王の中でも重厚寄り。静かなのに存在感が異様です。",
        crown: "定番の当たり役。見慣れてもちゃんとうれしい王道レアです。",
        silverUfo: "スッと現れて妙に記憶に残る、SF寄りのごほうび演出です。",
        angelRing: "軽やかで明るい、SSRらしい見栄え担当です。",
        blueFlame: "静かに熱い系。派手さよりも青の異質感で刺してきます。",
        shootingStar: "通過時間は短いのに、出たあと妙に印象が残るスピード系です。",
        heart: "甘さ全振りの幸運印。画面が一気にやさしい空気になります。",
        luckySeven: "数字ネタなのにちゃんと縁起がいい、遊び心の強いレアです。",
    };
    if (specialMap[def.kind]) return specialMap[def.kind];
    if (def.rank === "GOD") return `${prefix}は、その回の空気をまるごと持っていく別格の奇跡です。`;
    if (def.rank === "EX") return `${prefix}は、見た瞬間に盤面のルールが少し変わった気がする異常系レアです。`;
    if (def.rank === "UR") return `${prefix}は、出たらその回を覚えていられる記念写真向けの奇跡です。`;
    if (def.rank === "SSR") return `${prefix}は、比較的会いやすいのに見栄えが強いサービス枠レアです。`;
    return `${prefix}は、数を回しているとふっと混ざる、うれしい日常型レアです。`;
}

function escapeSvgText(text: string): string {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function isCatMiracle(def: SpecialEventDef): boolean {
    return /猫|ねこ|neko|cat/i.test(`${def.kind} ${def.label} ${def.symbol} ${def.emoji}`);
}

function createOriginalCatMiracleSvg(def: SpecialEventDef): string {
    const rank = escapeSvgText(def.rank);
    const label = escapeSvgText(def.label);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
        <defs>
            <radialGradient id="bg" cx="36%" cy="22%">
                <stop offset="0%" stop-color="#fff7db"/>
                <stop offset="55%" stop-color="#ffb36b"/>
                <stop offset="100%" stop-color="#7c2d12"/>
            </radialGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="12" stdDeviation="8" flood-color="#000000" flood-opacity=".32"/>
            </filter>
        </defs>
        <rect width="320" height="320" rx="44" fill="#111827"/>
        <circle cx="58" cy="62" r="28" fill="#ffe8a3" opacity=".95"/>
        <circle cx="258" cy="80" r="8" fill="#ffffff" opacity=".65"/>
        <circle cx="282" cy="112" r="5" fill="#ffffff" opacity=".5"/>
        <g filter="url(#shadow)">
            <path d="M83 122 L111 58 L147 110 Q160 104 174 110 L211 58 L238 122 Q260 151 253 194 Q243 258 160 263 Q77 258 67 194 Q60 151 83 122 Z" fill="url(#bg)" stroke="#fff1c7" stroke-width="8" stroke-linejoin="round"/>
            <path d="M103 118 L113 88 L132 116" fill="#7c2d12" opacity=".38"/>
            <path d="M188 116 L207 88 L217 118" fill="#7c2d12" opacity=".38"/>
            <ellipse cx="126" cy="168" rx="18" ry="23" fill="#18202f"/>
            <ellipse cx="194" cy="168" rx="18" ry="23" fill="#18202f"/>
            <circle cx="132" cy="160" r="5" fill="#ffffff"/>
            <circle cx="200" cy="160" r="5" fill="#ffffff"/>
            <path d="M160 183 C151 183 146 190 153 196 C157 199 163 199 167 196 C174 190 169 183 160 183 Z" fill="#7c2d12"/>
            <path d="M160 198 C150 213 132 211 126 201" fill="none" stroke="#7c2d12" stroke-width="6" stroke-linecap="round"/>
            <path d="M160 198 C170 213 188 211 194 201" fill="none" stroke="#7c2d12" stroke-width="6" stroke-linecap="round"/>
            <path d="M96 185 H57 M101 203 H59 M224 185 H263 M219 203 H261" stroke="#fff1c7" stroke-width="6" stroke-linecap="round" opacity=".9"/>
            <path d="M95 239 Q126 272 159 244 Q193 272 225 239" fill="none" stroke="#fff1c7" stroke-width="7" stroke-linecap="round" opacity=".9"/>
        </g>
        <text x="160" y="45" text-anchor="middle" font-size="30" font-family="M PLUS Rounded 1c, Zen Maru Gothic, Noto Sans JP, sans-serif" font-weight="900" fill="#f8fafc">${rank}</text>
        <text x="160" y="303" text-anchor="middle" font-size="22" font-family="M PLUS Rounded 1c, Zen Maru Gothic, Noto Sans JP, sans-serif" font-weight="900" fill="#fff7ed">${label}</text>
    </svg>`;
}

function createMiracleImageDataUri(def: SpecialEventDef): string {
    if (isCatMiracle(def)) {
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createOriginalCatMiracleSvg(def))}`;
    }
    const bg = def.fillStyle;
    const symbol = escapeSvgText(def.symbol || "奇");
    const rank = escapeSvgText(def.rank);
    const emoji = escapeSvgText(def.emoji || def.symbol || "✨");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
        <defs>
            <radialGradient id="g" cx="30%" cy="25%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="45%" stop-color="${bg}"/>
                <stop offset="100%" stop-color="#111827"/>
            </radialGradient>
        </defs>
        <rect width="320" height="320" rx="42" fill="#0f172a"/>
        <circle cx="160" cy="132" r="92" fill="url(#g)" stroke="rgba(255,255,255,.65)" stroke-width="10"/>
        <text x="160" y="155" text-anchor="middle" font-size="96" font-family="M PLUS Rounded 1c, Zen Maru Gothic, Segoe UI Emoji, Noto Sans JP, sans-serif" font-weight="900" fill="#ffffff">${symbol}</text>
        <text x="160" y="58" text-anchor="middle" font-size="30" font-family="M PLUS Rounded 1c, Zen Maru Gothic, Segoe UI Emoji, Noto Sans JP, sans-serif" font-weight="900" fill="#f8fafc">${rank}</text>
        <text x="160" y="280" text-anchor="middle" font-size="44" font-family="M PLUS Rounded 1c, Zen Maru Gothic, Segoe UI Emoji, Noto Sans JP, sans-serif" font-weight="900" fill="#f8fafc">${emoji}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}


function openMobileSettingsPopup(): void {
    if (!mobileSettingsOverlay) return;
    mobileSettingsOverlay.style.display = "flex";
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
    playUiSound("close");
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
    info.appendChild(dock);

    mobileDockRunButton = createButton(t("実行", "Run"), () => startExperiment());
    mobileDockRunButton.style.width = "100%";
    mobileDockRunButton.style.height = "66px";
    mobileDockRunButton.style.fontSize = "21px";
    dock.appendChild(mobileDockRunButton);

    mobileDockPauseButton = createButton(t("一時停止", "Pause"), () => {});
    mobileDockPauseButton.onclick = null;
    mobileDockPauseButton.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        togglePause();
    }, { passive: false });
    mobileDockPauseButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
    mobileDockPauseButton.style.width = "100%";
    mobileDockPauseButton.style.height = "66px";
    mobileDockPauseButton.style.fontSize = "20px";
    dock.appendChild(mobileDockPauseButton);

    const mobileDockMagicButton = createButton(t("魔法陣", "Magic"), () => enableMagicCircleMode());
    mobileDockMagicButton.style.width = "100%";
    mobileDockMagicButton.style.height = "66px";
    mobileDockMagicButton.style.fontSize = "19px";
    dock.appendChild(mobileDockMagicButton);

    mobileDockSettingsButton = createButton(t("設定", "Settings"), () => openMobileSettingsPopup());
    mobileDockSettingsButton.style.width = "100%";
    mobileDockSettingsButton.style.height = "66px";
    mobileDockSettingsButton.style.fontSize = "20px";
    dock.appendChild(mobileDockSettingsButton);

    mobileSettingsOverlay = document.createElement("div");
    mobileSettingsOverlay.style.position = "fixed";
    mobileSettingsOverlay.style.inset = "0";
    mobileSettingsOverlay.style.display = "none";
    mobileSettingsOverlay.style.alignItems = "stretch";
    mobileSettingsOverlay.style.justifyContent = "center";
    mobileSettingsOverlay.style.background = "rgba(5,8,18,.22)";
    mobileSettingsOverlay.style.backdropFilter = "blur(8px)";
    mobileSettingsOverlay.style.zIndex = "140";
    mobileSettingsOverlay.style.padding = "0";
    document.body.appendChild(mobileSettingsOverlay);
    mobileSettingsOverlay.onclick = (event) => {
        if (event.target === mobileSettingsOverlay) closeMobileSettingsPopup();
    };

    mobileSettingsPanel = document.createElement("div");
    mobileSettingsPanel.className = "miracle-mobile-panel";
    mobileSettingsPanel.style.width = "100%";
    mobileSettingsPanel.style.height = "100dvh";
    mobileSettingsPanel.style.maxHeight = "100dvh";
    mobileSettingsPanel.style.background = "linear-gradient(135deg,rgba(255,255,255,.20),rgba(190,205,224,.12),rgba(255,255,255,.16))";
    mobileSettingsPanel.style.backdropFilter = "blur(30px) saturate(1.55) contrast(1.08)";
    mobileSettingsPanel.style.borderTopLeftRadius = "0";
    mobileSettingsPanel.style.borderTopRightRadius = "0";
    mobileSettingsPanel.style.boxShadow = "0 -12px 40px rgba(0,0,0,.28)";
    mobileSettingsPanel.style.padding = "0 12px 22px 12px";
    mobileSettingsPanel.style.overflowY = "auto";
    mobileSettingsPanel.style.overflowX = "hidden";
    mobileSettingsPanel.style.overscrollBehavior = "contain";
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
}

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
    gameArea.style.height = "100dvh";
    gameArea.style.maxWidth = "100vw";
    gameArea.style.maxHeight = "100dvh";
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

function getUiAccentPaletteByKind(kind: DropKind | null): { panel: string; section: string; fieldBg: string; fieldText: string; border: string; badge: string; badgeText: string; title: string; subtitle: string } | null {
    if (!kind) return null;
    const map: Record<string, { panel: string; section: string; fieldBg: string; fieldText: string; border: string; badge: string; badgeText: string; title: string; subtitle: string }> = {
        poseidonMode: { panel: 'linear-gradient(180deg, rgba(232,246,255,.97) 0%, rgba(192,229,255,.90) 100%)', section: 'linear-gradient(180deg, rgba(235,248,255,.95) 0%, rgba(205,233,255,.88) 100%)', fieldBg: '#f2fbff', fieldText: '#07203c', border: '#79c8ff', badge: 'linear-gradient(180deg,#d7f1ff 0%,#7dc8ff 100%)', badgeText: '#05264b', title: '#08315e', subtitle: '#13548b' },
        zeusuMode: { panel: 'linear-gradient(180deg, rgba(255,250,222,.97) 0%, rgba(255,239,176,.90) 100%)', section: 'linear-gradient(180deg, rgba(255,251,228,.95) 0%, rgba(255,238,183,.88) 100%)', fieldBg: '#fffbea', fieldText: '#453100', border: '#ffe75a', badge: 'linear-gradient(180deg,#fff3b0 0%,#ffd54a 100%)', badgeText: '#3e2f00', title: '#513b00', subtitle: '#876300' },
        hadesuMode: { panel: 'linear-gradient(180deg, rgba(26,10,10,.96) 0%, rgba(44,8,8,.92) 100%)', section: 'linear-gradient(180deg, rgba(30,8,8,.95) 0%, rgba(16,4,4,.92) 100%)', fieldBg: '#210808', fieldText: '#ffe7e7', border: '#ff7d7d', badge: 'linear-gradient(180deg,#3b0b0b 0%,#6f1414 100%)', badgeText: '#fff3f3', title: '#fff3f3', subtitle: '#ffb0b0' },
        heartMode: { panel: 'linear-gradient(180deg, rgba(255,240,248,.97) 0%, rgba(255,215,232,.90) 100%)', section: 'linear-gradient(180deg, rgba(255,242,249,.95) 0%, rgba(255,221,239,.88) 100%)', fieldBg: '#fff6fb', fieldText: '#5c173c', border: '#ff70ba', badge: 'linear-gradient(180deg,#ffd7ec 0%,#ff8cc3 100%)', badgeText: '#5c173c', title: '#8a1d55', subtitle: '#b92c72' },
        nekochanMode: { panel: 'linear-gradient(180deg, rgba(255,246,234,.97) 0%, rgba(255,228,198,.90) 100%)', section: 'linear-gradient(180deg, rgba(255,247,238,.95) 0%, rgba(255,229,205,.88) 100%)', fieldBg: '#fff8f1', fieldText: '#4a2a11', border: '#ffbf76', badge: 'linear-gradient(180deg,#ffe6c8 0%,#ffb56e 100%)', badgeText: '#4a2a11', title: '#5d3515', subtitle: '#8f5729' },
        crown: { panel: 'linear-gradient(180deg, rgba(255,247,224,.97) 0%, rgba(255,232,165,.90) 100%)', section: 'linear-gradient(180deg, rgba(255,249,230,.95) 0%, rgba(255,235,178,.88) 100%)', fieldBg: '#fffbee', fieldText: '#413000', border: '#ffd54a', badge: 'linear-gradient(180deg,#fff0a9 0%,#ffd54a 100%)', badgeText: '#3e2f00', title: '#5a4300', subtitle: '#8a6700' },
        blackSun: { panel: 'linear-gradient(180deg, rgba(16,0,6,.96) 0%, rgba(32,0,12,.92) 100%)', section: 'linear-gradient(180deg, rgba(25,0,10,.95) 0%, rgba(15,0,6,.92) 100%)', fieldBg: '#19030b', fieldText: '#ffeef2', border: '#ff4775', badge: 'linear-gradient(180deg,#5a0018 0%,#aa1238 100%)', badgeText: '#fff5f7', title: '#fff3f5', subtitle: '#ff9db7' },
        cosmicEgg: { panel: 'linear-gradient(180deg, rgba(237,247,255,.97) 0%, rgba(200,240,255,.90) 100%)', section: 'linear-gradient(180deg, rgba(240,249,255,.95) 0%, rgba(208,244,255,.88) 100%)', fieldBg: '#f2fcff', fieldText: '#06273a', border: '#65e7ff', badge: 'linear-gradient(180deg,#d9f9ff 0%,#72e9ff 100%)', badgeText: '#08314a', title: '#0c3a5a', subtitle: '#16689a' },
    };
    return map[kind] ?? null;
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
    if (!settings.familiarEnabled) return;
    const def = getCurrentFamiliarDef();
    const now = Date.now();
    const scale = geometry.scale;
    const baseX = isMobile ? geometry.width - 52 * scale : geometry.width - 72 * scale;
    const baseY = isMobile ? 70 * scale : 82 * scale;
    const bob = Math.sin(now / 420) * 5 * scale;
    const pulse = now < familiarPulseUntil ? 1 + Math.sin(now / 80) * 0.09 : 1;
    const r = Math.max(24 * scale, isMobile ? 30 : 28) * pulse;
    context.save();
    context.globalAlpha = settings.lowSpecMode ? 0.88 : 0.96;
    context.shadowColor = def.accent;
    context.shadowBlur = settings.lowSpecMode ? 0 : 18 * scale;
    context.fillStyle = def.color;
    context.beginPath();
    context.arc(baseX, baseY + bob, r, 0, Math.PI * 2);
    context.fill();
    context.lineWidth = Math.max(2, 3 * scale);
    context.strokeStyle = def.accent;
    context.stroke();
    context.shadowBlur = 0;
    context.font = `900 ${Math.round(r * 1.05)}px "Segoe UI Emoji", "Noto Sans JP", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#ffffff";
    context.fillText(def.emoji, baseX, baseY + bob + 1 * scale);
    context.font = `900 ${Math.round(clamp(12 * scale, 11, 18))}px "Noto Sans JP", sans-serif`;
    context.fillStyle = settings.blackModeEnabled ? "#f8fafc" : "#111827";
    context.fillText(`Lv.${familiarState.level}`, baseX, baseY + bob + r + 13 * scale);
    if (familiarMessage && now < familiarMessageUntil) {
        const w = Math.min(geometry.width * 0.72, 360 * scale);
        const h = 34 * scale;
        const x = Math.max(12 * scale, baseX - w + 22 * scale);
        const y = baseY + bob + r + 28 * scale;
        context.globalAlpha = 0.92;
        context.fillStyle = settings.blackModeEnabled ? "rgba(15,23,42,.92)" : "rgba(255,255,255,.92)";
        roundRect(context, x, y, w, h, 14 * scale);
        context.fill();
        context.globalAlpha = 1;
        context.fillStyle = def.accent;
        context.font = `900 ${Math.round(clamp(13 * scale, 12, 19))}px "Noto Sans JP", sans-serif`;
        context.fillText(familiarMessage, x + w / 2, y + h / 2);
    }
    context.restore();
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
    const rows = miracleTicketState.history.slice(0, 12).map((entry) => `
        <div style="padding:10px 0;border-bottom:1px solid rgba(80,90,120,.14);">
            <b>${escapeHtml(entry.label)}</b> <span style="font-weight:900;">+${entry.amount}</span> <span style="opacity:.72;">${entry.kind}</span><br>
            <span style="opacity:.7;">${escapeHtml(entry.reason)} / ${new Date(entry.at).toLocaleString()}</span>
        </div>
    `).join("") || `<p style="opacity:.75;">まだチケット履歴はありません。SR以上の奇跡を観測すると集まりやすいです。</p>`;
    showPopup("奇跡チケット", `
        <p>奇跡を観測するとチケットを入手できます。使用すると今回の研究スコアにブーストを入れられます。</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:12px 0;">
            <div style="border-radius:16px;background:rgba(255,255,255,.72);padding:12px;"><b>通常</b><br><span style="font-size:1.5em;font-weight:900;">${miracleTicketState.normal.toLocaleString()}</span></div>
            <div style="border-radius:16px;background:rgba(255,255,255,.72);padding:12px;"><b>レア</b><br><span style="font-size:1.5em;font-weight:900;">${miracleTicketState.rare.toLocaleString()}</span></div>
            <div style="border-radius:16px;background:rgba(255,255,255,.72);padding:12px;"><b>神域</b><br><span style="font-size:1.5em;font-weight:900;">${miracleTicketState.divine.toLocaleString()}</span></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;">
            <button id="ticket-small-boost">通常3枚で小ブースト</button>
            <button id="ticket-rare-boost">通常8枚+レア1枚で大ブースト</button>
            <button id="ticket-divine-boost">神域1枚で超ブースト</button>
        </div>
        <h3>履歴</h3>
        <div style="border-radius:18px;background:rgba(255,255,255,.64);padding:4px 14px;">${rows}</div>
    `);
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
    const rows = SECRET_RESEARCH_NOTES.map((note) => {
        const ts = secretResearchNoteState.unlocked[note.id];
        const unlocked = !!ts;
        return `<div style="border-radius:16px;margin:10px 0;padding:12px;background:${unlocked ? "rgba(255,255,255,.74)" : "rgba(15,23,42,.08)"};border:1px solid rgba(15,23,42,.12);">
            <div style="font-weight:900;font-size:1.05em;">${unlocked ? "📖" : "🔒"} ${unlocked ? escapeHtml(note.title) : "未解放の研究ノート"}</div>
            <div style="margin-top:6px;opacity:.78;">ヒント: ${escapeHtml(note.hint)}</div>
            <div style="margin-top:8px;line-height:1.75;">${unlocked ? escapeHtml(note.body) : "条件を満たすと内容が表示されます。"}</div>
            <div style="margin-top:6px;opacity:.62;">${unlocked ? new Date(ts).toLocaleString() : note.source}</div>
        </div>`;
    }).join("");
    showPopup("秘密研究ノート", `
        <p>条件達成で解放される読み物です。ゲームの裏側にある小さな物語として記録されます。</p>
        <p><b>解放:</b> ${Object.keys(secretResearchNoteState.unlocked).length} / ${SECRET_RESEARCH_NOTES.length}</p>
        ${rows}
    `);
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
    const activeHtml = progress.active && familiarExpeditionState.active ? `
        <div style="border-radius:18px;background:rgba(255,255,255,.76);padding:14px;margin:10px 0;">
            <b>遠征中:</b> ${escapeHtml(progress.plan?.title ?? familiarExpeditionState.active.planId)}<br>
            <span style="opacity:.78;">残り ${formatDurationMs(progress.remainingMs)}</span>
            <div style="height:14px;border-radius:999px;background:rgba(15,23,42,.12);overflow:hidden;margin-top:10px;"><div style="width:${progress.percent.toFixed(1)}%;height:100%;background:linear-gradient(90deg,#facc15,#fb7185);"></div></div>
            <button id="expedition-claim" style="margin-top:10px;font-weight:900;" ${progress.complete ? "" : "disabled"}>報酬を受け取る</button>
        </div>
    ` : `<p>現在、遠征中の使い魔はいません。</p>`;
    const planRows = FAMILIAR_EXPEDITION_PLANS.map((plan) => `
        <div style="border-radius:16px;background:rgba(255,255,255,.68);padding:12px;margin:8px 0;border:1px solid rgba(15,23,42,.12);">
            <b>${escapeHtml(plan.title)}</b><br>
            <span style="opacity:.78;">${escapeHtml(plan.description)}</span><br>
            <span style="opacity:.72;">報酬: XP ${plan.xp} / なつき ${plan.affection} / 通常券 ${plan.ticketNormal} / レア券 ${plan.ticketRare}</span><br>
            <button data-expedition-plan="${plan.id}" style="margin-top:8px;font-weight:900;" ${progress.active ? "disabled" : ""}>出発</button>
        </div>`).join("");
    const historyRows = familiarExpeditionState.history.slice(0, 8).map((x) => `<div style="padding:8px 0;border-bottom:1px solid rgba(80,90,120,.12);"><b>${escapeHtml(x.title)}</b> / ${new Date(x.at).toLocaleString()}</div>`).join("") || `<p style="opacity:.7;">遠征履歴はまだありません。</p>`;
    showPopup("使い魔遠征", `
        <p>アプリを閉じている間も、開始時刻からの経過時間で報酬を受け取れます。</p>
        ${activeHtml}
        <h3>遠征先</h3>
        ${planRows}
        <h3>履歴</h3>
        <div style="border-radius:18px;background:rgba(255,255,255,.58);padding:4px 14px;">${historyRows}</div>
    `);
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
    const unlockedRows = FAMILIAR_DEFS.map((item) => {
        const unlocked = Boolean(familiarState.unlocked[item.kind]);
        return `<div style="border-radius:16px;padding:12px;margin:8px 0;background:${unlocked ? "rgba(255,255,255,.72)" : "rgba(15,23,42,.08)"};border:1px solid rgba(15,23,42,.12);">
            <div style="font-weight:900;font-size:1.05em;">${item.emoji} ${item.name} ${unlocked ? "" : "🔒"}</div>
            <div style="opacity:.86;">${escapeHtml(item.description)}</div>
            <div style="margin-top:6px;font-size:.9em;opacity:.8;">秘密契約ヒント: ${item.secretCode ? "専用コードあり" : "最初から同行"}</div>
            ${unlocked ? `<button data-familiar-call="${item.kind}" style="margin-top:8px;font-weight:900;padding:8px 14px;border-radius:999px;">呼び出す</button>` : ""}
        </div>`;
    }).join("");
    showPopup("使い魔研究室", `
        <p><b>${def.emoji} ${escapeHtml(familiarState.name)}</b> が同行中です。</p>
        <div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));">
            <div><b>Lv</b>: ${familiarState.level}</div>
            <div><b>経験値</b>: ${familiarState.xp.toLocaleString()} / 次 ${level.nextXp.toLocaleString()}</div>
            <div><b>なつき度</b>: ${familiarState.affection.toLocaleString()} / ${getFamiliarMood(familiarState)}</div>
            <div><b>補助回数</b>: ${familiarState.assistCount.toLocaleString()}</div>
        </div>
        <div style="margin:12px 0;height:14px;border-radius:999px;background:rgba(15,23,42,.12);overflow:hidden;"><div style="width:${level.progressPercent.toFixed(1)}%;height:100%;background:linear-gradient(90deg,${def.color},${def.accent});"></div></div>
        <p><b>超機能:</b> 実験中に使い魔が自動補助します。幸運は予兆、見張りは捨て区画、暴走は盤面干渉が強めです。</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;">
            <button data-familiar-mode="assist">補助</button>
            <button data-familiar-mode="lucky">幸運</button>
            <button data-familiar-mode="guard">見張り</button>
            <button data-familiar-mode="chaos">暴走</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;">
            <button id="familiar-expedition-button" style="font-weight:900;">使い魔遠征</button>
            <button id="familiar-ticket-button" style="font-weight:900;">奇跡チケット</button>
            <button id="familiar-note-button" style="font-weight:900;">秘密ノート</button>
        </div>
        <p><b>スマホ用秘密契約:</b> PCのキーボードがなくても下の入力で秘密コードを試せます。</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <input id="familiar-secret-input" placeholder="秘密コード" style="flex:1;min-width:160px;padding:12px;border-radius:14px;border:1px solid #b8c1d1;font-size:16px;">
            <button id="familiar-secret-button">契約</button>
        </div>
        <h3 style="margin-top:16px;">使い魔図鑑</h3>
        ${unlockedRows}
    `);
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
    }).join("");
    if (changed && isMobile) {
        tutorialMissionExpanded = true;
        scheduleTutorialMissionCollapse();
    }
    if (forceExpand && isMobile) tutorialMissionExpanded = true;
    if (isMobile && !tutorialMissionExpanded) {
        renderTutorialMissionBadge(clearCount, defs.length);
    } else {
        renderTutorialMissionDetail(rows, clearCount, defs.length);
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
    if (settings.simpleMode || tapRipples.length === 0) return;
    context.save();
    for (let i = tapRipples.length - 1; i >= 0; i--) {
        const ripple = tapRipples[i];
        const p = 1 - ripple.life / ripple.maxLife;
        const radius = (24 + p * 130) * geometry.scale;
        context.globalAlpha = Math.max(0, ripple.life / ripple.maxLife) * 0.72;
        context.strokeStyle = "#93c5fd";
        context.lineWidth = Math.max(2, 5 * geometry.scale * (1 - p));
        context.beginPath();
        context.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        context.stroke();
        if (!isPaused) ripple.life--;
        if (ripple.life <= 0) tapRipples.splice(i, 1);
    }
    context.restore();
}

function getResearchEvaluation(): { grade: string; type: string; density: number; note: string } {
    const specialCount = Object.values(specialCreated).reduce((a, b) => a + b, 0);
    const chainCount = Object.keys(unlockedChainRunIds).length;
    const discardRate = finishedCount > 0 ? discardedCount / finishedCount : 0;
    const centerIndex = Math.floor(settings.binCount / 2);
    const centerCount = binCounts[centerIndex] ?? 0;
    const centerRate = finishedCount > 0 ? centerCount / finishedCount : 0;
    const density = Math.round(clamp(specialCount * 16 + chainCount * 24 + bestComboThisRun * 7 + smallMiracleCount * 3 + (lastOmenText ? 10 : 0), 0, 100));
    const score = runScore + specialCount * 9000 + chainCount * 18000 + density * 350 - discardRate * 12000;
    const grade = score > 120000 ? "S" : score > 70000 ? "A" : score > 35000 ? "B" : score > 12000 ? "C" : "D";
    const type = specialCount > 0 ? "奇跡観測型" : discardRate <= 0.06 ? "安定研究型" : centerRate >= 0.22 ? "中央集中型" : smallMiracleCount >= 2 ? "予兆多発型" : "基礎観測型";
    const note = grade === "S" ? "研究所の記録に残るかなり濃い実験です。" : grade === "A" ? "見せ場のある良い観測回です。" : grade === "B" ? "小さな変化を拾えた研究回です。" : grade === "C" ? "次回の奇跡に向けた土台作りの回です。" : "静かな基礎データとして保存されました。";
    return { grade, type, density, note };
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

async function shareToSns(): Promise<void> {
    const discovered = getDiscoveredCount();
    const clipCount = miracleClips.length;
    const shareText = `ミラクルボールラボ
スコア: ${runScore.toLocaleString()}
処理数: ${finishedCount.toLocaleString()} / ${settings.targetCount.toLocaleString()}
最高レア: ${savedRecords.bestRank} ${savedRecords.bestLabel}
発見済み: ${discovered}/${SPECIAL_EVENT_DEFS.length}
奇跡クリップ: ${clipCount}件
#MiracleBallLabo #ミラクルボールラボ`;
    try {
        await navigator.clipboard.writeText(shareText);
        showMilestone("SNS投稿文をコピーしました");
    } catch {
        showPopup("SNSシェア", `<pre style="white-space:pre-wrap;font-family:inherit;">${shareText}</pre>`);
        return;
    }
    if (navigator.share) {
        try {
            await navigator.share({ text: shareText, title: "MiracleBallLabo" });
        } catch {
            // 共有ダイアログのキャンセルは無視
        }
    }
}

function saveShareCard(): void {
    const width = 1080;
    const height = 1920;
    const shareCanvas = document.createElement("canvas");
    shareCanvas.width = width;
    shareCanvas.height = height;
    const ctx = shareCanvas.getContext("2d");
    if (!ctx) return;

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#1e293b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fillRect(60, 120, width - 120, 720);
    ctx.fillRect(60, 880, width - 120, 820);

    ctx.fillStyle = "#f8fafc";
    ctx.font = '900 64px "Segoe UI", "Noto Sans JP", sans-serif';
    ctx.fillText("MiracleBallLabo", 100, 210);
    ctx.font = '700 34px "Segoe UI", "Noto Sans JP", sans-serif';
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("ミラクルボールラボ 実験シェアカード", 100, 270);

    const previewW = width - 200;
    const previewH = 480;
    try {
        ctx.drawImage(canvas, 100, 320, previewW, previewH);
    } catch {
        ctx.fillStyle = "#0b1220";
        ctx.fillRect(100, 320, previewW, previewH);
    }

    const lines = [
        `スコア ${runScore.toLocaleString()}`,
        `処理 ${finishedCount.toLocaleString()} / ${settings.targetCount.toLocaleString()}`,
        `最高レア ${savedRecords.bestRank} ${savedRecords.bestLabel}`,
        `発見済み ${getDiscoveredCount()} / ${SPECIAL_EVENT_DEFS.length}`,
        `研究Lv ${getResearchLevelInfo().level} / 合成 ${getFusionCount()} / ${FUSION_DEFS.length}`,
        `今日の奇跡率 x${(currentDailyFortune ?? getDailyFortune()).rateBoost.toFixed(2)}`,
        `奇跡コンボ最高 ${bestComboThisRun}`,
        `ミッション達成 ${Object.values(missionProgress).filter(Boolean).length} / ${missionDefs.length}`,
    ];
    ctx.fillStyle = "#f8fafc";
    ctx.font = '900 48px "Segoe UI", "Noto Sans JP", sans-serif';
    ctx.fillText("RESULT", 100, 960);
    ctx.font = '700 42px "Segoe UI", "Noto Sans JP", sans-serif';
    lines.forEach((line, idx) => ctx.fillText(line, 100, 1050 + idx * 90));
    ctx.fillStyle = "#93c5fd";
    ctx.font = '700 30px "Segoe UI", "Noto Sans JP", sans-serif';
    ctx.fillText("#MiracleBallLabo #ミラクルボールラボ", 100, 1760);

    shareCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `miracle-ball-share-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showMilestone("SNSカードを保存しました");
    }, "image/png");
}

function showMissionPopup(): void {
    const rows = missionDefs.map((mission) => {
        const cleared = !!missionProgress[mission.id];
        const totalClear = savedRecords.missionCompleted[mission.id] ?? 0;
        return `<div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
                <div style="font-weight:900;font-size:${isMobile ? 22 : 18}px;color:${cleared ? "#166534" : "#1f2937"};">${cleared ? "✅" : "⬜"} ${mission.title}</div>
                <div style="font-weight:800;color:#475569;">+${mission.rewardScore.toLocaleString()} score</div>
            </div>
            <div style="margin-top:6px;opacity:.82;line-height:1.55;">${mission.description}</div>
            <div style="margin-top:6px;font-size:${isMobile ? 16 : 14}px;opacity:.72;">通算達成 ${totalClear}回</div>
        </div>`;
    }).join("");
    showPopup("ミッション", `<div style="margin-top:8px;border-radius:18px;background:rgba(255,255,255,.72);padding:${isMobile ? "8px 14px" : "8px 16px"};">${rows}</div>`);
}


function saveCurrentScreenshot(): void {
    const shotCanvas = document.createElement("canvas");
    shotCanvas.width = Math.max(1, canvas.width);
    shotCanvas.height = Math.max(1, canvas.height);
    const ctx = shotCanvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0b0d14";
    ctx.fillRect(0, 0, shotCanvas.width, shotCanvas.height);
    try {
        ctx.drawImage(canvas, 0, 0);
    } catch {
        showPopup("スクリーンショット", "<p>現在の画面保存に失敗しました。</p>");
        return;
    }
    shotCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `miracle-ball-screenshot-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        showMilestone("スクリーンショットを保存しました");
    }, "image/png");
}

function showSharePopup(): void {
    showPopup("録画・SNS", `
        <p>奇跡クリップのGIF保存は「リプレイ」から行えます。ここでは投稿文コピー、現在画面のスクリーンショット保存、縦長シェアカード保存を行えます。</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:18px;">
            <button id="sns-copy-button" style="font-size:18px;padding:12px 18px;border-radius:999px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:900;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);">投稿文コピー</button>
            <button id="screenshot-save-button" style="font-size:18px;padding:12px 18px;border-radius:999px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:900;background:linear-gradient(180deg,#fff7ed 0%,#fed7aa 100%);">現在画面を保存</button>
            <button id="sns-card-button" style="font-size:18px;padding:12px 18px;border-radius:999px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:900;background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);">SNSカード保存</button>
        </div>
    `);
    const copyBtn = document.getElementById("sns-copy-button") as HTMLButtonElement | null;
    const shotBtn = document.getElementById("screenshot-save-button") as HTMLButtonElement | null;
    const cardBtn = document.getElementById("sns-card-button") as HTMLButtonElement | null;
    if (copyBtn) copyBtn.onclick = () => { void shareToSns(); };
    if (shotBtn) shotBtn.onclick = () => saveCurrentScreenshot();
    if (cardBtn) cardBtn.onclick = () => saveShareCard();
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
    const scale = getProbabilityScale() * getPassiveMiracleBoost() * fortune.rateBoost * extraScale;
    let threshold = 0;
    const roll = appRandom();
    for (const def of SPECIAL_EVENT_DEFS) {
        threshold += def.rate * scale;
        if (roll < threshold) return def;
    }
    return null;
}

function rollSpecialEvent(): SpecialEventDef | null {
    return rollSpecialEventWithScale(1);
}

function randomPick(items: string[]): string {
    return items[Math.floor(appRandom() * items.length)] ?? items[0] ?? "";
}

function buildWeirdMiracleText(def: SpecialEventDef): string {
    const weird = [
        `${def.label}が出ました。研究員が一瞬だけ敬語になりました。`,
        `${def.label}を観測。確率が廊下で正座しています。`,
        `これは${def.label}です。ブラウザの中で小さい祭りが始まりました。`,
        `${def.label}発生。普通の玉たちが見なかったことにしています。`,
        `${def.label}です。たぶん今日の運を少し前借りしました。`,
        `${def.label}を確認。捨て区間まで静かに拍手しています。`,
        `${def.label}が来ました。乱数が変な汗をかいています。`,
        `${def.label}。現実が3フレームだけ読み込み直されました。`,
        `${def.label}です。主任が「サンプル数を増やせ」と言っています。`,
        `${def.label}観測。これはもう玉ではなく事件です。`,
    ];
    const danger = getProbabilityDangerText(def.denominator);
    return `${randomPick(weird)}<br>${danger}`;
}

function getProbabilityDangerText(denominator: number): string {
    if (denominator >= 1_000_000_000) return "確率のヤバさ：日常ではなく伝説。出たら画面を二度見してください。";
    if (denominator >= 10_000_000) return "確率のヤバさ：運営に確認したくなる級。ほぼ都市伝説です。";
    if (denominator >= 1_000_000) return "確率のヤバさ：もう事件。普通に動画のオチになります。";
    if (denominator >= 100_000) return "確率のヤバさ：長時間回してやっと会えるかも、くらいです。";
    if (denominator >= 10_000) return "確率のヤバさ：普通にレア。出たらちょっと勝ちです。";
    return "確率のヤバさ：まあまあ珍しい。小さめの奇跡です。";
}



function getDailyFortune(): DailyFortune {
    const dateKey = getTodayKey();
    const seed = hashTextToNumber(`${dateKey}:miracle-ball-lab`);
    const titles = ["大吉", "中吉", "小吉", "研究日和", "乱数注意", "捨て区間警報", "奇跡濃度高め"];
    const advices = [
        "通常速度で眺めると、演出を見逃しにくい日です。",
        "投下数を少し増やすと、研究ログが育ちやすい日です。",
        "捨て区間に入りやすい気配があります。ピンを軽く揺らすとよさそうです。",
        "録画・SNSカード向けの見栄えが出やすい日です。",
        "同じSR/SSRが続くと演出が短縮されるので、長時間放置に向いています。",
    ];
    const luckyDefs = SPECIAL_EVENT_DEFS.length > 0 ? SPECIAL_EVENT_DEFS : BASE_SPECIAL_EVENT_DEFS;
    const lucky = luckyDefs[seed % luckyDefs.length];
    const rateBoost = 1 + ((seed >>> 5) % 17) / 100;
    return {
        dateKey,
        title: titles[seed % titles.length] ?? "研究日和",
        rateBoost,
        luckyKind: lucky?.label ?? "王",
        luckyBin: (seed % Math.max(1, settings.binCount)) + 1,
        advice: advices[(seed >>> 9) % advices.length] ?? advices[0],
        seed,
    };
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
    showPopup("今日の運勢・奇跡率", `
        <div style="display:grid;gap:12px;">
            <div style="font-size:${isMobile ? "30px" : "26px"};font-weight:1000;">${fortune.title}</div>
            <div><b>今日の奇跡率:</b> x${fortune.rateBoost.toFixed(2)}</div>
            <div><b>今日の注目奇跡:</b> ${fortune.luckyKind}</div>
            <div><b>ラッキー受け皿:</b> ${fortune.luckyBin}</div>
            <div style="line-height:1.7;">${fortune.advice}</div>
            <div style="opacity:.7;font-size:${isMobile ? "15px" : "13px"};">日付ごとに固定されます。奇跡率はレア抽選にほんの少しだけ加算されます。</div>
        </div>
    `);
}

function showFusionPopup(): void {
    const rows = FUSION_DEFS.map((fusion) => {
        const unlocked = getFusionUnlocked(fusion);
        const ready = getFusionReady(fusion);
        const sources = fusion.sourceKinds.map((kind) => {
            const def = findSpecialDef(kind);
            const count = savedRecords.discovered[kind] ?? 0;
            return `${def?.label ?? kind} ${count}/${fusion.requiredCount}`;
        }).join(" / ");
        return `<div style="padding:13px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">
                <div style="font-weight:1000;font-size:${isMobile ? "22px" : "18px"};color:${unlocked ? "#166534" : ready ? "#854d0e" : "#334155"};">${unlocked ? "✅" : ready ? "🧪" : "🔒"} ${unlocked || ready ? fusion.label : "未解放の派生奇跡"} [${fusion.rank}]</div>
                <div style="font-weight:900;color:#475569;">+${fusion.rewardScore.toLocaleString()} score</div>
            </div>
            <div style="margin-top:6px;opacity:.80;line-height:1.55;">${unlocked ? fusion.description : "素材奇跡を集めると解放されます。"}</div>
            <div style="margin-top:6px;opacity:.72;">素材: ${sources}</div>
        </div>`;
    }).join("");
    const chainRows = MIRACLE_CHAIN_DEFS.map((chain) => {
        const names = chain.sequence.map((kind) => findSpecialDef(kind)?.label ?? kind).join(" → ");
        const unlocked = !!unlockedChainRunIds[chain.id];
        return `<div style="padding:10px 0;border-bottom:1px dashed rgba(80,90,120,.18);"><b>${unlocked ? "✅" : "🔁"} ${chain.label} [${chain.rank}]</b><div style="margin-top:4px;opacity:.74;">順番: ${names}</div><div style="margin-top:4px;opacity:.74;">${chain.description}</div></div>`;
    }).join("");
    showPopup("奇跡合成・派生", `<p>特定の奇跡を観測すると、合成・派生の研究記録が解放されます。</p>${rows}<h3 style="margin-top:18px;">実験中の奇跡連鎖</h3><p>下記の順番で奇跡が続くと、その実験中だけの連鎖演出が発生します。</p>${chainRows}`);
}

function getSecretDefs(): SecretDef[] {
    return [
        { id: "keyword-miracle", label: "MIRACLE コード", hint: "PCで研究所の合言葉を英字入力", detail: "キーボードで隠しコードを入力しました。今日の研究所は少しだけ騒がしくなります。", rewardScore: 7777 },
        { id: "keyword-lab", label: "LAB コード", hint: "研究所の短縮名を英字入力", detail: "短い研究所コードを入力しました。", rewardScore: 5000 },
        { id: "keyword-neko", label: "NEKO コード", hint: "猫っぽい英字を入力", detail: "ねこちゃんモードの気配を呼びました。", rewardScore: 5000 },
        { id: "keyword-sun", label: "SUN コード", hint: "太陽に関係する英字を入力", detail: "黒い太陽を探す研究者用の短縮コードです。", rewardScore: 5000 },
        { id: "favicon-five-taps", label: "favicon 5連打", hint: "起動画面のロゴを連打", detail: "起動ロゴを5回タップしました。ロード画面にも秘密がありました。", rewardScore: 7777 },
        { id: "pause-seven-taps", label: "時間停止ごっこ", hint: "一時停止を短時間に何度も操作", detail: "一時停止操作を短時間に7回行いました。時間を止めようとする研究記録です。", rewardScore: 9000 },
        { id: "settings-three-open", label: "設定室の常連", hint: "スマホの設定画面を何度か開く", detail: "スマホ設定画面を3回開きました。設定画面にも観測ログが残ります。", rewardScore: 6000 },
        { id: "familiar-neko", label: "使い魔契約: ねこ式使い魔", hint: "使い魔研究室かPCキー入力で猫系コード", detail: "ねこ式使い魔を解放しました。", rewardScore: 14000 },
        { id: "familiar-kuro", label: "使い魔契約: 黒羽コウモリ", hint: "使い魔研究室かPCキー入力で黒羽系コード", detail: "黒羽コウモリを解放しました。", rewardScore: 14000 },
        { id: "familiar-tokei", label: "使い魔契約: 時計キツネ", hint: "使い魔研究室かPCキー入力で時計系コード", detail: "時計キツネを解放しました。", rewardScore: 14000 },
        { id: "familiar-hoshi", label: "使い魔契約: 星くらげ", hint: "使い魔研究室かPCキー入力で星系コード", detail: "星くらげを解放しました。", rewardScore: 14000 },
        { id: "familiar-miko", label: "使い魔契約: 秘密巫女うさぎ", hint: "使い魔研究室かPCキー入力で短い秘密コード", detail: "秘密巫女うさぎを解放しました。", rewardScore: 14000 },
        { id: "skill-combo-lab", label: "三種の介入", hint: "実験中に衝撃波→磁石→時止めの順で使う", detail: "盤面介入スキルを決まった順番で使いました。研究員が完全に介入しています。", rewardScore: 12000 },
    ];
}

function unlockSecret(id: string, label: string, detail: string, rewardScore?: number): void {
    if (savedRecords.secretUnlocked[id]) {
        showMilestone(label + " 起動");
        return;
    }
    const def = getSecretDefs().find((x) => x.id === id);
    const score = rewardScore ?? def?.rewardScore ?? 7777;
    savedRecords.secretUnlocked[id] = Date.now();
    addScore(score, "SECRET " + label);
    saveRecords();
    playSecretSound();
    showPopup("秘密操作を発見", "<p><b>" + label + "</b> を解放しました。</p><p>" + detail + "</p><p>報酬: +" + score.toLocaleString() + " score</p><p>研究レベルに少しだけボーナスが入ります。</p>");
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
    showPopup("合言葉", `
        <p>研究主任モードに入るための合言葉を入力してください。</p>
        <input id="admin-passcode-input" type="password" autocomplete="off" placeholder="合言葉" style="width:100%;box-sizing:border-box;padding:${isMobile ? "16px" : "12px 14px"};border-radius:18px;border:1px solid #b8c1d1;font-size:${uiFontPx}px;font-family:${ROUNDED_UI_FONT};">
        <div id="admin-passcode-message" style="margin-top:10px;font-weight:900;color:#7f1d1d;min-height:1.4em;"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
            <button id="admin-unlock-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:12px 22px;border-radius:999px;border:1px solid rgba(87,112,51,.28);background:linear-gradient(180deg,#fee2e2 0%,#fecaca 100%);color:#7f1d1d;cursor:pointer;">解放する</button>
        </div>
    `);
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
        .map((def) => `<button class="admin-miracle-button" data-kind="${def.kind}" style="font-size:${isMobile ? "16px" : "15px"};font-weight:900;padding:10px 12px;border-radius:14px;border:1px solid rgba(127,29,29,.24);background:linear-gradient(180deg,#fff7ed 0%,#fed7aa 100%);color:#7c2d12;cursor:pointer;text-align:left;white-space:normal;overflow-wrap:anywhere;line-height:1.2;">${def.label}<br><span style="font-size:.82em;opacity:.78;">[${def.rank}] ${formatProbability(def.denominator)}</span></button>`)
        .join("");
    showPopup("研究主任モード", `
        <p><b>管理者専用のテスト操作です。</b> 1兆分の1級の演出もボタンで強制発動できます。</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${isMobile ? "150px" : "180px"},1fr));gap:10px;margin:14px 0;">
            <button id="admin-cosmic-egg-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(127,29,29,.25);background:linear-gradient(180deg,#2e1065 0%,#111827 100%);color:#fff;cursor:pointer;">宇宙卵<br><span style="font-size:.75em;">1兆分の1</span></button>
            <button id="admin-sword-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(14,116,144,.25);background:linear-gradient(180deg,#e0f2fe 0%,#bae6fd 100%);color:#0c4a6e;cursor:pointer;">剣の衝撃</button>
            <button id="admin-all-effects-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(87,112,51,.25);background:linear-gradient(180deg,#dcfce7 0%,#bbf7d0 100%);color:#14532d;cursor:pointer;">演出系を全部ON</button>
            <button id="admin-r2-video-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(14,116,144,.25);background:linear-gradient(180deg,#e0f2fe 0%,#bae6fd 100%);color:#0c4a6e;cursor:pointer;">R2動画確認</button>
            <button id="admin-log-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(87,112,51,.25);background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);color:#26351f;cursor:pointer;">管理者ログ</button>
            <button id="admin-tempura-secret-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(245,158,11,.32);background:linear-gradient(180deg,#fff7ed 0%,#fdba74 100%);color:#7c2d12;cursor:pointer;">穴子天ぷら</button>
            <button id="admin-magic-answer-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(88,28,135,.25);background:linear-gradient(180deg,#f3e8ff 0%,#ddd6fe 100%);color:#581c87;cursor:pointer;">魔法陣回答</button>
            <button id="admin-skill-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(87,112,51,.25);background:linear-gradient(180deg,#eef2ff 0%,#c7d2fe 100%);color:#312e81;cursor:pointer;">スキル+99</button>
            <button id="admin-unlock-book-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(87,112,51,.25);background:linear-gradient(180deg,#fef9c3 0%,#fde68a 100%);color:#713f12;cursor:pointer;">図鑑テスト解放</button>
            <button id="admin-lock-button" style="font-size:${uiButtonFontPx}px;font-weight:900;padding:12px;border-radius:18px;border:1px solid rgba(127,29,29,.25);background:linear-gradient(180deg,#fee2e2 0%,#fecaca 100%);color:#7f1d1d;cursor:pointer;">管理者解除</button>
        </div>
        <h3 style="margin-top:18px;">全レア演出テスト</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${isMobile ? "142px" : "170px"},1fr));gap:8px;">${miracleButtons}</div>
    `);
    document.getElementById("admin-cosmic-egg-button")!.onclick = () => triggerAdminMiracle("cosmicEgg");
    document.getElementById("admin-sword-button")!.onclick = () => triggerAdminMiracle("swordImpact");
    document.getElementById("admin-all-effects-button")!.onclick = () => adminEnableAllEffects();
    document.getElementById("admin-r2-video-button")!.onclick = () => { void showAdminRemoteVideoTestPopup(); };
    document.getElementById("admin-log-button")!.onclick = () => showAdminStatsPopup();
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
    showPopup("隠し要素：穴子の天ぷら", `
        <div class="miracle-user-card" style="text-align:center;background:radial-gradient(circle at 50% 0%,rgba(255,247,237,.96),rgba(251,191,36,.58),rgba(124,45,18,.20));">
            <div style="font-size:clamp(54px,12vw,110px);line-height:1;">🍤</div>
            <div style="font-size:clamp(24px,5vw,44px);font-weight:1000;margin-top:10px;">穴子の天ぷら、研究所奥義</div>
            <p style="line-height:1.9;text-align:left;max-width:720px;margin:16px auto 0;">管理者用メモ：隠し魔法陣 <b>穴子天ぷら陣</b> を追加済みです。魔法陣判定で選ばれると、衣が流星のように舞う演出として扱われます。表向きはただの研究所ですが、奥では穴子が揚がっています。</p>
        </div>
    `);
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

    showPopup("R2動画確認", `
        <p>R2 の <b>manifest.json</b> を再取得しています。</p>
        <p style="opacity:.72;">${escapeHtml(MIRACLE_MANIFEST_URL)}</p>
    `);

    const assets = await loadRemoteMiracleAssets(true);
    const videos = assets.filter((asset) => asset.kind === "video");

    if (videos.length === 0) {
        showPopup("R2動画確認", `
            <p>manifest.json に動画が見つかりませんでした。</p>
            <p style="opacity:.72;">動画は <code>kind: "video"</code> で登録してください。</p>
        `);
        return;
    }

    const rows = videos.map((asset, index) => {
        const mainUrl = getRemoteMiracleAssetMainUrl(asset);
        const rank = escapeHtml(String(asset.rank ?? "common").toUpperCase());
        const id = escapeHtml(asset.id);
        const seconds = "10秒固定";
        const opacity = asset.opacity ?? 0.45;
        const weight = asset.weight ?? 1;
        const urlText = escapeHtml(mainUrl);

        return `
            <div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.18);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;">
                <div style="min-width:0;">
                    <div style="font-weight:1000;font-size:${isMobile ? "18px" : "16px"};">
                        ${index + 1}. [${rank}] ${id}
                    </div>
                    <div style="margin-top:4px;opacity:.78;font-size:${isMobile ? "14px" : "13px"};line-height:1.5;">
                        秒数: ${escapeHtml(seconds)} / 透明度: ${escapeHtml(opacity)} / weight: ${escapeHtml(weight)}
                    </div>
                    <div style="margin-top:4px;opacity:.62;font-size:${isMobile ? "12px" : "12px"};word-break:break-all;">
                        ${urlText}
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    <button class="admin-r2-video-play-button" data-asset-id="${id}" style="font-size:${isMobile ? "16px" : "14px"};font-weight:900;padding:10px 14px;border-radius:999px;border:1px solid rgba(14,116,144,.24);background:linear-gradient(180deg,#e0f2fe 0%,#bae6fd 100%);color:#0c4a6e;cursor:pointer;">再生</button>
                    <button class="admin-r2-video-open-button" data-asset-id="${id}" style="font-size:${isMobile ? "16px" : "14px"};font-weight:900;padding:10px 14px;border-radius:999px;border:1px solid rgba(87,112,51,.24);background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);color:#26351f;cursor:pointer;">URLを開く</button>
                </div>
            </div>
        `;
    }).join("");

    showPopup("R2動画確認", `
        <p><b>${videos.length}件</b> の動画を確認できます。</p>
        <p style="opacity:.72;line-height:1.6;">
            「再生」を押すと、このポップアップを閉じて対象動画を半透明オーバーレイで強制再生します。
        </p>
        <div style="margin-top:10px;border-radius:18px;background:rgba(255,255,255,.70);padding:4px 14px;">
            ${rows}
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
            <button id="admin-r2-video-reload-button" style="font-size:${isMobile ? "18px" : "16px"};font-weight:900;padding:10px 16px;border-radius:999px;border:1px solid rgba(87,112,51,.24);background:linear-gradient(180deg,#fef9c3 0%,#fde68a 100%);color:#713f12;cursor:pointer;">manifest再読込</button>
            <button id="admin-r2-video-stop-button" style="font-size:${isMobile ? "18px" : "16px"};font-weight:900;padding:10px 16px;border-radius:999px;border:1px solid rgba(127,29,29,.24);background:linear-gradient(180deg,#fee2e2 0%,#fecaca 100%);color:#7f1d1d;cursor:pointer;">動画停止</button>
        </div>
    `);

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
    const defs = getSecretDefs();
    const unlockedCount = defs.filter((x) => savedRecords.secretUnlocked[x.id]).length;
    const rows = defs.map((def) => {
        const ts = savedRecords.secretUnlocked[def.id];
        const unlocked = !!ts;
        const title = unlocked ? def.label : "未発見の秘密操作";
        const mark = unlocked ? "✅" : "🔒";
        const titleColor = unlocked ? "#166534" : "#334155";
        const scoreColor = unlocked ? "#166534" : "#64748b";
        const size = isMobile ? "20px" : "17px";
        return "<div style=\"padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);\">" +
            "<div style=\"display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;\">" +
            "<b style=\"font-size:" + size + ";color:" + titleColor + ";\">" + mark + " " + title + "</b>" +
            "<span style=\"font-weight:900;color:" + scoreColor + ";\">+" + def.rewardScore.toLocaleString() + "</span>" +
            "</div>" +
            "<div style=\"margin-top:6px;opacity:.78;line-height:1.55;\">ヒント: " + def.hint + "</div>" +
            "<div style=\"margin-top:4px;opacity:.68;\">" + (unlocked ? new Date(ts).toLocaleString() : "未解放") + "</div>" +
        "</div>";
    }).join("");
    showPopup("秘密操作",
        "<p>秘密操作をゲーム内実績のように整理しました。見つけるとスコアと研究レベルに少しだけ反映されます。</p>" +
        "<p><b>解放状況:</b> " + unlockedCount + " / " + defs.length + "</p>" +
        "<div style=\"border-radius:18px;background:rgba(255,255,255,.70);padding:4px 14px;\">" + rows + "</div>"
    );
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
    const frames = replayFrameBuffer.slice(-18);
    miracleClips.unshift({
        id: `${Date.now()}-${Math.floor(appRandom() * 100000)}`,
        label: def.label,
        rank: def.rank,
        denominator: def.denominator,
        finishedCount,
        createdAt: Date.now(),
        subtitle,
        frames,
    });
    miracleClips = miracleClips.slice(0, 24);
}

function replayClipById(id: string): void {
    const clip = miracleClips.find((x) => x.id === id);
    if (!clip || clip.frames.length === 0) {
        showPopup(t("リプレイ", "Replay"), `<p>${t("再生できるクリップがありません。", "No replay clip is available.")}</p>`);
        return;
    }
    const body = `
        <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="font-weight:900;font-size:${isMobile ? "24px" : "20px"};">${clip.label} [${clip.rank}] ${formatProbability(clip.denominator)}</div>
            <img id="replay-image" src="${clip.frames[0]}" style="width:100%;border-radius:20px;border:1px solid rgba(70,80,110,.16);background:#111;object-fit:contain;" />
            <div style="opacity:.8;">${clip.subtitle}</div>
            <div style="display:flex;justify-content:center;">
                <button id="replay-gif-save-button" style="font-size:${isMobile ? "18px" : "16px"};padding:10px 18px;border-radius:999px;border:1px solid rgba(100,90,180,.28);background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);font-weight:900;cursor:pointer;">${t("GIF保存", "Save GIF")}</button>
            </div>
        </div>`;
    showPopup(`${t("リプレイ", "Replay")}: ${clip.label}`, body);
    const gifButton = document.getElementById("replay-gif-save-button") as HTMLButtonElement | null;
    if (gifButton) gifButton.onclick = () => { void exportClipAsGif(id); };
    const img = document.getElementById("replay-image") as HTMLImageElement | null;
    if (!img) return;
    let index = 0;
    const timer = window.setInterval(() => {
        if (helpOverlay.style.display === "none") {
            window.clearInterval(timer);
            return;
        }
        index = (index + 1) % clip.frames.length;
        img.src = clip.frames[index];
    }, 140);
}

async function exportClipAsGif(id: string): Promise<void> {
    const clip = miracleClips.find((x) => x.id === id);
    if (!clip || clip.frames.length === 0) {
        showPopup(t("GIF保存", "Save GIF"), `<p>${t("保存できるフレームがありません。", "No frames available to export.")}</p>`);
        return;
    }
    const ok = await ensureGifReady();
    if (!ok) {
        showPopup(t("GIF保存", "Save GIF"), `<p>${t("gif.js の読み込みに失敗しました。", "Failed to load gif.js.")}</p>`);
        return;
    }

    const previous = helpOverlay.style.display !== "none" ? helpOverlay.innerHTML : "";
    showPopup(t("GIF保存中", "Rendering GIF"), `<p>${t("GIFを書き出しています。少しお待ちください。", "Rendering the GIF. Please wait a moment.")}</p><div id="gif-progress" style="margin-top:12px;font-weight:900;">0%</div>`);

    try {
        const images = await Promise.all(clip.frames.map((src) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("frame load failed"));
            img.src = src;
        })));
        const width = images[0]?.naturalWidth || geometry.width;
        const height = images[0]?.naturalHeight || geometry.height;
        const gif = new (GIF as any)({
            workers: 2,
            quality: 10,
            width,
            height,
            workerScript: gifWorkerUrl,
            background: "#0b0d14",
        });
        for (const image of images) {
            gif.addFrame(image, { delay: 140 });
        }
        gif.on("progress", (value: number) => {
            const progress = document.getElementById("gif-progress");
            if (progress) progress.textContent = `${Math.round(value * 100)}%`;
        });
        gif.on("finished", (blob: Blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const safeLabel = clip.label.replace(/[\/:*?"<>|]/g, "_");
            a.href = url;
            a.download = `${safeLabel}_${clip.rank}_${clip.finishedCount}.gif`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1500);
            showPopup(t("GIF保存完了", "GIF saved"), `<p>${t("GIFを保存しました。", "The GIF has been saved.")}</p>`);
        });
        gif.render();
    } catch {
        if (previous) helpOverlay.innerHTML = previous;
        showPopup(t("GIF保存", "Save GIF"), `<p>${t("GIF保存に失敗しました。もう一度お試しください。", "GIF export failed. Please try again.")}</p>`);
    }
}

function showReplayPopup(): void {
    if (miracleClips.length === 0) {
        showPopup(t("リプレイ", "Replay"), `<p>${t("まだ奇跡クリップがありません。", "No miracle clips yet.")}</p>`);
        return;
    }
    const rows = miracleClips.map((clip, i) => `
        <div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;">
            <div>
                <div style="font-weight:900;">${i + 1}. ${clip.label} [${clip.rank}]</div>
                <div style="opacity:.76;">${formatProbability(clip.denominator)} / ${clip.finishedCount.toLocaleString()}投目 / ${new Date(clip.createdAt).toLocaleTimeString()}</div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;">
                <button data-replay-id="${clip.id}" style="font-size:${isMobile ? "18px" : "16px"};padding:10px 16px;border-radius:999px;border:1px solid rgba(87,112,51,.28);background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);font-weight:900;cursor:pointer;">${t("再生", "Play")}</button>
                <button data-gif-id="${clip.id}" style="font-size:${isMobile ? "18px" : "16px"};padding:10px 16px;border-radius:999px;border:1px solid rgba(100,90,180,.28);background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);font-weight:900;cursor:pointer;">${t("GIF保存", "Save GIF")}</button>
            </div>
        </div>
    `).join("");
    showPopup(t("奇跡クリップ保存", "Miracle clips"), rows);
    helpOverlay.querySelectorAll("[data-replay-id]").forEach((el) => {
        (el as HTMLButtonElement).onclick = () => replayClipById((el as HTMLButtonElement).dataset.replayId || "");
    });
    helpOverlay.querySelectorAll("[data-gif-id]").forEach((el) => {
        (el as HTMLButtonElement).onclick = () => { void exportClipAsGif((el as HTMLButtonElement).dataset.gifId || ""); };
    });
}

function getUserGuideHtml(): string {
    return `
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>これは何？</b></p>
            <p style="line-height:1.85;">MiracleBallLabは、たくさんの玉を落として、まれに起きる「奇跡」を集めていく実験あそびです。</p>
            <p style="line-height:1.85;">玉がどこに入るか、どんな演出が出るか、どの奇跡を発見できるかをゆっくり眺めながら楽しめます。</p>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>楽しみ方</b></p>
            <ul style="line-height:1.85;margin-bottom:0;">
                <li>まずは「実験を開始」を押して、玉の動きを観察します。</li>
                <li>特別な玉や演出が出ると、奇跡図鑑やアルバムに記録されます。</li>
                <li>実験が終わると、今回の結果が研究レポートとして残ります。</li>
                <li>毎日のミッションや研究員ランクを進めると、少しずつ遊びの幅が広がります。</li>
            </ul>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>スマホで重いとき</b></p>
            <p style="line-height:1.85;">動きが重い、端末が熱くなる、演出が止まりやすい場合は、設定から「低スペック: ON」にしてください。動画や派手な演出を控えめにして遊びやすくします。</p>
        </div>
    `;
}

function showUserGuidePopup(): void {
    showPopup("遊び方", getUserGuideHtml());
}

function pickMiracleGachaDef(): SpecialEventDef {
    // ガチャは簡単に引けないポイント制にしたうえで、超レア排出もかなり低めにします。
    const pool = SPECIAL_EVENT_DEFS.length > 0 ? SPECIAL_EVENT_DEFS : BASE_SPECIAL_EVENT_DEFS;
    const weighted: SpecialEventDef[] = [];
    for (const def of pool) {
        const score = getRankScore(def.rank);
        const weight = score >= getRankScore("GOD") ? 1
            : score >= getRankScore("EX") ? 1
            : score >= getRankScore("SSR") ? 4
            : score >= getRankScore("SR") ? 28
            : 220;
        for (let i = 0; i < weight; i++) weighted.push(def);
    }
    return weighted[Math.floor(appRandom() * weighted.length)] ?? pool[0];
}

async function playGachaRemoteMiracleVideo(def: SpecialEventDef): Promise<void> {
    if (settings.simpleMode) return;
    try {
        const assets = await loadRemoteMiracleAssets(true);
        for (let i = 0; i < 6; i++) {
            const asset = selectRemoteMiracleVideoAsset(assets, def);
            if (!asset) return;
            const played = await playRemoteMiracleVideoAsset(asset, true);
            if (played) return;
        }
    } catch (error) {
        console.warn("[Miracle Gacha] video failed", error);
    }
}

function showAdminMagicCircleAnswerPopup(): void {
    const rows = MAGIC_CIRCLE_DEFS.map((def, index) => `
        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,.72);border:1px solid rgba(80,90,120,.16);text-align:center;">
            ${getMagicCircleMarkSvg(def)}
            <div style="font-weight:1000;font-size:1.05em;">${index + 1}. ${def.emoji} ${escapeHtml(def.label)}</div>
            <div style="margin-top:6px;opacity:.76;line-height:1.65;text-align:left;"><b>${escapeHtml(def.chant)}</b><br>${escapeHtml(def.description)}</div>
            <div style="margin-top:5px;font-size:.84em;opacity:.62;text-align:left;">内部ID: ${escapeHtml(def.kind)}</div>
        </div>
    `).join("");
    showPopup("魔法陣の回答一覧", `
        <p style="line-height:1.8;margin-top:0;">管理者確認用です。各魔法陣の見た目イメージを表示しています。実際の判定は線の長さ、曲がり方、描いた範囲、閉じ具合、点数から分類します。</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(${isMobile ? "180px" : "220px"},1fr));gap:12px;">${rows}</div>
        <p style="line-height:1.8;opacity:.72;margin-bottom:0;">「魔法陣を書く」を押して、上のマークに近い形を盤面へ描いてください。</p>
    `);
}

function getCanvasPointFromEvent(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * geometry.width;
    const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * geometry.height;
    return { x: clamp(x, 0, geometry.width), y: clamp(y, 0, geometry.height) };
}

function getRoughCanvas(): any {
    if (!roughCanvas) {
        try { roughCanvas = rough.canvas(render.canvas); } catch { roughCanvas = null; }
    }
    return roughCanvas;
}

function getJsConfetti(): InstanceType<typeof JSConfetti> | null {
    if (!jsConfetti) {
        try { jsConfetti = new JSConfetti({ canvas: render.canvas }); } catch { jsConfetti = null; }
    }
    return jsConfetti;
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
        if (toneReady) {
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

function fireLibraryParticleBurst(mode: "magic" | "gacha" | "title" | "tempura", x = geometry.width / 2, y = geometry.height * 0.35): void {
    if (settings.simpleMode || !confettiEnabled) return;
    try {
        const canvasRect = render.canvas.getBoundingClientRect();
        const source = {
            x: canvasRect.left + x / Math.max(1, geometry.width) * canvasRect.width,
            y: canvasRect.top + y / Math.max(1, geometry.height) * canvasRect.height,
        };
        party.confetti(source as any, {
            count: mode === "gacha" ? party.variation.range(80, 150) : party.variation.range(35, 80),
            size: party.variation.range(0.8, mode === "tempura" ? 2.0 : 1.45),
            spread: party.variation.range(40, 85),
        });
    } catch {
        // party.js が使えない環境では canvas-confetti 側だけに任せる
    }
    try {
        const jc = getJsConfetti();
        const emojis = mode === "tempura" ? ["🍤", "✨", "🍚"] : mode === "gacha" ? ["💎", "👑", "✨", "🌈"] : mode === "title" ? ["🏅", "✨", "🎉"] : ["🔯", "✨", "⚡", "🌙"];
        void jc?.addConfetti({ emojis, emojiSize: mode === "gacha" ? 44 : 34, confettiNumber: mode === "gacha" ? 55 : 30 });
    } catch {
        // 絵文字紙吹雪失敗は無視
    }
}

function addMagicPhysicsField(kind: MagicPhysicsField["kind"], x: number, y: number, radius: number, strength: number, durationMs: number, label: string): void {
    activeMagicPhysicsFields.push({
        x,
        y,
        radius,
        strength: strength * 7.5,
        kind,
        until: performance.now() + durationMs,
        spin: appRandom() > 0.5 ? 1 : -1,
        label,
    });
    addFloatingText(`物理変態化: ${label}`, x, y - radius * 0.35, "#e0f2fe");
}

function updateMagicPhysicsFields(): void {
    if (activeMagicPhysicsFields.length === 0) return;
    const now = performance.now();
    for (let i = activeMagicPhysicsFields.length - 1; i >= 0; i--) {
        const field = activeMagicPhysicsFields[i];
        if (!field || now > field.until) {
            activeMagicPhysicsFields.splice(i, 1);
            continue;
        }
        const ageRatio = clamp((field.until - now) / 5000, 0.15, 1);
        for (const body of engine.world.bodies) {
            const plugin = (body as any).plugin;
            if (!plugin?.isDrop) continue;
            const dx = field.x - body.position.x;
            const dy = field.y - body.position.y;
            const distSq = dx * dx + dy * dy;
            const maxDist = field.radius;
            if (distSq > maxDist * maxDist || distSq < 1) continue;
            const dist = Math.sqrt(distSq);
            const power = (1 - dist / maxDist) * field.strength * ageRatio;
            let fx = 0;
            let fy = 0;
            if (field.kind === "vortex") {
                fx = (-dy / dist) * power * field.spin;
                fy = (dx / dist) * power * field.spin;
            } else if (field.kind === "repel") {
                fx = (-dx / dist) * power;
                fy = (-dy / dist) * power;
            } else if (field.kind === "blackhole") {
                fx = (dx / dist) * power * 1.25;
                fy = (dy / dist) * power * 1.25;
            } else {
                fx = Math.sin(now / 140 + body.id) * power * 0.9;
                fy = Math.cos(now / 170 + body.id) * power * 0.45;
            }
            Body.applyForce(body, body.position, { x: fx, y: fy });
        }
    }
}

function drawMagicPhysicsFields(context: CanvasRenderingContext2D): void {
    if (activeMagicPhysicsFields.length === 0) return;
    const now = performance.now();
    context.save();
    context.globalCompositeOperation = "lighter";
    for (const field of activeMagicPhysicsFields) {
        const life = clamp((field.until - now) / 5000, 0, 1);
        const pulse = 0.82 + Math.sin(now / 120) * 0.12;
        const grad = context.createRadialGradient(field.x, field.y, field.radius * 0.05, field.x, field.y, field.radius * pulse);
        const color = field.kind === "blackhole" ? "124,58,237" : field.kind === "repel" ? "250,204,21" : field.kind === "wave" ? "56,189,248" : "34,211,238";
        grad.addColorStop(0, `rgba(${color},${0.20 * life})`);
        grad.addColorStop(0.58, `rgba(${color},${0.08 * life})`);
        grad.addColorStop(1, `rgba(${color},0)`);
        context.fillStyle = grad;
        context.beginPath();
        context.arc(field.x, field.y, field.radius * pulse, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = `rgba(${color},${0.28 * life})`;
        context.lineWidth = Math.max(1.5, 3 * geometry.scale);
        context.beginPath();
        context.arc(field.x, field.y, field.radius * (0.45 + 0.08 * Math.sin(now / 160)), 0, Math.PI * 2);
        context.stroke();
    }
    context.restore();
}

function showBrokenResearchNote(reason: string): void {
    const lines = [
        "記録線が震えている。魔法陣は円ではなく、昨日の記憶を描いていた。",
        "研究ノートの端に、存在しないピン番号が浮かんだ。",
        "玉は落下していない。研究所が上昇している可能性がある。",
        "穴子の天ぷらの衣から、微小な重力波を検出した。",
        "このページは手で書かれたように見えるが、誰も筆記していない。",
    ];
    brokenResearchNoteText = `${reason}：${lines[Math.floor(appRandom() * lines.length)] ?? lines[0]}`;
    brokenResearchNoteUntil = performance.now() + 5200;
}

function drawBrokenResearchNote(context: CanvasRenderingContext2D): void {
    if (!brokenResearchNoteText || performance.now() > brokenResearchNoteUntil || settings.simpleMode) return;
    const alpha = clamp((brokenResearchNoteUntil - performance.now()) / 900, 0, 1);
    const w = Math.min(geometry.width * 0.70, 620 * geometry.scale);
    const h = 92 * geometry.scale;
    const x = geometry.width / 2 - w / 2;
    const y = geometry.height * 0.12;
    context.save();
    context.globalAlpha = alpha * 0.92;
    context.fillStyle = "rgba(255,251,235,.88)";
    roundRect(context, x, y, w, h, 20 * geometry.scale);
    context.fill();
    const rc = getRoughCanvas();
    if (rc) {
        rc.rectangle(x + 6, y + 6, w - 12, h - 12, { stroke: "rgba(120,53,15,.70)", strokeWidth: 2.2, roughness: 2.8, bowing: 2.2 });
        rc.line(x + 24, y + h * 0.44, x + w - 24, y + h * 0.38, { stroke: "rgba(180,83,9,.34)", strokeWidth: 1.6, roughness: 3.5 });
    }
    context.fillStyle = "rgba(67,20,7,.92)";
    context.font = `900 ${Math.round(clamp(19 * geometry.scale, 14, 28))}px ${ROUNDED_UI_FONT}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("壊れた研究ノート", x + w / 2, y + 28 * geometry.scale);
    context.font = `800 ${Math.round(clamp(15 * geometry.scale, 11, 20))}px ${ROUNDED_UI_FONT}`;
    context.fillText(brokenResearchNoteText.slice(0, 46), x + w / 2, y + 62 * geometry.scale);
    context.restore();
}

function classifyMagicCircle(points: Array<{ x: number; y: number; t: number }>): MagicCircleDef {
    if (points.length < 2) return MAGIC_CIRCLE_DEFS[0];
    let length = 0;
    let turn = 0;
    let minX = points[0].x, maxX = points[0].x, minY = points[0].y, maxY = points[0].y;
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        length += Math.hypot(b.x - a.x, b.y - a.y);
        minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x);
        minY = Math.min(minY, b.y); maxY = Math.max(maxY, b.y);
        if (i >= 2) {
            const p = points[i - 2];
            const ang1 = Math.atan2(a.y - p.y, a.x - p.x);
            const ang2 = Math.atan2(b.y - a.y, b.x - a.x);
            turn += Math.abs(Math.atan2(Math.sin(ang2 - ang1), Math.cos(ang2 - ang1)));
        }
    }
    const w = maxX - minX;
    const h = maxY - minY;
    const close = Math.hypot(points[0].x - points[points.length - 1].x, points[0].y - points[points.length - 1].y);
    const seed = Math.floor(length * 3 + turn * 97 + w * 5 + h * 7 + close * 11 + points.length * 13);
    return MAGIC_CIRCLE_DEFS[Math.abs(seed) % MAGIC_CIRCLE_DEFS.length] ?? MAGIC_CIRCLE_DEFS[0];
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

function enableTemporaryPinPlacement(): void {
    temporaryPinPlacementEnabled = true;
    magicCircleModeEnabled = false;
    magicCircleDrawing = false;
    magicCirclePoints = [];
    canvas.style.cursor = "copy";
    showSoftToast("盤面をタップすると一時的な観測ピンを設置します");
}

function createIntruderDrop(x: number, y: number, vx: number, vy: number, radiusScale = 1): Matter.Body {
    const radius = geometry.ballRadius * radiusScale;
    const body = Bodies.circle(x, y, radius, {
        restitution: 0.92, friction: 0.01, frictionAir: 0.0018, density: 0.0011,
        render: { fillStyle: "#d9e2ee", strokeStyle: "rgba(255,255,255,.95)", lineWidth: Math.max(1, 2.4 * geometry.scale) } as any,
    });
    (body as any).plugin = createDropPlugin("normal", x, y, radius, { intruder: true, timeBallSkin: "gloss", timeBallSkinLabel: "外部侵入玉" });
    Body.setVelocity(body, { x: vx, y: vy });
    Body.setAngularVelocity(body, (appRandom() - 0.5) * 0.55);
    activeDropCount++;
    return body;
}

function spawnExternalIntruderBalls(count = 12, reason = "event"): void {
    const bodies: Matter.Body[] = [];
    for (let i = 0; i < count; i++) {
        const side = Math.floor(appRandom() * 4);
        const speed = (5 + appRandom() * 7) * geometry.scale;
        let x = -geometry.ballRadius * 3;
        let y = geometry.height * (0.12 + appRandom() * 0.62);
        let vx = speed;
        let vy = (appRandom() - 0.35) * speed;
        if (side === 1) { x = geometry.width + geometry.ballRadius * 3; vx = -speed; }
        else if (side === 2) { x = geometry.width * appRandom(); y = -geometry.ballRadius * 4; vx = (appRandom() - 0.5) * speed; vy = speed; }
        else if (side === 3) { x = geometry.width * appRandom(); y = geometry.height + geometry.ballRadius * 4; vx = (appRandom() - 0.5) * speed; vy = -speed * 0.7; }
        bodies.push(createIntruderDrop(x, y, vx, vy, clamp(0.85 + appRandom() * 0.55, 0.85, 1.4)));
    }
    Composite.add(engine.world, bodies);
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
    overlay.innerHTML = `
        <style>
            @keyframes miracleSummonFade { 0%{opacity:0;transform:scale(.86) rotate(-3deg);} 15%{opacity:1;transform:scale(1.02) rotate(1deg);} 72%{opacity:1;} 100%{opacity:0;transform:scale(1.22) rotate(6deg);} }
            @keyframes miracleSummonRing { 0%{transform:scale(.25) rotate(0deg);opacity:0;} 25%{opacity:.95;} 100%{transform:scale(1.85) rotate(220deg);opacity:0;} }
            @keyframes miracleDragonFly { 0%{transform:translateX(-42vw) scale(.7) rotate(-10deg);opacity:0;} 20%{opacity:1;} 50%{transform:translateX(0) scale(1.35) rotate(4deg);} 100%{transform:translateX(42vw) scale(.9) rotate(12deg);opacity:0;} }
        </style>
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 38%, rgba(255,255,255,.24), rgba(8,12,28,.48) 42%, rgba(0,0,0,.74));mix-blend-mode:screen;"></div>
        <div style="position:absolute;width:min(78vw,760px);height:min(78vw,760px);border-radius:999px;border:5px solid ${def.color};box-shadow:0 0 44px ${def.color}, inset 0 0 34px ${def.color};animation:miracleSummonRing 1500ms ease-out forwards;"></div>
        <div style="position:absolute;width:min(60vw,520px);height:min(60vw,520px);border-radius:999px;background:repeating-conic-gradient(from 0deg, rgba(255,255,255,.72) 0 5deg, transparent 5deg 17deg);clip-path:circle(50%);mix-blend-mode:screen;animation:miracleSummonRing 1650ms ease-out forwards reverse;"></div>
        <div style="text-align:center;color:#fff;text-shadow:0 6px 24px rgba(0,0,0,.7);animation:miracleSummonFade 1900ms ease-out forwards;">
            <div style="font-size:clamp(70px,22vw,210px);line-height:1;filter:drop-shadow(0 0 30px ${def.color});animation:${isDragon ? "miracleDragonFly" : "none"} 1900ms ease-out forwards;">${icon}</div>
            <div style="margin-top:10px;font-size:clamp(28px,7vw,72px);font-weight:1000;letter-spacing:.08em;color:#fff7cc;">${escapeHtml(title)}</div>
            <div style="margin-top:8px;font-size:clamp(15px,3.2vw,26px);font-weight:900;max-width:min(92vw,860px);line-height:1.6;">${escapeHtml(subtitle)}</div>
        </div>`;
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
    fireLibraryParticleBurst(def.kind === "tempura" ? "tempura" : "magic", center.x, center.y);
    playHowlerCue(def.effect === "gear" || def.effect === "mirror" ? "crystal" : "magic", 0.42, 0.85 + appRandom() * 0.35);
    showBrokenResearchNote(def.label);
    showSoftToast(`魔法陣発動: ${def.label} / ${def.chant}`);
    // 発動したことが必ず分かるように、どの魔法陣でも軽い侵入玉と物理場を出します。
    // 個別効果はこの後の switch でさらに上乗せします。
    spawnExternalIntruderBalls(Math.max(4, Math.min(10, Math.round(6 * geometry.scale))), def.label);
    const fieldRadius = clamp(230 * geometry.scale, 150, 420);
    if (["wind", "wave", "gate", "dragon"].includes(def.effect)) addMagicPhysicsField("vortex", center.x, center.y, fieldRadius, 0.00009, 5600, def.label);
    else if (["void", "moon", "clock"].includes(def.effect)) addMagicPhysicsField("blackhole", center.x, center.y, fieldRadius * 1.1, 0.000075, 5200, def.label);
    else if (["sun", "crown", "flower", "earth"].includes(def.effect)) addMagicPhysicsField("repel", center.x, center.y, fieldRadius, 0.000075, 4400, def.label);
    else addMagicPhysicsField("wave", center.x, center.y, fieldRadius, 0.00007, 4800, def.label);
    triggerCameraShake(26 * geometry.scale, 620);
    switch (def.effect) {
        case "sun": spawnExternalIntruderBalls(8, def.label); break;
        case "moon": engine.gravity.y = 4.2; window.setTimeout(() => { if (tiltExperimentEnabled) return; engine.gravity.y = 8; }, 3600); break;
        case "star": spawnExternalIntruderBalls(18, def.label); break;
        case "thunder": triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], "lightning"); break;
        case "wave": triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], "tsunami"); break;
        case "earth": triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], "earthquake"); break;
        case "wind": triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], "typhoon"); break;
        case "gate": spawnExternalIntruderBalls(24, def.label); break;
        case "mirror": triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], "mirror"); break;
        case "dragon": triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], "dragon"); addMagicPhysicsField("vortex", center.x, center.y, fieldRadius * 1.45, 0.00013, 7600, "龍脈暴走"); spawnExternalIntruderBalls(32, "龍脈暴走"); break;
        case "void": triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], "void"); break;
        case "flower": for (let i = 0; i < 6; i++) createTemporaryPinAt(center.x + Math.cos(i * Math.PI / 3) * 58 * geometry.scale, center.y + Math.sin(i * Math.PI / 3) * 58 * geometry.scale, "花冠ピン", 12000); break;
        case "gear": for (const body of engine.world.bodies) { const plugin = (body as any).plugin; if (plugin?.isPin) plugin.wiggleFrames = Math.max(plugin.wiggleFrames ?? 0, 120); } break;
        case "meteor": triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], "meteor"); spawnExternalIntruderBalls(10, def.label); break;
        case "clock": triggerRareBoardCatastrophe(SPECIAL_EVENT_DEFS[0], "timebreak"); break;
        case "crown": createTemporaryPinAt(center.x, center.y, "王冠観測ピン", 20000); fireConfetti("miracle"); break;
    }
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
    const point = getGachaPoint();
    const canOnce = point >= MIRACLE_GACHA_ONCE_COST;
    const canTen = point >= MIRACLE_GACHA_TEN_COST;
    showPopup("奇跡ガチャ", `
        <div style="display:grid;gap:18px;text-align:center;">
            <div class="miracle-user-card" style="background:radial-gradient(circle at 50% 0%,rgba(255,255,255,.95),rgba(255,230,160,.86),rgba(160,80,255,.34));">
                <div style="font-size:clamp(46px,12vw,120px);font-weight:1000;line-height:1;text-shadow:0 8px 28px rgba(0,0,0,.22);">奇跡ガチャ</div>
                <div style="margin-top:12px;font-size:clamp(18px,4vw,34px);font-weight:1000;">貯めた奇跡ガチャPで研究装置を回します</div>
                <div style="margin-top:10px;font-size:clamp(20px,4vw,34px);font-weight:1000;color:#713f12;">所持P：${point.toLocaleString()}P</div>
                <div style="margin-top:8px;opacity:.78;font-weight:900;line-height:1.7;">1回 ${MIRACLE_GACHA_ONCE_COST}P / 10連 ${MIRACLE_GACHA_TEN_COST}P</div>
            </div>
            <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
                <button id="miracle-gacha-once-button" class="miracle-home-button miracle-home-primary" style="width:168px;height:48px;font-size:13px;padding:5px 10px;white-space:normal;line-height:1.08;" ${canOnce ? "" : "disabled"}>1回まわす</button>
                <button id="miracle-gacha-ten-button" class="miracle-home-button miracle-home-primary" style="width:168px;height:48px;font-size:13px;padding:5px 10px;white-space:normal;line-height:1.08;" ${canTen ? "" : "disabled"}>10連まわす</button>
            </div>
            <div class="miracle-user-card" style="text-align:left;">
                <b>奇跡ガチャPの貯め方</b>
                <ul style="line-height:1.85;margin:10px 0 0;padding-left:1.3em;">
                    <li>実験完了：+1P</li>
                    <li>1000玉以上投下：追加 +1P</li>
                    <li>SR以上発見：+1P</li>
                    <li>SSR以上発見：+3P</li>
                    <li>GOD/EX発見：+10P</li>
                    <li>デイリー研究達成：+2P</li>
                    <li>超レア確率はかなり低めです。10連でも確定ではありません。</li>
                </ul>
            </div>
            <p style="opacity:.72;line-height:1.8;margin:0;">ガチャ回転演出のあとに結果が表示されます。SSR以上では盤面崩壊イベントが発生し、EX/GOD級は動画演出を強めに狙います。</p>
        </div>
    `);

    const run = (count: 1 | 10) => {
        const cost = count === 10 ? MIRACLE_GACHA_TEN_COST : MIRACLE_GACHA_ONCE_COST;
        if (!spendGachaPoint(cost)) {
            showSoftToast(`奇跡ガチャPが足りません。必要: ${cost.toLocaleString()}P / 所持: ${getGachaPoint().toLocaleString()}P`);
            showMiracleGachaPopup();
            return;
        }

        showPopup("奇跡ガチャ抽選中", `
            <style>
                @keyframes miracleGachaSpin {
                    0% { transform:rotate(0deg) scale(1); filter:hue-rotate(0deg) brightness(1); }
                    35% { transform:rotate(520deg) scale(1.08); filter:hue-rotate(120deg) brightness(1.25); }
                    70% { transform:rotate(980deg) scale(1.16); filter:hue-rotate(260deg) brightness(1.45); }
                    100% { transform:rotate(1440deg) scale(1); filter:hue-rotate(360deg) brightness(1.08); }
                }
                @keyframes miracleGachaPulse {
                    0%,100% { transform:scale(.94); opacity:.58; }
                    50% { transform:scale(1.18); opacity:1; }
                }
                @keyframes miracleGachaBeam {
                    0% { transform:rotate(0deg); opacity:.20; }
                    100% { transform:rotate(360deg); opacity:.62; }
                }
            </style>
            <div class="miracle-user-card" style="text-align:center;overflow:hidden;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.98),rgba(255,220,80,.82),rgba(88,28,135,.42));">
                <div style="position:relative;width:min(72vw,360px);height:min(72vw,360px);margin:0 auto;display:grid;place-items:center;">
                    <div style="position:absolute;inset:0;border-radius:999px;background:conic-gradient(from 0deg,rgba(255,255,255,0),rgba(255,255,255,.85),rgba(250,204,21,.95),rgba(168,85,247,.75),rgba(255,255,255,0));animation:miracleGachaBeam .75s linear infinite;"></div>
                    <div style="position:absolute;inset:10%;border-radius:999px;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(250,204,21,.72),rgba(126,34,206,.65));box-shadow:0 0 50px rgba(250,204,21,.7);animation:miracleGachaPulse .48s ease-in-out infinite;"></div>
                    <div style="position:relative;font-size:min(26vw,132px);line-height:1;animation:miracleGachaSpin 1.85s cubic-bezier(.2,.9,.2,1) forwards;text-shadow:0 0 30px rgba(255,255,255,.95);">🎰</div>
                </div>
                <div style="font-size:clamp(24px,5vw,44px);font-weight:1000;margin-top:10px;">${count === 10 ? "10連" : "奇跡"}抽選中...</div>
                <div style="opacity:.78;font-weight:900;margin-top:8px;">${cost.toLocaleString()}Pを消費して研究装置が高エネルギー反応を解析しています</div>
            </div>
        `);

        window.setTimeout(() => {
            const defs = Array.from({ length: count }, () => pickMiracleGachaDef());
            const best = defs.slice().sort((a, b) => getRankScore(b.rank) - getRankScore(a.rank))[0] ?? defs[0]!;
            const probabilityText = `[${best.rank}] ${formatProbability(best.denominator)}`;
            const feelingText = count === 10 ? "10連ガチャ研究装置が最高反応を観測しました。" : "ガチャ研究装置が未知の奇跡を観測しました。";
            if (count === 10) {
                const summary = defs.map((def, index) => `${index + 1}. ${def.label} [${def.rank}]`).join(" / ");
                showSoftToast(`10連結果: ${summary}`);
            }
            closeHelpPopup();
            settings.effectsEnabled = true;
            adminForceNextMiracleEffect = true;
            triggerRareBoardCatastrophe(best);
            showMiracle(best.kind, best.symbol, probabilityText, feelingText);
            void playGachaRemoteMiracleVideo(best);
        }, 1950);
    };

    document.getElementById("miracle-gacha-once-button")?.addEventListener("click", () => run(1));
    document.getElementById("miracle-gacha-ten-button")?.addEventListener("click", () => run(10));
}

function runLabHomeAction(action: string): void {
    if (!action) return;
    if (action === "start") {
        closeHelpPopup();
        startExperiment();
        scheduleViewportStabilize(true);
        return;
    }
    if (action === "daily") { showDailyMissionPopup(); return; }
    if (action === "album") { showMiracleAlbumPopup(); return; }
    if (action === "book") { showMiracleBookPopup(); return; }
    if (action === "guide") { showUserGuidePopup(); return; }
}

function bindLabHomeButtons(): void {
    helpOverlay.querySelectorAll<HTMLElement>("[data-home-action]").forEach((button) => {
        button.addEventListener("pointerup", (event) => {
            event.preventDefault();
            event.stopPropagation();
            runLabHomeAction(button.dataset.homeAction || "");
        }, { passive: false });
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            runLabHomeAction(button.dataset.homeAction || "");
        });
    });
}

function showLabHome(): void {
    const rank = getCurrentResearchRankInfo();
    const discoveredKinds = getDiscoveredKindCount();
    const reports = savedRecords.researchReports ?? [];
    const latestReport = reports[0];
    const homeHtml = `
        <div style="display:grid;gap:18px;">
            <div class="miracle-user-card miracle-home-hero">
                <div style="font-size:clamp(28px,6vw,54px);font-weight:1000;line-height:1.1;">MiracleBallLab</div>
                <div style="margin-top:14px;font-size:clamp(16px,3vw,24px);font-weight:900;opacity:.88;">玉を落として、まれに起きる奇跡を集めよう</div>
                <div style="margin-top:16px;line-height:1.85;">今日の研究テーマ：<b>${escapeHtml(getDailyFortune().title)}</b><br>研究員ランク：<b>Lv.${rank.level} ${escapeHtml(rank.label)}</b> / 図鑑：<b>${discoveredKinds}</b>種類 / 実験：<b>${savedRecords.totalRuns.toLocaleString()}</b>回 / 奇跡ガチャP：<b>${getGachaPoint().toLocaleString()}</b>P</div>
            </div>
            <div style="display:grid;grid-template-columns:${isMobile ? "1fr" : "repeat(3,minmax(0,1fr))"};gap:14px;">
                <div class="miracle-user-card"><b>今日やること</b><br><span style="opacity:.82;line-height:1.7;">デイリー研究を確認して、研究レポートを1件作成しましょう。</span></div>
                <div class="miracle-user-card"><b>最近の記録</b><br><span style="opacity:.82;line-height:1.7;">${latestReport ? `${new Date(latestReport.createdAt).toLocaleString()} / ${escapeHtml(latestReport.grade)} / ${latestReport.finishedCount.toLocaleString()}投下` : "まだ研究レポートはありません。"}</span></div>
                <div class="miracle-user-card"><b>おすすめ設定</b><br><span style="opacity:.82;line-height:1.7;">重い場合は「低スペック: ON」。録画時は演出モードを録画向けにします。</span></div>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:2px 0 2px;">
                <button data-home-action="start" class="miracle-home-button miracle-home-primary">実験を開始</button>
                <button data-home-action="daily" class="miracle-home-button">デイリー研究</button>
                <button data-home-action="album" class="miracle-home-button">奇跡アルバム</button>
                <button data-home-action="book" class="miracle-home-button">奇跡図鑑</button>
                <button data-home-action="guide" class="miracle-home-button">遊び方</button>
            </div>
            ${getUserGuideHtml()}
        </div>
    `;
    showPopup("研究所ホーム", homeHtml);
    bindLabHomeButtons();
}

function getPlainResearchMemo(): string {
    const text = generateResearchMemoHtml().replace(/<br\s*\/?>(\n)?/gi, " / ").replace(/<[^>]+>/g, "");
    return text.replace(/\s+/g, " ").trim();
}

function createResearchReportEntry(): ResearchReportEntry {
    const ranking = binCounts.map((count, index) => ({ label: labels[index] ?? "-", count })).sort((a, b) => b.count - a.count);
    const top = ranking[0] ?? { label: "-", count: 0 };
    const evaluation = getResearchEvaluation();
    const best = miracleLogs[0];
    return {
        id: `report-${Date.now()}-${Math.floor(appRandom() * 100000)}`,
        createdAt: Date.now(),
        runNo: savedRecords.totalRuns + 1,
        targetCount: settings.targetCount,
        finishedCount,
        discardedCount,
        topLabel: top.label,
        topCount: top.count,
        grade: evaluation.grade,
        type: evaluation.type,
        score: runScore,
        bestMiracleLabel: best?.label ?? "なし",
        bestMiracleRank: best?.rank ?? "-",
        memo: getPlainResearchMemo().slice(0, 260),
    };
}

function saveCurrentResearchReport(): ResearchReportEntry {
    const report = createResearchReportEntry();
    savedRecords.researchReports = [report, ...((savedRecords.researchReports ?? []).filter((x) => x.id !== report.id))].slice(0, 30);
    return report;
}

function showMiracleAlbumPopup(): void {
    const reports = savedRecords.researchReports ?? [];
    const miracleRows = miracleLogs.slice(0, 20).map((log, index) => `
        <div class="miracle-user-card" style="display:grid;gap:6px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;"><b>${index + 1}. ${escapeHtml(log.label)} [${escapeHtml(log.rank)}]</b><span style="opacity:.72;">${new Date(log.finishedAt).toLocaleString()}</span></div>
            <div style="opacity:.84;line-height:1.65;">${log.denominator > 0 ? formatProbability(log.denominator) : "派生解放"} / ${log.finishedCount.toLocaleString()}投目 / combo x${log.combo}${log.note ? ` / ${escapeHtml(log.note)}` : ""}</div>
        </div>
    `).join("") || `<p>まだ奇跡はありません。まずは実験を開始してください。</p>`;
    const reportRows = reports.slice(0, 12).map((report) => `
        <div class="miracle-user-card" style="display:grid;gap:6px;">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;"><b>第${report.runNo}回 実験レポート / ${escapeHtml(report.grade)}</b><span style="opacity:.72;">${new Date(report.createdAt).toLocaleString()}</span></div>
            <div style="opacity:.86;line-height:1.65;">${report.finishedCount.toLocaleString()}投下 / スコア ${report.score.toLocaleString()} / 最頻 ${escapeHtml(report.topLabel)} ${report.topCount.toLocaleString()}回 / 最高 ${escapeHtml(report.bestMiracleLabel)} [${escapeHtml(report.bestMiracleRank)}]</div>
            <div style="opacity:.76;line-height:1.65;">${escapeHtml(report.memo)}</div>
        </div>
    `).join("") || `<p>実験完了後に研究レポートが保存されます。</p>`;
    showPopup("奇跡アルバム", `
        <div style="display:grid;gap:14px;">
            <div class="miracle-user-card"><b>神引きコレクション</b><br><span style="opacity:.78;">奇跡ログと研究レポートを保存し、あとから振り返れるようにしました。</span></div>
            <h3 style="margin:0;">奇跡カード</h3>
            ${miracleRows}
            <h3 style="margin:10px 0 0;">研究レポート履歴</h3>
            ${reportRows}
        </div>
    `);
}
function showMiracleLogPopup(): void {
    if (miracleLogs.length === 0) {
        showPopup(t("奇跡発生ログ", "Miracle log"), `<p>${t("まだ奇跡は発生していません。", "No miracles yet.")}</p>`);
        return;
    }
    const rows = miracleLogs.map((log, i) => `
        <div style="padding:12px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <div style="font-weight:900;">${i + 1}. ${log.label} [${log.rank}] ${log.denominator > 0 ? formatProbability(log.denominator) : "派生解放"}</div>
            <div style="opacity:.78;">${t("投下位置", "Count")}: ${log.finishedCount.toLocaleString()} / ${t("モード", "Mode")}: ${log.mode} / ${t("速度", "Speed")}: ${isEnglish ? log.speedLabel : log.speedLabel} / combo x${log.combo}${log.note ? ` / ${log.note}` : ""}</div>
            <div style="opacity:.62;">${new Date(log.finishedAt).toLocaleString()}</div>
        </div>`).join("");
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
    return `
        <div style="display:grid;gap:10px;">
            <div><b>研究レベル:</b> Lv.${level.level} ${level.title} (${level.percent.toFixed(1)}%)</div>
            <div><b>今日の奇跡率:</b> x${fortune.rateBoost.toFixed(2)} / 注目: ${fortune.luckyKind}</div>
            <div><b>${t("総投下数", "Total count")}:</b> ${finishedCount.toLocaleString()} / ${settings.targetCount.toLocaleString()}</div>
            <div><b>${t("捨て区間", "Discarded")}:</b> ${discardedCount.toLocaleString()}</div>
            <div><b>${t("最頻受け皿", "Top bin")}:</b> ${topIndex >= 0 ? labels[topIndex] : "-" } (${maxCount.toLocaleString()})</div>
            <div><b>${t("偏り診断", "Bias diagnosis")}:</b> ${diagnosis}</div>
            <div><b>${t("発見済み種類", "Discovered kinds")}:</b> ${SPECIAL_EVENT_DEFS.filter((d) => (savedRecords.discovered[d.kind] ?? 0) + (specialCreated[d.kind] ?? 0) > 0).length} / ${SPECIAL_EVENT_DEFS.length}</div>
            <div><b>合成・派生:</b> ${getFusionCount()} / ${FUSION_DEFS.length}</div>
            <div><b>秘密操作:</b> ${Object.keys(savedRecords.secretUnlocked ?? {}).length}</div>
            <div><b>レアピン接触:</b> ${RARE_PIN_DEFS.map((x) => `${x.label} ${(rarePinTouchCount[x.kind] ?? 0).toLocaleString()}`).join(" / ")}</div>
            <div><b>研究メモ:</b><br>${generateResearchMemoHtml()}</div>
            <div><b>${t("最近の奇跡", "Recent miracles")}:</b><br>${recentMiracles}</div>
        </div>`;
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
    if (isVerticalVideoMode) {
        gameArea.style.aspectRatio = "9 / 16";
        gameArea.style.height = isMobile ? "74dvh" : "88dvh";
        gameArea.style.maxWidth = isMobile ? "100%" : "500px";
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

type RareBoardCatastropheKind = "earthquake" | "tsunami" | "lightning" | "meteor" | "blackhole" | "volcano" | "ice" | "laser" | "gravity" | "crack" | "typhoon" | "sandstorm" | "aurora" | "timebreak" | "pinfall" | "mirror" | "plasma" | "labburst" | "dragon" | "void" | "supernova";

interface RareBoardCatastropheDef {
    kind: RareBoardCatastropheKind;
    label: string;
    emoji: string;
    color: string;
    bg: string;
    shake: number;
    duration: number;
    gravityX: number;
    gravityY: number;
    lightning: number;
    waves: number;
    fragments: number;
}

const RARE_BOARD_CATASTROPHE_DEFS: RareBoardCatastropheDef[] = [
    { kind: "earthquake", label: "大地震で盤面崩壊", emoji: "🌋", color: "#ff6b35", bg: "rgba(80,25,10,.28)", shake: 56, duration: 2600, gravityX: .16, gravityY: 9.8, lightning: 2, waves: 1, fragments: 24 },
    { kind: "tsunami", label: "津波が盤面を飲み込む", emoji: "🌊", color: "#38bdf8", bg: "rgba(14,116,144,.32)", shake: 42, duration: 2800, gravityX: -.20, gravityY: 7.2, lightning: 0, waves: 5, fragments: 12 },
    { kind: "lightning", label: "落雷の嵐", emoji: "⚡", color: "#fde047", bg: "rgba(253,224,71,.18)", shake: 48, duration: 2400, gravityX: .08, gravityY: 8.0, lightning: 14, waves: 1, fragments: 18 },
    { kind: "meteor", label: "隕石群直撃", emoji: "☄️", color: "#fb923c", bg: "rgba(124,45,18,.30)", shake: 60, duration: 2800, gravityX: -.08, gravityY: 10.8, lightning: 5, waves: 2, fragments: 34 },
    { kind: "blackhole", label: "ブラックホール発生", emoji: "🕳️", color: "#a78bfa", bg: "rgba(30,27,75,.42)", shake: 44, duration: 3000, gravityX: 0, gravityY: 4.8, lightning: 4, waves: 4, fragments: 10 },
    { kind: "volcano", label: "火山噴火モード", emoji: "🔥", color: "#ef4444", bg: "rgba(127,29,29,.34)", shake: 54, duration: 2600, gravityX: .10, gravityY: 11.2, lightning: 3, waves: 1, fragments: 32 },
    { kind: "ice", label: "氷結崩壊", emoji: "❄️", color: "#bae6fd", bg: "rgba(125,211,252,.25)", shake: 34, duration: 2500, gravityX: -.10, gravityY: 6.4, lightning: 2, waves: 2, fragments: 20 },
    { kind: "laser", label: "研究所レーザー暴走", emoji: "🔴", color: "#ff2d75", bg: "rgba(190,24,93,.26)", shake: 38, duration: 2400, gravityX: .14, gravityY: 8.2, lightning: 10, waves: 0, fragments: 16 },
    { kind: "gravity", label: "重力反転警報", emoji: "🧲", color: "#22d3ee", bg: "rgba(8,145,178,.25)", shake: 44, duration: 3000, gravityX: 0, gravityY: -3.2, lightning: 3, waves: 3, fragments: 10 },
    { kind: "crack", label: "盤面亀裂拡大", emoji: "🪨", color: "#d6d3d1", bg: "rgba(41,37,36,.35)", shake: 52, duration: 2600, gravityX: -.12, gravityY: 8.8, lightning: 2, waves: 2, fragments: 28 },
    { kind: "typhoon", label: "超巨大台風", emoji: "🌀", color: "#67e8f9", bg: "rgba(21,94,117,.30)", shake: 40, duration: 2800, gravityX: .24, gravityY: 6.8, lightning: 5, waves: 4, fragments: 12 },
    { kind: "sandstorm", label: "砂嵐で視界崩壊", emoji: "🌪️", color: "#fbbf24", bg: "rgba(146,64,14,.26)", shake: 36, duration: 2500, gravityX: -.22, gravityY: 7.4, lightning: 1, waves: 2, fragments: 22 },
    { kind: "aurora", label: "オーロラ暴走", emoji: "🌌", color: "#86efac", bg: "rgba(6,78,59,.24)", shake: 32, duration: 2600, gravityX: .06, gravityY: 5.8, lightning: 7, waves: 3, fragments: 10 },
    { kind: "timebreak", label: "時間断層崩壊", emoji: "⏳", color: "#c4b5fd", bg: "rgba(76,29,149,.30)", shake: 42, duration: 3000, gravityX: .04, gravityY: 4.2, lightning: 8, waves: 4, fragments: 14 },
    { kind: "pinfall", label: "ピン全域暴走", emoji: "📍", color: "#fda4af", bg: "rgba(159,18,57,.24)", shake: 50, duration: 2600, gravityX: -.14, gravityY: 8.4, lightning: 4, waves: 2, fragments: 26 },
    { kind: "mirror", label: "鏡面世界反転", emoji: "🪞", color: "#e0f2fe", bg: "rgba(15,23,42,.26)", shake: 34, duration: 2500, gravityX: .18, gravityY: 6.2, lightning: 4, waves: 3, fragments: 12 },
    { kind: "plasma", label: "プラズマ豪雨", emoji: "💥", color: "#f0abfc", bg: "rgba(112,26,117,.30)", shake: 46, duration: 2500, gravityX: .10, gravityY: 9.2, lightning: 12, waves: 2, fragments: 18 },
    { kind: "labburst", label: "研究炉メルトダウン", emoji: "☢️", color: "#bef264", bg: "rgba(63,98,18,.24)", shake: 58, duration: 2800, gravityX: -.10, gravityY: 10.0, lightning: 6, waves: 2, fragments: 32 },
    { kind: "dragon", label: "龍脈が盤面を裂く", emoji: "🐉", color: "#34d399", bg: "rgba(6,95,70,.28)", shake: 52, duration: 2700, gravityX: .20, gravityY: 8.0, lightning: 8, waves: 4, fragments: 20 },
    { kind: "void", label: "虚無領域展開", emoji: "⬛", color: "#e5e7eb", bg: "rgba(0,0,0,.44)", shake: 40, duration: 2900, gravityX: 0, gravityY: 3.6, lightning: 2, waves: 5, fragments: 8 },
    { kind: "supernova", label: "超新星爆発", emoji: "🌟", color: "#fff7ad", bg: "rgba(250,204,21,.26)", shake: 66, duration: 3000, gravityX: .02, gravityY: 10.5, lightning: 16, waves: 6, fragments: 38 },
];

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
    if (!rareBoardCatastrophe || Date.now() > rareBoardCatastropheUntil) return;
    const def = rareBoardCatastrophe;
    const elapsed = performance.now() - rareBoardCatastropheStartedAt;
    const progress = clamp(elapsed / Math.max(1, def.duration), 0, 1);
    const fade = Math.sin(progress * Math.PI);
    context.save();
    context.globalCompositeOperation = "source-over";
    context.fillStyle = def.bg;
    context.fillRect(0, 0, geometry.width, geometry.height);

    context.globalCompositeOperation = "lighter";
    context.strokeStyle = def.color;
    context.fillStyle = def.color;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalAlpha = 0.28 + fade * 0.42;

    const waveCount = Math.min(8, def.waves + 2);
    for (let i = 0; i < waveCount; i++) {
        const r = (progress * 480 + i * 70) * geometry.scale;
        context.lineWidth = Math.max(2, 5 * geometry.scale);
        context.beginPath();
        context.arc(geometry.width / 2, geometry.height * 0.42, r % (Math.max(geometry.width, geometry.height) * 0.7), 0, Math.PI * 2);
        context.stroke();
    }

    for (let i = 0; i < def.lightning; i++) {
        const seed = i * 37 + Math.floor(elapsed / 120);
        const x = ((seed * 97) % Math.max(1, Math.floor(geometry.width)));
        const top = 10 * geometry.scale;
        const bottom = geometry.height * (0.25 + ((seed * 13) % 55) / 100);
        context.lineWidth = Math.max(2, 3.5 * geometry.scale);
        context.beginPath();
        context.moveTo(x, top);
        const segments = 5;
        for (let s = 1; s <= segments; s++) {
            const yy = top + (bottom - top) * (s / segments);
            const xx = x + Math.sin(seed + s * 2.1) * 34 * geometry.scale;
            context.lineTo(xx, yy);
        }
        context.stroke();
    }

    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 0.95;
    context.font = `900 ${Math.round(clamp(24 * geometry.scale, 18, 44))}px ${ROUNDED_UI_FONT}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(255,255,255,.94)";
    context.strokeStyle = "rgba(0,0,0,.55)";
    context.lineWidth = Math.max(3, 5 * geometry.scale);
    const label = `${def.emoji} ${def.label}`;
    context.strokeText(label, geometry.width / 2, geometry.height * 0.13);
    context.fillText(label, geometry.width / 2, geometry.height * 0.13);
    context.restore();
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
    const color = mode === "black" ? "rgba(255,0,68,.62)" : mode === "cosmic" ? "rgba(100,70,255,.68)" : mode === "normal" ? "rgba(255,255,255,.45)" : "rgba(255,236,120,.72)";
    flashOverlay.style.background = color;
    flashOverlay.style.display = "block";
    flashOverlay.style.opacity = "1";
    flashOverlay.style.transition = "opacity 720ms ease-out";
    requestAnimationFrame(() => { flashOverlay.style.opacity = "0"; });
    window.setTimeout(() => { flashOverlay.style.display = "none"; }, 760);
}


function triggerSwordImpactEffect(): void {
    if (settings.simpleMode) return;

    const layer = document.createElement("div");
    layer.style.position = "fixed";
    layer.style.inset = "0";
    layer.style.zIndex = "9997";
    layer.style.pointerEvents = "none";
    layer.style.overflow = "hidden";
    layer.style.background = "radial-gradient(circle at 50% 50%, rgba(255,255,255,.20), rgba(30,80,160,.12) 32%, rgba(0,0,0,.62) 100%)";
    layer.innerHTML = `
        <style>
            @keyframes sword-impact-fade{0%{opacity:0}8%{opacity:1}100%{opacity:0}}
            @keyframes sword-impact-slash-a{0%{transform:translate(-115vw,35vh) rotate(-18deg) scaleX(.25);filter:blur(10px);opacity:0}18%{opacity:1;filter:blur(0)}48%{transform:translate(24vw,-20vh) rotate(-18deg) scaleX(1.25);opacity:1}100%{transform:translate(125vw,-78vh) rotate(-18deg) scaleX(1.6);opacity:0}}
            @keyframes sword-impact-slash-b{0%{transform:translate(110vw,50vh) rotate(20deg) scaleX(.25);filter:blur(10px);opacity:0}22%{opacity:1;filter:blur(0)}52%{transform:translate(-18vw,-14vh) rotate(20deg) scaleX(1.16);opacity:1}100%{transform:translate(-125vw,-64vh) rotate(20deg) scaleX(1.5);opacity:0}}
            @keyframes sword-impact-ring{0%{transform:translate(-50%,-50%) scale(.15);opacity:.95;border-width:16px}100%{transform:translate(-50%,-50%) scale(2.9);opacity:0;border-width:1px}}
            @keyframes sword-impact-title{0%{transform:translate(-50%,-50%) scale(.55);opacity:0;letter-spacing:.15em}18%{transform:translate(-50%,-50%) scale(1.18);opacity:1}52%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-58%) scale(.94);opacity:0;letter-spacing:.45em}}
            @keyframes sword-impact-sparks{0%{transform:translate(-50%,-50%) rotate(0deg) scale(.25);opacity:0}18%{opacity:1}100%{transform:translate(-50%,-50%) rotate(220deg) scale(1.7);opacity:0}}
        </style>
        <div style="position:absolute;left:50%;top:50%;width:min(76vmin,760px);height:min(76vmin,760px);border:12px solid rgba(220,246,255,.92);border-radius:999px;box-shadow:0 0 44px rgba(170,230,255,.95), inset 0 0 34px rgba(255,255,255,.78);animation:sword-impact-ring 1200ms ease-out forwards;"></div>
        <div style="position:absolute;left:0;top:50%;width:145vw;height:clamp(18px,4.8vw,52px);background:linear-gradient(90deg, transparent, rgba(255,255,255,.98) 18%, rgba(100,220,255,.95) 50%, rgba(255,255,255,.98) 82%, transparent);box-shadow:0 0 30px rgba(180,240,255,.95),0 0 80px rgba(100,180,255,.8);animation:sword-impact-slash-a 980ms cubic-bezier(.16,1,.3,1) forwards;"></div>
        <div style="position:absolute;left:0;top:51%;width:145vw;height:clamp(14px,3.8vw,42px);background:linear-gradient(90deg, transparent, rgba(255,255,255,.95) 20%, rgba(255,230,140,.94) 50%, rgba(255,255,255,.95) 80%, transparent);box-shadow:0 0 26px rgba(255,248,200,.9),0 0 70px rgba(255,210,80,.65);animation:sword-impact-slash-b 1040ms cubic-bezier(.16,1,.3,1) forwards 80ms;"></div>
        <div style="position:absolute;left:50%;top:50%;font-size:clamp(46px,13vw,150px);font-weight:1000;color:#f8fdff;text-shadow:0 0 12px #ffffff,0 0 34px #7dd3fc,0 12px 34px rgba(0,0,0,.75);animation:sword-impact-title 1420ms ease-out forwards;white-space:nowrap;">斬撃衝突</div>
        <div style="position:absolute;left:50%;top:50%;width:min(74vmin,740px);height:min(74vmin,740px);background:repeating-conic-gradient(from 0deg, rgba(255,255,255,.9) 0 4deg, transparent 4deg 16deg);clip-path:circle(50%);mix-blend-mode:screen;animation:sword-impact-sparks 1260ms ease-out forwards;"></div>
    `;
    layer.style.animation = "sword-impact-fade 1500ms ease-out forwards";
    document.body.appendChild(layer);
    window.setTimeout(() => layer.remove(), 1600);
}

function closeHelpPopup(): void {
    helpOverlay.style.display = "none";
    helpOverlay.innerHTML = "";
}

function showPopup(title: string, bodyHtml: string): void {
    if (mobileSettingsOverlay && mobileSettingsOverlay.style.display !== "none") {
        mobileSettingsOverlay.style.display = "none";
    }
    const panelWidth = isMobile ? "calc(100vw - 20px)" : "min(980px, 94vw)";
    const panelMaxHeight = isMobile ? "calc(100dvh - 20px)" : "88dvh";
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
    helpOverlay.style.display = "flex";
    document.getElementById("close-help-popup-button")!.onclick = () => closeHelpPopup();
    document.getElementById("bottom-close-help-popup-button")!.onclick = () => closeHelpPopup();
}


function showMiracleBookPopup(): void {
    const rows = SPECIAL_EVENT_DEFS.slice().reverse().map((def) => {
        const savedCount = savedRecords.discovered[def.kind] ?? 0;
        const nowCount = specialCreated[def.kind] ?? 0;
        const totalCount = savedCount + nowCount;
        const found = totalCount > 0;
        const firstFoundAt = savedRecords.discoveredFirstAt[def.kind];
        const displayName = found ? `${def.symbol} ${def.label}` : `??? シークレット枠`;
        const imageHtml = `<div style="position:relative;width:${isMobile ? 98 : 112}px;height:${isMobile ? 98 : 112}px;">
            <img src="${createMiracleImageDataUri(def)}" alt="${escapeSvgText(def.label)}" style="width:100%;height:100%;border-radius:22px;object-fit:cover;box-shadow:0 10px 24px rgba(0,0,0,.18);background:#0f172a;${found ? "" : "filter:saturate(.32) brightness(.72);opacity:.82;"}" />
            ${found ? "" : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:22px;background:rgba(15,23,42,.36);color:#fff;font-size:${isMobile ? 22 : 24}px;font-weight:1000;">?</div>`}
        </div>`;
        const firstFoundText = found && firstFoundAt ? new Date(firstFoundAt).toLocaleString() : "----";
        return `<div style="display:grid;grid-template-columns:${isMobile ? "98px minmax(0,1fr)" : "112px minmax(0,1fr)"};gap:14px;align-items:start;padding:14px 0;border-bottom:1px solid rgba(80,90,120,.16);">
            <div>${imageHtml}</div>
            <div style="min-width:0;">
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;padding:4px 10px;border-radius:999px;background:${found ? "rgba(53,98,59,.14)" : "rgba(120,130,140,.14)"};font-weight:900;color:${found ? "#214329" : "#727a86"};">${def.rank}</span>
                    <span style="font-size:${isMobile ? 21 : 22}px;font-weight:900;line-height:1.35;word-break:break-word;color:${found ? "#1d2738" : "#999"};">${displayName}</span>
                </div>
                <div style="margin-top:8px;font-size:${isMobile ? 15 : 16}px;line-height:1.7;opacity:.82;">${found ? getMiracleFeatureText(def) : "未発見のため詳細は伏せられています。観測すると画像・名前・説明が解放されます。"}</div>
                <div style="margin-top:8px;font-size:${isMobile ? 15 : 16}px;line-height:1.6;opacity:.72;">${t("確率", "Odds")} ${found ? formatProbability(def.denominator) : "????"} / ${t("累計発見", "Total found")} ${totalCount}${t("回", "x")}</div>
                <div style="margin-top:2px;font-size:${isMobile ? 14 : 15}px;line-height:1.6;opacity:.62;">${t("初回発見", "First found")} ${firstFoundText}</div>
            </div>
        </div>`;
    }).join("");
    showPopup("奇跡図鑑", `
        <p style="margin-top:0;">全ての奇跡を画像つきで表示します。未発見のものは<b>シークレット枠</b>として、名前・確率・説明を伏せたまま表示します。</p>
        <div style="margin-top:16px;border-radius:22px;background:rgba(255,255,255,.75);padding:${isMobile ? "4px 14px" : "8px 16px"};box-sizing:border-box;max-width:100%;overflow:hidden;">${rows}</div>
    `);
}

function showUserSettingsPopup(): void {
    const discoveredKinds = getDiscoveredCount();
    showPopup(t("ユーザー設定", "User settings"), `
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>研究員プロフィール</b></p>
            <label style="display:block;font-weight:900;margin-bottom:6px;">ニックネーム</label>
            <input id="user-nickname-input" value="${escapeHtml(userProfile.nickname)}" maxlength="24" style="width:100%;font-size:${isMobile ? 20 : 18}px;padding:12px 14px;border-radius:14px;border:1px solid #b8c1d1;box-sizing:border-box;" />
            <label style="display:block;font-weight:900;margin:14px 0 6px;">遊び方</label>
            <select id="user-play-style-select" style="width:100%;font-size:${isMobile ? 20 : 18}px;padding:12px 14px;border-radius:14px;border:1px solid #b8c1d1;box-sizing:border-box;">
                <option value="standard" ${userProfile.playStyle === "standard" ? "selected" : ""}>標準</option>
                <option value="viewer" ${userProfile.playStyle === "viewer" ? "selected" : ""}>演出を見る</option>
                <option value="collector" ${userProfile.playStyle === "collector" ? "selected" : ""}>図鑑収集</option>
                <option value="recording" ${userProfile.playStyle === "recording" ? "selected" : ""}>録画・SNS</option>
            </select>
            <label style="display:block;font-weight:900;margin:14px 0 6px;">好きな奇跡メモ</label>
            <input id="user-favorite-input" value="${escapeHtml(userProfile.favoriteMiracle)}" maxlength="40" style="width:100%;font-size:${isMobile ? 20 : 18}px;padding:12px 14px;border-radius:14px;border:1px solid #b8c1d1;box-sizing:border-box;" />
            <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
                <button id="save-user-profile-button" style="font-size:18px;font-weight:900;padding:10px 18px;border-radius:999px;border:1px solid rgba(87,112,51,.24);background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);cursor:pointer;">保存して反映</button>
                <button id="guest-name-button" style="font-size:18px;font-weight:900;padding:10px 18px;border-radius:999px;border:1px solid rgba(87,112,51,.24);background:#fff;cursor:pointer;">ゲスト名に戻す</button>
            </div>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>ユーザー状況</b></p>
            <p>表示名: <b>${escapeHtml(userProfile.nickname)}</b></p>
            <p>遊び方: <b>${getUserPlayStyleLabel(userProfile.playStyle)}</b></p>
            <p>連続起動: <b>${userProfile.consecutiveDays}</b>日 / 起動回数: <b>${userProfile.openCount}</b>回</p>
            <p>図鑑発見: <b>${discoveredKinds}</b> / ${SPECIAL_EVENT_DEFS.length} 種類</p>
            <p>最高レア: <b>${escapeHtml(savedRecords.bestRank)}</b> ${escapeHtml(savedRecords.bestLabel)}</p>
            <p>安全停止回数: <b>${userProfile.totalSafeStops}</b>回</p>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>保存データ</b></p>
            <p>ニックネーム、設定、図鑑、奇跡ログ、最高記録はこの端末のブラウザ内に保存します。ログインやサーバー送信は行いません。</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button id="export-user-data-button" style="font-size:18px;font-weight:900;padding:10px 18px;border-radius:999px;border:1px solid rgba(87,112,51,.24);background:#fff;cursor:pointer;">データ書き出し</button>
                <button id="reset-local-data-button" style="font-size:18px;font-weight:900;padding:10px 18px;border-radius:999px;border:1px solid rgba(185,28,28,.35);background:#fee2e2;color:#991b1b;cursor:pointer;">ローカルデータ削除</button>
            </div>
        </div>
    `);
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
    showPopup(t("アプリ情報", "App info"), `
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>MiracleBallLab</b></p>
            <p>${getAppOnlineStatusHtml()}</p>
            <p>表示モード: <b>${standalone ? "ホーム画面から起動中" : "ブラウザで利用中"}</b></p>
            <p>バージョン: <b>${APP_VERSION}</b></p>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>このアプリでできること</b></p>
            <ul style="line-height:1.8;margin-bottom:0;">
                <li>玉を落として、まれに発生する特別な演出や記録を楽しめます。</li>
                <li>一時停止・終了ボタンで、スマホでも無理なく遊びやすくしています。</li>
                <li>設定、図鑑、最高記録、ミッション、奇跡ログをこの端末に保存できます。</li>
                <li>研究所ホーム、奇跡アルバム、実験レポート履歴から、今日の記録をあとで振り返れます。</li>
                <li>一度読み込んだ主要ファイルは、通信が不安定な場所でも開きやすくなります。</li>
                <li>ユーザー設定から保存データの確認や削除ができます。</li>
            </ul>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>保存される情報</b></p>
            <p>ニックネーム、遊び方の設定、図鑑、記録、ミッション進行状況は、この端末のブラウザ保存領域に保存されます。</p>
            <p>アカウント作成、位置情報取得、プレイ記録の外部送信は行いません。</p>
        </div>
        <div class="miracle-user-card">
            <p style="margin-top:0;"><b>通信について</b></p>
            <p>動画演出をONにしている場合、演出用動画を読み込むために通信が発生することがあります。</p>
            <p>通信が不安定な場合は、設定から動画演出をOFFにすると軽く遊べます。</p>
        </div>
    `);
}

function showRecordsPopup(): void {
    showPopup("最高記録", `
        <p><b>実験回数:</b> ${savedRecords.totalRuns.toLocaleString()}回</p>
        <p><b>最大実処理数:</b> ${savedRecords.maxFinishedCount.toLocaleString()}回</p>
        <p><b>最大指定投下数:</b> ${savedRecords.maxTargetCount.toLocaleString()}回</p>
        <p><b>最高レア:</b> ${savedRecords.bestRank} / ${savedRecords.bestLabel}</p>
        <p><b>最高スコア:</b> ${savedRecords.bestScore.toLocaleString()}</p>
        <p><b>通算スコア:</b> ${savedRecords.totalScore.toLocaleString()}</p>
        <p><b>研究員ランク:</b> Lv.${getCurrentResearchRankInfo().level} ${getCurrentResearchRankInfo().label}</p>
        <p><b>テーマ解放:</b> ${getThemeCollection(savedRecords, getDiscoveredKindCount(), getFusionCountForRank(), getSecretCountForRank()).filter((x) => x.unlocked).length} / ${getThemeOptions().length}</p>
        <p><b>ミッション達成種類:</b> ${Object.keys(savedRecords.missionCompleted).length} / ${missionDefs.length || buildMissionDefs().length}</p>
        <p>保存はブラウザ内です。別端末や別ブラウザでは共有されません。</p>
        <p style="opacity:.75;">消したい場合はブラウザのサイトデータ削除でリセットできます。</p>
    `);
}

function showAboutPopup(): void {
    showPopup("ミラクルボールラボについて", `
        <p><b>ミラクルボールラボ</b>は、玉が盤面を落ち、<b>START / 役物 / PREMIUM</b> を通過した瞬間だけ抽選するパチンコ風シミュレーションです。</p>
        <p>落ちていく玉を眺めながら、まれに起きる奇跡を集めて、自分だけの研究記録を増やしていく遊びです。研究所ホーム、奇跡アルバム、実験レポート履歴、デイリー研究、研究員ランクから進行状況を確認できます。</p>
        <p><b>低スペックモード:</b> スマホや古い端末で重い場合は、動画・揺れ・背景・派手な演出をまとめて軽くできます。</p>
        <p>玉を作った瞬間には基本的にレア抽選しません。役物センサーを通過した玉だけが当たり・激アツ・奇跡演出の抽選対象になります。</p>
        <p>通常玉にはたまに<b>個体差</b>が付きます。重い玉、跳ね玉、小粒玉、のんびり玉、早足玉、回転玉、うす玉などがあり、同じ通常玉でも少し違う落ち方をします。</p>
        <ul style="text-align:left;line-height:1.7;">${getNormalTraitSummaryHtml()}</ul>
        <p><b>終了ボタン</b>は、スマホで閉じる前に物理エンジン・描画・タイマーを止めるための安全停止です。ブラウザの仕様上タブ自体を必ず閉じることはできませんが、処理を止めてメモリや発熱を抑えやすくします。</p>
        <p><b>奇跡予兆</b>は、本当に奇跡が出るとは限らない前触れ演出です。ピンの光・画面の違和感・実況ログで「来るかも」という雰囲気を出します。</p>
        <p><b>レアピン</b>は、赤ピン・青ピン・黒ピン・虹ピンなどの特殊なピンです。玉を弾く、寄せる、低確率で変質させるなど、盤面に少しだけ事件を起こします。</p>
        <p>通常玉だけでなく、金玉、虹玉、巨大玉、図形、王、銀のUFO、青い炎、流れ星、ラッキーセブン、桃色ハート、時空の裂け目、黒い太陽、研究所爆発、そして極秘の最上位奇跡など、たくさんのレア玉がまれに出ます。最上位は<b>1兆分の1</b>級です。</p>
        <p>さらに<b>10億分の1</b>レベルで、<b>poseidon mode / zeusu mode / hadesu mode / heart mode / nekochan mode / 人生名言ボイス</b>が発生します。mode系は出た瞬間から実験終了まで盤面全体の世界観が変わり続けます。</p>
        <p>両端は<b>捨て区間</b>です。ここに入った玉も処理済みとして数えますが、中央の受け皿ランキングには入れません。</p>
        <p>100,000回ごとに達成演出が出ます。指定回数に到達したあと、画面に残っている玉も最後に回収してから実験完了にします。</p>
        <p>奇跡ログ、今日の運勢・奇跡率、研究レベル、奇跡合成・派生、スクリーンショット保存、秘密操作を追加しています。</p>
        <p>実験中は、画面下に研究員の<b>実況ログ</b>が本当にたまに横から流れます。出過ぎると邪魔なので、かなり控えめです。</p>
        <p>まれに<b>盤面変異イベント</b>が発生し、横重力、粘る時間、上昇気流、小さな重力穴、ピン一斉振動などで盤面が短時間だけ変化します。</p>
        <p>特定の奇跡が決まった順番で続くと<b>奇跡同士の連鎖</b>が発生し、専用の連鎖演出とスコアが入ります。実験完了時には短いエンディング演出を挟んで結果画面に進みます。</p>
        <p>背景はデフォルトで favicon.png をスマホ・PCどちらでも実行画面いっぱいに表示します。ピンの初期色は金色です。画面揺れはデフォルトOFFです。</p>
        <p>奇跡図鑑と発生演出には、全種類でアプリ内生成のオリジナルSVG画像を使います。発生時は該当画像と発生名を大きく表示します。</p>
        <p><b>ブラックモード</b>をONにすると、設定欄・ボタン・盤面背景を黒基調に切り替えます。デフォルトはOFFです。</p>
        <p><b>補足:</b> 超高速にすると物理演算と画面描画が速く進むため、レア演出が一瞬で流れて見えない可能性がかなり高くなります。レア演出を見たいときは通常か高速がおすすめです。SR/SSRで同じ奇跡演出が実行中に再発生した場合は、2回目以降さらに短く閉じます。</p>
        <p><b>ユーザー機能:</b> ニックネーム、遊び方、好きな奇跡メモ、連続起動日数、設定復元、データ書き出し、ローカルデータ削除を追加しています。</p>
        <div style="margin:18px 0;padding:14px;border-radius:18px;background:rgba(15,23,42,.08);border:1px solid rgba(15,23,42,.12);">
            <p style="margin-top:0;"><b>スマホの動画音声:</b> iPhoneでは、ブラウザの仕様で最初のタップ前に音声付き動画を再生できないことがあります。先に下のボタンを1回押しておくと、動画演出の音声が出やすくなります。</p>
            <button id="mobile-audio-unlock-from-about" style="font-size:${isMobile ? 20 : 18}px;font-weight:1000;padding:13px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.65);background:linear-gradient(180deg,#111827,#020617);color:white;box-shadow:0 10px 26px rgba(0,0,0,.24);cursor:pointer;">音声を有効にする</button>
            <p style="margin-bottom:0;opacity:.78;font-size:${isMobile ? 15 : 14}px;line-height:1.7;">マナーモードONや本体音量0の場合は、Web側から強制的に音を出すことはできません。マナーモードOFF、音量UPで確認してください。</p>
        </div>
        <p><b>AIからの補足:</b> これは遊びながら確率の偏りを見るシミュレーションです。厳密な科学実験ではなく、乱数はブラウザの <code>Math.random()</code> を使っています。統計っぽく見たい場合は投下数を多めにして、動作が重いときはシンプルON、同時に出す玉数を少なめにしてください。</p>
    `);
    document.getElementById("mobile-audio-unlock-from-about")?.addEventListener("click", async () => {
        await unlockMobileAudio(true);
    });
}

function showButtonHelpPopup(): void {
    showPopup("ボタン説明", `
        <p><b>実行:</b> 現在の設定で実験を開始します。開始前は待機中です。</p>
        <p><b>超低速 / 低速 / 通常 / 高速 / 超高速:</b> 玉の動く速度を変えます。超低速と低速は観察向け、超高速は処理は速いですがレア演出を見逃しやすくなります。</p>
        <p><b>ストップ / 再開:</b> 実験を一時停止、または再開します。PC版は盤面左下にも一時停止ボタンを追加しています。奇跡演出中でも一時停止を優先できます。スマホ下部にも一時停止ボタンがあります。</p>
        <p><b>リセット:</b> 設定を読み直して、実験を最初から待機状態に戻します。</p>
        <p><b>終了:</b> スマホで閉じる前に物理エンジン・描画・演出タイマーを止めます。発熱や裏側で動き続ける不安がある場合に使います。</p>
        <p><b>シンプル:</b> 演出を減らして軽くします。重い場合や大量回数を試す場合に便利です。</p>
        <p><b>演出ゆっくり:</b> 奇跡演出だけを少し長く見せます。デフォルトはOFFです。同じSR/SSRの短縮演出は優先されます。</p>
        <p><b>演出:</b> 奇跡演出、画面効果、エンディング演出をまとめてON/OFFします。デフォルトはOFFです。</p>
        <p><b>演出モード:</b> 控えめ、通常、派手、録画向けから演出量を選べます。</p>
        <p><b>直近の奇跡:</b> 画面右下に直近3件の奇跡履歴を表示します。デフォルトはOFFです。</p>
        <p><b>個体差:</b> 通常玉の重い玉、跳ね玉、小粒玉などの個体差をON/OFFします。デフォルトはONです。</p>
        <p><b>盤面変異:</b> 横重力、上昇気流、小さな重力穴などのイベントをON/OFFします。デフォルトはONです。</p>
        <p><b>スマホ簡易:</b> スマホで直近奇跡表示や効果表示を控えめにして、盤面を見やすくします。</p>
        <p><b>音:</b> Tone.js を使って、開始・一時停止・スキル・秘密操作・レア玉ごとに違う短い効果音を鳴らします。GOD/EX級は低音とノイズを重ねて強めにしています。ブラウザ仕様上、最初にボタン操作が必要です。iPhoneで動画音声が出ない場合は「この実験について」内の「音声を有効にする」を1回押してください。</p>
        <p><b>衝撃波 / 磁石 / 時止め:</b> 実験中に使える操作スキルです。衝撃波は玉を散らし、磁石は上位受け皿へ吸わせ、時止めは短時間だけ盤面を静止させます。</p>
        <p><b>ミッション:</b> 実験中の条件達成でスコア報酬を獲得します。</p>
        <p><b>今日の運勢:</b> 日付ごとの奇跡率、注目奇跡、ラッキー受け皿を表示します。奇跡率はレア抽選に少しだけ反映されます。</p>
        <p><b>奇跡合成:</b> 特定の奇跡同士を観測すると、派生奇跡が研究記録として解放されます。さらに実験中に特定の順番で奇跡が続くと、奇跡連鎖演出が発生します。</p>
        <p><b>実況ログ:</b> 画面下に研究員の短い実況がたまに流れます。常に流れるものではなく、観測のアクセント用です。</p>
        <p><b>秘密:</b> 裏コマンドの発見状況を表示します。キーボード入力、ロゴ連打、一時停止連打、スキルの順番操作などを実績風に集められます。</p>
        <p><b>録画・SNS:</b> 投稿文コピー、現在画面のスクリーンショット保存、縦長シェアカード保存ができます。奇跡のGIF保存はリプレイから行います。</p>
        <p><b>紙吹雪:</b> 達成時やレア演出時の紙吹雪をON/OFFします。</p>
        <p><b>Pixi背景:</b> Pixi.jsを使った背景演出をON/OFFします。見た目は楽しいですが、PCやスマホによっては重くなります。</p>
        <p><b>設定反映:</b> 投下数、同時に出す玉数、受け皿数、ピン段数などを反映してリセットします。</p>
        <p><b>結果コピー / CSV保存:</b> 実験結果をコピー、またはCSVファイルとして保存します。</p>
        <p><b>ピンをタップ/クリック:</b> 近くのピンを揺らして、詰まり気味の玉を少し動かせます。</p>
        <p><b>SR/SSR演出:</b> 実行中に同じSR/SSR演出が再発生した場合は、2回目以降さらに短く閉じます。</p>
    `);
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
    const viewportWidth = Math.max(320, Math.floor(isMobile ? Math.min(window.innerWidth || layoutWidth, layoutWidth || window.innerWidth) : (visual?.width ?? window.innerWidth)));
    const viewportHeight = Math.max(480, Math.floor(isMobile ? Math.min(window.innerHeight || layoutHeight, layoutHeight || window.innerHeight) : (visual?.height ?? window.innerHeight)));
    const small = isMobile || viewportWidth < 700;
    const fullscreenLike = isFullscreenMode || isPseudoFullscreenMode;
    const infoHeight = fullscreenLike
        ? 0
        : isMobile
            ? Math.round(clamp(viewportHeight * 0.115, 96, 116))
            : Math.round(clamp(viewportHeight * (small ? 0.24 : 0.40), small ? 170 : 300, small ? 270 : 500));
    const width = viewportWidth;
    const height = fullscreenLike ? viewportHeight : Math.max(360, viewportHeight - infoHeight);
    const scale = clamp(Math.min(width / BASE_WIDTH, height / BASE_HEIGHT), 0.56, 2.4);
    const pixelRatio = settings.lowSpecMode || settings.simpleMode
        ? 1
        : isMobile
            ? clamp(window.devicePixelRatio || 1, 1, 1.5)
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
    gameArea.style.background = isDefaultFavicon ? "radial-gradient(circle at 50% 36%, rgba(255,255,255,.90) 0%, rgba(225,239,198,.88) 42%, rgba(26,36,25,.92) 100%)" : "#111827";
    gameArea.style.backgroundImage = isDefaultFavicon
        ? `linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.12)), url("${url}")`
        : `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url("${url}")`;
    gameArea.style.backgroundRepeat = "no-repeat";
    gameArea.style.backgroundSize = "cover";
    gameArea.style.backgroundPosition = "center";
}

function fullscreenLikeCanvasHeight(): string {
    return isFullscreenMode || isPseudoFullscreenMode ? "100dvh" : "100%";
}

function scheduleViewportStabilize(startAgain = false): void {
    if (isAppTerminated) return;
    normalizeAppViewportStyles();
    const keepRunning = startAgain || (isStarted && !isFinished);
    const delays = [0, 80, 220, 520];
    for (const delay of delays) {
        window.setTimeout(() => {
            if (isAppTerminated) return;
            normalizeAppViewportStyles();
            const currentWidth = Math.floor(window.innerWidth || document.documentElement.clientWidth || geometry.width);
            const currentHeight = Math.floor(window.innerHeight || document.documentElement.clientHeight || geometry.height);
            const canvasTooSmall = isMobile && (canvas.clientWidth < currentWidth * 0.86 || canvas.clientHeight < Math.max(320, currentHeight * 0.32));
            if (keepRunning || canvasTooSmall) resetExperiment(keepRunning && !isFinished);
            appRoot.style.width = "100vw";
            appRoot.style.height = "100dvh";
            gameArea.style.width = "100%";
            gameArea.style.minHeight = "0";
            canvas.style.maxWidth = "100vw";
            canvas.style.maxHeight = fullscreenLikeCanvasHeight();
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
    normalizeAppViewportStyles();
    ensureRenderLoop();
    geometry = calculateGeometry();
    info.style.height = `${geometry.infoHeight}px`;
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
    appRoot.style.width = "100vw";
    appRoot.style.minWidth = "100vw";
    appRoot.style.height = "100dvh";
    appRoot.style.minHeight = "100dvh";
    gameArea.style.width = "100%";
    gameArea.style.minWidth = "100%";
    gameArea.style.minHeight = "0";
    normalizeAppViewportStyles();
    applyBackgroundImage();

    for (const pin of temporaryPinBodies) Composite.remove(engine.world, pin);
    temporaryPinBodies.clear();
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
    randomBuckets = Array.from({ length: RANDOM_BUCKET_COUNT }, () => 0);
    randomCallCount = 0;
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
        if (pixiApp) (pixiApp.canvas as HTMLCanvasElement).style.display = "none";
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

function startExperiment(): void {
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

function normalizeRemoteMiracleUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    return `${MIRACLE_ASSET_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

function getRemoteAssetRank(asset: RemoteMiracleAsset): string {
    return String(asset.rank ?? "common").toLowerCase();
}

function getRemoteAssetRankScore(asset: RemoteMiracleAsset): number {
    const rank = String(asset.rank ?? "N").toUpperCase();
    return Math.max(0, getRankScore(rank));
}

function getRemoteMiracleAssetSources(asset: RemoteMiracleAsset): RemoteMiracleAssetSource[] {
    const sources: RemoteMiracleAssetSource[] = [];

    if (asset.sources && asset.sources.length > 0) {
        for (const source of asset.sources) {
            if (!source.url) continue;

            sources.push({
                url: normalizeRemoteMiracleUrl(source.url),
                mimeType: source.mimeType,
            });
        }
    } else if (asset.url) {
        sources.push({
            url: normalizeRemoteMiracleUrl(asset.url),
            mimeType: asset.mimeType,
        });
    }

    return sources;
}

function cleanupRemoteMiracleBadUrls(): void {
    const now = Date.now();

    remoteMiracleBadUrls.forEach((failedAt, url) => {
        if (now - failedAt > REMOTE_MIRACLE_BAD_URL_CACHE_MS) {
            remoteMiracleBadUrls.delete(url);
        }
    });
}

function markRemoteMiracleAssetBad(asset: RemoteMiracleAsset): void {
    const now = Date.now();

    for (const source of getRemoteMiracleAssetSources(asset)) {
        remoteMiracleBadUrls.set(source.url, now);
    }
}

function getUsableRemoteMiracleAssetSources(asset: RemoteMiracleAsset): RemoteMiracleAssetSource[] {
    cleanupRemoteMiracleBadUrls();

    return getRemoteMiracleAssetSources(asset).filter((source) => {
        return !remoteMiracleBadUrls.has(source.url);
    });
}

function isRemoteMiracleAssetUsable(asset: RemoteMiracleAsset): boolean {
    return getUsableRemoteMiracleAssetSources(asset).length > 0;
}

function getDefRank(def?: SpecialEventDef): string {
    return String(def?.rank ?? "common").toLowerCase();
}

function getRemoteRankCandidates(def?: SpecialEventDef): string[] {
    const rank = getDefRank(def);

    if (rank === "god") return ["god", "secret", "ex", "ur", "ssr", "rare", "common"];
    if (rank === "ex") return ["ex", "secret", "god", "ur", "ssr", "rare", "common"];
    if (rank === "ur") return ["ur", "ssr", "rare", "common"];
    if (rank === "ssr") return ["ssr", "rare", "common"];
    if (rank === "sr") return ["sr", "rare", "common"];
    if (rank === "rare") return ["rare", "common"];

    return ["common", "rare"];
}

function normalizeRemoteMiracleAssetsFromManifest(manifest: RemoteMiracleManifest): RemoteMiracleAsset[] {
    const assets = Array.isArray(manifest.assets) ? manifest.assets : [];

    return assets.filter((asset) => {
        if (!asset || !asset.id || !asset.kind) return false;
        if (asset.kind !== "video" && asset.kind !== "audio") return false;
        if (!asset.url && (!asset.sources || asset.sources.length === 0)) return false;
        return true;
    });
}

function saveRemoteMiracleManifestBackup(manifest: RemoteMiracleManifest): void {
    try {
        localStorage.setItem(REMOTE_MIRACLE_MANIFEST_BACKUP_STORAGE_KEY, JSON.stringify(manifest));
    } catch {
        // オフライン再生の補助情報なので、保存失敗しても通常動作を優先します。
    }
}

function loadRemoteMiracleManifestBackup(): RemoteMiracleAsset[] {
    try {
        const raw = localStorage.getItem(REMOTE_MIRACLE_MANIFEST_BACKUP_STORAGE_KEY);
        if (!raw) return [];
        return normalizeRemoteMiracleAssetsFromManifest(JSON.parse(raw) as RemoteMiracleManifest);
    } catch {
        return [];
    }
}

async function loadRemoteMiracleAssets(force = false): Promise<RemoteMiracleAsset[]> {
    const now = Date.now();

    if (!force && remoteMiracleAssets.length > 0 && now - remoteMiracleAssetsLoadedAt < REMOTE_MIRACLE_MANIFEST_CACHE_MS) {
        return remoteMiracleAssets;
    }

    if (!force && remoteMiracleAssetsLoading) {
        return remoteMiracleAssetsLoading;
    }

    remoteMiracleAssetsLoading = fetch(MIRACLE_MANIFEST_URL, { cache: "no-cache" })
        .then(async (res) => {
            if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
            const manifest = (await res.json()) as RemoteMiracleManifest;

            remoteMiracleAssets = normalizeRemoteMiracleAssetsFromManifest(manifest);
            remoteMiracleAssetsLoadedAt = Date.now();
            saveRemoteMiracleManifestBackup({ ...manifest, assets: remoteMiracleAssets });
            return remoteMiracleAssets;
        })
        .catch((error) => {
            console.warn("[Miracle R2] manifest load failed", error);
            const backupAssets = loadRemoteMiracleManifestBackup();
            if (backupAssets.length > 0) {
                remoteMiracleAssets = backupAssets;
                remoteMiracleAssetsLoadedAt = Date.now();
                return remoteMiracleAssets;
            }
            return remoteMiracleAssets;
        })
        .finally(() => {
            remoteMiracleAssetsLoading = null;
        });

    return remoteMiracleAssetsLoading;
}

function weightedPickRemoteAsset(assets: RemoteMiracleAsset[]): RemoteMiracleAsset | null {
    if (assets.length === 0) return null;

    const total = assets.reduce((sum, asset) => sum + Math.max(1, Number(asset.weight ?? 1)), 0);
    let roll = appRandom() * total;

    for (const asset of assets) {
        roll -= Math.max(1, Number(asset.weight ?? 1));
        if (roll <= 0) return asset;
    }

    return assets[assets.length - 1] ?? null;
}

function selectRemoteMiracleVideoAsset(assets: RemoteMiracleAsset[], def?: SpecialEventDef): RemoteMiracleAsset | null {
    const videos = assets.filter((asset) => asset.kind === "video" && isRemoteMiracleAssetUsable(asset));
    if (videos.length === 0) return null;

    const defRank = getDefRank(def);
    const exact = videos.filter((asset) => getRemoteAssetRank(asset) === defRank);
    if (exact.length > 0) return weightedPickRemoteAsset(exact);

    const candidates = getRemoteRankCandidates(def);
    const ranked = videos.filter((asset) => candidates.includes(getRemoteAssetRank(asset)));
    if (ranked.length > 0) return weightedPickRemoteAsset(ranked);

    return weightedPickRemoteAsset(videos);
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
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    return /iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function hideMobileVideoSoundRetryButton(): void {
    if (!mobileVideoSoundRetryButton) return;
    mobileVideoSoundRetryButton.remove();
    mobileVideoSoundRetryButton = null;
}

function prepareRemoteVideoForSound(video: HTMLVideoElement, volume = 0.45): void {
    const normalizedVolume = soundEnabled ? clamp(volume, 0, 1) : 0;
    video.autoplay = false;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.controls = false;

    if (soundEnabled) {
        video.muted = false;
        video.defaultMuted = false;
        video.removeAttribute("muted");
        video.volume = normalizedVolume;
    } else {
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute("muted", "");
        video.volume = 0;
    }
}

async function unlockMobileAudio(showNotice = false): Promise<boolean> {
    if (mobileAudioUnlocked && toneReady) {
        if (showNotice) showSoftToast("音声はすでに有効です");
        return true;
    }

    soundEnabled = true;
    try {
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
    if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url;
    try {
        const u = new URL(url, window.location.href);
        u.searchParams.set("mbl_video", `${asset.id || "asset"}_${remoteMiracleAssetsLoadedAt || Date.now()}`);
        return u.toString();
    } catch {
        const sep = url.includes("?") ? "&" : "?";
        return `${url}${sep}mbl_video=${encodeURIComponent(String(asset.id || Date.now()))}`;
    }
}

function getRemoteMiracleAssetMainUrl(asset: RemoteMiracleAsset): string {
    return getRemoteMiracleAssetSources(asset)[0]?.url ?? "";
}

function getRemoteMiracleAssetLabel(asset: RemoteMiracleAsset): string {
    const rank = String(asset.rank ?? "common").toUpperCase();
    return `[${rank}] ${asset.id} / 再生10秒固定`;
}

function getRemoteMiracleVideoVolume(asset: RemoteMiracleAsset): number {
    return clamp(Number(asset.volume ?? 0.45), 0, 1);
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

    const usableSources = getUsableRemoteMiracleAssetSources(asset);
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
    video.preload = isMobile ? "metadata" : "auto";

    video.style.position = "absolute";
    video.style.left = "0";
    video.style.top = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.opacity = String(isMobile ? clamp(Number(asset.opacity ?? 0.58), 0.22, 0.92) : clamp(Number(asset.opacity ?? 0.92), 0.82, 1));
    video.style.filter = isMobile ? "saturate(1.22) contrast(1.10) brightness(1.05)" : "saturate(1.35) contrast(1.18) brightness(1.08)";
    video.style.mixBlendMode = isMobile ? "screen" : "normal";
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
    remoteMiracleVideoOverlay.style.background = isMobile ? "rgba(0,0,0,.04)" : "rgba(0,0,0,.52)";
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
        const asset = weightedPickRemoteAsset(videos);
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
    if (!settings.effectsEnabled && !shouldForceMiracleEffects(def)) return;

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
        const asset = selectRemoteMiracleVideoAsset(assets, def) ?? weightedPickRemoteAsset(videos) ?? videos[0];
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
    const leftWall = Bodies.rectangle(geometry.wallWidth / 2, geometry.height / 2, geometry.wallWidth, geometry.height, { isStatic: true, render: { fillStyle: "rgba(36, 41, 54, 0.92)" } });
    const rightWall = Bodies.rectangle(geometry.width - geometry.wallWidth / 2, geometry.height / 2, geometry.wallWidth, geometry.height, { isStatic: true, render: { fillStyle: "rgba(36, 41, 54, 0.92)" } });
    const ground = Bodies.rectangle(geometry.width / 2, geometry.height - geometry.groundHeight / 2, geometry.width - geometry.wallWidth * 2, geometry.groundHeight, { isStatic: true, render: { fillStyle: "rgba(36, 41, 54, 0.92)" } });
    return [leftWall, rightWall, ground];
}


function rollRarePin(): RarePinDef | null {
    if (settings.simpleMode) return null;
    for (const def of RARE_PIN_DEFS) {
        if (appRandom() < def.rate) return def;
    }
    return null;
}

function getRarePinDef(kind: RarePinKind | undefined): RarePinDef | null {
    return RARE_PIN_DEFS.find((x) => x.kind === kind) ?? null;
}

function maybeTriggerMiracleOmen(force = false): void {
    if (isAppTerminated || !settings.effectsEnabled || settings.simpleMode || isPaused || isMiraclePaused || isFinished) return;
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

function generateResearchMemoText(): string {
    const elapsed = formatElapsedTime((targetReachedTime ?? endTime ?? Date.now()) - startTime);
    const sum = binCounts.reduce((a, b) => a + b, 0) || 1;
    const maxCount = Math.max(...binCounts, 0);
    const minCount = Math.min(...binCounts);
    const topIndex = binCounts.indexOf(maxCount);
    const discardRate = finishedCount > 0 ? (discardedCount / finishedCount) * 100 : 0;
    const imbalance = ((maxCount - minCount) / sum) * 100;
    const best = miracleLogs[0];
    const discoveredCount = SPECIAL_EVENT_DEFS.filter((d) => (savedRecords.discovered[d.kind] ?? 0) + (specialCreated[d.kind] ?? 0) > 0).length;
    const rarePinSummary = RARE_PIN_DEFS.map((x) => `${x.label}${rarePinTouchCount[x.kind] ?? 0}`).join(" / ");
    const mood = imbalance > 18 ? "大きな偏りがあり、盤面がかなり主張した回でした。" : imbalance > 10 ? "少し偏りがあり、中央か端に流れが寄った回でした。" : "分布は比較的落ち着いており、安定した観測になりました。";
    const miracleLine = best ? `今回もっとも印象的だった奇跡は「${best.label}」です。` : "今回は大きな奇跡は出ませんでしたが、通常観測として記録する価値があります。";
    const omenLine = lastOmenText ? `途中で「${lastOmenText}」という予兆が観測されました。` : "今回は目立った奇跡予兆は観測されませんでした。";
    return `今回の研究では ${finishedCount.toLocaleString()} 個のボールを処理しました。所要時間は ${elapsed}、捨て区間は ${discardedCount.toLocaleString()} 個（${discardRate.toFixed(2)}%）です。もっとも多かった受け皿は「${topIndex >= 0 ? labels[topIndex] : "-"}」で ${maxCount.toLocaleString()} 回でした。${mood}\n${miracleLine}\n${omenLine}\nレアピン接触記録は ${rarePinSummary} です。役物通過は START:${pachinkoYakumonoHitCount.start} / 役物:${pachinkoYakumonoHitCount.center} / PREMIUM:${pachinkoYakumonoHitCount.premium}、当選は ${pachinkoJackpotCount} 回です。奇跡図鑑は ${discoveredCount} / ${SPECIAL_EVENT_DEFS.length} 種類まで解放されています。`;
}

function generateResearchMemoHtml(): string {
    return escapeHtml(generateResearchMemoText()).replace(/\n/g, "<br>");
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
    resultOverlay.innerHTML = `
        <div style="max-width:820px;width:min(820px,94vw);padding:${isMobile ? "28px 18px" : "38px"};border-radius:30px;background:rgba(15,23,42,.82);box-shadow:0 28px 90px rgba(0,0,0,.50);text-align:center;">
            <div style="font-size:clamp(34px,7vw,72px);font-weight:1000;color:#fff;">安全停止しました</div>
            <div style="margin-top:16px;font-size:clamp(17px,3vw,28px);line-height:1.7;color:#e5e7eb;">物理エンジン、描画、演出タイマーを停止しました。<br>スマホではこの後ブラウザの戻るボタンやタブを閉じる操作で終了してください。</div>
            <div style="margin-top:20px;font-size:clamp(15px,2.4vw,22px);line-height:1.7;color:#cbd5e1;text-align:left;background:rgba(255,255,255,.08);padding:16px;border-radius:18px;">${generateResearchMemoHtml()}</div>
            <div style="margin-top:22px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;"><button id="safe-close-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(255,255,255,.35);cursor:pointer;font-weight:900;background:rgba(255,255,255,.16);color:#fff;">閉じる</button></div>
        </div>`;
    resultOverlay.style.display = "flex";
    document.getElementById("safe-close-result-button")!.onclick = () => closeFinalResult();
    showSoftToast(t("安全停止しました", "Safely stopped"));
}

function pickRandomPachinkoNailPattern(): string {
    const patterns = ['standard', 'wave', 'hourglass', 'stairs', 'crown', 'diamond', 'zigzag', 'spiral', 'heart'];
    return patterns[Math.floor(appRandom() * patterns.length)] ?? 'standard';
}

function getPachinkoPinOffset(pattern: string, row: number, col: number, rowCount: number, colCount: number, baseX: number, y: number): { x: number; y: number } {
    const centerX = geometry.width / 2;
    const rowNorm = rowCount <= 1 ? 0 : row / (rowCount - 1);
    const colNorm = colCount <= 1 ? 0 : (col / (colCount - 1)) * 2 - 1;
    let dx = 0;
    let dy = 0;
    const swing = geometry.binWidth * 0.24;
    if (pattern === 'wave') {
        dx += Math.sin(row * 0.95 + col * 0.75) * geometry.binWidth * 0.18;
        dy += Math.cos(col * 0.62 + row * 0.4) * 5 * geometry.scale;
    } else if (pattern === 'hourglass') {
        const squeeze = 1 - Math.abs(rowNorm * 2 - 1);
        dx += -Math.sign(baseX - centerX || 1) * squeeze * swing;
    } else if (pattern === 'stairs') {
        dx += ((row % 4) - 1.5) * geometry.binWidth * 0.10 + (col % 2 === 0 ? 1 : -1) * geometry.binWidth * 0.06;
        dy += (col % 3 - 1) * 3.6 * geometry.scale;
    } else if (pattern === 'crown') {
        dx += Math.sin(colNorm * Math.PI * 2.5) * geometry.binWidth * 0.16;
        if (row < Math.max(2, Math.floor(rowCount * 0.34))) dy -= Math.max(0, 1 - Math.abs(colNorm) * 1.7) * 16 * geometry.scale;
    } else if (pattern === 'diamond') {
        dx += colNorm * Math.abs(rowNorm * 2 - 1) * geometry.binWidth * 0.28;
    } else if (pattern === 'zigzag') {
        dx += (row % 2 === 0 ? 1 : -1) * Math.abs(colNorm) * geometry.binWidth * 0.22;
    } else if (pattern === 'spiral') {
        dx += Math.sin(row * 0.48) * colNorm * geometry.binWidth * 0.30 + Math.cos(col * 0.7) * geometry.binWidth * 0.08;
        dy += Math.sin(row * 0.9 + col * 0.4) * 4.5 * geometry.scale;
    } else if (pattern === 'heart') {
        const heartPull = Math.sin(rowNorm * Math.PI) * geometry.binWidth * 0.18;
        dx += -Math.sign(colNorm || 1) * heartPull;
        if (rowNorm < 0.45) dy -= Math.max(0, 0.5 - Math.abs(colNorm)) * 10 * geometry.scale;
        if (rowNorm > 0.55) dy += Math.max(0, 1 - Math.abs(colNorm) * 1.5) * 8 * geometry.scale;
    }
    return {
        x: clamp(baseX + dx, geometry.wallWidth + geometry.pinRadius * 2.2, geometry.width - geometry.wallWidth - geometry.pinRadius * 2.2),
        y: y + dy,
    };
}

function createPachinkoNailGate(cx: number, cy: number, spread: number, angleOpen: number, length: number): Matter.Body[] {
    const fillStyle = 'rgba(120,130,152,0.96)';
    const strokeStyle = 'rgba(255,255,255,0.82)';
    const left = Bodies.rectangle(cx - spread / 2, cy, Math.max(5 * geometry.scale, 4), length, { isStatic: true, angle: -angleOpen, render: { fillStyle, strokeStyle, lineWidth: Math.max(1.2, 1.5 * geometry.scale) } as any });
    const right = Bodies.rectangle(cx + spread / 2, cy, Math.max(5 * geometry.scale, 4), length, { isStatic: true, angle: angleOpen, render: { fillStyle, strokeStyle, lineWidth: Math.max(1.2, 1.5 * geometry.scale) } as any });
    (left as any).plugin = { isPin: true, baseX: left.position.x, baseY: left.position.y, wiggleFrames: 0, nailDecor: true };
    (right as any).plugin = { isPin: true, baseX: right.position.x, baseY: right.position.y, wiggleFrames: 0, nailDecor: true };
    return [left, right];
}

function createPins(): Matter.Body[] {
    const pins: Matter.Body[] = [];
    const pinStartY = clamp(70 * geometry.scale, 40, 120);
    const pinEndY = geometry.groundTop - geometry.dividerHeight - clamp(36 * geometry.scale, 20, 70);
    const spacingY = settings.pinRows > 1 ? (pinEndY - pinStartY) / (settings.pinRows - 1) : 60 * geometry.scale;
    const pattern = currentPachinkoNailPattern || 'standard';

    for (let row = 0; row < settings.pinRows; row++) {
        const y = pinStartY + row * spacingY;
        const baseEven = row % 2 === 0;
        const baseColCount = baseEven ? geometry.totalBinCount : Math.max(geometry.totalBinCount - 1, 1);
        for (let col = 0; col < baseColCount; col++) {
            const actualCol = baseEven ? col : col + 1;
            const baseX = baseEven
                ? geometry.binLeft + geometry.binWidth / 2 + actualCol * geometry.binWidth
                : geometry.binLeft + actualCol * geometry.binWidth;
            const pos = getPachinkoPinOffset(pattern, row, col, settings.pinRows, baseColCount, baseX, y);
            const rarePin = rollRarePin();
            const pin = Bodies.circle(pos.x, pos.y, geometry.pinRadius, {
                isStatic: true,
                render: {
                    fillStyle: rarePin?.fillStyle ?? 'rgba(196,154,58,.98)',
                    strokeStyle: rarePin?.strokeStyle ?? 'rgba(255,246,190,.98)',
                    lineWidth: Math.max(1.4, (rarePin ? 3.2 : 2.4) * geometry.scale),
                } as any,
            });
            (pin as any).plugin = { isPin: true, baseX: pos.x, baseY: pos.y, wiggleFrames: 0, rarePinKind: rarePin?.kind, rarePinLabel: rarePin?.label };
            pins.push(pin);
        }
    }

    const nailGateCount = 4 + Math.floor(appRandom() * 5);
    for (let i = 0; i < nailGateCount; i++) {
        const y = pinStartY + ((i + 1) / (nailGateCount + 1)) * (pinEndY - pinStartY);
        const sway = Math.sin(i * 1.7 + pattern.length * 0.31);
        const x = geometry.width / 2 + sway * geometry.binWidth * (1.1 + (i % 3) * 0.45);
        const spread = clamp(geometry.binWidth * (0.8 + (i % 3) * 0.2), 26 * geometry.scale, 74 * geometry.scale);
        const angle = (0.28 + ((i + pattern.length) % 4) * 0.08) * (i % 2 === 0 ? 1 : -1);
        const length = clamp(geometry.binWidth * (0.32 + (i % 2) * 0.10), 22 * geometry.scale, 46 * geometry.scale);
        pins.push(...createPachinkoNailGate(x, y, spread, angle, length));
    }
    return pins;
}

function createDividers(): Matter.Body[] {
    const dividers: Matter.Body[] = [];
    for (let i = 1; i < geometry.totalBinCount; i++) {
        const x = geometry.binLeft + geometry.binWidth * i;
        dividers.push(Bodies.rectangle(x, geometry.dividerY, geometry.dividerWidth, geometry.dividerHeight, { isStatic: true, render: { fillStyle: "rgba(196, 101, 101, 0.94)" } }));
    }
    return dividers;
}

function createPachinkoYakumonoSensors(): Matter.Body[] {
    return PACHINKO_YAKUMONO_DEFS.map((def) => {
        const width = clamp(geometry.width * def.widthRatio, 82 * geometry.scale, 260 * geometry.scale);
        const height = clamp(def.height * geometry.scale, 12, 32);
        const body = Bodies.rectangle(geometry.width * def.xRatio, geometry.height * def.yRatio, width, height, {
            isStatic: true,
            isSensor: true,
            render: {
                fillStyle: "rgba(255,255,255,0.01)",
                strokeStyle: "rgba(255,255,255,0.01)",
                lineWidth: 1,
            } as any,
        });
        (body as any).plugin = { isYakumono: true, yakumonoKind: def.kind, yakumonoLabel: def.label, oddsScale: def.oddsScale, score: def.score, color: def.color };
        return body;
    });
}

function getPachinkoYakumonoDef(kind: PachinkoYakumonoKind): PachinkoYakumonoDef {
    return PACHINKO_YAKUMONO_DEFS.find((x) => x.kind === kind) ?? PACHINKO_YAKUMONO_DEFS[0];
}

function createDropPlugin(kind: DropKind, x: number, y: number, radius: number, extras: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        isDrop: true,
        kind,
        stuckFrames: 0,
        lastX: x,
        lastY: y,
        lifeFrames: 0,
        bornAt: performance.now(),
        hardExpireMs: kind === "giant" ? 9000 : kind === "shape" ? 16000 : 15000,
        originalRadius: radius,
        passedYakumonoIds: {},
        ...extras,
    };
}

function createRandomShapeBody(x: number, y: number, radius: number, renderOptions: any): Matter.Body {
    const commonOptions: any = { restitution: 0.92, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0011, render: renderOptions };
    const choice = Math.floor(appRandom() * 9);
    let body: Matter.Body;
    let shapeName = "";
    if (choice === 0) { shapeName = "角丸四角形"; body = Bodies.rectangle(x, y, radius * 1.7, radius * 1.7, { ...commonOptions, chamfer: { radius: radius * 0.25 } }); }
    else if (choice === 1) { shapeName = "角丸長方形"; body = Bodies.rectangle(x, y, radius * 2.4, radius * 1.1, { ...commonOptions, chamfer: { radius: radius * 0.22 } }); }
    else if (choice === 2) { shapeName = "三角形"; body = Bodies.polygon(x, y, 3, radius * 1.35, commonOptions); }
    else if (choice === 3) { shapeName = "五角形"; body = Bodies.polygon(x, y, 5, radius * 1.35, commonOptions); }
    else if (choice === 4) { shapeName = "六角形"; body = Bodies.polygon(x, y, 6, radius * 1.35, commonOptions); }
    else if (choice === 5) { shapeName = "八角形"; body = Bodies.polygon(x, y, 8, radius * 1.35, commonOptions); }
    else if (choice === 6) { shapeName = "台形"; body = Bodies.trapezoid(x, y, radius * 2.2, radius * 1.5, 0.35, commonOptions); }
    else if (choice === 7) { shapeName = "短い棒"; body = Bodies.rectangle(x, y, radius * 2.5, radius * 0.9, { ...commonOptions, chamfer: { radius: radius * 0.2 } }); }
    else { shapeName = "多角形"; body = Bodies.polygon(x, y, 7, radius * 1.45, commonOptions); }

    (body as any).plugin = createDropPlugin("shape", x, y, radius, { shapeName });
    return body;
}

function createHeartBody(x: number, y: number, radius: number, renderOptions: any): Matter.Body {
    const options: any = { restitution: 0.96, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0012, render: renderOptions };
    const left = Bodies.circle(x - radius * 0.48, y - radius * 0.25, radius * 0.62, options);
    const right = Bodies.circle(x + radius * 0.48, y - radius * 0.25, radius * 0.62, options);
    const bottom = Bodies.polygon(x, y + radius * 0.25, 3, radius * 1.25, options);
    Body.rotate(bottom, Math.PI);
    const heart = Body.create({ parts: [left, right, bottom], restitution: 0.96, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0012, render: renderOptions });
    (heart as any).plugin = createDropPlugin("heart", x, y, radius, { symbol: "♥", shapeName: "桃色ハート" });
    return heart;
}

function createSymbolBody(x: number, y: number, radius: number, kind: DropKind, fillStyle: string, symbol: string, label: string): Matter.Body {
    const body = Bodies.circle(x, y, radius, { restitution: 0.98, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0013, render: { fillStyle, strokeStyle: "#ffffff", lineWidth: 4 * geometry.scale } as any });
    (body as any).plugin = createDropPlugin(kind, x, y, radius, { symbol, shapeName: label });
    return body;
}

function createTinyFragment(x: number, y: number, baseRadius: number, color: string): Matter.Body {
    const radius = Math.max(2, baseRadius / 10);
    const sides = 3 + Math.floor(appRandom() * 5);
    const body = Bodies.polygon(x, y, sides, radius, { restitution: 0.9, friction: 0.001, frictionStatic: 0, frictionAir: 0.01, density: 0.0008, render: { fillStyle: color, strokeStyle: "rgba(255,255,255,0.95)", lineWidth: 1 } as any });
    (body as any).plugin = { isDecoration: true, kind: "fragment" };
    Body.setVelocity(body, { x: (appRandom() - 0.5) * 14 * geometry.scale, y: -8 * geometry.scale - appRandom() * 8 * geometry.scale });
    Body.setAngularVelocity(body, (appRandom() - 0.5) * 0.7);
    return body;
}

function explodeStuckDrop(body: Matter.Body): void {
    const plugin = (body as any).plugin;
    const originalRadius = plugin?.originalRadius ?? body.circleRadius ?? geometry.ballRadius;
    const kind = plugin?.kind ?? "unknown";
    const color = (body.render as any)?.fillStyle ?? randomColor();

    if (!settings.simpleMode) {
        const label = kind === "giant" ? "巨大玉 分裂" : kind === "shape" ? "図形 分裂" : "詰まり分裂";
        addFloatingText(label, body.position.x, body.position.y - 20 * geometry.scale, "#ff66aa");
        triggerCameraShake(12 * geometry.scale, 280);
    }
    if (settings.simpleMode) return;

    const fragmentCount = kind === "giant" ? 28 : 16 + Math.floor(appRandom() * 10);
    for (let i = 0; i < fragmentCount; i++) Composite.add(engine.world, createTinyFragment(body.position.x + (appRandom() - 0.5) * originalRadius, body.position.y + (appRandom() - 0.5) * originalRadius, originalRadius, color));
}

function getCurrentTimeBallTheme(date = new Date()): TimeBallTheme {
    const hour = date.getHours();
    if (hour >= 5 && hour <= 10) return "morning";
    if (hour >= 11 && hour <= 16) return "day";
    if (hour >= 17 && hour <= 19) return "evening";
    if (hour >= 20 && hour <= 23) return "night";
    return "midnight";
}

function getTimeBallThemeLabel(theme: TimeBallTheme): string {
    if (theme === "morning") return t("朝露観測モード", "Morning dew mode");
    if (theme === "day") return t("通常観測モード", "Standard observation mode");
    if (theme === "evening") return t("夕焼け反応モード", "Sunset reaction mode");
    if (theme === "night") return t("星夜観測モード", "Starry night mode");
    return t("深夜異常観測モード", "Midnight anomaly mode");
}

function getTimeBallSkinLabel(skin: TimeBallSkin): string {
    if (skin === "drop") return t("朝露のしずく", "Morning drop");
    if (skin === "gloss") return t("光沢サンプル球", "Gloss sample");
    if (skin === "spark") return t("薄暮の火種", "Sunset spark");
    if (skin === "star") return t("夜空の星片", "Star fragment");
    if (skin === "moon") return t("月影サンプル", "Moon sample");
    if (skin === "darkShard") return t("黒い欠片", "Dark shard");
    if (skin === "swordShard") return t("剣の破片", "Sword shard");
    if (skin === "coin") return t("金曜のコイン", "Friday coin");
    if (skin === "heart") return t("日曜のハート", "Sunday heart");
    if (skin === "crown") return t("土曜の小さな王冠", "Saturday crown");
    return t("通常玉", "Normal ball");
}

function chooseTimeBallSkin(): TimeBallSkin {
    if (!settings.timeBallSkinsEnabled) return "normal";
    const now = new Date();
    const theme = getCurrentTimeBallTheme(now);
    const day = now.getDay();
    const roll = appRandom();

    if (day === 6 && roll < 0.05) return "crown";
    if (day === 0 && roll < 0.05) return "heart";
    if (day === 5 && roll < 0.05) return "coin";

    if (theme === "morning") return roll < 0.20 ? "drop" : "normal";
    if (theme === "day") return roll < 0.05 ? "gloss" : "normal";
    if (theme === "evening") return roll < 0.20 ? "spark" : "normal";
    if (theme === "night") {
        if (roll < 0.15) return "star";
        if (roll < 0.20) return "moon";
        return "normal";
    }
    if (roll < 0.20) return "darkShard";
    if (roll < 0.25) return "swordShard";
    return "normal";
}

function getTimeBallSkinFillStyle(skin: TimeBallSkin, fallback: string): string {
    if (skin === "drop") return "#8ee7ff";
    if (skin === "gloss") return fallback;
    if (skin === "spark") return "#ff9f43";
    if (skin === "star") return "#fff176";
    if (skin === "moon") return "#dbeafe";
    if (skin === "darkShard") return "#111827";
    if (skin === "swordShard") return "#dff7ff";
    if (skin === "coin") return "#f6c945";
    if (skin === "heart") return "#ff7ab6";
    if (skin === "crown") return "#ffd54a";
    return fallback;
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
    const tapRadius = Math.max(34 * geometry.scale, geometry.pinRadius * 4.5);
    if (!nearest || nearestDistance > tapRadius) return;

    const plugin = (nearest as any).plugin;
    plugin.baseX = plugin.baseX ?? nearest.position.x;
    plugin.baseY = plugin.baseY ?? nearest.position.y;
    const dir = nearest.position.x >= point.x ? 1 : -1;
    plugin.wiggleFrames = 96;
    plugin.wiggleTotal = 96;
    plugin.wigglePower = 1.45;
    plugin.bendDirection = dir;

    for (const body of engine.world.bodies) {
        const p = (body as any).plugin;
        if (!p?.isDrop) continue;
        const distance = Math.hypot(body.position.x - nearest.position.x, body.position.y - nearest.position.y);
        if (distance < tapRadius * 3) {
            Body.setVelocity(body, { x: (body.position.x - nearest.position.x) * 0.08 + (appRandom() - 0.5) * 8 * geometry.scale, y: -5 * geometry.scale });
            Body.setAngularVelocity(body, (appRandom() - 0.5) * 0.5);
        }
    }

    addFloatingText("ゴムピンしなり", nearest.position.x, nearest.position.y - 22 * geometry.scale, "#facc15");
    triggerCameraShake(4 * geometry.scale, 140);
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
        const power = (plugin.wigglePower ?? 1) * Math.max(8 * geometry.scale, geometry.pinRadius * 1.15);
        plugin.bendAmount = clamp(elastic * dir * 3.2, -3.2, 3.2);
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
    return NORMAL_BALL_TRAITS.map((trait) => `<li><b>${trait.label}</b>: ${trait.description}</li>`).join("");
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
    commentaryOverlay.innerHTML = `<div style="position:absolute;white-space:nowrap;left:100vw;bottom:0;padding:4px 16px;border-radius:999px;background:rgba(15,23,42,.74);color:#fff;font-weight:900;font-size:${isMobile ? "18px" : "16px"};line-height:1.4;text-shadow:0 2px 8px rgba(0,0,0,.45);box-shadow:0 8px 22px rgba(0,0,0,.22);transition:transform ${COMMENTARY_DISPLAY_MS}ms linear;">${message}</div>`;
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
    const icons = ["🎆", "💥", "🌊", "🎂", "👍", "⚡", "🐶", "🐱", "⭐", "🔥", "🪐", "🎉", "🌈", "🦊", "🐸", "🦄", "🍀", "🍙", "🍜", "🍤", "🍣", "🥁", "🎺", "🎸", "🪩", "🛸", "🚀", "🌋", "🗿", "👺", "🥷", "🧊", "🫧", "🌪️", "☄️", "🌕", "🌞", "🦖", "🐉", "🦕"];
    const prefixes = ["大", "超", "激", "謎", "夢", "夜", "朝", "山", "海", "森", "宇宙", "古代", "未来", "昭和", "平成", "令和", "無音", "爆速", "低速", "ぬるぬる"];
    const suffixes = ["花火", "爆発", "祭り", "旋風", "波動", "祝福", "行進", "ダンス", "点滅", "ジャンプ", "拍手", "覚醒", "降臨", "乱舞", "パレード", "お祝い", "びっくり", "フィーバー", "チャンス", "ミラクル"];
    const i = Math.floor(appRandom() * icons.length);
    const prefix = prefixes[Math.floor(appRandom() * prefixes.length)];
    const suffix = suffixes[Math.floor(appRandom() * suffixes.length)];
    return { icon: icons[i], name: `${prefix}${suffix}` };
}

function showFullScreenCelebration(count: number): void {
    if (settings.simpleMode) return;
    vibrateOnMobile([35, 20, 35]);
    fireConfetti("normal");
    const effect = pickCelebrationEffect();
    celebrationOverlay.innerHTML = `
        <div style="position:absolute;inset:0;background:${randomRgba(0.45)};backdrop-filter:blur(4px);"></div>
        <div style="position:relative;z-index:2;padding:30px;border-radius:30px;background:rgba(255,255,255,0.22);box-shadow:0 24px 70px rgba(0,0,0,0.32);animation:celeb-main-pop 2s ease-out forwards;">
            <style>@keyframes celeb-main-pop{0%{transform:scale(.72);opacity:0}18%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:0}}</style>
            <div style="font-size:clamp(70px,17vw,180px);line-height:1;">${effect.icon}</div>
            <div style="margin-top:14px;font-size:clamp(30px,8vw,96px);font-weight:900;color:white;text-shadow:0 6px 22px rgba(0,0,0,.45);">${count.toLocaleString()}回達成！</div>
            <div style="margin-top:8px;font-size:clamp(20px,4vw,46px);font-weight:800;color:white;text-shadow:0 4px 16px rgba(0,0,0,.42);">${effect.name} 演出</div>
        </div>`;
    celebrationOverlay.style.display = "flex";
    window.setTimeout(() => { celebrationOverlay.style.display = "none"; celebrationOverlay.innerHTML = ""; }, 2100);
}


function getMiracleIconHtml(kind: DropKind, fallbackSymbol: string): string {
    const def = findSpecialDef(kind);
    if (def) {
        const imageSize = "clamp(210px,62vw,430px)";
        return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <img src="${createMiracleImageDataUri(def)}" alt="${escapeSvgText(def.label)}" style="width:${imageSize};height:${imageSize};border-radius:clamp(28px,8vw,64px);object-fit:contain;background:rgba(15,23,42,.84);box-shadow:0 26px 80px rgba(0,0,0,.58),0 0 0 clamp(6px,1.2vw,12px) rgba(255,255,255,.18);filter:drop-shadow(0 18px 28px rgba(0,0,0,.42));" />
        </div>`;
    }
    const label = fallbackSymbol || "奇";
    const colors = getSpecialIconColors(kind);
    const common = `display:inline-flex;align-items:center;justify-content:center;width:clamp(120px,34vw,230px);height:clamp(120px,34vw,230px);border-radius:999px;border:clamp(5px,1.2vw,10px) solid ${colors.stroke};background:radial-gradient(circle at 30% 25%, #fff 0%, ${colors.main} 36%, ${colors.sub} 100%);box-shadow:0 0 0 clamp(5px,1vw,14px) rgba(255,255,255,.18),0 0 60px ${colors.main};color:${colors.text};font-weight:1000;font-size:clamp(50px,14vw,118px);text-shadow:0 3px 0 rgba(0,0,0,.25);line-height:1;`;
    return `<div style="${common}">${label}</div>`;
}

async function playAnimeMiracleEffect(def?: SpecialEventDef): Promise<void> {
    if (settings.simpleMode) return;
    const ok = await ensureAnimeReady();
    if (!ok) return;
    const overlayCard = miracleOverlay.firstElementChild as HTMLElement | null;
    if (!overlayCard) return;
    const strength = def?.rank === "GOD" ? 1.35 : def?.rank === "EX" ? 1.18 : 1;
    const isRepeatedQuickRare = !!def && (repeatedMiracleRunCounts[def.kind] ?? 0) >= 2 && (def.rank === "SR" || def.rank === "SSR");
    const isQuickRare = isRepeatedQuickRare || def?.rank === "SR" || def?.rank === "SSR";
    anime.remove([overlayCard, canvas, gameArea]);
    anime({
        targets: gameArea,
        scale: [1, 1.018 * strength, 1],
        duration: isRepeatedQuickRare ? 180 : isQuickRare ? 360 : 900,
        easing: "easeOutQuad",
    });
    anime.timeline({ easing: "easeOutExpo" })
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
        }, isQuickRare ? 80 : 140)
        .add({
            targets: canvas,
            scale: [1, 1.028 * strength, 1],
            duration: isRepeatedQuickRare ? 180 : isQuickRare ? 320 : 780,
            easing: "easeOutBack",
        }, 0);
}


function speakLifeQuoteEvent(): void {
    const text = "ふふっ、自分の人生で言葉に出来ない程の感動する感情に出会えたらどんに辛いことがあってもまたこの人生をやりたいと思えるらしい";
    if (lifeQuoteOverlayTimer !== undefined) window.clearTimeout(lifeQuoteOverlayTimer);
    subtitleOverlay.innerHTML = `<div style="font-size:${isMobile ? "26px" : "34px"};font-weight:1000;line-height:1.7;text-shadow:0 3px 18px rgba(0,0,0,.55);">${text}</div>`;
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
    if (def) {
        if (shouldPlayEffects) pauseForMiracle(def);
        updateMiracleCombo();
        addMiracleLog(def);
        recordMiracleForChains(def.kind);
        tryTriggerMiracleChains();
        const subtitle = `${def.label} ${t("発生", "appeared")} / [${def.rank}] ${formatProbability(def.denominator)}`;
        if (kind === "lifeQuoteMode") speakLifeQuoteEvent();
        else setSubtitle(subtitle);
        saveMiracleClip(def, subtitle);
        if (shouldPlayEffects) applyRareBackground(kind);
        if (shouldTriggerRareBoardCatastrophe(def)) triggerRareBoardCatastrophe(def);
        updateRecentMiracleMini();
        updateStatusMiniOverlays();
    }
    if (!shouldPlayEffects) return;
    triggerScreenFlash(def?.soundMode ?? "miracle");
    vibrateOnMobile(def?.rank === "GOD" ? [90, 50, 160, 60, 220] : def?.rank === "EX" ? [70, 40, 120, 40, 140] : [55, 28, 80]);
    triggerCameraShake(def?.rank === "GOD" ? 46 * geometry.scale : def?.rank === "EX" ? 34 * geometry.scale : 18 * geometry.scale, def?.rank === "GOD" ? 1200 : def?.rank === "EX" ? 760 : 420, forceRareEffect);
    if (kind === "swordImpact") triggerSwordImpactEffect();

    // 動画演出は、シンプル/低スペック寄りでもレア演出が発生したら試行します。
    // 以前はこの下の simpleMode return により、PC通常演出側だけ動画に到達しないケースがありました。
    if (def) void playRemoteMiracleVideo(def);

    if (settings.simpleMode) return;
    const repeatedInRun = !!def && (repeatedMiracleRunCounts[def.kind] ?? 0) >= 2;
    const overlayDurationMs = getMiraclePauseDuration(def, repeatedInRun);
    const overlayDurationSec = Math.max(0.24, overlayDurationMs / 1000);
    miracleOverlay.innerHTML = `
        <div style="max-width:900px;animation:miracle-pop ${overlayDurationSec.toFixed(2)}s ease-out forwards;">
            <style>@keyframes miracle-pop{0%{transform:scale(.65);opacity:0}15%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:0}}</style>
            ${getMiracleIconHtml(kind, symbol)}
            <div style="font-size:clamp(36px,8vw,90px);font-weight:900;margin-top:12px;text-shadow:0 8px 30px rgba(0,0,0,.6);">${def?.label ?? "奇跡"} 発生</div>
            <div style="font-size:clamp(22px,4vw,44px);font-weight:900;margin-top:12px;">${probabilityText}</div>
            <div style="font-size:clamp(18px,3vw,32px);margin-top:12px;opacity:.94;line-height:1.5;">${feelingText}</div>
            ${miracleCombo >= 2 ? `<div style="margin-top:10px;font-size:clamp(20px,4vw,40px);font-weight:900;color:#ffe560;">${t("奇跡コンボ", "Miracle combo")} x${miracleCombo}</div>` : ""}
            ${repeatedInRun && (def?.rank === "SR" || def?.rank === "SSR") ? `<div style="margin-top:8px;font-size:clamp(16px,3vw,26px);font-weight:900;color:#bbf7d0;">同じSR/SSRのため短縮演出</div>` : ""}
        </div>`;
    if (miracleOverlayTimer !== undefined) {
        window.clearTimeout(miracleOverlayTimer);
        miracleOverlayTimer = undefined;
    }
    miracleOverlay.style.display = "flex";

    void playAnimeMiracleEffect(def);

    fireConfetti(kind === "blackSun" ? "black" : kind === "cosmicEgg" ? "cosmic" : "miracle", forceRareEffect);
    playSpecialSound(kind);
    startMiracleOverlayTimer(overlayDurationMs + 120);
}

function getSoundVolume(base = -8): number {
    return base + (isMobile ? -4 : 0);
}

function playUiSound(kind: "start" | "pause" | "resume" | "open" | "close" | "tick" | "skill" | "time"): void {
    if (!soundEnabled || !toneReady || settings.simpleMode) return;
    try {
        const now = Tone.now();
        const synth = new Tone.Synth({
            oscillator: { type: kind === "time" ? "sine" : kind === "skill" ? "triangle" : "square" },
            envelope: { attack: 0.002, decay: 0.06, sustain: 0.05, release: 0.12 },
        }).toDestination();
        synth.volume.value = getSoundVolume(kind === "tick" ? -18 : -14);
        const notes: Record<string, string[]> = {
            start: ["C5", "E5", "G5"],
            pause: ["E4", "C4"],
            resume: ["C4", "E4"],
            open: ["G4", "B4"],
            close: ["B4", "G4"],
            tick: ["C6"],
            skill: ["D5", "A5"],
            time: ["F4", "C5", "F5"],
        };
        notes[kind].forEach((note, index) => synth.triggerAttackRelease(note, "32n", now + index * 0.055));
        window.setTimeout(() => synth.dispose(), 650);
    } catch {}
}

function playSecretSound(): void {
    if (!soundEnabled || !toneReady || settings.simpleMode) return;
    try {
        const now = Tone.now();
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "fatsawtooth" },
            envelope: { attack: 0.01, decay: 0.18, sustain: 0.18, release: 0.42 },
        }).toDestination();
        synth.volume.value = getSoundVolume(-9);
        ["C4", "E4", "G4", "B4", "D5", "G5"].forEach((note, i) => synth.triggerAttackRelease(note, i < 4 ? "16n" : "8n", now + i * 0.075));
        const noise = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.13, sustain: 0 } }).toDestination();
        noise.volume.value = -22;
        noise.triggerAttackRelease("16n", now + 0.08);
        window.setTimeout(() => { synth.dispose(); noise.dispose(); }, 1200);
    } catch {}
}
function updateSoundButton(): void {
    soundButton.textContent = soundEnabled ? t("音: ON", "Sound: ON") : t("音: OFF", "Sound: OFF");
}


async function enableSound(showNotice = true): Promise<void> {
    try {
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

function createRareSequence(flavor: RareSoundFlavor): Array<{ note: string; duration: string; at: number }> {
    const roll = Math.random();
    if (flavor === "god") {
        const patterns = [
            [{ note: "C4", duration: "8n", at: 0 }, { note: "G4", duration: "8n", at: 0.10 }, { note: "C5", duration: "8n", at: 0.22 }, { note: "E5", duration: "4n", at: 0.36 }, { note: "G5", duration: "2n", at: 0.60 }],
            [{ note: "A3", duration: "8n", at: 0 }, { note: "E4", duration: "8n", at: 0.10 }, { note: "A4", duration: "8n", at: 0.22 }, { note: "C5", duration: "8n", at: 0.34 }, { note: "E5", duration: "2n", at: 0.52 }],
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }
    if (flavor === "ex") {
        if (roll < 0.5) return [{ note: "D4", duration: "16n", at: 0 }, { note: "A4", duration: "16n", at: 0.08 }, { note: "D5", duration: "8n", at: 0.16 }, { note: "F5", duration: "8n", at: 0.28 }];
        return [{ note: "G3", duration: "16n", at: 0 }, { note: "B3", duration: "16n", at: 0.08 }, { note: "D4", duration: "8n", at: 0.16 }, { note: "G4", duration: "4n", at: 0.28 }];
    }
    if (flavor === "ur") {
        if (roll < 0.34) return [{ note: "C5", duration: "16n", at: 0 }, { note: "E5", duration: "16n", at: 0.07 }, { note: "G5", duration: "8n", at: 0.14 }];
        if (roll < 0.67) return [{ note: "F4", duration: "16n", at: 0 }, { note: "A4", duration: "16n", at: 0.07 }, { note: "C5", duration: "8n", at: 0.14 }];
        return [{ note: "G4", duration: "16n", at: 0 }, { note: "B4", duration: "16n", at: 0.07 }, { note: "D5", duration: "8n", at: 0.14 }];
    }
    return [{ note: "G5", duration: "8n", at: 0 }];
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

function playSpecialSound(kind: DropKind): void {
    if (!soundEnabled || !toneReady || settings.simpleMode) return;
    try {
        const flavor = getRareSoundFlavor(kind);
        const repeatCount = flavor === "god" || flavor === "ex" ? 3 : 1;
        void playLocalRareAudio(flavor, repeatCount);
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
    const ok = await ensureConfetti();
    if (!ok) return;
    const colors = mode === "cosmic" ? ["#240038", "#7c3cff", "#ffffff", "#00e5ff", "#ffd700"] : mode === "black" ? ["#000000", "#ff0044", "#ffffff"] : mode === "miracle" ? ["#ffd700", "#ff69b4", "#78e7ff", "#ffffff"] : undefined;
    const intensity = getEffectIntensity(force);
    const mainCount = Math.round((mode === "cosmic" ? 420 : mode === "normal" ? 90 : 220) * intensity);
    const sideCount = Math.round((mode === "cosmic" ? 220 : mode === "normal" ? 50 : 120) * intensity);
    confetti({ particleCount: mainCount, spread: mode === "normal" ? 70 : 140, origin: { y: 0.55 }, colors });
    confetti({ particleCount: sideCount, angle: 60, spread: 80, origin: { x: 0, y: 0.65 }, colors });
    confetti({ particleCount: sideCount, angle: 120, spread: 80, origin: { x: 1, y: 0.65 }, colors });
    if (force || mode !== "normal") fireLibraryParticleBurst(mode === "cosmic" ? "gacha" : mode === "black" ? "magic" : "title");
}

async function togglePixiBackground(): Promise<void> {
    pixiEnabled = !pixiEnabled;
    pixiButton.textContent = pixiEnabled ? t("Pixi背景: ON", "Pixi BG: ON") : t("Pixi背景: OFF", "Pixi BG: OFF");
    showSoftToast(pixiEnabled ? t("Pixi背景をONにしました", "Pixi background enabled") : t("Pixi背景をOFFにしました", "Pixi background disabled"));
    if (pixiEnabled) {
        await initPixiBackground();
        if (pixiApp) (pixiApp.canvas as HTMLCanvasElement).style.display = "block";
    } else if (pixiApp) (pixiApp.canvas as HTMLCanvasElement).style.display = "none";
}

async function initPixiBackground(): Promise<void> {
    if (pixiReady) return;
    try {
        pixiApp = new Application();
        await pixiApp.init({ resizeTo: gameArea, backgroundAlpha: 0, antialias: true });
        const pixiCanvas = pixiApp.canvas as HTMLCanvasElement;
        pixiCanvas.style.position = "absolute";
        pixiCanvas.style.inset = "0";
        pixiCanvas.style.width = "100%";
        pixiCanvas.style.height = "100%";
        pixiCanvas.style.pointerEvents = "none";
        pixiLayer.appendChild(pixiCanvas);
        pixiParticles = [];
        for (let i = 0; i < 26; i++) {
            const g = new Graphics();
            const hue = i % 2 === 0 ? 0xffe060 : 0x9dd6ff;
            g.circle(0, 0, 5 + Math.random() * 9).fill({ color: hue, alpha: 0.20 + Math.random() * 0.22 });
            g.x = Math.random() * gameArea.clientWidth;
            g.y = Math.random() * gameArea.clientHeight;
            (g as any).vx = -0.2 + Math.random() * 0.4;
            (g as any).vy = 0.3 + Math.random() * 1.0;
            (g as any).drift = Math.random() * Math.PI * 2;
            pixiApp.stage.addChild(g);
            pixiParticles.push(g);
        }
        pixiApp.ticker.add(() => {
            if (!pixiEnabled) return;
            for (const p of pixiParticles) {
                (p as any).drift += 0.02;
                p.x += (p as any).vx + Math.sin((p as any).drift) * 0.3;
                p.y += (p as any).vy;
                if (p.y > gameArea.clientHeight + 20) { p.y = -20; p.x = Math.random() * gameArea.clientWidth; }
                if (p.x < -20) p.x = gameArea.clientWidth + 20;
                if (p.x > gameArea.clientWidth + 20) p.x = -20;
            }
        });
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
        <div>${t("実行回数", "Progress")}: <b>${finishedCount.toLocaleString()}</b> / ${settings.targetCount.toLocaleString()}</div>
        <div>${t("役物通過", "Gate hits")}: <b>${Object.values(pachinkoYakumonoHitCount).reduce((a, b) => a + b, 0).toLocaleString()}</b> / ${t("当選", "Jackpots")}: <b>${pachinkoJackpotCount.toLocaleString()}</b></div>
        <div>${t("画面上の玉", "Balls on screen")}: <b>${activeDropCount}</b></div>
        <div>${t("速度", "Speed")}: <b>${getSpeedDisplayLabel()}</b></div>
        <div>${t("確率モード", "Probability mode")}: <b>${isEnglish ? ({normal:"Normal",festival:"Festival",hard:"Hard",hell:"Hell"} as any)[settings.probabilityMode] : getProbabilityModeLabel()}</b></div>
        <div>${t("状態", "Status")}: <b>${!isStarted ? t("待機中", "Idle") : isFinished ? t("完了", "Finished") : isMiraclePaused ? t("奇跡で停止中", "Paused by miracle") : isPaused ? t("停止中", "Paused") : targetReachedTime ? t("残り玉回収中", "Collecting remaining balls") : t("実行中", "Running")}</b></div>
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
    const rows: Array<Array<string | number>> = [];
    rows.push(["browser", browserName]);
    rows.push(["device", isMobile ? "mobile" : "desktop"]);
    rows.push(["target_count", settings.targetCount]);
    rows.push(["probability_mode", settings.probabilityMode]);
    rows.push(["finished_count", finishedCount]);
    rows.push(["bin_count", settings.binCount]);
    rows.push(["pin_rows", settings.pinRows]);
    rows.push(["random_call_count", randomCallCount]);
    rows.push(["discarded_count", discardedCount]);
    rows.push(["run_score", runScore]);
    rows.push(["best_combo", bestComboThisRun]);
    rows.push(["missions_cleared", Object.values(missionProgress).filter(Boolean).length]);
    rows.push(["gold_created", goldCreated]);
    rows.push(["rainbow_created", rainbowCreated]);
    rows.push(["giant_created", giantCreated]);
    rows.push(["shape_created", shapeCreated]);
    rows.push(["crown_created", crownCreated]);
    rows.push(["shooting_star_created", starCreated]);
    rows.push(["heart_created", heartCreated]);
    rows.push(["black_sun_created", blackSunCreated]);
    rows.push(["cosmic_egg_created", cosmicEggCreated]);
    rows.push(["silver_ufo_created", silverUfoCreated]);
    rows.push(["blue_flame_created", blueFlameCreated]);
    rows.push(["lucky_seven_created", luckySevenCreated]);
    rows.push(["time_rift_created", timeRiftCreated]);
    rows.push(["lab_explosion_created", labExplosionCreated]);
    rows.push([]);
    rows.push(["bin", "label", "count", "percent", "gold", "rainbow", "giant", "shape", "crown", "star", "heart", "blackSun", "cosmicEgg"]);
    for (let i = 0; i < settings.binCount; i++) {
        const percent = finishedCount > 0 ? (binCounts[i] / finishedCount) * 100 : 0;
        rows.push([i + 1, labels[i], binCounts[i], percent.toFixed(4), goldHits[i], rainbowHits[i], giantHits[i], shapeHits[i], crownHits[i], starHits[i], heartHits[i], blackSunHits[i], cosmicEggHits[i]]);
    }
    return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

async function copyResultCsv(): Promise<void> {
    const csv = buildResultCsv();
    try { await navigator.clipboard.writeText(csv); showMilestone("結果CSVをコピーしました"); }
    catch {
        const textarea = document.createElement("textarea");
        textarea.value = csv;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showMilestone("結果CSVをコピーしました");
    }
}

function downloadResultCsv(): void {
    const blob = new Blob(["\uFEFF" + buildResultCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matter-random-result-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showMilestone("CSVを保存しました");
}

function closeFinalResult(): void {
    resultOverlay.style.display = "none";
    resultOverlay.innerHTML = "";
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
    resultOverlay.innerHTML = `
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 36%, rgba(255,255,255,.18), rgba(15,23,42,.82) 54%, rgba(0,0,0,.96));"></div>
        <div style="position:relative;max-width:900px;width:min(900px,94vw);padding:${isMobile ? "28px 18px" : "40px 48px"};border-radius:34px;background:rgba(15,23,42,.66);box-shadow:0 30px 90px rgba(0,0,0,.52);text-align:center;animation:ending-fade 2.4s ease-out forwards;">
            <style>@keyframes ending-fade{0%{opacity:0;transform:translateY(18px) scale(.98)}18%{opacity:1;transform:translateY(0) scale(1)}82%{opacity:1}100%{opacity:0;transform:translateY(-8px) scale(.99)}}</style>
            <div style="font-size:clamp(22px,4vw,38px);font-weight:1000;color:#fde68a;letter-spacing:.08em;">ENDING</div>
            <div style="margin-top:10px;font-size:clamp(38px,8vw,82px);font-weight:1000;color:#fff;text-shadow:0 8px 30px rgba(0,0,0,.66);">${title}</div>
            <div style="margin-top:16px;font-size:clamp(18px,3vw,30px);line-height:1.7;color:#e5e7eb;">${line}</div>
            <div style="margin-top:18px;font-size:clamp(16px,2.6vw,24px);color:#cbd5e1;">${finishedCount.toLocaleString()}回の落下を確認しました。</div>
        </div>`;
    resultOverlay.style.display = "flex";
    window.setTimeout(() => showFinalResult(), 2500);
}

function showFinalResult(): void {
    recordAdminEvent({ type: "run_finish", at: Date.now(), count: finishedCount, targetCount: settings.targetCount, detail: `score ${runScore}` });
    savedRecords.totalRuns++;
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
    saveRecords();
    const ranking = binCounts.map((count, index) => ({ label: labels[index], count, percent: finishedCount > 0 ? (count / finishedCount) * 100 : 0 })).sort((a, b) => b.count - a.count);
    const rankingHtml = ranking.map((item, index) => `<div style="margin:7px 0;">${index + 1}位：${item.label}　${item.count.toLocaleString()}回　${item.percent.toFixed(2)}%</div>`).join("");
    const evaluation = getResearchEvaluation();
    resultOverlay.innerHTML = `
        <div style="position:relative;max-width:920px;width:min(920px,94vw);max-height:88dvh;overflow:auto;padding:28px;border-radius:26px;background:rgba(5,8,18,.58);box-shadow:0 24px 80px rgba(0,0,0,.42);">
            <button id="close-result-button" aria-label="閉じる" style="position:absolute;right:14px;top:14px;width:46px;height:46px;border-radius:999px;border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.18);color:#fff;font-size:28px;font-weight:900;line-height:1;cursor:pointer;">×</button>
            <div style="font-size:clamp(38px,8vw,78px);font-weight:900;margin-bottom:18px;">実験完了</div>
            <div style="font-size:clamp(22px,4vw,40px);margin-bottom:18px;">${browserName} / 指定${settings.targetCount.toLocaleString()}回 / 実処理${finishedCount.toLocaleString()}回 / ${formatElapsedTime((targetReachedTime ?? endTime ?? Date.now()) - startTime)}</div>
            <div style="font-size:clamp(20px,3vw,34px);margin-bottom:18px;">スコア <b>${runScore.toLocaleString()}</b> / ミッション ${Object.values(missionProgress).filter(Boolean).length} / ${missionDefs.length} / 奇跡コンボ最高 ${bestComboThisRun}</div>
            ${dailyCompleted.length > 0 ? `<div style="margin:0 auto 18px;max-width:760px;padding:14px;border-radius:18px;background:rgba(34,197,94,.16);border:1px solid rgba(134,239,172,.35);font-size:clamp(16px,2.4vw,24px);">デイリー研究達成: ${dailyCompleted.map(escapeHtml).join(" / ")}</div>` : ""}
            <div style="margin:0 auto 18px;max-width:760px;padding:14px;border-radius:18px;background:rgba(250,204,21,.16);border:1px solid rgba(250,204,21,.35);font-size:clamp(16px,2.4vw,26px);line-height:1.55;">奇跡ガチャP <b>+${totalGachaPointAward.toLocaleString()}P</b> / 所持 <b>${getGachaPoint().toLocaleString()}P</b><br><span style="opacity:.80;">実験完了 +${finishGachaPoint.toLocaleString()}P${dailyGachaPoint > 0 ? ` / デイリー +${dailyGachaPoint.toLocaleString()}P` : ""}</span></div>
            <div style="margin:0 auto 18px;max-width:760px;padding:16px;border-radius:20px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.20);font-size:clamp(17px,2.6vw,28px);line-height:1.55;text-align:left;"><b>今回の研究評価: ${evaluation.grade}</b><br>観測タイプ: ${evaluation.type}<br>奇跡濃度: ${evaluation.density}%<br><span style="opacity:.82;">${evaluation.note}</span><br><span style="opacity:.82;">研究レポート #${currentReport.runNo} を奇跡アルバムに保存しました。</span></div>
            <div style="font-size:clamp(18px,3vw,34px);line-height:1.55;">${rankingHtml}</div>
            <div style="margin-top:20px;font-size:clamp(16px,2vw,26px);line-height:1.5;opacity:.95;">確率モードは <b>${getProbabilityModeLabel()}</b> です。一番レアは <b>1兆分の1</b> の極秘イベント。出たら奇跡どころか、画面が伝説になります。</div>
            <div style="margin-top:24px;font-size:clamp(16px,2vw,28px);opacity:.9;">発見済み種類: ${(SPECIAL_EVENT_DEFS.filter((def) => (savedRecords.discovered[def.kind] ?? 0) + (specialCreated[def.kind] ?? 0) > 0).length).toLocaleString()} / ${SPECIAL_EVENT_DEFS.length}　捨て区画: ${discardedCount.toLocaleString()}</div>
            <div style="margin-top:18px;font-size:clamp(16px,2vw,26px);opacity:.95;text-align:left;background:rgba(255,255,255,.08);padding:16px;border-radius:18px;"><b>研究メモ自動生成</b><br>${generateResearchMemoHtml()}</div>
            <div style="margin-top:18px;font-size:clamp(16px,2vw,26px);opacity:.95;">${getResearchReportHtml()}</div>
            <div style="margin-top:24px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;"><button id="copy-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">結果コピー</button><button id="download-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">CSV保存</button><button id="share-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#eef0ff 0%,#d7dcff 100%);box-shadow:0 5px 14px rgba(90,96,180,.16);">録画・SNS</button><button id="bottom-close-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">閉じる</button></div>
        </div>`;
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
    const x = geometry.binLeft + physicalIndex * geometry.binWidth + geometry.binWidth / 2;
    const labelFont = Math.round(clamp(geometry.labelFont * 0.78, isMobile ? 18 : 13, isMobile ? 36 : 30));
    const countFont = Math.round(clamp(geometry.countFont * 0.88, isMobile ? 13 : 10, isMobile ? 28 : 26));
    context.save();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(80, 86, 100, 0.18)";
    context.fillRect(x - geometry.binWidth / 2, geometry.groundTop - 118 * geometry.scale, geometry.binWidth, 118 * geometry.scale);
    context.font = `900 ${labelFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
    context.fillStyle = "#5b3b3b";
    context.fillText("捨て", x, geometry.labelY - labelFont * 0.55);
    context.fillText("区間", x, geometry.labelY + labelFont * 0.55);
    context.font = `800 ${countFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
    context.fillStyle = "#6b4a4a";
    context.fillText("対象外", x, geometry.countY);
    context.restore();
}


function drawSpecialIcon(context: CanvasRenderingContext2D, kind: DropKind, x: number, y: number, radius: number, symbol: string): void {
    const colors = getSpecialIconColors(kind);
    const r = Math.max(radius * (isMobile ? 1.45 : 1.2), isMobile ? 22 : 18 * geometry.scale);
    const time = Date.now() / 1000;
    context.save();
    context.translate(x, y);
    context.rotate(kind === "timeRift" ? time * 1.8 : 0);

    // 外側の太い縁。スマホでも「ただの光」に見えないよう、必ず実体を描く。
    context.beginPath();
    context.arc(0, 0, r * 1.08, 0, Math.PI * 2);
    context.fillStyle = "rgba(255,255,255,.95)";
    context.fill();

    const grad = context.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.35, colors.main);
    grad.addColorStop(1, colors.sub);
    context.beginPath();
    context.arc(0, 0, r, 0, Math.PI * 2);
    context.fillStyle = grad;
    context.fill();
    context.lineWidth = Math.max(3, r * 0.14);
    context.strokeStyle = colors.stroke;
    context.stroke();

    // 種類ごとの大きいシルエット
    context.save();
    context.globalAlpha = 0.95;
    context.fillStyle = colors.text;
    context.strokeStyle = "rgba(0,0,0,.35)";
    context.lineWidth = Math.max(2, r * 0.07);

    if (kind === "crown" || kind === "meteorCrown") {
        context.beginPath();
        context.moveTo(-r * 0.65, r * 0.25);
        context.lineTo(-r * 0.45, -r * 0.38);
        context.lineTo(-r * 0.15, r * 0.03);
        context.lineTo(0, -r * 0.55);
        context.lineTo(r * 0.15, r * 0.03);
        context.lineTo(r * 0.45, -r * 0.38);
        context.lineTo(r * 0.65, r * 0.25);
        context.closePath();
        context.fillStyle = "#ffd54a";
        context.fill();
        context.stroke();
        context.fillStyle = "#3a2600";
        context.font = `900 ${Math.round(r * 0.62)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(kind === "meteorCrown" ? "冠" : "王", 0, r * 0.15);
    } else if (kind === "silverUfo") {
        context.beginPath();
        context.ellipse(0, r * 0.05, r * 0.82, r * 0.28, 0, 0, Math.PI * 2);
        context.fillStyle = "#dce3e7";
        context.fill(); context.stroke();
        context.beginPath();
        context.arc(0, -r * 0.08, r * 0.36, Math.PI, 0);
        context.fillStyle = "#9bdcff";
        context.fill(); context.stroke();
    } else if (kind === "blueFlame") {
        context.beginPath();
        context.moveTo(0, -r * 0.78);
        context.bezierCurveTo(r * 0.72, -r * 0.1, r * 0.36, r * 0.72, 0, r * 0.78);
        context.bezierCurveTo(-r * 0.62, r * 0.3, -r * 0.55, -r * 0.15, 0, -r * 0.78);
        context.closePath();
        context.fillStyle = "#00c8ff";
        context.fill(); context.stroke();
        context.beginPath();
        context.moveTo(0, -r * 0.32);
        context.bezierCurveTo(r * 0.28, r * 0.12, r * 0.10, r * 0.42, 0, r * 0.5);
        context.bezierCurveTo(-r * 0.22, r * 0.28, -r * 0.18, 0, 0, -r * 0.32);
        context.fillStyle = "#ffffff";
        context.fill();
    } else if (kind === "timeRift" || kind === "pocketGalaxy") {
        context.lineWidth = Math.max(4, r * 0.13);
        for (let i = 0; i < 3; i++) {
            context.beginPath();
            context.arc(0, 0, r * (0.28 + i * 0.18), i * 0.9, Math.PI * 1.6 + i * 0.9);
            context.strokeStyle = i % 2 ? "#ffffff" : "#00e5ff";
            context.stroke();
        }
        context.fillStyle = "#ffffff";
        context.font = `900 ${Math.round(r * 0.44)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText(kind === "timeRift" ? "裂" : "銀", 0, 0);
    } else if (kind === "heart") {
        context.beginPath();
        context.moveTo(0, r * 0.58);
        context.bezierCurveTo(-r * 0.9, -r * 0.02, -r * 0.62, -r * 0.72, 0, -r * 0.36);
        context.bezierCurveTo(r * 0.62, -r * 0.72, r * 0.9, -r * 0.02, 0, r * 0.58);
        context.fillStyle = "#ff4da6";
        context.fill(); context.stroke();
    } else if (kind === "blackSun") {
        for (let i = 0; i < 10; i++) {
            const a = i * Math.PI * 2 / 10;
            context.beginPath();
            context.moveTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75);
            context.lineTo(Math.cos(a) * r * 1.18, Math.sin(a) * r * 1.18);
            context.strokeStyle = "#ff0044";
            context.lineWidth = Math.max(3, r * 0.1);
            context.stroke();
        }
        context.beginPath(); context.arc(0,0,r*.62,0,Math.PI*2); context.fillStyle="#050505"; context.fill(); context.strokeStyle="#ff0044"; context.stroke();
    } else if (kind === "poseidonMode") {
        context.font = `900 ${Math.round(r * 0.88)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("🌊", 0, 0);
    } else if (kind === "zeusuMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("⚡", 0, 0);
    } else if (kind === "hadesuMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("☠️", 0, 0);
    } else if (kind === "heartMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("💗", 0, 0);
    } else if (kind === "nekochanMode") {
        context.font = `900 ${Math.round(r * 0.82)}px "Noto Sans JP", "Segoe UI Emoji", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("🐈", 0, 0);
    } else if (kind === "lifeQuoteMode") {
        context.fillStyle = "#ffffff";
        context.font = `900 ${Math.round(r * 0.46)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("声", 0, 0);
    } else if (kind === "labExplosion") {
        context.beginPath();
        for (let i = 0; i < 12; i++) {
            const a = i * Math.PI * 2 / 12;
            const rr = i % 2 ? r * 0.45 : r * 0.95;
            const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
            if (i === 0) context.moveTo(px, py); else context.lineTo(px, py);
        }
        context.closePath();
        context.fillStyle = "#ff3b30";
        context.fill(); context.stroke();
        context.fillStyle = "#fff3b0";
        context.font = `900 ${Math.round(r * 0.48)}px "Noto Sans JP", "Segoe UI", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillText("爆", 0, 0);
    } else {
        context.font = `900 ${Math.round(symbol.length >= 2 ? r * 0.58 : r * 0.78)}px "Noto Sans JP", "Yu Gothic", "Segoe UI", sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.strokeStyle = "rgba(255,255,255,.85)";
        context.lineWidth = Math.max(3, r * 0.09);
        context.strokeText(symbol, 0, r * 0.03);
        context.fillStyle = colors.text;
        context.fillText(symbol, 0, r * 0.03);
    }
    context.restore();

    context.restore();
}

function drawTimeBallSkinIcon(context: CanvasRenderingContext2D, skin: TimeBallSkin, x: number, y: number, radius: number, angle: number, fallbackColor: string): void {
    if (skin === "normal") return;
    const color = getTimeBallSkinFillStyle(skin, fallbackColor);
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.lineJoin = "round";
    context.lineCap = "round";
    context.strokeStyle = "rgba(255,255,255,.88)";
    context.lineWidth = Math.max(1.2, radius * 0.12);
    context.shadowColor = color;
    context.shadowBlur = settings.simpleMode ? 0 : Math.max(0, radius * 0.4);
    context.fillStyle = color;

    if (skin === "drop") {
        context.beginPath();
        context.moveTo(0, -radius * 1.08);
        context.bezierCurveTo(radius * 0.78, -radius * 0.2, radius * 0.62, radius * 0.88, 0, radius * 1.0);
        context.bezierCurveTo(-radius * 0.62, radius * 0.88, -radius * 0.78, -radius * 0.2, 0, -radius * 1.08);
        context.closePath();
        context.fill(); context.stroke();
        context.fillStyle = "rgba(255,255,255,.70)";
        context.beginPath(); context.ellipse(-radius * 0.22, -radius * 0.26, radius * 0.16, radius * 0.28, -0.45, 0, Math.PI * 2); context.fill();
    } else if (skin === "spark") {
        drawStarPath(context, radius * 1.02, 4);
        context.fill(); context.stroke();
        context.fillStyle = "rgba(255,245,200,.95)";
        context.beginPath(); context.arc(0, 0, radius * 0.32, 0, Math.PI * 2); context.fill();
    } else if (skin === "star") {
        drawStarPath(context, radius * 1.06, 5);
        context.fill(); context.stroke();
    } else if (skin === "moon") {
        context.beginPath(); context.arc(0, 0, radius * 0.98, Math.PI * 0.22, Math.PI * 1.78); context.bezierCurveTo(radius * 0.28, radius * 0.46, radius * 0.28, -radius * 0.46, radius * 0.98, -radius * 0.74); context.closePath();
        context.fill(); context.stroke();
    } else if (skin === "darkShard" || skin === "swordShard") {
        context.beginPath();
        context.moveTo(-radius * 0.28, -radius * 1.08);
        context.lineTo(radius * 0.82, -radius * 0.22);
        context.lineTo(radius * 0.26, radius * 1.04);
        context.lineTo(-radius * 0.76, radius * 0.28);
        context.closePath();
        context.fill(); context.stroke();
        if (skin === "swordShard") {
            context.strokeStyle = "rgba(20,40,60,.78)";
            context.lineWidth = Math.max(1, radius * 0.08);
            context.beginPath(); context.moveTo(-radius * 0.15, -radius * 0.72); context.lineTo(radius * 0.18, radius * 0.72); context.stroke();
        }
    } else if (skin === "coin") {
        context.beginPath(); context.ellipse(0, 0, radius * 0.92, radius * 0.76, 0, 0, Math.PI * 2); context.fill(); context.stroke();
        context.strokeStyle = "rgba(95,58,0,.65)"; context.lineWidth = Math.max(1, radius * 0.08);
        context.beginPath(); context.ellipse(0, 0, radius * 0.58, radius * 0.46, 0, 0, Math.PI * 2); context.stroke();
    } else if (skin === "heart") {
        context.beginPath();
        context.moveTo(0, radius * 0.72);
        context.bezierCurveTo(-radius * 1.0, radius * 0.06, -radius * 0.72, -radius * 0.76, 0, -radius * 0.34);
        context.bezierCurveTo(radius * 0.72, -radius * 0.76, radius * 1.0, radius * 0.06, 0, radius * 0.72);
        context.fill(); context.stroke();
    } else if (skin === "crown") {
        context.beginPath();
        context.moveTo(-radius * 0.86, radius * 0.42);
        context.lineTo(-radius * 0.62, -radius * 0.42);
        context.lineTo(-radius * 0.22, radius * 0.08);
        context.lineTo(0, -radius * 0.74);
        context.lineTo(radius * 0.22, radius * 0.08);
        context.lineTo(radius * 0.62, -radius * 0.42);
        context.lineTo(radius * 0.86, radius * 0.42);
        context.closePath();
        context.fill(); context.stroke();
    } else if (skin === "gloss") {
        context.beginPath(); context.arc(0, 0, radius * 0.92, 0, Math.PI * 2); context.fill(); context.stroke();
        context.fillStyle = "rgba(255,255,255,.65)";
        context.beginPath(); context.arc(-radius * 0.28, -radius * 0.32, radius * 0.24, 0, Math.PI * 2); context.fill();
    }
    context.restore();
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
        drawTimeBallSkinIcon(context, skin, body.position.x, body.position.y, radius * 0.92, body.angle, color);
    }
    context.restore();
}

function draw3DBallShading(context: CanvasRenderingContext2D): void {
    const dropBodies = engine.world.bodies.filter((body) => (body as any).plugin?.isDrop);
    const maxShaded = settings.simpleMode ? 220 : (isMobile || settings.lowSpecMode ? 320 : 720);
    const step = dropBodies.length > maxShaded ? Math.ceil(dropBodies.length / maxShaded) : 1;
    const timeSec = performance.now() * 0.001;
    context.save();
    for (let bodyIndex = 0; bodyIndex < dropBodies.length; bodyIndex += step) {
        const body = dropBodies[bodyIndex];
        const plugin = (body as any).plugin;
        const radius = body.circleRadius ?? plugin?.originalRadius ?? 0;
        if (!radius || radius <= 0) continue;
        const x = body.position.x;
        const y = body.position.y;
        const kind = String(plugin?.kind ?? "normal");
        const isDarkBall = kind === "blackSun" || kind === "darkMatter";
        const metallicBall = kind !== "ghost" && kind !== "heart";
        const phase = timeSec * 1.8 + (body.id % 29) * 0.31 + body.angle * 0.35;
        const stripeShift = Math.sin(phase) * radius * 0.30;
        const stripeShift2 = Math.cos(phase * 0.72 + 0.6) * radius * 0.22;

        context.save();
        context.beginPath();
        context.arc(x, y, radius * 0.987, 0, Math.PI * 2);
        context.clip();

        const silverSheen = context.createLinearGradient(x - radius * 1.04, y - radius * 1.08, x + radius * 1.02, y + radius * 1.06);
        silverSheen.addColorStop(0, isDarkBall ? 'rgba(255,255,255,.36)' : 'rgba(255,255,255,.72)');
        silverSheen.addColorStop(0.18, isDarkBall ? 'rgba(220,230,245,.16)' : 'rgba(232,238,248,.46)');
        silverSheen.addColorStop(0.46, 'rgba(255,255,255,0)');
        silverSheen.addColorStop(0.74, 'rgba(24,32,44,.10)');
        silverSheen.addColorStop(1, 'rgba(0,0,0,.25)');
        context.fillStyle = silverSheen;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        if (metallicBall) {
            const sweep = context.createLinearGradient(x - radius * 0.96 + stripeShift, y - radius * 0.14, x + radius * 0.98 + stripeShift, y + radius * 0.14);
            sweep.addColorStop(0, 'rgba(255,255,255,0)');
            sweep.addColorStop(0.14, 'rgba(220,230,245,.18)');
            sweep.addColorStop(0.30, 'rgba(250,252,255,.48)');
            sweep.addColorStop(0.48, 'rgba(255,255,255,.98)');
            sweep.addColorStop(0.58, 'rgba(208,220,240,.56)');
            sweep.addColorStop(0.76, 'rgba(255,255,255,.08)');
            sweep.addColorStop(1, 'rgba(255,255,255,0)');
            context.fillStyle = sweep;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();

            const sweep2 = context.createLinearGradient(x - radius * 0.84 + stripeShift2, y - radius * 0.05, x + radius * 0.84 + stripeShift2, y + radius * 0.06);
            sweep2.addColorStop(0, 'rgba(255,255,255,0)');
            sweep2.addColorStop(0.42, 'rgba(230,238,250,.10)');
            sweep2.addColorStop(0.52, 'rgba(255,255,255,.48)');
            sweep2.addColorStop(0.62, 'rgba(210,220,238,.10)');
            sweep2.addColorStop(1, 'rgba(255,255,255,0)');
            context.fillStyle = sweep2;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }

        const topCool = context.createLinearGradient(x, y - radius * 0.98, x, y + radius * 0.98);
        topCool.addColorStop(0, 'rgba(224,236,255,.24)');
        topCool.addColorStop(0.24, 'rgba(255,255,255,0)');
        topCool.addColorStop(0.76, 'rgba(0,0,0,.06)');
        topCool.addColorStop(1, 'rgba(0,0,0,.13)');
        context.fillStyle = topCool;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = isDarkBall ? 'rgba(255,255,255,.66)' : 'rgba(255,255,255,.94)';
        context.beginPath();
        context.ellipse(x - radius * 0.30, y - radius * 0.42, radius * 0.29, radius * 0.18, -0.56, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = 'rgba(255,255,255,.82)';
        context.beginPath();
        context.arc(x - radius * 0.42, y - radius * 0.52, Math.max(1.2, radius * 0.08), 0, Math.PI * 2);
        context.fill();

        context.fillStyle = metallicBall ? 'rgba(255,255,255,.42)' : 'rgba(255,255,255,.16)';
        context.beginPath();
        context.ellipse(x - radius * 0.02 + stripeShift * 0.25, y - radius * 0.10, radius * 0.50, radius * 0.12, -0.38, 0, Math.PI * 2);
        context.fill();

        if (!settings.lowSpecMode) {
            context.fillStyle = 'rgba(255,255,255,.22)';
            context.beginPath();
            context.ellipse(x + radius * 0.44, y - radius * 0.02, radius * 0.10, radius * 0.34, 0.2, 0, Math.PI * 2);
            context.fill();

            const lowerShade = context.createRadialGradient(x + radius * 0.22, y + radius * 0.40, radius * 0.18, x + radius * 0.16, y + radius * 0.42, radius * 1.02);
            lowerShade.addColorStop(0, 'rgba(0,0,0,0)');
            lowerShade.addColorStop(0.70, 'rgba(0,0,0,.08)');
            lowerShade.addColorStop(1, 'rgba(0,0,0,.24)');
            context.fillStyle = lowerShade;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }

        context.restore();

        context.strokeStyle = metallicBall ? 'rgba(255,255,255,.38)' : 'rgba(255,255,255,.24)';
        context.lineWidth = Math.max(1, radius * 0.085);
        context.beginPath();
        context.arc(x, y, radius * 0.968, Math.PI * 0.80, Math.PI * 1.88);
        context.stroke();

        context.strokeStyle = metallicBall ? 'rgba(16,22,30,.24)' : 'rgba(0,0,0,.14)';
        context.lineWidth = Math.max(1, radius * 0.06);
        context.beginPath();
        context.arc(x, y, radius * 0.94, Math.PI * 0.04, Math.PI * 1.00);
        context.stroke();
    }
    context.restore();
}

function drawNormalTraitMarks(context: CanvasRenderingContext2D): void {
    if (settings.simpleMode) return;
    context.save();
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isDrop || plugin.kind !== "normal" || !plugin.traitMark) continue;
        const x = body.position.x;
        const y = body.position.y;
        const radius = body.circleRadius ?? plugin.originalRadius ?? geometry.ballRadius;
        context.globalAlpha = plugin.traitKind === "ghost" ? 0.55 : 0.88;
        context.beginPath();
        context.arc(x, y, radius * 0.66, 0, Math.PI * 2);
        context.fillStyle = "rgba(255,255,255,.42)";
        context.fill();
        context.font = `900 ${Math.round(clamp(radius * 0.66, 9, 20))}px "Noto Sans JP", "Yu Gothic", sans-serif`;
        context.fillStyle = "rgba(15,23,42,.86)";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(String(plugin.traitMark), x, y + radius * 0.03);
    }
    context.restore();
}

function drawRealisticPins(context: CanvasRenderingContext2D): void {
    context.save();
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isPin) continue;
        try { (body.render as any).visible = false; } catch {}
        const rawRadius = body.circleRadius ?? geometry.pinRadius;
        const radius = clamp(Math.max(rawRadius * 1.28, geometry.pinRadius * 1.42, 4 * geometry.scale), 3, 92 * geometry.scale);
        const baseX = Number(plugin.baseX ?? body.position.x);
        const baseY = Number(plugin.baseY ?? body.position.y);
        const bend = clamp(Number(plugin.bendAmount ?? 0), -3.2, 3.2);
        const headX = body.position.x + bend * radius * 0.18;
        const headY = body.position.y + Math.abs(bend) * radius * 0.05;
        const stretch = 1 + Math.min(0.55, Math.abs(bend) * 0.09);
        const squash = Math.max(0.62, 1 - Math.abs(bend) * 0.05);
        const rx = Math.max(2, radius * stretch);
        const ry = Math.max(2, radius * squash);

        context.save();
        context.lineCap = "round";
        context.lineJoin = "round";

        // 盤面に刺さる金属ピンの軸。しなった時にゴムのように曲がって見えるよう、
        // 土台位置から頭まで曲線でつなぎます。
        const anchorX = baseX;
        const anchorY = baseY + radius * 0.58;
        const controlX = (anchorX + headX) / 2 + bend * radius * 0.78;
        const controlY = (anchorY + headY) / 2 - radius * 0.35;
        context.strokeStyle = "rgba(20,24,34,.32)";
        context.lineWidth = Math.max(2, radius * 0.28);
        context.beginPath();
        context.moveTo(anchorX + radius * 0.10, anchorY + radius * 0.18);
        context.quadraticCurveTo(controlX + radius * 0.10, controlY + radius * 0.18, headX + radius * 0.10, headY + radius * 0.08);
        context.stroke();

        const stemGrad = context.createLinearGradient(anchorX - radius, anchorY, headX + radius, headY);
        stemGrad.addColorStop(0, "rgba(255,255,245,.95)");
        stemGrad.addColorStop(0.34, "rgba(244,202,92,.95)");
        stemGrad.addColorStop(0.68, "rgba(122,78,22,.92)");
        stemGrad.addColorStop(1, "rgba(255,247,190,.88)");
        context.strokeStyle = stemGrad;
        context.lineWidth = Math.max(2, radius * 0.18);
        context.beginPath();
        context.moveTo(anchorX, anchorY);
        context.quadraticCurveTo(controlX, controlY, headX, headY + radius * 0.06);
        context.stroke();

        // 土台の影。
        context.fillStyle = "rgba(0,0,0,.20)";
        context.beginPath();
        context.ellipse(baseX + radius * 0.16, baseY + radius * 0.62, Math.max(2, radius * 0.90), Math.max(2, radius * 0.30), 0, 0, Math.PI * 2);
        context.fill();

        context.translate(headX, headY);
        context.rotate(bend * 0.10);

        const base = context.createRadialGradient(-rx * 0.30, -ry * 0.36, Math.max(1, radius * 0.12), 0, 0, Math.max(2, radius * 1.18));
        base.addColorStop(0, "rgba(255,255,248,.98)");
        base.addColorStop(0.20, "rgba(255,236,148,.98)");
        base.addColorStop(0.48, "rgba(214,149,35,.98)");
        base.addColorStop(0.76, "rgba(129,81,18,.98)");
        base.addColorStop(1, "rgba(255,239,145,.92)");
        context.fillStyle = base;
        context.beginPath();
        context.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        context.fill();

        const shine = context.createLinearGradient(-rx, -ry, rx, ry);
        shine.addColorStop(0, "rgba(255,255,255,.92)");
        shine.addColorStop(0.30, "rgba(255,255,255,.16)");
        shine.addColorStop(0.52, "rgba(255,255,255,0)");
        shine.addColorStop(0.68, "rgba(255,245,180,.34)");
        shine.addColorStop(1, "rgba(0,0,0,.20)");
        context.fillStyle = shine;
        context.beginPath();
        context.ellipse(0, 0, rx * 0.96, ry * 0.96, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = "rgba(255,255,255,.72)";
        context.beginPath();
        context.ellipse(-rx * 0.28, -ry * 0.34, Math.max(1, rx * 0.25), Math.max(1, ry * 0.16), -0.55, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "rgba(255,246,190,.96)";
        context.lineWidth = Math.max(1, radius * 0.12);
        context.beginPath();
        context.ellipse(0, 0, rx * 0.88, ry * 0.88, 0, Math.PI * 0.82, Math.PI * 1.82);
        context.stroke();
        context.strokeStyle = "rgba(52,32,7,.34)";
        context.lineWidth = Math.max(1, radius * 0.08);
        context.beginPath();
        context.ellipse(0, 0, rx * 0.95, ry * 0.95, 0, Math.PI * 0.02, Math.PI * 0.92);
        context.stroke();
        context.restore();
    }
    context.restore();
}

function drawMagicCircleTrace(context: CanvasRenderingContext2D): void {
    if (!magicCircleModeEnabled && magicCirclePoints.length === 0) return;
    const points = magicCirclePoints;
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalCompositeOperation = "lighter";
    if (points.length >= 2) {
        const pulse = 0.55 + Math.sin(performance.now() / 120) * 0.25;
        context.strokeStyle = `rgba(180,235,255,${0.58 + pulse * 0.28})`;
        context.lineWidth = Math.max(5 * geometry.scale, 4);
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) context.lineTo(points[i].x, points[i].y);
        context.stroke();
        context.strokeStyle = "rgba(255,255,255,.92)";
        context.lineWidth = Math.max(1.5 * geometry.scale, 1.2);
        context.stroke();
        const rc = getRoughCanvas();
        if (rc && points.length > 4 && !settings.simpleMode) {
            const xs = points.map((p) => p.x);
            const ys = points.map((p) => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const w = Math.max(24 * geometry.scale, maxX - minX);
            const h = Math.max(24 * geometry.scale, maxY - minY);
            rc.ellipse(minX + w / 2, minY + h / 2, w * 1.16, h * 1.16, {
                stroke: "rgba(255,255,255,.56)",
                strokeWidth: Math.max(1.2, 2 * geometry.scale),
                roughness: 2.4,
                bowing: 1.6,
            });
        }
    }
    if (magicCircleModeEnabled) {
        const last = points[points.length - 1];
        const cx = last?.x ?? geometry.width / 2;
        const cy = last?.y ?? geometry.height * 0.32;
        const r = Math.max(28 * geometry.scale, 20);
        context.strokeStyle = "rgba(255,255,255,.70)";
        context.lineWidth = Math.max(2 * geometry.scale, 1.5);
        context.beginPath();
        context.arc(cx, cy, r, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = "rgba(255,255,255,.90)";
        context.font = `900 ${Math.round(clamp(18 * geometry.scale, 13, 28))}px ${ROUNDED_UI_FONT}`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("描画中", cx, cy - r - 14 * geometry.scale);
    }
    context.restore();
}

function drawBoardDepthOverlay(context: CanvasRenderingContext2D): void {
    context.save();
    context.globalCompositeOperation = "source-over";
    const scale = geometry.scale || 1;
    const left = Math.max(geometry.wallWidth * 0.58, 10 * scale);
    const top = Math.max(10 * scale, 8);
    const right = geometry.width - left;
    const bottom = Math.max(geometry.groundTop - 12 * scale, top + 40 * scale);
    const w = Math.max(20 * scale, right - left);
    const h = Math.max(20 * scale, bottom - top);
    const radius = Math.max(18 * scale, 14);
    const richAlpha = settings.simpleMode ? 0.55 : 1;

    // 外側の高級メタルフレーム。simpleModeでも消さず、軽めに描画します。
    const frame = context.createLinearGradient(left, top, right, bottom);
    frame.addColorStop(0, `rgba(255,255,255,${0.58 * richAlpha})`);
    frame.addColorStop(0.18, `rgba(210,223,238,${0.30 * richAlpha})`);
    frame.addColorStop(0.45, `rgba(94,111,132,${0.32 * richAlpha})`);
    frame.addColorStop(0.70, `rgba(255,230,145,${0.30 * richAlpha})`);
    frame.addColorStop(1, `rgba(255,255,255,${0.42 * richAlpha})`);
    context.strokeStyle = frame;
    context.lineWidth = Math.max(5 * scale, 3);
    roundRect(context, left, top, w, h, radius);
    context.stroke();

    context.strokeStyle = `rgba(255,255,255,${0.34 * richAlpha})`;
    context.lineWidth = Math.max(2 * scale, 1.5);
    roundRect(context, left + 7 * scale, top + 7 * scale, Math.max(8, w - 14 * scale), Math.max(8, h - 14 * scale), Math.max(8, radius - 7 * scale));
    context.stroke();

    context.strokeStyle = `rgba(0,0,0,${0.26 * richAlpha})`;
    context.lineWidth = Math.max(2 * scale, 1);
    roundRect(context, left + 3 * scale, top + 3 * scale, Math.max(8, w - 6 * scale), Math.max(8, h - 6 * scale), Math.max(8, radius - 3 * scale));
    context.stroke();

    // 盤面ガラスの斜め反射。常時表示して、奥行きと高級感を出します。
    const glass = context.createLinearGradient(0, 0, geometry.width, geometry.height);
    glass.addColorStop(0, `rgba(255,255,255,${0.24 * richAlpha})`);
    glass.addColorStop(0.22, `rgba(255,255,255,${0.07 * richAlpha})`);
    glass.addColorStop(0.38, "rgba(255,255,255,0)");
    glass.addColorStop(0.68, "rgba(0,0,0,0)");
    glass.addColorStop(1, `rgba(0,0,0,${0.16 * richAlpha})`);
    context.fillStyle = glass;
    context.fillRect(0, 0, geometry.width, geometry.height);

    if (!settings.simpleMode) {
        context.save();
        context.globalCompositeOperation = "screen";
        const sweepX = (performance.now() / 42) % (geometry.width + geometry.height) - geometry.height;
        const sweep = context.createLinearGradient(sweepX, 0, sweepX + geometry.height * 0.55, geometry.height);
        sweep.addColorStop(0, "rgba(255,255,255,0)");
        sweep.addColorStop(0.42, "rgba(255,255,255,0)");
        sweep.addColorStop(0.50, "rgba(255,255,255,.18)");
        sweep.addColorStop(0.58, "rgba(255,255,255,0)");
        sweep.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = sweep;
        context.fillRect(0, 0, geometry.width, geometry.height);
        context.restore();

        // 左右の透明アクリル柱。
        const railW = Math.max(16 * scale, 8);
        const rail = context.createLinearGradient(0, top, railW, top);
        rail.addColorStop(0, "rgba(255,255,255,.28)");
        rail.addColorStop(0.45, "rgba(255,255,255,.06)");
        rail.addColorStop(1, "rgba(0,0,0,.20)");
        context.fillStyle = rail;
        roundRect(context, left - railW * 0.45, top + 10 * scale, railW, Math.max(10, h - 20 * scale), railW / 2);
        context.fill();
        context.save();
        context.translate(geometry.width, 0);
        context.scale(-1, 1);
        context.fillStyle = rail;
        roundRect(context, left - railW * 0.45, top + 10 * scale, railW, Math.max(10, h - 20 * scale), railW / 2);
        context.fill();
        context.restore();

        // 四隅の宝石っぽい輝き。
        const corners: Array<[number, number, number]> = [
            [left + radius * 0.7, top + radius * 0.7, 0],
            [right - radius * 0.7, top + radius * 0.7, Math.PI * 0.5],
            [left + radius * 0.7, bottom - radius * 0.7, Math.PI * 1.5],
            [right - radius * 0.7, bottom - radius * 0.7, Math.PI],
        ];
        for (const [cx, cy, angle] of corners) {
            context.save();
            context.translate(cx, cy);
            context.rotate(angle);
            const glow = context.createRadialGradient(0, 0, 0, 0, 0, radius * 1.6);
            glow.addColorStop(0, "rgba(255,240,170,.26)");
            glow.addColorStop(0.45, "rgba(255,255,255,.10)");
            glow.addColorStop(1, "rgba(255,255,255,0)");
            context.fillStyle = glow;
            context.beginPath();
            context.arc(0, 0, radius * 1.6, 0, Math.PI * 2);
            context.fill();
            context.strokeStyle = "rgba(255,240,170,.35)";
            context.lineWidth = Math.max(1, 1.3 * scale);
            context.beginPath();
            context.moveTo(-radius * 0.8, 0);
            context.lineTo(radius * 0.8, 0);
            context.moveTo(0, -radius * 0.8);
            context.lineTo(0, radius * 0.8);
            context.stroke();
            context.restore();
        }
    }

    // 下側は少し暗くして、盤面の奥行きを固定で見せる。
    const bottomDepth = context.createLinearGradient(0, geometry.groundTop - 150 * scale, 0, geometry.height);
    bottomDepth.addColorStop(0, "rgba(0,0,0,0)");
    bottomDepth.addColorStop(0.65, `rgba(0,0,0,${0.08 * richAlpha})`);
    bottomDepth.addColorStop(1, `rgba(0,0,0,${0.22 * richAlpha})`);
    context.fillStyle = bottomDepth;
    context.fillRect(0, Math.max(0, geometry.groundTop - 150 * scale), geometry.width, Math.max(0, geometry.height - (geometry.groundTop - 150 * scale)));

    context.restore();
}

function drawLuxuryBoardForeground(context: CanvasRenderingContext2D): void {
    const scale = geometry.scale || 1;
    const left = Math.max(geometry.wallWidth * 0.44, 8 * scale);
    const top = Math.max(8 * scale, 6);
    const right = geometry.width - left;
    const bottom = Math.max(geometry.groundTop - 8 * scale, top + 50 * scale);
    const w = Math.max(40 * scale, right - left);
    const h = Math.max(40 * scale, bottom - top);
    const radius = Math.max(22 * scale, 16);
    const time = performance.now() / 1000;

    context.save();
    context.globalCompositeOperation = "source-over";

    // 前面の厚いクロームフレーム。背景側ではなく最後に重ねるので必ず見えます。
    const chrome = context.createLinearGradient(left, top, right, bottom);
    chrome.addColorStop(0, "rgba(255,255,255,.82)");
    chrome.addColorStop(0.16, "rgba(195,210,228,.42)");
    chrome.addColorStop(0.36, "rgba(66,82,105,.36)");
    chrome.addColorStop(0.58, "rgba(255,238,150,.46)");
    chrome.addColorStop(0.78, "rgba(86,102,126,.30)");
    chrome.addColorStop(1, "rgba(255,255,255,.70)");
    context.strokeStyle = chrome;
    context.lineWidth = Math.max(7 * scale, 4);
    roundRect(context, left, top, w, h, radius);
    context.stroke();

    context.strokeStyle = "rgba(255,255,255,.38)";
    context.lineWidth = Math.max(2.5 * scale, 1.5);
    roundRect(context, left + 8 * scale, top + 8 * scale, Math.max(10, w - 16 * scale), Math.max(10, h - 16 * scale), Math.max(8, radius - 8 * scale));
    context.stroke();

    // ガラス反射を前面に薄く重ねる。
    context.save();
    context.globalCompositeOperation = "screen";
    const glass = context.createLinearGradient(0, 0, geometry.width, geometry.height);
    glass.addColorStop(0, "rgba(255,255,255,.25)");
    glass.addColorStop(0.28, "rgba(255,255,255,.05)");
    glass.addColorStop(0.46, "rgba(255,255,255,0)");
    glass.addColorStop(0.78, "rgba(255,255,255,.08)");
    glass.addColorStop(1, "rgba(255,255,255,.18)");
    context.fillStyle = glass;
    context.fillRect(0, 0, geometry.width, bottom);

    const sweepX = ((time * 95) % (geometry.width + geometry.height)) - geometry.height;
    const sweep = context.createLinearGradient(sweepX, 0, sweepX + geometry.height * 0.62, geometry.height);
    sweep.addColorStop(0, "rgba(255,255,255,0)");
    sweep.addColorStop(0.45, "rgba(255,255,255,0)");
    sweep.addColorStop(0.51, "rgba(255,255,255,.22)");
    sweep.addColorStop(0.58, "rgba(255,255,255,0)");
    sweep.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = sweep;
    context.fillRect(0, 0, geometry.width, bottom);
    context.restore();

    // 奥行きをわかりやすくする下側の影。
    const depth = context.createLinearGradient(0, bottom - 80 * scale, 0, geometry.height);
    depth.addColorStop(0, "rgba(0,0,0,0)");
    depth.addColorStop(1, "rgba(0,0,0,.26)");
    context.fillStyle = depth;
    context.fillRect(0, Math.max(0, bottom - 80 * scale), geometry.width, geometry.height - Math.max(0, bottom - 80 * scale));

    // 両サイドに宝石感のある縦光。
    for (const side of [-1, 1]) {
        const cx = side < 0 ? left + 18 * scale : right - 18 * scale;
        const glow = context.createLinearGradient(cx - side * 10 * scale, top, cx + side * 10 * scale, bottom);
        glow.addColorStop(0, "rgba(255,255,255,.28)");
        glow.addColorStop(0.45, "rgba(135,205,255,.10)");
        glow.addColorStop(1, "rgba(255,236,160,.20)");
        context.fillStyle = glow;
        roundRect(context, cx - 5 * scale, top + 18 * scale, 10 * scale, Math.max(10, h - 36 * scale), 999);
        context.fill();
    }

    context.restore();
}

function drawSpecialGlows(context: CanvasRenderingContext2D): void {
    if (settings.simpleMode) return;
    const time = Date.now() / 1000;
    context.save();
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isDrop) continue;
        const kind = plugin.kind as DropKind;
        const def = findSpecialDef(kind);
        if (!def && !["gold", "rainbow"].includes(kind)) continue;
        const x = body.position.x;
        const y = body.position.y;
        const radius = body.circleRadius ?? plugin.originalRadius ?? geometry.ballRadius;
        const pulse = 0.75 + Math.sin(time * 9) * 0.25;
        let colors = ["255,215,0", "255,170,0"];
        if (kind === "rainbow") colors = ["190,100,255", "80,180,255"];
        if (def) {
            const c = getSpecialIconColors(kind);
            colors = hexToRgbTriplet(c.main, "255,215,0") ? [hexToRgbTriplet(c.main, "255,215,0"), hexToRgbTriplet(c.sub, "255,170,0")] : colors;
        }

        // 光は控えめ。アイコン本体を見せるため、スマホでは特に薄くする。
        context.save();
        context.globalCompositeOperation = "lighter";
        const glow = context.createRadialGradient(x, y, radius * 0.25, x, y, radius * (isMobile ? 3.0 : 4.5));
        glow.addColorStop(0, `rgba(${colors[0]}, ${0.42 * pulse})`);
        glow.addColorStop(0.72, `rgba(${colors[1]}, ${0.18 * pulse})`);
        glow.addColorStop(1, `rgba(${colors[1]}, 0)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, radius * (isMobile ? 3.0 : 4.5), 0, Math.PI * 2);
        context.fill();
        context.restore();

        if (def) {
            drawSpecialIcon(context, kind, x, y, Math.max(radius, isMobile ? 20 : 14 * geometry.scale), plugin.symbol || def.symbol);
        }

        if (kind === "gold" || kind === "rainbow") {
            for (let i = 0; i < 6; i++) {
                const angle = time * 2.5 + i * Math.PI * 2 / 6;
                drawSparkle(context, x + Math.cos(angle) * radius * 2.6, y + Math.sin(angle) * radius * 2.6, 5 * geometry.scale, "rgba(255,255,220,.95)", angle);
            }
        }
    }
    context.restore();
}

function drawPachinkoMachine(context: CanvasRenderingContext2D): void {
    const time = performance.now() / 1000;
    context.save();
    context.globalCompositeOperation = "destination-over";
    const framePad = Math.max(geometry.wallWidth * 0.38, 8 * geometry.scale);
    const panelGradient = context.createLinearGradient(0, 0, 0, geometry.height);
    panelGradient.addColorStop(0, settings.blackModeEnabled ? "rgba(0,0,0,.94)" : "rgba(68,10,20,.86)");
    panelGradient.addColorStop(0.55, settings.blackModeEnabled ? "rgba(10,10,10,.76)" : "rgba(22,18,24,.46)");
    panelGradient.addColorStop(1, settings.blackModeEnabled ? "rgba(0,0,0,.98)" : "rgba(102,19,32,.82)");
    context.fillStyle = panelGradient;
    context.fillRect(0, 0, geometry.width, geometry.height);

    context.strokeStyle = settings.blackModeEnabled ? "rgba(255,255,255,.22)" : "rgba(255,214,96,.75)";
    context.lineWidth = Math.max(8 * geometry.scale, 4);
    context.strokeRect(framePad, framePad, geometry.width - framePad * 2, geometry.height - geometry.groundHeight - framePad * 1.4);

    const cx = geometry.width / 2;
    const cy = geometry.height * 0.43;
    const ringRadius = Math.min(geometry.width, geometry.height) * 0.18;
    context.beginPath();
    context.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    context.strokeStyle = settings.blackModeEnabled ? "rgba(255,255,255,.30)" : "rgba(255,230,130,.82)";
    context.lineWidth = Math.max(10 * geometry.scale, 5);
    context.stroke();
    context.beginPath();
    context.arc(cx, cy, ringRadius * 0.62 + Math.sin(time * 2) * 3 * geometry.scale, 0, Math.PI * 2);
    context.strokeStyle = "rgba(255,255,255,.18)";
    context.lineWidth = Math.max(4 * geometry.scale, 2);
    context.stroke();

    for (const def of PACHINKO_YAKUMONO_DEFS) {
        const x = geometry.width * def.xRatio;
        const y = geometry.height * def.yRatio;
        const w = clamp(geometry.width * def.widthRatio, 82 * geometry.scale, 260 * geometry.scale);
        const h = clamp(def.height * geometry.scale, 12, 32);
        const glow = kindYakumonoAlpha(def.kind);
        context.fillStyle = `rgba(${hexToRgbTriplet(def.color, "250,204,21")},${0.24 + glow * 0.32})`;
        roundRect(context, x - w / 2, y - h / 2, w, h, h / 2);
        context.fill();
        context.strokeStyle = `rgba(${hexToRgbTriplet(def.color, "250,204,21")},.92)`;
        context.lineWidth = Math.max(2 * geometry.scale, 1);
        context.stroke();
        context.font = `900 ${Math.round(clamp(15 * geometry.scale, 11, 24))}px ${ROUNDED_UI_FONT}`;
        context.fillStyle = settings.blackModeEnabled ? "#f8fafc" : "#fff7cc";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(def.label, x, y);
    }

    context.font = `900 ${Math.round(clamp(18 * geometry.scale, 12, 28))}px ${ROUNDED_UI_FONT}`;
    context.fillStyle = settings.blackModeEnabled ? "rgba(255,255,255,.72)" : "rgba(255,239,200,.86)";
    context.textAlign = "center";
    context.fillText(`MIRACLE BALL LAB / ${currentPachinkoNailPattern.toUpperCase()}`, geometry.width / 2, Math.max(26 * geometry.scale, 20));
    context.restore();
}

function kindYakumonoAlpha(kind: PachinkoYakumonoKind): number {
    const count = pachinkoYakumonoHitCount[kind] ?? 0;
    return count > 0 ? 0.5 + Math.sin(performance.now() / 140) * 0.2 : 0;
}

Events.on(render, "afterRender", () => {
    const context = render.context;
    context.save();
    drawPachinkoMachine(context);
    drawRareBoardCatastrophe(context);
    drawBoardDepthOverlay(context);
    drawTapRipples(context);
    drawMagicPhysicsFields(context);
    drawMagicCircleTrace(context);
    drawBrokenResearchNote(context);
    drawRealisticPins(context);
    draw3DBallShading(context);
    drawSpecialGlows(context);
    drawTimeBallSkins(context);
    drawNormalTraitMarks(context);
    drawFamiliar(context);
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
        if (!settings.simpleMode && (hitFlash[i] ?? 0) > 0) {
            const alpha = (hitFlash[i] ?? 0) / 18;
            context.fillStyle = `rgba(255,160,80,${alpha * 0.45})`;
            context.fillRect(x - geometry.binWidth / 2, geometry.groundTop - 118 * geometry.scale, geometry.binWidth, 118 * geometry.scale);
            if (!isPaused) hitFlash[i] = Math.max(0, (hitFlash[i] ?? 0) - 1);
        }
        if (!settings.simpleMode && count === maxCount && maxCount > 0) {
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
    if (activeWorldMode) {
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
    drawLuxuryBoardForeground(context);
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
    if (isStarted && !isPaused && !isMiraclePaused) {
        replayCaptureTick++;
        if (replayCaptureTick % 5 === 0) {
            try {
                replayFrameBuffer.push(canvas.toDataURL("image/jpeg", 0.42));
                if (replayFrameBuffer.length > 24) replayFrameBuffer.shift();
            } catch {}
        }
    }
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
    maybeShowCommentary();
    updateTutorialMissions();
    updateResearchProgressPanel();
    gameArea.style.filter = anomalyUntil ? (anomalyHidePins ? "brightness(.84) contrast(1.1)" : "brightness(.95)") : "";
    if (!isStarted || isFinished || isMiraclePaused) return;

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
            if (targetReachedTime === null && finishedCount >= settings.targetCount) targetReachedTime = Date.now();
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
                if (targetReachedTime === null && finishedCount >= settings.targetCount) targetReachedTime = Date.now();
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
            if (targetReachedTime === null && finishedCount >= settings.targetCount) targetReachedTime = Date.now();

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

                handleFamiliarDropResult(kind, binIndex);
                checkMissionProgress();
                while (finishedCount >= nextMilestone && nextMilestone <= settings.targetCount) {
                    showMilestone(`${nextMilestone.toLocaleString()}回 達成！`);
                    showFullScreenCelebration(nextMilestone);
                    nextMilestone += MILESTONE_INTERVAL;
                }
                while (finishedCount >= nextGiantEvent && nextGiantEvent <= settings.targetCount) {
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

    // 画面上に残っている玉を含めて指定回数に届いている場合は、残り玉回収モードへ入る。
    // これがないと「あと1個が画面上で止まる → 新規投入されない → 完了画面が開かない」状態になることがある。
    if (targetReachedTime === null && finishedCount + activeDropCount >= settings.targetCount) {
        targetReachedTime = Date.now();
    }

    // 指定回数に到達した後は新規投入せず、残り玉の回収だけ行う
    while (targetReachedTime === null && finishedCount + activeDropCount < settings.targetCount && activeDropCount < settings.activeLimit) {
        Composite.add(engine.world, createDrop());
    }
    updateInfo();

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
void ensureAnimeReady();
void ensureGifReady();
void ensureTippyReady();
void loadRemoteMiracleAssets();
hideBootOverlay();
window.setTimeout(() => scheduleViewportStabilize(false), 180);
window.setTimeout(() => {
    if (!isStarted && !isAppTerminated && helpOverlay.style.display === "none") showLabHome();
}, bootMinimumDurationMs + 650);

let resizeTimer: number | undefined;
function scheduleResize(): void {
    if (isAppTerminated) return;
    if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
        if (!applySettingsFromInputs(false)) return;
        scheduleViewportStabilize(isStarted && !isFinished);
    }, 300);
}
window.addEventListener("resize", scheduleResize);
window.addEventListener("orientationchange", () => { window.setTimeout(() => scheduleViewportStabilize(isStarted && !isFinished), 120); });
window.addEventListener("pageshow", () => { window.setTimeout(() => scheduleViewportStabilize(isStarted && !isFinished), 80); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) window.setTimeout(() => scheduleViewportStabilize(isStarted && !isFinished), 80); });
window.visualViewport?.addEventListener("resize", scheduleResize);
window.visualViewport?.addEventListener("scroll", scheduleResize);
window.addEventListener("online", () => { showOfflineModeEventPopup(); updateInfo(); });
window.addEventListener("offline", () => { showOfflineModeEventPopup(); updateInfo(); });
if (!navigator.onLine) {
    window.setTimeout(() => showOfflineModeEventPopup(), bootMinimumDurationMs + 1200);
}