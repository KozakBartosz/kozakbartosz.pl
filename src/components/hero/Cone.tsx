import { Triplet, useCylinder } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';

interface Props {
    position?: Triplet;
    scale?: Triplet;
    rotation?: Triplet;
    material?: any;
    force: boolean;
}

export function Cone({ force, material, ...props }: Props) {
    const a = 8;
    const [ref, api] = useCylinder(() => ({
        mass: 2,
        ...props,
        args: [0.01, a / 2, 0.816 * a, 3]
        // type: 'Static'
    }));

    const [color, setColor] = useState(0);

    const { nodes, materials } = useGLTF('/models/cone.glb');

    const localForceVec = useRef([0, 0, 0] as Triplet);
    const localForce = useRef(false);

    const loopRnage = 130;

    useEffect(() => {
        localForce.current = force;
    }, [force]);

    useEffect(() => {
        document.body.addEventListener('pointermove', (e) => {
            if (localForce) {
                localForceVec.current = [
                    (e.clientX - window.innerWidth / 2) / 18,
                    (e.clientY - window.innerHeight / 2) / -18,
                    0
                ];
            }
        });

        api.velocity.set(0, 0, 40);
        api.position.subscribe(([x, y, z]) => {
            if (x > loopRnage) api.position.set(-loopRnage + 2, y, 0);
            if (x < -loopRnage) api.position.set(loopRnage - 2, y, 0);
            if (z < -130) api.applyImpulse([0, 0, 5], [0, 0, 0]);
            if (y > 100) api.applyImpulse([0, -10, 0], [0, 0, 0]);
            if (localForce.current) {
                let v2 = new Vector3(
                        localForceVec.current[0],
                        localForceVec.current[1],
                        0
                    ),
                    v1 = new Vector3(x, y, z),
                    direction = new Vector3();
                direction.subVectors(v2, v1);
                let distance = v1.distanceTo(v2);
                if (distance < 75) {
                    if (distance > 15) {
                        api.velocity.set(
                            (direction.x * (75 - distance)) / 5,
                            (direction.y * (75 - distance)) / 5,
                            (direction.z * (75 - distance)) / 5
                        );
                    } else {
                        api.velocity.set(
                            (direction.x * distance) / 4 - 5,
                            (direction.y * distance) / 4 - 5,
                            (direction.z * distance) / 4 - 5
                        );
                    }
                }
            }
        });
    }, []);

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

                setColor(1);
            }}
            onPointerLeave={(e) => {
                setColor(0);
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
