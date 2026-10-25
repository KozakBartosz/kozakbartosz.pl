import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from '../useReducedMotion';
import { useIconSurfaceMaterial } from './useIconSurfaceMaterial';
import { BufferAttribute, BufferGeometry, CubicBezierCurve3, DoubleSide, DynamicDrawUsage, EllipseCurve, Float32BufferAttribute, Group, PlaneGeometry, Vector3 } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

// Flat panels at distinct depths. Contours are filled strips, so their width
// works consistently in WebGL without relying on unsupported wide GL lines.
export function BrowserModel({ material }: { material: any }) {
    const groups = useRef<(Group | null)[]>([]);
    const reducedMotion = useReducedMotion();
    const surfaceMaterial = useIconSurfaceMaterial();
    const parts = useMemo(() => {
        const panels: PlaneGeometry[] = [];
        const strokes: BufferGeometry[] = [];
        const thickness = .012;
        const parts: { surface: BufferGeometry | null; outline: BufferGeometry; floating: boolean; phase: number; deformation?: { base: Float32Array; target: Float32Array } }[] = [];
        const flush = (floating = false, phase = 0) => {
            const surface = panels.length ? mergeBufferGeometries(panels)! : null;
            const outline = mergeBufferGeometries(strokes)!;
            panels.splice(0).forEach(geometry => geometry.dispose());
            strokes.splice(0).forEach(geometry => geometry.dispose());
            parts.push({ surface, outline, floating, phase });
        };
        const plane = (target: BufferGeometry[], x: number, y: number, z: number, w: number, h: number) => {
            const geometry = new PlaneGeometry(w, h);
            geometry.translate(x, y, z);
            target.push(geometry);
        };
        const stroke = (x: number, y: number, z: number, w: number, h = thickness) =>
            plane(strokes, x, y, z, w, h);
        const frame = (x: number, y: number, z: number, w: number, h: number, fill = true) => {
            if (fill) plane(panels, x, y, z, w, h);
            const front = z + .003;
            stroke(x, y + (h - thickness) / 2, front, w);
            stroke(x, y - (h - thickness) / 2, front, w);
            stroke(x - (w - thickness) / 2, y, front, thickness, h - thickness * 2);
            stroke(x + (w - thickness) / 2, y, front, thickness, h - thickness * 2);
        };
        const ribbon = (points: Vector3[], width = thickness) => {
            const positions: number[] = [];
            points.forEach((point, index) => {
                const before = points[Math.max(0, index - 1)];
                const after = points[Math.min(points.length - 1, index + 1)];
                const dx = after.x - before.x;
                const dy = after.y - before.y;
                const length = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = -dy / length * width / 2;
                const ny = dx / length * width / 2;
                positions.push(point.x + nx, point.y + ny, point.z,
                    point.x - nx, point.y - ny, point.z);
            });
            const indices: number[] = [];
            for (let i = 0; i < points.length - 1; i++) {
                const a = i * 2;
                indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
            }
            const geometry = new BufferGeometry();
            geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
            geometry.setAttribute('uv', new Float32BufferAttribute(new Array(points.length * 4).fill(0), 2));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            strokes.push(geometry);
        };

        // Simple geometric lettering on a floating tile overlapping the toolbar.
        frame(-.44, .70, .48, .65, .50);
        ribbon([new Vector3(-.69, .54, .495), new Vector3(-.56, .87, .495), new Vector3(-.43, .54, .495)]);
        stroke(-.56, .65, .495, .17);
        const bowl = new EllipseCurve(-.28, .635, .085, .09, 0, Math.PI * 2, false, 0);
        ribbon(bowl.getPoints(40).map(point => new Vector3(point.x, point.y, .495)));
        ribbon([new Vector3(-.195, .725, .495), new Vector3(-.195, .55, .495), new Vector3(-.17, .55, .495)]);
        flush(true, .7);
        // Two matching shapes let the left handle move while endpoints and
        // the right handle stay fixed. Only vertex positions change per frame.
        const drawCurve = (handleY: number) => {
            const start = new Vector3(.02, -.77, .38);
            const controlA = new Vector3(.36, handleY, .38);
            const controlB = new Vector3(.60, -.92, .38);
            const end = new Vector3(.93, -.43, .38);
            ribbon(new CubicBezierCurve3(start, controlA, controlB, end).getPoints(64));
            [[start, controlA], [end, controlB]].forEach(([anchor, handle]) => {
                ribbon([anchor, handle], .006);
                frame(handle.x, handle.y, handle.z + .003, .045, .045, false);
                frame(anchor.x, anchor.y, anchor.z + .006, .055, .055, false);
            });
            flush();
        };
        drawCurve(-.48);
        const curvePart = parts[parts.length - 1];
        drawCurve(-1.05);
        const alternateCurve = parts.pop()!;
        const position = curvePart.outline.getAttribute('position') as BufferAttribute;
        position.setUsage(DynamicDrawUsage);
        curvePart.deformation = {
            base: new Float32Array(position.array),
            target: new Float32Array(alternateCurve.outline.getAttribute('position').array)
        };
        alternateCurve.outline.dispose();

        // One outer contour, one toolbar divider, and flat window controls.
        frame(0, 0, 0, 1.68, 1.22);
        stroke(0, .455, .003, 1.68 - thickness * 2);
        [-.7, -.6, -.5].forEach(x => frame(x, .53, .012, .035, .035, false));
        stroke(.2, .53, .015, .76, .006);

        frame(0, .285, .14, 1.46, .23);
        frame(-.53, .305, .15, .18, .045, false);
        stroke(.43, .305, .15, .35);

        flush();

        // A little overlap with the header, but generous gaps between cards.
        const cards = [
            { x: -.53, y: -.04, z: .32, h: .43 },
            { x: 0, y: .005, z: .51, h: .48 },
            { x: .53, y: -.07, z: .26, h: .39 }
        ];
        cards.forEach(({ x, y, z, h }, index) => {
            frame(x, y, z, .40, h);
            // Simple content strokes instead of nested rectangular boxes.
            frame(x, y + .06, z + .012, .28, .085, false);
            stroke(x - .035, y - .075, z + .012, .21);
            flush(true, index * 2.1 + 1.8);
        });

        frame(0, -.455, .10, 1.46, .12);
        stroke(-.48, -.455, .112, .25);
        stroke(.48, -.455, .112, .18);

        flush();
        return parts;
    }, []);

    useEffect(() => () => {
        parts.forEach(({ surface, outline }) => { surface?.dispose(); outline.dispose(); });
    }, [parts]);

    useFrame(({ clock }) => {
        parts.forEach((part, index) => {
            if (part.deformation) {
                // Two-second moves alternate with 1.2-second holds.
                const phase = clock.elapsedTime % 6.4;
                const progress = phase < 2 ? phase / 2
                    : phase < 3.2 ? 1
                    : phase < 5.2 ? 1 - (phase - 3.2) / 2
                    : 0;
                const blend = reducedMotion ? 0 : progress * progress * (3 - 2 * progress);
                const position = part.outline.getAttribute('position') as BufferAttribute;
                const { base, target } = part.deformation;
                const vertices = position.array as Float32Array;
                for (let i = 0; i < vertices.length; i++) {
                    vertices[i] = base[i] + (target[i] - base[i]) * blend;
                }
                position.needsUpdate = true;
            }
            const group = groups.current[index];
            if (!group || !part.floating) return;
            group.position.y = reducedMotion ? 0 : Math.sin(clock.elapsedTime * .85 + part.phase) * .028;
        });
    });

    return <group rotation={[-.12, -.55, -.08]}>
        {parts.map(({ surface, outline }, index) => <group key={index} ref={group => { groups.current[index] = group; }}>
            {surface && <mesh geometry={surface} material={surfaceMaterial} />}
            <mesh geometry={outline}>
                <shaderMaterial {...material} side={DoubleSide} uniforms={{ ...material.uniforms, myPosition: { value: new Vector3(10, 0, 0) } }} />
            </mesh>
        </group>)}
    </group>;
}
