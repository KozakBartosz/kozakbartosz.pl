import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { HERO_DEPHTH } from './consts';

export const CameraEffects = () => {
    const { camera, gl } = useThree();

    const move = useRef({ x: 0, y: 15, scroll: 0 });

    useEffect(() => {
        gl.forceContextRestore();

        // Animation start postion
        // camera.position.z = 1000;
    }, []);
    useFrame((_, delta) => {
        let deley = delta * 3;
        if (window.innerWidth > window.innerHeight) {
            camera.position.z += (150 - camera.position.z) * (deley * 0.2);
        } else {
            camera.position.z += (200 - camera.position.z) * (deley * 0.2);
        }
        camera.position.x +=
            (move.current.x * 20 - camera.position.x) * deley * HERO_DEPHTH;

        // camera.position.y +=
        //     (move.current.y - window.scrollY / 30 - camera.position.y) *
        //     deley *
        //     20;
        camera.position.y = move.current.y - window.scrollY / HERO_DEPHTH;

        // if (camera.position.y < -12) camera.position.y = -12;
        camera.lookAt(0, window.scrollY / -HERO_DEPHTH, 0);
        // camera.lookAt(0, window.scrollY / HERO_DEPHTH, 0);
    });
    return null;
};
