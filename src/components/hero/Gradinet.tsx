import { CanvasTexture, Color } from 'three';
import { useMemo } from 'react';

export const Gradient = () => {
    const opacity = 1; // Wartość przezroczystości (0 - 1)
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 3;
        canvas.height = 10;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(0, 1, 3, 8);
        return new CanvasTexture(canvas);
    }, [opacity]);

    const colors = useMemo(() => {
        const gradientColors = [];
        const colorCenter = new Color(0x041a15); // Kolor na górze
        const colorBottom = new Color(0x000000); // Kolor na dole

        // Generowanie gradientu kolorów wierzchołków
        for (let i = 0; i < 9; i++) {
            if (i >= 3 && i <= 5) {
                gradientColors.push(
                    colorCenter.r,
                    colorCenter.g,
                    colorCenter.b
                );
            } else {
                gradientColors.push(
                    colorBottom.r,
                    colorBottom.g,
                    colorBottom.b
                );
            }
        }

        return gradientColors;
    }, []);

    return (
        <mesh scale={[100, 0.7, 10]} position={[0, -12.8, 85.5]}>
            <planeGeometry args={[3, 3, 2, 2]} attach="geometry">
                <bufferAttribute
                    attachObject={['attributes', 'color']}
                    args={[new Float32Array(colors), 3]}
                />
            </planeGeometry>
            <meshBasicMaterial
                vertexColors={true}
                attach="material"
                color={0xffffff}
                opacity={1}
                transparent
                map={texture}
                alphaMap={texture}
            />
        </mesh>
    );
};
