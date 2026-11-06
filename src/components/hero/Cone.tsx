import { Triplet, useCylinder } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { CylinderGeometry, Material, Vector3 } from 'three';
import { useGrabPointer } from './GrabPointer';
import { solidOutline } from './solidOutline';

interface Props {
    position?: Triplet;
    scale?: Triplet;
    rotation?: Triplet;
    material?: any;
    force: boolean;
    surface: Material;
}

const coneSize = 8;
const cone = new CylinderGeometry(0, coneSize / 2, coneSize * .816, 3);
const body = cone.toNonIndexed();
cone.dispose();
body.computeVertexNormals();
const outline = solidOutline(body, .053);

export function Cone({ force, material, surface, ...props }: Props) {
    const [ref, api] = useCylinder(() => ({
        mass: 2,
        ...props,
        args: [0.01, coneSize / 2, 0.816 * coneSize, 3]
        // type: 'Static'
    }));

    const materialRef = useRef(null);
    const meshRef = useRef(null);
    const { position: localForceVec, touch: phone } = useGrabPointer();

    const localForce = useRef(false);

    const loopRnage = 130;

    useEffect(() => {
        if (phone.current) return;
        localForce.current = force;
    }, [force, phone]);

    useEffect(() => {
        api.velocity.set(0, 0, 40);
        // Reuse scratch vectors for the lifetime of this body's subscription.
        const target = new Vector3();
        const position = new Vector3();
        const direction = new Vector3();
        const unsubscribe = api.position.subscribe(([x, y, z]) => {
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
            if (localForce.current && !phone.current) {
                target.set(
                    localForceVec.current[0],
                    localForceVec.current[1],
                    localForceVec.current[2] * -1
                );
                position.set(x, y, z);
                direction.subVectors(target, position);
                const distance = position.distanceTo(target);
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
        return unsubscribe;
    }, [api, localForceVec, phone]);

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

            }}
        >
            <mesh
                castShadow
                receiveShadow
                geometry={outline}
                scale={.95}
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
                material={surface}
                geometry={body}
            />
            {/* <shaderMaterial attach="material" {...material} />; */}
        </group>
    );
}
