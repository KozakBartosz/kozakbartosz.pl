type NativeTransition = {
    ready: Promise<void>;
    finished: Promise<void>;
};
type TransitionDocument = Document & {
    startViewTransition?: (update: () => Promise<void>) => NativeTransition;
};

const REVEAL_DURATION = 1100;
const EXIT_DURATION = 340;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let navigating = false;
let lineTimer: number | undefined;
const hologram = { phase: 'idle' as 'idle' | 'exit' | 'enter', started: 0, duration: REVEAL_DURATION, exitFrom: 1 };

function easedProgress(elapsed: number, duration: number) {
    const progress = Math.max(0, Math.min(1, elapsed / duration));
    return progress * progress * (3 - 2 * progress);
}

export function initialModelReveal(time: number, start: number) {
    return easedProgress(time - start, REVEAL_DURATION);
}

// Decide once from the viewport captured at reload, before the scene assets load.
export function reloadRevealStart(top: number, bottom: number, height: number, reloadY: number | null) {
    if (reloadY === null || bottom <= 0 || top >= height) return null;
    const offset = window.scrollY - reloadY;
    return bottom + offset > 0 && top + offset < height ? performance.now() : null;
}

export function projectModelReveal(time: number) {
    if (hologram.phase === 'idle') return 1;
    const eased = easedProgress(time - hologram.started, hologram.duration);
    if (hologram.phase === 'exit') return hologram.exitFrom * (1 - eased);
    if (eased === 1) hologram.phase = 'idle';
    return eased;
}

function startEnterReveal() {
    hologram.phase = 'enter';
    hologram.started = performance.now();
    hologram.duration = REVEAL_DURATION;
    const root = document.documentElement;
    window.clearTimeout(lineTimer);
    root.style.setProperty('--project-reveal-duration', `${REVEAL_DURATION}ms`);
    root.dataset.projectLines = 'drawing';
    lineTimer = window.setTimeout(() => {
        delete root.dataset.projectLines;
        root.style.removeProperty('--project-reveal-duration');
    }, REVEAL_DURATION);
}

export function finishReloadSetup(eligible: boolean) {
    if (navigating) return;
    if (eligible && !reduceMotion()) startEnterReveal();
    else if (document.documentElement.dataset.projectLines === 'waiting') {
        delete document.documentElement.dataset.projectLines;
    }
}

export async function projectViewTransition(navigate: () => Promise<boolean>, direction: 'open' | 'close') {
    if (navigating) return;
    const page = document as TransitionDocument;
    if (reduceMotion()) {
        await navigate();
        return;
    }
    navigating = true;
    if (!page.startViewTransition) {
        try {
            if (await navigate()) startEnterReveal();
        } finally {
            navigating = false;
        }
        return;
    }
    const root = page.documentElement;
    window.clearTimeout(lineTimer);
    root.dataset.projectTransition = direction;
    try {
        // This visible exit runs before the browser freezes the old snapshot.
        const now = performance.now();
        hologram.exitFrom = projectModelReveal(now);
        hologram.phase = 'exit';
        hologram.started = now;
        hologram.duration = EXIT_DURATION;
        root.style.setProperty('--project-reveal-duration', `${EXIT_DURATION}ms`);
        root.style.setProperty('--project-line-exit-offset', String(1 - hologram.exitFrom));
        root.dataset.projectLines = 'erasing';
        await new Promise<void>(resolve => setTimeout(resolve, EXIT_DURATION));
        const transition = page.startViewTransition(async () => {
            root.dataset.projectLines = 'waiting';
            if (!await navigate()) {
                delete root.dataset.projectLines;
                return;
            }
            // Rendering is paused here: never wait for requestAnimationFrame.
            // The incoming model stays hidden until the snapshot is ready.
        });
        const startDrawing = () => {
            if (root.dataset.projectLines === 'waiting') startEnterReveal();
        };
        transition.ready.then(startDrawing, () => {});
        await transition.finished;
        // A skipped transition can reject ready before its update commits.
        startDrawing();
    } finally {
        if (hologram.phase === 'exit') {
            hologram.phase = 'idle';
            delete root.dataset.projectLines;
            root.style.removeProperty('--project-reveal-duration');
        }
        root.style.removeProperty('--project-line-exit-offset');
        delete page.documentElement.dataset.projectTransition;
        navigating = false;
    }
}
