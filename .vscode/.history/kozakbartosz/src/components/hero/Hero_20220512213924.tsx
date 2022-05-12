import { Canvas } from '@react-three/fiber';
import { Physics, Debug, Triplet } from '@react-three/cannon';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import { Plane } from './Plane';
import { Cone } from './Cone';
import { Bydlak } from './Bydlak';
import { Vector3, Vector4 } from 'three';
import { PostEffects } from './PostEffects';
import { CameraEffects } from './CameraEffects';
import { Mirror } from './Mirror';
import { fragmentShader, vertexShader } from './shaders';
import styled from '@emotion/styled';

function createArray(size: number, shift: number) {
    return new Array(size)
        .fill(null)
        .map((_, index) => index + shift)
        .filter((el) => !(Math.abs(el) < 1));
}
// const rubish = createArray(31, -15);
const rubish = createArray(41, -20);

let timerGravity: any;

export const Hero = () => {
    const [modeActive, setModeActive] = useState(false);
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

    useEffect(() => {
        setTimeout(() => {
            setGravity([0, 0, 0]);
            setTimeout(() => {
                setGravity([0, 0, -10]);
            }, 100);
            setTimeout(() => {
                setGravity([20, 10, -20]);
            }, 300);
            setTimeout(() => {
                setGravity([-10, -20, 0]);
            }, 500);
            setTimeout(() => {
                setGravity([-0.1, -0.2, 0]);
            }, 700);
            setTimeout(() => {
                setGravity([0, -0.2, 0]);
            }, 5000);
        }, 4000);
        // function handleOrientation(event: any) {
        //     clearTimeout(timerGravity);
        //     timerGravity = setTimeout(() => {
        //         var x = event.alpha;
        //         var y = event.beta;
        //         var z = event.gamma;
        //         setGravity([x / -4, y / -2, 0]);
        //         console.log('deviceorientation', [x, y, z]);
        //         // 10 is half the size of the ball
        //         // It center the positioning point to the center of the ball
        //         // ball.style.top = (maxY * y) / 180 - 10 + 'px';
        //         // ball.style.left = (maxX * x) / 180 - 10 + 'px';
        //         // console.log('deviceorientation', event);
        //     }, 100);
        // }
        // window.addEventListener('deviceorientation', handleOrientation, {
        //     passive: true
        // });
        // setGravity([0, 90, 0]);

        // setInterval(() => {
        //     setGravitygunVec([0, 0, 0]);
        // }, 10);

        document.body.onpointerup = () => {
            setModeActive(false);
        };

        document.body.addEventListener('mouseleave', () => {
            setModeActive(false);
        });
    }, []);

    return (
        <Container
            id="Hero"
            onPointerDown={(e) => {
                setModeActive(true);
            }}
            // onPointerMove={(e) => {
            //     if (mode == 'gravitygun' && modeActive) {
            //         setGravitygunVec([
            //             (e.clientX - window.innerWidth / 2) / 20,
            //             (e.clientY - window.innerHeight / 2) / -20,
            //             0
            //         ]);
            //     }
            // }}
        >
            <Canvas
                style={{
                    height: '100%',
                    width: '100%',
                    position: 'fixed',
                    zIndex: 1
                }}
                camera={{
                    fov: 30,
                    near: 0.1,
                    far: 1000,
                    position: [0, 15, 150]
                }}
                gl={{
                    powerPreference: 'high-performance',
                    antialias: true,
                    autoClear: false
                }}
                // onPointerMove={(e) => {
                //     if (mode == 'gravitygun') {
                //         setGravitygunVec([
                //             (e.clientX - window.innerWidth / 2) / 20,
                //             (e.clientY - window.innerHeight / 2) / -20,
                //             0
                //         ]);
                //     }
                // }}
            >
                <PostEffects />

                <CameraEffects />

                <Mirror />

                {/* <OrbitControls makeDefault /> */}

                <pointLight
                    position={[0, 20, -120]}
                    intensity={0.6}
                    color={0x4dffe1}
                />
                <fog attach="fog" color={0x090f0e} near={50} far={350} />
                <Physics gravity={gravity}>
                    {/* <Debug color="red" scale={1.01}> */}

                    <mesh position={[0, 0, -200]} rotation={[0, 0, 0]}>
                        <planeGeometry args={[1000, 1000]} />
                        <meshPhysicalMaterial color={0x090f0e} />
                    </mesh>

                    <Plane position={[0, -13, 0]} />

                    <Plane
                        position={[0, -13, 100]}
                        rotation={[0, Math.PI, 0]}
                    />

                    {rubish.map((el) => (
                        <Cone
                            key={el}
                            position={[
                                Math.sin(el) * 10 + el * 8,
                                10 + Math.tan(el) * 5 + 80,
                                Math.tan(el) * 15 - 80
                            ]}
                            rotation={[
                                Math.random(),
                                Math.random(),
                                Math.random()
                            ]}
                            material={material}
                            force={modeActive}
                        />
                    ))}
                    <Cone
                        position={[-10, 20, 30]}
                        rotation={[Math.random(), Math.random(), Math.random()]}
                        material={material}
                        force={modeActive}
                    />
                    <Bydlak material={material} />
                    <Bydlak material={material} position={[0, -50, 0]} />
                    {/* </Debug> */}
                </Physics>
            </Canvas>
            <Top>
                <Logo>Kozak Bartosz</Logo>
                <Asing>Front-end • UX • UI • 3D</Asing>
            </Top>
            <MargeGradient />
        </Container>
    );
};

const Container = styled.div`
    position: relative;
    height: 100%;
`;

const Top = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 3;
    padding: 0;
    margin: 8vh 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    pointer-events: none;
`;

const Asing = styled.span`
    text-align: center;
    font-size: 1.8rem;
    font-weight: 300;
    color: #d5eaed;
`;
const Logo = styled.h1`
    letter-spacing: 0.3rem;
    margin-bottom: 3rem;
    text-align: center;
    font-size: 7rem;
    @media (max-width: 800px) {
        font-size: 6rem;
    }
    @media (max-width: 600px) {
        font-size: 4rem;
    }
    font-weight: 300;
    background: linear-gradient(
        90deg,
        rgba(0, 163, 255, 1),
        rgba(0, 255, 163, 1)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: //
        -4rem 0.5rem 5rem rgba(0, 163, 255, 0.5),
        3rem -0.5rem 5rem rgba(0, 255, 163, 0.5);

    pointer-events: normal;
`;

const MargeGradient = styled.div`
    pointer-events: none;
    height: 30rem;
    background: linear-gradient(0deg, rgba(9, 15, 14, 1), rgba(9, 15, 14, 0));
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
`;
