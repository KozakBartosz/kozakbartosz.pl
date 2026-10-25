// Optional pixel budget for the scene/composer only. CSS layout stays full size.
// Zero keeps the existing rendering quality; cursor and reflections are separate.
export function getSceneRenderSize(
    width: number,
    height: number,
    pixelRatio: number,
    pixelBudget: number
): [number, number] {
    if (!(pixelBudget > 0) || !Number.isFinite(pixelBudget)) return [width, height];
    const pixels = width * height * pixelRatio * pixelRatio;
    const scale = Math.min(1, Math.sqrt(pixelBudget / Math.max(1, pixels)));
    return [Math.max(1, Math.floor(width * scale)), Math.max(1, Math.floor(height * scale))];
}
