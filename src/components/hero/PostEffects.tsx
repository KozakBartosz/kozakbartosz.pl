import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { Physics, Debug, Triplet } from '@react-three/cannon';
import { useMemo, useState } from 'react';

import { Vector2 } from 'three';

import {
    EffectComposer,
    Bloom,
    Vignette,
    DepthOfField,
    Noise
} from '@react-three/postprocessing';

export const PostEffects = () => {
    console.log(Screen);
    const { scene, gl, size, camera } = useThree();

    // useFrame(() => {

    //      camera.position.y += position[1] + Math.sin(time.current) * 0.4;
    //     }
    return (
        <EffectComposer>
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
            <Bloom
                intensity={10}
                luminanceThreshold={0.005}
                luminanceSmoothing={10}
            />
            <Bloom
                intensity={0.3}
                luminanceThreshold={0}
                luminanceSmoothing={2}
                width={300}
                height={300}
            />
            {/* <Bloom
                intensity={0.1}
                luminanceThreshold={0.05}
                luminanceSmoothing={1}
                width={1000}
                height={100}
            />
            <Bloom
                intensity={0.1}
                luminanceThreshold={0.05}
                luminanceSmoothing={1}
                width={200}
                height={1000}
            /> */}
            {/* <Noise opacity={0.02} /> */}
            {/* <DepthOfField
                focusDistance={0.1}
                focalLength={0.5}
                bokehScale={55}
                // height={1000}
                // blur={10}
            /> */}
        </EffectComposer>
    );
};
