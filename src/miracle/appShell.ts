export function installAppShellStyles(isMobile: boolean, roundedUiFont: string): void {
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.width = "100%";
    document.documentElement.style.maxWidth = "100%";
    document.documentElement.style.height = "100%";
    document.documentElement.style.overflowX = "hidden";
    document.documentElement.style.overflowY = isMobile ? "hidden" : "auto";
    document.documentElement.style.overscrollBehavior = "none";

    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = "linear-gradient(180deg, #eef3ff 0%, #f7f4ef 100%)";
    document.body.style.fontFamily = roundedUiFont;
    document.body.style.overflow = isMobile ? "hidden" : "auto";
    document.body.style.overflowX = "hidden";
    document.body.style.width = "100%";
    document.body.style.maxWidth = "100%";
    document.body.style.height = isMobile ? "var(--miracle-app-height, 100vh)" : "auto";
    document.body.style.minHeight = "100vh";
    document.body.style.position = isMobile ? "fixed" : "static";
    document.body.style.left = isMobile ? "0" : "";
    document.body.style.top = isMobile ? "0" : "";
    document.body.style.right = isMobile ? "0" : "";
    document.body.style.bottom = isMobile ? "0" : "";
    document.body.style.overscrollBehavior = "none";
    document.body.style.touchAction = isMobile ? "pan-y" : "auto";
    document.body.classList.toggle("miracle-mobile-device", isMobile);

    const globalStyle = document.createElement("style");
    globalStyle.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      html, body { max-width: 100%; overflow-x: hidden; }
      body { overflow-y: auto; }
      body { overscroll-behavior-x: none; font-family: "M PLUS Rounded 1c", "Zen Maru Gothic", "Kosugi Maru", "Hiragino Maru Gothic ProN", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif; }
      button, input, textarea, select, pre, code { font-family: inherit; }
      #miracle-horizontal-guard { width: 100%; max-width: 100%; overflow-x: hidden; }
      body.miracle-mobile-device #miracle-game-area {
        position: relative !important;
        overflow: hidden !important;
      }
      body.miracle-mobile-device #miracle-game-area > canvas {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 100% !important;
        min-height: 100% !important;
        max-width: none !important;
        max-height: none !important;
        margin: 0 !important;
        transform: translate(0,0) !important;
      }
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
}

export function createAppRoot(isMobile: boolean): HTMLDivElement {
    const appRoot = document.createElement("div");
    appRoot.id = "miracle-horizontal-guard";
    appRoot.style.position = isMobile ? "fixed" : "relative";
    appRoot.style.left = isMobile ? "0" : "";
    appRoot.style.top = isMobile ? "0" : "";
    appRoot.style.right = isMobile ? "0" : "";
    appRoot.style.bottom = isMobile ? "0" : "";
    appRoot.style.width = "100vw";
    appRoot.style.maxWidth = "100vw";
    appRoot.style.height = isMobile ? "var(--miracle-app-height, 100vh)" : "auto";
    appRoot.style.minHeight = isMobile ? "var(--miracle-app-height, 100vh)" : "100vh";
    appRoot.style.boxSizing = "border-box";
    appRoot.style.display = "flex";
    appRoot.style.flexDirection = "column";
    appRoot.style.overflowX = "hidden";
    appRoot.style.overflowY = isMobile ? "hidden" : "visible";
    document.body.appendChild(appRoot);
    return appRoot;
}

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

export function createBootOverlay(options: {
    faviconUrl: string;
    minimumDurationMs: number;
    onIconTap: () => void;
    onKeydown: (event: KeyboardEvent) => void;
}): { hide: () => void; overlay: HTMLDivElement } {
    const bootStartedAt = Date.now();
    const bootFaviconReady = preloadImage(options.faviconUrl);
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
    bootIcon.src = options.faviconUrl;
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
    bootIcon.addEventListener("click", options.onIconTap);
    document.addEventListener("keydown", options.onKeydown);

    let hidden = false;
    const hide = (): void => {
        if (hidden) return;
        hidden = true;
        void Promise.all([
            bootFaviconReady,
            new Promise<void>((resolve) => {
                const wait = Math.max(0, options.minimumDurationMs - (Date.now() - bootStartedAt));
                window.setTimeout(() => resolve(), wait);
            }),
        ]).then(() => {
            bootOverlay.style.opacity = "0";
            window.setTimeout(() => bootOverlay.remove(), 460);
        }).catch(() => {
            bootOverlay.style.opacity = "0";
            window.setTimeout(() => bootOverlay.remove(), 460);
        });
    };

    window.setTimeout(() => hide(), options.minimumDurationMs + 300);
    window.setTimeout(() => {
        if (!document.body.contains(bootOverlay)) return;
        bootOverlay.style.opacity = "0";
        window.setTimeout(() => bootOverlay.remove(), 460);
    }, 4000);

    return { hide, overlay: bootOverlay };
}
