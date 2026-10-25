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
    uniform float uMaxExtension;
    uniform float uPressShrink;
    uniform float uCornerRadius;
    uniform vec3 uHueColor;
    uniform vec3 uAccentStart;
    uniform vec3 uAccentEnd;
    uniform float uHueOpacity;
    uniform float uOutlineOpacity;
    uniform float uGlowOpacity;

    float roundedBox(vec2 p, vec2 halfSize, float radius) {
        vec2 q = abs(p) - halfSize + radius;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
    }

    void main() {
        // UVs map the actual drawing buffer to CSS pixels, including fractional DPR.
        vec2 pixel = vec2(vCursorUv.x, 1.0 - vCursorUv.y) * uResolution;
        vec2 screenOffset = pixel - uCenter;
        vec2 p = screenOffset;
        float angle = uAngle;
        float c = cos(angle), s = sin(angle);
        p = mat2(c, -s, s, c) * p;
        // Anchor the front cap at the pointer; all extension falls behind it.
        float motion = uStretch * (1.0 - uMorph);
        vec2 size = uHalfSize;
        float shrink = 1.0 - uPressShrink * uPress * (1.0 - uMorph);
        float extension = motion * uMaxExtension * shrink;
        size *= shrink;
        size.x += extension;
        p.x += extension;
        float radius = mix(min(size.x, size.y), uCornerRadius, uMorph);
        float distance = roundedBox(p, size, radius);
        float fill = 1.0 - smoothstep(-0.8, 0.8, distance);
        // A crisp 1.5px stroke, independent from the translucent interior.
        float rim = 1.0 - smoothstep(0.5, 1.25, abs(distance));
        float glow = exp(-abs(distance) * 0.3) * uGlowOpacity;
        // Keep colors in screen space while the capsule turns into a link box.
        // Include the trailing extension when finding its horizontal center/span.
        float gradientWidth = abs(c) * size.x + abs(s) * size.y;
        float gradient = clamp((screenOffset.x + c * extension) /
            max(gradientWidth * 2.0, 1.0) + 0.5, 0.0, 1.0);
        vec3 accent = mix(uAccentStart, uAccentEnd, gradient);
        // Hue compositing preserves backdrop luminosity: dark areas stay dark.
        vec3 fillColor = mix(uHueColor, vec3(1.0), uInvert);
        vec3 color = mix(fillColor, accent, uOutline);
        float press = smoothstep(0.0, 1.0, uPress);
        // Keep hue above the inversion pass; strengthen it on press to remove red.
        float hueAlpha = mix(uHueOpacity, 1.0, press);
        float fillAlpha = fill * mix(hueAlpha, press, uInvert);
        float outlineAlpha = max(rim * uOutlineOpacity, glow);
        float alpha = mix(fillAlpha, outlineAlpha, uOutline) * uOpacity;
        if (alpha < 0.0005) discard;
        gl_FragColor = vec4(color, alpha);
    }
`;
