import { Sprite } from '@inlet/react-pixi';
import { Loader } from 'pixi.js';
import { memo } from 'react';
import type { Facing, Angle } from '../createAnt';

type Props = {
  x: number;
  y: number;
  width: number;
  height: number;
  facing: Facing;
  angle: Angle;
}

function Ant({ x, y, width, height, facing, angle }: Props) {
  const xFlip = facing === 'right' ? 1 : -1;
  const image = Loader.shared.resources['Ant'].data as HTMLImageElement;

  return (
    <Sprite
      interactiveChildren={false}
      image={image}
      // move pivot to center so changes to angle/scale maintain consistent centering
      pivot={{ x: width / 2, y: height / 2 }}
      // move origin to the same location as its pivot to maintain consistent centering logic
      anchor={{ x: 0.5, y: 0.5 }}
      // offset x/y by half the sprite's *scaled* size to maintain alignment with world elements given the anchor shift
      x={x + (width / 2)}
      y={y + (height / 2)}
      // TODO: visually more appropriate if ants took up multiple grid cells along x axis.
      // scaling img down to fit into grid cell the size of width
      scale={[xFlip * (width / image.width), height / image.height]}
      // TODO: is this a bad architectural decision? technically I am thinking about mirroring improperly by inverting angle when x is flipped?
      angle={-angle * xFlip}
    />
  )
}

export default memo(Ant);