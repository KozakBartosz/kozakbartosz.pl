import { Color, Material, Matrix4 } from 'three';

export type IconFadeMatrix = { value: Matrix4 };

// Keep opaque depth testing and one draw per surface. The fade is interpolated
// from vertices; hidden fragments skip the PBR lighting work altogether.
export function createIconSurfaceMaterial(source: Material, matrix?: IconFadeMatrix, fresnel = true): Material {
    const material = source.clone();
    const background = new Color(0x090f0e).convertSRGBToLinear();
    material.onBeforeCompile = (shader, renderer) => {
        source.onBeforeCompile(shader, renderer);
        if (fresnel) shader.fragmentShader = shader.fragmentShader.replace('#include <output_fragment>', `
    vec3 edgeView = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
    float edgeFacing = abs(dot(normal, edgeView));
    float edgeDistance = edgeFacing - 0.14;
    float edgeAA = max(fwidth(edgeDistance) * 0.5, 0.025);
    float edgeGlow = 1.0 - smoothstep(-edgeAA, edgeAA, edgeDistance);
    outgoingLight += vec3(0.0, 0.47, 0.37) * edgeGlow;
    #include <output_fragment>
`);
        if (!matrix) return;
        shader.uniforms.iconFadeMatrix = matrix;
        shader.uniforms.iconFadeBackground = { value: background };
        shader.vertexShader = `uniform mat4 iconFadeMatrix;
varying float iconFade;
` + shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
    vec4 fadePosition = iconFadeMatrix * mvPosition;
    iconFade = (fadePosition.y - 10.0) * 0.005 + 4.5;
`);
        shader.fragmentShader = `uniform vec3 iconFadeBackground;
varying float iconFade;
` + shader.fragmentShader.replace('void main() {', `void main() {
    if (iconFade <= 0.0) discard;
`).replace('#include <dithering_fragment>', `#include <dithering_fragment>
    gl_FragColor.rgb = mix(
        linearToOutputTexel(vec4(iconFadeBackground, 1.0)).rgb,
        gl_FragColor.rgb, clamp(iconFade, 0.0, 1.0));
`);
    };
    material.customProgramCacheKey = () => `icon-surface-fresnel-cutoff:${fresnel}:${Boolean(matrix)}:${source.customProgramCacheKey()}`;
    return material;
}
