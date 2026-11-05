import { useCylinder } from '@react-three/cannon';
import { Shadow, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3, PerspectiveCamera, Group, Matrix4, Vector4 } from 'three';
import { useReducedMotion } from '../useReducedMotion';
import { HERO_DEPHTH, getHeroScrollOffset } from './consts';
import { initialModelReveal, reloadRevealStart } from '../projectViewTransition';
import { WorkPreviewFade } from './WorkPreviewFade';
import { ShadowDrop } from './ShadowDrop';
import { InteractiveAccessories } from './InteractiveAccessories';
import { CoffeeModel } from './CoffeeModel';
import { BrowserModel } from './BrowserModel';
import { FrontendAccessories } from './FrontendAccessories';
import { IconSurfaceFadeContext, useFadedIconSurface } from './useIconSurfaceMaterial';

export function Icon({ material, element, reloadY, url, browser = false, coffee = false, frontend = false, interactive = false, gradientWidth = 40, active = true }: any) {
    const { camera } = useThree();
    const reducedMotion = useReducedMotion();
    const revealStarted = useRef<number | null>();
    const reveal = useMemo(() => ({
        bounds: { value: new Vector4(-1, -1, 2, 2) },
        revealBounds: { value: new Vector4() },
        reveal: { value: 1 }
    }), []);
    const fadeMatrix = useMemo(() => ({ value: new Matrix4() }), []);


    // Share the uniform objects across every contour in this icon, including
    // independently animated accessories. Each icon owns its own center.
    const groupMaterial = useMemo(() => ({
        ...material,
        uniforms: {
            ...material.uniforms,
            useGradientMatrix: { value: true },
            gradientMatrix: fadeMatrix,
            useGroupGradient: { value: true },
            gradientCenter: { value: new Vector3() },
            gradientWidth: { value: gradientWidth }
        }
    }), [material, gradientWidth, fadeMatrix]);

    // const icon = useGLTF('/models/icon1.glb');

    // const nodes2 = icon.nodes;

    const meshRef = useRef<Group>(null!);
    const materialRef = useRef<any>(null!);

    const projectCamera = useMemo(() => new PerspectiveCamera(
        30,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    ), []);
    const vector = useMemo(() => new Vector3(), []);
    const coords = useMemo(() => new Vector3(), []);
    const bounds = useRef({ top: 0, left: 0, dirty: true });

    useEffect(() => {
        const markDirty = () => { bounds.current.dirty = true; };
        const observer = new ResizeObserver(markDirty);
        observer.observe(document.body);
        observer.observe(element);
        window.addEventListener('scroll', markDirty, { passive: true });
        window.addEventListener('resize', markDirty);
        markDirty();
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', markDirty);
            window.removeEventListener('resize', markDirty);
        };
    }, [element]);

    useFrame(state => {
        if (!active) return;
        if (bounds.current.dirty) {
            const rect = element.getBoundingClientRect();
            bounds.current.top = rect.top;
            bounds.current.left = rect.left;
            bounds.current.dirty = false;
        }
        const { top, left } = bounds.current;
        if (revealStarted.current === undefined) {
            revealStarted.current = reloadRevealStart(top, top + 1, state.size.height, reloadY.current);
        }
        const start = revealStarted.current;
        if (start != null) {
            reveal.reveal.value = reducedMotion ? 1 : initialModelReveal(performance.now(), start);
            if (reveal.reveal.value === 1) revealStarted.current = null;
            else {
                const scanRadius = Math.min(300, state.size.height * .45);
                reveal.revealBounds.value.set(0, 1 - (top + scanRadius) / state.size.height, 1, 1 - (top - scanRadius) / state.size.height);
            }
        }
        meshRef.current.visible = reveal.reveal.value > .0001;
        const scrollOffset = getHeroScrollOffset(window.scrollY, window.innerHeight);



        projectCamera.aspect = window.innerWidth / window.innerHeight;
        projectCamera.position.x = 0;
        projectCamera.position.y = -scrollOffset;
        projectCamera.position.z = 125;
        projectCamera.updateProjectionMatrix();
        projectCamera.updateMatrixWorld();

        // projectCamera.updateMatrix();

        // let x = -1.0 + (2.0 * nMouseX) / window.innerWidth;
        // let y = -1.0 + (2.0 * nMouseY) / window.innerHeight;
        let x = (left / window.innerWidth) * 2 - 1;
        let y = -((top - scrollOffset) / window.innerHeight) * 2 + 1;

        vector.set(x, y, 0);

        vector.unproject(projectCamera);

        vector.sub(projectCamera.position).normalize();
        // scale the projected ray
        var distance = -projectCamera.position.z / vector.z,
            scaled = vector.multiplyScalar(distance),
            projected = coords.copy(projectCamera.position).add(scaled);

        const linear = (top - window.innerHeight / 2) / 100;

        meshRef.current.position.x = projected.x;
        meshRef.current.position.y = projected.y - 2.5;
        meshRef.current.position.z = (linear * linear) / -2.5 + 10;

        if (window.innerWidth < 1000) {
            // Use the rendered camera so the mobile model stays at its DOM anchor.
            vector.set(
                (left / window.innerWidth) * 2 - 1,
                -(top / window.innerHeight) * 2 + 1,
                0
            ).unproject(camera);
            vector.sub(camera.position).normalize();
            const distance = (meshRef.current.position.z - camera.position.z) / vector.z;
            coords.copy(camera.position).addScaledVector(vector, distance);
            meshRef.current.position.x = coords.x;
            meshRef.current.position.y = coords.y;
        }

        // slow animation with rotation sinsun style left 10deg left and right 10deg
        let rotationAdd = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.15) * 0.3;



        meshRef.current.rotation.y =
            (linear * 4) / HERO_DEPHTH - 50 + rotationAdd;

        meshRef.current.updateWorldMatrix(true, false);
        fadeMatrix.value.copy(meshRef.current.matrixWorld);
        camera.updateMatrixWorld();
        groupMaterial.uniforms.gradientCenter.value
            .setFromMatrixPosition(meshRef.current.matrixWorld)
            .applyMatrix4(camera.matrixWorldInverse);

        // if (materialRef.current) {
        //     let valueTest: number = projected.x / -3;
        //     // console.log('materialRef', valueTest);
        //     setMyPosition(new Vector3(8.0, 0.0, 0.0));
        //     materialRef.current.uniforms.myPosition.value = new Vector3(
        //         8.0,
        //         0.0,
        //         0.0
        //     );
        //     materialRef.current.needsUpdate = true;
        // }
    });

    // position = [coords.x, coords.y - camera.position.y / 2, 0];

    // position = [20, 0, 0];

    return (
        <IconSurfaceFadeContext.Provider value={fadeMatrix}>
            <group visible={active} scale={[20, 20, 20]} ref={meshRef}>
                <WorkPreviewFade uniforms={reveal} edgeFade={false}>
                {coffee ? <CoffeeModel material={groupMaterial} /> : browser ? <BrowserModel material={groupMaterial} active={active} /> : <GltfModel url={url} material={groupMaterial} />}
                {interactive && <InteractiveAccessories material={groupMaterial} />}
                {frontend && <FrontendAccessories material={groupMaterial} />}
                </WorkPreviewFade>
                <ShadowDrop />
            </group>
        </IconSurfaceFadeContext.Provider>
    );
}

export function GltfModel({ url, material }: any) {
    const { nodes, materials } = useGLTF(url) as { nodes: any; materials: any };
    const surface = useFadedIconSurface(materials.normal);
    return <>
        <mesh geometry={nodes.model.geometry} material={surface} castShadow receiveShadow />
        <mesh geometry={nodes.edge.geometry} castShadow receiveShadow>
            <shaderMaterial {...material} uniforms={{ ...material.uniforms, myPosition: { value: new Vector3(10, 0, 0) } }} />
        </mesh>
    </>;
}
