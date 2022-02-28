import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { Physics, Debug, Triplet } from '@react-three/cannon';
import { Effects, OrbitControls, useGLTF } from '@react-three/drei';
import { useMemo, useState } from 'react';
import { Plane } from './Plane';
import { Cone } from './Cone';
import { Bydlak } from './Bydlak';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { Vector2 } from 'three';
import { PostEffects } from '../PostEffects';

function createArray(size: number, shift: number) {
    return new Array(size).fill(null).map((_, index) => index + shift);
}
const rubish = createArray(21, -10);

extend({
    UnrealBloomPass
});

export const Hero = () => {
    const [gravity, setGravity] = useState<Triplet>([0, -50, 0]);
    return (
        <div
            onPointerDown={(e) => {
                setGravity([
                    (e.clientX - window.innerWidth / 2) / 3,
                    (e.clientY - window.innerHeight / 2) / -3,
                    0
                ]);
            }}
            onPointerUp={(e) => {
                setGravity([0, -50, 0]);
            }}
        >
            <Canvas
                style={{ height: '100vh' }}
                camera={{
                    fov: 40,
                    near: 0.1,
                    far: 1000,
                    position: [0, -2, 110]
                }}
            >
                <color attach="background" args={[0, 0, 0]} />

                <PostEffects />

                <OrbitControls makeDefault />
                <pointLight
                    position={[10, 5, 10]}
                    intensity={0.5}
                    color={0xaffbff}
                />
                <pointLight
                    position={[-10, 5, -10]}
                    intensity={0.5}
                    color={0xaffbff}
                />
                <pointLight
                    position={[10, 25, -10]}
                    intensity={0.5}
                    color={0xaffbff}
                />
                <pointLight
                    position={[-10, 25, 10]}
                    intensity={0.5}
                    color={0xaffbff}
                />
                <fog attach="fog" color={0x050f0d} near={80} far={450} />
                {/* <fogExp2 color={0x26443f} attach="fog" density={0.009} /> */}

                <Physics gravity={gravity}>
                    {/* <Debug color="red" scale={1.01}> */}

                    <mesh
                        position={[0, -13, -150]}
                        rotation={[0, Math.PI * 2, 0]}
                    >
                        <planeGeometry args={[1000, 1000]} />
                        <meshPhysicalMaterial color={0x050f0d} />
                    </mesh>
                    <Plane position={[0, -13, 0]} />

                    {rubish.map((el) => {
                        const offset = 21 * 8;
                        return (
                            <Cone
                                key={el}
                                position={[
                                    Math.sin(el) * 15 + el * 8,
                                    el * 8 + offset + Math.tan(el),
                                    Math.tan(el) * 15 - 100
                                ]}
                                rotation={[
                                    Math.random(),
                                    Math.random(),
                                    Math.random()
                                ]}
                            />
                        );
                    })}
                    <Bydlak />
                    {/* </Debug> */}
                </Physics>
            </Canvas>
        </div>
    );
};
