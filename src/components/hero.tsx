import { Canvas } from '@react-three/fiber';
import { Physics, usePlane, useBox } from '@react-three/cannon';

function Plane(props: any) {
    const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }));
    return (
        <mesh ref={ref}>
            <planeGeometry args={[100, 100]} />
        </mesh>
    );
}

function Cube(props: any) {
    const [ref] = useBox(() => ({ mass: 1, position: [0, 5, 0], ...props }));
    return (
        <mesh ref={ref}>
            <boxGeometry />
        </mesh>
    );
}

export const Hero = () => {
    return (
        <Canvas style={{ height: 500 }}>
            <Physics>
                <Plane />
                <Cube />
            </Physics>
        </Canvas>
    );
};
