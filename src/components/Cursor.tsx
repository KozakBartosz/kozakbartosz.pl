import { useEffect, useRef } from 'react';
import {
    Mesh, NoBlending, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial,
    Vector2, WebGLRenderer
} from 'three';
import { cursorFragmentShader, cursorVertexShader } from './cursorShader';

const INTERACTIVE = 'a[href], button:not(:disabled), [role="button"], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [data-cursor="link"]';

export const Cursor = () => {
    const inversionRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const outlineRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const inversion = inversionRef.current;
        const canvas = canvasRef.current;
        const outline = outlineRef.current;
        if (!inversion || !canvas || !outline) return;
        const canvases = [inversion, canvas, outline];
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const pointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
        let destroy: (() => void) | undefined;

        const configure = () => {
            destroy?.();
            destroy = undefined;
            if (motion.matches || !pointer.matches) return;

            const renderers: WebGLRenderer[] = [];
            try {
                canvases.forEach(surface => renderers.push(new WebGLRenderer({
                    canvas: surface, alpha: true, premultipliedAlpha: false,
                    antialias: false, depth: false, stencil: false,
                    powerPreference: 'low-power'
                })));
            } catch {
                renderers.forEach(renderer => renderer.dispose());
                return; // Keep the native cursor if WebGL is unavailable.
            }
            const scene = new Scene();
            const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
            const uniforms = {
                uResolution: { value: new Vector2() },
                uCenter: { value: new Vector2() },
                uHalfSize: { value: new Vector2(22, 22) },
                uAngle: { value: 0 }, uStretch: { value: 0 },
                uMorph: { value: 0 }, uOpacity: { value: 0 },
                uPress: { value: 0 }, uOutline: { value: 0 }, uInvert: { value: 0 }
            };
            const geometry = new PlaneGeometry(2, 2);
            const material = new ShaderMaterial({
                uniforms, vertexShader: cursorVertexShader,
                fragmentShader: cursorFragmentShader,
                transparent: true, blending: NoBlending, depthTest: false, depthWrite: false
            });
            scene.add(new Mesh(geometry, material));
            const point = new Vector2();
            const center = uniforms.uCenter.value;
            const size = uniforms.uHalfSize.value;
            const target = new Vector2();
            const targetSize = new Vector2();
            const origin = new Vector2();
            let hovered: Element | null = null;
            let visible = false;
            let pressed = false;
            let initialized = false;
            let contextAvailable = true;
            let radius = 22;
            let frame = 0;
            let previousTime = 0;
            let width = window.innerWidth;
            let height = window.innerHeight;

            let inversionDrawn = false;

            const render = (time: number) => {
                frame = 0;
                const dt = Math.min((time - previousTime) / 1000 || 1 / 60, 0.05);
                previousTime = time;
                const ease = 1 - Math.exp(-20 * dt);
                const rect = hovered?.isConnected ? hovered.getBoundingClientRect() : null;
                const morph = rect ? 1 : 0;
                target.copy(point).sub(origin);
                targetSize.set(radius, radius);
                if (rect) {
                    target.set(rect.left + rect.width / 2 - origin.x, rect.top + rect.height / 2 - origin.y);
                    targetSize.set(rect.width / 2, rect.height / 2);
                }
                const dx = target.x - center.x;
                const dy = target.y - center.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                // A capsule is invariant under PI: keep the angle bounded and
                // approach the link's horizontal axis without accumulated turns.
                const desiredAngle = rect ? 0 : distance > 0.5
                    ? Math.atan2(dy, dx) : uniforms.uAngle.value;
                const difference = desiredAngle - uniforms.uAngle.value;
                const angularDistance = Math.atan2(Math.sin(2 * difference), Math.cos(2 * difference)) / 2;
                const angle = uniforms.uAngle.value + angularDistance * ease;
                uniforms.uAngle.value = Math.atan2(Math.sin(2 * angle), Math.cos(2 * angle)) / 2;
                center.lerp(target, ease);
                size.lerp(targetSize, ease);
                const stretch = rect ? 0 : Math.min(distance / 65, 1);
                uniforms.uStretch.value += (stretch - uniforms.uStretch.value) * ease;
                uniforms.uMorph.value += (morph - uniforms.uMorph.value) * ease;
                uniforms.uOpacity.value += ((visible ? 1 : 0) - uniforms.uOpacity.value) * ease;
                uniforms.uPress.value += ((pressed ? 1 : 0) - uniforms.uPress.value) * ease;
                // Rasterize only the cursor region, even on large desktop displays.
                const reachX = Math.max(size.x, size.y) * 1.8 + 90;
                const reachY = Math.max(size.x, size.y) * 1.8 + 90;
                const left = Math.max(0, center.x - reachX);
                const bottom = Math.max(0, height - center.y - reachY);
                renderers.forEach((renderer, layer) => {
                    // Inversion is transparent outside a press. Clear its last frame
                    // once on release, then leave the inactive layer untouched.
                    if (layer === 0 && uniforms.uPress.value < 0.001) {
                        if (inversionDrawn) {
                            renderer.setScissorTest(false);
                            renderer.clear();
                            inversionDrawn = false;
                        }
                        return;
                    }
                    if (layer === 0) inversionDrawn = true;
                    renderer.setScissorTest(false);
                    renderer.clear();
                    renderer.setScissor(left, bottom,
                        Math.max(0, Math.min(width, center.x + reachX) - left),
                        Math.max(0, Math.min(height, height - center.y + reachY) - bottom));
                    renderer.setScissorTest(true);
                    uniforms.uOutline.value = layer === 2 ? 1 : 0;
                    uniforms.uInvert.value = layer === 0 ? 1 : 0;
                    material.uniformsNeedUpdate = true;
                    renderer.render(scene, camera);
                });
                const unsettled = Math.abs(angularDistance) > 0.001 || distance > 0.05 || size.distanceTo(targetSize) > 0.05 ||
                    Math.abs(uniforms.uStretch.value - stretch) > 0.001 ||
                    Math.abs(uniforms.uMorph.value - morph) > 0.001 ||
                    Math.abs(uniforms.uOpacity.value - (visible ? 1 : 0)) > 0.001 ||
                    Math.abs(uniforms.uPress.value - (pressed ? 1 : 0)) > 0.001;
                if (unsettled) frame = requestAnimationFrame(render);
            };
            const wake = () => {
                if (!frame && !document.hidden && contextAvailable) {
                    previousTime = performance.now();
                    frame = requestAnimationFrame(render);
                }
            };
            const move = (event: PointerEvent) => {
                if (event.pointerType === 'touch' || !contextAvailable) { hide(); return; }
                radius = event.target instanceof Element && event.target.closest('#Hero') ? 28 : 22;
                point.set(event.clientX, event.clientY);
                hovered = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
                if (!initialized) { center.copy(point).sub(origin); initialized = true; }
                if (!visible) document.documentElement.dataset.shaderCursor = 'active';
                visible = true;
                wake();
            };
            const hide = () => {
                visible = false;
                pressed = false;
                hovered = null;
                delete document.documentElement.dataset.shaderCursor;
                wake();
            };
            const down = (event: PointerEvent) => {
                if (event.pointerType === 'touch') { hide(); return; }
                pressed = true; wake();
            };
            const up = () => { pressed = false; wake(); };
            const leave = (event: PointerEvent) => { if (!event.relatedTarget) hide(); };
            const scroll = () => {
                const element = document.elementFromPoint(point.x, point.y);
                hovered = element?.closest(INTERACTIVE) || null;
                radius = element?.closest('#Hero') ? 28 : 22;
                wake();
            };
            const resize = () => {
                const bounds = canvas.getBoundingClientRect();
                width = bounds.width; height = bounds.height;
                origin.set(bounds.left, bounds.top);
                const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
                renderers.forEach(renderer => {
                    renderer.setPixelRatio(ratio);
                    renderer.setSize(width, height, false);
                });
                uniforms.uResolution.value.set(width, height);
                wake();
            };
            const visibility = () => {
                if (document.hidden) {
                    hide(); cancelAnimationFrame(frame); frame = 0;
                    uniforms.uOpacity.value = 0;
                    renderers.forEach(renderer => { renderer.setScissorTest(false); renderer.clear(); });
                }
            };
            const contextLost = (event: Event) => {
                event.preventDefault(); contextAvailable = false;
                hide(); cancelAnimationFrame(frame); frame = 0;
                uniforms.uOpacity.value = 0;
                canvases.forEach(surface => { surface.style.visibility = 'hidden'; });
            };
            const contextRestored = () => {
                contextAvailable = renderers.every(renderer => !renderer.getContext().isContextLost());
                if (!contextAvailable) return;
                canvases.forEach(surface => { surface.style.visibility = ''; });
                resize();
            };
            window.addEventListener('pointermove', move, { passive: true });
            window.addEventListener('pointerdown', down, { passive: true });
            window.addEventListener('pointerup', up, { passive: true });
            window.addEventListener('pointercancel', hide);
            document.addEventListener('pointerout', leave);
            window.addEventListener('blur', hide);
            window.addEventListener('scroll', scroll, { passive: true, capture: true });
            window.addEventListener('resize', resize);
            document.addEventListener('visibilitychange', visibility);
            canvases.forEach(surface => {
                surface.addEventListener('webglcontextlost', contextLost);
                surface.addEventListener('webglcontextrestored', contextRestored);
            });
            const sizeObserver = new ResizeObserver(resize);
            sizeObserver.observe(canvas);
            resize();
            destroy = () => {
                sizeObserver.disconnect();
                cancelAnimationFrame(frame);
                delete document.documentElement.dataset.shaderCursor;
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerdown', down);
                window.removeEventListener('pointerup', up);
                window.removeEventListener('pointercancel', hide);
                document.removeEventListener('pointerout', leave);
                window.removeEventListener('blur', hide);
                window.removeEventListener('scroll', scroll, true);
                window.removeEventListener('resize', resize);
                document.removeEventListener('visibilitychange', visibility);
                canvases.forEach(surface => {
                    surface.removeEventListener('webglcontextlost', contextLost);
                    surface.removeEventListener('webglcontextrestored', contextRestored);
                    surface.style.visibility = '';
                });
                geometry.dispose(); material.dispose();
                renderers.forEach(renderer => {
                    renderer.setScissorTest(false); renderer.clear(); renderer.dispose();
                });
            };
        };
        configure();
        motion.addEventListener('change', configure);
        pointer.addEventListener('change', configure);
        return () => {
            motion.removeEventListener('change', configure);
            pointer.removeEventListener('change', configure);
            destroy?.();
        };
    }, []);

    return <>
        <canvas ref={inversionRef} className="shader-cursor shader-cursor-inversion" aria-hidden="true" />
        <canvas ref={canvasRef} className="shader-cursor" aria-hidden="true" />
        <canvas ref={outlineRef} className="shader-cursor shader-cursor-outline" aria-hidden="true" />
    </>;
};
