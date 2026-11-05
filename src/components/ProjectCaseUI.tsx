import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { Arrow } from './Arrow';

export function SectionKicker({ number, children }: { number: string; children: ReactNode }) {
    return <Kicker className="eyebrow"><span>{number}</span><i aria-hidden="true" /><span>{children}</span></Kicker>;
}
export function VisitProjectLink({ href, domain }: { href: string; domain: string }) {
    return <Visit href={href} target="_blank" rel="noopener noreferrer"><span><small>Live website</small><span>Visit {domain}</span></span><Arrow /></Visit>;
}
const Kicker = styled.span`
    &&& { display: flex; align-items: center; gap: 1.2rem; max-width: 100%; }
    > span:first-of-type { color: #00a3ff; letter-spacing: .06em; }
    > i { flex-shrink: 0; width: 2.4rem; height: var(--line-width); background: var(--accent-line-gradient); }
`;
const Visit = styled.a`
    &&& { display: flex; align-items: center; justify-content: space-between; gap: 2rem; width: min(100%, 32rem); min-height: 8rem; margin: 2.4rem 0 0 auto; padding: 1.6rem 2rem; border-block: 1px solid #24504e; color: #dce5e3; background: none; -webkit-text-fill-color: currentColor; text-shadow: none; font-size: 1.6rem; line-height: 1.5; }
    > span { display: flex; flex-direction: column; gap: .5rem; }
    small { color: #6e9692; font-size: 1rem; letter-spacing: .14em; text-transform: uppercase; }
    svg { color: #00a3ff; font-size: 2rem; transition: transform 200ms ease; }
    &&&:hover { background: rgba(0,163,255,.07); }
    &:hover svg { transform: translate(3px,-3px); }
`;

export function ProjectDetailList({ items }: { items: string[][] }) {
    return <DetailList className="project-detail-list">{items.map(([label, title, detail]) => <div className="project-detail-row" key={label}><span className="detail-plus" aria-hidden="true">+</span><div><small>{label}</small><h3>{title}</h3><p>{detail}</p></div></div>)}</DetailList>;
}
const DetailList = styled.div`
    && { border-top: 1px solid #24504e; min-width: 0; }
    .project-detail-row { display: flex; align-items: flex-start; gap: 2rem; padding: 2.4rem 0; border-bottom: 1px solid #24504e; }
    .detail-plus { width: 1.6rem; flex-shrink: 0; color: #00a3ff; font-size: 1.8rem; line-height: 1; }
    small { display: block; font-size: 1.1rem; line-height: 1.6; color: #6e9692; text-transform: uppercase; letter-spacing: .12em; }
    h3 { font-size: 2.7rem; font-weight: 300; letter-spacing: -.025em; margin: .8rem 0; line-height: 1.3; }
    && p { font-size: 1.5rem; line-height: 1.7; margin: 0; }
    @media (max-width: 640px) { h3 { font-size: 2.5rem; } }
`;
