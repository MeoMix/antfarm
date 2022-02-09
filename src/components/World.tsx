import { useState } from 'react';
import { Container, useTick } from '@inlet/react-pixi';
import Ant from './Ant';
import Dirt from './Dirt';
import Sand from './Sand';
import createAnt from '../createAnt';
import { footFacingDirections, moveAnts, sandFall } from '../util';
import type { Element, FallingSand } from '../createWorld';

type Props = {
  width: number;
  height: number;
  elements: Element[][];
  fallingSands: FallingSand[];
  antCount: number;
  dirtPercent: number;
  gridSize: number;
}

function World({ width, height, elements, fallingSands, antCount, dirtPercent, gridSize }: Props) {
  const [ants, setAnts] = useState(() => {
    return Array.from({ length: antCount }, () => {
      // Put the ant at a random location along the x-axis that fits within the bounds of the world.
      const x = Math.round(Math.random() * 1000) % width;
      // Put the ant on the dirt.
      const y = height - (height * dirtPercent);
  
      const groundLevelDirections = footFacingDirections.filter(({ footDirection }) => footDirection === 'south');
      const randomDirection = groundLevelDirections[Math.floor(Math.random() * groundLevelDirections.length)];
  
      return createAnt(x, y, 'wandering', randomDirection.facingDirection, randomDirection.footDirection);
    });
  });

  // TODO: This doesn't seem like the right approach because it uses RAF which means the simulation stops when inactive.
  useTick(() => {
    const world = { width, height, elements, fallingSands };
    setAnts(moveAnts(ants, world));
    sandFall(world);
  });

  return (
    <Container interactiveChildren={false}>
      {ants.map(ant => (
        <Ant
          x={ant.x * gridSize}
          y={ant.y * gridSize}
          facingDirection={ant.facingDirection}
          footDirection={ant.footDirection}
        />
      ))}

      {elements.map((elementRow, rowIndex) => elementRow.map((element, columnIndex) => {
        const elementProps = { x: columnIndex * gridSize, y: rowIndex * gridSize, width: gridSize, height: gridSize };

        if (element === 'dirt') {
          return <Dirt {...elementProps} />;
        }

        if (element === 'sand') {
          return <Sand {...elementProps} />;
        }

        // Technically possible to draw air, but just leverage background color for now for performance?
        return null;
      }))}
    </Container>
  );
}

export default World;