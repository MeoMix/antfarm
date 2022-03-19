import { Ant, getRotatedAngle } from './createAnt';
import config from './config';
import { getTimer } from './createAnt';
import { add as addPoint, subtract as subtractPoint } from './Point';
import type { Point } from './Point';
import type { Facing, Angle } from './createAnt';
import type { World  } from './createWorld';

function getDelta(facing: Facing, angle: Angle): Point {
  if (angle === 0 || angle === 180) {
    if (facing === 'right') {
      return { x: angle === 0 ? 1 : -1, y: 0 };
    } else {
      return { x: angle === 0 ? -1 : 1, y: 0 };
    }
  }

  return { x: 0, y: angle === 90 ? -1 : 1 };
}

/** Returns true if the given point falls within the bounds of the world */
function isWithinBounds({ x, y }: Point, { width, height }: World) {
  return x >= 0 && x < width && y >= 0 && y < height;
}

/** Returns the type of element at a given position in the world or undefined if out of bounds */
function getElement(location: Point, world: World) {
  return isWithinBounds(location, world) ? world.elements[location.y][location.x] : undefined;
}

/** Returns true if ant can be in the given location by confirming it exists within air tiles and has solid footing and */
function isValidLocation(ant: Readonly<Ant>, world: World) {
  // TODO: The original logic looked one ahead of the ant as well - is this worth considering?
  const antLocations = Array.from({ length: ant.width }, (_, index) => {
    // Move along the length of the ants body, starting from its head
    let location = ant.location;
    for (let i = 0; i < index; i++) {
      location = subtractPoint(location, getDelta(ant.facing, ant.angle));
    }

    return location;
  });

  // Need completely air along the ants' body for it to be a legal ant location.
  const antLocationElements = antLocations.map(antLocation => getElement(antLocation, world));
  if (antLocationElements.some(element => element !== 'air')) {
    return false;
  }

  // Check that there is some solid footing along the length of the ant
  const footLocations = antLocations.map(antLocation => {
    // Get the location beneath the ants feet at the given location along its body
    return addPoint(antLocation, getDelta(ant.facing, getRotatedAngle(ant.angle, 1)));
  });

  // If everything below the ant is air then it's not a legal location.
  const footLocationElements = footLocations.map(footLocation => getElement(footLocation, world));
  if (footLocationElements.every(element => element === 'air')) {
    return false;
  }

  return true;
}

function move(ant: Readonly<Ant>, world: World) {
  const delta = getDelta(ant.facing, ant.angle);
  const newPoint = addPoint(ant.location, delta);

  if (!isWithinBounds(newPoint, world)) {
    // Hit an edge - need to turn.
    return turn(ant, world);
  }

  // Check if hitting dirt or sand and, if so, dig.
  const element = getElement(newPoint, world);
  if (element === 'dirt' || element === 'sand') {
    // If ant is wandering *below ground level* and bumps into sand or has a chance to dig, dig.
    if (ant.behavior === 'wandering' && ant.location.y > world.surfaceLevel && (getElement(newPoint, world) === 'sand' || Math.random() < config.probabilities.concaveBelowDirtDig)) {
      return dig(ant, true, world);
    } else {
      return turn(ant, world);
    }
  }

  // TODO: This bit reads a little odd. I would think gravity would handle this scenario
  /* We can move forward.  But first, check footing. */
  const footAngle = getRotatedAngle(ant.angle, 1);
  const footPoint = addPoint(newPoint, getDelta(ant.facing, footAngle));
  if (getElement(footPoint, world) === 'air') {
    /* Whoops, we're over air.  Move into the air and turn towards the feet.  But first, see if we should drop. */
    const shouldDropDirt = ant.behavior === 'carrying' && ant.location.y <= world.surfaceLevel && Math.random() < config.probabilities.convexAboveDirtDrop;
    const updatedAnt = shouldDropDirt ? drop(ant, world) : ant;
    return { ...updatedAnt, location: footPoint, angle: footAngle };
  }

  return { ...ant, location: newPoint };
}

function dig(ant: Readonly<Ant>, isForcedForward: boolean, world: World) {
  const angle = isForcedForward ? ant.angle : getRotatedAngle(ant.angle, 1)
  const digLocation = addPoint(ant.location, getDelta(ant.facing, angle));

  const element = getElement(digLocation, world);
  if (element === 'dirt' || element === 'sand') {
    world.elements[digLocation.y][digLocation.x] = 'air';
    loosenNeighbors(digLocation, world);

    return { ...ant, behavior: 'carrying' as const, timer: getTimer('carrying') };
  }

  return ant;
}

function turn(ant: Readonly<Ant>, world: World) {
  // First try turning perpendicularly towards the ant's back. If that fails, try turning around.
  const backAngle = getRotatedAngle(ant.angle, -1);
  if (isValidLocation({ ...ant, angle: backAngle }, world)){
    return { ...ant, angle: backAngle };
  }

  const turnAroundAngle = getRotatedAngle(ant.angle, -2);
  if (isValidLocation({ ...ant, angle: turnAroundAngle }, world)) {
    return { ...ant, angle: turnAroundAngle };
  }

  // Randomly turn in a valid different when unable to simply turn around.
  const facingAngles = [
    { facing: 'left' as const, angle: 0 as const },
    { facing: 'left' as const, angle: 90 as const },
    { facing: 'left' as const, angle: 180 as const },
    { facing: 'left' as const, angle: 270 as const },

    { facing: 'right' as const, angle: 0 as const  },
    { facing: 'right' as const, angle: 90 as const },
    { facing: 'right' as const, angle: 180 as const },
    { facing: 'right' as const, angle: 270 as const },
  ];

  const validFacingAngles = facingAngles.filter(({ facing, angle }) => (facing !== ant.facing || angle !== ant.angle) && isValidLocation({ ...ant, facing, angle }, world));
  if (validFacingAngles.length > 0) {
    const okDirection = validFacingAngles[Math.floor(Math.random() * validFacingAngles.length)];
    return { ...ant, facing: okDirection.facing, angle: okDirection.angle };
  }

  // No legal direction? Trapped! Drop sand and turn randomly in an attempt to dig out.
  let trappedAnt = ant;
  if (ant.behavior === 'carrying' && getElement(ant.location, world) === 'air') {
    trappedAnt = drop(ant, world);
  }
  const randomFacingAngle = facingAngles[Math.floor(Math.random() * facingAngles.length)];

  return { ...trappedAnt, facing: randomFacingAngle.facing, angle: randomFacingAngle.angle }
}

function wander(ant: Readonly<Ant>, world: World) {
  const wanderingAnt = { ...ant, behavior: 'wandering' as const, timer: getTimer('wandering') };
  return move(wanderingAnt, world);
}

function drop(ant: Readonly<Ant>, world: World) {
  world.elements[ant.location.y][ant.location.x] = 'sand' as const;
  loosenOne(ant.location, world);

  return { ...ant, behavior: 'wandering' as const, timer: getTimer('wandering') };
}

function carry(ant: Readonly<Ant>, world: World) {
  const carryingAnt = { ...ant, behavior: 'carrying' as const, timer: getTimer('carrying') };
  return move(carryingAnt, world);
}

export function moveAnts(world: World) {
  return world.ants.map(ant => {
    const movingAnt = { ...ant, timer: ant.timer - 1 };

    // NOTE: timer only resets when behavior changes, timer can (unintuitively) be negative which is valid
    if (movingAnt.timer > 0) {
      return movingAnt;
    }

    // TODO: I think it's weird gravity check doesn't apply until timer is up.
    /* Gravity check. */
    const footDelta = getDelta(movingAnt.facing, getRotatedAngle(movingAnt.angle, 1));
    const f = addPoint(movingAnt.location, footDelta);

    if (getElement(f, world) === 'air') {
      /* Whoops, whatever we were walking on disappeared. */
      const fallPoint = addPoint(movingAnt.location, { x: 0, y: 1 });
      if (getElement(fallPoint, world) === 'air') {
        return { ...movingAnt, location: fallPoint };
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

    throw new Error(`Unsupported behavior: ${movingAnt.behavior}`);
  });
}

function loosenNeighbors(location: Point, world: World) {
  for (let y = location.y + 2; y >= location.y - 2; --y) {
    for (let x = location.x - 2; x <= location.x + 2; ++x) {
      if ((x !== location.x || y !== location.y) && getElement({ x, y }, world) === 'sand') {
        loosenOne({ x, y }, world);
      }
    }
  }
}

 function loosenOne(location: Point, world: World) {
  /* Check if there's already loose sand at this location. */
  if (world.fallingSands.find(sand => sand.x === location.x && sand.y === location.y)) {
    return;
  }

  world.fallingSands.push(location);
}

function getSandDepth(x: number, y: number, world: World) {
  let sandDepth = 0;

  while (getElement({ x, y: sandDepth + y }, world) === 'sand') {
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
    if (!isWithinBounds({ x, y: y + 1 }, world)) {
      /* Hit bottom - done falling and no compaction possible. */
      fallenSandIndices.push(index);
      return;
    }

    /* Drop the sand onto the next lower sand or dirt. */
    if (getElement({ x, y: y + 1 }, world) === 'air') {
      fallingSand.y = y + 1;
      world.elements[y][x] = 'air' as const;
      world.elements[fallingSand.y][fallingSand.x] = 'sand' as const;
      loosenNeighbors({ x, y }, world);
      return;
    }

    /* Tip over an edge? */
    let tipLeft = getElement({ x: x - 1, y }, world) === 'air' && getElement({ x: x - 1, y: y + 1 }, world) === 'air' && getElement({ x: x - 1, y: y + 2 }, world) === 'air';
    let tipRight = getElement({ x: x + 1, y }, world) === 'air' && getElement({ x: x + 1, y: y + 1 }, world) === 'air' && getElement({ x: x + 1, y: y + 2 }, world) === 'air';
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
      loosenNeighbors({ x, y }, world);
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
