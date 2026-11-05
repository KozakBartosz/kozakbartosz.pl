import { ComponentProps, Suspense } from 'react';
import { HeroLoading } from '../Loading';
import { Hero } from './Hero';

const HeroSuspense = (props: ComponentProps<typeof Hero>) => (
    <Suspense fallback={<HeroLoading />}>
        <Hero {...props} />
    </Suspense>
);

export default HeroSuspense;
