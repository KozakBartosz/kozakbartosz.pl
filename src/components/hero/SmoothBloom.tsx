import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposerContext } from '@react-three/postprocessing';
import { useCallback, useContext, useMemo, useRef } from 'react';
import { ShaderMaterial, Uniform, Vector2 } from 'three';

// Four bilinear reads implement a 3x3 [1, 2, 1] tent filter. Apply it
// before the nonlinear luminance threshold so subpixel contour coverage does
// not turn into uneven glow. The scene itself remains sharp; no extra pass or
// render target is needed.
const luminanceShader = `
#include <common>
#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D inputBuffer;
#else
uniform lowp sampler2D inputBuffer;
#endif
uniform vec2 bloomTexelSize;
uniform float threshold;
uniform float smoothing;
varying vec2 vUv;
void main() {
    vec2 offset = bloomTexelSize * 0.5;
    vec3 color = (
        texture2D(inputBuffer, vUv + vec2(-offset.x, -offset.y)).rgb +
        texture2D(inputBuffer, vUv + vec2( offset.x, -offset.y)).rgb +
        texture2D(inputBuffer, vUv + vec2(-offset.x,  offset.y)).rgb +
        texture2D(inputBuffer, vUv + vec2( offset.x,  offset.y)).rgb
    ) * 0.25;
    float luminance = linearToRelativeLuminance(color);
    float contribution = smoothstep(threshold, threshold + smoothing, luminance);
    gl_FragColor = vec4(color * contribution, contribution);
}
`;

export const SmoothBloom = () => {
    const effect = useRef<{ luminanceMaterial: ShaderMaterial }>(null!);
    const { composer } = useContext(EffectComposerContext);
    const texelSize = useMemo(() => new Vector2(1, 1), []);

    const originalShader = useRef('');
    // The installed Bloom wrapper recreates its effect on rerender. Configure
    // each new instance via its ref, including after viewport/context changes.
    const configure = useCallback((instance: { luminanceMaterial: ShaderMaterial } | null) => {
        if (effect.current) {
            const material = effect.current.luminanceMaterial;
            material.fragmentShader = originalShader.current;
            delete material.uniforms.bloomTexelSize;
            material.needsUpdate = true;
        }
        effect.current = instance!;
        if (instance) {
            const material = instance.luminanceMaterial;
            originalShader.current = material.fragmentShader;
            material.uniforms.bloomTexelSize = new Uniform(texelSize);
            material.fragmentShader = luminanceShader;
            material.needsUpdate = true;
        }
    }, [texelSize]);

    // After SceneResolution (0.5), before composer.render (1). Read the actual
    // source dimensions so resize and the scene pixel cap keep the filter 1px wide.
    useFrame(() => {
        texelSize.set(1 / composer.inputBuffer.width, 1 / composer.inputBuffer.height);
    }, 0.75);

    // resolutionScale is supported by this installed constructor, but missing
    // from the old React wrapper's prop declarations.
    const resolution = { resolutionScale: 1 };
    return <Bloom ref={configure} {...resolution} intensity={45}
        luminanceThreshold={0.005} luminanceSmoothing={10} kernelSize={3} />;
};
