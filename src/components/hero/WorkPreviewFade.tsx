import { ReactNode, useLayoutEffect, useMemo, useRef } from 'react';
import { Group } from 'three';
import { createWorkFadeMaterials, WorkFade } from './workFadeMaterials';

export function WorkPreviewFade({ uniforms, edgeFade = true, children }: { uniforms: WorkFade; edgeFade?: boolean; children: ReactNode }) {
    const group = useRef<Group>(null!);
    const binding = useMemo(() => createWorkFadeMaterials(uniforms, edgeFade), [uniforms, edgeFade]);
    useLayoutEffect(() => () => binding.dispose(), [binding]);
    // Reconcile R3F material attachments after commits, including a new screen
    // texture. Animation changes uniform values without visiting the scene graph.
    useLayoutEffect(() => { binding.sync(group.current); });
    return <group ref={group}>{children}</group>;
}
