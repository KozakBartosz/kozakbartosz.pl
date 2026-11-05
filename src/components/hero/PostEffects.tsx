import { useFrame, useThree } from '@react-three/fiber';
import { RefObject, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { Vector2, WebGLRenderer, WebGLRenderTarget } from 'three';
import { getSceneRenderSize } from './renderResolution';
import { SmoothBloom } from './SmoothBloom';
import { FOCUS_DEPTH, FOCUS_RANGE } from './depthOfField';


import {
    EffectComposer,
    EffectComposerContext,
    DepthOfField
} from '@react-three/postprocessing';

// Cap the scene near 1080p on large screens; 0 explicitly disables scaling.
const pixelBudget = Number(process.env.NEXT_PUBLIC_SCENE_PIXEL_BUDGET || 2073600);
// Keep the existing screenshot resolution budget in Work.
const workBudget = process.env.NEXT_PUBLIC_SCENE_PIXEL_BUDGET ? pixelBudget : 4147200;
const SceneResolution = ({ workVisible }: { workVisible: { current: boolean } }) => {
    const { composer } = useContext(EffectComposerContext);
    const currentSize = useMemo(() => new Vector2(), []);
    const desired = useMemo(() => ({ width: 0, height: 0, ratio: 0, budget: -1, renderWidth: 0, renderHeight: 0 }), []);
    // Canvas and composer both resize the renderer. Enforce the cap after their
    // resize work and before composer.render, without changing CSS or reading DOM.
    useFrame(({ gl, size }) => {
        const budget = workVisible.current ? workBudget : pixelBudget;
        const ratio = gl.getPixelRatio();
        if (desired.width !== size.width || desired.height !== size.height || desired.ratio !== ratio || desired.budget !== budget) {
            desired.budget = budget;
            desired.width = size.width; desired.height = size.height; desired.ratio = ratio;
            [desired.renderWidth, desired.renderHeight] = getSceneRenderSize(size.width, size.height, ratio, budget);
        }
        const { renderWidth: width, renderHeight: height } = desired;
        gl.getSize(currentSize);
        if (currentSize.x !== width || currentSize.y !== height) {
            composer.setSize(width, height, false);
        }
    }, 0.5);
    return null;
};

type DepthEffect = {
    blendMode: { opacity: { value: number } };
    update: (renderer: WebGLRenderer, buffer: WebGLRenderTarget, delta: number) => void;
    dispose: () => void;
};

function SceneDepthOfField({ workVisible }: { workVisible: { current: boolean } }) {
    const camera = useThree(state => state.camera);
    const effect = useRef<DepthEffect | null>(null);
    const configure = useCallback((depth: DepthEffect | null) => {
        effect.current?.dispose();
        effect.current = depth;
        if (!depth) return;
        const update = depth.update.bind(depth);
        depth.update = (renderer, buffer, delta) => {
            // A zero bokeh scale still renders all ten DOF passes.
            depth.blendMode.opacity.value = workVisible.current ? 0 : 1;
            if (!workVisible.current) update(renderer, buffer, delta);
        };
    }, [workVisible]);
    const cameraRange = camera.far - camera.near;
    return <DepthOfField ref={configure}
        focusDistance={(FOCUS_DEPTH - camera.near) / cameraRange}
        focalLength={FOCUS_RANGE / cameraRange} />;
}

export const PostEffects = ({ workPreviewRef }: { workPreviewRef: RefObject<HTMLDivElement> }) => {
    const workVisible = useRef(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => { workVisible.current = entry.isIntersecting; }, { threshold: .15 });
        if (workPreviewRef.current) observer.observe(workPreviewRef.current);
        return () => observer.disconnect();
    }, [workPreviewRef]);
    const children = useMemo(() => {
        const effects = [<SceneDepthOfField key="depth" workVisible={workVisible} />, <SmoothBloom key="bloom" />];
        if (pixelBudget > 0 && Number.isFinite(pixelBudget)) effects.unshift(<SceneResolution key="resolution" workVisible={workVisible} />);
        return effects;
    }, []);
    return <EffectComposer disableNormalPass depthBuffer autoClear={false}>{children}</EffectComposer>;
};
