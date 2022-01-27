import type { Direction } from './types';

export function getOppositeDirection(direction: Direction) {
  switch (direction) {
    case 'up': return 'down' as const;
    case 'down': return 'up' as const;
    case 'left': return 'right' as const;
    case 'right': return 'left' as const;
  }
}
