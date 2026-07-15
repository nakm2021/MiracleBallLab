import type { DropKind } from "./types";

export type UiAccentPalette = {
    panel: string;
    section: string;
    fieldBg: string;
    fieldText: string;
    border: string;
    badge: string;
    badgeText: string;
    title: string;
    subtitle: string;
};

const UI_ACCENT_PALETTES: Record<string, UiAccentPalette> = {
    poseidonMode: {
        panel: "linear-gradient(180deg, rgba(232,246,255,.97) 0%, rgba(192,229,255,.90) 100%)",
        section: "linear-gradient(180deg, rgba(235,248,255,.95) 0%, rgba(205,233,255,.88) 100%)",
        fieldBg: "#f2fbff",
        fieldText: "#07203c",
        border: "#79c8ff",
        badge: "linear-gradient(180deg,#d7f1ff 0%,#7dc8ff 100%)",
        badgeText: "#05264b",
        title: "#08315e",
        subtitle: "#13548b",
    },
    zeusuMode: {
        panel: "linear-gradient(180deg, rgba(255,250,222,.97) 0%, rgba(255,239,176,.90) 100%)",
        section: "linear-gradient(180deg, rgba(255,251,228,.95) 0%, rgba(255,238,183,.88) 100%)",
        fieldBg: "#fffbea",
        fieldText: "#453100",
        border: "#ffe75a",
        badge: "linear-gradient(180deg,#fff3b0 0%,#ffd54a 100%)",
        badgeText: "#3e2f00",
        title: "#513b00",
        subtitle: "#876300",
    },
    hadesuMode: {
        panel: "linear-gradient(180deg, rgba(26,10,10,.96) 0%, rgba(44,8,8,.92) 100%)",
        section: "linear-gradient(180deg, rgba(30,8,8,.95) 0%, rgba(16,4,4,.92) 100%)",
        fieldBg: "#210808",
        fieldText: "#ffe7e7",
        border: "#ff7d7d",
        badge: "linear-gradient(180deg,#3b0b0b 0%,#6f1414 100%)",
        badgeText: "#fff3f3",
        title: "#fff3f3",
        subtitle: "#ffb0b0",
    },
    heartMode: {
        panel: "linear-gradient(180deg, rgba(255,240,248,.97) 0%, rgba(255,215,232,.90) 100%)",
        section: "linear-gradient(180deg, rgba(255,242,249,.95) 0%, rgba(255,221,239,.88) 100%)",
        fieldBg: "#fff6fb",
        fieldText: "#5c173c",
        border: "#ff70ba",
        badge: "linear-gradient(180deg,#ffd7ec 0%,#ff8cc3 100%)",
        badgeText: "#5c173c",
        title: "#8a1d55",
        subtitle: "#b92c72",
    },
    nekochanMode: {
        panel: "linear-gradient(180deg, rgba(255,246,234,.97) 0%, rgba(255,228,198,.90) 100%)",
        section: "linear-gradient(180deg, rgba(255,247,238,.95) 0%, rgba(255,229,205,.88) 100%)",
        fieldBg: "#fff8f1",
        fieldText: "#4a2a11",
        border: "#ffbf76",
        badge: "linear-gradient(180deg,#ffe6c8 0%,#ffb56e 100%)",
        badgeText: "#4a2a11",
        title: "#5d3515",
        subtitle: "#8f5729",
    },
    crown: {
        panel: "linear-gradient(180deg, rgba(255,247,224,.97) 0%, rgba(255,232,165,.90) 100%)",
        section: "linear-gradient(180deg, rgba(255,249,230,.95) 0%, rgba(255,235,178,.88) 100%)",
        fieldBg: "#fffbee",
        fieldText: "#413000",
        border: "#ffd54a",
        badge: "linear-gradient(180deg,#fff0a9 0%,#ffd54a 100%)",
        badgeText: "#3e2f00",
        title: "#5a4300",
        subtitle: "#8a6700",
    },
    blackSun: {
        panel: "linear-gradient(180deg, rgba(16,0,6,.96) 0%, rgba(32,0,12,.92) 100%)",
        section: "linear-gradient(180deg, rgba(25,0,10,.95) 0%, rgba(15,0,6,.92) 100%)",
        fieldBg: "#19030b",
        fieldText: "#ffeef2",
        border: "#ff4775",
        badge: "linear-gradient(180deg,#5a0018 0%,#aa1238 100%)",
        badgeText: "#fff5f7",
        title: "#fff3f5",
        subtitle: "#ff9db7",
    },
    cosmicEgg: {
        panel: "linear-gradient(180deg, rgba(237,247,255,.97) 0%, rgba(200,240,255,.90) 100%)",
        section: "linear-gradient(180deg, rgba(240,249,255,.95) 0%, rgba(208,244,255,.88) 100%)",
        fieldBg: "#f2fcff",
        fieldText: "#06273a",
        border: "#65e7ff",
        badge: "linear-gradient(180deg,#d9f9ff 0%,#72e9ff 100%)",
        badgeText: "#08314a",
        title: "#0c3a5a",
        subtitle: "#16689a",
    },
};

export function getUiAccentPaletteByKind(kind: DropKind | null): UiAccentPalette | null {
    if (!kind) return null;
    return UI_ACCENT_PALETTES[kind] ?? null;
}
