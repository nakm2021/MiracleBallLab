import type { ThemeUiPalette } from "./settings";

export function applyThemePaletteToPanel(root: HTMLElement, palette: ThemeUiPalette): void {
    root.style.color = palette.fieldText;

    const sections = Array.from(root.querySelectorAll<HTMLElement>(".miracle-section, .miracle-user-card, .miracle-record-hero"));
    for (const section of sections) {
        section.style.background = palette.section;
        section.style.color = palette.fieldText;
        section.style.borderColor = palette.buttonBorder;
    }

    const fields = Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select"));
    for (const field of fields) {
        field.style.background = palette.fieldBg;
        field.style.color = palette.fieldText;
        field.style.borderColor = palette.fieldBorder;
    }

    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));
    for (const button of buttons) {
        if (button.dataset.fixedStyle === "1") continue;
        button.style.background = palette.buttonBg;
        button.style.color = palette.buttonText;
        button.style.borderColor = palette.buttonBorder;
        button.style.textShadow = "none";
    }
}
