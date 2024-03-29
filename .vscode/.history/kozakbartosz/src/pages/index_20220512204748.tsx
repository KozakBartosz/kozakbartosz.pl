import styled from '@emotion/styled';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Component, lazy, Suspense } from 'react';
import { Section } from '../components/Section';
const Hero = dynamic(() => import('../components/hero'), { ssr: false });

class ErrorBoundary extends Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <h1>Something went wrong.</h1>;
        }

        return this.props.children;
    }
}

const Home: NextPage = () => {
    return (
        <ErrorBoundary>
            <div>
                <Head>
                    <title>KozakBartosz.pl</title>
                    <meta
                        name="description"
                        content="Generated by create next app"
                    />
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                <main>
                    {/* <Suspense fallback=""> */}
                    <Hero />
                    {/* </Suspense> */}

                    <Container>
                        <Section></Section>
                        <Section></Section>
                    </Container>
                </main>

                <footer></footer>
            </div>
        </ErrorBoundary>
    );
};

const Container = styled.div`
    max-width: 160rem;
`;

export default Home;
