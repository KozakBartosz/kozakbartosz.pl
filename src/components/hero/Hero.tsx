import { Canvas } from '@react-three/fiber';
import { Physics, Debug, Triplet } from '@react-three/cannon';
import { OrbitControls } from '@react-three/drei';
import { useMemo, useState } from 'react';
import { Plane } from './Plane';
import { Cone } from './Cone';
import { Bydlak } from './Bydlak';
import { Vector3, Vector4 } from 'three';
import { PostEffects } from './PostEffects';
import { CameraEffects } from './CameraEffects';
import { Mirror } from './Mirror';
import { fragmentShader, vertexShader } from './shaders';

function createArray(size: number, shift: number) {
    return new Array(size)
        .fill(null)
        .map((_, index) => index + shift)
        .filter((el) => !(Math.abs(el) < 2));
}
// const rubish = createArray(21, -10);
const rubish = createArray(51, -25);

let timerGravity: any;

export const Hero = () => {
    const [gravity, setGravity] = useState<Triplet>([0, -50, 0]);

    const material = useMemo(
        () => ({
            uniforms: {
                Ka: { value: new Vector3(1, 1, 1) },
                Kd: { value: new Vector3(1, 1, 1) },
                Ks: { value: new Vector3(1, 1, 1) },
                LightIntensity: { value: new Vector4(0.5, 0.5, 0.5, 1.0) },
                LightPosition: { value: new Vector4(0.0, 2000.0, 0.0, 1.0) },
                Shininess: { value: 200.0 }
            },
            fragmentShader,
            vertexShader
        }),
        []
    );

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
                setGravity([0, 0, 0]);
                clearTimeout(timerGravity);
                timerGravity = setTimeout(() => {
                    setGravity([0, -50, 0]);
                }, 3000);
            }}
        >
            <Canvas
                style={{ height: '100vh' }}
                camera={{
                    fov: 30,
                    near: 0.1,
                    far: 1000,
                    position: [0, 15, 150]
                }}
                gl={{
                    powerPreference: 'high-performance',
                    antialias: true
                }}
                onPointerMove={(e) => {
                    e.clientX - window.innerWidth / 2;
                }}
            >
                {/* <color attach="background" args={}/> */}

                <PostEffects />
                <CameraEffects />

                {/* <OrbitControls makeDefault /> */}

                <pointLight
                    position={[0, 10, -120]}
                    intensity={0.8}
                    color={0xaffbff}
                />
                <fog attach="fog" color={0x050f0d} near={50} far={350} />
                <Physics gravity={gravity}>
                    {/* <Debug color="red" scale={1.01}> */}

                    <mesh position={[0, 0, -150]} rotation={[0, 0, 0]}>
                        <planeGeometry args={[1000, 1000]} />
                        <meshPhysicalMaterial color={0x050f0d} />
                    </mesh>

                    <Plane position={[0, -13, 0]} />

                    <Mirror />

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
                                material={material}
                            />
                        );
                    })}
                    <Bydlak material={material} />
                    {/* </Debug> */}
                </Physics>
            </Canvas>
        </div>
    );
};
