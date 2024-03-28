import { Suspense } from 'react';
import { Hero } from './Hero';

import { Loading } from '../Loading';

const HeroSuspense = (props: any) => {
    return (
        // <Loading>Loading</Loading>
        <Suspense fallback={<div />}>
            <Hero {...props} />
        </Suspense>
    );
};

export default HeroSuspense;
