// Exponential damping stays bounded after a suspended tab, a resize or a slow frame.
export function cameraApproach(delta: number, rate: number) {
    const step = Number.isFinite(delta) ? Math.max(0, Math.min(delta, .05)) : 0;
    return 1 - Math.exp(-rate * step);
}
