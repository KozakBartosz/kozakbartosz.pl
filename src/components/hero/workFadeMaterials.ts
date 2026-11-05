import { Group, Material, Mesh, ShaderMaterial, Vector4 } from 'three';
import { workPreviewFragment, workPreviewVertex } from './workPreviewShader';

export type WorkFade = { bounds: { value: Vector4 }; revealBounds?: { value: Vector4 }; reveal?: { value: number } };

export function createWorkFadeMaterials(uniforms: WorkFade, edgeFade = true) {
    const copies = new Map<Material, Material>();
    const sources = new Map<Material, Material>();
    const used = new Set<Material>();
    let root: Group | null = null;
    const wrap = (source: Material): Material => {
        source = sources.get(source) || source;
        used.add(source);
        if (copies.has(source)) return copies.get(source)!;
        const copy = source.clone();
        if (source instanceof ShaderMaterial && copy instanceof ShaderMaterial) copy.uniforms = { ...source.uniforms };
        const opaque = !edgeFade && !source.transparent;
        copy.transparent = !opaque;
        copy.onBeforeCompile = (shader, renderer) => {
            source.onBeforeCompile(shader, renderer);
            shader.uniforms.workBounds = uniforms.bounds;
            shader.uniforms.workRevealBounds = uniforms.revealBounds || uniforms.bounds;
            shader.uniforms.workReveal = uniforms.reveal || { value: 1 };
            shader.uniforms.workContour = { value: source instanceof ShaderMaterial ? 1 : 0 };
            shader.vertexShader = workPreviewVertex(shader.vertexShader);
            shader.fragmentShader = workPreviewFragment(shader.fragmentShader, edgeFade, opaque);
        };
        copy.customProgramCacheKey = () => `work-preview-fade:${edgeFade}:${opaque}:` + source.customProgramCacheKey();
        copies.set(source, copy);
        sources.set(copy, source);
        return copy;
    };
    return {
        sync(group: Group) {
            root = group;
            used.clear();
            group.traverse(object => {
                if (!(object instanceof Mesh)) return;
                if (Array.isArray(object.material)) {
                    object.material = object.material.map(wrap);
                } else object.material = wrap(object.material);
            });
            copies.forEach((copy, source) => {
                if (used.has(source)) return;
                copy.dispose();
                copies.delete(source);
                sources.delete(copy);
            });
        },
        dispose() {
            root?.traverse(object => {
                if (!(object instanceof Mesh)) return;
                const restore = (material: Material) => sources.get(material) || material;
                object.material = Array.isArray(object.material) ? object.material.map(restore) : restore(object.material);
            });
            copies.forEach(copy => copy.dispose());
            copies.clear();
            sources.clear();
            used.clear();
        }
    };
}
