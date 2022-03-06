import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export const CameraEffects = () => {
    const { camera } = useThree();
    useEffect(() => {
        document.body.addEventListener('pointermove', (e) => {
            camera.position.x = (e.clientX - window.innerWidth / 2) / 50;
            camera.position.y = (e.clientY - window.innerHeight / 2) / 70;
        });
    }, []);
    return null;
};
