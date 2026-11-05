/* eslint-disable @next/next/no-img-element -- Local media for the project case studies. */
import styled from '@emotion/styled';
import { ReactNode, useEffect, useRef } from 'react';
import { Arrow } from './Arrow';
import { ViewportVideo } from './ViewportVideo';
import { ProjectDetailList, SectionKicker, VisitProjectLink } from './ProjectCaseUI';

const media = '/projects/vescape/';
const source = 'https://github.com/vescape-app/vescape';

function DeviceFrame({ kind = 'phone', image, video, label, detail }: {
    kind?: 'phone' | 'watch' | 'tablet'; image: string; video?: string; label: string; detail: string;
}) {
    return <figure className={`device-exhibit device-${kind}`}>
        <div className="device-object">
            {kind === 'watch' && <div className="watch-strap" aria-hidden="true" />}
            <div className="device-hardware">
                {kind === 'phone' && <span className="phone-speaker" aria-hidden="true" />}
                {video ? <ViewportVideo src={media + video + '-web.mp4'} poster={image} aria-label={label} /> : <img src={image} alt={label} loading="lazy" />}
                {kind === 'watch' && <span className="watch-crown" aria-hidden="true" />}
            </div>
        </div>
        <figcaption><span>{label}</span><p>{detail}</p></figcaption>
    </figure>;
}

export function ProjectStory({ model, stack, website, projectNavigation, project = 'vescape' }: { model: ReactNode; stack: ReactNode; website: ReactNode; projectNavigation?: ReactNode; project?: 'vescape' | 'braniborska' }) {
    const clinic = project === 'braniborska';
    const hero = useRef<HTMLElement>(null);
    const left = useRef<HTMLDivElement>(null);
    const center = useRef<HTMLDivElement>(null);
    const right = useRef<HTMLDivElement>(null);
    const leftPath = useRef<SVGPathElement>(null);
    const rightPath = useRef<SVGPathElement>(null);
    useEffect(() => {
        const root = hero.current, a = left.current, b = center.current, c = right.current;
        if (!root || !a || !b || !c) return;
        const update = () => {
            const origin = root.getBoundingClientRect(), l = a.querySelector('[data-panel-heading]')!.getBoundingClientRect(), m = b.querySelector('.case-model')!.getBoundingClientRect(), r = c.querySelector('[data-panel-heading]')!.getBoundingClientRect();
            const lx = l.right - origin.left, ly = l.top - origin.top + l.height / 2;
            const mx = m.left - origin.left + m.width * (clinic ? .115 : .19), my = m.top - origin.top + m.height * .43;
            const rx = r.left - origin.left, ry = r.top - origin.top + r.height / 2;
            const nx = m.right - origin.left - m.width * .13, ny = m.top - origin.top + m.height * .67;
            leftPath.current?.setAttribute('d', `M${lx},${ly} H${lx + 24} L${mx - 24},${my} H${mx}`);
            rightPath.current?.setAttribute('d', `M${rx},${ry} H${rx - 24} L${nx + 24},${ny} H${nx}`);
        };
        const observer = new ResizeObserver(update);
        [root, a, b, c].forEach(element => observer.observe(element));
        document.fonts.ready.then(update);
        update();
        return () => observer.disconnect();
    }, [clinic]);
    return <Epic data-clinic={clinic}>
        <section className="epic-hero" id="case-overview" ref={hero}>
            <div className="epic-title"><p className="project-location"><span>01</span><i />Work</p><div className="project-title-row">{projectNavigation}<h1>{clinic ? 'Braniborska' : 'Vescape'}<span>{clinic ? 'Carefully designed. Content-driven.' : 'From board to interface.'}</span></h1></div></div>
            <svg className="epic-connections" aria-hidden="true"><defs><linearGradient id="epic-connection-gradient"><stop stopColor="#00a3ff" /><stop offset="1" stopColor="#00ffa3" /></linearGradient><linearGradient id="epic-left-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop stopColor="#00ffa3" /><stop offset="1" stopColor="#00a3ff" /></linearGradient></defs><path pathLength="1" stroke="url(#epic-left-gradient)" ref={leftPath} /><path pathLength="1" stroke="url(#epic-connection-gradient)" ref={rightPath} /></svg>
            <div className="epic-layout">
                <div className="epic-context" ref={left}><div className="epic-panel-heading" data-panel-heading><span>01</span><i /><span>The project</span><b aria-hidden="true" /></div><div className="epic-summary"><h2>{clinic ? 'A clear presence.' : 'Complex data.'}<br /><em>{clinic ? 'A considered experience.' : 'Clear decisions.'}</em></h2><p>{clinic ? 'A custom website for a multidisciplinary medical clinic. Designed around its space, specialists and services.' : 'Live board telemetry, maps and community. A VESC ride companion, designed as one experience.'}</p></div><div className="epic-platforms"><span>{clinic ? 'Frontend' : 'Mobile application'}</span><p>{clinic ? 'Next.js' : 'Android & iOS'}</p><span>{clinic ? 'Headless content' : 'Native companions'}</span><p>{clinic ? 'WroCMS · My own CMS' : 'Wear OS & watchOS'}</p></div></div>
                <div className="epic-model" ref={center}>{model}</div>
                <div className="epic-contribution" ref={right}><div className="epic-panel-heading" data-panel-heading><span>02</span><i /><span>My contribution</span><b aria-hidden="true" /></div><ul>{(clinic ? ['UX research & flows', 'Interface design', 'Next.js implementation', 'WroCMS integration'] : ['Visual identity', 'Design system & UI/UX', 'React Native interface', 'Marketing website']).map(item => <li key={item}>{item}</li>)}</ul><nav className="epic-action-grid" aria-label={clinic ? 'Explore the Braniborska project' : 'Explore the Vescape project'}>
                    <a href={clinic ? 'https://www.braniborska.pl/' : 'https://vescape.app/'} target="_blank" rel="noreferrer"><small>Live</small><span>Website</span><Arrow /></a>
                    <a href={clinic ? '#clinic-cms' : source} target={clinic ? undefined : '_blank'} rel="noopener noreferrer"><small>{clinic ? 'Headless' : 'Open source'}</small><span>{clinic ? 'WroCMS' : 'Source code'}</span><Arrow /></a>
                    <a href={clinic ? '#clinic-interface' : '#epic-interface'}><small>{clinic ? 'Design' : 'In motion'}</small><span>Interface</span><Arrow /></a>
                    <a href={clinic ? '#clinic-cms' : '#epic-native'}><small>Underneath</small><span>Architecture</span><Arrow /></a>
                </nav></div>
            </div>
        </section>
        {clinic ? <ClinicSections /> : <>
        <section className="epic-native" id="epic-native"><div><SectionKicker number="03">Under the interface</SectionKicker><h2>The screen is<br />only the <em>beginning.</em></h2><p>The native vescape-core module owns BLE, telemetry, recording and alerts. React Native presents that state and sends intents, keeping long-running board work independent of an open screen.</p><a className="text-link" href={source + '/tree/dev/modules/vescape-core'} target="_blank" rel="noreferrer">Inside vescape-core <Arrow /></a></div><ProjectDetailList items={[
            ['The connection', 'Kotlin + Swift', 'BLE · Telemetry · Recording · Alerts'],
            ['The application', 'React Native + Zustand', 'A readable interface for native state.'],
            ['The interaction', 'Reanimated + Skia', 'Live gauges, charts and UI motion.'],
        ]} /></section>
        <section className="epic-interface" id="epic-interface"><div className="epic-section-heading"><div><SectionKicker number="04">Working software</SectionKicker><h2>One identity.<br /><em>Every surface.</em></h2></div><p>I created the visual identity and design system, then built and refined the mobile interface in React Native. Phone and watch share a recognizable visual language, adapted to very different displays.</p></div><div className="epic-devices"><DeviceFrame image={media + 'telemetry.png'} video="app-preview" label="The mobile interface" detail="Live data and navigation, designed and implemented in React Native." /><DeviceFrame kind="watch" image="/projects/vescape-watch.webp" video="watch-preview" label="Native Watch Mirror" detail="The ride, at a glance. Native companions for Wear OS and watchOS." /></div></section>
        <section className="epic-map"><div className="epic-map-copy"><SectionKicker number="05">Spatial interface</SectionKicker><h2>Give the data<br /><em>a sense of place.</em></h2><p>The Mapbox map brings together ride navigation, community Map Points and Group Rides. Shared positions, live telemetry and group targets add context to the ride.</p><div className="epic-map-index"><span>Navigation</span><span>Community</span><span>Weather</span></div></div><div className="epic-map-devices"><DeviceFrame image={media + 'community.png'} label="Ride together" detail="Riders and group targets in one map." /><DeviceFrame image={media + 'weather.png'} label="Read the conditions" detail="Weather and rain radar in context." /></div></section>
        </>}
        {!clinic && website}
        {stack}
    </Epic>;
}

function BrowserShot({ image, label, address }: { image: string; label: string; address: string }) {
    return <figure className="clinic-browser"><figcaption><span className="website-frame-dots" aria-hidden="true"><i /><i /><i /></span><span>{address}</span><span>{label}</span></figcaption><img src={'/projects/braniborska/' + image + '.png'} alt={label} loading="lazy" /></figure>;
}

function ClinicSections() {
    return <>
        <section className="epic-native clinic-cms" id="clinic-cms"><div><SectionKicker number="03">My own headless CMS</SectionKicker><h2>Content has<br /><em>its own place.</em></h2><p>Braniborska is built with Next.js and powered by WroCMS, my own headless content management system. Content management stays separate from the frontend, giving the website its own visual and interaction design.</p><p>I handled the process from UX research and interface design to frontend implementation and integration with the content layer.</p></div><ProjectDetailList items={[
            ['Manage', 'WroCMS', 'My own headless system for managing website content.'],
            ['Present', 'Next.js', 'A custom frontend connected to the content layer.'],
            ['Experience', 'A responsive interface', 'Clear navigation, considered layouts and fluid interactions.'],
        ]} /></section>
        <section className="clinic-interface" id="clinic-interface"><div className="epic-section-heading"><div><SectionKicker number="04">Visual direction</SectionKicker><h2>The space.<br />The people.<br /><em>The details.</em></h2></div><div><p>The website brings together the clinic’s interior, its specialists and its medical services. I shaped the interface around a clean hierarchy, expressive layouts and interactions that support exploration.</p><VisitProjectLink href="https://www.braniborska.pl/" domain="braniborska.pl" /></div></div><BrowserShot image="home-desktop" address="braniborska.pl" label="Homepage / Desktop" /><div className="clinic-screen-pair"><BrowserShot image="offer-desktop" address="braniborska.pl" label="Services / Desktop" /><DeviceFrame kind="tablet" image="/projects/braniborska/home-tablet.png" label="Homepage / Tablet" detail="The clinic homepage at the tablet breakpoint." /></div></section>
        <section className="clinic-responsive"><div className="epic-section-heading"><div><SectionKicker number="05">Responsive composition</SectionKicker><h2>Different screens.<br /><em>The same care.</em></h2></div><p>The desktop and mobile layouts share the same visual identity while adapting navigation, imagery and the order of information to the available space.</p></div><div className="clinic-profile"><BrowserShot image="specialist-desktop" address="braniborska.pl" label="Specialist profile / Desktop" /><DeviceFrame image="/projects/braniborska/specialist-mobile.png" label="The mobile profile" detail="A clear route from a specialist’s profile to booking options." /></div><div className="clinic-mobile-pair"><DeviceFrame image="/projects/braniborska/home-mobile.png" label="Homepage / Mobile" detail="The clinic’s atmosphere, carried onto a smaller screen." /><div><span className="eyebrow">From layout to interaction</span><h2>Room to read.<br /><em>Easy to explore.</em></h2><p>Responsive navigation, a clear service structure and carefully composed specialist profiles keep the experience consistent across the website.</p><BrowserShot image="service-desktop" address="braniborska.pl" label="Service detail / Desktop" /></div></div></section>
    </>;
}

const Epic = styled.div`
    .epic-hero { position: relative; padding: 1rem 0 4rem; }
    .epic-title { text-align: center; position: relative; z-index: 1; }
    .epic-title h1 { font-size: clamp(6.4rem, 5.8vw, 9rem); margin-bottom: 0; }
    .epic-title h1 > span { font-size: clamp(2.4rem, 2.2vw, 3rem); line-height: 1.4; letter-spacing: -.025em; margin-top: 1rem; }
    .epic-title .eyebrow { margin-bottom: 1.2rem; }
    .epic-layout { display: grid; grid-template-columns: .95fr 2fr 1fr; gap: 3%; align-items: center; position: relative; margin-top: -3rem; }
    .epic-model { min-width: 0; }
    .epic-model .case-model { height: 52rem; }
    .epic-model .stage-caption { flex-direction: column; gap: .4rem; align-items: center; font-size: 1.2rem; line-height: 1.5; padding-block: 1.2rem; border: 0; }
    .epic-context, .epic-contribution { position: relative; padding-top: 2rem; transform: translateY(-3rem); }
    .epic-context h2 { font-size: clamp(2.8rem, 2.5vw, 4rem); line-height: 1.2; }
    .epic-platforms { padding-top: 1.6rem; margin-top: 2.6rem; border-top: 1px solid #24504e; }
    .epic-platforms > span { font-size: 1.1rem; color: #6e9692; letter-spacing: .08em; text-transform: uppercase; }
    .epic-platforms > p { color: #dce5e3; margin-top: .3rem; }
    .epic-contribution ul { list-style: none; padding: 0; margin: 0 0 3rem; }
    .epic-contribution li { padding: .6rem 0; font-size: 1.6rem; color: #dce5e3; line-height: 1.6; }
    .epic-connections { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
    .epic-connections path { fill: none; stroke-width: 1.5; stroke-linejoin: miter; }
    .epic-action-grid { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #24504e; }
    .epic-action-grid a { display: grid; grid-template-columns: 1fr auto; align-content: space-between; gap: 1rem; min-height: 10rem; padding: 1.6rem 1.2rem; border-bottom: 1px solid #24504e; transition: background-color 200ms ease; color: #dce5e3; }
    .epic-action-grid a:nth-of-type(odd) { border-right: 1px solid #24504e; }
    .epic-action-grid a:hover { background: rgba(0,163,255,.07); }
    .epic-action-grid small { grid-column: 1 / -1; font-size: 1rem; line-height: 1.4; color: #6e9692; letter-spacing: .06em; }
    .epic-action-grid a > span { font-size: 1.6rem; line-height: 1.5; }
    .epic-action-grid svg { align-self: center; color: #00a3ff; font-size: 1.4rem; transition: transform 200ms ease; }
    .epic-action-grid a:hover svg { transform: translate(2px,-2px); }
    .epic-native { display: grid; grid-template-columns: 1fr 1.2fr; gap: 10%; align-items: start; padding: 9rem 0; scroll-margin-top: 3rem; }
    .epic-native h2 { font-size: clamp(4rem, 4.4vw, 6.8rem); }
    .epic-runtime > div { display: flex; gap: 2rem; padding: 2.4rem 0; border-bottom: 1px solid #24504e; }
    .epic-runtime > div:first-of-type { border-top: 1px solid #24504e; }
    .epic-runtime > div > span { color: #00a3ff; font-size: 1.1rem; }
    .epic-runtime small { font-size: 1.1rem; color: #6e9692; text-transform: uppercase; letter-spacing: .12em; }
    .epic-runtime h3 { font-size: 2.7rem; font-weight: 300; letter-spacing: -.025em; margin: .8rem 0; line-height: 1.3; }
    .epic-runtime p { margin-bottom: 0; }
    .epic-interface { border-block: 1px solid #24504e; padding: 6rem 0 7rem; scroll-margin-top: 3rem; }
    .epic-section-heading { display: grid; grid-template-columns: 1fr 1fr; gap: 10%; align-items: center; }
    .epic-devices { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 12%; padding: 4rem 5% 0; }
    .device-exhibit { margin: 0; min-width: 0; }
    .device-object { position: relative; margin-inline: auto; }
    .device-phone .device-object { width: min(100%, 28rem); }
    .device-hardware { position: relative; padding: 1rem; border: 1px solid #3b6561; background: #0b1312; box-shadow: 0 2rem 5rem #0004, inset 0 0 0 3px #14201e; }
    .device-hardware::before { content: ''; position: absolute; inset: -2px; border-radius: inherit; padding: 1px; background: var(--accent-line-gradient); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; opacity: .7; }
    .device-phone .device-hardware { border-radius: 3.4rem; }
    .device-phone .device-hardware::after { content: ''; position: absolute; right: -.45rem; top: 24%; width: .35rem; height: 4rem; border-radius: 0 2px 2px 0; background: #6e9692; }
    .device-hardware video, .device-hardware img { display: block; width: 100%; height: auto; background: #090f0e; }
    .device-phone .device-hardware video { aspect-ratio: 9/20; object-fit: cover; border-radius: 2.5rem; }
    .device-phone .device-hardware img { height: auto; border-radius: 2.5rem; }
    .phone-speaker { position: absolute; z-index: 1; top: 1.6rem; left: 50%; transform: translateX(-50%); width: 22%; height: .5rem; border-radius: 2rem; background: #090f0e; box-shadow: 0 0 0 1px #24423f; pointer-events: none; }
    .device-exhibit figcaption { padding-top: 2.5rem; text-align: center; }
    .device-exhibit figcaption > span { display: block; font-size: 1.8rem; color: #dce5e3; margin-bottom: 1rem; }
    .device-exhibit figcaption p { font-size: 1.45rem; max-width: 34rem; margin-inline: auto; }
    .device-watch .device-object { width: min(100%, 30rem); padding-block: 8rem; }
    .device-watch .device-hardware { border-radius: 50%; padding: 1.2rem; }
    .device-watch video { aspect-ratio: 1; object-fit: cover; border-radius: 50%; }
    .watch-strap { position: absolute; left: 32%; right: 32%; top: 0; bottom: 0; border: 1px solid #3b6561; border-radius: 3rem; background: linear-gradient(90deg, #0b1312, #192725, #0b1312); }
    .watch-strap::after { content: ''; position: absolute; left: 45%; top: 2rem; width: .45rem; height: .45rem; border: 1px solid #6e9692; border-radius: 50%; box-shadow: 0 1.3rem 0 #24423f, 0 2.6rem 0 #24423f; }
    .watch-crown { position: absolute; top: 45%; right: -.8rem; width: .7rem; height: 2.4rem; border: 1px solid #6e9692; background: #192725; border-radius: 2px; }
    .epic-map { display: grid; grid-template-columns: .85fr 1.15fr; gap: 8%; align-items: center; padding: 9rem 0; }
    .epic-map-devices { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
    .epic-map-devices .device-exhibit:last-child { padding-top: 9rem; }
    .epic-map-devices figcaption > span { font-size: 1.6rem; }
    .epic-map-index { display: flex; flex-wrap: wrap; gap: 2rem; padding-block: 2rem; color: #91a4a1; font-size: 1.3rem; }
    .epic-map-index > span::before { content: '+'; margin-right: .8rem; color: #00a3ff; }
    @media (max-width: 1100px) {
        .epic-layout { grid-template-columns: 1fr 1.6fr; gap: 5%; margin-top: 1rem; }
        .epic-context, .epic-contribution { transform: none; }
        .epic-contribution { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1.6fr; gap: 0 5%; align-items: start; }
        .epic-contribution > .eyebrow { grid-column: 1; }
        .epic-contribution ul { grid-column: 1; }
        .epic-action-grid { grid-column: 2; grid-row: 1 / 3; }
        .epic-model .case-model { height: 52rem; }
        .epic-connections { display: none; }
        .epic-native, .epic-section-heading { gap: 7%; }
        .epic-devices { gap: 10%; padding-inline: 2%; }
        .epic-map { display: block; }
        .epic-map-copy { max-width: 60rem; margin-bottom: 4rem; }
        .epic-map-devices { max-width: 64rem; margin-inline: auto; gap: 5rem; }
    }
    @media (max-width: 640px) {
        .epic-hero { padding-top: 1rem; }
        .epic-title h1 { font-size: 6.5rem; }
        .epic-title h1 > span { font-size: 2.1rem; }
        .epic-title .eyebrow { font-size: 1rem; letter-spacing: .1em; }
        .epic-layout { display: flex; flex-direction: column; gap: 3rem; }
        .epic-model { width: 100%; order: -1; }
        .epic-model .case-model { height: 42rem; }
        .epic-model .stage-caption { font-size: 1rem; }
        .epic-context, .epic-contribution { width: 100%; padding-top: 0; }
        .epic-context h2 { font-size: 3.4rem; }
        .epic-platforms { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
        .epic-platforms > span:nth-of-type(2) { grid-column: 2; grid-row: 1; }
        .epic-platforms > p { font-size: 1.4rem; }
        .epic-contribution { display: block; }
        .epic-contribution li { font-size: 1.7rem; }
        .epic-action-grid a { min-height: 11rem; padding: 1.8rem 1.2rem; }
        .epic-action-grid a > span { font-size: 1.6rem; }
        .epic-native, .epic-section-heading, .epic-devices { display: block; }
        .epic-native { padding-block: 6rem; }
        .epic-native h2 { font-size: 4rem; }
        .epic-runtime { margin-top: 3rem; }
        .epic-runtime h3 { font-size: 2.5rem; }
        .epic-interface { padding-block: 4rem; }
        .epic-devices { padding: 3rem 1rem 0; }
        .device-watch { margin-top: 5rem; }
        .device-watch .device-object { width: 25rem; padding-block: 6rem; }
        .epic-map { padding-block: 5rem; }
        .epic-map-devices { gap: 1.8rem; }
        .epic-map-devices .device-phone .device-hardware { border-radius: 1.8rem; padding: .6rem; }
        .epic-map-devices .device-hardware img { border-radius: 1.2rem; }
        .epic-map-devices .phone-speaker { top: 1rem; height: .25rem; }
        .epic-map-devices .device-hardware::after { height: 2rem; }
        .epic-map-devices figcaption > span { font-size: 1.35rem; }
        .epic-map-devices figcaption p { font-size: 1.2rem; line-height: 1.6; }
    }
    .epic-layout { grid-template-columns: 1fr 2fr 1fr; align-items: start; margin-top: 3rem; }
    .epic-context, .epic-contribution { padding-top: 0; transform: none; }
    .epic-panel-heading { display: flex; align-items: center; gap: 1.2rem; min-height: 4.4rem; margin-bottom: 2.8rem; white-space: nowrap; font-size: 1.1rem; letter-spacing: .12em; text-transform: uppercase; color: #aabfbd; }
    .epic-panel-heading > span:first-of-type { color: #00a3ff; font-size: 1rem; }
    .epic-panel-heading i { flex-shrink: 0; width: 2.4rem; height: 1px; background: var(--accent-line-gradient); }
    .epic-panel-heading b { flex: 1; min-width: .8rem; height: 1px; background: var(--accent-line-gradient); }
    .project-location { display: flex; justify-content: center; align-items: center; gap: 1.8rem; margin: 0 0 1.8rem; color: #aabfbd; font-size: 1.2rem !important; letter-spacing: .18em; text-transform: uppercase; }
    .project-location > span { color: #00a3ff; }
    .project-location i { width: 3.2rem; height: 1px; background: var(--accent-line-gradient); }
    &[data-clinic='true'] .epic-title h1 { font-size: clamp(4.5rem, 6vw, 9rem); }
    &[data-clinic='true'] .epic-model .case-model { height: 49rem; }
    .clinic-interface { padding: 5rem 0 7rem; border-block: 1px solid #24504e; scroll-margin-top: 3rem; }
    .clinic-browser { min-width: 0; margin: 4rem 0 0; border: 1px solid #24504e; }
    .clinic-browser figcaption { display: flex; align-items: center; gap: 1.5rem; padding: 1.4rem 1.6rem; font-size: 1.1rem; line-height: 1.5; color: #91a4a1; }
    .clinic-browser figcaption > span:last-child { margin-left: auto; font-size: .95rem; }
    .clinic-browser img { display: block; width: 100%; height: auto; }
    .clinic-screen-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
    .clinic-responsive { padding: 7rem 0 1rem; }
    .clinic-profile { display: grid; grid-template-columns: 2.2fr 1fr; gap: 5%; align-items: center; margin-top: 4rem; }
    .clinic-profile .clinic-browser { margin: 0; }
    .clinic-profile .device-object { max-width: 25rem; }
    .clinic-mobile-pair { display: grid; grid-template-columns: 1fr 2fr; gap: 10%; align-items: center; padding-top: 7rem; }
    @media (min-width: 641px) and (max-width: 1100px) {
        .epic-contribution { display: block; }
        .epic-contribution .epic-action-grid { margin-top: 2rem; }
        .epic-layout { grid-template-columns: 1fr 1.6fr; }
        .epic-contribution { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1.6fr; gap: 0 5%; }
        .epic-contribution .epic-panel-heading, .epic-contribution ul { grid-column: 1; }
        .epic-contribution .epic-action-grid { grid-column: 2; grid-row: 1 / 3; margin-top: 0; }
    }
    @media (max-width: 640px) {
        .epic-panel-heading { font-size: 1.15rem; gap: 1.2rem; margin-bottom: 2rem; }
        .epic-layout { margin-top: 2rem; }
        .epic-model { order: -1; }
        .clinic-screen-pair, .clinic-profile, .clinic-mobile-pair { display: block; }
        .clinic-profile .device-exhibit { margin-top: 4rem; }
        .clinic-mobile-pair > div { margin-top: 4rem; }
        .clinic-browser figcaption { font-size: .85rem; gap: .8rem; padding: 1rem; }
        .clinic-browser figcaption > span:last-child { font-size: .75rem; }
        .clinic-interface, .clinic-responsive { padding-block: 4rem; }
        &[data-clinic='true'] .epic-title h1 { font-size: clamp(3.2rem, 10vw, 5rem); }
        &[data-clinic='true'] .epic-title h1 > span { font-size: 2rem; }
        &[data-clinic='true'] .epic-model .case-model { height: 30rem; }
    }

    .epic-panel-heading { width: 100%; }


    .epic-platforms { border-bottom: 1px solid #24504e; padding-bottom: 1.6rem; }
    .epic-platforms > p:last-child { margin-bottom: 0; }
    @media (min-width: 1101px) {
        .epic-layout { grid-template-rows: 4.4rem 1fr auto; row-gap: 2.8rem; align-items: stretch; }
        .epic-context, .epic-contribution { display: grid; grid-template-rows: subgrid; grid-row: 1 / 4; }
        .epic-context { grid-column: 1; }
        .epic-contribution { grid-column: 3; }
        .epic-model { grid-column: 2; grid-row: 1 / 4; }
        .epic-panel-heading { margin-bottom: 0; }
        .epic-summary h2 { margin-top: 0; }
        .epic-summary > p { margin-bottom: 0; }
        .epic-contribution ul { margin: 0; }
        .epic-platforms { margin-top: 0; }
    }
    @media (max-width: 640px) { .epic-native > .project-detail-list { margin-top: 3rem; } }

    .clinic-screen-pair { align-items: start; }
    .clinic-screen-pair .device-tablet { margin: 4rem 0 0; }
    .device-tablet .device-object { width: min(100%, 49rem); }
    .device-tablet .device-hardware { padding: 1rem; border-radius: 2.4rem; }
    .device-tablet .device-hardware img { display: block; border-radius: 1.5rem; }
`;
