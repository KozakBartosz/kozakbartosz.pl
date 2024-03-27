import { CanvasTexture, Color } from 'three';
import { useMemo } from 'react';

export const ShadowDrop = () => {
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

    return (
        <mesh
            scale={[100, 0.5, 10]}
            position={[0, -12.8, 85.5]}
            rotation={[0, Math.PI, 0]}
        ></mesh>
    );
};
