import type { Direction } from './types';
import type { Ant } from './createAnt';
import config from './config';
import { getTimer } from './createAnt';
import type { World  } from './createWorld';

export function getOppositeDirection(direction: Direction) {
  switch (direction) {
    case 'north': return 'south' as const;
    case 'south': return 'north' as const;
    case 'west': return 'east' as const;
    case 'east': return 'west' as const;
  }
}

export const footFacingDirections = [
  { footDirection: 'south' as const, facingDirection: 'west' as const },
  { footDirection: 'south' as const, facingDirection: 'east' as const },

  { footDirection: 'north' as const, facingDirection: 'west' as const },
  { footDirection: 'north' as const, facingDirection: 'east' as const },

  { footDirection: 'east' as const, facingDirection: 'south' as const },
  { footDirection: 'east' as const, facingDirection: 'north' as const },

  { footDirection: 'west' as const, facingDirection: 'south' as const },
  { footDirection: 'west' as const, facingDirection: 'north' as const },
];

// TODO: Probably more clear if expressed as rotate clockwise/counter-clockwise
function getFootDirections(facingDirection: Direction, footDirection: Direction) {
  return {
    facingDirection: footDirection,
    footDirection: getOppositeDirection(facingDirection),
  }
}

function getBackDirections(facingDirection: Direction, footDirection: Direction) {
  return {
    facingDirection: getOppositeDirection(footDirection),
    footDirection: facingDirection,
  };
}

function getDelta(facingDirection: Direction, footDirection: Direction) {
  if (footDirection === 'south' || footDirection === 'north') {
    switch (facingDirection) {
      case 'west':
        return { x: -1, y: 0 };
      case 'east':
        return { x: 1, y: 0 };
      case 'north':
      case 'south':
        throw new Error('invalid');
    }
  }

  if (footDirection === 'east' || footDirection === 'west') {
    switch (facingDirection) {
      case 'west':
      case 'east':
        throw new Error('invalid');
      case 'north':
        return { x: 0, y: -1 };
      case 'south':
        return { x: 0, y: 1 };
    }
  }

  throw new Error('unsupported');
}

function isLegalDirection(ant: Readonly<Ant>, facingDirection: Direction, footDirection: Direction, world: World) {
  const delta = getDelta(facingDirection, footDirection);
  const newX = ant.x + delta.x;
  const newY = ant.y + delta.y;

  // Check that there is air ahead
  if (newX < 0 || newX >= world.width || newY < 0 || newY >= world.height || world.elements[newY][newX] !== 'air') {
    return false;
  }

  const footDirections = getFootDirections(facingDirection, footDirection);
  const footDelta = getDelta(footDirections.facingDirection, footDirections.footDirection);
  const footNewX = ant.x + footDelta.x;
  const footNewY = ant.y + footDelta.y;

  // Check that there is solid footing
  if (footNewX >= 0 && footNewX < world.width && footNewY >= 0 && footNewY < world.height && world.elements[footNewY][footNewX] === 'air') {
    return false;
  }

  return true;
}

function move(ant: Readonly<Ant>, world: World) {
  const delta = getDelta(ant.facingDirection, ant.footDirection);

  const newX = ant.x + delta.x;
  const newY = ant.y + delta.y;

  if (newX < 0 || newX >= world.width || newY < 0 || newY >= world.height) {
    // Hit an edge - need to turn.
    return turn(ant, world);
  }

  // Check if hitting dirt or sand and, if so, dig.
  if (world.elements[newY][newX] !== 'air') {
    /* Hit dirt or sand.  Dig? */
    // If ant is wandering *below ground level* and bumps into sand or has a chance to dig, dig.
    if (ant.behavior === 'wandering' && ant.y > world.surfaceLevel && (world.elements[newY][newX] === 'sand' || Math.random() < config.probabilities.concaveBelowDirtDig)) {
      /* Yes, try digging. */
      return dig(ant, true, world);
    } else {
      /* Nope, no digging.  Turn. */
      return turn(ant, world);
    }
  }

  /* We can move forward.  But first, check footing. */
  const footDirections = getFootDirections(ant.facingDirection, ant.footDirection);
  const footDelta = getDelta(footDirections.facingDirection, footDirections.footDirection);

  const fx = newX + footDelta.x;
  const fy = newY + footDelta.y;

  if (fx >= 0 && fx < world.width && fy >= 0 && fy < world.height && world.elements[fy][fx] === 'air') {
    /* Whoops, we're over air.  Move into the air and turn towards the feet.  But first, see if we should drop. */
    let updatedAnt = ant;
    if (ant.behavior === 'carrying' && ant.y <= world.surfaceLevel && Math.random() < config.probabilities.convexAboveDirtDrop) {
      updatedAnt = drop(ant, world);
    }
    return { ...updatedAnt, x: fx, y: fy, facingDirection: footDirections.facingDirection, footDirection: footDirections.footDirection };
  }

  return { ...ant, x: newX, y: newY };
}

function dig(ant: Readonly<Ant>, isForcedForward: boolean, world: World) {
  const { facingDirection, footDirection } = isForcedForward ? ant : getFootDirections(ant.facingDirection, ant.footDirection);
  const delta = getDelta(facingDirection, footDirection); 

  const x = ant.x + delta.x;
  const y = ant.y + delta.y;

  if (x >= 0 && x < world.width && y >= 0 && y < world.height && world.elements[y][x] !== 'air') {
    world.elements[y][x] = 'air';
    loosenNeighbors(x, y, world);

    return { ...ant, behavior: 'carrying' as const, timer: getTimer('carrying') };
  }

  return ant;
}

function turn(ant: Readonly<Ant>, world: World) {
  // First try turning perpendicularly towards the ant's back. If that fails, try turning around.
  const backDirections1 = getBackDirections(ant.facingDirection, ant.footDirection);
  if (isLegalDirection(ant, backDirections1.facingDirection, backDirections1.footDirection, world)){
    return { ...ant, facingDirection: backDirections1.facingDirection, footDirection: backDirections1.footDirection };
  }

  const backDirections2 = getBackDirections(backDirections1.facingDirection, backDirections1.footDirection);
  if (isLegalDirection(ant, backDirections2.facingDirection, backDirections2.footDirection, world)) {
    return { ...ant, facingDirection: backDirections2.facingDirection, footDirection: backDirections2.footDirection };
  }

  // Randomly turn in a valid different when unable to simply turn around.
  const okDirections = footFacingDirections.filter(({ facingDirection, footDirection }) => (facingDirection !== ant.facingDirection || footDirection !== ant.footDirection) && isLegalDirection(ant, facingDirection, footDirection, world));
  if (okDirections.length > 0) {
    const okDirection = okDirections[Math.floor(Math.random() * okDirections.length)];
    return { ...ant, facingDirection: okDirection.facingDirection, footDirection: okDirection.footDirection };
  }

  // No legal direction? Trapped! Drop sand and turn randomly in an attempt to dig out.
  let trappedAnt = ant;
  if (ant.behavior === 'carrying' && world.elements[ant.y][ant.x] === 'air') {
    trappedAnt = drop(ant, world);
  }
  const randomDirection = footFacingDirections[Math.floor(Math.random() * footFacingDirections.length)];

  return { ...trappedAnt, facingDirection: randomDirection.facingDirection, footDirection: randomDirection.footDirection }
}

function wander(ant: Readonly<Ant>, world: World) {
  const wanderingAnt = { ...ant, behavior: 'wandering' as const, timer: getTimer('wandering') };
  return move(wanderingAnt, world);
}

function drop(ant: Readonly<Ant>, world: World) {
  world.elements[ant.y][ant.x] = 'sand' as const;
  loosenOne(ant.x, ant.y, world);

  return { ...ant, behavior: 'wandering' as const, timer: getTimer('wandering') };
}

function carry(ant: Readonly<Ant>, world: World) {
  const carryingAnt = { ...ant, behavior: 'carrying' as const, timer: getTimer('carrying') };
  return move(carryingAnt, world);
}

export function moveAnts(ants: Readonly<Ant[]>, world: World) {
  return ants.map(ant => {
    const movingAnt = { ...ant, timer: ant.timer - 1 };

    if (movingAnt.timer > 0) {
      return movingAnt;
    }
    
    /* Gravity check. */
    const footDirections = getFootDirections(movingAnt.facingDirection, movingAnt.footDirection);
    const footDelta = getDelta(footDirections.facingDirection, footDirections.footDirection);
    const fx = movingAnt.x + footDelta.x;
    const fy = movingAnt.y + footDelta.y;

    if (fx >= 0 && fx < world.width && fy >= 0 && fy < world.height && world.elements[fy][fx] === 'air') {
      /* Whoops, whatever we were walking on disappeared. */
      if (movingAnt.y + 1 < world.height && world.elements[movingAnt.y + 1][movingAnt.x] === 'air') {
        return { ...movingAnt, y: movingAnt.y + 1};
      } else {
        /* Can't fall?  Try turning. */
        return turn(movingAnt, world);
      }
    }

		/* Ok, the ant gets to do something. */
    switch (movingAnt.behavior) {
      case 'wandering':
        if (Math.random() < config.probabilities.randomDig) {
          return dig(movingAnt, false, world);
        } else if (Math.random() < config.probabilities.randomTurn) {
          return turn(movingAnt, world);
        } else {
          return wander(movingAnt, world);
        }
      case 'carrying':
        if (Math.random() < config.probabilities.randomDrop) {
          return drop(movingAnt, world);
        }

        return carry(movingAnt, world);
    }

    return movingAnt;
  });
}

function loosenNeighbors(xc: number, yc: number, world: World) {
  for (let y = yc + 2; y >= yc - 2; --y) {
    for (let x = xc - 2; x <= xc + 2; ++x) {
      if ((x !== xc || y !== yc) && x >= 0 && x < world.width && y >= 0 && y < world.height && world.elements[y][x] === 'sand') {
        loosenOne(x, y, world);
      }
    }
  }
}

 function loosenOne(x: number, y: number, world: World) {
  /* Check if there's already loose sand at this location. */
  if (world.fallingSands.find(sand => sand.x === x && sand.y === y)) {
    return;
  }

  world.fallingSands.push({ x, y });
}

function getSandDepth(x: number, y: number, world: World) {
  let sandDepth = 0;

  while (sandDepth + y < world.height && world.elements[sandDepth + y][x] === 'sand') {
    sandDepth += 1;
  }

  return sandDepth;
}

// TOOD: IDK how I feel about it, but in a very crowded ant world ants can fall *with* the sand that's falling.
// It's actually pretty great, but I feel kind of bad for the ants and it seems unintentional.
export function sandFall(world: World) {
  const fallenSandIndices = [] as number[];

  world.fallingSands.forEach((fallingSand, index) => {
    const x = fallingSand.x;
    const y = fallingSand.y;
    if (y + 1 >= world.height) {
      /* Hit bottom - done falling and no compaction possible. */
      fallenSandIndices.push(index);
      return;
    }

    /* Drop the sand onto the next lower sand or dirt. */
    if (world.elements[y + 1][x] === 'air') {
      fallingSand.y = y + 1;
      world.elements[y][x] = 'air' as const;
      world.elements[fallingSand.y][fallingSand.x] = 'sand' as const;
      loosenNeighbors(x, y, world);
      return;
    }

    /* Tip over an edge? */
    let tipLeft = (x - 1 >= 0 && y + 2 < world.height && world.elements[y][x - 1] === 'air' && world.elements[y + 1][x - 1] === 'air' && world.elements[y + 2][x - 1] === 'air');
    let tipRight = (x + 1 < world.width && y + 2 < world.height && world.elements[y][x + 1] === 'air' && world.elements[y + 1][x + 1] === 'air' && world.elements[y + 2][x + 1] === 'air');
    if (tipLeft || tipRight) {
      if (tipLeft && tipRight) {
        if (Math.random() < 0.5) {
          tipLeft = false;
        } else {
          tipRight = false;
        }
      }

      fallingSand.x = tipLeft ? x - 1 : x + 1;
      fallingSand.y = y + 1;
      world.elements[y][x] = 'air';
      world.elements[fallingSand.y][fallingSand.x] = 'sand';
      // TODO: This is mutating the fallingSands array as it's being iterated over which seems confusing and/or not implicitly understood
      loosenNeighbors(x, y, world);
      return;
    }

    /* Found the final resting place. */
    fallenSandIndices.push(index);

    /* Compact sand into dirt. */
    const sandDepth = getSandDepth(x, y + 1, world);
    if (sandDepth >= config.compactSandDepth) {
      world.elements[y + sandDepth][x] = 'dirt';
    }
  });

  // reverse because index position is important and am removing from array which affects indices.
  fallenSandIndices.reverse().forEach(index => {
    world.fallingSands.splice(index, 1);
  })
}
