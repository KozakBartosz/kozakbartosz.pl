/* eslint-disable @next/next/no-img-element -- Local captures from the game prototype. */
import styled from '@emotion/styled';
import { Arrow } from './Arrow';
import { ProjectDetailList, SectionKicker } from './ProjectCaseUI';

export const medievalSource = 'https://github.com/Code-Cooking-Team/Medieval';
export const medievalDemo = 'https://code-cooking-team.github.io/Medieval/';
const media = '/projects/medieval/';

function GameShot({ file, caption, alt }: { file: string; caption: string; alt: string }) {
    return <figure>
        <img src={media + file + '.webp'} alt={alt} loading="lazy" />
        <figcaption>{caption}</figcaption>
    </figure>;
}

export function MedievalStory() {
    return <Story>
        <section className="epic-native" id="medieval-engine">
            <div>
                <SectionKicker number="03">The engine</SectionKicker>
                <h2>A game engine<br /><em>built for the browser.</em></h2>
                <p>I worked on the React frontend and was responsible for how the entire game was rendered in Three.js. The renderer turns the simulation’s world state into a 3D scene. I also contributed to other parts of the TypeScript engine.</p>
                <p>I extended Three.js with custom terrain geometry. The generator uses layers of noise to shape the map, and the ground renderer applies the world’s tile heights and colors to the mesh.</p>
                <a className="text-link" href={medievalSource + '/tree/6b33c26/src/game'} target="_blank" rel="noreferrer">Explore the engine code <Arrow /></a>
            </div>
            <ProjectDetailList items={[
                ['World generation', 'Procedural terrain', 'Layers of noise shape riverbanks and help distribute forests and stone.'],
                ['Simulation', 'Actors and professions', 'State machines drive jobs like woodcutting. Pathfinding works on a grid of walkable tiles.'],
                ['Rendering', 'Custom Three.js geometry', 'The ground mesh uses the world grid, with separate rendering for water and lighting.'],
            ]} />
        </section>
        <section className="medieval-gallery" id="medieval-art">
            <div className="epic-section-heading">
                <div><SectionKicker number="04">3D art & animation</SectionKicker><h2>Building the <em>village.</em></h2></div>
                <p>I was the lead 3D artist and made every model in the game, from the buildings and trees to the characters. I used camera-based motion capture to create the character animations.</p>
            </div>
            <GameShot file="village" caption="The riverside settlement" alt="Low-poly village buildings beside a river, with warm light from windows and a fire" />
            <div className="medieval-pair">
                <GameShot file="units" caption="Selected units in the village" alt="A group of characters with green selection outlines between buildings" />
                <GameShot file="forest" caption="Forest and river terrain" alt="Low-poly trees and reflective water on a triangulated landscape" />
            </div>
        </section>
        <section className="medieval-gallery" id="medieval-lighting">
            <div className="epic-section-heading">
                <div><SectionKicker number="05">Day and night</SectionKicker><h2>As the light <em>changes.</em></h2></div>
                <p>The environment renderer moves the sun and shifts the color of direct and ambient light over time. Shadows move across the village, and the lit windows and fires stand out as the scene gets darker.</p>
            </div>
            <figure>
                <video src={media + 'day-night.mp4'} poster={media + 'day-night-poster.webp'} controls autoPlay muted playsInline loop aria-label="Recording of the day and night lighting cycle over the village" />
                <figcaption>Day and night cycle in the game</figcaption>
            </figure>
            <div className="medieval-pair">
                <GameShot file="daylight" caption="Warmer light across the settlement" alt="Wide view of the settlement with warm light and long shadows" />
                <GameShot file="night" caption="The village after dark" alt="The same village in cooler light, with bright windows and fires" />
            </div>
        </section>
        <section className="medieval-gallery" id="medieval-prototypes">
            <div className="epic-section-heading">
                <div><SectionKicker number="06">Early builds</SectionKicker><h2>Before the <em>village.</em></h2></div>
                <p>The early maps made it easy to see how the terrain and pathfinding behaved. One screenshot shows a woodcutter that couldn’t reach its wood. The others show the terrain mesh and the debug view we used while developing the generator.</p>
            </div>
            <GameShot file="terrain-debug" caption="Terrain generator debug view" alt="A colorful triangulated test map with trees and a renderer debug panel" />
            <div className="medieval-pair">
                <GameShot file="terrain-prototype" caption="Early terrain and water" alt="An early terrain mesh with ponds, trees and a placeholder building" />
                <GameShot file="blocked-route" caption="An unreachable woodcutting target" alt="An early woodcutter and a tree separated by water" />
            </div>
        </section>
    </Story>;
}

const Story = styled.div`
    .medieval-gallery { padding: clamp(4rem, 6vw, 8rem) 0; border-top: 1px solid #24504e; scroll-margin-top: 3rem; }
    figure { min-width: 0; margin: 3rem 0 0; }
    img, video { display: block; width: 100%; height: auto; border-radius: 1.2rem; }
    figcaption { margin-top: 1rem; color: #91a4a1; font-size: 1.2rem; }
    .medieval-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2.4rem; align-items: start; }
    @media (max-width: 640px) {
        .medieval-pair { grid-template-columns: minmax(0, 1fr); gap: 0; }
    }
`;
