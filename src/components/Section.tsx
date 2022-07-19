import styled from '@emotion/styled';
import { MutableRefObject } from 'react';

export const Sections = ({
    iconRef
}: {
    iconRef: MutableRefObject<HTMLDivElement[]>;
}) => {
    return (
        <Container>
            <Section>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                Maiores impedit incidunt, quas esse, perferendis atque at
                tempore blanditiis tempora accusantium provident inventore
                quibusdam alias dolore, architecto dolor beatae in consequuntur?
                <Icon
                    ref={(el) => {
                        iconRef.current.push(el!);
                    }}
                />
            </Section>
            <Section>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Repudiandae rerum autem alias illo deserunt! Sint ea officiis
                sit, voluptas harum error quas, eveniet incidunt id consequatur,
                magnam quaerat cumque deserunt!
                <Icon
                    ref={(el) => {
                        iconRef.current.push(el!);
                    }}
                />
            </Section>
            <Section>
                C lorem ipsum dolor sit amet consectetur adipisicing elit.
                Repudiandae rerum autem alias illo deserunt! Sint ea officiis
                sit, voluptas harum error quas, eveniet incidunt id consequatur,
                magnam quaerat cumque deserunt!
                <Icon
                    ref={(el) => {
                        iconRef.current.push(el!);
                    }}
                />
            </Section>
            <Section>
                Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                Voluptatibus suscipit officiis voluptas consectetur sapiente
                delectus reprehenderit, eaque hic impedit? Magnam ducimus ipsum
                tempora voluptatibus aliquam soluta ratione perspiciatis
                corporis beatae!
                <Icon
                    ref={(el) => {
                        iconRef.current.push(el!);
                    }}
                />
            </Section>
        </Container>
    );
};

const Icon = styled.div`
    position: absolute;
    top: 0%;
    left: 50%;
    width: 10px;
    height: 10px;
    background: red;
`;

const Section = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8rem;

    min-height: 70rem;
    /* border: 1px solid red; */

    @media (min-width: 1000px) {
        &:nth-child(even) {
            margin-left: 50%;
        }
        &:nth-child(even) ${Icon} {
            left: -50%;
            top: 50%;
        }
        &:nth-child(odd) {
            margin-right: 50%;
        }
        &:nth-child(odd) ${Icon} {
            left: 150%;
            top: 50%;
        }
    }
`;

const Container = styled.div`
    /* top: 0;
    left: 0;
    position: absolute; */
    position: relative;
    z-index: 5;
    max-width: 158rem;
    padding: 0 2rem 20rem;
    margin: 2rem auto;
    /* margin-top: -700px; */
`;
