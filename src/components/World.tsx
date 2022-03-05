import { memo } from 'react';
import { Container } from '@inlet/react-pixi';
import Ant from './Ant';
import Dirt from './Dirt';
import Sand from './Sand';
import Air from './Air';
import type createAnt from '../createAnt';
import type { Element } from '../createWorld';

type Props = {
  elements: Element[][];
  ants: ReturnType<typeof createAnt>[];
  gridSize: number;
  surfaceLevel: number;
}

function World({ elements, ants, gridSize, surfaceLevel }: Props) {
  return (
    <Container interactiveChildren={false}>
      {
        elements.map((elementRow, rowIndex) => elementRow.map((element, columnIndex) => {
          const elementProps = { x: columnIndex * gridSize, y: rowIndex * gridSize, width: gridSize, height: gridSize };

          if (element === 'dirt') {
            return <Dirt {...elementProps} />;
          }

          if (element === 'sand') {
            return <Sand {...elementProps} />;
          }

          // TODO: Don't draw air as grid squares, leverage two backgrounds - one for air and one for subsurface dirt
          if (element === 'air' && rowIndex <= surfaceLevel) {
            return <Air {...elementProps} />
          }

          // This will show brown since that's the background color of the world
          return null;
        }))
      }

      {
        ants.map(ant => (
          <Ant
            x={ant.x * gridSize}
            y={ant.y * gridSize}
            width={gridSize}
            facingDirection={ant.facingDirection}
            footDirection={ant.footDirection}
          />
        ))
      }

    </Container>
  );
}

export default memo(World);