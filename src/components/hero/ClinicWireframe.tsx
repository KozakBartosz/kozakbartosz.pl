import { useLoader } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { BoxGeometry, BufferGeometry, DoubleSide, ExtrudeGeometry, Shape, TorusGeometry } from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { solidOutline } from './solidOutline';
import { useIconSurfaceMaterial } from './useIconSurfaceMaterial';

function capsule(width: number, height: number, depth: number) {
    const shape = new Shape();
    const radius = height / 2;
    const center = width / 2 - radius;
    shape.absarc(center, 0, radius, -Math.PI / 2, Math.PI / 2, false);
    shape.absarc(-center, 0, radius, Math.PI / 2, Math.PI * 1.5, false);
    shape.closePath();
    return new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 }).translate(0, 0, -depth);
}

const descriptionWidths = [.63, .59, .65, .54, .38];

export function ClinicWireframe({ material }: { material: any }) {
    const [profile, mark] = useLoader(SVGLoader, [
        '/projects/braniborska/profile.svg',
        '/projects/braniborska/mark.svg',
    ]);
    const surface = useIconSurfaceMaterial();
    const parts = useMemo(() => {
        const outlined = (body: BufferGeometry, radius = .003) => ({
            body,
            contour: solidOutline(body, radius),
        });
        const extrude = (asset: typeof profile, x: number, y: number, scale: number, depth: number, radius = .003) =>
            asset.paths.flatMap(path => SVGLoader.createShapes(path)).map(shape => {
                const body = new ExtrudeGeometry(shape, { depth: depth / scale, bevelEnabled: false, curveSegments: 8 });
                body.translate(-x, -y, 0);
                body.scale(scale, scale, scale);
                body.rotateX(Math.PI);
                body.translate(0, 0, depth);
                return outlined(body, radius);
            });

        const arc = new TorusGeometry(.145, .004, 6, 36, Math.PI * 1.55);
        arc.rotateZ(Math.PI * .24);
        return {
            arc,
            bar: new BoxGeometry(1, .006, .008).translate(0, 0, -.004),
            profile: extrude(profile, 871, 1274, .00043, .095),
            mark: extrude(mark, 385.5, 568, .000235, .016, .0018),
            phone: outlined(capsule(.29, .085, .035)),
            language: outlined(capsule(.17, .085, .035)),
            heading: outlined(capsule(.53, .061, .018), .0018),
            action: outlined(capsule(.28, .074, .028), .0022),
        };
    }, [profile, mark]);

    useEffect(() => () => {
        parts.arc.dispose();
        parts.bar.dispose();
        [...parts.profile, ...parts.mark, parts.phone, parts.language, parts.heading, parts.action].forEach(({ body, contour }) => {
            body.dispose();
            contour.dispose();
        });
    }, [parts]);

    const outline = <shaderMaterial {...material} side={DoubleSide} />;
    const renderPart = ({ body, contour }: typeof parts.phone) => (
        <>
            <mesh geometry={body} material={surface} />
            <mesh geometry={contour}>{outline}</mesh>
        </>
    );

    return (
        <group rotation={[.08, -.12, 0]}>
            <group position-y={.69}>
                {/* The mark's overlapping paths occupy separate depth planes. */}
                <group position={[-.85, 0, 0]}>
                    {parts.mark.map((part, index) => (
                        <group key={index} position-z={-.016 - (parts.mark.length - 1 - index) * .023}>
                            {renderPart(part)}
                        </group>
                    ))}
                </group>
                <mesh geometry={parts.bar} position-x={-.18} scale-x={.82}>{outline}</mesh>
                <group position={[.49, 0, 0]}>{renderPart(parts.phone)}</group>
                <group position={[.79, 0, 0]}>{renderPart(parts.language)}</group>
            </group>

            <group position={[-.67, .27, 0]}>
                <mesh geometry={parts.arc} position={[.075, .05, 0]} rotation={[0, 0, -.19]}>{outline}</mesh>
                <group position-x={.31}>{renderPart(parts.heading)}</group>
                {descriptionWidths.map((width, index) => (
                    <mesh key={index} geometry={parts.bar}
                        position={[.045 + width / 2, -.19 - index * .075, 0]} scale-x={width}>
                        {outline}
                    </mesh>
                ))}
                <group position={[.185, -.62, 0]}>{renderPart(parts.action)}</group>
            </group>

            <group position={[.48, -.045, -.15]}>
                {parts.profile.map((part, index) => <group key={index}>{renderPart(part)}</group>)}
            </group>
        </group>
    );
}
