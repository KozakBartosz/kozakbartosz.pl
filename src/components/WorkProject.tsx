/* eslint-disable @next/next/no-img-element -- Local media for the project case studies. */
import styled from '@emotion/styled';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MouseEvent, MutableRefObject, useEffect, useRef } from 'react';
import { Arrow } from './Arrow';
import { Footer } from './Footer';
import { SectionSymbol } from './SectionSymbol';
import { BrandMark } from './BrandMark';
import { ProjectStory } from './ProjectStory';
import { ProjectDetailList, SectionKicker, VisitProjectLink } from './ProjectCaseUI';
import { projectViewTransition } from './projectViewTransition';

const base = '/projects/vescape/';
const stack = [
    ['Application', 'Expo SDK 57', 'React Native 0.86 · Expo Router'],
    ['State & language', 'TypeScript', 'Zustand · Native state contracts'],
    ['Motion & graphics', 'Reanimated + Skia', 'Gauges · Charts · UI animation'],
    ['Spatial interface', 'Mapbox', 'Navigation · Community maps'],
    ['Native runtime', 'Kotlin + Swift', 'Custom vescape-core Expo module'],
    ['Companion & tooling', 'Wear OS + watchOS', 'Bun · Scripts · JS tests']
];
const github = 'https://github.com/vescape-app/vescape';

type StageProps = { anchor: MutableRefObject<HTMLDivElement | null>; rotation: MutableRefObject<number>; caption?: string; projectName?: string };
function ModelStage({ anchor, rotation, caption = 'Phone + Watch Mirror', projectName = 'Vescape' }: StageProps) {
    const drag = useRef<{ x: number; angle: number } | null>(null);
    return <div className="model-stage-wrap">
        <div ref={anchor} className="case-model" tabIndex={0} role="group" aria-label={`Interactive ${projectName} 3D preview. Drag to rotate or use arrow keys.`}
            onPointerDown={event => { if (event.button !== 0) return; drag.current = { x: event.clientX, angle: rotation.current }; event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerMove={event => { if (drag.current) rotation.current = drag.current.angle + (event.clientX - drag.current.x) * .008; }}
            onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
            onPointerCancel={() => { drag.current = null; }}
            onLostPointerCapture={() => { drag.current = null; }}
            onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.stopPropagation(); event.preventDefault(); rotation.current += event.key === 'ArrowLeft' ? -.2 : .2; } }} />
        <div className="stage-caption"><span>{caption}</span></div>
    </div>;
}
function Stack({ clinic = false, number }: { clinic?: boolean; number?: string }) {
    const items = clinic ? [
        ['Frontend', 'Next.js', 'A custom React website'],
        ['Content management', 'WroCMS', 'My own headless CMS'],
        ['Integration', 'Headless architecture', 'Content and presentation kept separate'],
        ['Interface', 'Responsive design', 'Desktop · Tablet · Mobile'],
    ] : stack;
    return <section className="stack-section" id="case-stack"><div className="section-heading"><SectionKicker number={number || (clinic ? '04' : '05')}>The toolkit</SectionKicker><h2>Across the <em>stack.</em></h2><p>{clinic ? <>A Next.js frontend. A headless content layer.<br />Designed and developed together.</> : <>A React Native interface. A native runtime.<br />A connected experience across devices.</>}</p></div><ProjectDetailList items={items} /></section>;
}
function ProjectEdgeRail({ projectKey = 'vescape' }: { projectKey?: string }) {
    const router = useRouter();
    const rail = useRef<HTMLElement>(null);
    useEffect(() => {
        const update = () => {
            const extent = document.documentElement.scrollHeight - window.innerHeight;
            const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(1, extent)));
            rail.current?.style.setProperty('--reading-progress', `${progress * 100}%`);
            rail.current?.style.setProperty('--reading-glow', String(Math.min(1, progress * 20, (1 - progress) * 20)));
            const label = rail.current?.querySelector('.edge-progress-label');
            if (label) label.textContent = `${Math.round(progress * 100)}%`;
        };
        const observer = new ResizeObserver(update);
        observer.observe(document.body);
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
        return () => { observer.disconnect(); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
    }, []);
    return <aside ref={rail} className="project-edge-rail" aria-label="Work section and reading progress">
        <Link href={{ pathname: '/', query: { selected: projectKey }, hash: 'work' }}><a className="edge-back" onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault();
            projectViewTransition(() => router.push({ pathname: '/', query: { selected: projectKey }, hash: 'work' }, undefined, { scroll: false }), 'close');
        }} aria-label="Back to work"><span aria-hidden="true"><Arrow direction="left" /></span><span className="edge-back-copy" aria-hidden="true">Back</span></a></Link>
        <div className="edge-marker"><SectionSymbol section="work" placement="project-rail" /></div>
        <div className="edge-lead work-track-before" aria-hidden="true" />
        <div className="edge-line work-track-after" aria-hidden="true"><span /></div>
        <span className="edge-progress-label" aria-label="Reading progress">0%</span>
    </aside>;
}

function WebsiteCase({ number = '04' }: { number?: string }) {
    return <section className="website-case"><div className="website-case-heading"><div><SectionKicker number={number}>The website</SectionKicker><h2>One identity.<br /><em>Beyond the app.</em></h2></div><div><p>I designed and built the marketing website alongside the application. The identity, typography and interface previews carry the same visual language from the product to the web.</p><VisitProjectLink href="https://vescape.app/" domain="vescape.app" /></div></div><figure className="website-case-preview"><figcaption><span className="website-frame-dots" aria-hidden="true"><i /><i /><i /></span><span>vescape.app</span><span>Website / Desktop</span></figcaption><img src={base + 'website.png'} alt="Vescape website homepage with the map background, phone and smartwatch interface previews" loading="lazy" /></figure></section>;
}

function scrollToProjectSection(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = link?.getAttribute('href');
    if (!hash || hash.length < 2) return;
    const section = document.getElementById(hash.slice(1));
    if (!section) return;

    event.preventDefault();
    if (location.hash !== hash) history.pushState(null, '', hash);
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
    section.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
}

export const WorkProject = ({ anchor, rotation, projectKey = 'vescape' }: {
    projectKey?: 'vescape' | 'braniborska';
    anchor: MutableRefObject<HTMLDivElement | null>;
    rotation: MutableRefObject<number>;
}) => {
    const router = useRouter();
    const clinic = projectKey === 'braniborska';
    useEffect(() => { rotation.current = 0; }, [projectKey, rotation]);
    const stage = { anchor, rotation, projectName: clinic ? 'Braniborska' : 'Vescape' };
    const switchProject = (event: MouseEvent<HTMLAnchorElement>, direction: 'open' | 'close') => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const href = event.currentTarget.getAttribute('href')!;
        projectViewTransition(() => router.push(href, undefined, { shallow: true, scroll: false }), direction);
    };
    const previousProject = clinic
        ? { number: '01', name: 'Vescape', href: '/?project=vescape', detail: 'Mobile app · React Native', direction: 'open' as const }
        : null;
    const nextProject = clinic
        ? { number: '03', name: 'Wyciszamy', href: '/?selected=wyciszamy#work', detail: '3D configurator · React · Three.js', direction: 'close' as const }
        : { number: '02', name: 'Braniborska', href: '/?project=braniborska', detail: 'Website · Next.js · WroCMS', direction: 'open' as const };
    const projectNavigation = (
        <nav className="project-title-nav" aria-label="Browse projects">
            {previousProject && <Link href={previousProject.href}><a onClick={event => switchProject(event, previousProject.direction)} aria-label={`Previous project: ${previousProject.name}`}><Arrow direction="left" /></a></Link>}
            <Link href={nextProject.href}><a onClick={event => switchProject(event, nextProject.direction)} aria-label={`Next project: ${nextProject.name}`}><Arrow direction="right" /></a></Link>
        </nav>
    );
    return <Page id="project-home" onClick={scrollToProjectSection}>
        <Head><title>{clinic ? 'Braniborska — Next.js & WroCMS / Bartosz Kozak' : 'Vescape — Design & development / Bartosz Kozak'}</title><meta name="description" content={clinic ? 'Braniborska Clinic: UX research, interface design, a custom Next.js website and my own headless CMS, WroCMS.' : 'Vescape project study: React Native interface, visual identity, native BLE architecture and interactive maps.'} /></Head>
        <ProjectEdgeRail projectKey={projectKey} />
        <header className="case-header">
            <Link href="/"><a className="case-signature" aria-label="Bartosz Kozak — Home"><BrandMark /></a></Link>
        </header>
        <main className="case-main case-container">
            <ProjectStory project={projectKey} projectNavigation={projectNavigation} model={<ModelStage {...stage} caption={clinic ? 'Next.js + WroCMS' : 'Phone + Watch Mirror'} />} stack={<Stack clinic={clinic} number={clinic ? '06' : '07'} />} website={<WebsiteCase number="06" />} />
            <section className="source-note"><span>Project references</span><a href={clinic ? 'https://www.braniborska.pl/' : 'https://vescape.app/'} target="_blank" rel="noreferrer">{clinic ? 'braniborska.pl' : 'vescape.app'} <Arrow /></a>{!clinic && <a href={github} target="_blank" rel="noreferrer">Source & architecture <Arrow /></a>}</section>
            <nav className="adjacent-projects" aria-label="Adjacent projects">
                {previousProject && <Link href={previousProject.href}>
                    <a className="previous-project" onClick={event => switchProject(event, previousProject.direction)}>
                        <small>{previousProject.number} / Previous project</small>
                        <span><span className="adjacent-project-arrow"><Arrow direction="down-left" /></span>{previousProject.name}</span>
                        <p>{previousProject.detail}</p>
                    </a>
                </Link>}
                <Link href={nextProject.href}>
                    <a className="next-project" onClick={event => switchProject(event, nextProject.direction)}>
                        <small>{nextProject.number} / Next project</small>
                        <span>{nextProject.name}<span className="adjacent-project-arrow"><Arrow /></span></span>
                        <p>{nextProject.detail}</p>
                    </a>
                </Link>
            </nav>
        </main>
        <div className="case-container"><Footer projectPage /></div>
    </Page>;
};

const Page = styled.article`
    --project-header-height: 10rem;
    --project-gutter: 9rem;
    --edge-button-size: 4.4rem;
    position: relative;
    min-height: 100%;
    padding-inline: var(--project-gutter);
    color: #f2f5f4;

    a { font: inherit; background: none; -webkit-text-fill-color: currentColor; text-shadow: none; }
    a:focus-visible, .case-model:focus-visible { outline: 1px solid #00a3ff; outline-offset: 6px; }
    .case-header, .case-main { position: relative; z-index: 5; }
    .case-header { height: var(--project-header-height); display: grid; place-items: center; }
    .case-signature { display: inline-flex; align-items: center; justify-content: center; padding: .6rem; }
    .case-container { max-width: 168rem; margin: auto; padding-inline: 4vw; }
    .case-main p { font-size: 1.7rem; line-height: 1.8; }
    .case-signature svg { width: 3.6rem; height: 3.8rem; filter: drop-shadow(0 0 8px rgba(0,163,255,.15)); }
    .eyebrow { display: block; margin: 0 0 2.4rem; color: #aabfbd; font-size: 1.15rem; line-height: 1.7; letter-spacing: .17em; text-transform: uppercase; }
    h1 { color: #f2f5f4; background: none; -webkit-text-fill-color: currentColor; font-size: clamp(5.2rem, 6.2vw, 10rem); line-height: 1.04; letter-spacing: -.055em; margin: 0 0 2.8rem; font-weight: 300; padding-bottom: .1em; }
    h1 > span { display: block; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    h2 { font-size: clamp(3.4rem, 4.6vw, 7rem); font-weight: 300; line-height: 1.1; letter-spacing: -.045em; margin: 0 0 3rem; }
    h2 em { font-style: normal; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    p { color: #b8cbc7; font-size: 1.55rem; line-height: 1.9; margin: 0 0 2rem; }
    .case-model { height: 43rem; width: 100%; touch-action: pan-y; cursor: grab; position: relative; }
    .case-model:active { cursor: grabbing; }
    .stage-caption { display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-top: 1px solid #24504e; padding-block: 1.8rem; font-size: .95rem; letter-spacing: .08em; color: #91a4a1; }
    .stage-caption i { color: #00a3ff; font-style: normal; margin-left: .7rem; }
    .stack-section { display: grid; grid-template-columns: 1fr 1.2fr; gap: 10%; margin: 9rem 0 7rem; border-top: 1px solid #24504e; padding-top: 6rem; align-items: start; }
    .source-note { display: flex; align-items: center; flex-wrap: wrap; gap: 3rem; padding: 3rem 0; border-block: 1px solid #24504e; font-size: 1rem; color: #6e9692; }
    .source-note a { display: flex; align-items: center; gap: 1rem; color: #b8cbc7; }
    .adjacent-projects { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 5rem; }
    .adjacent-projects > a { display: flex; flex-direction: column; padding-block: 4rem; color: #dce5e3; transition: background 250ms ease; }
    .adjacent-projects > a:hover { background: rgba(0, 163, 255, .07); }
    .adjacent-projects .previous-project { grid-column: 1; text-align: right; padding-right: 4rem; }
    .adjacent-projects .next-project { grid-column: 2; padding-left: 4rem; border-left: 1px solid #24504e; }
    .adjacent-projects small { font-size: 1.15rem; text-transform: uppercase; letter-spacing: .16em; color: #6e9692; }
    .adjacent-projects > a > span { display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-size: clamp(3rem, 4.5vw, 7.2rem); line-height: 1.5; font-weight: 300; letter-spacing: -.05em; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .adjacent-project-arrow { font-size: .65em; color: #00a3ff; }
    .case-main .adjacent-projects p { font-size: 1.4rem; margin: 1rem 0 0; }
    .text-link { font-size: 1.5rem; color: #dce5e3; display: inline-flex; gap: 1.8rem; align-items: center; padding-block: 1rem; }
    .text-link svg { color: #00a3ff; }
    .project-title-row { position: relative; width: fit-content; max-width: 100%; margin-inline: auto; }
    .project-title-nav { position: absolute; inset: 0 -5.5rem auto; height: clamp(6.4rem, 6vw, 9rem); display: flex; align-items: center; justify-content: space-between; pointer-events: none; }
    .project-title-nav a { display: grid; place-items: center; width: 4.4rem; height: 4.4rem; font-size: 2.2rem; color: #00a3ff; pointer-events: auto; }
    .project-title-nav a:only-child { margin-left: auto; }
    @media (max-width: 740px) {
        .project-title-row { display: flex; flex-direction: column-reverse; }
        .project-title-nav a:only-child { margin-left: 0; }
        .project-title-nav { position: static; height: auto; justify-content: center; gap: 1rem; margin-top: 1rem; }
    }

    .project-edge-rail { position: fixed; inset: 0 auto 0 0; width: var(--project-gutter); z-index: 360; --reading-progress: 0%; }
    .edge-back {
        position: absolute;
        top: calc((var(--project-header-height) - var(--edge-button-size)) / 2);
        left: 50%;
        transform: translateX(-50%);
        display: grid;
        place-items: center;
        width: var(--edge-button-size);
        height: var(--edge-button-size);
        white-space: nowrap;
        color: #00a3ff;
    }
    .edge-back > span:first-of-type { font-size: 2.7rem; }
    .edge-marker { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 4rem; height: 4rem; display: grid; place-items: center; }
    .edge-marker svg { width: 3rem; height: 3rem; stroke-width: 1.6; filter: drop-shadow(0 0 7px rgba(0,163,255,.3)); }
    .edge-line { position: absolute; top: calc(50% + 3rem); bottom: 7rem; left: calc(50% - var(--line-width) / 2); width: var(--line-width); background: #24423f; }
    .edge-back-copy {
        display: block;
        position: absolute;
        left: calc(100% + 1rem);
        top: 50%;
        transform: translateY(-50%);
        opacity: 0;
        pointer-events: none;
        color: #dce5e3;
        font-size: 1.8rem;
        letter-spacing: 0;
        text-transform: none;
        -webkit-text-fill-color: currentColor;
        transition: opacity 180ms ease;
    }
    .edge-back:hover .edge-back-copy,
    .edge-back:focus-visible .edge-back-copy { opacity: 1; }
    .edge-line > span { display: block; position: relative; width: 100%; height: var(--reading-progress); background: linear-gradient(#00a3ff, #00ffa3); mask-image: linear-gradient(to bottom, #000 calc(100% - 50px), transparent); }
    .edge-line::after { content: ''; position: absolute; left: 50%; top: var(--reading-progress); transform: translate(-50%, -65%); width: 2rem; height: 8rem; background: radial-gradient(ellipse, #28ffcdcc 0%, #00ffc34d 35%, transparent 72%); filter: blur(5px); opacity: var(--reading-glow, 0); pointer-events: none; }
    .edge-progress-label { position: absolute; bottom: 3rem; left: 50%; transform: translateX(-50%); color: #6e9692; font-size: .9rem; font-variant-numeric: tabular-nums; }
    .edge-lead { display: block; position: absolute; left: calc(50% - var(--line-width) / 2); top: 12rem; bottom: calc(50% + 3rem); width: var(--line-width); background: var(--accent-gradient); }
    .website-case { border-top: 1px solid #24504e; padding-block: 6rem 1rem; }
    .website-case-heading { display: grid; grid-template-columns: 1fr 1fr; gap: 9%; align-items: center; margin-bottom: 4rem; }
    .website-case-heading h2 { font-size: clamp(3.4rem, 4vw, 6rem); }
    .website-case-preview { margin: 0; border: 1px solid #24504e; }
    .website-case-preview figcaption { display: flex; align-items: center; gap: 2rem; padding: 1.3rem 1.8rem; color: #91a4a1; font-size: 1.2rem; line-height: 1.5; letter-spacing: .08em; }
    .website-case-preview figcaption > span:last-child { margin-left: auto; font-size: 1.1rem; text-transform: uppercase; }
    .website-frame-dots { display: flex; gap: .5rem; }
    .website-frame-dots i { width: .45rem; height: .45rem; border: 1px solid #6e9692; border-radius: 50%; }
    .website-case-preview img { display: block; width: 100%; }
    .website-case-preview img { height: auto; }

    .source-note { font-size: 1.3rem; }
    @media (max-width: 900px) {
        .adjacent-projects .previous-project { padding-right: 2rem; }
        .adjacent-projects .next-project { padding-left: 2rem; }
    }
    @media (max-width: 640px) {
        --project-header-height: 7rem;
        --project-gutter: 5rem;
        --edge-button-size: 3.8rem;
        .case-container { padding-inline: 1rem; }
        .case-main p { font-size: 1.6rem; }
        .case-signature svg { width: 3rem; height: 3.2rem; }
        .edge-marker svg { width: 2.6rem; height: 2.6rem; }
        .edge-progress-label { bottom: 2.5rem; }
        h2 { font-size: 4rem; }
        .stack-section { display: block; margin: 4rem 0; padding-top: 4rem; }
        .stack-section > .project-detail-list { margin-top: 3rem; }
        .source-note { gap: 1.5rem; }
        .source-note > span { flex-basis: 100%; }
        .adjacent-projects { margin-top: 3rem; }
        .adjacent-projects > a { padding-block: 2rem; }
        .adjacent-projects .previous-project { padding-right: .8rem; }
        .adjacent-projects .next-project { padding-left: .8rem; }
        .adjacent-projects > a > span { gap: .4rem; font-size: clamp(1.65rem, 4vw, 3.5rem); }
        .adjacent-projects small { font-size: .9rem; letter-spacing: .08em; }
        .case-main .adjacent-projects p { font-size: 1.15rem; }
        .website-case { padding-top: 4rem; }
        .website-case-heading { display: block; margin-bottom: 2.5rem; }
        .website-case-heading h2 { font-size: 3.6rem; }
        .website-case-preview figcaption { padding: 1rem; gap: 1rem; font-size: .9rem; }
        .website-case-preview figcaption > span:last-child { font-size: .8rem; }
    }
`;
