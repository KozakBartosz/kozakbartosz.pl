// Ignore commented-out entry points in the contour shader.
const main = /^[ \t]*void\s+main\s*\(\s*(?:void)?\s*\)/m;

export function workPreviewVertex(source: string) {
    return `varying vec4 workClipPosition;
` + source.replace(main, 'void workOriginalMain()') + `
void main() {
    workOriginalMain();
    workClipPosition = gl_Position;
}`;
}
export function workPreviewFragment(source: string, edgeFade = true, opaque = false) {
    return `// Reconstruct normalized screen coordinates for the current render target.
varying vec4 workClipPosition;
uniform vec4 workBounds;
uniform float workContour;
uniform vec4 workRevealBounds;
uniform float workReveal;
` + source.replace(main, 'void workOriginalMain()') + `
void main() {
    if (workReveal <= 0.0001) discard;
    ${edgeFade ? '' : 'if (workReveal >= 0.9999) { workOriginalMain(); return; }'}
    vec2 point = workClipPosition.xy / workClipPosition.w * 0.5 + 0.5;
    ${edgeFade ? `
    vec2 extent = max(workBounds.zw - workBounds.xy, vec2(0.001));
    vec2 edge = min(point - workBounds.xy, workBounds.zw - point) / extent;
    // A spatial light band, like the scene's bottom fade, mirrored horizontally.
    // Faces and screens fade out; only the contour emits the bright leading band.
    float fade = smoothstep(0.0, 0.055, edge.x) * smoothstep(0.0, 0.08, edge.y);
    if (fade < 0.001) discard;
    ` : ''}
    float scan = 1.0;
    vec3 scanLight = vec3(0.0);
    if (workReveal < 0.9999) {
        float revealHeight = max(workRevealBounds.w - workRevealBounds.y, 0.001);
        float localY = (point.y - workRevealBounds.y) / revealHeight;
        float boundary = mix(1.08, -0.12, workReveal);
        float distanceToScan = localY - boundary;
        scan = smoothstep(-0.012, 0.012, distanceToScan);
        if (scan <= 0.001) discard;
        float core = 1.0 - smoothstep(0.0, 0.028, abs(distanceToScan));
        float trail = (1.0 - smoothstep(0.025, 0.18, distanceToScan)) * step(0.0, distanceToScan);
        vec3 magenta = vec3(1.0, 0.0, 0.6392) * 1.5;
        vec3 green = vec3(0.0, 1.0, 0.0) * 2.0;
        scanLight = (magenta + green) * (core * 5.0 + trail * 1.4);
    }
    ${opaque ? `
    // Fade coverage while keeping solid panels in the opaque depth pass.
    if (scan < 1.0 && scan <= fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))))) discard;
    ` : ''}
    workOriginalMain();
    ${edgeFade ? `float band = 1.0 - smoothstep(0.015, 0.055, abs(edge.x - 0.065));
    vec3 edgeLight = vec3(0.72, 1.0, 0.86) * band * 1.1 * workContour;
    gl_FragColor.rgb = (gl_FragColor.rgb + edgeLight) * fade;
    gl_FragColor.a *= fade;
    ` : ''}
    gl_FragColor.rgb += scanLight * workContour;
    ${opaque ? '' : 'gl_FragColor.a *= scan;'}
}`;
}
