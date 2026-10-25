// Pixel-space SDF: a circle extends into a round-ended capsule, then morphs into a link box.
export const cursorVertexShader = `
    varying vec2 vCursorUv;
    void main() {
        vCursorUv = position.xy * 0.5 + 0.5;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

export const cursorFragmentShader = `
    varying vec2 vCursorUv;
    uniform vec2 uResolution;
    uniform vec2 uCenter;
    uniform vec2 uHalfSize;
    uniform float uAngle;
    uniform float uStretch;
    uniform float uMorph;
    uniform float uOpacity;
    uniform float uPress;
    uniform float uOutline;
    uniform float uInvert;

    float roundedBox(vec2 p, vec2 halfSize, float radius) {
        vec2 q = abs(p) - halfSize + radius;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
    }

    void main() {
        // UVs map the actual drawing buffer to CSS pixels, including fractional DPR.
        vec2 pixel = vec2(vCursorUv.x, 1.0 - vCursorUv.y) * uResolution;
        vec2 p = pixel - uCenter;
        float angle = uAngle;
        float c = cos(angle), s = sin(angle);
        p = mat2(c, -s, s, c) * p;
        // Extend only the segment; keep its thickness and round end caps unchanged.
        float motion = uStretch * (1.0 - uMorph);
        vec2 size = uHalfSize;
        size.x += motion * 90.0;
        size *= 1.0 - 0.12 * uPress * (1.0 - uMorph);
        float radius = mix(min(size.x, size.y), 5.0, uMorph);
        float distance = roundedBox(p, size, radius);
        float fill = 1.0 - smoothstep(-0.8, 0.8, distance);
        // A crisp 1.5px stroke, independent from the translucent interior.
        float rim = 1.0 - smoothstep(0.5, 1.25, abs(distance));
        float glow = exp(-abs(distance) * 0.3) * 0.1;
        float gradient = clamp(p.x / max(size.x * 2.0, 1.0) + 0.5, 0.0, 1.0);
        vec3 accent = mix(vec3(0.0, 0.639216, 1.0), vec3(0.0, 1.0, 0.639216), gradient);
        // Hue compositing preserves backdrop luminosity: dark areas stay dark.
        vec3 fillColor = mix(vec3(1.0, 0.0, 0.65), vec3(1.0), uInvert);
        vec3 color = mix(fillColor, accent, uOutline);
        float press = smoothstep(0.0, 1.0, uPress);
        // Keep hue above the inversion pass; strengthen it on press to remove red.
        float hueAlpha = mix(0.7, 1.0, press);
        float fillAlpha = fill * mix(hueAlpha, press, uInvert);
        float outlineAlpha = max(rim * 0.9, glow);
        float alpha = mix(fillAlpha, outlineAlpha, uOutline) * uOpacity;
        if (alpha < 0.0005) discard;
        gl_FragColor = vec4(color, alpha);
    }
`;
