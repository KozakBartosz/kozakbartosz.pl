// The fixed canvas extends below the hero, so DOM ancestry alone is insufficient.
export const isPlaygroundPointer = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return false;
    if (event.target.closest('a, button, input, textarea, select, nav, footer, [role="button"]')) return false;
    const hero = event.target.closest('#Hero');
    if (!hero) return false;
    const bounds = hero.getBoundingClientRect();
    return event.clientX >= bounds.left && event.clientX < bounds.right &&
        event.clientY >= bounds.top && event.clientY < bounds.bottom;
};
