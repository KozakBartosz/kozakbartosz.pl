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
import { CursorLight } from './CursorLight';

// UX/UI uses a procedural browser model; other sections keep their GLTF assets.
const iconNames = ['1', '3', '3', '4'];

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
                    // The composer already multisamples the scene. Its final
                    // fullscreen pass needs no second multisampled framebuffer.
                    antialias: false,
                    autoClear: false
                }}
            >
                <PostEffects />
                <pointLight
                    position={[0, 20, -120]}
                    intensity={0.6}
                    color={0x4dffe1}
                />
                <Mirror />
                <Gradient />

                {window.location.hash.includes('orbit') ? (
                    <OrbitControls makeDefault />
                ) : (
                    <CameraEffects />
                )}

                <CursorLight />
                <fog attach="fog" color={0x090f0e} near={50} far={350} />
                <Playground />
                {iconRef.current &&
                    iconRef.current.map((el, i) => {
                        return (
                            <Icon
                                material={material}
                                browser={i === 2}
                                coffee={i === 3}
                                frontend={i === 0}
                                interactive={i === 1}
                                element={el}
                                scale={[15, 15, 15]}
                                url={`/models/icon${iconNames[i]}.glb`}
                                key={i}
                            />
                        );
                    })}
            </Canvas>
            <Top>
                <Logo id="Logo">
                    Bartosz <span>Kozak</span>
                    {/* <Link href="https://kozakbartosz.pl/">Kozak Bartosz</Link> */}
                </Logo>
                <Aside><span>Front-end</span><b>/</b><span>Interactive 3D</span><b>/</b><span>UX/UI Design</span></Aside>
            </Top>
            <Info>
                <span>LMB / Grab objects</span>
                <span>RMB / Toggle gravity</span>
            </Info>
            <InfoMobile>
                <span>Rotate your device to change gravity</span>
            </InfoMobile>
        </Container>
    );
};

const Container = styled.div`
    position: relative;
    height: 100%;
    height: 100lvh;
    min-height: 70rem;
`;

const Top = styled.div`
    position: absolute;
    /* background: rgba(255, 18, 18, 0.194); */
    top: 0;
    left: 0;
    right: 0;
    z-index: 350;
    padding: 0;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    pointer-events: none;

    margin: 5rem 0 0;
    @media (min-width: 800px) {
        margin: 15vh 0 0;
    }
    @media (max-width: 999px) {
        margin-top: calc(10rem + env(safe-area-inset-top, 0px));
        padding-inline: 2.4rem;
    }
`;

const Logo = styled.h1`
    font-size: clamp(4rem, 5.8vw, 9.8rem);
    letter-spacing: -.035em;
    margin-bottom: 1.8rem;
    padding-bottom: 0;
    text-align: center;
    font-weight: 300;
    color: #f2f5f4;
    background: none;
    -webkit-text-fill-color: currentColor;
    span {
        background: linear-gradient(90deg, #00a3ff, #00f0cf);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
`;

const Aside = styled.span`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: .8rem 0;
    line-height: 1.8;
    span { white-space: nowrap; }
    text-align: center;
    font-size: clamp(.9rem, .9vw, 1.25rem);
    letter-spacing: .4em;
    text-transform: uppercase;
    color: #d5eaed;
    b { color: #00a3ff; margin-inline: 1.8rem; font-weight: 300; }
`;

const Info = styled.div`
    display: none;
    @media (min-width: 1000px) {
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 1.2rem;
        line-height: 2rem;
        letter-spacing: .2em;
        text-transform: uppercase;
        color: #bccdcb;
        position: absolute;
        bottom: 6rem;
        left: clamp(2.4rem, 3vw, 6rem);
        right: clamp(2.4rem, 3vw, 6rem);
        z-index: 350;
        span { display: flex; align-items: center; gap: 2rem; }
        span::before {
            content: '';
            width: 4.8rem;
            height: 1px;
            background: linear-gradient(90deg, #00a3ff, #00ffa3);
        }
        span:last-child::before { order: 1; }
    }
`;
const InfoMobile = styled.div`
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6rem;
    text-align: center;
    font-size: 1.8rem;
    font-weight: 300;
    color: #d5eaed;
    position: absolute;
    bottom: 12rem;
    left: 0;
    right: 0;
    z-index: 350;
    opacity: 0.55;
    @media (min-width: 1000px) {
        display: none;
    }
`;
