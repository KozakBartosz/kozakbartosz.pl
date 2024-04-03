import styled from '@emotion/styled';
import Link from 'next/link';
import { MutableRefObject } from 'react';

export const Sections = ({
    iconRef
}: {
    iconRef: MutableRefObject<HTMLDivElement[]>;
}) => {
    return (
        <Container>
            <Section>
                <Curtain />
                <h1>Front-end developer</h1>
                <p>
                    Hi, I am a front-end developer with 10 years of experience
                    working on my own open source projects as well as doing
                    full-time employment. I like working on projects where I can
                    use my 3D knowledge in a way that is different from typical
                    web applications.
                </p>
                <h2>Skills:</h2>
                <p>
                    ECMAScript 6+, Three.js, TypeScript, React,
                    React-Three-Fiber, Next.js, Gatsby, GraphQL,
                    Styled-components, Linux, Git.
                </p>
                <Icon
                    ref={(el) => {
                        iconRef.current.push(el!);
                    }}
                />
            </Section>
            <Section>
                <Curtain />
                <h1>Graphic designer</h1>
                <p>
                    In addition to programming, I&apos;m interested in interface
                    design, user experience and 3D graphics.
                </p>
                <h2>Skills:</h2>
                <p>
                    Figma, user experience, user interface, Adobe Photoshop,
                    Adobe Illustrator, photography.
                </p>
                <p>
                    Blender - modeling low and high poly, animations, physic
                    simulations, procedural materials and texturing.
                </p>
                <Icon
                    ref={(el) => {
                        iconRef.current.push(el!);
                    }}
                />
            </Section>
            <Section>
                <Curtain />
                <h1>Say hello</h1>
                <p>
                    Phone:{' '}
                    <Link href="tel: +48 574 227 189">+48 574 227 189</Link>
                </p>
                <p>
                    E-mail:{' '}
                    <Link href="mailto: bartoszkozak94@gmail.com">
                        bartoszkozak94@gmail.com
                    </Link>
                </p>
                <p>
                    Github:{' '}
                    <Link href="https://github.com/KozakBartosz">
                        github.com/KozakBartosz
                    </Link>
                </p>
                <p>
                    Linkedin:{' '}
                    <Link href="https://linkedin.com/in/bartosz-kozak-69a4231a4">
                        linkedin.com/in/bartosz-kozak-69a4231a4
                    </Link>
                </p>

                <Icon
                    ref={(el) => {
                        iconRef.current.push(el!);
                    }}
                />
            </Section>
            <Line />
        </Container>
    );
};

const Icon = styled.div`
    position: absolute;
    top: 0%;
    left: 50%;
    width: 10px;
    height: 10px;
    /* background: red; */
`;

const Section = styled.section`
    overflow-y: clip;
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;
    margin: 70rem 0 20rem;
    padding: 4rem 2rem;

    min-height: 50rem;

    ${Icon} {
        top: -30rem;
    }

    @media (min-width: 1000px) {
        padding: 4rem 12rem;
        margin: 20rem 0;

        &:nth-child(odd) {
            margin-left: 50%;
        }
        &:nth-child(odd) ${Icon} {
            left: calc(-50% - 4rem);
            top: 50%;
        }
        &:nth-child(even) {
            margin-right: 50%;
        }
        &:nth-child(even) ${Icon} {
            left: calc(150% + 4rem);
            top: 50%;
        }
        /* Dot on the center */
        &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: calc(-40px + 33px - 2px);
            width: calc(80px - 33px - 33px + 2px + 2px);
            height: 80px;
            background: linear-gradient(
                45deg,
                rgba(0, 163, 255, 1),
                rgba(0, 255, 163, 1)
            );
            border: 33px solid rgb(9 15 14);
            border-width: 33px 2px;
            z-index: 20;
            border-radius: 100%;
            box-sizing: border-box;
        }
        &:nth-child(even)::after {
            left: auto;
            right: calc(-40px + 33px - 2px);
        }
    }
`;
const Curtain = styled.div`
    @media (min-width: 1200px) {
        pointer-events: none;
        inset: -50lvh 2rem -50lvh;
        position: absolute;

        &::before {
            content: '';
            display: block;
            position: sticky;
            top: 50lvh;
            width: 100%;
            left: 0;
            height: 50lvh;
            background: #090f0e;
            background: linear-gradient(
                160deg,
                rgba(9, 15, 14, 0) 0%,
                rgba(9, 15, 14, 0) 45%,
                rgba(9, 15, 14, 1) 66%,
                rgba(9, 15, 14, 1) 100%
            );
            filter: blur(10px);
            z-index: 20;
            box-sizing: border-box;
        }
    }
`;
const Container = styled.div`
    display: block;
    position: relative;
    z-index: 5;
    max-width: 190rem;
    padding: 30rem auto 10rem;
    margin: calc(180rem - 60lvh) auto 10rem;

    @media (min-width: 1000px) {
        margin: 30rem auto 20rem;
    }
`;
const Line = styled.div`
    @media (min-width: 1000px) {
        position: absolute;
        z-index: 15;
        top: -40rem;
        bottom: -20rem;
        left: calc(50% - 1px);
        width: 2px;
        /* height: 100%; */
        background: linear-gradient(
            45deg,
            rgba(0, 163, 255, 1),
            rgba(0, 255, 163, 1)
        );
        /* dot on top and bottom */
        &::before {
            content: '';
            position: absolute;
            top: -41px;
            left: -2px;
            width: 6px;
            height: 6px;
            background: linear-gradient(
                90deg,
                rgba(0, 163, 255, 1),
                rgba(0, 255, 163, 1)
            );
            z-index: 20;
            border-radius: 100%;
            box-sizing: border-box;
        }
        &::after {
            content: '';
            position: absolute;
            bottom: -41px;
            left: -2px;
            width: 6px;
            height: 6px;
            background: linear-gradient(
                90deg,
                rgba(0, 163, 255, 1),
                rgba(0, 255, 163, 1)
            );
            z-index: 20;
            border-radius: 100%;
            box-sizing: border-box;
        }
    }
`;
