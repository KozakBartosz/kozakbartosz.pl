import { useCylinder } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Vector3, Vector4 } from 'three';

export function Bydlak({ material, position, scale }: any) {
    const { nodes, materials } = useGLTF('/models/logo.glb');
    const [ref] = useCylinder(() => ({
        mass: 10,
        position: position ? position : [0, 0, 0],
        args: [0.01, 18.2, 0.816 * 31, 4],
        rotation: [0, Math.PI / 4 + Math.PI / -6, 0],
        type: 'Static'
    }));
    return (
        <group dispose={null} scale={scale ? scale : [0, 0, 0]} ref={ref}>
            <mesh
                castShadow
                receiveShadow
                geometry={(nodes.Cone as any).geometry}
                material={materials['Material.001']}
                rotation={[0, Math.PI / -4, 0]}
            />
            <mesh
                castShadow
                receiveShadow
                geometry={(nodes.Corner as any).geometry}
                rotation={[0, Math.PI / -4, 0]}
            >
                {/* <meshBasicMaterial color={0x00ffee} /> */}
                <shaderMaterial attach="material" {...material} />;
            </mesh>
        </group>
    );
}
