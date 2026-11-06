import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { BufferGeometry, Color, Matrix4, Mesh, Vector3 } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { Edge, edgeSegments, strokeEdges } from './solidOutline';

const woodColor = new Color(0x090f0e).convertSRGBToLinear();

// The roof slats have long, nearly coincident upper and lower edges in the
// asset's Z direction. Keep the upper seam when two runs share the same span.
function campEdges(body: BufferGeometry) {
    const edges = edgeSegments(body, 36).filter(([a, b]) => a.distanceToSquared(b) > .028 ** 2);
    const slats: Edge[] = [];
    const structure = edges.filter(([a, b]) => {
        const run = Math.abs(a.z - b.z);
        if (run < 2 || run > 2.2 || Math.min(a.y, b.y) < .36 || Math.min(a.x, b.x) < -.12) return true;
        slats.push(a.z < b.z ? [a, b] : [b, a]);
        return false;
    });
    slats.sort(([a, b], [c, d]) => c.y + d.y - a.y - b.y);
    const seams: Edge[] = [];
    slats.forEach(([a, b]) => {
        if (seams.some(([c, d]) => a.distanceToSquared(c) < .13 ** 2 && b.distanceToSquared(d) < .13 ** 2)) return;
        seams.push([a, b]);
    });
    return [...structure, ...seams];
}

export function WoodCampModel({ material }: { material: any }) {
    const { scene } = useGLTF('/models/wood-camp.glb');
    const geometry = useMemo(() => {
        const parts: BufferGeometry[] = [];
        const hems: Edge[] = [];
        const structure: BufferGeometry[] = [];
        scene.updateMatrixWorld(true);
        scene.traverse(object => {
            if (!(object instanceof Mesh)) return;
            const part = object.geometry.clone().applyMatrix4(object.matrixWorld);
            parts.push(part);
            if (part.userData.outline === 'hem') {
                // Outline the cloth perimeter and the modeled fold above the front flap.
                hems.push(...edgeSegments(part, 180));
                const fold: number[] = part.userData.fold ?? [];
                const positions = part.getAttribute('position');
                for (let i = 1; i < fold.length; i++) {
                    hems.push([
                        new Vector3().fromBufferAttribute(positions, fold[i - 1]),
                        new Vector3().fromBufferAttribute(positions, fold[i]),
                    ]);
                }
            } else structure.push(part);
        });
        const body = mergeBufferGeometries(parts)!;
        const frame = mergeBufferGeometries(structure)!;
        const edges = [...campEdges(frame), ...hems];
        frame.dispose();
        parts.forEach(part => part.dispose());
        // Present the roof, supports and log piles in a three-quarter view.
        const orientation = new Matrix4().makeRotationX(.28).multiply(new Matrix4().makeRotationY(-.55));
        body.applyMatrix4(orientation);
        body.computeBoundingBox();
        const bounds = body.boundingBox!;
        const size = bounds.getSize(new Vector3());
        const center = bounds.getCenter(new Vector3());
        body.translate(-center.x, -center.y, -center.z);
        const scale = Math.min(1.85 / size.x, 1.6 / size.y);
        body.scale(scale, scale, scale);
        edges.forEach(segment => segment.forEach(point => {
            point.applyMatrix4(orientation).sub(center).multiplyScalar(scale);
        }));
        // Wood Camp fills the preview with fewer local units than Panels.
        const edge = strokeEdges(edges, .0025);
        return { body, edge };
    }, [scene]);
    useEffect(() => () => Object.values(geometry).forEach(part => part.dispose()), [geometry]);
    return <group>
        <mesh geometry={geometry.body}>
            <meshStandardMaterial color={woodColor} roughness={.9} />
        </mesh>
        <mesh geometry={geometry.edge}><shaderMaterial {...material} /></mesh>
    </group>;
}
