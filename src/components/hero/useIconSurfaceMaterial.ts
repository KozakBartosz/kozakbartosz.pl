import { useGLTF } from '@react-three/drei';
import { Material } from 'three';

// Reuse the actual GLTF material so procedural models and the monitor share
// the same PBR shader, linear base color, metalness, and roughness.
export function useIconSurfaceMaterial(): Material {
    const { materials } = useGLTF('/models/icon1.glb') as unknown as {
        materials: { normal: Material };
    };
    return materials.normal;
}
