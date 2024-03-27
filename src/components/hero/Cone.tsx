import { Triplet, useCylinder } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import { HERO_DEPHTH } from './consts';

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

    const materialRef = useRef(null);
    const meshRef = useRef(null);
    const phone = useRef(false);

    const [color, setColor] = useState(0);

    const { nodes, materials } = useGLTF('/models/cone.glb');

    const localForceVec = useRef([0, 0, 0] as Triplet);
    const localForce = useRef(false);

    const loopRnage = 130;

    useEffect(() => {
        if (phone.current) return;
        localForce.current = force;
    }, [force]);

    // useFrame(() => {
    //     if (meshRef.current) {
    //         // meshRef.current.color.setHex(0xff00ff);
    //         // meshRef.current.needsUpdate = true;
    //     }
    // }, 1);
    const projectCamera = new PerspectiveCamera(
        30,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    useEffect(() => {
        document.body.addEventListener('touchstart', (e) => {
            if (!phone.current) {
                localForce.current = false;
            }
            phone.current = true;
        });
        document.body.addEventListener('pointermove', (e) => {
            if (phone.current) return;
            const top = e.clientY;
            const left = e.clientX;

            // project the mouse position to the camera
            const position = [left, top - window.scrollY / HERO_DEPHTH, 0];

            let vector = new Vector3();

            projectCamera.position.x = 0;
            projectCamera.position.y = window.scrollY / -HERO_DEPHTH;
            projectCamera.position.z = 150;
            projectCamera.updateProjectionMatrix();
            projectCamera.updateMatrixWorld();

            let x = (position[0] / window.innerWidth) * 2 - 1;
            let y = -(position[1] / window.innerHeight) * 2 + 1;

            vector.set(x, y, position[2]);

            vector.unproject(projectCamera);

            vector.sub(projectCamera.position).normalize();
            // scale the projected ray
            var distance = -projectCamera.position.z / vector.z,
                scaled = vector.multiplyScalar(distance),
                coords = projectCamera.position.clone().add(scaled);

            const newPosition = [coords.x, coords.y, 0];

            if (localForce) {
                if (newPosition[1] < -10) {
                    localForceVec.current = [
                        newPosition[0],
                        -10,
                        newPosition[1] * 2 + 10
                    ];
                } else {
                    localForceVec.current = [newPosition[0], newPosition[1], 0];
                }
            }
        });

        // document.body.addEventListener('pointermove', (e) => {
        //     if (localForce) {
        //         localForceVec.current = [
        //             (e.clientX - window.innerWidth / 2) / 18,
        //             (e.clientY - window.innerHeight / 2) / -18,
        //             0
        //         ];
        //     }
        // });

        api.velocity.set(0, 0, 40);
        api.position.subscribe(([x, y, z]) => {
            // console.log(materialRef.current);
            // if (materialRef.current && materialRef.current.uniforms) {
            //     materialRef.current.uniforms.myPosition.value = new Vector3(
            //         x,
            //         y,
            //         z
            //     );
            // }

            if (x > loopRnage) api.position.set(-loopRnage + 2, y, 0);
            if (x < -loopRnage) api.position.set(loopRnage - 2, y, 0);
            if (z < -130) api.applyImpulse([0, 0, 5], [0, 0, 0]);
            if (y > 100) api.applyImpulse([0, -10, 0], [0, 0, 0]);
            if (localForce.current) {
                let v2 = new Vector3(
                        localForceVec.current[0],
                        localForceVec.current[1],
                        localForceVec.current[2] * -1
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
                <shaderMaterial
                    attach="material"
                    {...material}
                    uniforms={{
                        myPosition: { value: new Vector3(0.0, 0.2, 0.2) }
                    }}
                />
            </mesh>
            <mesh
                castShadow
                receiveShadow
                scale={[0.95, 0.95, 0.95]}
                ref={meshRef}
            >
                <cylinderGeometry args={[0, a / 2, 0.816 * a, 3]} />
                {/* <meshPhysicalMaterial
                    // color={0x0e1211}
                    reflectivity={1}
                    flatShading
                    ref={meshRef}
                /> */}
                {color ? (
                    <shaderMaterial attach="material" {...material} />
                ) : (
                    <meshPhysicalMaterial
                        color={0x0e1211}
                        reflectivity={1}
                        flatShading
                    />
                )}
            </mesh>
            {/* <shaderMaterial attach="material" {...material} />; */}
        </group>
    );
}
