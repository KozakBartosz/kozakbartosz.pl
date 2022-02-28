import { Suspense } from 'react';
import { Hero } from './Hero';

const HeroSuspense = () => {
    return (
        <Suspense fallback="loading">
            <Hero />
        </Suspense>
    );
};

export default HeroSuspense;
