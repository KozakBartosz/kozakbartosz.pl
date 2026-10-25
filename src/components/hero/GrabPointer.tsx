import { createContext, MutableRefObject, ReactNode, useContext, useEffect, useRef } from 'react';
import { Triplet } from '@react-three/cannon';
import { PerspectiveCamera, Vector3 } from 'three';
import { HERO_DEPHTH } from './consts';

type GrabPointer = {
    position: MutableRefObject<Triplet>;
    touch: MutableRefObject<boolean>;
};

const GrabPointerContext = createContext<GrabPointer | null>(null);

// All bodies attract toward the same point: project once per input, not once per body.
export const GrabPointerProvider = ({ children }: { children: ReactNode }) => {
    const position = useRef<Triplet>([0, 0, 0]);
    const touch = useRef(false);
    const value = useRef({ position, touch });

    useEffect(() => {
        const camera = new PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
        const vector = new Vector3();
        const coords = new Vector3();
        const onTouch = () => { touch.current = true; };
        const onMove = (event: PointerEvent) => {
            if (touch.current) return;
            const aspect = window.innerWidth / window.innerHeight;
            if (camera.aspect !== aspect) {
                camera.aspect = aspect;
                camera.updateProjectionMatrix();
            }
            camera.position.set(0, window.scrollY / -HERO_DEPHTH, 150);
            camera.updateMatrixWorld();
            vector.set(
                (event.clientX / window.innerWidth) * 2 - 1,
                -((event.clientY - window.scrollY / HERO_DEPHTH) / window.innerHeight) * 2 + 1,
                0
            ).unproject(camera).sub(camera.position).normalize();
            coords.copy(vector).multiplyScalar(-camera.position.z / vector.z).add(camera.position);
            position.current[0] = coords.x;
            position.current[1] = Math.max(-10, coords.y);
            position.current[2] = coords.y < -10 ? coords.y * 2 + 10 : 0;
        };
        document.body.addEventListener('touchstart', onTouch, { passive: true });
        document.body.addEventListener('pointermove', onMove, { passive: true });
        return () => {
            document.body.removeEventListener('touchstart', onTouch);
            document.body.removeEventListener('pointermove', onMove);
        };
    }, []);

    return <GrabPointerContext.Provider value={value.current}>{children}</GrabPointerContext.Provider>;
};

export const useGrabPointer = () => {
    const pointer = useContext(GrabPointerContext);
    if (!pointer) throw new Error('Cone requires GrabPointerProvider');
    return pointer;
};
