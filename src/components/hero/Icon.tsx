import { useCylinder } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Vector3, Camera, PerspectiveCamera, Mesh } from 'three';
import { HERO_DEPHTH } from './consts';

export function Icon({ material, element, url }: any) {
    const { camera } = useThree();

    const { nodes, materials } = useGLTF(url);

    // const icon = useGLTF('/models/icon1.glb');

    // const nodes2 = icon.nodes;

    const meshRef = useRef<Mesh>(null!);

    const projectCamera = new PerspectiveCamera(
        30,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    useFrame((state, delta) => {
        const { top, left } = element.getBoundingClientRect();

        const position = [left, top - window.scrollY / HERO_DEPHTH, 0];

        let vector = new Vector3();

        projectCamera.position.x = 0;
        projectCamera.position.y = window.scrollY / -HERO_DEPHTH;
        projectCamera.position.z = 150;
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
            coords = projectCamera.position.clone().add(scaled);

        const newPosition = [coords.x, coords.y, 0];

        const linear = (top - window.innerHeight / 2) / 100;

        meshRef.current.position.x = newPosition[0];
        meshRef.current.position.y = newPosition[1];
        meshRef.current.position.z = (linear * linear) / -3.2;

        meshRef.current.rotation.y = linear / HERO_DEPHTH;
    });

    console.log('nodes', nodes, url);
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
                <shaderMaterial attach="material" {...material} />;
            </mesh>
        </group>
    );
}
