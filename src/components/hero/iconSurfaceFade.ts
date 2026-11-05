import { Color, Material, Matrix4 } from 'three';

export type IconFadeMatrix = { value: Matrix4 };

// Keep opaque depth testing and one draw per surface. The fade is interpolated
// from vertices; hidden fragments skip the PBR lighting work altogether.
export function createIconSurfaceMaterial(source: Material, matrix: IconFadeMatrix): Material {
    const material = source.clone();
    const background = new Color(0x090f0e).convertSRGBToLinear();
    material.onBeforeCompile = shader => {
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
    material.customProgramCacheKey = () => 'icon-opaque-surface-fade-v1';
    return material;
}
