import { Canvas } from '@react-three/fiber';
import { Physics, Debug, Triplet } from '@react-three/cannon';
import { OrbitControls } from '@react-three/drei';
import { MutableRefObject, useEffect, useMemo, useState } from 'react';
import { Plane } from './Plane';
import { Cone } from './Cone';
import { Bydlak } from './Bydlak';
import { Matrix4, Vector3, Vector4 } from 'three';
import { PostEffects } from './PostEffects';
import { CameraEffects } from './CameraEffects';
import { Mirror } from './Mirror';
import { fragmentShader, vertexShader } from './shaders';
import styled from '@emotion/styled';
import { Icon } from './Icon';
import { Gradient } from './Gradinet';
import { Playground } from './Playground';
import Link from 'next/link';

const iconNames = ['1', '3', '4'];

export const Hero = ({
    iconRef
}: {
    iconRef: MutableRefObject<HTMLDivElement[]>;
}) => {
    const [gravity, setGravity] = useState(false);

    const material = useMemo(
        () => ({
            uniforms: {
                Ka: { value: new Vector3(1, 1, 1) },
                Kd: { value: new Vector3(1, 1, 1) },
                Ks: { value: new Vector3(1, 1, 1) },
                LightIntensity: { value: new Vector4(0.5, 0.5, 0.5, 1.0) },
                LightPosition: { value: new Vector4(0.0, 2000.0, 0.0, 1.0) },
                Shininess: { value: 200.0 },
                myColor: { value: new Vector3(1, 0, 0) },
                myPosition: { value: new Vector3(0.0, 0.0, 0.0) }
            },
            fragmentShader,
            vertexShader
        }),
        []
    );

    console.log('AAAAAA');

    return (
        <Container id="Hero">
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
            >
                <PostEffects key={Math.random()} />
                <pointLight
                    position={[0, 20, -120]}
                    intensity={0.6}
                    color={0x4dffe1}
                />
                <Mirror />
                <Gradient />

                <CameraEffects />
                {/* <OrbitControls makeDefault /> */}

                <fog attach="fog" color={0x090f0e} near={50} far={350} />
                <Playground />
                {iconRef.current &&
                    iconRef.current.map((el, i) => {
                        return (
                            <Icon
                                material={material}
                                element={el}
                                scale={[15, 15, 15]}
                                url={`/models/icon${iconNames[i]}.glb`}
                                key={i}
                            />
                        );
                    })}
            </Canvas>
            <Top>
                <Logo>
                    <Link href="/">Kozak Bartosz</Link>
                </Logo>
                <Aside>Front-end • UI • UX • 3D</Aside>
            </Top>
            <Info>
                <span>Left click - use gravity gun</span>
                <span>Right click - toggle gravity</span>
            </Info>
            <MargeGradientTop />
            <MargeGradientBottom />
        </Container>
    );
};

const Container = styled.div`
    position: relative;
    height: 100%;
`;

const Top = styled.div`
    position: absolute;
    /* background: rgba(255, 18, 18, 0.194); */
    top: 0;
    left: 0;
    right: 0;
    z-index: 3;
    padding: 0;
    margin: 15vh 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    pointer-events: none;
`;

const Logo = styled.h1`
    letter-spacing: 0.3rem;
    margin-bottom: 2rem;
    padding-bottom: 0;
    text-align: center;
    font-size: 8rem;
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

const Aside = styled.span`
    text-align: center;
    font-size: 2rem;
    font-weight: 300;
    color: #d5eaed;
`;

const Info = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6rem;
    text-align: center;
    font-size: 1.8rem;
    font-weight: 300;
    color: #d5eaed;
    position: absolute;
    bottom: 10%;
    left: 0;
    right: 0;
    z-index: 3;
    opacity: 0.45;
`;

const MargeGradientBottom = styled.div`
    pointer-events: none;
    height: 20lvh;
    background: linear-gradient(
        0deg,
        rgba(9, 15, 14, 0),
        rgb(1 1 1),
        rgb(9 15 14),
        rgba(9, 15, 14, 0)
    );
    /* background: linear-gradient(
        0deg,
        rgba(9, 15, 14, 0),
        rgba(9, 15, 14, 1),
        rgba(9, 15, 14, 1),
        rgba(9, 15, 14, 0)
    ); */
    /* border: 4px solid red; */
    position: fixed;
    bottom: -10lvh;
    left: 0;
    right: 0;
    z-index: 100;
`;
const MargeGradientTop = styled.div`
    pointer-events: none;
    height: 20lvh;
    background: linear-gradient(
        0deg,
        rgba(9, 15, 14, 0),
        rgba(9, 15, 14, 1),
        rgba(9, 15, 14, 1),
        rgba(9, 15, 14, 0)
    );
    /* background: linear-gradient(
        0deg,
        rgba(9, 15, 14, 0),
        rgba(9, 15, 14, 1),
        rgba(9, 15, 14, 1),
        rgba(9, 15, 14, 0)
    ); */
    /* border: 4px solid red; */
    position: fixed;
    top: -10lvh;
    left: 0;
    right: 0;
    z-index: 100;
`;
