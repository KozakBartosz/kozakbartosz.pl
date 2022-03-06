import { Triplet, useCylinder } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect } from 'react';

interface Props {
    position?: Triplet;
    scale?: Triplet;
    rotation?: Triplet;
    material?: any;
}

export function Cone({ material, ...props }: Props) {
    const a = 8;
    const [ref, api] = useCylinder(() => ({
        mass: 2,
        ...props,
        args: [0.01, a / 2, 0.816 * a, 3]
        // type: 'Static'
    }));

    const { nodes, materials } = useGLTF('/models/cone.glb');

    const loopRnage = 130;
    useEffect(() => {
        api.velocity.set(0, 0, 40);
        api.position.subscribe(([x, y, z]) => {
            if (x > loopRnage) api.position.set(-loopRnage + 2, y, 0);
            if (x < -loopRnage) api.position.set(loopRnage - 2, y, 0);
            if (z < -130) api.applyImpulse([0, 0, 5], [0, 0, 0]);
            if (y > 100) api.applyImpulse([0, -10, 0], [0, 0, 0]);
        });
    }, []);

    useFrame(() => {});

    return (
        <group
            dispose={null}
            scale={[0.95, 0.95, 0.95]}
            ref={ref}
            {...props}
            onPointerEnter={(e) => {
                api.applyImpulse(
                    [
                        (Math.random() - 0.5) * 30,
                        (Math.random() - 0.5) * 50,
                        (Math.random() - 0.5) * 30
                    ],
                    [0, 0, 0]
                );
                api.applyTorque([
                    (Math.random() - 0.5) * 2000,
                    (Math.random() - 0.5) * 2000,
                    (Math.random() - 0.5) * 2000
                ]);

                // console.log('loool');
            }}
        >
            <mesh
                castShadow
                receiveShadow
                geometry={(nodes.Cone as any).geometry}
                rotation={[0, Math.PI / -4, 0]}
            >
                <shaderMaterial attach="material" {...material} />
            </mesh>
            <mesh castShadow receiveShadow scale={[0.95, 0.95, 0.95]}>
                <cylinderGeometry args={[0, a / 2, 0.816 * a, 3]} />
                <meshPhysicalMaterial
                    color={0x0e1211}
                    reflectivity={1}
                    flatShading
                />
            </mesh>
            {/* <shaderMaterial attach="material" {...material} />; */}
        </group>
    );
}
