import { useFrame, useThree } from '@react-three/fiber';
import { useContext, useMemo } from 'react';
import { Vector2 } from 'three';
import { getSceneRenderSize } from './renderResolution';
import { SmoothBloom } from './SmoothBloom';


import {
    EffectComposer,
    EffectComposerContext,
    DepthOfField
} from '@react-three/postprocessing';

// Cap the scene near 1080p on large screens; 0 explicitly disables scaling.
const pixelBudget = Number(process.env.NEXT_PUBLIC_SCENE_PIXEL_BUDGET || 2073600);
const SceneResolution = () => {
    const { composer } = useContext(EffectComposerContext);
    const currentSize = useMemo(() => new Vector2(), []);
    const desired = useMemo(() => ({ width: 0, height: 0, ratio: 0, renderWidth: 0, renderHeight: 0 }), []);
    // Canvas and composer both resize the renderer. Enforce the cap after their
    // resize work and before composer.render, without changing CSS or reading DOM.
    useFrame(({ gl, size }) => {
        const ratio = gl.getPixelRatio();
        if (desired.width !== size.width || desired.height !== size.height || desired.ratio !== ratio) {
            desired.width = size.width; desired.height = size.height; desired.ratio = ratio;
            [desired.renderWidth, desired.renderHeight] = getSceneRenderSize(size.width, size.height, ratio, pixelBudget);
        }
        const { renderWidth: width, renderHeight: height } = desired;
        gl.getSize(currentSize);
        if (currentSize.x !== width || currentSize.y !== height) {
            composer.setSize(width, height, false);
        }
    }, 0.5);
    return null;
};

export const PostEffects = () => {
    const { camera } = useThree();
    // Preserve the original world-space focus plane and transition width when
    // changing clipping planes. DOF takes distances normalized to near/far.
    const focusDepth = 160.084;
    const focusRange = 79.992;
    const cameraRange = camera.far - camera.near;
    return (
        <EffectComposer disableNormalPass depthBuffer={true} autoClear={false}>
            {pixelBudget > 0 && Number.isFinite(pixelBudget) ? <SceneResolution /> : <></>}
            {/* Keep DOF subtle; bloom supplies the halo without sparse bokeh lobes. */}
            <DepthOfField
                focusDistance={(focusDepth - camera.near) / cameraRange}
                focalLength={focusRange / cameraRange}
                bokehScale={1}
                blur={5}
            />
            <SmoothBloom />
        </EffectComposer>
    );
};
