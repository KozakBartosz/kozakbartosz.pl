import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

export const CameraEffects = () => {
    const { camera, gl } = useThree();

    const move = useRef({ x: 0, y: 0, scroll: 0 });

    useEffect(function () {
        gl.forceContextRestore();
    }, []);

    useEffect(() => {
        // document.body.addEventListener('pointermove', (e) => {
        //     move.current.x = (e.clientX - window.innerWidth / 2) / 50;
        //     move.current.y =
        //         15 + ((e.clientY - window.innerHeight / 2) / 70) * -1;
        // });
        // document.addEventListener(
        //     'scroll',
        //     () => {
        //         move.current.scroll = window.scrollY;
        //     },
        //     { passive: true }
        // );
        // camera.position.z = 25;
        // move.current.scroll = window.scrollY;
    }, []);
    useFrame((_, delta) => {
        let deley = delta * 2;
        if (window.innerWidth > window.innerHeight) {
            camera.position.z += (150 - camera.position.z) * deley;
        } else {
            camera.position.z += (200 - camera.position.z) * deley;
        }
        camera.position.x += (move.current.x - camera.position.x) * deley * 20;
        camera.position.y +=
            (move.current.y - window.scrollY / 30 - camera.position.y) *
            deley *
            20;
        // if (camera.position.y < -12) camera.position.y = -12;
        camera.lookAt(0, window.scrollY / -30, 0);
        // camera.lookAt(0, window.scrollY / 30, 0);
    });
    return null;
};
