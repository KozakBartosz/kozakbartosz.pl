import { Suspense } from 'react';
import { Hero } from './Hero';

const HeroSuspense = (props: any) => {
    return (
        <Suspense fallback="loading">
            <Hero {...props} />
        </Suspense>
    );
};

export default HeroSuspense;
