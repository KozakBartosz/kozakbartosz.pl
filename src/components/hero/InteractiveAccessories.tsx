import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, Group, Matrix4, OctahedronGeometry, Vector3 } from 'three';
import { solidOutline } from './solidOutline';
import { useReducedMotion } from '../useReducedMotion';
import { useIconSurfaceMaterial } from './useIconSurfaceMaterial';

export function InteractiveAccessories({ material }: { material: any }) {
    const cube = useRef<Group>(null!);
    const octahedron = useRef<Group>(null!);
    const reducedMotion = useReducedMotion();
    const surfaceMaterial = useIconSurfaceMaterial(false);
    const contourUniforms = useMemo(() => ({
        ...material.uniforms,
        myPosition: { value: new Vector3(10, 0, 0) },
        useGradientMatrix: { value: true },
        gradientMatrix: { value: new Matrix4() }
    }), [material]);
    const parts = useMemo(() => [new BoxGeometry(.38, .38, .38), new OctahedronGeometry(.27)].map(surface => ({ surface, edge: solidOutline(surface, .0034) })), []);
    useEffect(() => () => parts.forEach(({ surface, edge }) => { surface.dispose(); edge.dispose(); }), [parts]);
    useFrame(({ clock }) => {
        const time = reducedMotion ? 0 : clock.elapsedTime;
        cube.current.position.y = .61 + Math.sin(time * .75) * .035;
        octahedron.current.position.y = -.49 + Math.sin(time * .8 + 1.7) * .035;
        // Inherit Suzanne's scroll angle without reading layout each frame.
        const parent = cube.current.parent;
        if (parent) {
            parent.updateWorldMatrix(true, false);
            contourUniforms.gradientMatrix.value.copy(parent.matrixWorld);
        }
        const scrollAngle = reducedMotion ? 0 : (parent?.rotation.y ?? -50) + 50;
        cube.current.rotation.y = .45 + scrollAngle * .35;
        cube.current.rotation.x = .35 + scrollAngle * .15;
        octahedron.current.rotation.y = .3 - scrollAngle * .55;
        octahedron.current.rotation.z = .2 + scrollAngle * .25;
    });
    return <>
        {parts.map(({ surface, edge }, index) => <group
            key={index}
            ref={index === 0 ? cube : octahedron}
            position={index === 0 ? [-.73, .61, -.05] : [.73, -.49, .15]}
            rotation={index === 0 ? [.35, .45, -.18] : [.15, .3, .2]}
        >
            <mesh geometry={surface} material={surfaceMaterial} />
            <mesh geometry={edge}>
                <shaderMaterial {...material} uniforms={contourUniforms} />
            </mesh>
        </group>)}
    </>;
}
