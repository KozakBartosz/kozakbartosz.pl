import styled from '@emotion/styled';
import {} from 'react';

export const Sections = () => {
    return (
        <Container>
            <Section>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                Maiores impedit incidunt, quas esse, perferendis atque at
                tempore blanditiis tempora accusantium provident inventore
                quibusdam alias dolore, architecto dolor beatae in consequuntur?
            </Section>
            <Section>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Repudiandae rerum autem alias illo deserunt! Sint ea officiis
                sit, voluptas harum error quas, eveniet incidunt id consequatur,
                magnam quaerat cumque deserunt!
            </Section>
            <Section>
                C lorem ipsum dolor sit amet consectetur adipisicing elit.
                Repudiandae rerum autem alias illo deserunt! Sint ea officiis
                sit, voluptas harum error quas, eveniet incidunt id consequatur,
                magnam quaerat cumque deserunt!
            </Section>
            <Section>
                Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                Voluptatibus suscipit officiis voluptas consectetur sapiente
                delectus reprehenderit, eaque hic impedit? Magnam ducimus ipsum
                tempora voluptatibus aliquam soluta ratione perspiciatis
                corporis beatae!
            </Section>
        </Container>
    );
};

const Section = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 70rem;
    border: 1px solid red;

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
    position: relative;
    z-index: 5;
    max-width: 178rem;
    padding: 0 2rem 20rem;
    margin: 0rem auto;
`;
