import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { SectionId, SectionSymbol } from './SectionSymbol';

const entries: { id: SectionId; name: string }[] = [
    { id: 'home', name: 'Home' },
    { id: 'frontend', name: 'Development' },
    { id: 'design', name: 'Design' },
    { id: 'contact', name: 'Contact' }
];

export const SectionNavigation = () => {
    const [active, setActive] = useState('');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            const marker = window.innerHeight * .45;
            let current = '';
            entries.forEach(({ id }) => {
                const section = document.getElementById(id);
                if (section && section.getBoundingClientRect().top <= marker) current = id;
            });
            setActive(current);
            const index = entries.findIndex(entry => entry.id === current);
            const section = document.getElementById(current);
            const next = entries[index + 1];
            const nextSection = next ? document.getElementById(next.id) : null;
            if (section) {
                const rect = section.getBoundingClientRect();
                const end = nextSection ? nextSection.getBoundingClientRect().top : rect.bottom;
                setProgress(Math.max(0, Math.min(1, (marker - rect.top) / Math.max(1, end - rect.top))));
            } else setProgress(0);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    return (
        <Rail aria-label="Portfolio sections">
            <ol>
                {entries.map(({ id, name }, index) => (
                    <li key={id}>
                        <a href={`#${id}`} aria-label={`0${index + 1} — ${name}`}
                            aria-current={active === id ? 'location' : undefined}
                            onClick={event => {
                                event.preventDefault();
                                const section = document.getElementById(id);
                                if (!section) return;
                                history.pushState(null, '', `#${id}`);
                                section.focus({ preventScroll: true });
                                section.scrollIntoView({
                                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                                    block: 'start'
                                });
                            }}>
                            <span aria-hidden="true">0{index + 1}</span>
                            <SectionSymbol section={id} placement="rail" />
                            <span className="progress" aria-hidden="true"><span style={{ transform: `scaleY(${active === id ? progress : 0})` }} /></span>
                            <span className="name">{name}</span>
                        </a>
                    </li>
                ))}
            </ol>
        </Rail>
    );
};

const Rail = styled.nav`
    display: none;
    @media (min-width: 1000px) {
        display: block;
        position: fixed;
        left: clamp(1.6rem, 2vw, 4rem);
        top: 50%;
        transform: translateY(-50%);
        z-index: 400;
        ol { list-style: none; margin: 0; padding: 0; }
        a {
            display: flex;
            align-items: center;
            position: relative;
            min-width: 4.4rem;
            height: 6.4rem;
            transition: height 360ms cubic-bezier(.22, 1, .36, 1), color 240ms ease;
            font-size: 1.2rem;
            letter-spacing: .08em;
            color: #9bafad;
            background: none;
            -webkit-text-fill-color: currentColor;
            text-shadow: none;
        }
        a { gap: .9rem; width: 6.4rem; padding: 0 .6rem; align-items: flex-start; padding-top: 2.2rem; line-height: 2rem; }
        a svg { width: 1.6rem; height: 1.6rem; margin-top: .2rem; transition: opacity 240ms ease; }
        a[aria-current] { color: #55ebd4; height: 12.4rem; }
        .progress {
            position: absolute;
            top: 4.4rem;
            left: 1.3rem;
            width: 2px;
            bottom: -2.2rem;
            opacity: 0;
            pointer-events: none;
            transition: opacity 240ms ease;
            background: #24423f;
        }
        a[aria-current] .progress { opacity: 1; }
        li:last-child .progress { bottom: 0; }
        .progress > span {
            display: block;
            width: 100%;
            height: 100%;
            transform-origin: top;
            transition: transform 180ms linear;
            background: linear-gradient(#00a3ff, #00ffa3);
        }
        .name {
            position: absolute;
            left: 6rem;
            padding: .4rem .8rem;
            background: #090f0e;
            opacity: 0;
            pointer-events: none;
        }
        a:hover .name, a:focus-visible .name { opacity: 1; }
    }
`;
