import { Physics, Debug, Triplet } from '@react-three/cannon';
import { Plane } from './Plane';
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
const rubbish = createArray(41, -20);
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
        setTimeout(() => {
            setGravity([0, 0, 0]);
            setTimeout(() => {
                setGravity([0, 0, -10]);
            }, 100);
            setTimeout(() => {
                setGravity([20, 10, -20]);
            }, 300);
            setTimeout(() => {
                if (MySphere.current) MySphere.current.userData.scale = 1;
                setGravity([-10, -20, 0]);
            }, 500);
            setTimeout(() => {
                setGravity([-0.1, -0.2, 0]);
            }, 700);
            setTimeout(() => {
                setGravity([0, -0.2, 0]);
            }, 900);
        }, 4000);

        document.body.addEventListener('pointerup', (e) => {
            // console.log('pointerdown', e.buttons);
            setModeActive(false);
        });
        document.body.addEventListener('pointerdown', (e) => {
            // console.log('pointerdown', e.buttons);
            if (e.buttons === 1) setModeActive(true);
        });

        document.body.addEventListener('mouseleave', () => {
            setModeActive(false);
        });

        // @ts-ignore
        let myGravity = false;

        document.body.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            myGravity = !myGravity;
            if (myGravity == true) {
                setGravity([0, -100, 0]);
                if (MySphere.current) {
                    MySphere.current.userData.scale = 0.1;
                }
            } else {
                setGravity([0, -0.2, 0]);
                setTimeout(() => {
                    setGravity([0, 0, -10]);
                }, 10);
                setTimeout(() => {
                    setGravity([20, 10, -20]);
                }, 30);
                setTimeout(() => {
                    setGravity([0, -0.2, 0]);
                }, 50);
                if (MySphere.current) {
                    MySphere.current.userData.scale = 1;
                }
            }
        });
        window.addEventListener('deviceorientation', (e) => {
            if (e.beta !== null && e.gamma !== null && e.alpha !== null) {
                const betaRadians = e.beta * (Math.PI / 180); // Konwersja kąta beta na radiany
                const gammaRadians = e.gamma * (Math.PI / 180); // Konwersja kąta gamma na radiany

                // Obliczanie składowych siły grawitacji wzdłuż osi X, Y i Z
                const forceX = Math.sin(gammaRadians); // Kąt gamma odpowiada sile grawitacji wzdłuż osi X
                const forceY = Math.sin(betaRadians); // Kąt beta odpowiada sile grawitacji wzdłuż osi Y
                const forceZ = Math.cos(betaRadians) * Math.cos(gammaRadians); // Kąty beta i gamma odpowiadają sile grawitacji wzdłuż osi Z

                // Przemnożenie przez odpowiedni współczynnik, aby uzyskać siłę grawitacji w dół
                const multiply = 20;

                // Ustawienie siły grawitacji w stanie aplikacji
                setGravity([
                    forceX * multiply,
                    forceY * -multiply,
                    forceZ * multiply // Siła grawitacji wzdłuż osi Z
                ]);
                const rotationX = MathUtils.degToRad(e.alpha); // Z
                const rotationY = MathUtils.degToRad(e.beta); // X'
                const rotationZ = MathUtils.degToRad(e.gamma); // Y''
                // Obliczenie rotacji w radianach dla obiektu MySphere

                // Przypisanie obliczonych wartości rotacji w radianach do obiektu MySphere.current
                // if (MySphere.current) {
                //     MySphere.current.rotation.x = rotationY - Math.PI / 2;
                //     MySphere.current.rotation.y = rotationX;
                //     MySphere.current.rotation.z = 0;
                //     MySphere.current.visibility = false;
                // }
            }
        });
    }, []);

    useFrame(() => {
        if (
            MySphere.current &&
            MySphere.current.scale &&
            MySphere.current.userData.scale
        ) {
            // += (200 - camera.position.z) * (deley * 0.2);
            MySphere.current.scale.x +=
                (MySphere.current.userData.scale - MySphere.current.scale.x) *
                0.1;
            MySphere.current.scale.y +=
                (MySphere.current.userData.scale - MySphere.current.scale.y) *
                0.1;
            MySphere.current.scale.z +=
                (MySphere.current.userData.scale - MySphere.current.scale.z) *
                0.1;

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
            {/* <Physics gravity={gravity}> */}
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
                <torusGeometry args={[47, 0.3, 10, 70, Math.PI]} />
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
        </Physics>
    );
};
