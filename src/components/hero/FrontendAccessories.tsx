import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ExtrudeGeometry, Group, Path, PlaneGeometry, Shape, ShapeGeometry } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { useReducedMotion } from '../useReducedMotion';
import { roundedShape } from './roundedShape';
import { solidOutline } from './solidOutline';
import { useIconSurfaceMaterial } from './useIconSurfaceMaterial';

function extrude(shape: Shape, depth: number, front = 0) {
    return new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 })
        .translate(0, 0, front - depth);
}

function faceOutline(shape: Shape, radius: number) {
    const face = new ShapeGeometry(shape, 8);
    const edge = solidOutline(face, radius);
    face.dispose();
    return edge;
}

function standFoot() {
    const foot = new Shape();
    foot.moveTo(-.055, .04);
    foot.lineTo(-.33, -.27);
    foot.quadraticCurveTo(-.35, -.31, -.315, -.318);
    foot.quadraticCurveTo(-.298, -.323, -.278, -.306);
    foot.lineTo(0, -.09);
    foot.lineTo(.278, -.306);
    foot.quadraticCurveTo(.298, -.323, .315, -.318);
    foot.quadraticCurveTo(.35, -.31, .33, -.27);
    foot.lineTo(.055, .04);
    foot.closePath();
    return extrude(foot, .028).rotateX(-Math.PI / 2);
}

const gearAngle = Math.PI * .20;
const gearDistance = .45;
const largeTeeth = 12;
const smallTeeth = 8;

function gearShape(teeth: number, pitchRadius: number) {
    const shape = new Shape();
    const pitch = Math.PI * 2 / teeth;
    for (let tooth = 0; tooth < teeth; tooth++) {
        for (const [offset, height] of [[-.5, -.052], [-.32, -.052], [-.13, .030], [.13, .030], [.32, -.052]]) {
            const angle = (tooth + offset) * pitch;
            const radius = pitchRadius + height;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (!tooth && offset === -.5) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
    }
    shape.closePath();
    shape.holes.push(new Path().absarc(0, 0, pitchRadius * .32, 0, Math.PI * 2, true));
    return shape;
}

type Stroke = [number, number, number, number];

function faceStrokes(lines: Stroke[], width: number, z: number) {
    const segments = lines.map(([x1, y1, x2, y2]) => {
        const dx = x2 - x1, dy = y2 - y1;
        return new PlaneGeometry(Math.hypot(dx, dy) + width * .35, width)
            .rotateZ(Math.atan2(dy, dx))
            .translate((x1 + x2) / 2, (y1 + y2) / 2, z);
    });
    const geometry = mergeBufferGeometries(segments)!;
    segments.forEach(segment => segment.dispose());
    return geometry;
}

export function FrontendAccessories({ material }: { material: any }) {
    const phone = useRef<Group>(null!);
    const largeGear = useRef<Group>(null!);
    const smallGear = useRef<Group>(null!);
    const reducedMotion = useReducedMotion();
    const surface = useIconSurfaceMaterial(false);
    const geometry = useMemo(() => {
        const monitor = roundedShape(1.56, 1.01, .065);
        const monitorEdge = faceOutline(monitor, .0035);
        const monitorBack = extrude(monitor, .104, -.014);
        const monitorRearEdge = faceOutline(monitor, .0025).translate(0, 0, -.118);
        monitor.holes.push(new Path().copy(roundedShape(1.506, .956, .045)));
        const neck = extrude(roundedShape(.092, .366, .028), .071).translate(0, -.575, .062);
        const foot = standFoot();
        const phoneShape = roundedShape(.433, .91, .063);
        const phoneBack = extrude(phoneShape, .070, -.015);
        const phoneRearEdge = faceOutline(phoneShape, .0025).translate(0, 0, -.085);
        const large = gearShape(largeTeeth, .27);
        const small = gearShape(smallTeeth, .18);
        const largeBody = extrude(large, .063);
        const smallBody = extrude(small, .053);
        const screen = roundedShape(.364, .777, .042);
        // The bezel stops at the recessed face. Draw the lip once from the front.
        phoneShape.holes.push(new Path().copy(screen));
        return {
            monitorBack,
            monitorBezel: extrude(monitor, .014),
            monitorEdge,
            monitorRearEdge,
            neck,
            neckEdge: solidOutline(neck, .0025),
            foot,
            footEdge: solidOutline(foot, .0027),
            largeBody,
            largeEdge: solidOutline(largeBody, .0028),
            smallBody,
            smallEdge: solidOutline(smallBody, .0025),
            codeMark: faceStrokes([
                [-.117, .088, -.213, 0], [-.213, 0, -.117, -.088],
                [.117, .088, .213, 0], [.213, 0, .117, -.088],
                [.053, .142, -.053, -.142],
            ], .009, -.010),
            phoneBack,
            phoneRearEdge,
            phoneBezel: extrude(phoneShape, .015),
            phoneEdge: faceOutline(phoneShape, .0033),
            phoneHardware: faceStrokes([
                [-.039, .421, .039, .421],
                [-.026, -.421, .026, -.421],
            ], .007, .004),
            phoneDetail: faceStrokes([
                [-.117, .15, -.088, .122], [-.088, .122, -.117, .094], [-.066, .094, .025, .094],
                [-.074, .007, .111, .007], [-.074, -.064, .047, -.064], [-.108, -.135, .078, -.135],
            ], .008, -.011),
        };
    }, []);
    useEffect(() => () => Object.values(geometry).forEach(part => part.dispose()), [geometry]);

    useFrame(({ clock }) => {
        phone.current.position.y = -.32 + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * .9 + 1.2) * .035);
        const spin = reducedMotion ? 0 : clock.elapsedTime * .10 + window.scrollY * .0018;
        // Advance one tooth on each gear together, in opposite directions.
        largeGear.current.rotation.z = gearAngle + spin;
        smallGear.current.rotation.z = gearAngle + Math.PI - Math.PI / smallTeeth - spin * largeTeeth / smallTeeth;
    });

    const contour = <shaderMaterial {...material} />;
    return <group rotation={[.035, .22, 0]}>
        <group position={[.45, .71, -.205]}>
            <group ref={largeGear}>
                <mesh geometry={geometry.largeBody} material={surface} />
                <mesh geometry={geometry.largeEdge}>{contour}</mesh>
            </group>
            <group ref={smallGear} position={[gearDistance * Math.cos(gearAngle), gearDistance * Math.sin(gearAngle), 0]}>
                <mesh geometry={geometry.smallBody} material={surface} />
                <mesh geometry={geometry.smallEdge}>{contour}</mesh>
            </group>
        </group>
        <group position={[.13, .12, 0]}>
            <group position-z={-.16}>
                <mesh geometry={geometry.neck} material={surface} />
                <mesh geometry={geometry.neckEdge}>{contour}</mesh>
                <group position-y={-.758} rotation-x={.20}>
                    <mesh geometry={geometry.foot} material={surface} />
                    <mesh geometry={geometry.footEdge}>{contour}</mesh>
                </group>
            </group>
            <mesh geometry={geometry.monitorBack} material={surface} />
            <mesh geometry={geometry.monitorBezel} material={surface} />
            <mesh geometry={geometry.monitorEdge}>{contour}</mesh>
            <mesh geometry={geometry.monitorRearEdge}>{contour}</mesh>
            <mesh geometry={geometry.codeMark}>{contour}</mesh>
        </group>
        <group position={[-.73, -.32, .21]} ref={phone}>
            <mesh geometry={geometry.phoneBack} material={surface} />
            <mesh geometry={geometry.phoneBezel} material={surface} />
            <mesh geometry={geometry.phoneEdge}>{contour}</mesh>
            <mesh geometry={geometry.phoneRearEdge}>{contour}</mesh>
            <mesh geometry={geometry.phoneHardware}>{contour}</mesh>
            <mesh geometry={geometry.phoneDetail}>{contour}</mesh>
        </group>
    </group>;
}
