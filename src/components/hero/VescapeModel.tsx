import { useEffect, useMemo } from 'react';
import { BufferGeometry, CylinderGeometry, ExtrudeGeometry, Path, PlaneGeometry, Shape, Vector2 } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { solidOutline } from './solidOutline';
import { useIconSurfaceMaterial } from './useIconSurfaceMaterial';

type Point = [number, number];

const digits: Record<string, Point[]> = {
    '2': [[0, .8], [.2, 1], [.8, 1], [1, .8], [1, .62], [0, 0], [1, 0]],
    '3': [[0, 1], [1, 1], [.55, .54], [1, .54], [1, .15], [.8, 0], [.18, 0], [0, .15]],
    '4': [[.8, 0], [.8, 1], [0, .37], [1, .37]],
    '8': [[.5, .5], [0, .72], [0, .86], [.2, 1], [.8, 1], [1, .86], [1, .72], [.5, .5], [0, .28], [0, .14], [.2, 0], [.8, 0], [1, .14], [1, .28], [.5, .5]],
};

function roundedShape(width: number, height: number, radius: number) {
    const x = width / 2, y = height / 2;
    const shape = new Shape();
    shape.moveTo(-x + radius, -y);
    shape.lineTo(x - radius, -y);
    shape.quadraticCurveTo(x, -y, x, -y + radius);
    shape.lineTo(x, y - radius);
    shape.quadraticCurveTo(x, y, x - radius, y);
    shape.lineTo(-x + radius, y);
    shape.quadraticCurveTo(-x, y, -x, y - radius);
    shape.lineTo(-x, -y + radius);
    shape.quadraticCurveTo(-x, -y, -x + radius, -y);
    return shape;
}

function extrude(shape: Shape, depth: number) {
    return new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -depth);
}

function circle(x: number, y: number, radius: number) {
    return new Path().absarc(x, y, radius, 0, Math.PI * 2, true);
}

function profile(points: Point[]) {
    return new Shape(points.map(([x, y]) => new Vector2(x, y)));
}

function mergeAndDispose(parts: BufferGeometry[]) {
    const geometry = mergeBufferGeometries(parts)!;
    parts.forEach(part => part.dispose());
    return geometry;
}

export function VescapeModel({ material }: { material: any }) {
    const surface = useIconSurfaceMaterial();
    const geometry = useMemo(() => {
        const solids: BufferGeometry[] = [];
        const strokes: BufferGeometry[] = [];
        const solid = (body: BufferGeometry, radius = .0035) => {
            strokes.push(solidOutline(body, radius));
            solids.push(body.index ? body.toNonIndexed() : body);
            if (body.index) body.dispose();
        };
        const linework = (x: number, y: number, z: number, scale: number) => {
            const line = (points: Point[], width = .011) => {
                for (let i = 1; i < points.length; i++) {
                    const [ax, ay] = points[i - 1], [bx, by] = points[i];
                    const dx = bx - ax, dy = by - ay;
                    strokes.push(new PlaneGeometry(Math.hypot(dx, dy) * scale, width * scale)
                        .rotateZ(Math.atan2(dy, dx))
                        .translate(x + (ax + bx) * scale / 2, y + (ay + by) * scale / 2, z));
                }
            };
            const arc = (cx: number, cy: number, radius: number, start = 0, sweep = Math.PI * 2) => {
                line(Array.from({ length: 25 }, (_, i): Point => {
                    const angle = start + sweep * i / 24;
                    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
                }));
            };
            const number = (value: string, cx: number, bottom: number, height: number) => {
                const width = height * .54;
                const advance = width * 1.38;
                Array.from(value).forEach((digit, index) => {
                    const left = cx - (width + advance) / 2 + index * advance;
                    line(digits[digit].map(([dx, dy]) => [left + dx * width, bottom + dy * height]));
                });
            };
            return { line, arc, number };
        };

        // Both screens face forward on one shared plane.
        solid(extrude(roundedShape(.82, 1.62, .075), .075).translate(-.41, .39, 0));
        const phone = linework(-.41, .39, .008, 1);
        phone.line([[-.34, -.68], [-.34, .64], [-.31, .69], [.31, .69], [.34, .64], [.34, -.68], [.31, -.71], [-.31, -.71], [-.34, -.68]]);
        phone.line([[-.075, .751], [.075, .751]]);
        for (const side of [-1, 1]) {
            phone.arc(side * .247, .60, .039);
            phone.arc(side * .247, .60, .012);
        }
        phone.line([[-.09, .60], [.09, .60]]);
        phone.arc(0, .21, .285, Math.PI * .54, Math.PI * .46);
        phone.arc(0, .21, .285, 0, Math.PI * .46);
        phone.number('23', -.135, .28, .115);
        phone.number('48', .135, .28, .115);

        // Recorded trail, rider position, and dotted route ahead.
        phone.line([[.20, -.53], [.13, -.44], [.10, -.34], [.028, -.24], [.023, -.17]]);
        phone.arc(.023, -.125, .046);
        phone.line([[.000, -.132], [.023, -.100], [.046, -.132], [.023, -.123], [.000, -.132]], .007);
        const route: Point[] = [[.023, -.062], [.035, -.025], [.062, .008], [.060, .048], [.025, .08], [-.015, .10], [-.06, .113], [-.102, .135]];
        for (const [x, y] of route) phone.arc(x, y, .009);
        phone.arc(-.136, .152, .025);
        phone.line([[-.24, -.61], [-.13, -.61]]);
        phone.line([[-.07, -.61], [.07, -.61]]);
        phone.line([[.13, -.61], [.24, -.61]]);
        phone.line([[-.075, -.755], [.075, -.755]]);

        const watchX = .49, watchY = .29, watchScale = .76;
        const watchPart = (part: BufferGeometry) => part.scale(watchScale, watchScale, watchScale).translate(watchX, watchY, 0);
        const band = roundedShape(.47, 1.12, .18);
        band.holes.push(new Path(roundedShape(.38, 1.03, .155).getPoints(8)));
        solid(watchPart(extrude(band, .24).rotateY(Math.PI / 2).translate(.12, 0, -.28)));
        solid(watchPart(new CylinderGeometry(.32, .32, .085, 48).rotateX(Math.PI / 2).translate(0, 0, -.043)));
        solid(watchPart(new CylinderGeometry(.035, .035, .047, 16).rotateZ(Math.PI / 2).translate(.33, .035, -.042)));
        const watch = linework(watchX, watchY, .008, watchScale);
        watch.arc(0, 0, .277);
        watch.arc(0, 0, .225, Math.PI * .56, Math.PI / 2);
        watch.arc(0, 0, .225, -Math.PI * .06, Math.PI / 2);
        watch.number('23', 0, -.065, .15);
        watch.arc(0, -.145, .027);

        // Tire diameter is about a third of the board length. Twin rails
        // bridge the tire, with footpads filling the width at either end.
        const board = (part: BufferGeometry) => part
            .rotateX(.35).rotateY(-.15).rotateZ(-.15).translate(.035, -.75, .31);
        solid(board(new CylinderGeometry(.29, .29, .50, 48).rotateX(Math.PI / 2)));
        const railProfile: Point[] = [
            [-.92, .065], [.92, .065], [.84, -.055], [-.84, -.055],
        ];
        const frontRail = profile(railProfile);
        for (const x of [-.055, 0, .055]) frontRail.holes.push(circle(x, .004, .014));
        solid(board(extrude(frontRail, .032).translate(0, 0, .31)));
        solid(board(extrude(profile(railProfile), .032).translate(0, 0, -.278)));
        for (const side of [-1, 1]) {
            const pad = profile([[side * .30, .065], [side * .92, .065], [side * .84, -.055], [side * .30, -.055]]);
            solid(board(extrude(pad, .556).translate(0, 0, .278)));
        }
        const firstBoardStroke = strokes.length;
        const hub = linework(0, 0, .254, 1);
        hub.arc(0, 0, .182);
        const rail = linework(0, 0, .316, 1);
        rail.arc(-.72, .006, .024);
        strokes.slice(firstBoardStroke).forEach(board);

        return { body: mergeAndDispose(solids), outline: mergeAndDispose(strokes) };
    }, []);
    useEffect(() => () => {
        geometry.body.dispose();
        geometry.outline.dispose();
    }, [geometry]);

    return <>
        <mesh geometry={geometry.body} material={surface} />
        <mesh geometry={geometry.outline}><shaderMaterial {...material} /></mesh>
    </>;
}
