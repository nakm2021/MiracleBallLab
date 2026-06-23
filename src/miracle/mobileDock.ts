type MobileDockGuardOptions = {
    isMobile: boolean;
    isAppTerminated: () => boolean;
    mobileSettingsOverlay: () => HTMLElement | null;
    resultOverlay: () => HTMLElement | null;
    info: HTMLElement;
    isOverlayOpen: (el: HTMLElement | null | undefined) => boolean;
    isOverlayOpenById: (id: string) => boolean;
    startExperiment: () => void;
    togglePause: () => void;
    enableMagicCircleMode: () => void;
    openMobileSettingsPopup: () => void;
};

function getClientPointFromAnyEvent(event: Event): { x: number; y: number } | null {
    const touchEvent = event as TouchEvent;
    const touch = touchEvent.changedTouches?.[0] ?? touchEvent.touches?.[0];
    if (touch) return { x: touch.clientX, y: touch.clientY };
    const pointerEvent = event as PointerEvent;
    if (typeof pointerEvent.clientX === "number" && typeof pointerEvent.clientY === "number") {
        return { x: pointerEvent.clientX, y: pointerEvent.clientY };
    }
    return null;
}

export function installMobileDockGlobalActionGuard(options: MobileDockGuardOptions): void {
    if (!options.isMobile) return;
    let lastActivatedAt = 0;

    const handle = (event: Event): void => {
        if (options.isAppTerminated()) return;
        if (
            options.isOverlayOpen(options.mobileSettingsOverlay()) ||
            options.isOverlayOpenById("miracle-help-overlay") ||
            options.resultOverlay()?.style.display !== "none"
        ) {
            return;
        }

        const point = getClientPointFromAnyEvent(event);
        if (!point) return;

        const infoRect = options.info.getBoundingClientRect();
        const fallbackDockHeight = 118;
        const dockTop = Math.min(
            infoRect.top || Number.POSITIVE_INFINITY,
            window.innerHeight - Math.max(fallbackDockHeight, infoRect.height || fallbackDockHeight),
        );
        if (point.y < dockTop || point.y > window.innerHeight + 8) return;

        const now = performance.now();
        if (now - lastActivatedAt < 300) return;
        lastActivatedAt = now;

        event.preventDefault();
        event.stopPropagation();

        const width = Math.max(1, window.innerWidth);
        const index = Math.max(0, Math.min(3, Math.floor((point.x / width) * 4)));
        if (index === 0) {
            options.startExperiment();
            return;
        }
        if (index === 1) {
            options.togglePause();
            return;
        }
        if (index === 2) {
            options.enableMagicCircleMode();
            return;
        }
        options.openMobileSettingsPopup();
    };

    document.addEventListener("pointerup", handle, { capture: true, passive: false });
    document.addEventListener("click", handle, { capture: true, passive: false });
}
