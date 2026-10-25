// export const HERO_DEPHTH = 22;
export const HERO_DEPHTH = 32;
// export const HERO_DEPHTH = 40;

// Preserve the scene travel at the reference 1440px viewport height.
// A viewport of scrolling must cover the same world distance on every screen.
export const getHeroScrollOffset = (scrollY: number, viewportHeight: number) =>
    (scrollY / Math.max(1, viewportHeight)) * (1440 / HERO_DEPHTH);
