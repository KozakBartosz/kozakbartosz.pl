import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

export const CameraEffects = () => {
    const { camera } = useThree();

    const move = useRef({ x: 0, y: 0, scroll: 0 });

    useEffect(() => {
        document.body.addEventListener('pointermove', (e) => {
            move.current.x = (e.clientX - window.innerWidth / 2) / 50;
            move.current.y =
                15 + ((e.clientY - window.innerHeight / 2) / 70) * -1;
            // camera.lookAt(0, 0, 0);
        });
        document.addEventListener(
            'scroll',
            () => {
                move.current.scroll = window.scrollY;
            },
            { passive: true }
        );
        camera.position.z = 25;
        move.current.scroll = window.scrollY;
    }, []);
    useFrame(() => {
        camera.position.z += (150 - camera.position.z) * 0.005;
        camera.position.x += (move.current.x - camera.position.x) * 0.05;
        camera.position.y +=
            (move.current.y - move.current.scroll / 30 - camera.position.y) *
            0.05;
        if (camera.position.y < -12) camera.position.y = -12;
        camera.lookAt(0, 0, 0);
    });
    return null;
};
