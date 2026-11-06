import { BufferGeometry, CylinderGeometry, EdgesGeometry, Quaternion, Vector3 } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

export type Edge = [Vector3, Vector3];

export function edgeSegments(solid: BufferGeometry, creaseAngle = 25): Edge[] {
    const edges = new EdgesGeometry(solid, creaseAngle);
    const positions = edges.getAttribute('position');
    const segments: Edge[] = [];
    for (let i = 0; i < positions.count; i += 2) {
        segments.push([
            new Vector3().fromBufferAttribute(positions, i),
            new Vector3().fromBufferAttribute(positions, i + 1),
        ]);
    }
    edges.dispose();
    return segments;
}

// Mesh contours keep the same visible thickness on front, back, and side edges.
export function strokeEdges(edges: Edge[], radius: number) {
    const direction = new Vector3();
    const up = new Vector3(0, 1, 0);
    const rotation = new Quaternion();
    const segments = edges.map(([start, end]) => {
        direction.subVectors(end, start);
        const segment = new CylinderGeometry(radius, radius, direction.length(), 8);
        rotation.setFromUnitVectors(up, direction.normalize());
        segment.applyQuaternion(rotation);
        segment.translate((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
        return segment;
    });
    const outline = mergeBufferGeometries(segments)!;
    segments.forEach(segment => segment.dispose());
    return outline;
}

export function solidOutline(solid: BufferGeometry, radius = .004) {
    return strokeEdges(edgeSegments(solid), radius);
}
