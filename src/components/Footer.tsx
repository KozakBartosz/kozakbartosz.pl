import styled from '@emotion/styled';
import { MouseEvent } from 'react';
import { Arrow } from './Arrow';

const links = [
    { id: 'home', label: 'Home' },
    { id: 'frontend', label: 'Front-end' },
    { id: 'interactive', label: '3D / Interactive' },
    { id: 'design', label: 'UX/UI Design' },
    { id: 'contact', label: 'Contact' },
];

const navigate = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', `#${id}`);
    target.focus({ preventScroll: true });
    const bounds = target.getBoundingClientRect();
    window.scrollTo({
        top: window.scrollY + bounds.top - Math.max(0, (window.innerHeight - bounds.height) / 2),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
};

export const Footer = () => (
    <Root id="footer" aria-label="Footer">
        <div className="footer-composition">
            <p className="signature">Bartosz<br /><span>Kozak.</span></p>
                <nav id="footer-grid" aria-label="Footer navigation">
                    {links.map(({ id, label }, index) => (
                        <a key={id} href={`#${id}`} onClick={event => navigate(event, id)}>
                            <span className="link-number">0{index}</span>
                            <span className="link-name">{label}</span>
                            <span className="link-arrow" aria-hidden="true"><Arrow /></span>
                        </a>
                    ))}
                </nav>
        </div>
        <div className="footer-bottom">
            <small>© {new Date().getFullYear()} Bartosz Kozak</small>
            <a href="#home" onClick={event => navigate(event, 'home')}>Back to top <span aria-hidden="true"><Arrow direction="up" /></span></a>
        </div>
    </Root>
);

const Root = styled.footer`
    position: relative;
    margin-top: 200px;
    z-index: 350;
    isolation: isolate;
    container-type: inline-size;
    overflow: hidden;
    padding: 0 clamp(2.4rem, 5vw, 10rem) 3rem;
    --footer-left: clamp(2.4rem, 5vw, 10rem);
    --footer-right: clamp(2.4rem, 5vw, 10rem);
    display: flex;
    flex-direction: column;
    .footer-composition { position: relative; flex: 1; display: grid; grid-template-columns: calc((100% + var(--footer-right) - var(--footer-left)) / 2) minmax(0, 1fr); align-items: center; min-height: 0; }
    nav { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; margin-bottom: 4rem; }
    a { background: none; -webkit-text-fill-color: currentColor; text-shadow: none; }
    nav a {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1.6rem;
        padding: 2.4rem;
        min-height: 12rem;
        border-bottom: 1px solid #24504e;
        &:last-of-type { grid-column: 1 / -1; border-bottom: 0; }
        transition: background-color 200ms ease;
        &:nth-of-type(odd):not(:last-of-type) { border-right: 1px solid #24504e; }
        &:hover, &:focus-visible { background-color: rgba(0, 163, 255, .07); }
        &:focus-visible { outline-offset: -2px; }
        &:hover .link-arrow { transform: translate(3px, -3px); }
    }
    .link-number { grid-column: 1 / -1; font-size: 1rem; letter-spacing: .16em; color: #6e9692; line-height: 1; }
    .link-name { font-size: clamp(1.3rem, 1.2vw, 1.8rem); color: #dce5e3; letter-spacing: .08em; text-transform: uppercase; line-height: 1.5; }
    .link-arrow { color: #00a3ff; line-height: 1; transition: transform 200ms ease; }
    .signature { margin: 4rem 0; font-size: clamp(7rem, 10.5vw, 18rem); font-weight: 300; letter-spacing: -.065em; line-height: .9; color: #f2f5f4; }
    .signature span { background: linear-gradient(100deg, #00a3ff, #00edbc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .footer-bottom { display: flex; justify-content: space-between; align-items: center; gap: 2rem; padding-top: 2.4rem; border-top: 1px solid #24504e; }
    small { font-size: 1.2rem; color: #819894; line-height: 1.5; }
    .footer-bottom a { display: flex; align-items: center; gap: 2rem; padding: 1.4rem 0 1.4rem 1.4rem; color: #bacfca; font-size: 1.1rem; letter-spacing: .14em; text-transform: uppercase; line-height: 1.5; }
    .footer-bottom a span { color: #00a3ff; font-size: 2rem; }
    @media (min-width: 1000px) {
        --footer-right: clamp(4.8rem, 5vw, 12rem);
        --footer-left: max(12rem, calc(50vw - var(--footer-right) - 68rem));
        padding-left: var(--footer-left);
        padding-right: var(--footer-right);
    }
    @media (max-width: 700px) {
        .footer-composition { grid-template-columns: 1fr; min-height: auto; }
        nav { width: 100%; }
        nav a { padding: 2rem 1.6rem; min-height: 11rem; }
        .signature { font-size: clamp(7rem, 18vw, 12rem); margin: 2rem 0 4rem; }
        .footer-bottom { gap: 1rem; }
        small { font-size: 1rem; }
        .footer-bottom a { font-size: .95rem; gap: 1rem; }
    }
`;
