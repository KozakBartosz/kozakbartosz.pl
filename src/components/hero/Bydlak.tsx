import { useCylinder } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Mesh, Vector3 } from 'three';
import { solidOutline } from './solidOutline';

export function Bydlak({ material, surface, position, scale }: any) {
    const [ref] = useCylinder(() => ({
        mass: 10,
        position: position ? position : [0, 0, 0],
        args: [0.01, 18.2, 0.816 * 31, 4],
        rotation: [0, Math.PI / 4 + Math.PI / -6, 0],
        type: 'Static'
    }));
    return (
        <group dispose={null} scale={scale ? scale : [0, 0, 0]} ref={ref}>
            <BydlakModel material={material} surface={surface} />
        </group>
    );
}

// Shared visual model; the hero adds its physics body separately.
export function BydlakModel({ material, surface }: any) {
    const { nodes } = useGLTF('/models/logo.glb');
    const body = (nodes.Cone as Mesh).geometry;
    const outline = useMemo(() => solidOutline(body, .0075), [body]);
    useEffect(() => () => outline.dispose(), [outline]);
    return <group dispose={null}>
            <mesh
                castShadow
                receiveShadow
                geometry={body}
                material={surface}
                rotation={[0, Math.PI / -4, 0]}
            />
            <mesh
                castShadow
                receiveShadow
                geometry={outline}
                rotation={[0, Math.PI / -4, 0]}
            >
                {/* <meshBasicMaterial color={0x00ffee} /> */}
                <shaderMaterial
                    attach="material"
                    {...material}
                    uniforms={{
                        myPosition: { value: new Vector3(0.0, 0.0, 0.0) }
                    }}
                />
            </mesh>
    </group>;
}
