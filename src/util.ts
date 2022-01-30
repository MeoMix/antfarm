import type { Direction } from './types';

export function getOppositeDirection(direction: Direction) {
  switch (direction) {
    case 'north': return 'south' as const;
    case 'south': return 'north' as const;
    case 'west': return 'east' as const;
    case 'east': return 'west' as const;
  }
}
