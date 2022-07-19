import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { Physics, Debug, Triplet } from '@react-three/cannon';
import { useEffect, useMemo, useState } from 'react';

import THREE, { TextureLoader, Vector2 } from 'three';

import {
    EffectComposer,
    Bloom,
    Vignette,
    DepthOfField,
    Noise
} from '@react-three/postprocessing';

export const PostEffects = () => {
    // useFrame(() => {

    //      camera.position.y += position[1] + Math.sin(time.current) * 0.4;
    //     }

    return (
        <EffectComposer depthBuffer={true} autoClear={false}>
            <DepthOfField
                focusDistance={0.1555}
                focalLength={0.05}
                bokehScale={5}
                // height={100}
                blur={100}
            />
            <Vignette eskil={false} offset={0.2} darkness={1.1} />
            <Bloom
                intensity={10}
                luminanceThreshold={0.005}
                luminanceSmoothing={10}
            />
            <Bloom
                intensity={0.4}
                luminanceThreshold={0}
                luminanceSmoothing={2}
                width={300}
                height={300}
            />
            <Noise opacity={0.02} />
        </EffectComposer>
    );
};
