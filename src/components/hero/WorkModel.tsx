import { MutableRefObject, RefObject, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { BufferGeometry, CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, Path, Quaternion, Shape, ShapeGeometry, sRGBEncoding, Vector3, Vector4 } from 'three';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { WorkPreviewFade } from './WorkPreviewFade';
import { ClinicWireframe } from './ClinicWireframe';
import { WoodCampModel } from './WoodCampModel';
import { solidOutline } from './solidOutline';
import { useIconSurfaceMaterial } from './useIconSurfaceMaterial';
import { useReducedMotion } from '../useReducedMotion';
import { HERO_DEPHTH } from './consts';
import { projectModelReveal, reloadRevealStart, finishReloadSetup } from '../projectViewTransition';
import { WorkCarousel, workProjectIndex, workProjectOffset } from '../workCarousel';

const slots = [0, 1, 2, 3];
const SIDE_ANGLE = Math.PI / 2;

// The work preview is a DOM anchor for the existing background scene.
// It shares its camera, lighting, bloom, depth of field, and contour shader.
export function WorkModel({ reloadY, elementRef, project, carouselRef, material, showcase = false, inspectRotation }: { reloadY: MutableRefObject<number | null>; showcase?: boolean; inspectRotation?: MutableRefObject<number>; elementRef: RefObject<HTMLDivElement>; project: number; carouselRef: MutableRefObject<WorkCarousel>; material: any }) {
    const fades = useMemo(() => slots.map(() => ({ bounds: { value: new Vector4() }, revealBounds: { value: new Vector4() }, reveal: { value: 1 } })), []);
    const root = useRef<Group>(null!);
    const cursor = useRef<{ x: number; y: number } | null>(null);
    const cursorTilt = useRef({ pitch: 0, yaw: 0 });
    const checkedReload = useRef(false);
    const reducedMotion = useReducedMotion();
    const models = useRef<(Group | null)[]>([]);
    const bounds = useRef({ left: 0, top: 0, width: 0, height: 0, dirty: true });
    const ray = useMemo(() => new Vector3(), []);
    const right = useMemo(() => new Vector3(), []);
    const groupMaterial = useMemo(() => ({ ...material, uniforms: {
        ...material.uniforms,
        useGroupGradient: { value: true },
        gradientCenter: { value: new Vector3() },
        gradientWidth: { value: 40 }
    } }), [material]);

    useEffect(() => {
        bounds.current.dirty = true;
        const dirty = () => { bounds.current.dirty = true; };
        const observer = new ResizeObserver(dirty);
        observer.observe(document.body);
        if (elementRef.current) observer.observe(elementRef.current);
        window.addEventListener('scroll', dirty, { passive: true });
        window.addEventListener('resize', dirty);
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', dirty);
            window.removeEventListener('resize', dirty);
        };
    }, [elementRef]);

    useEffect(() => {
        if (!showcase || reducedMotion) return;
        const follow = (event: PointerEvent) => {
            if (event.pointerType === 'mouse' && event.buttons === 0) {
                cursor.current = { x: event.clientX, y: event.clientY };
            }
        };
        const reset = () => { cursor.current = null; };
        const leave = (event: PointerEvent) => { if (!event.relatedTarget) reset(); };
        window.addEventListener('pointermove', follow, { passive: true });
        window.addEventListener('pointerdown', reset, { passive: true });
        window.addEventListener('pointerout', leave, { passive: true });
        window.addEventListener('blur', reset);
        return () => {
            window.removeEventListener('pointermove', follow);
            window.removeEventListener('pointerdown', reset);
            window.removeEventListener('pointerout', leave);
            window.removeEventListener('blur', reset);
            reset();
        };
    }, [showcase, reducedMotion]);

    useFrame(({ camera, size, clock }, delta) => {
        const carousel = carouselRef.current;
        if (!showcase && !carousel.dragging) {
            // List hovers retain their up/down direction; swipes may wrap around.
            const selected = workProjectIndex(carousel.target);
            if (selected !== project) carousel.target += project - selected;
            const difference = carousel.target - carousel.position;
            carousel.position = reducedMotion || Math.abs(difference) < .0001
                ? carousel.target
                : carousel.position + difference * (1 - Math.exp(-16 * Math.min(delta, .05)));
        }
        const element = elementRef.current;
        if (!element || !root.current) return;
        const box = bounds.current;
        if (box.dirty || showcase) {
            const rect = element.getBoundingClientRect();
            box.left = rect.left; box.top = rect.top; box.width = rect.width; box.height = rect.height;
            box.dirty = false;
        }
        if (!checkedReload.current && box.width > 0) {
            checkedReload.current = true;
            finishReloadSetup(reloadRevealStart(box.top, box.top + box.height, size.height, reloadY.current) !== null);
        }
        root.current.visible = box.width > 0 && box.top < size.height + 100 && box.top + box.height > -100;
        if (!root.current.visible) return;
        camera.updateMatrixWorld();
        const x = (box.left + box.width / 2) / size.width * 2 - 1;
        const y = -(box.top + box.height / 2) / size.height * 2 + 1;
        const z = 10;
        ray.set(x, y, 0).unproject(camera).sub(camera.position).normalize();
        root.current.position.copy(camera.position).addScaledVector(ray, (z - camera.position.z) / ray.z);
        right.set(x + 2 / size.width, y, 0).unproject(camera).sub(camera.position).normalize();
        right.multiplyScalar((z - camera.position.z) / right.z).add(camera.position);
        const unitsPerPixel = right.distanceTo(root.current.position);
        const now = performance.now();
        const reveal = reducedMotion ? 1 : projectModelReveal(now);
        let activeScale = 1;
        const orbitRadius = box.width * .46 * unitsPerPixel;
        slots.forEach(index => {
            const model = models.current[index];
            if (!model) return;
            const offset = showcase ? (index === project ? 0 : 1) : workProjectOffset(index, carousel.position);
            const orbit = Math.max(-1, Math.min(1, offset));
            const angle = orbit * SIDE_ANGLE;
            const front = Math.max(0, Math.cos(angle));
            model.visible = front > .001 && reveal > .0001;
            if (!model.visible) return;
            const phone = index === 0;
            const panels = index === 2;
            const scale = Math.min(box.width * .82 / (phone ? 1.65 : panels ? 3.1 : 1.85), box.height * .80 / (phone ? 1.8 : panels ? 2.3 : index === 3 ? 1.1 : 1.6)) * unitsPerPixel;
            if (index === project) activeScale = scale;
            model.scale.setScalar(scale * (.5 + .5 * front));
            const fade = fades[index];
            fade.reveal.value = reveal;
            fade.bounds.value.set(box.left / size.width, 1 - (box.top + box.height) / size.height, (box.left + box.width) / size.width, 1 - box.top / size.height);
            if (reveal < 1) fade.revealBounds.value.copy(fade.bounds.value);
            if (showcase) fade.bounds.value.set(-1, -1, 2, 2);
            model.position.set(Math.sin(angle) * orbitRadius + orbit ** 3 * box.width * .32 * unitsPerPixel, 0, (front - 1) * orbitRadius * .275);
            model.rotation.y = angle * .6;
        });
        const linear = (box.top + box.height / 2 - size.height / 2) / 100;
        const scrollRotation = reducedMotion ? 0 : linear * 4 / HERO_DEPHTH;
        const pointer = showcase && !reducedMotion ? cursor.current : null;
        const unit = (value: number) => Math.max(-1, Math.min(1, value));
        const pitch = pointer ? .075 * unit((pointer.y - box.top - box.height / 2) / (size.height / 2)) : 0;
        const yaw = pointer ? .12 * unit((pointer.x - box.left - box.width / 2) / (size.width / 2)) : 0;
        const tilt = cursorTilt.current;
        const easing = reducedMotion ? 1 : 1 - Math.exp(-6 * Math.min(delta, .05));
        tilt.pitch += (pitch - tilt.pitch) * easing;
        tilt.yaw += (yaw - tilt.yaw) * easing;
        const idleRotation = showcase || reducedMotion ? 0 : Math.sin(clock.elapsedTime * .15) * .08;
        root.current.rotation.set(
            -.04 + tilt.pitch,
            -.28 + tilt.yaw + (inspectRotation?.current || 0) + (showcase ? 0 : scrollRotation) + idleRotation,
            0,
        );
        root.current.updateWorldMatrix(true, false);
        groupMaterial.uniforms.gradientCenter.value.copy(root.current.position).applyMatrix4(camera.matrixWorldInverse);
        groupMaterial.uniforms.gradientWidth.value = activeScale * 2;
    });

    return <group ref={root}>
        {slots.map(index => <group key={index} ref={group => { models.current[index] = group; }}>
            <WorkPreviewFade uniforms={fades[index]}>
            {index === 0 ? <group><group position-x={-.27}><Phone material={groupMaterial} /></group><Smartwatch material={groupMaterial} /></group> : index === 2 ? <Panels material={groupMaterial} /> :
                index === 3 ? <WoodCampModel material={groupMaterial} /> :
                    <ClinicWireframe material={groupMaterial} />}
            </WorkPreviewFade>
        </group>)}
    </group>;
}

function roundedRectangle(width: number, height: number, radius: number) {
    const shape = new Shape();
    const x = -width / 2, y = -height / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    shape.closePath();
    return shape;
}

function Phone({ material }: { material: any }) {
    const surface = useIconSurfaceMaterial();
    const geometry = useMemo(() => {
        const body = new ExtrudeGeometry(roundedRectangle(.84, 1.68, .07), { depth: .07, bevelEnabled: false, curveSegments: 12 });
        body.translate(0, 0, -.07);
        const screenShape = roundedRectangle(.75, 1.53, .045);
        screenShape.holes.push(roundedRectangle(.73, 1.51, .035) as Path);
        const screen = new ShapeGeometry(screenShape, 12);
        const speaker = new ShapeGeometry(roundedRectangle(.17, .018, .009));
        const home = new ShapeGeometry(roundedRectangle(.20, .009, .004));
        return { body, edge: solidOutline(body), screen, speaker, home };
    }, []);
    useEffect(() => () => Object.values(geometry).forEach(part => part.dispose()), [geometry]);
    const contour = <shaderMaterial {...material} side={DoubleSide} />;
    return <group rotation={[0, 0, -.07]}>
        <mesh geometry={geometry.body} material={surface} />
        <mesh geometry={geometry.edge}>{contour}</mesh>
        <mesh geometry={geometry.screen} position-z={.003}>{contour}</mesh>
        <Screen image="/projects/vescape.webp" width={.73} height={1.51} radius={.035} position={[0, 0, .004]} />
        <mesh geometry={geometry.speaker} position={[0, .802, .004]}>{contour}</mesh>
        <mesh geometry={geometry.home} position={[0, -.802, .004]}>{contour}</mesh>
    </group>;
}

const fullImage = { x: 0, y: 0, width: 1, height: 1 };
function Screen({ image, width, height, radius, position, crop = fullImage, fill = false, circular = false }: {
    image: string; width: number; height: number; radius: number; position: [number, number, number];
    crop?: typeof fullImage; fill?: boolean; circular?: boolean;
}) {
    const texture = useTexture(image);
    const geometry = useMemo(() => {
        texture.encoding = sRGBEncoding;
        texture.anisotropy = 8;
        texture.needsUpdate = true;
        const aspect = texture.image.width * crop.width / (texture.image.height * crop.height);
        const w = fill ? width : Math.min(width, height * aspect);
        const h = fill ? height : Math.min(height, width / aspect);
        const shape = circular ? new Shape().absarc(0, 0, w / 2, 0, Math.PI * 2, false) : roundedRectangle(w, h, radius);
        const face = new ShapeGeometry(shape, circular ? 64 : 16);
        const positions = face.getAttribute('position');
        const uv = face.getAttribute('uv');
        for (let i = 0; i < positions.count; i++) {
            uv.setXY(i,
                crop.x + (positions.getX(i) / w + .5) * crop.width,
                1 - crop.y - crop.height + (positions.getY(i) / h + .5) * crop.height);
        }
        return face;
    }, [texture, width, height, radius, crop, fill, circular]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    return <mesh geometry={geometry} position={position}>
        <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>;
}

// A branching ribbon with open space, rather than a filled honeycomb.
const panelLayout = [
    { q: -2, r: 2 }, { q: -2, r: 1 }, { q: -1, r: 1 },
    { q: 0, r: 0 }, { q: 0, r: -1 },
    { q: 1, r: 0 }, { q: 2, r: -1 }
];

function Panels({ material }: { material: any }) {
    const surface = useIconSurfaceMaterial();
    const geometry = useMemo(() => {
        const hexagon = new Shape();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const x = Math.cos(angle) * .33, y = Math.sin(angle) * .33;
            if (i === 0) hexagon.moveTo(x, y);
            else hexagon.lineTo(x, y);
        }
        hexagon.closePath();
        const body = new ExtrudeGeometry(hexagon, { depth: .14, bevelEnabled: true, bevelSize: .095, bevelThickness: .10, bevelSegments: 1, steps: 1 });
        body.translate(0, 0, -.14);
        return { body, edge: solidOutline(body) };
    }, []);
    useEffect(() => () => Object.values(geometry).forEach(part => part.dispose()), [geometry]);
    return <group scale={.8} rotation={[.22, -.22, -.10]}>
        {panelLayout.map(({ q, r }, index) =>
            <group key={index} position={[q * .66, (r + q / 2) * Math.sqrt(3) * .44, index % 3 * .012]}>
                <mesh geometry={geometry.body} material={surface} />
                <mesh geometry={geometry.edge}><shaderMaterial {...material} /></mesh>
            </group>)}
        <AddPanel material={material} />
    </group>;
}


function Smartwatch({ material }: { material: any }) {
    const surface = useIconSurfaceMaterial();
    const geometry = useMemo(() => {
        const body = new CylinderGeometry(.32, .32, .09, 64);
        body.rotateX(Math.PI / 2);
        body.translate(0, 0, -.045);
        const strap = new ExtrudeGeometry(roundedRectangle(.28, 1.12, .06), { depth: .035, bevelEnabled: false, curveSegments: 12 });
        strap.translate(0, 0, -.10);
        const crown = new CylinderGeometry(.035, .035, .05, 16);
        crown.rotateZ(Math.PI / 2);
        crown.translate(.335, .04, -.04);
        return { body, edge: solidOutline(body), strap, strapEdge: solidOutline(strap), crown, crownEdge: solidOutline(crown) };
    }, []);
    useEffect(() => () => Object.values(geometry).forEach(part => part.dispose()), [geometry]);
    return <group position={[.53, -.27, .15]} rotation={[0, -.12, .13]}>
        <mesh geometry={geometry.strap} material={surface} />
        <mesh geometry={geometry.strapEdge}><shaderMaterial {...material} /></mesh>
        <mesh geometry={geometry.body} material={surface} />
        <mesh geometry={geometry.edge}><shaderMaterial {...material} /></mesh>
        <mesh geometry={geometry.crown} material={surface} />
        <mesh geometry={geometry.crownEdge}><shaderMaterial {...material} /></mesh>
        <Screen image="/projects/vescape-watch.webp" width={.59} height={.59} radius={0} position={[0, 0, .003]} circular fill />
    </group>;
}

function AddPanel({ material }: { material: any }) {
    const geometry = useMemo(() => {
        const strokes: BufferGeometry[] = [];
        const up = new Vector3(0, 1, 0);
        const stroke = (start: Vector3, end: Vector3, radius = .004) => {
            const direction = end.clone().sub(start);
            const part = new CylinderGeometry(radius, radius, direction.length(), 8);
            part.applyQuaternion(new Quaternion().setFromUnitVectors(up, direction.normalize()));
            part.translate((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
            strokes.push(part);
        };
        for (let edge = 0; edge < 6; edge++) {
            const a = new Vector3(Math.cos(edge * Math.PI / 3) * .426, Math.sin(edge * Math.PI / 3) * .426, .055);
            const b = new Vector3(Math.cos((edge + 1) * Math.PI / 3) * .426, Math.sin((edge + 1) * Math.PI / 3) * .426, .055);
            for (let dash = 0; dash < 6; dash++) stroke(a.clone().lerp(b, (dash + .15) / 6), a.clone().lerp(b, (dash + .75) / 6));
        }
        stroke(new Vector3(-.11, 0, .055), new Vector3(.11, 0, .055), .006);
        stroke(new Vector3(0, -.11, .055), new Vector3(0, .11, .055), .006);
        const merged = mergeBufferGeometries(strokes)!;
        strokes.forEach(part => part.dispose());
        return merged;
    }, []);
    useEffect(() => () => geometry.dispose(), [geometry]);
    return <mesh geometry={geometry} position={[1.4, -1.05, 0]}><shaderMaterial {...material} /></mesh>;
}
