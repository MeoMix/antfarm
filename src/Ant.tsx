import { Sprite } from '@inlet/react-pixi';
import antImage from './ant.png';
import type { Direction } from './types';

type Props = {
  x: number;
  y: number;
  direction: Direction;
}

function Ant({ x, y, direction }: Props) {
  const xFlip = direction === 'right' ? 1 : -1;

  return (
    <Sprite
      anchor={[0.5, 1]}
      x={x}
      y={y}
      image={antImage}
      scale={[xFlip * 0.2, 0.2]}
    />
  )
}

export default Ant;