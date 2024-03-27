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
                <h1>Front-end developer _</h1>
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
                <h1>Graphic designer _</h1>
                <p>
                    In addition to programming, I'm interested in interface
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
                <h1>Say hello _</h1>
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

const Section = styled.div`
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;
    margin: 30rem 0;
    padding: 12rem;

    min-height: 70rem;

    @media (min-width: 1000px) {
        &:nth-child(odd) {
            margin-left: 50%;
        }
        &:nth-child(odd) ${Icon} {
            left: -50%;
            top: 50%;
        }
        &:nth-child(even) {
            margin-right: 50%;
        }
        &:nth-child(even) ${Icon} {
            left: 150%;
            top: 50%;
        }
        /* Dot on the center */
        &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: -40px;
            width: 80px;
            height: 80px;
            background: linear-gradient(
                90deg,
                rgba(0, 163, 255, 1),
                rgba(0, 255, 163, 1)
            );
            border: 33px solid rgb(9 15 14);
            z-index: 20;
            border-radius: 100%;
            box-sizing: border-box;
        }
        &:nth-child(even)::after {
            left: auto;
            right: -40px;
        }
    }
`;
const Container = styled.div`
    display: block;
    position: relative;
    z-index: 5;
    max-width: 190rem;
    padding: 30rem auto 10rem;

    @media (min-width: 1000px) {
        margin: 30rem auto 1rem;
    }
    /* margin-top: -700px; */
`;
const Line = styled.div`
    @media (min-width: 1000px) {
        position: absolute;
        z-index: 15;
        top: -5rem;
        bottom: -5rem;
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
