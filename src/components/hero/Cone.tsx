import { Triplet, useCylinder } from '@react-three/cannon';
import { useEffect } from 'react';

interface Props {
    position?: Triplet;
    scale?: Triplet;
    rotation?: Triplet;
}

export function Cone(props: Props) {
    const a = 8;
    const [ref, api] = useCylinder(() => ({
        mass: 0.1,
        ...props,
        args: [0.01, a / 2, 0.816 * a, 3]
    }));

    useEffect(() => {
        api.velocity.set(0, 0, 40);
    }, []);

    return (
        <mesh ref={ref} {...props}>
            <cylinderGeometry args={[0, a / 2, 0.816 * a, 3]} />
            <meshPhysicalMaterial
                color={0xff0000}
                reflectivity={1}
                flatShading
            />
        </mesh>
    );
}
