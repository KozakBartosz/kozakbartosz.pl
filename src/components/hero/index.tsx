import { Suspense } from 'react';
import { Hero } from './Hero';

export default () => {
    return (
        <Suspense fallback="loading">
            <Hero />
        </Suspense>
    );
};
