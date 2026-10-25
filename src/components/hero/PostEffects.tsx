import { useFrame, useThree } from '@react-three/fiber';
import { useContext, useMemo } from 'react';
import { Vector2 } from 'three';
import { getSceneRenderSize } from './renderResolution';


import {
    EffectComposer,
    EffectComposerContext,
    Bloom,
    DepthOfField
} from '@react-three/postprocessing';

// Cap the scene near 1080p on large screens; 0 explicitly disables scaling.
const pixelBudget = Number(process.env.NEXT_PUBLIC_SCENE_PIXEL_BUDGET || 2073600);
// Supported by the installed BloomEffect constructor, omitted from wrapper types.
// Match the capped scene resolution instead of downsampling bloom blur again.
const bloomResolution = { resolutionScale: 1 };
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
    return (
        <EffectComposer disableNormalPass depthBuffer={true} autoClear={false}>
            {pixelBudget > 0 && Number.isFinite(pixelBudget) ? <SceneResolution /> : <></>}
            <DepthOfField
                focusDistance={0.16}
                focalLength={0.08}
                bokehScale={3}
                blur={5}
            />
            <Bloom
                {...bloomResolution}
                intensity={15}
                luminanceThreshold={0.005}
                luminanceSmoothing={10}
                kernelSize={5}
            />
        </EffectComposer>
    );
};
