export type UiFactoryOptions = {
    isMobile: boolean;
    uiFontPx: number;
    roundedUiFont: string;
};

export function createField(
    label: string,
    input: HTMLElement,
    options: UiFactoryOptions,
): { wrapper: HTMLDivElement; labelEl: HTMLLabelElement } {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "6px";
    wrapper.style.minWidth = "0";

    const labelElement = document.createElement("label");
    labelElement.textContent = label;
    labelElement.style.fontWeight = "800";
    labelElement.style.color = "#273042";
    labelElement.style.fontSize = `${Math.max(12, options.uiFontPx - 6)}px`;

    wrapper.appendChild(labelElement);
    wrapper.appendChild(input);
    return { wrapper, labelEl: labelElement };
}

export function createInput(value: string, type = "text", options: UiFactoryOptions): HTMLInputElement {
    const input = document.createElement("input");
    input.type = type;
    input.value = value;
    input.style.width = "100%";
    input.style.boxSizing = "border-box";
    input.style.padding = options.isMobile ? "12px 12px" : "9px 11px";
    input.style.borderRadius = "18px";
    input.style.border = "1px solid rgba(85,105,130,.40)";
    input.style.background = "linear-gradient(180deg,rgba(255,255,255,.92),rgba(228,236,246,.82))";
    input.style.boxShadow = "inset 0 2px 8px rgba(15,23,42,.10), 0 1px 0 rgba(255,255,255,.65)";
    input.style.fontSize = `${options.uiFontPx}px`;
    input.style.outline = "none";
    input.style.fontFamily = options.roundedUiFont;
    return input;
}

export function createTextarea(value: string, options: UiFactoryOptions): HTMLTextAreaElement {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.rows = options.isMobile ? 5 : 4;
    textarea.style.width = "100%";
    textarea.style.boxSizing = "border-box";
    textarea.style.padding = options.isMobile ? "12px 12px" : "9px 11px";
    textarea.style.borderRadius = "18px";
    textarea.style.border = "1px solid rgba(85,105,130,.40)";
    textarea.style.background = "linear-gradient(180deg,rgba(255,255,255,.92),rgba(228,236,246,.82))";
    textarea.style.boxShadow = "inset 0 2px 8px rgba(15,23,42,.10), 0 1px 0 rgba(255,255,255,.65)";
    textarea.style.fontSize = `${options.uiFontPx}px`;
    textarea.style.outline = "none";
    textarea.style.resize = "vertical";
    textarea.style.fontFamily = options.roundedUiFont;
    return textarea;
}

export function getMetallicButtonBackground(primary = false): string {
    return primary
        ? "linear-gradient(180deg,#fff7bf 0%,#ffd65a 22%,#c58a10 54%,#fff1a6 100%)"
        : "linear-gradient(180deg,#ffffff 0%,#dfe8f3 18%,#8fa3b7 50%,#f9fbff 100%)";
}

export function applyUnifiedMetallicButtonStyle(
    button: HTMLButtonElement,
    primary = false,
    options: UiFactoryOptions,
): void {
    button.style.width = "100%";
    button.style.minWidth = "0";
    button.style.height = options.isMobile ? "46px" : "44px";
    button.style.minHeight = options.isMobile ? "46px" : "44px";
    button.style.maxHeight = options.isMobile ? "46px" : "44px";
    button.style.padding = options.isMobile ? "5px 8px" : "5px 10px";
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
    button.style.fontFamily = options.roundedUiFont;
    button.style.fontWeight = "1000";
    button.style.fontSize = options.isMobile ? "12px" : "13px";
    button.style.textShadow = "0 1px 0 rgba(255,255,255,.55)";
    button.style.overflow = "hidden";
}

export function getMetallicPanelBackground(dark = false): string {
    return dark
        ? "linear-gradient(135deg,rgba(15,23,42,.86) 0%,rgba(30,41,59,.72) 46%,rgba(148,163,184,.24) 100%)"
        : "linear-gradient(135deg,rgba(255,255,255,.76) 0%,rgba(222,235,247,.62) 38%,rgba(180,198,218,.46) 70%,rgba(255,255,255,.66) 100%)";
}

export function createButton(text: string, onClick: () => void, options: UiFactoryOptions): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = text;
    applyUnifiedMetallicButtonStyle(button, false, options);
    button.onclick = onClick;
    return button;
}
