import { useCylinder } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Vector3, Camera, PerspectiveCamera, Mesh } from 'three';

export function Icon({ material, element, scale }: any) {
    const { camera } = useThree();
    const { nodes, materials } = useGLTF('/models/logo.glb');

    const meshRef = useRef<Mesh>(null!);

    const projectCamera = new PerspectiveCamera(
        30,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    useFrame((state, delta) => {
        const { top, left } = element.getBoundingClientRect();

        const position = [left, top - window.scrollY / 30, 0];

        let vector = new Vector3();

        projectCamera.position.x = 0;
        projectCamera.position.y = window.scrollY / -30;
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
        meshRef.current.position.z = (linear * linear) / -1.2;

        meshRef.current.rotation.y = linear / 20;
    });
    // position = [coords.x, coords.y - camera.position.y / 2, 0];

    // position = [20, 0, 0];

    return (
        <group dispose={null} scale={[30, 30, 30]} ref={meshRef}>
            <mesh
                castShadow
                receiveShadow
                geometry={(nodes.Cone as any).geometry}
                material={materials['Material.001']}
                // rotation={[0, Math.PI / -4, 0]}
            />
            <mesh
                castShadow
                receiveShadow
                geometry={(nodes.Corner as any).geometry}
                // rotation={[0, Math.PI / -4, 0]}
            >
                {/* <meshBasicMaterial color={0x00ffee} /> */}
                <shaderMaterial attach="material" {...material} />;
            </mesh>
        </group>
    );
}
