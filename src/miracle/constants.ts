export const BASE_WIDTH = 800;
export const BASE_HEIGHT = 600;

export const MILESTONE_INTERVAL = 100000;
export const GIANT_EVENT_INTERVAL = 100000;
export const FINAL_SWEEP_DELAY_MS = 3000;
export const SCORE_STORAGE_BONUS_INTERVAL = 5000;
export const MAGNET_DURATION_MS = 5000;
export const TIME_STOP_DURATION_MS = 2200;
export const COMMENTARY_MIN_INTERVAL_MS = 14000;
export const COMMENTARY_DISPLAY_MS = 9000;
export const MIRACLE_CHAIN_WINDOW_MS = 8 * 60 * 1000;
export const MIRACLE_OMEN_MIN_INTERVAL_MS = 18000;
export const MIRACLE_OMEN_DISPLAY_MS = 1800;
export const FIRST_RUN_GUIDE_STORAGE_KEY = "miracle-ball-lab-first-guide-seen-v1";
export const SMALL_MIRACLE_MIN_INTERVAL_MS = 9000;

export const GOLD_RATE = 0.002;           // 1/500
export const RAINBOW_RATE = 0.0005;       // 1/2,000
export const SHAPE_RATE = 0.002;          // 1/500
export const CROWN_RATE = 0.0001;         // 1/10,000
export const SHOOTING_STAR_RATE = 0.00001;// 1/100,000
export const HEART_RATE = 0.000001;       // 1/1,000,000
export const BLACK_SUN_RATE = 0.0000001;  // 1/10,000,000
export const COSMIC_EGG_RATE = 0.000000000001; // 1/1,000,000,000,000
export const SWORD_IMPACT_RATE = 0.0000002; // 1/5,000,000

export const RECORD_STORAGE_KEY = "miracle-ball-lab-records-v3";
export const USER_PROFILE_STORAGE_KEY = "miracle-ball-lab-user-profile-v1";
export const USER_PREFERENCES_STORAGE_KEY = "miracle-ball-lab-user-preferences-v1";
export const APP_VERSION = "1.0.0";
export const SECRET_KEY_SEQUENCE = "miracle";
export const MIRACLE_ASSET_BASE_URL = "https://pub-53a4b50cc39c4d7882f67fc9340fe6e8.r2.dev";
export const MIRACLE_MANIFEST_URL = `${MIRACLE_ASSET_BASE_URL}/manifest.json`;
export const REMOTE_MIRACLE_MANIFEST_CACHE_MS = 5 * 60 * 1000;
export const REMOTE_MIRACLE_VIDEO_DISPLAY_MS = 10 * 1000;
export const REMOTE_MIRACLE_BAD_URL_CACHE_MS = 30 * 60 * 1000;
export const SECRET_KEY_SEQUENCES: Record<string, { label: string; detail: string }> = {
    miracle: { label: "MIRACLE コード", detail: "キーボードで隠しコードを入力しました。今日の研究所は少しだけ騒がしくなります。" },
    lab: { label: "LAB コード", detail: "研究所の短縮コードを入力しました。秘密研究員として記録します。" },
    neko: { label: "NEKO コード", detail: "ねこちゃんモードの気配を呼びました。" },
    sun: { label: "SUN コード", detail: "黒い太陽を探す研究者用の短縮コードです。" },
    nekomata: { label: "使い魔契約 NEKOMATA", detail: "ねこ式使い魔と秘密契約しました。" },
    kurohane: { label: "使い魔契約 KUROHANE", detail: "黒羽コウモリと秘密契約しました。" },
    tokeikitsune: { label: "使い魔契約 TOKEI", detail: "時計キツネと秘密契約しました。" },
    hoshikurage: { label: "使い魔契約 HOSHI", detail: "星くらげと秘密契約しました。" },
    miko: { label: "使い魔契約 MIKO", detail: "秘密巫女うさぎと秘密契約しました。" },
};
export const SECRET_KEY_MAX_LENGTH = Math.max(SECRET_KEY_SEQUENCE.length, ...Object.keys(SECRET_KEY_SEQUENCES).map((x) => x.length));

export const LOCAL_RARE_AUDIO_FILES: string[] = [];
export const LOCAL_GOD_AUDIO_FILES: string[] = [];
export type RareSoundFlavor = "normal" | "ur" | "ex" | "god";

export const RANDOM_BUCKET_COUNT = 10;
export const STUCK_NUDGE_FRAMES = 90;
export const STUCK_EXPLODE_FRAMES = 600;

