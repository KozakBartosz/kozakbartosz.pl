import { useCylinder } from '@react-three/cannon';
import { Shadow, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3, Camera, PerspectiveCamera, Mesh, Material } from 'three';
import { useReducedMotion } from '../useReducedMotion';
import { HERO_DEPHTH } from './consts';
import { ShadowDrop } from './ShadowDrop';

export function Icon({ material, element, url }: any) {
    const { camera } = useThree();
    const reducedMotion = useReducedMotion();

    const { nodes, materials } = useGLTF(url) as { nodes: any; materials: any };

    const [myPosition, setMyPosition] = useState(new Vector3(10.0, 0.0, 0.0));

    // const icon = useGLTF('/models/icon1.glb');

    // const nodes2 = icon.nodes;

    const meshRef = useRef<Mesh>(null!);
    const materialRef = useRef<any>(null!);

    const projectCamera = useMemo(() => new PerspectiveCamera(
        30,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    ), []);
    const vector = useMemo(() => new Vector3(), []);
    const coords = useMemo(() => new Vector3(), []);
    const bounds = useRef({ top: 0, left: 0, dirty: true });

    useEffect(() => {
        const markDirty = () => { bounds.current.dirty = true; };
        const observer = new ResizeObserver(markDirty);
        observer.observe(document.body);
        observer.observe(element);
        window.addEventListener('scroll', markDirty, { passive: true });
        window.addEventListener('resize', markDirty);
        markDirty();
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', markDirty);
            window.removeEventListener('resize', markDirty);
        };
    }, [element]);

    useFrame((state, delta) => {
        if (bounds.current.dirty) {
            const rect = element.getBoundingClientRect();
            bounds.current.top = rect.top;
            bounds.current.left = rect.left;
            bounds.current.dirty = false;
        }
        const { top, left } = bounds.current;

        const position = [left, top - window.scrollY / HERO_DEPHTH, 0];


        projectCamera.aspect = window.innerWidth / window.innerHeight;
        projectCamera.position.x = 0;
        projectCamera.position.y = window.scrollY / -HERO_DEPHTH;
        projectCamera.position.z = 125;
        projectCamera.updateProjectionMatrix();
        projectCamera.updateMatrixWorld();

        // projectCamera.updateMatrix();

        // let x = -1.0 + (2.0 * nMouseX) / window.innerWidth;
        // let y = -1.0 + (2.0 * nMouseY) / window.innerHeight;
        let x = (position[0] / window.innerWidth) * 2 - 1;
        let y = -(position[1] / window.innerHeight) * 2 + 1;

        vector.set(x, y, position[2]);

        vector.unproject(projectCamera);

        vector.sub(projectCamera.position).normalize();
        // scale the projected ray
        var distance = -projectCamera.position.z / vector.z,
            scaled = vector.multiplyScalar(distance),
            projected = coords.copy(projectCamera.position).add(scaled);

        const newPosition = [projected.x, projected.y, 0];

        const linear = (top - window.innerHeight / 2) / 100;

        meshRef.current.position.x = newPosition[0];
        meshRef.current.position.y = newPosition[1] - 2.5;
        meshRef.current.position.z = (linear * linear) / -2.5 + 10;

        // slow animation with rotation sinsun style left 10deg left and right 10deg
        let rotationAdd = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.15) * 0.3;



        meshRef.current.rotation.y =
            (linear * 4) / HERO_DEPHTH - 50 + rotationAdd;

        // if (materialRef.current) {
        //     let valueTest: number = newPosition[0] / -3;
        //     // console.log('materialRef', valueTest);
        //     setMyPosition(new Vector3(8.0, 0.0, 0.0));
        //     materialRef.current.uniforms.myPosition.value = new Vector3(
        //         8.0,
        //         0.0,
        //         0.0
        //     );
        //     materialRef.current.needsUpdate = true;
        // }
    });

    // position = [coords.x, coords.y - camera.position.y / 2, 0];

    // position = [20, 0, 0];

    return (
        <group dispose={null} scale={[20, 20, 20]} ref={meshRef}>
            <mesh
                castShadow
                receiveShadow
                geometry={(nodes.model as any).geometry}
                material={materials['normal']}
                // rotation={[0, Math.PI / -4, 0]}
            />
            <mesh
                castShadow
                receiveShadow
                geometry={(nodes.edge as any).geometry}
                // rotation={[0, Math.PI / -4, 0]}
            >
                {/* <meshBasicMaterial color={0x00ffee} /> */}
                <shaderMaterial
                    attach="material"
                    {...material}
                    ref={materialRef}
                    uniforms={{
                        myPosition: {
                            value: new Vector3(10.0, 0.0, 0.0)
                        }
                    }}
                />
            </mesh>
            <ShadowDrop />
        </group>
    );
}
