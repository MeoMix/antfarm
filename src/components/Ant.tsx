import { Sprite } from '@inlet/react-pixi';
import antImage from '../ant.png';
import type { Direction } from '../types';

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
      anchor={[0.5, 1]}
      x={x}
      y={y}
      image={antImage}
      scale={[xFlip * 0.15, yFlip * 0.15]}
      angle={angle}
    />
  )
}

export default Ant;