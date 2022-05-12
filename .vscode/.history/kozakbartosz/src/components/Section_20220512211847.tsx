import styled from '@emotion/styled';
import {} from 'react';

export const Sections = () => {
    return (
        <Container>
            <Section>A</Section>
            <Section>B</Section>
            <Section>C</Section>
            <Section>D</Section>
        </Container>
    );
};

const Section = styled.div`
    margin: 0rem auto;

    @media (min-width: 1000px) {
        &:nth-child(even) {
            margin-left: 50%;
        }
        &:nth-child(odd) {
            margin-right: 50%;
        }
    }
`;

const Container = styled.div`
    max-width: 178rem;
    padding: 0 2rem 20rem;
`;
