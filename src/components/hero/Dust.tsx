import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Vector2 } from 'three';
import { useReducedMotion } from '../useReducedMotion';
import { FOCUS_DEPTH, FOCUS_RANGE } from './depthOfField';
import { getHeroScrollOffset } from './consts';

const PARTICLE_COUNT = 320;

const vertexShader = `
    uniform float uTime;
    uniform float uFieldTop;
    uniform float uFieldHeight;
    uniform float uRenderHeight;
    uniform float uMaxPointSize;
    uniform float uFocusDepth;
    uniform float uFocusRange;
    attribute float aSize;
    attribute float aPhase;
    varying float vDefocus;
    varying float vOpacity;
    varying float vAngle;

    void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.32 + aPhase) * 4.0;
        p.z += sin(uTime * 0.22 + aPhase * 2.0) * 1.8;
        // Wrap only at the document edges, beyond the visible camera range.
        float drift = uTime * (0.85 + 0.30 * sin(aPhase));
        p.y = uFieldTop - mod(p.y * uFieldHeight - drift, uFieldHeight);
        vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
        float depth = max(1.0, -viewPosition.z);
        vDefocus = smoothstep(0.0, uFocusRange, abs(depth - uFocusDepth));
        // Transparent particles do not write scene depth. Match DOF here so
        // their blur follows their own depth, rather than the surface behind.
        float diameter = aSize * uRenderHeight * projectionMatrix[1][1] / depth;
        float spread = 1.0 + vDefocus * 2.8;
        gl_PointSize = clamp(diameter * spread, 1.0, uMaxPointSize);
        gl_Position = projectionMatrix * viewPosition;
        vAngle = aPhase + uTime * 0.025;
        vOpacity = (0.10 + 0.08 * sin(aPhase * 3.0))
            / (1.0 + vDefocus * 1.8);
        vOpacity *= smoothstep(10.0, 35.0, depth)
            * (1.0 - smoothstep(240.0, 350.0, depth));
    }
`;

const fragmentShader = `
    varying float vDefocus;
    varying float vOpacity;
    varying float vAngle;

    void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float c = cos(vAngle);
        float s = sin(vAngle);
        p = abs(mat2(c, -s, s, c) * p);
        // Intersection of three strips gives a regular six-sided aperture.
        float hex = max(p.x * 0.8660254 + p.y * 0.5, p.y);
        float softness = mix(0.20, 0.48, vDefocus);
        float alpha = (1.0 - smoothstep(0.70 - softness, 0.82, hex)) * vOpacity;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(0.025, 0.16, 0.11, alpha);
    }
`;

export const Dust = () => {
    const reducedMotion = useReducedMotion();
    const particles = useMemo(() => {
        // Stable distribution across reloads; no per-frame CPU particle loop.
        let seed = 73;
        const random = () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const sizes = new Float32Array(PARTICLE_COUNT);
        const phases = new Float32Array(PARTICLE_COUNT);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            positions.set([
                (random() - 0.5) * 220,
                // Stratify the full height; a gentle bias puts more dust up top.
                Math.pow((i + random()) / PARTICLE_COUNT, 1.25),
                -100 + random() * 195
            ], i * 3);
            sizes[i] = 0.10 + random() * 0.22;
            phases[i] = random() * Math.PI * 2;
        }
        return { positions, sizes, phases };
    }, []);
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uFieldTop: { value: 100 },
        uFieldHeight: { value: 170 },
        uRenderHeight: { value: 1 },
        uMaxPointSize: { value: 64 },
        uFocusDepth: { value: FOCUS_DEPTH },
        uFocusRange: { value: FOCUS_RANGE }
    }), []);
    const renderSize = useMemo(() => new Vector2(), []);
    const pageTravel = useMemo(() => ({ value: 0 }), []);

    useEffect(() => {
        const updateExtent = () => {
            const viewportHeight = window.innerHeight;
            const scrollHeight = Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight
            );
            pageTravel.value = getHeroScrollOffset(
                Math.max(0, scrollHeight - viewportHeight), viewportHeight
            );
        };
        const observer = new ResizeObserver(updateExtent);
        observer.observe(document.body);
        observer.observe(document.documentElement);
        window.addEventListener('resize', updateExtent);
        updateExtent();
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateExtent);
        };
    }, [pageTravel]);

    // After CameraEffects and the composer resolution cap, before rendering.
    useFrame(({ camera }, delta) => {
        if (!reducedMotion) uniforms.uTime.value += Math.min(delta, 0.05);
        // Cover the farthest particles' visible height above/below both ends.
        const padding = Math.max(55,
            (camera.position.z + 100) / camera.projectionMatrix.elements[5] + 20
        );
        uniforms.uFieldTop.value = 15 + padding;
        uniforms.uFieldHeight.value = pageTravel.value + padding * 2;
    }, 0.6);

    return (
        <points
            frustumCulled={false}
            raycast={() => null}
            onBeforeRender={(renderer) => {
                // The mirror renders at 512px; the composer uses its own size.
                // Point sizes are pixels in the current target, not the screen.
                const target = renderer.getRenderTarget();
                uniforms.uRenderHeight.value = target
                    ? target.height
                    : renderer.getDrawingBufferSize(renderSize).y;
            }}
        >
            <bufferGeometry>
                <bufferAttribute attachObject={['attributes', 'position']} args={[particles.positions, 3]} />
                <bufferAttribute attachObject={['attributes', 'aSize']} args={[particles.sizes, 1]} />
                <bufferAttribute attachObject={['attributes', 'aPhase']} args={[particles.phases, 1]} />
            </bufferGeometry>
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                transparent
                depthWrite={false}
                toneMapped={false}
            />
        </points>
    );
};
