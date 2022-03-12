import { memo } from 'react';
import Ant from './Ant';
import Dirt from './Dirt';
import Sand from './Sand';
import Air from './Air';
import Tunnel from './Tunnel';
import type createAnt from '../createAnt';
import type { Element } from '../createWorld';

type Props = {
  elements: Element[][];
  // TODO: Am I thinking about this incorrectly if I have naming conflict between Ant (sprite) and Ant type (model?)
  ants: Readonly<ReturnType<typeof createAnt>[]>;
  gridSize: number;
  surfaceLevel: number;
}

function World({ elements, ants, gridSize, surfaceLevel }: Props) {
  return (
    <>
      { /* Air/Tunnel are non-interactive and so can be rendered with a single sprite. Dirt/Sand are interactive and so need to be rendered in grid chunks. */ }
      <Air x={0} y={0} width={elements[0].length * gridSize} height={(surfaceLevel + 1) * gridSize} />
      <Tunnel x={0} y={(surfaceLevel + 1) * gridSize} width={elements[0].length * gridSize} height={(elements.length - (surfaceLevel + 1)) * gridSize} />

      {
        elements.map((elementRow, rowIndex) => elementRow.map((element, columnIndex) => {
          const elementProps = { x: columnIndex * gridSize, y: rowIndex * gridSize, width: gridSize, height: gridSize };

          if (element === 'dirt') {
            return <Dirt {...elementProps} />;
          }

          if (element === 'sand') {
            return <Sand {...elementProps} />;
          }

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
    </>
  );
}

export default memo(World);