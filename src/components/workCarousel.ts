export const WORK_PROJECT_COUNT = 4;

export type WorkCarousel = {
    position: number;
    target: number;
    dragging: boolean;
};

export const workProjectIndex = (position: number) =>
    ((Math.round(position) % WORK_PROJECT_COUNT) + WORK_PROJECT_COUNT) % WORK_PROJECT_COUNT;

// Nearest copy of each project on a looping carousel. Only the two slots
// around the current position are visible; no models pass through each other.
export const workProjectOffset = (index: number, position: number) => {
    const count = WORK_PROJECT_COUNT;
    return ((index - position + count / 2) % count + count) % count - count / 2;
};
