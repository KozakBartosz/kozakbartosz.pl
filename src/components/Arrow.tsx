export const Arrow = ({ direction = 'up-right' }: { direction?: 'up-right' | 'up' | 'down' }) => (
    <svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="butt" strokeLinejoin="miter"
        style={{ display: 'inline-block', width: '1em', height: '1em', flexShrink: 0, verticalAlign: 'middle' }}>
        <g transform={direction === 'up' ? 'rotate(-45 12 12)' : direction === 'down' ? 'rotate(135 12 12)' : undefined}>
            <path d="M4 4H20V20M4 20L20 4" />
        </g>
    </svg>
);
