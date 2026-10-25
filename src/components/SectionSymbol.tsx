export type SectionId = 'home' | 'frontend' | 'design' | 'contact';

export const SectionSymbol = ({ section, placement = 'marker' }: { section: SectionId; placement?: 'marker' | 'rail' }) => (
    <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke={`url(#section-gradient-${placement}-${section})`} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <defs>
            <linearGradient id={`section-gradient-${placement}-${section}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00a3ff" />
                <stop offset="100%" stopColor="#00ffa3" />
            </linearGradient>
        </defs>
        {section === 'home' ? <><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7" /></> :
            section === 'frontend' ? <><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></> :
            section === 'design' ? <><path d="m12 3 9 9-9 9-9-9Z" /><path d="M3 12h18M12 3l4 9-4 9-4-9Z" /></> :
                <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>}
    </svg>
);
