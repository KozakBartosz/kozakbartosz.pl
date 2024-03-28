import styled from '@emotion/styled';

export const Loading = styled.div`
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    text-align: center;
    flex-direction: column;
    color: #ffffff4f;
    letter-spacing: 0.2rem;
    text-transform: uppercase;
    opacity: 0;
    animation: 0.2s fadeIn forwards ease 2s;

    &::before {
        content: '';
        display: block;
        width: 5rem;
        height: 5rem;
        border: 0.5rem solid transparent;
        border-top-color: rgba(255, 255, 255, 0.778);
        /* border-image: linear-gradient(to right, #f1f5f7, #d80b77) 1 0 0 0; */
        border-radius: 50%;
        animation: 0.35s Loading infinite cubic-bezier(0.42, 0.31, 0.51, 0.89);
    }
`;
