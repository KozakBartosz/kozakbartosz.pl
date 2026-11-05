import { useGLTF } from '@react-three/drei';
import { Material } from 'three';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { createIconSurfaceMaterial, IconFadeMatrix } from './iconSurfaceFade';

export const IconSurfaceFadeContext = createContext<IconFadeMatrix | null>(null);

export function useFadedIconSurface(source: Material): Material {
    const matrix = useContext(IconSurfaceFadeContext);
    const material = useMemo(() => matrix ? createIconSurfaceMaterial(source, matrix) : source, [source, matrix]);
    useEffect(() => () => { if (material !== source) material.dispose(); }, [material, source]);
    return material;
}

// Preserve the GLTF's PBR settings. Section icons get a local fading copy;
// project previews keep the cached source and their own existing fade.
export function useIconSurfaceMaterial(): Material {
    const { materials } = useGLTF('/models/icon1.glb') as unknown as {
        materials: { normal: Material };
    };
    return useFadedIconSurface(materials.normal);
}
