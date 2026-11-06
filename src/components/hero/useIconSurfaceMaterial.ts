import { useGLTF } from '@react-three/drei';
import { Material } from 'three';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { createIconSurfaceMaterial, IconFadeMatrix } from './iconSurfaceFade';

export const IconSurfaceFadeContext = createContext<IconFadeMatrix | null>(null);

export function useFadedIconSurface(source: Material, fresnel = true): Material {
    const matrix = useContext(IconSurfaceFadeContext);
    const material = useMemo(() => matrix || fresnel
        ? createIconSurfaceMaterial(source, matrix || undefined, fresnel)
        : source, [source, matrix, fresnel]);
    useEffect(() => () => { if (material !== source) material.dispose(); }, [material, source]);
    return material;
}

// Preserve the GLTF's PBR settings and add the shared neon rim on a local copy.
export function useIconSurfaceMaterial(fresnel = true): Material {
    const { materials } = useGLTF('/models/icon1.glb') as unknown as {
        materials: { normal: Material };
    };
    return useFadedIconSurface(materials.normal, fresnel);
}
