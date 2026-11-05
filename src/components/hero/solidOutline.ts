import { BufferGeometry, CylinderGeometry, EdgesGeometry, Quaternion, Vector3 } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

// Mesh contours keep the same visible thickness on front, back, and side edges.
export function solidOutline(solid: BufferGeometry, radius = .004) {
    const edges = new EdgesGeometry(solid, 25);
    const positions = edges.getAttribute('position');
    const segments: BufferGeometry[] = [];
    const start = new Vector3(), end = new Vector3(), direction = new Vector3();
    const up = new Vector3(0, 1, 0);
    const rotation = new Quaternion();
    for (let i = 0; i < positions.count; i += 2) {
        start.fromBufferAttribute(positions, i);
        end.fromBufferAttribute(positions, i + 1);
        direction.subVectors(end, start);
        const segment = new CylinderGeometry(radius, radius, direction.length(), 8);
        rotation.setFromUnitVectors(up, direction.normalize());
        segment.applyQuaternion(rotation);
        segment.translate((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
        segments.push(segment);
    }
    const outline = mergeBufferGeometries(segments)!;
    edges.dispose();
    segments.forEach(segment => segment.dispose());
    return outline;
}
