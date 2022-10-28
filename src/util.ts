import { Ant, getRotatedAngle } from './createAnt';
import type { Settings } from './config';
import { getTimer, facingAngles } from './createAnt';
import { add as addPoint } from './Point';
import type { Point } from './Point';
import type { Facing, Angle } from './createAnt';
import type { World  } from './createWorld';

// TODO: getDelta should probably not be coupled to 'facing'?
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
function getElement(location: Point, elements: World['elements']) {
  return elements[location.y]?.[location.x];
}

/** Returns true if ant can be in the given location by confirming it exists within air and has solid footing */
function isValidLocation(ant: Readonly<Ant>, world: World) {
  // TODO: The original logic looked one ahead of the ant as well - is this worth considering?

  // Need air at the ants' body for it to be a legal ant location.
  if (getElement(ant.location, world.elements) !== 'air') {
    return false;
  }

  // Get the location beneath the ants' feet and check for air
  const footLocation = addPoint(ant.location, getDelta(ant.facing, getRotatedAngle(ant.angle, 1)));
  if (getElement(footLocation, world.elements) === 'air') {
    return false;
  }

  return true;
}

function move(ant: Readonly<Ant>, world: World, probabilities: Settings['probabilities']) {
  const delta = getDelta(ant.facing, ant.angle);
  const newPoint = addPoint(ant.location, delta);

  if (!isWithinBounds(newPoint, world)) {
    // Hit an edge - need to turn.
    return turn(ant, world);
  }

  // Check if hitting dirt or sand and, if so, consider digging through it.
  const element = getElement(newPoint, world.elements);
  if (element === 'dirt' || element === 'sand') {
    // If ant is wandering *below ground level* and bumps into sand or has a chance to dig, dig.
    if (ant.behavior === 'wandering' && ant.location.y > world.surfaceLevel && (element === 'sand' || Math.random() < probabilities.belowSurfaceDig)) {
      return dig(ant, true, world);
    } else {
      return turn(ant, world);
    }
  }

  /* We can move forward.  But first, check footing. */
  const footAngle = getRotatedAngle(ant.angle, 1);
  const footPoint = addPoint(newPoint, getDelta(ant.facing, footAngle));
  if (getElement(footPoint, world.elements) === 'air') {
    // If ant moves straight forward, it will be standing over air. Instead, turn into the air and remain standing on current block
    // Ant will try to fill the gap with sand if possible.
    const shouldDropSand = ant.behavior === 'carrying' && ant.location.y <= world.surfaceLevel && Math.random() < probabilities.aboveSurfaceDrop;
    
    // If dropping sand into gap then just do that for now, next tick can decide to walk onto it
    if (shouldDropSand) {
      return drop(ant, world);
    } else {
      return { ...ant, location: footPoint, angle: footAngle };
    }
  }

  return { ...ant, location: newPoint };
}

function dig(ant: Readonly<Ant>, isForcedForward: boolean, world: World) {
  const angle = isForcedForward ? ant.angle : getRotatedAngle(ant.angle, 1)
  const digLocation = addPoint(ant.location, getDelta(ant.facing, angle));

  const element = getElement(digLocation, world.elements);
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
  const validFacingAngles = facingAngles.filter(({ facing, angle }) => {
    if (facing === ant.facing && angle === ant.angle) {
      return false;
    }

    return isValidLocation({ ...ant, facing, angle }, world);
  });

  if (validFacingAngles.length > 0) {
    const validFacingAngle = validFacingAngles[Math.floor(Math.random() * validFacingAngles.length)];
    return { ...ant, ...validFacingAngle };
  }

  // No legal direction? Trapped! Drop sand and turn randomly in an attempt to dig out.
  let trappedAnt = ant;
  if (ant.behavior === 'carrying' && getElement(ant.location, world.elements) === 'air') {
    trappedAnt = drop(ant, world);
  }
  const randomFacingAngle = facingAngles[Math.floor(Math.random() * facingAngles.length)];
  return { ...trappedAnt, facing: randomFacingAngle.facing, angle: randomFacingAngle.angle }
}

function wander(ant: Readonly<Ant>, world: World, probabilities: Settings['probabilities']) {
  const wanderingAnt = { ...ant, behavior: 'wandering' as const, timer: getTimer('wandering') };
  return move(wanderingAnt, world, probabilities);
}

function drop(ant: Readonly<Ant>, world: World) {
  if (getElement(ant.location, world.elements) === 'air') {
    world.elements[ant.location.y][ant.location.x] = 'sand' as const;
    loosenOneSand(ant.location, world);
  
    return { ...ant, behavior: 'wandering' as const, timer: getTimer('wandering') };
  }

  // TODO: Consider moving instead? Same problem as dig where 100% chance means locked in place
  return ant;
}

function carry(ant: Readonly<Ant>, world: World, probabilities: Settings['probabilities']) {
  const carryingAnt = { ...ant, behavior: 'carrying' as const, timer: getTimer('carrying') };
  return move(carryingAnt, world, probabilities);
}

export function moveAnts(world: World, probabilities: Settings['probabilities']) {
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

    if (getElement(f, world.elements) === 'air') {
      /* Whoops, whatever we were walking on disappeared. */
      const fallPoint = addPoint(movingAnt.location, { x: 0, y: 1 });
      if (getElement(fallPoint, world.elements) === 'air') {
        return { ...movingAnt, location: fallPoint };
      } else {
        /* Can't fall?  Try turning. */
        return turn(movingAnt, world);
      }
    }

		/* Ok, the ant gets to do something. */
    switch (movingAnt.behavior) {
      case 'wandering':
        if (Math.random() < probabilities.randomDig) {
          return dig(movingAnt, false, world);
        } else if (Math.random() < probabilities.randomTurn) {
          return turn(movingAnt, world);
        } else {
          return wander(movingAnt, world, probabilities);
        }
      case 'carrying':
        if (Math.random() < probabilities.randomDrop) {
          return drop(movingAnt, world);
        }

        return carry(movingAnt, world, probabilities);
    }

    throw new Error(`Unsupported behavior: ${movingAnt.behavior}`);
  });
}

function getAdjacentLocations(location: Point, radius: number) {
  const locations = [];

  for (let y = location.y + radius; y >= location.y - radius; --y) {
    for (let x = location.x - radius; x <= location.x + radius; ++x) {
      if (x !== location.x || y !== location.y) {
        locations.push({ x, y });
      }
    }
  }

  return locations;
}

function loosenNeighbors(location: Point, world: World) {
  getAdjacentLocations(location, 2)
    .filter(({ x, y }) => getElement({ x, y }, world.elements) === 'sand')
    .forEach(({ x, y }) => loosenOneSand({ x, y }, world));
}

 function loosenOneSand({ x, y }: Point, world: World) {
  /* Check if there's already loose sand at this location. */
  if (world.fallingSandLocations.find(fallingSandLocation => fallingSandLocation.x === x && fallingSandLocation.y === y)) {
    return;
  }

  world.fallingSandLocations.push({ x, y });
}

function getSandDepth(x: number, y: number, elements: World['elements']) {
  let sandDepth = 0;

  while (getElement({ x, y: sandDepth + y }, elements) === 'sand') {
    sandDepth += 1;
  }

  return sandDepth;
}

function swapElements(locationA: Point, locationB: Point, elements: World['elements']) {
  const element = elements[locationA.y][locationA.x];
  elements[locationA.y][locationA.x] = elements[locationB.y][locationB.x];
  elements[locationB.y][locationB.x] = element;
}

// Note that in a crowded world ants may fall *with* sand that's falling. This is an unintentional feature because it's hilarious.
export function sandFall(world: World, compactSandDepth: number) {
  // Derive a map from active sand locations to updated sand locations which will be shown next frame.
  // If the location does not update then the active sand has come to rest and will cease being tracked.
  const fallingSandLocationMap = new Map<Point, Point>(world.fallingSandLocations.map(({ x, y }) => {
    // If there is air below the sand then continue falling down.
    const goMiddle = getElement({ x, y: y + 1 }, world.elements) === 'air';
    // Otherwise, likely at rest, but potential for tipping off a precarious ledge.
    // Look for a column of air two units tall to either side of the sand and consider going in one of those directions.
    let goLeft = !goMiddle && getElement({ x: x - 1, y }, world.elements) === 'air' && getElement({ x: x - 1, y: y + 1 }, world.elements) === 'air';
    let goRight = !goMiddle && getElement({ x: x + 1, y }, world.elements) === 'air' && getElement({ x: x + 1, y: y + 1 }, world.elements) === 'air';
    if (goLeft && goRight) {
      // Flip a coin and choose a direction randomly to resolve ambiguity in fall direction.
      if (Math.random() < 0.5) {
        goLeft = false;
      } else {
        goRight = false;
      }
    }

    const xDelta = (goRight ? 1 : 0) + (goLeft ? -1 : 0);
    const yDelta = (goMiddle || goLeft || goRight ? 1 : 0);
    return [{ x, y }, { x: x + xDelta, y: y + yDelta } ];
  }));

  // Create a separate map which omits tracked sand locations which were inactive this frame.
  const activeFallingSandLocationMap = new Map(
    Array.from(fallingSandLocationMap.entries())
      .filter(([oldSandLocation, newSandLocation]) => oldSandLocation.y !== newSandLocation.y)
  );

  // For all the sand locations which are active - swap the elements (sand/air) at the two locations.
  activeFallingSandLocationMap.forEach((newSandLocation, oldSandLocation) => {
    swapElements(oldSandLocation, newSandLocation, world.elements);
  });

  // Filter sand locations which became inactive from the list of tracked locations.
  world.fallingSandLocations = Array.from(activeFallingSandLocationMap.values());

  // As a final flair, consider compaction effects and cascading tumbling of sand.
  fallingSandLocationMap.forEach((newSandLocation, oldSandLocation) => {
    if (oldSandLocation.y === newSandLocation.y) {
      // At deep enough levels, sand finds itself crushed back into dirt.
      const sandDepth = getSandDepth(oldSandLocation.x, oldSandLocation.y + 1, world.elements);
      if (sandDepth >= compactSandDepth) {
        world.elements[oldSandLocation.y + sandDepth][oldSandLocation.x] = 'dirt';
      }
    } else {
      // Sand moved, leaving a gap of air, which may cause more sand to fall. Figure out
      // what is happening and do it cheaply by only considering updates around the active area.
      loosenNeighbors(newSandLocation, world)
    }
  });
}