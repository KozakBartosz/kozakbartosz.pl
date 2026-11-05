import { useFrame } from '@react-three/fiber';
import { HERO_DEPHTH, getHeroScrollOffset } from './consts';
import { cameraApproach } from './cameraMotion';

export const CameraEffects = () => {
    useFrame(({ camera }, delta) => {
        const scrollOffset = getHeroScrollOffset(window.scrollY, window.innerHeight);
        camera.position.x *= 1 - cameraApproach(delta, 3 * HERO_DEPHTH);
        camera.position.y = 15 - scrollOffset;
        camera.lookAt(0, -scrollOffset, 0);
    });
    return null;
};
