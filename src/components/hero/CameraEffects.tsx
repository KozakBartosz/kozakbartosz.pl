import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../useReducedMotion';
import { HERO_DEPHTH, getHeroScrollOffset } from './consts';
import { cameraApproach } from './cameraMotion';

export const CameraEffects = () => {
    const { camera } = useThree();
    const reducedMotion = useReducedMotion();

    const move = useRef({ x: 0, y: 15, scroll: 0 });

    useEffect(() => {
        // Animation start postion
        camera.position.z = 80;
    }, [camera]);
    useFrame((_, delta) => {
        const scrollOffset = getHeroScrollOffset(window.scrollY, window.innerHeight);
        if (reducedMotion) camera.position.z = 155;
        else camera.position.z += (155 - camera.position.z) * cameraApproach(delta, 1.2);
        camera.position.x += (move.current.x * 20 - camera.position.x) * cameraApproach(delta, 3 * HERO_DEPHTH);

        // camera.position.y +=
        //     (move.current.y - window.scrollY / 30 - camera.position.y) *
        //     delay *
        //     5;

        camera.position.y = move.current.y - scrollOffset;

        // if (camera.position.y < -12) camera.position.y = -12;
        camera.lookAt(0, -scrollOffset, 0);
    });
    return null;
};
