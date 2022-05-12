import styled from '@emotion/styled';
import {} from 'react';

export const Sections = () => {
    return (
        <Container>
            <Section></Section>
        </Container>
    );
};

const Section = styled.div`
    margin: 400px auto;
`;

const Container = styled.div`
    max-width: 178rem;
    padding: 0 2rem;
`;
