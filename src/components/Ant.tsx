import { Sprite } from '@inlet/react-pixi';
import { memo } from 'react';
import antImage from '../ant.png';
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

  return (
    <Sprite
      /* mirror properly - flipping over an anchor of 0,0 will shift ant position when desired result is to flip over center */
      anchor={[xFlip === -1 ? 1 : 0, yFlip === -1 ? 1 : 0]}
      x={x}
      y={y}
      image={antImage}
      // terrible. scaling img down to fit into 1x1 grid cell so that alignment is ez.
      // ants need to be able to take up multiple grid squares soon but need to wrap my head around it.
      scale={[xFlip * (config.gridSize / 184), yFlip * (config.gridSize / 154)]}
      angle={angle}
    />
  )
}

export default memo(Ant);