import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { Physics, Debug, Triplet } from '@react-three/cannon';
import {
    Effects,
    OrbitControls,
    Reflector,
    useCamera,
    useGLTF
} from '@react-three/drei';
import { useMemo, useState } from 'react';
import { Plane } from './Plane';
import { Cone } from './Cone';
import { Bydlak } from './Bydlak';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { Vector2, Vector3, Vector4 } from 'three';
import { PostEffects } from './PostEffects';
import { CameraEffects } from './CameraEffects';

function createArray(size: number, shift: number) {
    return new Array(size)
        .fill(null)
        .map((_, index) => index + shift)
        .filter((el) => !(Math.abs(el) < 2));
}
// const rubish = createArray(21, -10);
const rubish = createArray(51, -25);

const fragmentShader = `
  varying vec3 Normal;
  varying vec3 Position;
  uniform vec3 Ka;
  uniform vec3 Kd;
  uniform vec3 Ks;
  uniform vec4 LightPosition;
  uniform vec3 LightIntensity;
  uniform float Shininess;

  vec3 phong() {
    vec3 n = normalize(Normal);
    vec3 s = normalize(vec3(LightPosition) - Position);
    vec3 v = normalize(vec3(-Position));
    vec3 r = reflect(-s, n);

    vec3 ambient = Ka;
    vec3 diffuse = Kd * max(dot(s, n), 0.0);
    vec3 specular = Ks * pow(max(dot(r, v), 0.0), Shininess);

    return LightIntensity * (ambient + diffuse + specular);
  }

  
  void main() {
    float ramp = (Position.x + 13.0) / 25.0;

    vec3 left = vec3(0.0, 1.0, 0.6392);
    vec3 right = vec3(0.0, 0.6392, 1.0);
    gl_FragColor = vec4(mix(left, right, clamp(ramp, 0.0, 1.0) ), 1.0);

    // gl_FragColor = vec4(ramp, ramp, ramp, 1.0);
    

}`;

const vertexShader = `
  varying vec3 Normal;
  varying vec3 Position;
  
  void main() {
    Normal = normalize(normalMatrix * normal);
    Position = vec3(modelViewMatrix * vec4(position, 1.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

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

                <OrbitControls makeDefault />
                <pointLight
                    position={[0, 10, -0]}
                    intensity={0.8}
                    color={0xaffbff}
                />
                <fog attach="fog" color={0x050f0d} near={50} far={350} />
                {/* <fogExp2 color={0x26443f} attach="fog" density={0.009} /> */}
                <Physics gravity={gravity}>
                    {/* <Debug color="red" scale={1.01}> */}

                    <mesh position={[0, 0, -150]} rotation={[0, 0, 0]}>
                        <planeGeometry args={[1000, 1000]} />
                        <meshPhysicalMaterial color={0x050f0d} />
                    </mesh>

                    {/* <Plane
                        position={[-250, 0, 0]}
                        rotation={[0, Math.PI / 2, 0]}
                    />
                    <Plane
                        position={[250, 0, 0]}
                        rotation={[0, -Math.PI / 2, 0]}
                    />*/}

                    <Plane position={[0, -13, 0]} />

                    <Reflector
                        blur={[512, 512]} // Blur ground reflections (width, heigt), 0 skips blur
                        mixBlur={10} // How much blur mixes with surface roughness
                        mixStrength={0.1} // Strength of the reflections
                        resolution={2048} // Off-buffer resolution, lower=faster, higher=better quality
                        args={[1024, 1024]} // PlaneBufferGeometry arguments
                        rotation={[-Math.PI / 2, 0, 0]}
                        mirror={1} // Mirror environment, 0 = texture colors, 1 = pick up env colors
                        minDepthThreshold={0.1}
                        maxDepthThreshold={3}
                        depthScale={3}
                        position={[0, -13, -512 + 100]}
                    >
                        {(Material, props) => (
                            <Material
                                // color={0x050f0d}
                                metalness={1}
                                roughness={1}
                                {...props}
                            />
                        )}
                    </Reflector>

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
