import { Ant, getRotatedAngle } from '../createAnt';
import type { Settings } from '../config';
import { getTimer, facingAngles } from '../createAnt';
import { add as addPoint } from '../Point';
import type { World } from '../createWorld';
import { getDelta, getElementType, isWithinBounds, loosenNeighbors, loosenOneSand, updateElementElement } from '../util';

/** Returns true if ant can be in the given location by confirming it exists within air and has solid footing */
function isValidLocation(ant: Readonly<Ant>, world: World) {
  // TODO: The original logic looked one ahead of the ant as well - is this worth considering?

  // Need air at the ants' body for it to be a legal ant location.
  if (getElementType(ant.location, world.elements) !== 'air') {
    return false;
  }

  // Get the location beneath the ants' feet and check for air
  const footLocation = addPoint(ant.location, getDelta(ant.facing, getRotatedAngle(ant.angle, 1)));
  if (getElementType(footLocation, world.elements) === 'air') {
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
  const element = getElementType(newPoint, world.elements);
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
  if (getElementType(footPoint, world.elements) === 'air') {
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

  const element = getElementType(digLocation, world.elements);
  if (element === 'dirt' || element === 'sand') {
    updateElementElement(digLocation, 'air', world.elements);
    loosenNeighbors(digLocation, world);

    return { ...ant, behavior: 'carrying' as const, timer: getTimer('carrying') };
  }

  return ant;
}


function turn(ant: Readonly<Ant>, world: World) {
  // First try turning perpendicularly towards the ant's back. If that fails, try turning around.
  const backAngle = getRotatedAngle(ant.angle, -1);
  if (isValidLocation({ ...ant, angle: backAngle }, world)) {
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
  if (ant.behavior === 'carrying' && getElementType(ant.location, world.elements) === 'air') {
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
  // TODO: feel like ant should drop sand in front of them not on themselves but need to consider ramifications
  if (getElementType(ant.location, world.elements) === 'air') {
    updateElementElement(ant.location, 'sand', world.elements);
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

    const footDelta = getDelta(movingAnt.facing, getRotatedAngle(movingAnt.angle, 1));
    const f = addPoint(movingAnt.location, footDelta);

    if (getElementType(f, world.elements) === 'air') {
      /* Whoops, whatever we were walking on disappeared. */
      const fallPoint = addPoint(movingAnt.location, { x: 0, y: 1 });
      if (getElementType(fallPoint, world.elements) === 'air') {
        return movingAnt;
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