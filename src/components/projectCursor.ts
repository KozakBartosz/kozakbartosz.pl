type ProjectCursorEdge = { button: Element; x: number; y: number };
type Listener = (edge: ProjectCursorEdge | null) => void;

const listeners = new Set<Listener>();
let currentEdge: ProjectCursorEdge | null = null;

export function updateProjectCursor(edge: ProjectCursorEdge | null) {
    if (!edge && !currentEdge) return;
    currentEdge = edge;
    listeners.forEach(listener => listener(edge));
}

export function subscribeToProjectCursor(listener: Listener) {
    listeners.add(listener);
    listener(currentEdge);
    return () => { listeners.delete(listener); };
}
