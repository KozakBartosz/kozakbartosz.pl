import { Physics, Debug, Triplet } from '@react-three/cannon';
import { Plane } from './Plane';
import { GrabPointerProvider } from './GrabPointer';
import { Cone } from './Cone';
import { Bydlak } from './Bydlak';
import { Icon } from './Icon';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    Vector3,
    Vector4
} from 'three';
import { fragmentShader, vertexShader } from './shaders';
import { Sphere, Torus } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

function createArray(size: number, shift: number) {
    return new Array(size)
        .fill(null)
        .map((_, index) => index + shift)
        .filter((el) => !(Math.abs(el) < 1));
}
// const rubbish = createArray(31, -15);

function extractIntegersFromHash() {
    const hash = window.location.hash;
    const regex = /\d+/g;
    const matches = hash.match(regex);
    if (matches) {
        return parseInt(matches.map((match) => parseInt(match, 10)).join(''));
    } else {
        return 0;
    }
}

const hash = extractIntegersFromHash();
// if hash includs numbers
let rubbish: number[] = [];
if (hash != undefined && hash > 0) {
    rubbish = createArray(hash, -hash / 2);
} else {
    rubbish = createArray(41, -20);
}
// const rubbish = createArray(61, -30);

export const Playground = () => {
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

    const [modeActive, setModeActive] = useState(false);
    const [gravity, setGravity] = useState<Triplet>([0, -50, 0]);

    const MySphere = useRef<{
        scale: Vector3;
        rotation: Vector3;
        visibility: boolean;
        userData: any;
    }>(null);

    useEffect(() => {
        if (MySphere.current) MySphere.current.userData.scale = 0.1;
        // Every new gravity choice supersedes intro/release impulses.
        const timers = new Set<ReturnType<typeof setTimeout>>();
        const later = (callback: () => void, delay: number) => {
            const timer = setTimeout(() => {
                timers.delete(timer);
                callback();
            }, delay);
            timers.add(timer);
        };
        const cancelSequence = () => {
            timers.forEach(clearTimeout);
            timers.clear();
        };
        later(() => {
            setGravity([0, 0, 0]);
            later(() => setGravity([0, 0, -10]), 100);
            later(() => setGravity([20, 10, -20]), 300);
            later(() => {
                if (MySphere.current) MySphere.current.userData.scale = 1;
                setGravity([-10, -20, 0]);
            }, 500);
            later(() => setGravity([-0.1, -0.2, 0]), 700);
            later(() => setGravity([0, -0.2, 0]), 900);
        }, 4000);

        const release = () => setModeActive(false);
        const grab = (e: PointerEvent) => {
            if (e.buttons === 1) setModeActive(true);
        };
        let gravityEnabled = false;
        const toggleGravity = (e: Event) => {
            e.preventDefault();
            cancelSequence();
            gravityEnabled = !gravityEnabled;
            setGravity(gravityEnabled ? [0, -100, 0] : [0, -0.2, 0]);
            if (MySphere.current) {
                MySphere.current.userData.scale = gravityEnabled ? 0.1 : 1;
            }
            if (!gravityEnabled) {
                later(() => setGravity([0, 0, -10]), 10);
                later(() => setGravity([20, 10, -20]), 30);
                later(() => setGravity([0, -0.2, 0]), 50);
            }
        };
        const orient = (e: DeviceOrientationEvent) => {
            if (e.beta !== null && e.gamma !== null && e.alpha !== null) {
                const betaRadians = e.beta * (Math.PI / 180);
                const gammaRadians = e.gamma * (Math.PI / 180);

                const forceX = Math.sin(gammaRadians);
                const forceY = Math.sin(betaRadians);
                const forceZ = Math.cos(betaRadians) * Math.cos(gammaRadians);

                const multiply = 25;
                // console.log('a', [forceX, forceY, forceZ]);

                cancelSequence();
                setGravity([
                    forceZ > 0 ? forceX * multiply : forceX * -multiply,
                    forceY * -multiply,
                    0
                    // forceZ * -multiply
                ]);
                const rotationX = MathUtils.degToRad(e.alpha);
                const rotationY = MathUtils.degToRad(e.beta);
                const rotationZ = MathUtils.degToRad(e.gamma);

                // if (MySphere.current) {
                //     MySphere.current.rotation.x = rotationY - Math.PI / 2;
                //     MySphere.current.rotation.y = rotationX;
                //     MySphere.current.rotation.z = 0;
                //     MySphere.current.visibility = false;
                // }
                if (
                    MySphere.current &&
                    MySphere.current.scale &&
                    MySphere.current.userData
                ) {
                    MySphere.current.userData.gryo = 1;
                }
            }
        };
        document.body.addEventListener('pointerdown', grab);
        window.addEventListener('pointerup', release);
        window.addEventListener('pointercancel', release);
        window.addEventListener('blur', release);
        document.body.addEventListener('mouseleave', release);
        document.body.addEventListener('contextmenu', toggleGravity);
        window.addEventListener('deviceorientation', orient);
        return () => {
            cancelSequence();
            document.body.removeEventListener('pointerdown', grab);
            window.removeEventListener('pointerup', release);
            window.removeEventListener('pointercancel', release);
            window.removeEventListener('blur', release);
            document.body.removeEventListener('mouseleave', release);
            document.body.removeEventListener('contextmenu', toggleGravity);
            window.removeEventListener('deviceorientation', orient);
        };
    }, []);

    useFrame(() => {
        if (
            MySphere.current &&
            MySphere.current.scale &&
            MySphere.current.userData.scale
        ) {
            // += (200 - camera.position.z) * (deley * 0.2);

            if (window.innerWidth > 1000 && window.innerHeight > 800) {
                MySphere.current.scale.x +=
                    (MySphere.current.userData.scale -
                        MySphere.current.scale.x) *
                    0.1;
                MySphere.current.scale.y +=
                    (MySphere.current.userData.scale -
                        MySphere.current.scale.y) *
                    0.1;
                MySphere.current.scale.z +=
                    (MySphere.current.userData.scale -
                        MySphere.current.scale.z) *
                    0.1;
            } else {
                MySphere.current.scale.x +=
                    (0.1 - MySphere.current.scale.x) * 0.1;
                MySphere.current.scale.y +=
                    (0.1 - MySphere.current.scale.y) * 0.1;
                MySphere.current.scale.z +=
                    (0.1 - MySphere.current.scale.z) * 0.1;
            }

            // MySphere.current.scale.y = 0.1;

            // MySphere.current.material.opacity +=
            //     (MySphere.current.userData.opacity -
            //         MySphere.current.material.opacity) *
            //     0.01;
        }
    });

    // useEffect(() => {
    //     setGravity(gravityOnOff ? [0, -200, 0] : [0, -0.2, 0]);
    // }, [gravityOnOff]);

    return (
        <Physics gravity={gravity}>
            <GrabPointerProvider>
            {/* <Physics gravity={gravity}>
            <GrabPointerProvider> */}
            {/* <Debug color="red" scale={1.01}> */}

            <mesh position={[0, 0, -200]} rotation={[0, 0, 0]}>
                <planeGeometry args={[1000, 1000]} />
                <meshPhysicalMaterial color={0x090f0e} />
            </mesh>

            <Plane position={[0, -13, 0]} />

            <Plane position={[0, -13, 85.5]} rotation={[0, Math.PI, 0]} />

            {rubbish.map((el, i) => (
                <Cone
                    key={i}
                    position={[
                        Math.sin(el) * 10 + (el * 8) / 2,
                        10 + Math.tan(el) * 5 + 80,
                        Math.tan(el) * 15 - 80
                    ]}
                    rotation={[Math.random(), Math.random(), Math.random()]}
                    material={material}
                    force={modeActive}
                />
            ))}
            <Cone
                key={9999}
                position={[-10, 20, 30]}
                rotation={[Math.random(), Math.random(), Math.random()]}
                material={material}
                force={modeActive}
            />
            <Bydlak material={material} scale={[20, 20, 20]} />

            <mesh
                position={[0, -13, 0]}
                rotation={[0, 0, 0]}
                ref={MySphere}
                scale={[1, 1, 1]}
            >
                <torusGeometry args={[50, 0.16, 10, 90, Math.PI]} />
                <shaderMaterial
                    attach="material"
                    {...material}
                    // uniforms={{
                    //     myPosition: {
                    //         value: new Vector3(0.0, 0.0, 0.0)
                    //     }
                    // }}
                />
            </mesh>
            </GrabPointerProvider>
        </Physics>
    );
};
