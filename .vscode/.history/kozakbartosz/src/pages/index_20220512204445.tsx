import styled from '@emotion/styled';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Component, lazy, Suspense } from 'react';
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

                    <Button>Yolo</Button>
                </main>

                <footer></footer>
            </div>
        </ErrorBoundary>
    );
};

const Button = styled.a`
    display: block;
    border-radius: 3px;
    padding: 1.5rem;
    text-align: center;
    margin: 0.5rem 1rem;
    width: 11rem;
    background: #000;
    color: white;
    border: 2px solid white;
    margin: 400px auto;
`;

export default Home;
