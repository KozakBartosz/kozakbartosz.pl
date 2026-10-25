import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, BufferGeometry, CylinderGeometry, DoubleSide, EdgesGeometry, ExtrudeGeometry, Group, Matrix4, Path, Quaternion, Shape, ShapeGeometry, Vector3 } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { useReducedMotion } from '../useReducedMotion';
import { useIconSurfaceMaterial } from './useIconSurfaceMaterial';

function rectangle(width: number, height: number) {
    const shape = new Shape();
    shape.moveTo(-width / 2, -height / 2);
    shape.lineTo(width / 2, -height / 2);
    shape.lineTo(width / 2, height / 2);
    shape.lineTo(-width / 2, height / 2);
    shape.closePath();
    return shape;
}

// Mesh contours keep the same visible thickness on front, back, and side edges.
function solidOutline(solid: BufferGeometry, radius = .004) {
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

function ring(shape: Shape, hole: Path) {
    shape.holes.push(hole);
    return new ShapeGeometry(shape, 24);
}

function gearPath(inset = 0) {
    const shape = new Shape();
    // Broad teeth with sloped shoulders, rather than a star-shaped silhouette.
    for (let tooth = 0; tooth < 12; tooth++) {
        [0, .16, .25, .65, .74, .90].forEach((fraction, index) => {
            const angle = (tooth + fraction) / 12 * Math.PI * 2;
            const radius = (index >= 2 && index <= 3 ? .49 : .405) - inset;
            const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
            if (tooth === 0 && index === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        });
    }
    shape.closePath();
    return shape;
}

export function FrontendAccessories({ material }: { material: any }) {
    const phone = useRef<Group>(null!);
    const gear = useRef<Group>(null!);
    const reducedMotion = useReducedMotion();
    const surfaceMaterial = useIconSurfaceMaterial();
    const gearUniforms = useMemo(() => ({
        ...material.uniforms,
        myPosition: { value: new Vector3(10, 0, 0) },
        useGradientMatrix: { value: true },
        gradientMatrix: { value: new Matrix4() }
    }), [material]);
    const geometry = useMemo(() => {
        const gearFace = gearPath();
        const hole = new Path();
        hole.absarc(0, 0, .16, 0, Math.PI * 2, true);
        gearFace.holes.push(hole);
        // Both solids extend backward along the monitor's local Z axis.
        const gearBody = new ExtrudeGeometry(gearFace, { depth: .12, bevelEnabled: false, curveSegments: 48, steps: 1 });
        gearBody.translate(0, 0, -.12);
        const phoneBody = new ExtrudeGeometry(rectangle(.39, .76), { depth: .065, bevelEnabled: false, steps: 1 });
        phoneBody.translate(0, 0, -.065);
        // Code mark lies parallel to the display, just in front of its surface.
        const markSegments: BufferGeometry[] = [];
        const markStroke = (x1: number, y1: number, x2: number, y2: number) => {
            const dx = x2 - x1, dy = y2 - y1;
            const segment = new BoxGeometry(Math.sqrt(dx * dx + dy * dy), .014, .008);
            segment.rotateZ(Math.atan2(dy, dx));
            segment.translate((x1 + x2) / 2, (y1 + y2) / 2 + .12, .115);
            markSegments.push(segment);
        };
        markStroke(-.17, .12, -.29, 0);
        markStroke(-.29, 0, -.17, -.12);
        markStroke(.17, .12, .29, 0);
        markStroke(.29, 0, .17, -.12);
        markStroke(.065, .18, -.065, -.18);
        const codeMark = mergeBufferGeometries(markSegments)!;
        markSegments.forEach(segment => segment.dispose());
        return {
            codeMark,
            gearFace: gearBody,
            gearOutline: solidOutline(gearBody, .009),
            phoneFace: phoneBody,
            phoneOutline: solidOutline(phoneBody),
            screen: ring(rectangle(.32, .57), rectangle(.30, .55)),
            speaker: new ShapeGeometry(rectangle(.09, .009)),
            home: new ShapeGeometry(rectangle(.075, .009))
        };
    }, []);
    useEffect(() => () => Object.values(geometry).forEach(value => value.dispose()), [geometry]);

    useFrame(({ clock }) => {
        phone.current.position.y = -.28 + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * .9 + 1.2) * .035);
        gear.current.rotation.z = reducedMotion ? 0 : clock.elapsedTime * .10 + window.scrollY * .0018;
        // Match the monitor's color coordinates without applying the gear's
        // additional spin to the shader's view-space position a second time.
        const monitor = gear.current.parent;
        if (monitor) {
            monitor.updateWorldMatrix(true, false);
            gearUniforms.gradientMatrix.value.copy(monitor.matrixWorld);
        }
    });

    const contour = <shaderMaterial {...material} side={DoubleSide} uniforms={{ ...material.uniforms, myPosition: { value: new Vector3(10, 0, 0) } }} />;
    return <>
        <mesh geometry={geometry.codeMark}>{contour}</mesh>
        <group position={[.57, .43, -.30]} ref={gear}>
            <mesh geometry={geometry.gearFace} material={surfaceMaterial} />
            <mesh geometry={geometry.gearOutline}>
                <shaderMaterial {...material} side={DoubleSide} uniforms={gearUniforms} />
            </mesh>
        </group>
        <group position={[-.65, -.28, .39]} ref={phone}>
            <mesh geometry={geometry.phoneFace} material={surfaceMaterial} />
            <mesh geometry={geometry.phoneOutline}>{contour}</mesh>
            <mesh geometry={geometry.screen} position-z={.006}>{contour}</mesh>
            <mesh geometry={geometry.speaker} position={[0, .335, .006]}>{contour}</mesh>
            <mesh geometry={geometry.home} position={[0, -.335, .006]}>{contour}</mesh>
        </group>
    </>;
}
