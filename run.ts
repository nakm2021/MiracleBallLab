import Matter, { Events } from "matter-js";

const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Composite = Matter.Composite;

type DropKind =
    | "normal"
    | "gold"
    | "rainbow"
    | "giant"
    | "shape"
    | "crown"
    | "shootingStar"
    | "heart"
    | "blackSun"
    | "cosmicEgg"
    | "fragment";

type Settings = {
    targetCount: number;
    activeLimit: number;
    binCount: number;
    pinRows: number;
    labelText: string;
    backgroundImage: string;
    simpleMode: boolean;
};

type Geometry = {
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

type FloatingText = {
    text: string;
    x: number;
    y: number;
    life: number;
    maxLife: number;
    color: string;
};

const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

const MILESTONE_INTERVAL = 3000;
const GIANT_EVENT_INTERVAL = 3000;
const FINAL_SWEEP_DELAY_MS = 3000;

const GOLD_RATE = 0.002;          // 1/500
const RAINBOW_RATE = 0.0005;     // 1/2,000
const SHAPE_RATE = 0.002;          // 1/500
const CROWN_RATE = 0.0001;         // 1/10,000
const SHOOTING_STAR_RATE = 0.00001;// 1/100,000
const HEART_RATE = 0.000001;       // 1/1,000,000
const BLACK_SUN_RATE = 0.0000001;  // 1/10,000,000
const COSMIC_EGG_RATE = 0.000000000001; // 1/1,000,000,000,000

const RANDOM_BUCKET_COUNT = 10;
const STUCK_NUDGE_FRAMES = 90;
const STUCK_EXPLODE_FRAMES = 600;

const browserName = getBrowserName();
const isMobile = isMobileDevice();
const uiFontPx = isMobile ? 25 : 20;
const uiButtonFontPx = isMobile ? 26 : 20;

let settings: Settings = {
    targetCount: 50000,
    activeLimit: isMobile ? 18 : 30,
    binCount: isMobile ? 6 : 8,
    pinRows: isMobile ? 6 : 7,
    labelText: isMobile ? "１\n２\n３\n４\n５\n６" : "１\n２\n３\n４\n５\n６\n７\n８",
    backgroundImage: "",
    simpleMode: false,
};

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

let goldHits: number[] = [];
let rainbowHits: number[] = [];
let giantHits: number[] = [];
let shapeHits: number[] = [];
let crownHits: number[] = [];
let starHits: number[] = [];
let heartHits: number[] = [];
let blackSunHits: number[] = [];
let cosmicEggHits: number[] = [];

let randomBuckets = Array.from({ length: RANDOM_BUCKET_COUNT }, () => 0);
let randomCallCount = 0;
let floatingTexts: FloatingText[] = [];
let shakeUntil = 0;
let shakePower = 0;
let speedLabelText = "高速";

let soundEnabled = true;
let toneReady = false;
let confettiEnabled = true;
let pixiEnabled = false;
let pixiReady = false;
let pixiApp: any = null;
let pixiParticles: any[] = [];

const engine = Engine.create();
engine.gravity.y = 8;
engine.timing.timeScale = 2;

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

// ======================================================
// HTML / UI
// ======================================================

document.body.style.margin = "0";
document.body.style.background = "#eef1f6";
document.body.style.fontFamily = `"Segoe UI", "Noto Sans JP", sans-serif`;
document.body.style.overflow = "hidden";
document.body.style.width = "100vw";
document.body.style.height = "100dvh";

const appRoot = document.createElement("div");
appRoot.style.width = "100vw";
appRoot.style.height = "100dvh";
appRoot.style.display = "flex";
appRoot.style.flexDirection = "column";
appRoot.style.overflow = "hidden";
document.body.appendChild(appRoot);

const gameArea = document.createElement("div");
gameArea.style.flex = "1";
gameArea.style.minHeight = "0";
gameArea.style.display = "flex";
gameArea.style.alignItems = "center";
gameArea.style.justifyContent = "center";
gameArea.style.background = "linear-gradient(180deg, #f7f9ff 0%, #e9edf5 100%)";
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
canvas.style.borderRadius = isMobile ? "0" : "18px";
canvas.style.boxShadow = isMobile ? "none" : "0 14px 34px rgba(0,0,0,0.18)";
canvas.style.backgroundColor = "rgba(245,245,245,0.88)";
canvas.style.backgroundSize = "cover";
canvas.style.backgroundPosition = "center";
canvas.style.backgroundRepeat = "no-repeat";
canvas.addEventListener("pointerdown", (event) => activateNearestPin(event));
gameArea.appendChild(canvas);

const info = document.createElement("div");
info.style.flex = "0 0 auto";
info.style.boxSizing = "border-box";
info.style.background = "rgba(255, 255, 255, 0.97)";
info.style.borderTop = "1px solid rgba(130, 140, 160, 0.35)";
info.style.boxShadow = "0 -8px 28px rgba(0,0,0,0.08)";
info.style.overflow = "auto";
appRoot.appendChild(info);

const appHeader = document.createElement("div");
appHeader.style.display = "flex";
appHeader.style.alignItems = "center";
appHeader.style.justifyContent = "space-between";
appHeader.style.gap = "12px";
appHeader.style.flexWrap = "wrap";
appHeader.style.marginBottom = "12px";
appHeader.style.padding = isMobile ? "12px 14px" : "10px 16px";
appHeader.style.borderRadius = "18px";
appHeader.style.background = "linear-gradient(180deg, #f6faec 0%, #e3f0cc 100%)";
appHeader.style.border = "1px solid rgba(87,112,51,0.22)";
appHeader.style.boxShadow = "0 6px 18px rgba(87,112,51,0.10)";
info.appendChild(appHeader);

const appTitle = document.createElement("div");
appTitle.innerHTML = `<div style="font-size:${isMobile ? 30 : 26}px;font-weight:900;color:#26351f;letter-spacing:.03em;">ミラクルボールラボ</div><div style="margin-top:3px;font-size:${isMobile ? 16 : 14}px;font-weight:700;color:#5d6d48;">ランダムに落ちる玉で、確率と奇跡を観測する実験場</div>`;
appHeader.appendChild(appTitle);

const appHeaderNote = document.createElement("div");
appHeaderNote.textContent = "レア演出は運。超高速だと見逃しやすいです。";
appHeaderNote.style.fontSize = `${Math.max(14, uiFontPx - 5)}px`;
appHeaderNote.style.fontWeight = "800";
appHeaderNote.style.color = "#56663f";
appHeader.appendChild(appHeaderNote);

const topRow = document.createElement("div");
topRow.style.display = "grid";
topRow.style.gridTemplateColumns = isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(170px, 1fr))";
topRow.style.gap = isMobile ? "10px 14px" : "8px 14px";
topRow.style.alignItems = "center";
info.appendChild(topRow);

const controlArea = document.createElement("div");
controlArea.style.display = "grid";
controlArea.style.gridTemplateColumns = isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))";
controlArea.style.gap = isMobile ? "14px" : "10px 14px";
controlArea.style.marginTop = "14px";
controlArea.style.alignItems = "end";
info.appendChild(controlArea);

const buttonArea = document.createElement("div");
buttonArea.style.display = "flex";
buttonArea.style.flexWrap = "wrap";
buttonArea.style.gap = isMobile ? "12px" : "10px";
buttonArea.style.marginTop = "14px";
info.appendChild(buttonArea);

const randomGraphArea = document.createElement("div");
randomGraphArea.style.marginTop = "14px";
info.appendChild(randomGraphArea);

function createField(label: string, input: HTMLElement): HTMLDivElement {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "6px";

    const labelElement = document.createElement("label");
    labelElement.textContent = label;
    labelElement.style.fontWeight = "800";
    labelElement.style.color = "#273042";
    labelElement.style.fontSize = `${Math.max(17, uiFontPx - 2)}px`;

    wrapper.appendChild(labelElement);
    wrapper.appendChild(input);
    return wrapper;
}

function createInput(value: string, type = "text"): HTMLInputElement {
    const input = document.createElement("input");
    input.type = type;
    input.value = value;
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    input.style.padding = isMobile ? "16px 16px" : "12px 14px";
    input.style.borderRadius = "14px";
    input.style.border = "1px solid #b8c1d1";
    input.style.background = "#ffffff";
    input.style.fontSize = `${uiFontPx}px`;
    input.style.outline = "none";
    return input;
}

function createTextarea(value: string): HTMLTextAreaElement {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.rows = isMobile ? 5 : 4;
    textarea.style.width = "100%";
    textarea.style.boxSizing = "border-box";
    textarea.style.padding = isMobile ? "16px 16px" : "12px 14px";
    textarea.style.borderRadius = "14px";
    textarea.style.border = "1px solid #b8c1d1";
    textarea.style.background = "#ffffff";
    textarea.style.fontSize = `${uiFontPx}px`;
    textarea.style.outline = "none";
    textarea.style.resize = "vertical";
    return textarea;
}

function createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.fontSize = `${uiButtonFontPx}px`;
    button.style.fontWeight = "900";
    button.style.padding = isMobile ? "16px 22px" : "12px 18px";
    button.style.border = "1px solid rgba(70, 80, 110, 0.28)";
    button.style.borderRadius = "16px";
    button.style.background = "linear-gradient(180deg, #f3f8e8 0%, #dceec2 100%)";
    button.style.boxShadow = "0 5px 14px rgba(87,112,51,0.16)";
    button.style.cursor = "pointer";
    button.onclick = onClick;
    return button;
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

const labelInput = createTextarea(settings.labelText);

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
};

controlArea.appendChild(createField("投下数", targetInput));
controlArea.appendChild(createField("同時に出す玉数", activeBallInput));
controlArea.appendChild(createField("下の受け皿数", binCountInput));
controlArea.appendChild(createField("ピン段数", pinRowInput));
controlArea.appendChild(createField("ラベル名（1行ずつ）", labelInput));
controlArea.appendChild(createField("背景画像URL", backgroundInput));
controlArea.appendChild(createField("背景画像を写真から選択", backgroundFileInput));

const runButton = createButton("実行", () => startExperiment());
buttonArea.appendChild(runButton);
buttonArea.appendChild(createButton("この実験について", () => showAboutPopup()));
buttonArea.appendChild(createButton("ボタン説明", () => showButtonHelpPopup()));

buttonArea.appendChild(createButton("通常", () => {
    engine.timing.timeScale = 1;
    speedLabelText = "通常";
    updateInfo();
}));

buttonArea.appendChild(createButton("高速", () => {
    engine.timing.timeScale = 2;
    speedLabelText = "高速";
    updateInfo();
}));

buttonArea.appendChild(createButton("超高速", () => {
    engine.timing.timeScale = 4;
    speedLabelText = "超高速";
    updateInfo();
}));

const stopButton = createButton("ストップ", () => togglePause());
buttonArea.appendChild(stopButton);

buttonArea.appendChild(createButton("リセット", () => {
    applySettingsFromInputs();
    resetExperiment(false);
}));

const simpleModeButton = createButton("シンプル: OFF", () => {
    settings.simpleMode = !settings.simpleMode;
    updateSimpleModeButton();
    updateInfo();
});
buttonArea.appendChild(simpleModeButton);

const soundButton = createButton("音: ON", () => toggleSound());
buttonArea.appendChild(soundButton);

const confettiButton = createButton("紙吹雪: ON", () => {
    confettiEnabled = !confettiEnabled;
    confettiButton.textContent = confettiEnabled ? "紙吹雪: ON" : "紙吹雪: OFF";
});
buttonArea.appendChild(confettiButton);

const pixiButton = createButton("Pixi背景: OFF", () => togglePixiBackground());
buttonArea.appendChild(pixiButton);

buttonArea.appendChild(createButton("設定反映", () => {
    applySettingsFromInputs();
    resetExperiment(false);
}));

buttonArea.appendChild(createButton("背景だけ反映", () => {
    selectedBackgroundObjectUrl = "";
    settings.backgroundImage = backgroundInput.value.trim();
    applyBackgroundImage();
}));

buttonArea.appendChild(createButton("結果コピー", () => copyResultCsv()));
buttonArea.appendChild(createButton("CSV保存", () => downloadResultCsv()));

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
helpOverlay.style.padding = "24px";
helpOverlay.style.boxSizing = "border-box";
document.body.appendChild(helpOverlay);

helpOverlay.addEventListener("click", (event) => {
    if (event.target === helpOverlay) closeHelpPopup();
});
window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && helpOverlay.style.display !== "none") closeHelpPopup();
});

// ======================================================
// Utility
// ======================================================

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes("Edg/")) return "Microsoft Edge";
    if (ua.includes("Firefox/")) return "Firefox";
    if (ua.includes("Chrome/")) return "Google Chrome";
    if (ua.includes("Safari/")) return "Safari";
    return "Unknown Browser";
}

function isMobileDevice(): boolean {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        window.matchMedia?.("(pointer: coarse)")?.matches === true ||
        window.innerWidth < 700;
}

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

function parseLabels(text: string, count: number): string[] {
    const items = text.split(/\n|,/).map((x) => x.trim()).filter((x) => x.length > 0);
    const result: string[] = [];
    for (let i = 0; i < count; i++) result.push(items[i] ?? String(i + 1));
    return result;
}

function formatElapsedTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function escapeCsv(value: string | number): string {
    const text = String(value);
    if (text.includes(",") || text.includes('"') || text.includes("\n")) return `"${text.replace(/"/g, '""')}"`;
    return text;
}

function loadExternalScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`failed to load ${src}`));
        document.head.appendChild(script);
    });
}


function closeHelpPopup(): void {
    helpOverlay.style.display = "none";
    helpOverlay.innerHTML = "";
}

function showPopup(title: string, bodyHtml: string): void {
    helpOverlay.innerHTML = `
        <div style="position:relative;max-width:980px;width:min(980px,94vw);max-height:88dvh;overflow:auto;padding:28px;border-radius:26px;background:rgba(250,253,244,.98);box-shadow:0 24px 80px rgba(0,0,0,.42);border:1px solid rgba(87,112,51,.24);">
            <button id="close-help-popup-button" aria-label="閉じる" style="position:absolute;right:14px;top:14px;width:46px;height:46px;border-radius:999px;border:1px solid rgba(87,112,51,.28);background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);color:#26351f;font-size:28px;font-weight:900;line-height:1;cursor:pointer;box-shadow:0 5px 14px rgba(87,112,51,.16);">×</button>
            <div style="font-size:clamp(30px,5vw,58px);font-weight:900;margin:0 54px 18px 0;color:#26351f;">${title}</div>
            <div style="font-size:clamp(16px,2.5vw,24px);line-height:1.72;color:#2f3a2a;text-align:left;">${bodyHtml}</div>
            <div style="margin-top:24px;text-align:center;"><button id="bottom-close-help-popup-button" style="font-size:20px;padding:11px 24px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:900;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);color:#26351f;">閉じる</button></div>
        </div>`;
    helpOverlay.style.display = "flex";
    document.getElementById("close-help-popup-button")!.onclick = () => closeHelpPopup();
    document.getElementById("bottom-close-help-popup-button")!.onclick = () => closeHelpPopup();
}

function showAboutPopup(): void {
    showPopup("ミラクルボールラボについて", `
        <p><b>ミラクルボールラボ</b>は、玉を上から落として、ピンに当たりながらどの受け皿に入るかを観測するランダム実験です。</p>
        <p>通常玉だけでなく、金玉、虹玉、巨大玉、図形、王、流れ星、桃色ハート、黒い太陽、宇宙卵などのレア玉がまれに出ます。特に宇宙卵は<b>1兆分の1</b>の超レア演出です。</p>
        <p>両端は<b>捨て区間</b>です。ここに入った玉も処理済みとして数えますが、中央の受け皿ランキングには入れません。</p>
        <p>3000回ごとに達成演出が出ます。指定回数に到達したあと、画面に残っている玉も最後に回収してから実験完了にします。</p>
        <p><b>補足:</b> 超高速にすると物理演算と画面描画が速く進むため、レア演出が一瞬で流れて見えない可能性がかなり高くなります。レア演出を見たいときは通常か高速がおすすめです。</p>
        <p><b>AIからの補足:</b> これは遊びながら確率の偏りを見るシミュレーションです。厳密な科学実験ではなく、乱数はブラウザの <code>Math.random()</code> を使っています。統計っぽく見たい場合は投下数を多めにして、動作が重いときはシンプルON、同時に出す玉数を少なめにしてください。</p>
    `);
}

function showButtonHelpPopup(): void {
    showPopup("ボタン説明", `
        <p><b>実行:</b> 現在の設定で実験を開始します。開始前は待機中です。</p>
        <p><b>通常 / 高速 / 超高速:</b> 玉の動く速度を変えます。超高速は処理は速いですが、レア演出を見逃しやすくなります。</p>
        <p><b>ストップ / 再開:</b> 実験を一時停止、または再開します。奇跡演出中は自動停止して約5秒後に再開します。</p>
        <p><b>リセット:</b> 設定を読み直して、実験を最初から待機状態に戻します。</p>
        <p><b>シンプル:</b> 演出を減らして軽くします。重い場合や大量回数を試す場合に便利です。</p>
        <p><b>音:</b> Tone.jsを読み込んで、レア玉が入ったときなどに音を鳴らします。ブラウザ仕様上、最初にボタン操作が必要です。</p>
        <p><b>紙吹雪:</b> 達成時やレア演出時の紙吹雪をON/OFFします。</p>
        <p><b>Pixi背景:</b> Pixi.jsを使った背景演出をON/OFFします。見た目は楽しいですが、PCやスマホによっては重くなります。</p>
        <p><b>設定反映:</b> 投下数、同時に出す玉数、受け皿数、ピン段数、ラベルなどを反映してリセットします。</p>
        <p><b>背景だけ反映:</b> 背景画像だけを差し替えます。</p>
        <p><b>結果コピー / CSV保存:</b> 実験結果をコピー、またはCSVファイルとして保存します。</p>
        <p><b>ピンをタップ/クリック:</b> 近くのピンを揺らして、詰まり気味の玉を少し動かせます。</p>
    `);
}

// ======================================================
// Layout / reset
// ======================================================

function applySettingsFromInputs(): void {
    const target = Math.floor(Number(targetInput.value));
    const active = Math.floor(Number(activeBallInput.value));
    const bins = Math.floor(Number(binCountInput.value));
    const rows = Math.floor(Number(pinRowInput.value));

    settings.targetCount = Number.isFinite(target) && target > 0 ? target : 50000;
    settings.activeLimit = Number.isFinite(active) ? clamp(active, 1, 300) : 30;
    settings.binCount = Number.isFinite(bins) ? clamp(bins, 2, 30) : 8;
    settings.pinRows = Number.isFinite(rows) ? clamp(rows, 1, 30) : 7;
    settings.labelText = labelInput.value.trim() || "１\n２\n３\n４\n５\n６\n７\n８";

    if (selectedBackgroundObjectUrl && backgroundInput.value.startsWith("選択した画像:")) settings.backgroundImage = selectedBackgroundObjectUrl;
    else settings.backgroundImage = backgroundInput.value.trim();

    targetInput.value = String(settings.targetCount);
    activeBallInput.value = String(settings.activeLimit);
    binCountInput.value = String(settings.binCount);
    pinRowInput.value = String(settings.pinRows);
    labelInput.value = settings.labelText;
    if (!selectedBackgroundObjectUrl) backgroundInput.value = settings.backgroundImage;
}

function calculateGeometry(): Geometry {
    const viewportWidth = Math.max(320, window.innerWidth);
    const viewportHeight = Math.max(480, window.innerHeight);
    const small = isMobile || viewportWidth < 700;
    const infoHeight = Math.round(clamp(viewportHeight * (small ? 0.24 : 0.40), small ? 170 : 300, small ? 260 : 500));
    const width = viewportWidth;
    const height = Math.max(360, viewportHeight - infoHeight);
    const scale = clamp(Math.min(width / BASE_WIDTH, height / BASE_HEIGHT), 0.56, 2.4);
    const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 3);

    const totalBinCount = settings.binCount + 2;
    const visibleStart = 1;
    const wallWidth = clamp(36 * scale, 22, 72);
    const groundHeight = clamp(40 * scale, 26, 76);
    const binLeft = wallWidth;
    const binRight = width - wallWidth;
    const binWidth = (binRight - binLeft) / totalBinCount;
    const groundTop = height - groundHeight;
    const binScale = clamp(binWidth / 90, 0.35, 1.7);
    const ballRadius = clamp(14 * scale * binScale, 4, 28);
    const pinRadius = clamp(8 * scale * binScale, 3, 18);
    const dividerWidth = clamp(10 * scale * binScale, 4, 18);
    const dividerHeight = clamp(92 * scale, 58, 150);
    const dividerY = groundTop - dividerHeight / 2;
    const labelFont = Math.round(clamp(30 * scale * binScale, 13, 52));
    const countFont = Math.round(clamp(23 * scale * binScale, 11, 42));
    const percentFont = Math.round(clamp(17 * scale * binScale, 10, 30));
    const infoFont = Math.round(clamp(18 * scale, 15, isMobile ? 30 : 26));
    const labelY = groundTop - clamp(96 * scale, 54, 145);
    const countY = groundTop - clamp(60 * scale, 35, 95);
    const percentY = groundTop - clamp(32 * scale, 20, 55);
    const barY = groundTop - clamp(12 * scale, 8, 26);
    const ballCountY = groundTop - ballRadius - 2 * scale;
    const binCenters: number[] = [];
    for (let i = 0; i < settings.binCount; i++) {
        binCenters.push(binLeft + (visibleStart + i) * binWidth + binWidth / 2);
    }
    return { width, height, infoHeight, scale, pixelRatio, wallWidth, groundHeight, groundTop, totalBinCount, binLeft, binRight, binWidth, visibleStart, ballRadius, pinRadius, dividerWidth, dividerHeight, dividerY, ballCountY, labelY, countY, percentY, barY, labelFont, countFont, percentFont, infoFont, binCenters };
}

function applyBackgroundImage(): void {
    const url = settings.backgroundImage.trim();
    if (url.length === 0) {
        canvas.style.backgroundImage = "";
        canvas.style.backgroundColor = "rgba(245,245,245,0.88)";
        gameArea.style.backgroundImage = "";
        gameArea.style.background = "linear-gradient(180deg, #f7f9ff 0%, #e9edf5 100%)";
        return;
    }
    canvas.style.backgroundImage = `url("${url}")`;
    canvas.style.backgroundColor = "rgba(17,24,39,0.35)";
    gameArea.style.background = "#111827";
    gameArea.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url("${url}")`;
    gameArea.style.backgroundSize = "cover";
    gameArea.style.backgroundPosition = "center";
}

function resetExperiment(startNow = false): void {
    geometry = calculateGeometry();
    info.style.height = `${geometry.infoHeight}px`;
    info.style.padding = `${Math.round(14 * geometry.scale)}px ${Math.round(20 * geometry.scale)}px`;
    info.style.fontSize = `${geometry.infoFont}px`;

    render.options.width = geometry.width;
    render.options.height = geometry.height;
    render.options.pixelRatio = geometry.pixelRatio;
    render.options.background = "transparent";
    Render.setPixelRatio(render, geometry.pixelRatio);
    Render.setSize(render, geometry.width, geometry.height);
    canvas.style.width = `${geometry.width}px`;
    canvas.style.height = `${geometry.height}px`;
    applyBackgroundImage();

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

    labels = parseLabels(settings.labelText, settings.binCount);
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

    resultOverlay.style.display = "none";
    milestoneOverlay.style.display = "none";
    celebrationOverlay.style.display = "none";
    miracleOverlay.style.display = "none";
    canvas.style.transform = "translate(0,0)";

    Composite.add(engine.world, [...createWallsAndFloor(), ...createPins(), ...createDividers()]);
    if (startNow) {
        for (let i = 0; i < settings.activeLimit; i++) Composite.add(engine.world, createDrop());
        if (!isMiraclePaused) Runner.run(runner, engine);
    } else {
        Runner.stop(runner);
    }

    updateSimpleModeButton();
    updateInfo();
}

function updateSimpleModeButton(): void {
    simpleModeButton.textContent = settings.simpleMode ? "シンプル: ON" : "シンプル: OFF";
    simpleModeButton.style.background = settings.simpleMode ? "linear-gradient(180deg, #222 0%, #444 100%)" : "linear-gradient(180deg, #f3f8e8 0%, #dceec2 100%)";
    simpleModeButton.style.color = settings.simpleMode ? "#ffffff" : "#222222";
}

function updateStopButton(): void {
    stopButton.textContent = isPaused ? "再開" : "ストップ";
}

async function startExperiment(): Promise<void> {
    applySettingsFromInputs();
    // ブラウザの仕様上、音声開始はユーザー操作後が安全なので、実行ボタン押下時に準備する
    if (soundEnabled && !toneReady) await enableSound(false);
    engine.timing.timeScale = speedLabelText === "超高速" ? 4 : speedLabelText === "高速" ? 2 : 1;
    resetExperiment(true);
}

function pauseForMiracle(): void {
    if (!isStarted || isFinished || isMiraclePaused) return;
    isMiraclePaused = true;
    Runner.stop(runner);
    updateInfo();
    miraclePauseTimer = window.setTimeout(() => {
        isMiraclePaused = false;
        miraclePauseTimer = undefined;
        if (isStarted && !isFinished && !isPaused) Runner.run(runner, engine);
        updateInfo();
    }, 5000);
}

function togglePause(): void {
    if (!isStarted || isFinished || isMiraclePaused) return;
    if (isPaused) {
        isPaused = false;
        Runner.run(runner, engine);
    } else {
        isPaused = true;
        Runner.stop(runner);
    }
    updateStopButton();
    updateInfo();
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

function createPins(): Matter.Body[] {
    const pins: Matter.Body[] = [];
    const pinStartY = clamp(70 * geometry.scale, 40, 120);
    const pinEndY = geometry.groundTop - geometry.dividerHeight - clamp(36 * geometry.scale, 20, 70);
    const spacingY = settings.pinRows > 1 ? (pinEndY - pinStartY) / (settings.pinRows - 1) : 60 * geometry.scale;

    for (let row = 0; row < settings.pinRows; row++) {
        const y = pinStartY + row * spacingY;
        if (row % 2 === 0) {
            for (let col = 0; col < geometry.totalBinCount; col++) {
                const x = geometry.binLeft + geometry.binWidth / 2 + col * geometry.binWidth;
                pins.push(Bodies.circle(x, y, geometry.pinRadius, { isStatic: true, render: { fillStyle: "rgba(89, 97, 115, 0.92)" } }));
            }
        } else {
            for (let col = 1; col < geometry.totalBinCount; col++) {
                const x = geometry.binLeft + col * geometry.binWidth;
                pins.push(Bodies.circle(x, y, geometry.pinRadius, { isStatic: true, render: { fillStyle: "rgba(89, 97, 115, 0.92)" } }));
            }
        }
    }

    for (const pin of pins) {
        (pin as any).plugin = { isPin: true, baseX: pin.position.x, baseY: pin.position.y, wiggleFrames: 0 };
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

    (body as any).plugin = { isDrop: true, kind: "shape", shapeName, stuckFrames: 0, lastX: x, lastY: y, lifeFrames: 0, originalRadius: radius };
    return body;
}

function createHeartBody(x: number, y: number, radius: number, renderOptions: any): Matter.Body {
    const options: any = { restitution: 0.96, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0012, render: renderOptions };
    const left = Bodies.circle(x - radius * 0.48, y - radius * 0.25, radius * 0.62, options);
    const right = Bodies.circle(x + radius * 0.48, y - radius * 0.25, radius * 0.62, options);
    const bottom = Bodies.polygon(x, y + radius * 0.25, 3, radius * 1.25, options);
    Body.rotate(bottom, Math.PI);
    const heart = Body.create({ parts: [left, right, bottom], restitution: 0.96, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0012, render: renderOptions });
    (heart as any).plugin = { isDrop: true, kind: "heart", symbol: "♥", shapeName: "桃色ハート", stuckFrames: 0, lastX: x, lastY: y, lifeFrames: 0, originalRadius: radius };
    return heart;
}

function createSymbolBody(x: number, y: number, radius: number, kind: DropKind, fillStyle: string, symbol: string, label: string): Matter.Body {
    const body = Bodies.circle(x, y, radius, { restitution: 0.98, friction: 0.001, frictionStatic: 0, frictionAir: 0.002, density: 0.0013, render: { fillStyle, strokeStyle: "#ffffff", lineWidth: 4 * geometry.scale } as any });
    (body as any).plugin = { isDrop: true, kind, symbol, shapeName: label, stuckFrames: 0, lastX: x, lastY: y, lifeFrames: 0, originalRadius: radius };
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

function createDrop(): Matter.Body {
    const visibleLeft = geometry.binLeft + geometry.visibleStart * geometry.binWidth;
    const visibleRight = geometry.binLeft + (geometry.visibleStart + settings.binCount) * geometry.binWidth;
    const x = visibleLeft + appRandom() * (visibleRight - visibleLeft);
    const startY = clamp(35 * geometry.scale, 20, 80);

    let kind: DropKind = "normal";
    let radius = geometry.ballRadius;
    let fillStyle = randomColor();
    let restitution = 0.8;
    let density = 0.001;
    let isShape = false;
    let isHeart = false;
    let symbol = "";
    let label = "";

    if (giantStock > 0) {
        giantStock--;
        kind = "giant";
        radius = geometry.ballRadius * 2.4;
        fillStyle = "#1f2430";
        restitution = 0.95;
        density = 0.0028;
        giantCreated++;
    } else {
        const miracleRoll = appRandom();
        if (miracleRoll < COSMIC_EGG_RATE) {
            kind = "cosmicEgg"; radius = geometry.ballRadius * 2.7; fillStyle = "#240038"; symbol = "✦"; label = "宇宙卵"; cosmicEggCreated++; showMiracle(kind, "🥚", "1 / 1,000,000,000,000", "1兆分の1。地球が一瞬だけ変な顔をするくらいの奇跡です。");
        } else if (miracleRoll < BLACK_SUN_RATE) {
            kind = "blackSun"; radius = geometry.ballRadius * 2.2; fillStyle = "#050505"; symbol = "☀"; label = "黒い太陽"; blackSunCreated++; showMiracle(kind, "☀", "1 / 10,000,000", "宝くじ一等クラスのノリで出ないレベル。出たら動画の主役です。");
        } else if (miracleRoll < HEART_RATE) {
            kind = "heart"; radius = geometry.ballRadius * 1.9; fillStyle = "#ff69b4"; restitution = 0.96; density = 0.0012; isHeart = true; heartCreated++; showMiracle(kind, "💗", "1 / 1,000,000", "100万回に1回くらい。かなりの奇跡です。");
        } else if (miracleRoll < SHOOTING_STAR_RATE) {
            kind = "shootingStar"; radius = geometry.ballRadius * 1.7; fillStyle = "#78e7ff"; symbol = "★"; label = "流れ星"; starCreated++; showMiracle(kind, "🌠", "1 / 100,000", "10万回に1回くらい。長時間検証でやっと会える級です。");
        } else if (miracleRoll < CROWN_RATE) {
            kind = "crown"; radius = geometry.ballRadius * 1.9; fillStyle = "#ffd54a"; symbol = "王"; label = "王"; crownCreated++; showMiracle(kind, "王", "1 / 10,000", "1万回に1回くらい。普通にレアです。王です。王。");
        } else {
            const shapeRoll = appRandom();
            if (shapeRoll < SHAPE_RATE) { kind = "shape"; radius = geometry.ballRadius * clamp(0.85 + appRandom() * 0.35, 0.85, 1.2); fillStyle = randomColor(); isShape = true; shapeCreated++; }
            else {
                const rareRoll = appRandom();
                if (rareRoll < RAINBOW_RATE) { kind = "rainbow"; radius = geometry.ballRadius * 1.55; fillStyle = "hsl(295, 100%, 70%)"; restitution = 1.0; density = 0.0016; rainbowCreated++; }
                else if (rareRoll < GOLD_RATE) { kind = "gold"; radius = geometry.ballRadius * 1.3; fillStyle = "#ffd700"; restitution = 0.92; density = 0.0014; goldCreated++; }
            }
        }
    }

    const renderOptions: any = { fillStyle, strokeStyle: "rgba(255,255,255,0.85)", lineWidth: kind === "normal" ? 1 * geometry.scale : 3 * geometry.scale };
    if (kind === "gold") { renderOptions.strokeStyle = "#fff4a8"; renderOptions.lineWidth = 3 * geometry.scale; }
    if (kind === "rainbow") { renderOptions.strokeStyle = "#ffffff"; renderOptions.lineWidth = 3 * geometry.scale; }
    if (kind === "heart") { renderOptions.fillStyle = "#ff69b4"; renderOptions.strokeStyle = "#ffe0f0"; renderOptions.lineWidth = 4 * geometry.scale; }
    if (kind === "blackSun") { renderOptions.strokeStyle = "#ff0044"; renderOptions.lineWidth = 5 * geometry.scale; }
    if (kind === "cosmicEgg") { renderOptions.strokeStyle = "#ffffff"; renderOptions.lineWidth = 6 * geometry.scale; }

    let body: Matter.Body;
    if (kind === "crown" || kind === "shootingStar" || kind === "blackSun" || kind === "cosmicEgg") body = createSymbolBody(x, startY, radius, kind, fillStyle, symbol, label);
    else if (isHeart) body = createHeartBody(x, startY, radius, renderOptions);
    else if (isShape) body = createRandomShapeBody(x, startY, radius, renderOptions);
    else {
        body = Bodies.circle(x, startY, radius, { restitution, friction: 0.01, frictionAir: 0.002, density, render: renderOptions });
        (body as any).plugin = { isDrop: true, kind, stuckFrames: 0, lastX: x, lastY: startY, lifeFrames: 0, originalRadius: radius };
    }

    Body.setVelocity(body, { x: (appRandom() - 0.5) * 2 * geometry.scale, y: 0 });
    Body.setAngularVelocity(body, (appRandom() - 0.5) * 0.22);

    if (kind === "gold") addFloatingText("金玉投入", x, 80 * geometry.scale, "#d89b00");
    if (kind === "rainbow") { addFloatingText("虹玉投入", x, 80 * geometry.scale, "#b44cff"); triggerCameraShake(5 * geometry.scale, 180); }
    if (kind === "giant") { addFloatingText("巨大玉投入", x, 90 * geometry.scale, "#111111"); triggerCameraShake(10 * geometry.scale, 260); }
    if (kind === "shape") { addFloatingText(`${(body as any).plugin?.shapeName ?? "謎図形"} 投入`, x, 80 * geometry.scale, fillStyle); triggerCameraShake(5 * geometry.scale, 140); }
    if (kind === "heart") { addFloatingText("奇跡の桃色ハート", x, 85 * geometry.scale, "#ff69b4"); triggerCameraShake(18 * geometry.scale, 420); }
    if (kind === "crown" || kind === "shootingStar" || kind === "blackSun" || kind === "cosmicEgg") { addFloatingText(`${label} 投入`, x, 85 * geometry.scale, fillStyle); triggerCameraShake(kind === "cosmicEgg" ? 34 * geometry.scale : 18 * geometry.scale, kind === "cosmicEgg" ? 900 : 400); }

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
    plugin.wiggleFrames = 46;

    for (const body of engine.world.bodies) {
        const p = (body as any).plugin;
        if (!p?.isDrop) continue;
        const distance = Math.hypot(body.position.x - nearest.position.x, body.position.y - nearest.position.y);
        if (distance < tapRadius * 3) {
            Body.setVelocity(body, { x: (body.position.x - nearest.position.x) * 0.08 + (appRandom() - 0.5) * 8 * geometry.scale, y: -5 * geometry.scale });
            Body.setAngularVelocity(body, (appRandom() - 0.5) * 0.5);
        }
    }

    addFloatingText("ピン揺れ", nearest.position.x, nearest.position.y - 20 * geometry.scale, "#00aaff");
    triggerCameraShake(3 * geometry.scale, 100);
}

function updatePinWiggles(): void {
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isPin || !plugin.wiggleFrames) continue;
        const t = plugin.wiggleFrames;
        const power = (t / 46) * 10 * geometry.scale;
        Body.setPosition(body, { x: plugin.baseX + Math.sin(t * 0.85) * power, y: plugin.baseY + Math.cos(t * 0.7) * power * 0.25 });
        plugin.wiggleFrames--;
        if (plugin.wiggleFrames <= 0) { Body.setPosition(body, { x: plugin.baseX, y: plugin.baseY }); plugin.wiggleFrames = 0; }
    }
}

function addFloatingText(text: string, x: number, y: number, color: string): void {
    if (settings.simpleMode) return;
    floatingTexts.push({ text, x, y, life: 60, maxLife: 60, color });
}

function triggerCameraShake(power: number, durationMs: number): void {
    if (settings.simpleMode) return;
    shakePower = Math.max(shakePower, power);
    shakeUntil = Math.max(shakeUntil, Date.now() + durationMs);
}

function updateCameraShake(): void {
    if (settings.simpleMode) { canvas.style.transform = "translate(0,0)"; return; }
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
    const icons = ["🎆", "💥", "🌊", "🎂", "👍", "⚡", "🐶", "🐱", "⭐", "🔥", "🪐", "🎉", "🌈", "🦊", "🐸", "🦄", "🍀", "🍙", "🍜", "🍤", "🍣", "🥁", "🎺", "🎸", "🪩", "🛸", "🚀", "🌋", "🗿", "👺", "🥷", "🧊", "🫧", "🌪️", "☄️", "🌕", "🌞", "🦖", "🐉", "🦕", "🦑", "🐙", "💎", "🔮", "🎭", "🧨", "🪄", "🌌", "🤖"];
    const prefixes = ["大", "超", "激", "謎", "夢", "夜", "朝", "山", "海", "森", "宇宙", "古代", "未来", "昭和", "平成", "令和", "無音", "爆速", "低速", "ぬるぬる", "異世界", "深海", "銀河", "幻", "七色", "黄金", "透明", "暴走", "伝説"];
    const suffixes = ["花火", "爆発", "祭り", "旋風", "波動", "祝福", "行進", "ダンス", "点滅", "ジャンプ", "拍手", "覚醒", "降臨", "乱舞", "パレード", "お祝い", "びっくり", "フィーバー", "チャンス", "ミラクル", "カーニバル", "流星群", "オーロラ", "分身", "万華鏡", "大予言", "召喚", "タイムスリップ", "光線"];
    const i = Math.floor(appRandom() * icons.length);
    const prefix = prefixes[Math.floor(appRandom() * prefixes.length)];
    const suffix = suffixes[Math.floor(appRandom() * suffixes.length)];
    return { icon: icons[i], name: `${prefix}${suffix}` };
}

function showFullScreenCelebration(count: number): void {
    if (settings.simpleMode) return;
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

function showMiracle(kind: DropKind, symbol: string, probabilityText: string, feelingText: string): void {
    pauseForMiracle();
    if (settings.simpleMode) return;
    miracleOverlay.innerHTML = `
        <div style="max-width:900px;animation:miracle-pop 4.8s ease-out forwards;">
            <style>@keyframes miracle-pop{0%{transform:scale(.65);opacity:0}15%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:0}}</style>
            <div style="font-size:clamp(90px,20vw,220px);line-height:1;">${symbol}</div>
            <div style="font-size:clamp(36px,8vw,90px);font-weight:900;margin-top:12px;text-shadow:0 8px 30px rgba(0,0,0,.6);">奇跡発生</div>
            <div style="font-size:clamp(22px,4vw,44px);font-weight:800;margin-top:12px;">${probabilityText}</div>
            <div style="font-size:clamp(18px,3vw,32px);margin-top:12px;opacity:.92;line-height:1.5;">${feelingText}</div>
        </div>`;
    miracleOverlay.style.display = "flex";
    fireConfetti(kind === "blackSun" ? "black" : kind === "cosmicEgg" ? "cosmic" : "miracle");
    playSpecialSound(kind);
    window.setTimeout(() => { miracleOverlay.style.display = "none"; miracleOverlay.innerHTML = ""; }, 4900);
}

async function enableSound(showNotice = true): Promise<void> {
    try {
        await loadExternalScript("https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.js");
        const Tone = (window as any).Tone;
        if (Tone) {
            await Tone.start();
            toneReady = true;
            soundEnabled = true;
            soundButton.textContent = "音: ON";
            if (showNotice) showMilestone("音ON");
        }
    } catch {
        soundButton.textContent = "音: 読込失敗";
    }
}

async function toggleSound(): Promise<void> {
    if (soundEnabled) {
        soundEnabled = false;
        soundButton.textContent = "音: OFF";
        showMilestone("音OFF");
        return;
    }
    soundEnabled = true;
    soundButton.textContent = "音: ON";
    await enableSound(true);
}

function playSpecialSound(kind: DropKind): void {
    if (!soundEnabled || !toneReady || settings.simpleMode) return;
    const Tone = (window as any).Tone;
    if (!Tone) return;
    try {
        const synth = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.005, decay: 0.12, sustain: 0.1, release: 0.3 } }).toDestination();
        const now = Tone.now();
        if (kind === "gold") synth.triggerAttackRelease("G5", "8n", now);
        else if (kind === "rainbow") { synth.triggerAttackRelease("C5", "16n", now); synth.triggerAttackRelease("E5", "16n", now + 0.08); synth.triggerAttackRelease("G5", "16n", now + 0.16); }
        else if (kind === "giant") synth.triggerAttackRelease("C2", "8n", now);
        else if (kind === "shape") synth.triggerAttackRelease("A4", "16n", now);
        else if (kind === "crown") synth.triggerAttackRelease("C6", "8n", now);
        else if (kind === "shootingStar") { synth.triggerAttackRelease("A5", "16n", now); synth.triggerAttackRelease("E6", "16n", now + 0.12); }
        else if (kind === "heart") synth.triggerAttackRelease("F5", "4n", now);
        else if (kind === "blackSun") synth.triggerAttackRelease("C1", "2n", now);
        else if (kind === "cosmicEgg") { synth.triggerAttackRelease("C1", "2n", now); synth.triggerAttackRelease("G1", "2n", now + 0.18); synth.triggerAttackRelease("C3", "4n", now + 0.38); }
        window.setTimeout(() => synth.dispose(), 900);
    } catch {
        // 音は補助機能なので失敗しても止めない
    }
}

async function ensureConfetti(): Promise<boolean> {
    try {
        if (!(window as any).confetti) await loadExternalScript("https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js");
        return !!(window as any).confetti;
    } catch { return false; }
}

async function fireConfetti(mode: "normal" | "miracle" | "black" | "cosmic" = "normal"): Promise<void> {
    if (settings.simpleMode || !confettiEnabled) return;
    const ok = await ensureConfetti();
    if (!ok) return;
    const confetti = (window as any).confetti;
    const colors = mode === "cosmic" ? ["#240038", "#7c3cff", "#ffffff", "#00e5ff", "#ffd700"] : mode === "black" ? ["#000000", "#ff0044", "#ffffff"] : mode === "miracle" ? ["#ffd700", "#ff69b4", "#78e7ff", "#ffffff"] : undefined;
    const mainCount = mode === "cosmic" ? 420 : mode === "normal" ? 90 : 220;
    const sideCount = mode === "cosmic" ? 220 : mode === "normal" ? 50 : 120;
    confetti({ particleCount: mainCount, spread: mode === "normal" ? 70 : 140, origin: { y: 0.55 }, colors });
    confetti({ particleCount: sideCount, angle: 60, spread: 80, origin: { x: 0, y: 0.65 }, colors });
    confetti({ particleCount: sideCount, angle: 120, spread: 80, origin: { x: 1, y: 0.65 }, colors });
}

async function togglePixiBackground(): Promise<void> {
    pixiEnabled = !pixiEnabled;
    pixiButton.textContent = pixiEnabled ? "Pixi背景: ON" : "Pixi背景: OFF";
    if (pixiEnabled) {
        await initPixiBackground();
        if (pixiApp) pixiApp.view.style.display = "block";
    } else if (pixiApp) pixiApp.view.style.display = "none";
}

async function initPixiBackground(): Promise<void> {
    if (pixiReady) return;
    try {
        await loadExternalScript("https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.min.js");
        const PIXI = (window as any).PIXI;
        if (!PIXI) return;
        pixiApp = new PIXI.Application();
        await pixiApp.init({ resizeTo: gameArea, backgroundAlpha: 0, antialias: true });
        pixiApp.view.style.position = "absolute";
        pixiApp.view.style.inset = "0";
        pixiApp.view.style.width = "100%";
        pixiApp.view.style.height = "100%";
        pixiApp.view.style.pointerEvents = "none";
        pixiLayer.appendChild(pixiApp.view);
        pixiParticles = [];
        for (let i = 0; i < 80; i++) {
            const g = new PIXI.Graphics();
            const size = 1 + Math.random() * 3;
            g.beginFill(0xffffff, 0.35 + Math.random() * 0.45);
            g.circle(0, 0, size);
            g.endFill();
            g.x = Math.random() * gameArea.clientWidth;
            g.y = Math.random() * gameArea.clientHeight;
            (g as any).vx = -0.3 + Math.random() * 0.6;
            (g as any).vy = 0.2 + Math.random() * 0.9;
            pixiApp.stage.addChild(g);
            pixiParticles.push(g);
        }
        pixiApp.ticker.add(() => {
            if (!pixiEnabled) return;
            for (const p of pixiParticles) {
                p.x += (p as any).vx;
                p.y += (p as any).vy;
                if (p.y > gameArea.clientHeight + 10) p.y = -10;
                if (p.x < -10) p.x = gameArea.clientWidth + 10;
                if (p.x > gameArea.clientWidth + 10) p.x = -10;
            }
        });
        pixiReady = true;
    } catch {
        pixiEnabled = false;
        pixiButton.textContent = "Pixi背景: 読込失敗";
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

    topRow.innerHTML = `
        <div>デバイス: <b>${isMobile ? "スマホ向け" : "PC向け"}</b></div>
        <div>ブラウザ: <b>${browserName}</b></div>
        <div>実行回数: <b>${finishedCount.toLocaleString()}</b> / ${settings.targetCount.toLocaleString()}</div>
        <div>画面上の玉: <b>${activeDropCount}</b></div>
        <div>速度: <b>${speedLabelText}</b></div>
        <div>状態: <b>${!isStarted ? "待機中" : isFinished ? "完了" : isMiraclePaused ? "奇跡で停止中" : isPaused ? "停止中" : targetReachedTime ? "残り玉回収中" : "実行中"}</b></div>
        <div>経過時間: <b>${formatElapsedTime(elapsedMs)}</b></div>
        <div>処理速度: <b>${Math.floor(speedPerSecond).toLocaleString()}</b> 回/秒</div>
        <div>残り時間目安: <b>${eta}</b></div>
        <div>暫定1位: <b>${topText}</b></div>
        <div>受け皿: <b>${settings.binCount}</b> + 両端捨て区画</div>
        <div>ピン段数: <b>${settings.pinRows}</b></div>
        <div>金:${goldCreated} 虹:${rainbowCreated} 巨:${giantCreated} 図:${shapeCreated}</div>
        <div>王:${crownCreated} 星:${starCreated} 桃:${heartCreated} 黒:${blackSunCreated} 宇宙卵:${cosmicEggCreated}</div>
        <div>捨て区画: <b>${discardedCount.toLocaleString()}</b></div>
    `;
    updateRandomGraph();
}

function updateRandomGraph(): void {
    const maxBucket = Math.max(...randomBuckets, 1);
    let html = `<div style="font-weight:900;margin-bottom:6px;color:#273042;">Math.random() 直接分布</div><div style="display:grid;grid-template-columns:repeat(10,1fr);gap:6px;align-items:end;height:${Math.round(clamp(72 * geometry.scale, 54, isMobile ? 130 : 110))}px;">`;
    for (let i = 0; i < RANDOM_BUCKET_COUNT; i++) {
        const count = randomBuckets[i];
        const percent = randomCallCount > 0 ? (count / randomCallCount) * 100 : 0;
        const barHeight = Math.max(2, (count / maxBucket) * 100);
        html += `<div style="text-align:center;font-size:${Math.round(clamp(12 * geometry.scale, isMobile ? 13 : 10, isMobile ? 20 : 16))}px;"><div style="height:${barHeight}%;background:linear-gradient(180deg,#6fb0ff,#3d72ff);border-radius:7px 7px 0 0;margin:0 auto 3px auto;width:72%;box-shadow:0 3px 8px rgba(61,114,255,.25);"></div><div>${i / 10}-${(i + 1) / 10}</div><div>${percent.toFixed(1)}%</div></div>`;
    }
    html += `</div>`;
    randomGraphArea.innerHTML = html;
}

function buildResultCsv(): string {
    const rows: Array<Array<string | number>> = [];
    rows.push(["browser", browserName]);
    rows.push(["device", isMobile ? "mobile" : "desktop"]);
    rows.push(["target_count", settings.targetCount]);
    rows.push(["finished_count", finishedCount]);
    rows.push(["bin_count", settings.binCount]);
    rows.push(["pin_rows", settings.pinRows]);
    rows.push(["random_call_count", randomCallCount]);
    rows.push(["discarded_count", discardedCount]);
    rows.push(["gold_created", goldCreated]);
    rows.push(["rainbow_created", rainbowCreated]);
    rows.push(["giant_created", giantCreated]);
    rows.push(["shape_created", shapeCreated]);
    rows.push(["crown_created", crownCreated]);
    rows.push(["shooting_star_created", starCreated]);
    rows.push(["heart_created", heartCreated]);
    rows.push(["black_sun_created", blackSunCreated]);
    rows.push(["cosmic_egg_created", cosmicEggCreated]);
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

function showFinalResult(): void {
    const ranking = binCounts.map((count, index) => ({ label: labels[index], count, percent: finishedCount > 0 ? (count / finishedCount) * 100 : 0 })).sort((a, b) => b.count - a.count);
    const rankingHtml = ranking.map((item, index) => `<div style="margin:7px 0;">${index + 1}位：${item.label}　${item.count.toLocaleString()}回　${item.percent.toFixed(2)}%</div>`).join("");
    resultOverlay.innerHTML = `
        <div style="position:relative;max-width:920px;width:min(920px,94vw);max-height:88dvh;overflow:auto;padding:28px;border-radius:26px;background:rgba(5,8,18,.58);box-shadow:0 24px 80px rgba(0,0,0,.42);">
            <button id="close-result-button" aria-label="閉じる" style="position:absolute;right:14px;top:14px;width:46px;height:46px;border-radius:999px;border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.18);color:#fff;font-size:28px;font-weight:900;line-height:1;cursor:pointer;">×</button>
            <div style="font-size:clamp(38px,8vw,78px);font-weight:900;margin-bottom:18px;">実験完了</div>
            <div style="font-size:clamp(22px,4vw,40px);margin-bottom:18px;">${browserName} / 指定${settings.targetCount.toLocaleString()}回 / 実処理${finishedCount.toLocaleString()}回 / ${formatElapsedTime((targetReachedTime ?? endTime ?? Date.now()) - startTime)}</div>
            <div style="font-size:clamp(18px,3vw,34px);line-height:1.55;">${rankingHtml}</div>
            <div style="margin-top:20px;font-size:clamp(16px,2vw,26px);line-height:1.5;opacity:.95;">一番レアは <b>1兆分の1</b> の「宇宙卵」です。出たら奇跡どころか、画面が伝説になります。</div>
            <div style="margin-top:24px;font-size:clamp(16px,2vw,28px);opacity:.9;">捨て区画:${discardedCount} / 金:${goldCreated} 虹:${rainbowCreated} 巨:${giantCreated} 図:${shapeCreated} 王:${crownCreated} 流れ星:${starCreated} 桃色ハート:${heartCreated} 黒い太陽:${blackSunCreated} 宇宙卵:${cosmicEggCreated}</div>
            <div style="margin-top:24px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;"><button id="copy-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">結果コピー</button><button id="download-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">CSV保存</button><button id="bottom-close-result-button" style="font-size:20px;padding:11px 20px;border-radius:14px;border:1px solid rgba(70,80,110,.28);cursor:pointer;font-weight:800;background:linear-gradient(180deg,#f3f8e8 0%,#dceec2 100%);box-shadow:0 5px 14px rgba(87,112,51,.16);">閉じる</button></div>
        </div>`;
    resultOverlay.style.display = "flex";
    document.getElementById("copy-result-button")!.onclick = () => copyResultCsv();
    document.getElementById("download-result-button")!.onclick = () => downloadResultCsv();
    document.getElementById("close-result-button")!.onclick = () => closeFinalResult();
    document.getElementById("bottom-close-result-button")!.onclick = () => closeFinalResult();
}

// ======================================================
// Rendering
// ======================================================

function drawDiscardBinLabel(context: CanvasRenderingContext2D, physicalIndex: number): void {
    const x = geometry.binLeft + physicalIndex * geometry.binWidth + geometry.binWidth / 2;
    const labelFont = Math.round(clamp(geometry.labelFont * 0.56, 11, 24));
    const countFont = Math.round(clamp(geometry.countFont * 0.70, 10, 24));
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

function drawSparkle(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, rotate: number): void {
    context.save();
    context.translate(x, y);
    context.rotate(rotate);
    context.strokeStyle = color;
    context.lineWidth = Math.max(1, size * 0.12);
    context.globalAlpha = 0.9;
    context.beginPath();
    context.moveTo(-size, 0);
    context.lineTo(size, 0);
    context.moveTo(0, -size);
    context.lineTo(0, size);
    context.stroke();
    context.restore();
}

function drawSpecialGlows(context: CanvasRenderingContext2D): void {
    if (settings.simpleMode) return;
    const time = Date.now() / 1000;
    context.save();
    context.globalCompositeOperation = "lighter";
    for (const body of engine.world.bodies) {
        const plugin = (body as any).plugin;
        if (!plugin?.isDrop) continue;
        const kind = plugin.kind as DropKind;
        if (!["gold", "rainbow", "heart", "crown", "shootingStar", "blackSun", "cosmicEgg"].includes(kind)) continue;
        const x = body.position.x;
        const y = body.position.y;
        const radius = body.circleRadius ?? plugin.originalRadius ?? geometry.ballRadius;
        const pulse = 0.75 + Math.sin(time * 9) * 0.25;
        let colors = ["255,215,0", "255,170,0"];
        if (kind === "rainbow") colors = ["190,100,255", "80,180,255"];
        if (kind === "heart") colors = ["255,105,180", "255,20,147"];
        if (kind === "shootingStar") colors = ["120,231,255", "255,255,255"];
        if (kind === "blackSun") colors = ["255,0,68", "0,0,0"];
        if (kind === "cosmicEgg") colors = ["124,60,255", "0,229,255"];
        const glow = context.createRadialGradient(x, y, radius * 0.2, x, y, radius * 5);
        glow.addColorStop(0, `rgba(${colors[0]}, ${0.9 * pulse})`);
        glow.addColorStop(0.65, `rgba(${colors[1]}, ${0.36 * pulse})`);
        glow.addColorStop(1, `rgba(${colors[1]}, 0)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, radius * 5, 0, Math.PI * 2);
        context.fill();
        if (plugin.symbol) {
            context.font = `900 ${Math.round(radius * (kind === "crown" ? 1.35 : 1.65))}px "Noto Sans JP", "Segoe UI", "Segoe UI Symbol", "Segoe UI Emoji", sans-serif`;
            context.fillStyle = kind === "blackSun" ? "#ff0044" : kind === "cosmicEgg" ? "#00e5ff" : kind === "crown" ? "#5a3600" : "#ffffff";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(plugin.symbol, x, y);
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

Events.on(render, "afterRender", () => {
    const context = render.context;
    context.save();
    drawSpecialGlows(context);
    context.textAlign = "center";
    context.textBaseline = "middle";
    drawDiscardBinLabel(context, 0);
    drawDiscardBinLabel(context, settings.binCount + 1);
    const maxCount = Math.max(...binCounts, 0);
    for (let i = 0; i < settings.binCount; i++) {
        const x = geometry.binCenters[i];
        const count = binCounts[i];
        const percent = finishedCount > 0 ? (count / finishedCount) * 100 : 0;
        if (!settings.simpleMode && hitFlash[i] > 0) {
            const alpha = hitFlash[i] / 18;
            context.fillStyle = `rgba(255,160,80,${alpha * 0.45})`;
            context.fillRect(x - geometry.binWidth / 2, geometry.groundTop - 118 * geometry.scale, geometry.binWidth, 118 * geometry.scale);
            hitFlash[i]--;
        }
        if (!settings.simpleMode && count === maxCount && maxCount > 0) {
            context.beginPath();
            context.arc(x, geometry.labelY, 32 * geometry.scale, 0, Math.PI * 2);
            context.fillStyle = "rgba(255, 220, 80, 0.45)";
            context.fill();
        }
        context.font = `900 ${geometry.labelFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = "#222";
        context.fillText(labels[i], x, geometry.labelY);
        context.font = `800 ${geometry.countFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = "#003366";
        context.fillText(count.toLocaleString(), x, geometry.countY);
        context.font = `700 ${geometry.percentFont}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = "#444";
        context.fillText(`${percent.toFixed(1)}%`, x, geometry.percentY);
        const barMaxWidth = geometry.binWidth * 0.72;
        const barWidth = Math.min(barMaxWidth, barMaxWidth * (percent / 25));
        const barHeight = clamp(8 * geometry.scale, 4, 18);
        context.fillStyle = "#d7dce7";
        context.fillRect(x - barMaxWidth / 2, geometry.barY, barMaxWidth, barHeight);
        context.fillStyle = "#4b8cff";
        context.fillRect(x - barMaxWidth / 2, geometry.barY, barWidth, barHeight);
    }
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const item = floatingTexts[i];
        const progress = item.life / item.maxLife;
        const y = item.y - (1 - progress) * 40 * geometry.scale;
        context.globalAlpha = progress;
        context.font = `900 ${Math.round(clamp(24 * geometry.scale, 16, 42))}px "Segoe UI", "Noto Sans JP", sans-serif`;
        context.fillStyle = item.color;
        context.fillText(item.text, item.x, y);
        context.globalAlpha = 1;
        item.life--;
        if (item.life <= 0) floatingTexts.splice(i, 1);
    }
    context.restore();
});

// ======================================================
// Physics update
// ======================================================

Events.on(engine, "afterUpdate", () => {
    updateCameraShake();
    updatePinWiggles();
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

        // 指定回数に到達した後も、画面に残っている玉は最後に強制回収してカウントする
        if (targetReachedTime !== null && Date.now() - targetReachedTime > FINAL_SWEEP_DELAY_MS) {
            const binIndex = getBinIndex(body.position.x);
            finishedCount++;
            if (binIndex >= 0) {
                binCounts[binIndex]++;
                if (!settings.simpleMode) hitFlash[binIndex] = 18;
            } else {
                discardedCount++;
            }
            activeDropCount--;
            removeTargets.push(body);
            continue;
        }

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
            if (kind !== "normal") playSpecialSound(kind);
            const binIndex = getBinIndex(body.position.x);
            finishedCount++;
            if (targetReachedTime === null && finishedCount >= settings.targetCount) targetReachedTime = Date.now();

            if (binIndex >= 0) {
                binCounts[binIndex]++;
                if (!settings.simpleMode) hitFlash[binIndex] = 18;
                triggerCameraShake(3 * geometry.scale, 100);
                if (kind === "gold") { goldHits[binIndex]++; addFloatingText(`金 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 60 * geometry.scale, "#d89b00"); triggerCameraShake(7 * geometry.scale, 180); }
                if (kind === "rainbow") { rainbowHits[binIndex]++; addFloatingText(`虹 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 60 * geometry.scale, "#b44cff"); triggerCameraShake(11 * geometry.scale, 240); }
                if (kind === "giant") { giantHits[binIndex]++; addFloatingText(`巨大 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 70 * geometry.scale, "#111111"); triggerCameraShake(15 * geometry.scale, 300); }
                if (kind === "shape") { shapeHits[binIndex]++; addFloatingText(`${plugin.shapeName ?? "図形"} → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 70 * geometry.scale, "#ffffff"); triggerCameraShake(9 * geometry.scale, 220); }
                if (kind === "crown") { crownHits[binIndex]++; addFloatingText(`王 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#ffd54a"); fireConfetti("miracle"); }
                if (kind === "shootingStar") { starHits[binIndex]++; addFloatingText(`流れ星 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#78e7ff"); fireConfetti("miracle"); }
                if (kind === "heart") { heartHits[binIndex]++; addFloatingText(`桃色ハート → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#ff69b4"); triggerCameraShake(22 * geometry.scale, 480); fireConfetti("miracle"); }
                if (kind === "blackSun") { blackSunHits[binIndex]++; addFloatingText(`黒い太陽 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 80 * geometry.scale, "#ff0044"); triggerCameraShake(26 * geometry.scale, 600); fireConfetti("black"); }
                if (kind === "cosmicEgg") { cosmicEggHits[binIndex]++; addFloatingText(`宇宙卵 → ${labels[binIndex]}`, body.position.x, geometry.ballCountY - 90 * geometry.scale, "#00e5ff"); triggerCameraShake(38 * geometry.scale, 1200); fireConfetti("cosmic"); }

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
        endTime = Date.now();
        Runner.stop(runner);
        updateInfo();
        showFinalResult();
    }
});

// ======================================================
// Start / resize
// ======================================================

geometry = calculateGeometry();
resetExperiment(false);
Render.run(render);

let resizeTimer: number | undefined;
window.addEventListener("resize", () => {
    if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
        applySettingsFromInputs();
        resetExperiment(isStarted && !isFinished);
    }, 300);
});