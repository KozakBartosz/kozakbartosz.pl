import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { BufferGeometry, Mesh, Vector3 } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { solidOutline } from './solidOutline';
import { useIconSurfaceMaterial } from './useIconSurfaceMaterial';

export function WoodCampModel({ material }: { material: any }) {
    const { scene } = useGLTF('/models/wood-camp.glb');
    const surface = useIconSurfaceMaterial();
    const geometry = useMemo(() => {
        const parts: BufferGeometry[] = [];
        scene.updateMatrixWorld(true);
        scene.traverse(object => {
            if (!(object instanceof Mesh)) return;
            parts.push(object.geometry.clone().applyMatrix4(object.matrixWorld));
        });
        const body = mergeBufferGeometries(parts)!;
        parts.forEach(part => part.dispose());
        // Present the roof, supports and log piles in a three-quarter view.
        body.rotateY(-.55);
        body.rotateX(.28);
        body.computeBoundingBox();
        const bounds = body.boundingBox!;
        const size = bounds.getSize(new Vector3());
        const center = bounds.getCenter(new Vector3());
        body.translate(-center.x, -center.y, -center.z);
        const scale = Math.min(1.85 / size.x, 1.6 / size.y);
        body.scale(scale, scale, scale);
        // Build contours after normalization to match the other icons' line weight.
        return { body, edge: solidOutline(body) };
    }, [scene]);
    useEffect(() => () => Object.values(geometry).forEach(part => part.dispose()), [geometry]);
    return <group>
        <mesh geometry={geometry.body} material={surface} />
        <mesh geometry={geometry.edge}><shaderMaterial {...material} /></mesh>
    </group>;
}
