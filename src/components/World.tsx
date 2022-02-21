import { memo } from 'react';
import { Container } from '@inlet/react-pixi';
import Ant from './Ant';
import Dirt from './Dirt';
import Sand from './Sand';
import type createAnt from '../createAnt';
import type { Element } from '../createWorld';

type Props = {
  elements: Element[][];
  gridSize: number;
  ants: ReturnType<typeof createAnt>[];
}

function World({ elements, ants, gridSize }: Props) {
  return (
    <Container interactiveChildren={false}>
      {
        ants.map(ant => (
          <Ant
            x={ant.x * gridSize}
            y={ant.y * gridSize}
            facingDirection={ant.facingDirection}
            footDirection={ant.footDirection}
          />
        ))
      }

      {
        elements.map((elementRow, rowIndex) => elementRow.map((element, columnIndex) => {
          const elementProps = { x: columnIndex * gridSize, y: rowIndex * gridSize, width: gridSize, height: gridSize };

          if (element === 'dirt') {
            return <Dirt {...elementProps} />;
          }

          if (element === 'sand') {
            return <Sand {...elementProps} />;
          }

          // Technically possible to draw air, but just leverage background color for now for performance?
          return null;
        }))
      }
    </Container>
  );
}

export default memo(World);