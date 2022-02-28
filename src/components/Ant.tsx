import { Sprite } from '@inlet/react-pixi';
import { Loader } from 'pixi.js';
import { memo } from 'react';
import type { Direction } from '../types';
import config from '../config';

type Props = {
  x: number;
  y: number;
  facingDirection: Direction;
  footDirection: Direction;
}

function Ant({ x, y, facingDirection, footDirection }: Props) {
  const xFlip = facingDirection === 'west' || facingDirection === 'south' ? -1 : 1;
  const yFlip = footDirection === 'north' || footDirection === 'west' ? -1 : 1;
  const angle = footDirection === 'south' || footDirection === 'north' ? 0 : -90;
  const image = Loader.shared.resources['Ant'].data as HTMLImageElement;

  return (
    <Sprite
      image={image}
      // move pivot to center so changes to angle/scale maintain consistent centering 
      pivot={{ x: config.gridSize / 2, y: config.gridSize / 2 }}
      // move origin to the same location as its pivot to maintain consistent centering logic
      anchor={{ x: 0.5, y: 0.5 }}
      // offset x/y by half the sprite's *scaled* size to maintain alignment with world elements given the anchor shift
      x={x + (config.gridSize / 2)}
      y={y + (config.gridSize / 2)}
      // TODO: visually more appropriate if ants took up multiple grid cells along x axis.
      // scaling img down to fit into grid cell the size of config.gridSize
      scale={[xFlip * (config.gridSize / image.width), yFlip * (config.gridSize / image.height)]}
      angle={angle}
    />
  )
}

export default memo(Ant);