import styled from '@emotion/styled';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { Sections } from '../components/Section';
import { Cursor } from '../components/Cursor';
import { Loading } from '../components/Loading';
import { Footer } from '../components/Footer';
const Hero = dynamic(() => import('../components/hero'), { ssr: false });

const Home: NextPage = () => {
    const iconEl = useRef([]);

    return (
        <>
            <Head>
                <title>KozakBartosz.pl</title>
                <meta
                    name="description"
                    content="Hi, I am a front-end developer with 10 years of experience working on my own open source projects as well as doing full-time employment."
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Container id="home" tabIndex={-1} aria-label="Home">
                <Loading>Loading</Loading>
                <Hero iconRef={iconEl} />
                <HomeLabel><span>00</span><i />Home</HomeLabel>
                <ExploreControl />
            </Container>
            <main>
                {/* <Suspense fallback=""> */}
                {/* </Suspense> */}

                <Sections iconRef={iconEl} />
                <Cursor />
            </main>

            <Footer />
            <MargeGradientTop />
            <MargeGradientBottom />
        </>
    );
};

const Container = styled.div`
    background-image: url(/bg.png);
    background-position: center;
    background-size: cover;
    position: relative;
    height: 100%;
`;

const MargeGradientBottom = styled.div`
    pointer-events: none;
    height: 6rem;
    background: linear-gradient(
        0deg,
        rgba(9, 15, 14, 0),
        rgb(1 1 1),
        rgb(9 15 14),
        rgba(9, 15, 14, 0)
    );
    /* background: linear-gradient(  
    0deg,
    rgba(9, 15, 14, 0),
    rgba(9, 15, 14, 1),
    rgba(9, 15, 14, 1),
    rgba(9, 15, 14, 0)
); */
    /* border: 4px solid red; */
    position: fixed;
    bottom: -3rem;
    left: 0;
    right: 0;
    z-index: 100;
    @media (min-width: 800px) {
        height: 20lvh;
        bottom: -10lvh;
    }
`;
const MargeGradientTop = styled.div`
    pointer-events: none;
    height: 6rem;
    background: linear-gradient(
        0deg,
        rgba(9, 15, 14, 0),
        rgba(9, 15, 14, 1),
        rgba(9, 15, 14, 1),
        rgba(9, 15, 14, 0)
    );
    /* background: linear-gradient(
    0deg,
    rgba(9, 15, 14, 0),
    rgba(9, 15, 14, 1),
    rgba(9, 15, 14, 1),
    rgba(9, 15, 14, 0)
); */
    /* border: 4px solid red; */
    position: fixed;
    top: -3rem;
    left: 0;
    right: 0;
    z-index: 300;
    @media (min-width: 800px) {
        height: 20lvh;
        top: -10lvh;
    }
`;

export default Home;

const HomeLabel = styled.div`
    position: absolute;
    top: clamp(3rem, 5vh, 6rem);
    left: clamp(2.4rem, 3vw, 6rem);
    display: flex;
    align-items: center;
    gap: 1.8rem;
    z-index: 350;
    color: #aabfbd;
    font-size: 1.2rem;
    letter-spacing: .18em;
    text-transform: uppercase;
    span { color: #00a3ff; letter-spacing: .06em; }
    i { width: 3.2rem; height: 1px; background: linear-gradient(90deg, #00a3ff, #00ffa3); }
`;

const Explore = styled.a`
    position: absolute;
    bottom: 5rem;
    padding: 1rem 1.6rem;
    box-sizing: content-box;
    display: flex;
    align-items: center;
    height: 2rem;
    width: 18.8rem;
    justify-content: center;
    left: 50%;
    transform: translateX(-50%);
    z-index: 350;
    color: #dce5e3;
    background: none;
    -webkit-text-fill-color: currentColor;
    text-shadow: none;
    font-size: 1.2rem;
    line-height: 2rem;
    letter-spacing: .2em;
    text-transform: uppercase;
    white-space: nowrap;
    span { color: #00e6dd; font-size: 2rem; margin-left: .8rem; }
`;

const ExploreControl = () => {
    const [explored, setExplored] = useState(false);

    useEffect(() => {
        const update = () => {
            const section = document.getElementById('frontend');
            setExplored(!!section && section.getBoundingClientRect().top <= window.innerHeight / 2);
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    return (
        <Explore id="explore-more" href={explored ? '#home' : '#frontend'}
                    onClick={event => {
                        const target = document.getElementById(explored ? 'home' : 'frontend');
                        if (!target) return;
                        event.preventDefault();
                        history.pushState(null, '', explored ? '#home' : '#frontend');
                        target.focus({ preventScroll: true });
                        const bounds = target.getBoundingClientRect();
                        window.scrollTo({
                            top: window.scrollY + bounds.top - Math.max(0, (window.innerHeight - bounds.height) / 2),
                            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
                        });
                    }}>
                    {explored ? 'Back to home' : 'Scroll to explore'}
                    <span aria-hidden="true">{explored ? '↑' : '↓'}</span>
                </Explore>
    );
};
