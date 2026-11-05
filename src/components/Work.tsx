import styled from '@emotion/styled';
import { MutableRefObject, PointerEvent, RefObject, useEffect, useRef, useState } from 'react';
import { SectionSymbol } from './SectionSymbol';
import { Arrow } from './Arrow';
import { cursorConfig } from './cursorConfig';
import { WorkCarousel, workProjectIndex } from './workCarousel';
import { useRouter } from 'next/router';
import { projectViewTransition } from './projectViewTransition';

type ProjectLink = { label: string; href: string; kind: 'Website' | 'Source code' };
type Project = { name: string; type: string; description: string; links: ProjectLink[] };

const projects: Project[] = [
    { name: 'Vescape', type: 'Mobile app', links: [{ label: 'vescape.app', href: 'https://vescape.app', kind: 'Website' }, { label: 'GitHub', href: 'https://github.com/vescape-app/vescape', kind: 'Source code' }], description: 'A companion app for electric skateboard rides. Board data, ride tracking, and everything you need on the go.' },
    { name: 'Braniborska', type: 'Website', links: [{ label: 'braniborska.pl', href: 'https://braniborska.pl', kind: 'Website' }], description: 'A responsive website for Braniborska, bringing its space and services together in one clear, easy-to-explore experience.' },
    { name: 'Wyciszamy', type: '3D configurator', links: [{ label: 'wyciszamy.net', href: 'https://wyciszamy.net', kind: 'Website' }], description: 'An interactive way to explore acoustic panels. Arrange shapes and see how they come together in 3D.' },
    { name: 'RTS Game', type: 'Work in progress', links: [{ label: 'GitHub', href: 'https://github.com/Code-Cooking-Team/Medieval', kind: 'Source code' }], description: 'An open-source game in the making. A space to experiment with real-time 3D, interaction, and playful ideas.' }
];

export type WorkProps = {
    active: number;
    setActive: (index: number) => void;
    previewRef: RefObject<HTMLDivElement>;
    carouselRef: MutableRefObject<WorkCarousel>;
};

export const Work = ({ active, setActive, previewRef, carouselRef }: WorkProps) => {
    const router = useRouter();
    const sectionRef = useRef<HTMLElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const routePosition = useRef<{ x: number; y: number } | null>(null);
    const project = projects[active];
    const openProject = (index: number) => {
        const key = index === 0 ? 'vescape' : index === 1 ? 'braniborska' : null;
        if (!key) {
            window.location.assign(projects[index].links[0].href);
            return;
        }
        projectViewTransition(() => router.push({
            pathname: router.pathname,
            query: { project: key },
            hash: 'work',
        }, undefined, { shallow: true, scroll: false }), 'open');
    };
    const moveProject = (step: number) => {
        const carousel = carouselRef.current;
        if (carousel.dragging) return;
        carousel.target = Math.round(carousel.target) + step;
        setActive(workProjectIndex(carousel.target));
    };
    const [dragging, setDragging] = useState(false);






    const gesture = useRef<{
        id: number; x: number; y: number; position: number; target: number;
        travel: number; horizontal: boolean; lastX: number; lastTime: number; velocity: number;
    } | null>(null);

    const endDrag = (event: PointerEvent<HTMLDivElement>, commit: boolean) => {
        const drag = gesture.current;
        if (!drag || drag.id !== event.pointerId) return;
        gesture.current = null;
        const carousel = carouselRef.current;
        if (drag.horizontal) {
            // Velocity helps short flicks finish; a paused drag uses its position.
            const velocity = event.timeStamp - drag.lastTime < 100 ? drag.velocity : 0;
            carousel.target = commit
                ? Math.round(carousel.position + Math.max(-.45, Math.min(.45, velocity * 120)))
                : drag.target;
            carousel.dragging = false;
            setActive(workProjectIndex(carousel.target));
        }
        setDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };

    useEffect(() => {
        const carousel = carouselRef.current;
        const cancel = () => {
            gesture.current = null;
            if (carousel.dragging) {
                carousel.dragging = false;
                carousel.target = Math.round(carousel.position);
                setActive(workProjectIndex(carousel.target));
                setDragging(false);
            }
        };
        window.addEventListener('blur', cancel);
        return () => {
            window.removeEventListener('blur', cancel);
            gesture.current = null;
            carousel.dragging = false;
        };
    }, [carouselRef, setActive]);

    useEffect(() => {
        const section = sectionRef.current;
        const button = section?.querySelector<HTMLButtonElement>('ol button[aria-pressed="true"]');
        const caption = section?.querySelector<HTMLElement>('.preview-caption');
        if (!section || !button || !caption) return;
        let frame = 0;
        let disposed = false;
        const transitionStart = performance.now();
        let previousTime = transitionStart;
        const update = (time: number) => {
            frame = 0;
            const origin = section.getBoundingClientRect();
            const start = button.getBoundingClientRect();
            const end = caption.getBoundingClientRect();
            const targetX = start.right - origin.left;
            const targetY = start.top + start.height / 2 - origin.top;
            const dt = Math.min((time - previousTime) / 1000 || 1 / 60, cursorConfig.maxFrameDelta);
            previousTime = time;
            const progress = Math.min(1, (time - transitionStart) / (cursorConfig.hoverTransitionDuration * 1000));
            const recovery = progress * progress * (3 - 2 * progress);
            const speed = cursorConfig.hoverTransitionSpeed + (cursorConfig.followSpeed - cursorConfig.hoverTransitionSpeed) * recovery;
            const ease = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1 - Math.exp(-speed * dt);
            const position = routePosition.current || { x: targetX, y: targetY };
            position.x += (targetX - position.x) * ease;
            position.y += (targetY - position.y) * ease;
            routePosition.current = position;
            const { x, y } = position;
            const endX = origin.width / 2;
            const endY = end.bottom - origin.top;
            const third = (endX - x) / 3;
            const firstBend = x + third;
            const secondBend = x + third * 2;
            pathRef.current?.setAttribute('d', `M${x},${y} H${firstBend} L${secondBend},${endY} H${endX}`);
            if (!disposed && Math.abs(x - targetX) + Math.abs(y - targetY) > .05) frame = requestAnimationFrame(update);
        };
        const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(update); };
        const observer = new ResizeObserver(schedule);
        [section, button, caption].forEach(element => observer.observe(element));
        window.addEventListener('resize', schedule);
        document.fonts.ready.then(schedule);
        schedule();
        return () => {
            disposed = true;
            observer.disconnect();
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', schedule);
        };
    }, [active]);

    return <Wrapper>
        <section id="work" ref={sectionRef} aria-labelledby="work-title" tabIndex={-1}>
            <svg className="project-route" aria-hidden="true">
                <defs><linearGradient id="work-route-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00ffa3" /><stop offset="100%" stopColor="#00a3ff" />
                </linearGradient></defs>
                <path pathLength="1" ref={pathRef} fill="none" stroke="url(#work-route-gradient)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <div className="work-copy">
                <p className="work-label"><span>01</span><i />Work</p>
                <h2 id="work-title" className="section-title">
                    <span className="desktop-work-title">Selected <span className="heading-accent">projects</span></span>
                    <span className="mobile-project-title" aria-live="polite">{project.name}</span>
                </h2>
                <div className="work-marker" data-section-marker aria-hidden="true"><SectionSymbol section="work" /></div>
                <ol aria-label="Select a project">
                    {projects.map((item, index) => <li key={item.name}>
                        <button type="button" aria-pressed={active === index} aria-controls="work-preview"
                            onPointerEnter={() => { if (!carouselRef.current.dragging) setActive(index); }} onFocus={() => setActive(index)} onClick={() => openProject(index)}>
                            <span className="project-number">0{index + 1}</span>
                            <span className="project-name">{item.name}</span>
                            <span className="project-row-arrow" aria-hidden="true"><Arrow /></span>
                        </button>
                    </li>)}
                </ol>
                <p className="work-hint">A few things I’ve brought to life.</p>
            </div>
            <div className="work-preview" id="work-preview" role="region" aria-label={`${project.name} — 3D preview`}>
                <div className="preview-caption" aria-live="polite"><span>0{active + 1} / 04</span><span>{project.type}</span></div>
                <div className="model-stage" ref={previewRef} role="group" tabIndex={0}
                    aria-label="Project carousel" aria-keyshortcuts="ArrowLeft ArrowRight" data-dragging={dragging}
                    onPointerDown={event => {
                        if (!event.isPrimary || event.button !== 0 || gesture.current) return;
                        const carousel = carouselRef.current;
                        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY,
                            position: carousel.position, target: carousel.target,
                            travel: Math.max(160, event.currentTarget.clientWidth * .7), horizontal: false,
                            lastX: event.clientX, lastTime: event.timeStamp, velocity: 0 };
                        event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerMove={event => {
                        const drag = gesture.current;
                        if (!drag || drag.id !== event.pointerId) return;
                        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
                        if (!drag.horizontal) {
                            if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
                            if (Math.abs(dy) > Math.abs(dx)) { endDrag(event, false); return; }
                            drag.horizontal = true;
                            carouselRef.current.dragging = true;
                            setDragging(true);
                        }
                        const elapsed = Math.max(1, event.timeStamp - drag.lastTime);
                        drag.velocity = -(event.clientX - drag.lastX) / drag.travel / elapsed;
                        drag.lastX = event.clientX; drag.lastTime = event.timeStamp;
                        carouselRef.current.position = drag.position - dx / drag.travel;
                        setActive(workProjectIndex(carouselRef.current.position));
                    }}
                    onPointerUp={event => endDrag(event, true)}
                    onPointerCancel={event => endDrag(event, false)}
                    onLostPointerCapture={event => endDrag(event, false)}
                    onKeyDown={event => {
                        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                        event.preventDefault();
                        moveProject(event.key === 'ArrowRight' ? 1 : -1);
                    }}>
                    <button className="carousel-arrow carousel-previous" type="button" aria-label="Previous project"
                        onPointerDown={event => event.stopPropagation()} onClick={() => moveProject(-1)}>
                        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m14 5-7 7 7 7" /></svg>
                    </button>
                    <button className="carousel-arrow carousel-next" type="button" aria-label="Next project"
                        onPointerDown={event => event.stopPropagation()} onClick={() => moveProject(1)}>
                        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m10 5 7 7-7 7" /></svg>
                    </button>
                </div>
                <div className="project-details">
                    <p>{project.description}</p>
                    <div className="project-actions">
                        <div className="project-external-links">
                            {project.links.map(link => <a key={link.href} className="project-external-link" href={link.href} target="_blank" rel="noopener noreferrer"
                                aria-label={`${project.name} — ${link.kind}: ${link.label} (opens in a new tab)`}>
                                <span><small>{link.kind}</small><span>{link.label}</span></span>
                                <span className="project-link-arrow" aria-hidden="true"><Arrow /></span>
                            </a>)}
                        </div>
                        <button className="project-link" type="button" onClick={() => openProject(active)}>
                            <span className="project-link-copy"><small>{project.name}</small><span className="project-link-name">{active < 2 ? 'Read more' : 'Open project'}</span></span>
                            <span className="project-link-arrow" aria-hidden="true"><Arrow /></span>
                        </button>
                    </div>
                </div>
            </div>
        </section>

    </Wrapper>;
};

const Wrapper = styled.div`
    position: relative;
    section { position: relative; display: grid; grid-template-columns: 1fr 1fr; align-items: center; align-content: center; min-height: 102vh; min-height: 102svh; padding-block: clamp(7.2rem, 10svh, 14rem); }
    .work-copy { align-self: stretch; display: flex; flex-direction: column; padding: 0 0 0 12rem; min-width: 0; }
    .work-label { display: flex; align-items: center; gap: 1.8rem; margin: 0 0 1.8rem; color: #aabfbd; font-size: 1.2rem; line-height: 1.6; letter-spacing: .18em; text-transform: uppercase; }
    .work-label span { color: #00a3ff; letter-spacing: .06em; }
    .work-label i { width: 3.2rem; height: 1px; background: linear-gradient(90deg, #00a3ff, #00ffa3); }
    .mobile-project-title { display: none; }
    .section-title { font-size: clamp(5.4rem, 5.4vw, 10rem); margin-bottom: clamp(2rem, 3svh, 4rem); }
    .work-marker { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2; display: grid; place-items: center; width: 4.4rem; height: 4.4rem; }
    .work-marker svg { width: 3.2rem; height: 3.2rem; stroke-width: 1.8; filter: drop-shadow(0 0 8px rgba(0,163,255,.45)); }
    ol { list-style: none; padding: 0; margin: 0; }
    li { display: flex; position: relative; align-items: stretch; }
    ol button { min-height: clamp(5.4rem, 7svh, 8rem); font: inherit; color: #91a4a1; background: none; border: 0; padding: 1.4rem 2.2rem 1.4rem 1.6rem; margin-left: -1.6rem; display: flex; align-items: center; gap: 2.4rem; text-align: left; cursor: pointer; transition: color 250ms ease; max-width: calc(100% - 5.6rem); }
    ol button:hover, ol button[aria-pressed='true'] { color: #f2f5f4; }
    .project-row-arrow { flex-shrink: 0; font-size: 1.8rem; color: #00a3ff; opacity: 0; transition: opacity 200ms ease; }
    ol button:hover .project-row-arrow, ol button:focus-visible .project-row-arrow { opacity: 1; }
    button:focus-visible { outline: 2px solid #00a3ff; outline-offset: 5px; }
    .project-number { font-size: 1.1rem; font-variant-numeric: tabular-nums; letter-spacing: .12em; color: #8ea9a4; }
    ol button[aria-pressed='true'] .project-number { color: #00e4c3; }
    .project-name { font-size: clamp(2.4rem, 2.45vw, 4.4rem); font-weight: 300; letter-spacing: -.035em; line-height: 1.2; }
    .project-route { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
    .work-hint { margin: 2.4rem 0 0; color: #91a4a1; font-size: 1.3rem; letter-spacing: .04em; }
    .work-preview { min-width: 0; height: min(78svh, 84rem); min-height: 48rem; display: flex; flex-direction: column; padding-inline: clamp(3.2rem, 4vw, 8rem); }
    .preview-caption { display: flex; align-items: center; justify-content: space-between; gap: 2rem; color: #aabfbd; font-size: 1.2rem; line-height: 1.6; letter-spacing: .16em; text-transform: uppercase; padding-bottom: 1.6rem; border-bottom: 1px solid #24504e; }
    .preview-caption > span:first-child { color: #00d4d0; }
    .model-stage { flex: 1; min-height: 22rem; position: relative; touch-action: pan-y; user-select: none; cursor: grab; }
    .model-stage[data-dragging='true'] { cursor: grabbing; }
    .model-stage:focus-visible { outline: 1px solid #00a3ff; outline-offset: -4px; }
    .carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; display: grid; place-items: center; width: 4.4rem; height: 4.4rem; padding: 0; border: 0; background: transparent; color: #00a3ff; cursor: pointer; transition: color 200ms ease, background-color 200ms ease; }
    .carousel-previous { left: 0; }
    .carousel-next { right: 0; }
    .carousel-arrow:hover, .carousel-arrow:focus-visible { color: #00ffa3; background-color: rgba(0, 163, 255, .07); }
    .project-details { border-top: 1px solid #24504e; padding-top: 1.8rem; }
    .project-details p { color: #b8cbc7; font-size: clamp(1.5rem, 1.1vw, 1.8rem); line-height: 1.65; min-height: 4.95em; max-width: var(--section-column-width); margin: 0 0 1.8rem; }
    .project-link { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 1.6rem; width: 100%; min-height: 10.4rem; padding: 2.2rem 2.4rem; border: 0; border-bottom: 1px solid #24504e; font-family: inherit; text-align: left; cursor: pointer; background: none; color: #dce5e3; transition: background-color 200ms ease; }
    .project-link-copy { display: flex; flex-direction: column; gap: .5rem; min-width: 0; }
    .project-link-name { font-size: clamp(1.3rem, 1.1vw, 1.6rem); line-height: 1.5; }
    .project-link-arrow { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 2rem; height: 2rem; color: #00a3ff; font-size: 2rem; line-height: 1; transition: transform 200ms ease; }
    .project-link:hover, .project-link:focus-visible { background-color: rgba(0, 163, 255, .07); }
    .project-link:focus-visible { outline-offset: -2px; }
    .project-link:hover .project-link-arrow { transform: translate(3px, -3px); }
    .project-actions { height: 13.2rem; display: grid; grid-template-rows: minmax(0, 1fr); grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); border-top: 1px solid #24504e; }
    .project-external-links { min-height: 0; display: flex; flex-direction: column; border-right: 1px solid #24504e; }
    .project-external-link { position: relative; flex: 1 1 0; display: flex; align-items: center; justify-content: space-between; gap: 1.6rem; min-width: 0; min-height: 0; padding: 1.2rem 2.4rem; border-bottom: 1px solid #24504e; background: none; -webkit-text-fill-color: currentColor; text-shadow: none; color: #dce5e3; transition: background-color 200ms ease; }
    .project-external-link > span:first-of-type { display: flex; flex-direction: column; gap: .5rem; min-width: 0; }
    .project-link-copy small, .project-external-link small { color: #6e9692; font-size: .9rem; line-height: 1.2; letter-spacing: .14em; text-transform: uppercase; }
    .project-external-link > span:first-of-type > span { font-size: clamp(1.3rem, 1.1vw, 1.6rem); line-height: 1.5; overflow-wrap: anywhere; }
    .project-external-link:hover, .project-external-link:focus-visible { background-color: rgba(0, 163, 255, .07); text-shadow: none; }
    .project-external-link:focus-visible { outline-offset: -2px; }
    .project-external-link:hover .project-link-arrow { transform: translate(3px, -3px); }
    @media (min-width: 1000px) {
        .work-copy {
            width: 100%;
            max-width: calc(var(--section-column-width) + var(--section-gutter) + 12rem);
            justify-self: end;
            padding-left: 12rem;
            padding-right: var(--section-gutter);
        }
        .work-preview {
            width: 100%;
            max-width: calc(var(--section-column-width) + var(--section-gutter) * 2);
            justify-self: start;
            padding-inline: var(--section-gutter);
        }
    }
    @media (max-width: 1199px) and (min-width: 1000px) { ol button { gap: 1.6rem; } }
    @media (max-width: 999px) {
        section { grid-template-columns: 1fr; padding-block: 6rem; }
        .work-copy { padding: 0 clamp(3.2rem, 6vw, 8rem); }
        .section-title { font-size: clamp(5.6rem, 12vw, 9rem); margin-bottom: 2.4rem; }
        .work-marker, .project-route, ol, .work-hint, .desktop-work-title { display: none; }
        .mobile-project-title { display: block; min-height: 2em; }
        .section-title { font-size: clamp(4.4rem, 10vw, 7rem); margin-bottom: 0; }
        li { min-height: 6.4rem; border-bottom: 1px solid #24504e; }
        ol button { width: 100%; max-width: none; padding: 1.6rem 0; margin-left: 0; }
        .project-name { font-size: clamp(2.4rem, 5vw, 3.6rem); }
        .work-preview { height: auto; min-height: 0; padding: 2.4rem clamp(3.2rem, 6vw, 8rem) 0; }
        .model-stage { height: clamp(28rem, 45svh, 42rem); min-height: 0; flex: auto; }
    }
    @media (max-width: 480px) {
        .project-link { padding-inline: 1.4rem; }
        .project-external-link { padding-inline: 1.4rem; gap: 1rem; }
    }
`;
