import styled from '@emotion/styled';
import { MutableRefObject } from 'react';
import { SectionSymbol } from './SectionSymbol';
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
                <Label><span>02</span> Development</Label>
                <h2 id="frontend-title" className="section-title">Front-end <span className="heading-accent">developer</span></h2>
                <SectionPoint aria-hidden="true"><SectionSymbol section="frontend" /></SectionPoint>
                <p>
                    Hi, I am a front-end developer with 10 years of experience
                    working on my own open source projects as well as doing
                    full-time employment.
                </p>
                <p>
                    I enjoy working on projects where I can use my 3D knowledge
                    in a creative way that is different from typical web
                    applications, while also providing an effective and smoothly
                    animated user interface.
                </p>
                <Skills items={["TypeScript", "Three.js", "React", "Next.js", "Tailwind", "React-Three-Fiber", "Gatsby", "GraphQL", "Styled-components", "Sass", "Linux", "Git"]} />
                <Icon
                    ref={(el) => {
                        if (el) iconRef.current[0] = el;
                    }}
                />
            </Section>
            <Section id="design" aria-labelledby="design-title" tabIndex={-1}>
                <Label><span>03</span> Design</Label>
                <h2 id="design-title" className="section-title">Graphic <span className="heading-accent">designer</span></h2>
                <SectionPoint aria-hidden="true"><SectionSymbol section="design" /></SectionPoint>
                <p>
                    In addition to programming, I also deals with graphic design
                    of interfaces and 3D graphics.
                </p>
                <p>
                    Because I designed myself, I feel confident in advising and
                    discussing possible UX/UI solutions and it helps me make
                    decisions as a front-end when something is not fully
                    designed beforehand. Working on unusual projects, I gained
                    experience in creating interfaces strongly related to 3D
                    applications that require a slightly different approach.
                </p>
                <Skills items={['Figma', 'User experience', 'User interface', 'Adobe Photoshop', 'Adobe Illustrator', 'Photography']} />
                <Skills label="Blender" items={['Low and high poly modeling', 'Animations', 'Physic simulations', 'Procedural materials', 'Texturing']} />
                <Icon
                    ref={(el) => {
                        if (el) iconRef.current[1] = el;
                    }}
                />
            </Section>
            <Section id="contact" aria-labelledby="contact-title" tabIndex={-1}>
                <Label><span>04</span> Contact</Label>
                <h2 id="contact-title" className="section-title">Say <span className="heading-accent">hello</span></h2>
                <SectionPoint aria-hidden="true"><SectionSymbol section="contact" /></SectionPoint>
                <p className="contact-intro">Have an idea? Let’s make it real.</p>
                <ContactGrid>
                    {contacts.map(({ label, value, href }) => (
                        <a key={label} href={href}>
                            <span className="contact-label">{label}<span aria-hidden="true">↗</span></span>
                            <span className="contact-value">{value}</span>
                        </a>
                    ))}
                </ContactGrid>

                <Icon
                    ref={(el) => {
                        if (el) iconRef.current[2] = el;
                    }}
                />
            </Section>
            <Line />
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
    max-width: 64rem;
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
        color: #53dce1;
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
    top: -18rem;
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
        background: #090f0e;
        z-index: 2;
    }
`;

const Section = styled.section`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 4rem 2.4rem;
    margin: 28rem 0 8rem;
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
    &#contact .heading-accent { display: block; }
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
        border: 1px solid transparent;
        border-radius: 3rem;
        background: linear-gradient(#090f0e, #090f0e) padding-box,
            linear-gradient(110deg, rgba(0, 163, 255, .65), rgba(0, 255, 163, .65)) border-box;
        color: #dce5e3;
        font-size: 1.5rem;
        line-height: 1.5;
    }
    @media (min-width: 700px) and (max-width: 999px) {
        padding-inline: 8rem;
    }
    @media (min-width: 1000px) {
        container-type: inline-size;
        width: 50%;
        min-height: 80rem;
        padding: clamp(6rem, 6vw, 12rem) clamp(3.2rem, 4vw, 12rem);
        margin: 8rem 0;
        .section-title { font-size: clamp(4.6rem, 17cqw, 14rem); }
        &:nth-of-type(odd) { margin-left: 50%; }
        &:nth-of-type(even) ${SectionPoint} { left: 100%; }
        &:nth-of-type(odd) ${Icon} { left: -50%; top: 50%; }
        &:nth-of-type(even) ${Icon} { left: 150%; top: 50%; }
    }
`;
const Container = styled.div`
    position: relative;
    z-index: 5;
    margin: 24rem auto 8rem;
    width: 100%;
    @media (min-width: 1000px) { margin-top: 10rem; }
`;
const Line = styled.div`
    @media (min-width: 1000px) {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 1px;
        opacity: .45;
        background: linear-gradient(#00a3ff, #00ffa3);
        pointer-events: none;
    }
`;
