import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, BufferGeometry, CylinderGeometry, EdgesGeometry, Group, Matrix4, OctahedronGeometry, Quaternion, Vector3 } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { useReducedMotion } from '../useReducedMotion';
import { useIconSurfaceMaterial } from './useIconSurfaceMaterial';

function outline(surface: BufferGeometry) {
    const edges = new EdgesGeometry(surface);
    const positions = edges.getAttribute('position');
    const segments: BufferGeometry[] = [];
    const start = new Vector3(), end = new Vector3(), direction = new Vector3();
    const up = new Vector3(0, 1, 0), rotation = new Quaternion();
    for (let i = 0; i < positions.count; i += 2) {
        start.fromBufferAttribute(positions, i);
        end.fromBufferAttribute(positions, i + 1);
        direction.subVectors(end, start);
        const segment = new CylinderGeometry(.005, .005, direction.length(), 6);
        rotation.setFromUnitVectors(up, direction.normalize());
        segment.applyQuaternion(rotation);
        segment.translate((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
        segments.push(segment);
    }
    const result = mergeBufferGeometries(segments)!;
    edges.dispose();
    segments.forEach(segment => segment.dispose());
    return result;
}

export function InteractiveAccessories({ material }: { material: any }) {
    const cube = useRef<Group>(null!);
    const octahedron = useRef<Group>(null!);
    const reducedMotion = useReducedMotion();
    const surfaceMaterial = useIconSurfaceMaterial();
    const contourUniforms = useMemo(() => ({
        ...material.uniforms,
        myPosition: { value: new Vector3(10, 0, 0) },
        useGradientMatrix: { value: true },
        gradientMatrix: { value: new Matrix4() }
    }), [material]);
    const parts = useMemo(() => [new BoxGeometry(.38, .38, .38), new OctahedronGeometry(.27)].map(surface => ({ surface, edge: outline(surface) })), []);
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
