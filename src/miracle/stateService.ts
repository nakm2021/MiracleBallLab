import type { Settings, ThemeAutoMode, ThemeMode, UserPlayStyle, UserPreferences, UserProfile } from "./types";

export function applyUserPreferences(params: {
    prefs: UserPreferences | null | undefined;
    settings: Settings;
    storage: Storage;
    storageKey: string;
    commentaryMigrationKey: string;
    pinRowsMigrationKey: string;
    binCountMigrationKey: string;
    createDefaultLabelText: (count: number) => string;
}): {
    settings: Settings;
    userPreferences: UserPreferences;
    speedLabelText?: string;
    currentTheme?: ThemeMode;
    themeAutoMode?: ThemeAutoMode;
    soundEnabled?: boolean;
    confettiEnabled?: boolean;
    isEnglish?: boolean;
} {
    const { prefs, storage, storageKey } = params;
    if (!prefs || typeof prefs !== "object") {
        return { settings: params.settings, userPreferences: { version: 1 } };
    }

    let settings = { ...params.settings, ...prefs };
    let userPreferences: UserPreferences = { ...prefs };

    if (!storage.getItem(params.commentaryMigrationKey)) {
        settings.commentaryEnabled = false;
        userPreferences = { ...userPreferences, commentaryEnabled: false };
        try {
            storage.setItem(storageKey, JSON.stringify(userPreferences));
            storage.setItem(params.commentaryMigrationKey, "1");
        } catch {}
    }

    try {
        if (!storage.getItem(params.pinRowsMigrationKey)) {
            const savedRows = Number(prefs.pinRows);
            if (!Number.isFinite(savedRows) || savedRows === 6 || savedRows === 7) {
                settings.pinRows = 4;
                userPreferences = { ...userPreferences, pinRows: 4 };
                storage.setItem(storageKey, JSON.stringify(userPreferences));
            }
            storage.setItem(params.pinRowsMigrationKey, "1");
        }
    } catch {}

    try {
        if (!storage.getItem(params.binCountMigrationKey)) {
            const savedBins = Number(prefs.binCount);
            if (!Number.isFinite(savedBins) || savedBins === 6 || savedBins === 8) {
                settings.binCount = 4;
                settings.labelText = params.createDefaultLabelText(settings.binCount);
                userPreferences = { ...userPreferences, binCount: 4, labelText: settings.labelText };
                storage.setItem(storageKey, JSON.stringify(userPreferences));
            }
            storage.setItem(params.binCountMigrationKey, "1");
        }
    } catch {}

    return {
        settings,
        userPreferences,
        speedLabelText: prefs.speedLabelText || undefined,
        currentTheme: prefs.theme || undefined,
        themeAutoMode: prefs.themeAutoMode || undefined,
        soundEnabled: typeof prefs.soundEnabled === "boolean" ? prefs.soundEnabled : undefined,
        confettiEnabled: typeof prefs.confettiEnabled === "boolean" ? prefs.confettiEnabled : undefined,
        isEnglish: prefs.language === "en" ? true : undefined,
    };
}

export function buildUserPreferences(params: {
    settings: Settings;
    selectedBackgroundObjectUrl: string;
    defaultBackgroundImageUrl: string;
    speedLabelText: string;
    currentTheme: ThemeMode;
    themeAutoMode: ThemeAutoMode;
    soundEnabled: boolean;
    confettiEnabled: boolean;
    isEnglish: boolean;
}): UserPreferences {
    return {
        version: 1,
        targetCount: params.settings.targetCount,
        activeLimit: params.settings.activeLimit,
        binCount: params.settings.binCount,
        pinRows: params.settings.pinRows,
        labelText: params.settings.labelText,
        backgroundImage: params.settings.backgroundImage === params.selectedBackgroundObjectUrl ? params.defaultBackgroundImageUrl : params.settings.backgroundImage,
        simpleMode: params.settings.simpleMode,
        cameraShakeEnabled: params.settings.cameraShakeEnabled,
        slowMiracleEffects: params.settings.slowMiracleEffects,
        effectsEnabled: params.settings.effectsEnabled,
        commentaryEnabled: params.settings.commentaryEnabled,
        boardAnomalyEnabled: params.settings.boardAnomalyEnabled,
        normalBallTraitsEnabled: params.settings.normalBallTraitsEnabled,
        timeBallSkinsEnabled: params.settings.timeBallSkinsEnabled,
        mobileCompactMode: params.settings.mobileCompactMode,
        lowSpecMode: params.settings.lowSpecMode,
        showRecentMiracles: params.settings.showRecentMiracles,
        familiarEnabled: params.settings.familiarEnabled,
        blackModeEnabled: params.settings.blackModeEnabled,
        effectMode: params.settings.effectMode,
        probabilityMode: params.settings.probabilityMode,
        speedLabelText: params.speedLabelText,
        theme: params.currentTheme,
        themeAutoMode: params.themeAutoMode,
        soundEnabled: params.soundEnabled,
        confettiEnabled: params.confettiEnabled,
        language: params.isEnglish ? "en" : "ja",
    };
}

export function getUserPlayStyleLabel(style: UserPlayStyle, isEnglish: boolean): string {
    const ja: Record<UserPlayStyle, string> = { standard: "標準", viewer: "演出を見る", collector: "図鑑収集", recording: "録画・SNS" };
    const en: Record<UserPlayStyle, string> = { standard: "Standard", viewer: "Effects", collector: "Collection", recording: "Recording" };
    return isEnglish ? en[style] : ja[style];
}

export function getAppOnlineStatusHtml(params: {
    online: boolean;
    serviceWorkerReady: boolean;
    appVersion: string;
}): string {
    return `
        <span class="miracle-status-pill">${params.online ? "オンライン" : "オフライン"}</span>
        <span class="miracle-status-pill">${params.serviceWorkerReady ? "オフライン起動準備あり" : "Service Workerなし"}</span>
        <span class="miracle-status-pill">v${params.appVersion}</span>
    `;
}

export function registerAppOpenInProfile(params: {
    profile: UserProfile;
    now: number;
    getDateKey: (date?: Date) => string;
}): UserProfile {
    const today = params.getDateKey();
    const last = params.profile.lastPlayedDateKey;
    const yesterday = params.getDateKey(new Date(params.now - 24 * 60 * 60 * 1000));
    const nextProfile: UserProfile = {
        ...params.profile,
        openCount: params.profile.openCount + 1,
        lastOpenedAt: params.now,
    };

    if (last !== today) {
        nextProfile.consecutiveDays = last === yesterday ? params.profile.consecutiveDays + 1 : 1;
        nextProfile.lastPlayedDateKey = today;
    }

    return nextProfile;
}
