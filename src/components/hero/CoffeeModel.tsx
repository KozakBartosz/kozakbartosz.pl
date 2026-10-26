import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, CylinderGeometry, DoubleSide, EdgesGeometry, ExtrudeGeometry, Group, LatheGeometry, Quaternion, Shape, Vector2, Vector3 } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { useReducedMotion } from '../useReducedMotion';
import { useIconSurfaceMaterial } from './useIconSurfaceMaterial';

// Faceted ceramic, with explicit latitude/longitude contours like the other icons.
export function CoffeeModel({ material }: { material: any }) {
    const surfaceMaterial = useIconSurfaceMaterial();
    const reducedMotion = useReducedMotion();
    const bubbles = useRef<(Group | null)[]>([]);
    const parts = useMemo(() => {
        const makePart = (solids: BufferGeometry[], paths: Vector3[][]) => {
            const strokes: BufferGeometry[] = [];
            paths.forEach(points => points.slice(1).forEach((end, index) => {
                const start = points[index];
                const direction = end.clone().sub(start);
                const stroke = new CylinderGeometry(.005, .005, direction.length(), 6);
                stroke.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
                stroke.translate((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
                strokes.push(stroke);
            }));
            const normalized = solids.map(geometry => geometry.index ? geometry.toNonIndexed() : geometry);
            const surface = mergeBufferGeometries(normalized)!;
            normalized.forEach((geometry, index) => { if (geometry !== solids[index]) geometry.dispose(); });
            const outline = mergeBufferGeometries(strokes)!;
            [...solids, ...strokes].forEach(geometry => geometry.dispose());
            return { surface, outline };
        };
        const segments = 12;
        const facetRotation = Math.PI / segments;
        const ring = (radius: number, y: number) => Array.from({ length: segments + 1 }, (_, index) => {
            const angle = index / segments * Math.PI * 2 + facetRotation;
            return new Vector3(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
        });
        const profile = [[.23, -.57], [.34, -.53], [.46, -.39], [.55, -.16], [.59, .08], [.565, .115], [.53, .075], [.49, -.15], [.40, -.35], [.29, -.47], [0, -.47]];
        const cup = new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), segments);
        cup.rotateY(facetRotation);
        const paths = profile.slice(0, 7).map(([r, y]) => ring(r, y));
        for (let i = 0; i < segments; i++) paths.push(profile.slice(0, 6).map(([r, y]) => ring(r, y)[i]));
        const saucerProfile = [[0, -.64], [.35, -.64], [.65, -.59], [.85, -.53], [.89, -.56], [.85, -.63], [.52, -.72], [.28, -.73], [0, -.73]];
        const saucer = new LatheGeometry(saucerProfile.map(([r, y]) => new Vector2(r, y)), segments);
        saucer.rotateY(facetRotation);
        saucerProfile.slice(1, -1).forEach(([r, y]) => paths.push(ring(r, y)));
        for (let i = 0; i < segments; i++) paths.push(saucerProfile.slice(2, 7).map(([r, y]) => ring(r, y)[i]));
        // Rotating half a segment puts a face, rather than a vertex, at +X.
        // Its plane is constant across Z; interpolate its slope at each joint.
        const wallX = (y: number) => {
            const outer = profile.slice(0, 5);
            const index = outer.findIndex((point, i) => i > 0 && y <= point[1]);
            const [r0, y0] = outer[index - 1];
            const [r1, y1] = outer[index];
            return (r0 + (r1 - r0) * (y - y0) / (y1 - y0)) * Math.cos(facetRotation);
        };
        const handle = new Shape();
        handle.moveTo(wallX(.025), .025); handle.lineTo(.77, .075); handle.lineTo(.91, -.035);
        handle.lineTo(.92, -.22); handle.lineTo(.80, -.36); handle.lineTo(wallX(-.43), -.43);
        handle.lineTo(wallX(-.39), -.39); handle.lineTo(wallX(-.32), -.32); handle.lineTo(.73, -.27); handle.lineTo(.81, -.18);
        handle.lineTo(.80, -.08); handle.lineTo(.73, -.025); handle.lineTo(wallX(-.075), -.075); handle.closePath();
        const handleBody = new ExtrudeGeometry(handle, { depth: .095, bevelEnabled: false });
        handleBody.translate(0, 0, -.0475);
        const edge = new EdgesGeometry(handleBody, 20);
        const positions = edge.getAttribute('position');
        for (let i = 0; i < positions.count; i += 2) paths.push([new Vector3().fromBufferAttribute(positions, i), new Vector3().fromBufferAttribute(positions, i + 1)]);
        edge.dispose();
        const result = [makePart([cup, saucer, handleBody], paths)];
        [-1, 1].forEach(side => {
            const shape = new Shape();
            const points = [[-.31, -.13], [.03, -.13], [.25, -.28], [.18, -.13], [.31, -.13], [.36, -.08], [.36, .20], [.30, .26], [-.30, .26], [-.36, .20], [-.36, -.07], [-.31, -.13]];
            points.forEach(([x, y], i) => i ? shape.lineTo(x * side, y) : shape.moveTo(x * side, y));
            shape.closePath();
            const body = new ExtrudeGeometry(shape, { depth: .065, bevelEnabled: false });
            const edges = new EdgesGeometry(body);
            const p = edges.getAttribute('position');
            const lines: Vector3[][] = [];
            for (let i = 0; i < p.count; i += 2) lines.push([new Vector3().fromBufferAttribute(p, i), new Vector3().fromBufferAttribute(p, i + 1)]);
            [.025, .125].forEach(y => lines.push([new Vector3(-.22, y, .07), new Vector3(.22, y, .07)]));
            edges.dispose();
            result.push(makePart([body], lines));
        });
        return result;
    }, []);
    useEffect(() => () => parts.forEach(({ surface, outline }) => { surface.dispose(); outline.dispose(); }), [parts]);
    useFrame(({ clock }) => bubbles.current.forEach((group, index) => {
        if (group) group.position.y = (index ? .57 : .76) + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * .8 + index * 2) * .025);
    }));
    const renderPart = ({ surface, outline }: typeof parts[number]) => <>
        <mesh geometry={surface} material={surfaceMaterial} />
        <mesh geometry={outline}><shaderMaterial {...material} side={DoubleSide} uniforms={{ ...material.uniforms, myPosition: { value: new Vector3(10, 0, 0) } }} /></mesh>
    </>;
    return <group position={[0, -.5, 0]} rotation={[.18, -.55, -.04]}>
        {renderPart(parts[0])}
        {[0, 1].map(index => <group key={index} ref={group => { bubbles.current[index] = group; }} position={[index ? .36 : -.36, index ? .57 : .76, index ? -.05 : .08]} rotation={[0, index ? -.08 : .08, index ? -.06 : .05]}>
            {renderPart(parts[index + 1])}
        </group>)}
    </group>;
}
