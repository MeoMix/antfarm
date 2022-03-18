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
  surfaceLevel: number;
}

function World({ elements, ants, surfaceLevel }: Props) {
  return (
    <>
      { /* Air/Tunnel are non-interactive and so can be rendered with a single sprite. Dirt/Sand are interactive and so need to be rendered in grid chunks. */ }
      <Air x={0} y={0} width={elements[0].length} height={surfaceLevel + 1} />
      <Tunnel x={0} y={surfaceLevel + 1} width={elements[0].length} height={elements.length - surfaceLevel - 1} />

      {
        elements.map((elementRow, y) => elementRow.map((element, x) => {
          const elementProps = { x, y, width: 1, height: 1 };

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
            x={ant.location.x}
            y={ant.location.y}
            width={1}
            facing={ant.facing}
            angle={ant.angle}
          />
        ))
      }
    </>
  );
}

export default memo(World);