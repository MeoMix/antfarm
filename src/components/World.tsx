import { memo } from 'react';
import Ant from './Ant';
import Tunnel from './Tunnel';
import type createAnt from '../createAnt';
import type { Element } from '../createWorld';
import Elements from './Elements';
import Air from './Air';

type Props = {
  elements: Element[][];
  // TODO: Am I thinking about this incorrectly if I have naming conflict between Ant (sprite) and Ant type (model?)
  ants: Readonly<ReturnType<typeof createAnt>[]>;
  surfaceLevel: number;
  antColor: string;
}

function World({ elements, ants, surfaceLevel, antColor }: Props) {
  return (
    <>
      { /* Air/Tunnel are non-interactive and so can be rendered with a single sprite. Dirt/Sand are interactive and so need to be rendered in grid chunks. */ }
      <Air x={0} y={0} width={elements[0].length} height={surfaceLevel + 1} />
      <Tunnel x={0} y={surfaceLevel + 1} width={elements[0].length} height={elements.length - surfaceLevel - 1} />

      <Elements elements={elements} />

      {
        ants.map((ant, index) => (
          <Ant
            key={`ant-${index}`}
            x={ant.location.x}
            y={ant.location.y}
            width={1.2}
            height={1.2}
            facing={ant.facing}
            angle={ant.angle}
            behavior={ant.behavior}
            name={ant.name}
            color={antColor}
          />
        ))
      }
    </>
  );
}

export default memo(World);