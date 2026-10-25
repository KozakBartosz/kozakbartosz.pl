import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Color, Plane, PointLight, Raycaster, Vector2, Vector3 } from 'three';

// Two unshadowed lights: reuse the scene loop and allocate nothing per frame.
export const CursorLight = () => {
    const light = useRef<PointLight>(null);
    const secondLight = useRef<PointLight>(null);
    const depth = useRef(0);
    const active = useRef(false);
    const alternateColors = useRef(false);
    const colors = useMemo(() => ({
        blue: new Color('#00a3ff'),
        green: new Color('#00f0cf'),
        pink: new Color('#dfb4ff')
    }), []);
    const initialized = useRef(false);
    const { pointer, screen, ray, plane, target, offset, floorHit } = useMemo(() => ({
        pointer: new Vector2(),
        screen: new Vector2(),
        ray: new Raycaster(),
        plane: new Plane(new Vector3(0, 0, 1), -24),
        target: new Vector3(),
        offset: new Vector3(),
        floorHit: new Vector3()
    }), []);

    useEffect(() => {
        const finePointer = window.matchMedia('(any-pointer: fine)');
        const move = (event: PointerEvent) => {
            active.current = finePointer.matches && event.pointerType === 'mouse';
            if (!active.current) return;
            pointer.set(event.clientX, event.clientY);
        };
        const down = (event: PointerEvent) => {
            if (event.pointerType !== 'mouse' || event.button !== 0) return;
            move(event);
            alternateColors.current = true;
        };
        const up = (event: PointerEvent) => {
            if (event.button === 0) alternateColors.current = false;
        };
        const hide = () => {
            active.current = false;
            alternateColors.current = false;
        };
        const leave = (event: PointerEvent) => {
            if (!event.relatedTarget) hide();
        };
        const visibility = () => { if (document.hidden) hide(); };
        window.addEventListener('pointermove', move, { passive: true });
        window.addEventListener('pointerdown', down, { passive: true });
        window.addEventListener('pointerup', up, { passive: true });
        window.addEventListener('pointercancel', hide);
        document.addEventListener('pointerout', leave);
        window.addEventListener('blur', hide);
        document.addEventListener('visibilitychange', visibility);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerdown', down);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', hide);
            document.removeEventListener('pointerout', leave);
            window.removeEventListener('blur', hide);
            document.removeEventListener('visibilitychange', visibility);
        };
    }, [pointer]);

    useFrame(({ camera, size, clock }, delta) => {
        if (!light.current || !secondLight.current) return;
        const ease = 1 - Math.exp(-12 * Math.min(delta, 0.1));
        light.current.color.lerp(alternateColors.current ? colors.pink : colors.blue, ease);
        secondLight.current.color.lerp(alternateColors.current ? colors.pink : colors.green, ease);
        const time = clock.elapsedTime;
        const blend = (Math.sin(time * 0.9) + 1) * 0.5;
        // Double total power in pink mode, with each light ranging from 30% to 100%
        // of its peak so neither disappears during the crossfade.
        const peak = (alternateColors.current ? 1 : 0.5) / 1.3;
        light.current.intensity += ((active.current ? peak * (0.3 + 0.7 * blend) : 0) - light.current.intensity) * ease;
        secondLight.current.intensity += ((active.current ? peak * (1 - 0.7 * blend) : 0) - secondLight.current.intensity) * ease;
        if (!active.current) {
            initialized.current = false;
            if (Math.max(light.current.intensity, secondLight.current.intensity) < 0.001) {
                light.current.intensity = 0;
                secondLight.current.intensity = 0;
            }
            return;
        }
        // Project through the actual camera so the light also follows during scroll.
        // The hero canvas is fixed and fills the viewport; no layout reads needed.
        ray.setFromCamera(screen.set(
            (pointer.x / size.width) * 2 - 1,
            -(pointer.y / size.height) * 2 + 1
        ), camera);
        if (!ray.ray.intersectPlane(plane, target)) return;
        const baseDistance = ray.ray.origin.distanceTo(target);
        let safeDistance = baseDistance;
        // The mirror is at y=-13. Keep both lights above it while the
        // camera is above the floor; once it passes underneath, restore depth.
        // Move along the viewing ray, preserving the cursor's screen position.
        const clearance = -10;
        if (ray.ray.origin.y > clearance && ray.ray.direction.y < -0.0001) {
            const floorDistance = (-13 - ray.ray.origin.y) / ray.ray.direction.y;
            ray.ray.at(floorDistance, floorHit);
            // Match Mirror's finite 512×512 floor, centered at z=-170.
            // Beyond its edges the pointer no longer needs floor clearance.
            if (Math.abs(floorHit.x) <= 256 && floorHit.z >= -426 && floorHit.z <= 86) {
                safeDistance = Math.min(baseDistance,
                    (clearance - ray.ray.origin.y) / ray.ray.direction.y);
            }
        }
        if (!initialized.current) depth.current = safeDistance;
        else depth.current += (safeDistance - depth.current) * ease;
        // Never let smoothing carry the lights through the floor.
        depth.current = Math.min(depth.current, safeDistance);
        ray.ray.at(depth.current, target);
        offset.set(
            -(2 + Math.sin(time * 0.8) * 0.6 + Math.sin(time * 1.3) * 0.25),
            Math.sin(time * 1.05) * 1.2,
            0
        ).applyQuaternion(camera.quaternion);
        light.current.position.copy(target).add(offset);
        secondLight.current.position.copy(target).sub(offset);
        initialized.current = true;
    });

    return <>
        <pointLight ref={light} color="#00a3ff" intensity={0} distance={95} decay={2} castShadow={false} />
        <pointLight ref={secondLight} color="#00f0cf" intensity={0} distance={95} decay={2} castShadow={false} />
    </>;
};
