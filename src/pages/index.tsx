import styled from '@emotion/styled';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Component, lazy, Suspense, useRef } from 'react';
import { Sections } from '../components/Section';
import { Cursor } from '../components/Cursor';
import { Loading } from '../components/Loading';
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
            <Container>
                <Loading>Loading</Loading>
                <Hero iconRef={iconEl} />
            </Container>
            <main>
                {/* <Suspense fallback=""> */}
                {/* </Suspense> */}

                <Sections iconRef={iconEl} />
                <Cursor />
            </main>

            <Footer>Copyright ©2024 kozakbartosz.pl</Footer>
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

const Footer = styled.footer`
    height: 20rem;
    position: relative;
    z-index: 999;
    text-align: center;
    font-size: 1.8rem;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.2;
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
