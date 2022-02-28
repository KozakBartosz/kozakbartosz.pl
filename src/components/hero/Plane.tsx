import { Triplet, usePlane } from '@react-three/cannon';

interface Props {
    position?: Triplet;
    scale?: Triplet;
    rotation?: Triplet;
}

export function Plane(props: Props) {
    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        ...props
    }));
    return (
        <mesh ref={ref}>
            <planeGeometry args={[1000, 1000]} />
            <meshPhysicalMaterial color={0x050f0d} />
        </mesh>
    );
}
