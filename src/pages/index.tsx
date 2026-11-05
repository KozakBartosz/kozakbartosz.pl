import styled from '@emotion/styled';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Sections } from '../components/Section';
import { Cursor } from '../components/Cursor';
import { HeroLoading } from '../components/Loading';
import { Footer } from '../components/Footer';
import { Arrow } from '../components/Arrow';
import { WorkCarousel } from '../components/workCarousel';
import { WorkProject } from '../components/WorkProject';
import { useRouter } from 'next/router';
const useRouteLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const Hero = dynamic(() => import('../components/hero'), { ssr: false, loading: HeroLoading });

const Home: NextPage = () => {
    const router = useRouter();
    const projectKey = router.query.project === 'braniborska' ? 'braniborska' : 'vescape';
    const projectView = router.query.project === 'vescape' || router.query.project === 'braniborska';
    const projectIndex = projectKey === 'braniborska' ? 1 : 0;
    const reloadY = useRef<number | null>(null);
    const initialRoute = useRef(true);
    const iconEl = useRef<HTMLDivElement[]>([]);
    const projectPreviewRef = useRef<HTMLDivElement>(null);
    const inspectRotation = useRef(0);
    const workPreviewRef = useRef<HTMLDivElement>(null);
    const workCarousel = useRef<WorkCarousel>({ position: 0, target: 0, dragging: false });
    const [workProject, setWorkProject] = useState(0);

    useEffect(() => {
        const selected = ['vescape', 'braniborska', 'wyciszamy', 'rts'].indexOf(String(router.query.selected));
        if (selected >= 0) {
            setWorkProject(selected);
            workCarousel.current.position = selected;
            workCarousel.current.target = selected;
        }
    }, [router.query.selected]);

    useRouteLayout(() => {
        if (!router.isReady) return;
        if (projectView) window.scrollTo(0, 0);
        else if (router.asPath.includes('#work')) {
            const section = document.getElementById('work');
            if (section) {
                const bounds = section.getBoundingClientRect();
                window.scrollTo(0, window.scrollY + bounds.top - Math.max(0, (window.innerHeight - bounds.height) / 2));
            }
        }
        if (initialRoute.current) {
            initialRoute.current = false;
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
            if (navigation?.type === 'reload') {
                reloadY.current = window.scrollY;
                const anchor = (projectView ? projectPreviewRef : workPreviewRef).current;
                const rect = anchor?.getBoundingClientRect();
                if (rect && rect.bottom > 0 && rect.top < window.innerHeight &&
                    !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    document.documentElement.dataset.projectLines = 'waiting';
                }
            }
        }
    }, [projectView, router.asPath, router.isReady]);

    return (
        <>
            <Head>
                <title>KozakBartosz.pl</title>
                <meta
                    name="description"
                    content="Senior front-end developer with 12+ years of experience in React, TypeScript, UX/UI design, and interactive 3D experiences."
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Container id={projectView ? 'scene-shell' : 'home'} data-project-view={projectView} tabIndex={-1} aria-label={projectView ? undefined : 'Home'}>
                <Hero iconRef={iconEl} reloadY={reloadY} workPreviewRef={projectView ? projectPreviewRef : workPreviewRef}
                    workProject={projectView ? projectIndex : workProject} workCarousel={workCarousel}
                    projectView={projectView} inspectRotation={inspectRotation} />
                {!projectView && <HomeLabel><span>00</span><i />Home</HomeLabel>}
                {!projectView && <ExploreControl />}
            </Container>
            {projectView && <WorkProject key={projectKey} projectKey={projectKey} anchor={projectPreviewRef} rotation={inspectRotation} />}
            <main hidden={projectView}>
                {/* <Suspense fallback=""> */}
                {/* </Suspense> */}

                <Sections visible={!projectView} iconRef={iconEl} work={{ active: workProject, setActive: setWorkProject, previewRef: workPreviewRef, carouselRef: workCarousel }} />
            </main>

            <Cursor />
            {!projectView && <><Footer /><MargeGradientTop /><MargeGradientBottom /></>}
        </>
    );
};

const Container = styled.div`
    &[data-project-view='true'] { height: 0; min-height: 0; background: none; }
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
    i { width: 3.2rem; height: var(--line-width); background: linear-gradient(90deg, #00a3ff, #00ffa3); }
    @media (max-width: 999px) {
        top: calc(2.4rem + env(safe-area-inset-top, 0px));
        left: 2.4rem;
    }
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
    span {
        color: #00cdbd;
        font-size: 2rem;
        margin-left: .8rem;
    }
`;

const ExploreControl = () => {
    const [explored, setExplored] = useState(false);

    useEffect(() => {
        const update = () => {
            const section = document.getElementById('work');
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
        <Explore id="explore-more" href={explored ? '#home' : '#work'}
                    onClick={event => {
                        const target = document.getElementById(explored ? 'home' : 'work');
                        if (!target) return;
                        event.preventDefault();
                        history.pushState(null, '', explored ? '#home' : '#work');
                        target.focus({ preventScroll: true });
                        const bounds = target.getBoundingClientRect();
                        window.scrollTo({
                            top: window.scrollY + bounds.top - Math.max(0, (window.innerHeight - bounds.height) / 2),
                            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
                        });
                    }}>
                    {explored ? 'Back to home' : 'Scroll to explore'}
                    <span aria-hidden="true"><Arrow direction={explored ? 'up' : 'down'} /></span>
                </Explore>
    );
};
