import styled from '@emotion/styled';
import { MutableRefObject, useEffect, useRef } from 'react';
import { SectionSymbol } from './SectionSymbol';
import { Arrow } from './Arrow';
import { SectionNavigation } from './SectionNavigation';

export const Sections = ({
    iconRef
}: {
    iconRef: MutableRefObject<HTMLDivElement[]>;
}) => {
    return (
        <>
        <SectionNavigation />
        <Container>
            <Section id="frontend" aria-labelledby="frontend-title" tabIndex={-1}>
                <Label><span>01</span> Development</Label>
                <h2 id="frontend-title" className="section-title">Front-end <span className="heading-accent">developer</span></h2>
                <SectionPoint data-section-marker aria-hidden="true"><SectionSymbol section="frontend" /></SectionPoint>
                <p>
                    I’m a senior front-end developer with 12+ years of experience.
                    I build web apps and online stores with React, TypeScript,
                    and Next.js, and mobile apps with React Native.
                </p>
                <p>
                    My work ranges from product configurators to marketplaces
                    with separate dashboards for buyers and sellers. I care
                    about how an interface feels to use, how fast it runs,
                    and how easy the code is to change.
                </p>
                <Skills items={['TypeScript', 'JavaScript', 'React', 'Next.js', 'React Native', 'TanStack', 'Redux', 'REST APIs', 'GraphQL', 'Tailwind CSS', 'Sass', 'Styled-components', 'Storybook', 'Jest', 'Vite', 'Webpack', 'Accessibility / WCAG', 'SEO', 'Performance optimization', 'Git']} />
                <Icon
                    ref={(el) => {
                        if (el) iconRef.current[0] = el;
                    }}
                />
            </Section>
            <Section id="interactive" aria-labelledby="interactive-title" tabIndex={-1}>
                <Label><span>02</span> Interactive 3D</Label>
                <h2 id="interactive-title" className="section-title">3D modeling <span className="heading-accent">&amp; shaders</span></h2>
                <SectionPoint data-section-marker aria-hidden="true"><SectionSymbol section="interactive" /></SectionPoint>
                <p>
                    I build 3D product configurators that run in the browser.
                    I’ve worked on tools for configuring metal structures
                    and equipment for utility vehicles, using Three.js
                    and React.
                </p>
                <p>
                    I also make the models, materials, and animations, and
                    write custom GLSL shaders. Working on both the assets
                    and the code helps me spot what will be expensive to
                    render before it slows the app down.
                </p>
                <Skills label="Interactive 3D" items={['Three.js', 'React Three Fiber', 'WebGL', 'GLSL shaders', 'Real-time rendering', 'Rendering pipelines', 'GPU performance', '3D configurators']} />
                <Skills label="3D modeling" items={['Blender', 'Onshape', 'CAD modeling', 'Parametric modeling', 'Low / high poly modeling', 'Procedural materials', 'Texturing', 'Animation', 'Asset optimization']} />
                <Icon
                    ref={(el) => {
                        if (el) iconRef.current[1] = el;
                    }}
                />
            </Section>
            <Section id="design" aria-labelledby="design-title" tabIndex={-1}>
                <Label><span>03</span> UX/UI Design</Label>
                <h2 id="design-title" className="section-title">Interface <span className="heading-accent">design</span></h2>
                <SectionPoint data-section-marker aria-hidden="true"><SectionSymbol section="design" /></SectionPoint>
                <p>
                    I design the interfaces I build, from the first user flow
                    to the components people interact with. That includes
                    wireframes, prototypes, and design systems for web
                    and mobile apps.
                </p>
                <p>
                    Much of my UX work involves helping people configure
                    complex products. I work out the steps, what needs to
                    be visible, and how each choice affects the next.
                    Knowing the code helps me test those decisions in
                    the app.
                </p>
                <Skills label="UX/UI design" items={['Figma', 'User flows', 'Wireframing', 'Prototyping', 'Design systems', 'Responsive interfaces', 'Adobe Photoshop', 'Adobe Illustrator']} />
                <Icon
                    ref={(el) => {
                        if (el) iconRef.current[2] = el;
                    }}
                />
            </Section>
            <Section id="contact" aria-labelledby="contact-title" tabIndex={-1}>
                <Label><span>04</span> Contact</Label>
                <h2 id="contact-title" className="section-title">Say <span className="heading-accent">hello</span></h2>
                <SectionPoint data-section-marker aria-hidden="true"><SectionSymbol section="contact" /></SectionPoint>
                <p className="contact-intro">Have an idea? Let’s make it real.</p>
                <ContactGrid>
                    {contacts.map(({ label, value, href }) => (
                        <a key={label} href={href}>
                            <span className="contact-label">{label}<span aria-hidden="true"><Arrow /></span></span>
                            <span className="contact-value">{value}</span>
                        </a>
                    ))}
                </ContactGrid>

                <Icon
                    ref={(el) => {
                        if (el) iconRef.current[3] = el;
                    }}
                />
            </Section>
            <SectionTimeline />
        </Container>
        </>
    );
};


const contacts = [
    { label: 'Phone', value: '+48 574 227 189', href: 'tel:+48574227189' },
    { label: 'E-mail', value: 'bartoszkozak94@gmail.com', href: 'mailto:bartoszkozak94@gmail.com' },
    { label: 'GitHub', value: 'KozakBartosz', href: 'https://github.com/KozakBartosz' },
    { label: 'LinkedIn', value: 'Bartosz Kozak', href: 'https://www.linkedin.com/in/bartoszkozak1/' },
    { label: 'Instagram', value: '@kosak_11', href: 'https://www.instagram.com/kosak_11/' },
    { label: 'Location', value: 'Wrocław, Poland', href: 'https://www.google.com/maps/search/?api=1&query=Wroc%C5%82aw%2C%20Poland' }
];

const ContactGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    max-width: 68rem;
    margin-top: 2.4rem;
    a {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1.2rem;
        padding: 2.4rem 1.6rem;
        min-height: 11rem;
        border-bottom: 1px solid #24504e;
        background: none;
        -webkit-text-fill-color: currentColor;
        text-shadow: none;
        transition: background-color 200ms ease;
    }
    a:hover, a:focus-visible { background-color: rgba(0, 163, 255, .07); }
    a:focus-visible { outline-offset: -2px; }
    .contact-label {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        color: #aabfbd;
        font-size: 1.1rem;
        line-height: 1.4;
        letter-spacing: .18em;
        text-transform: uppercase;
    }
    .contact-label span { color: #00a3ff; font-size: 1.5rem; transition: transform 200ms ease; }
    a:hover .contact-label span { transform: translate(2px, -2px); }
    .contact-value {
        color: #00a3ff;
        background: linear-gradient(90deg, #38bcff, #38f5b4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: clamp(1.5rem, 1.15vw, 1.8rem);
        line-height: 1.5;
        overflow-wrap: anywhere;
    }
    @media (min-width: 600px) and (max-width: 999px), (min-width: 1200px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        a:nth-of-type(odd) { border-right: 1px solid #24504e; }
        a:nth-last-of-type(-n+2) { border-bottom: 0; }
    }
    a:last-child { border-bottom: 0; }
`;

const Skills = ({ items, label = 'Skills' }: { items: string[]; label?: string }) => (
    <div className="skills">
        <h3>{label}</h3>
        <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
    </div>
);

const Label = styled.p`
    display: flex;
    align-items: center;
    gap: 1.8rem;
    font-size: 1.2rem;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: #aabfbd;
    margin: 0 0 2.8rem;
    span { color: #00a3ff; letter-spacing: .06em; }
    span::after {
        content: '';
        display: inline-block;
        width: 3.2rem;
        height: 1px;
        margin-left: 1.8rem;
        vertical-align: middle;
        background: linear-gradient(90deg, #00a3ff, #00ffa3);
    }
`;

const Icon = styled.div`
    position: absolute;
    top: -16rem;
    left: 50%;
    width: 1px;
    height: 1px;
    pointer-events: none;
`;

const SectionPoint = styled.div`
    display: none;
    @media (min-width: 1000px) {
        display: grid;
        place-items: center;
        position: absolute;
        top: 50%;
        left: 0;
        transform: translate(-50%, -50%);
        width: 4.4rem;
        height: 4.4rem;
        background: none;
        z-index: 2;
        svg {
            width: 3.2rem;
            height: 3.2rem;
            stroke-width: 1.8;
            filter: drop-shadow(0 0 8px rgba(0, 163, 255, .45));
        }
    }
`;

const Section = styled.section`
    --model-space: clamp(44rem, 100vw, 64rem);
    container-type: inline-size;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 4rem clamp(3.2rem, 6vw, 4.8rem);
    margin: var(--model-space) 0 8rem;
    scroll-margin-top: 3rem;
    min-height: 50rem;
    p:not(:first-of-type) {
        max-width: 68rem;
        margin: 0 0 2rem;
        color: #dce5e3;
        font-size: clamp(1.7rem, 1.3vw, 2rem);
        line-height: 1.7;
    }
    .section-title { max-width: 100%; }
    .heading-accent { display: block; }
    &#contact .contact-intro { font-size: clamp(1.9rem, 1.6vw, 2.4rem); color: #b8cbc7; }

    a { overflow-wrap: anywhere; }
    .skills { margin-top: 1.8rem; max-width: 68rem; }
    .skills h3 {
        margin: 0 0 1.4rem;
        font-size: 1.2rem;
        line-height: 1.5;
        font-weight: 400;
        letter-spacing: .16em;
        text-transform: uppercase;
        color: #aabfbd;
    }
    .skills ul { display: flex; flex-wrap: wrap; gap: .8rem; list-style: none; padding: 0; margin: 0; }
    .skills li {
        padding: .9rem 1.6rem;
        border: 1px solid #24504e;
        border-radius: 3rem;
        color: #dce5e3;
        font-size: 1.5rem;
        line-height: 1.5;
    }
    @media (min-width: 700px) and (max-width: 999px) {
        padding-inline: 8rem;
    }
    @media (min-width: 1000px) {
        width: 50%;
        min-height: 80rem;
        padding: clamp(6rem, 6vw, 12rem) clamp(4.8rem, 5vw, 12rem);
        margin: 8rem 0;
        .section-title { font-size: clamp(4.6rem, 17cqw, 14rem); }
        &:nth-of-type(odd) { margin-left: 50%; }
        &:nth-of-type(even) {
            padding-left: 12rem;
            > p, > .section-title, > .skills, > ${ContactGrid} {
                width: min(100%, 68rem);
                align-self: flex-end;
            }
        }
        &#contact { margin-bottom: 7rem; }
        &:nth-of-type(even) ${SectionPoint} { left: 100%; }
        &:nth-of-type(odd) ${Icon} { left: -50%; top: 50%; }
        &:nth-of-type(even) ${Icon} { left: 150%; top: 50%; }
    }
    /* Keep both lines within the text column, including its 68rem desktop cap. */
    &#interactive .section-title { font-size: min(17cqw, 12rem); }
`;
const Container = styled.div`
    position: relative;
    z-index: 5;
    margin: 24rem auto 7rem;
    width: 100%;
    @media (min-width: 1000px) { margin-top: 10rem; }
`;
const SectionTimeline = () => {
    const timelineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timeline = timelineRef.current;
        const container = timeline?.parentElement;
        if (!timeline || !container) return;
        const markers = Array.from(container.querySelectorAll<HTMLElement>('[data-section-marker]'));
        const tracks = Array.from(timeline.children) as HTMLElement[];
        let frame = 0;
        const update = () => {
            frame = 0;
            if (window.innerWidth < 1000) return;
            const origin = timeline.getBoundingClientRect().top;
            const scrollMarker = window.innerHeight / 2;
            const centers = markers.map(marker => {
                const rect = marker.getBoundingClientRect();
                return rect.top + rect.height / 2;
            });
            const explore = document.getElementById('explore-more');
            const contact = document.getElementById('contact');
            if (!explore || !contact) return;
            const radii = markers.map(marker => (marker.querySelector('svg')?.getBoundingClientRect().height || 32) / 2 + 12);
            const starts = [explore.getBoundingClientRect().bottom + 12, ...centers.map((center, index) => center + radii[index])];
            const ends = [...centers.map((center, index) => center - radii[index]), contact.getBoundingClientRect().bottom];
            const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
            tracks.forEach((track, index) => {
                const start = starts[index];
                const end = ends[index];
                track.style.top = `${start - origin}px`;
                track.style.height = `${Math.max(0, end - start)}px`;
                const progress = atBottom ? 1 : Math.max(0, Math.min(1, (scrollMarker - start) / Math.max(1, end - start)));
                (track.firstElementChild as HTMLElement).style.height = `${progress * 100}%`;
                track.dataset.complete = String(progress >= 1);
            });
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        const observer = new ResizeObserver(schedule);
        observer.observe(container);
        observer.observe(document.body);
        const home = document.getElementById('home');
        if (home) observer.observe(home);
        markers.forEach(marker => marker.parentElement && observer.observe(marker.parentElement));
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        update();
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
        };
    }, []);

    return <Timeline ref={timelineRef} aria-hidden="true">
        {[0, 1, 2, 3, 4].map(index => <TimelineTrack key={index}><span /></TimelineTrack>)}
    </Timeline>;
};

const Timeline = styled.div`
    display: none;
    @media (min-width: 1000px) {
        display: block;
        position: absolute;
        inset: 0;
        pointer-events: none;
    }
`;

const TimelineTrack = styled.div`
    position: absolute;
    left: calc(50% - 1px);
    width: 2px;
    background: #24423f;
    > span {
        display: block;
        width: 100%;
        position: relative;
        height: 0;
        transition: height 700ms cubic-bezier(.16, 1, .3, 1);
        &::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(#00a3ff, #00ffa3);
            /* Keep the feather a constant size as the fill grows. */
            -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - 80px), rgba(0, 0, 0, .9) calc(100% - 60px), rgba(0, 0, 0, .5) calc(100% - 32px), rgba(0, 0, 0, .12) calc(100% - 12px), transparent 100%);
            mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - 80px), rgba(0, 0, 0, .9) calc(100% - 60px), rgba(0, 0, 0, .5) calc(100% - 32px), rgba(0, 0, 0, .12) calc(100% - 12px), transparent 100%);
        }
        &::after {
            content: '';
            position: absolute;
            left: -9px;
            bottom: 0;
            width: 20px;
            height: 112px;
            max-height: 100%;
            background: radial-gradient(ellipse, rgba(40, 255, 205, .95) 0%, rgba(0, 255, 195, .55) 25%, rgba(0, 255, 195, .16) 50%, transparent 75%);
            filter: blur(6px);
            transition: opacity 500ms ease;
        }
    }
    &[data-complete='true'] > span {
        &::before {
            -webkit-mask-image: none;
            mask-image: none;
        }
        &::after {
            opacity: 0;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        > span, > span::after { transition: none; }
    }
`;
