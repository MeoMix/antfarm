import { Container, Sprite } from '@inlet/react-pixi';
import { Loader } from 'pixi.js';
import { memo } from 'react';
import type { Facing, Angle, Behavior } from '../createAnt';
import Sand from './Sand';

type Props = {
  x: number;
  y: number;
  width: number;
  height: number;
  facing: Facing;
  angle: Angle;
  color: string;
  behavior: Behavior;
}

function Ant({ x, y, width, height, facing, angle, behavior, color }: Props) {
  const xFlip = facing === 'right' ? 1 : -1;
  const image = Loader.shared.resources['Ant'].data as HTMLImageElement;

  return (
    <>
      <Container
        // move pivot to center so changes to angle/scale maintain consistent centering
        pivot={{ x: width / 2, y: height / 2 }}
        // move origin to the same location as its pivot to maintain consistent centering logic
        anchor={{ x: 0.5, y: 0.5 }}
        // TODO: is this a bad architectural decision? technically I am thinking about mirroring improperly by inverting angle when x is flipped?
        angle={-angle * xFlip}
        // offset x/y by half the sprite's *scaled* size to maintain alignment with world elements given the anchor shift
        x={x + (width / 2)}
        y={y + (height / 2)}
        scale={[xFlip, 1]}
      >
        { behavior === 'carrying' ? <Sand x={1} y={0.33} width={0.5} height={0.5} /> : null }

        <Sprite
          interactiveChildren={false}
          image={image}
          // TODO: visually more appropriate if ants took up multiple grid cells along x axis.
          // scaling img down to fit into grid cell the size of width
          scale={[width / image.width, height / image.height]}
          tint={parseInt(color.slice(1), 16)}
        />
      </Container>
    </>
  )
}

export default memo(Ant);