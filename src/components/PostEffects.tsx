import { Canvas, extend, useThree } from '@react-three/fiber';
import { Physics, Debug, Triplet } from '@react-three/cannon';
import { useMemo, useState } from 'react';

import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import { Vector2 } from 'three';
import { Effects } from '@react-three/drei';

extend({
    UnrealBloomPass,
    BokehPass
});

const params = { focus: 110, aperture: 0.0001, maxblur: 0.18 };

export const PostEffects = () => {
    const { scene, gl, size, camera } = useThree();
    const aspect = useMemo(() => new Vector2(size.width, size.height), [size]);
    const BokehPass = 'bokehPass' as any;
    return (
        <Effects
            multisamping={8} // Default, uses WebGL2 multisamping if available
            renderIndex={1} // Default
            disableGamma={false} // Default, would switch off the gamma-correction-pass`
            disableRenderPass={false} // Default, would remove the first scene-render-pass
        >
            <BokehPass attachArray="passes" args={[scene, camera, params]} />
            {/* <unrealBloomPass attachArray="passes" args={[aspect, 0, 0, 0]} /> */}
        </Effects>
    );
};
