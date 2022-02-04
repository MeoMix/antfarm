import { useState } from 'react';
import { Container, useTick } from '@inlet/react-pixi';
import Ant from './Ant';
import config from '../config';
import DirtChunk from './DirtChunk';
import createAnt, { getTimer } from '../createAnt';
import type { Ant as AntModel } from '../createAnt';
import type { Direction } from '../types';
import { getOppositeDirection } from '../util';
import type { ElementChunk as ElementChunkModel, FallingSand as FallingSandModel } from '../createWorld';
import SandChunk from './SandChunk';

type Props = {
  width: number;
  height: number;
  elementChunks: ElementChunkModel[][];
  fallingSands: FallingSandModel[];
  maxFallingSandCount: number;
}

// TODO: intentionally keeping this separate from props until I can think more about architecture, don't want to unreasonably couple model to props
type WorldModel = {
  width: number;
  height: number;
  elementChunks: ElementChunkModel[][];
  fallingSands: FallingSandModel[];
  maxFallingSandCount: number;
}

const footFacingDirections = [
  { footDirection: 'south' as const, facingDirection: 'west' as const },
  { footDirection: 'south' as const, facingDirection: 'east' as const },

  { footDirection: 'north' as const, facingDirection: 'west' as const },
  { footDirection: 'north' as const, facingDirection: 'east' as const },

  { footDirection: 'east' as const, facingDirection: 'south' as const },
  { footDirection: 'east' as const, facingDirection: 'north' as const },

  { footDirection: 'west' as const, facingDirection: 'south' as const },
  { footDirection: 'west' as const, facingDirection: 'north' as const },
];

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

function isLegalDirection(ant: AntModel, facingDirection: Direction, footDirection: Direction, world: WorldModel) {
  const delta = getDelta(facingDirection, footDirection);
  const newX = ant.x + delta.x;
  const newY = ant.y + delta.y;

  // Check that there is air ahead
  if (newX < 0 || newX >= world.width || newY < 0 || newY >= world.height || world.elementChunks[newY][newX].type !== 'air') {
    return false;
  }

  const footDirections = getFootDirections(facingDirection, footDirection);
  const footDelta = getDelta(footDirections.facingDirection, footDirections.footDirection);
  const footNewX = ant.x + footDelta.x;
  const footNewY = ant.y + footDelta.y;

  // Check that there is solid footing
  if (footNewX >= 0 && footNewX < world.width && footNewY >= 0 && footNewY < world.height && world.elementChunks[footNewY][footNewX].type === 'air') {
    return false;
  }

  return true;
}

function loosenNeighbors(xc: number, yc: number, world: WorldModel) {
  for (let y = yc + 2; y >= yc - 2; --y) {
    for (let x = xc - 2; x <= xc + 2; ++x) {
      if ((x !== xc || y !== yc) && x >= 0 && x < world.width && y >= 0 && y < world.height && world.elementChunks[y][x].type === 'sand') {
        loosenOne(x, y, world);
      }
    }
  }
}

function loosenOne(x: number, y: number, world: WorldModel) {
  /* Check if there's already loose sand at this location. */
  if (world.fallingSands.find(sand => sand.isActive && sand.x === x && sand.y === y)) {
    return;
  }

  /* Try to store the new sand in an old position. */
  const inactiveSand = world.fallingSands.find(({ isActive }) => !isActive);
  if (inactiveSand) {
    inactiveSand.x = x;
    inactiveSand.y = y;
    inactiveSand.isActive = true;
    return;
  }

  /* See if we need to expand to make room for the new sand. */
  if (world.fallingSands.length === world.maxFallingSandCount) {
    world.maxFallingSandCount = world.maxFallingSandCount === 0 ? 32 : world.maxFallingSandCount * 2;
  }

  /* Add it. */
  world.fallingSands.push({ x, y, isActive: true });
}

function move(ant: AntModel, world: WorldModel) {
  const delta = getDelta(ant.facingDirection, ant.footDirection);

  console.log('delta', delta);

  const newX = ant.x + delta.x;
  const newY = ant.y + delta.y;

  console.log({ newX, newY, world });

  if (newX < 0 || newX >= world.width || newY < 0 || newY >= world.height) {
    // Hit an edge - need to turn.
    return turn(ant, world);
  }

  // TODO: should this be 51? :s
  const surface = Math.floor(world.height * (1 - config.initialDirtPercent));
  console.log('ant.y vs surface', ant.y, surface);

  // Check if hitting dirt or sand and, if so, dig.
  if (world.elementChunks[newY][newX].type !== 'air') {
    /* Hit dirt or sand.  Dig? */
    // If ant is wandering *below ground level* and bumps into sand or has a chance to dig, dig.
    if (ant.behavior === 'wandering' && ant.y >= surface && (world.elementChunks[newY][newX].type === 'sand' || Math.random() < config.probabilities.concaveBelowDirtDig)) {
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
  if (fx >= 0 && fx < world.width && fy >= 0 && fy < world.height && world.elementChunks[fy][fx].type === 'air') {
    /* Whoops, we're over air.  Move into the air and turn towards the feet.  But first, see if we should drop. */
    let updatedAnt = ant;
    if (ant.behavior === 'carrying' && ant.y < surface && Math.random() < config.probabilities.convexAboveDirtDrop) {
      updatedAnt = drop(ant, world);
    }
    return { ...updatedAnt, x: fx, y: fy, facingDirection: footDirections.facingDirection, footDirection: footDirections.footDirection };
  }

  return { ...ant, x: newX, y: newY };
}

function dig(ant: AntModel, isForcedForward: boolean, world: WorldModel) {
  console.log('digging');

  const { facingDirection, footDirection } = isForcedForward ? ant : getFootDirections(ant.facingDirection, ant.footDirection);
  const delta = getDelta(facingDirection, footDirection); 

  const x = ant.x + delta.x;
  const y = ant.y + delta.y;

  if (x >= 0 && x < world.width && y >= 0 && y < world.height && world.elementChunks[y][x].type !== 'air') {
    // TODO: immutable world
    world.elementChunks[y][x].type = 'air';
    loosenNeighbors(x, y, world);

    return { ...ant, behavior: 'carrying' as const, timer: getTimer('carrying') };
  }

  return ant;
}

function turn(ant: AntModel, world: WorldModel) {
  console.log('turning');

  // First try turning perpendicularly towards the ant's back. If that fails, try turning around.
  const backDirections1 = getBackDirections(ant.facingDirection, ant.footDirection);
  if (isLegalDirection(ant, backDirections1.facingDirection, backDirections1.footDirection, world)){
    console.log('turning perpendicular towards back:', backDirections1, ant.facingDirection);
    return { ...ant, facingDirection: backDirections1.facingDirection, footDirection: backDirections1.footDirection };
  }

  const backDirections2 = getBackDirections(backDirections1.facingDirection, backDirections1.footDirection);
  if (isLegalDirection(ant, backDirections2.facingDirection, backDirections2.footDirection, world)) {
    console.log('turning around direction:', backDirections2, ant.facingDirection);
    return { ...ant, facingDirection: backDirections2.facingDirection, footDirection: backDirections2.footDirection };
  }

  // Randomly turn in a valid different when unable to simply turn around.
  const okDirections = footFacingDirections.filter(({ facingDirection, footDirection }) => (facingDirection !== ant.facingDirection || footDirection !== ant.footDirection) && isLegalDirection(ant, facingDirection, footDirection, world));
  if (okDirections.length > 0) {
    const okDirection = okDirections[Math.floor(Math.random() * okDirections.length)];
    console.log('turning random, valid direction:', okDirection);
    return { ...ant, facingDirection: okDirection.facingDirection, footDirection: okDirection.footDirection };
  }

  // No legal direction? Trapped! Drop sand and turn randomly in an attempt to dig out.
  let trappedAnt = ant;
  if (ant.behavior === 'carrying' && (world.elementChunks[ant.y][ant.x].type === 'air' || Math.random() < config.probabilities.sandExclusion)) {
    console.log('TRAPPED!');
    trappedAnt = drop(ant, world);
  }
  const randomDirection = footFacingDirections[Math.floor(Math.random() * footFacingDirections.length)];
  console.log('turning random direction:', randomDirection);
  return { ...trappedAnt, facingDirection: randomDirection.facingDirection, footDirection: randomDirection.footDirection }
}

function wander(ant: AntModel, world: WorldModel) {
  console.log('wandering');
  const wanderingAnt = { ...ant, behavior: 'wandering' as const, timer: getTimer('wandering') };
  return move(wanderingAnt, world);
}

function drop(ant: AntModel, world: WorldModel) {
  console.log('dropping');
  world.elementChunks[ant.y][ant.x].type = 'sand' as const;
  loosenOne(ant.x, ant.y, world);

  return { ...ant, behavior: 'wandering' as const, timer: getTimer('wandering') };
}

function carry(ant: AntModel, world: WorldModel) {
  console.log('carrying');
  const carryingAnt = { ...ant, behavior: 'carrying' as const, timer: getTimer('carrying') };
  return move(carryingAnt, world);
}

function moveAnts(ants: AntModel[], world: WorldModel) {
  return ants.map(ant => {
    const movingAnt = { ...ant, timer: ant.timer - 1 };

    if (movingAnt.timer > 0) {
      return movingAnt;
    }

    switch (movingAnt.behavior) {
      case 'wandering':
        if (Math.random() < config.probabilities.randomDig) {
          return dig(ant, false, world);
        } else if (Math.random() < config.probabilities.randomTurn) {
          return turn(ant, world);
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

function sandFall(world: WorldModel) {
  console.log('falling sand length...?', world.fallingSands.length);
  // TODO: uhhh I don't think this array ever gets smaller?
  world.fallingSands.filter(({ isActive }) => isActive).forEach(fallingSand => {
    let x = fallingSand.x;
    let y = fallingSand.y;
    if (y + 1 >= world.height) {
      /* Hit bottom - done falling and no compaction possible. */
      fallingSand.isActive = false;
      return;
    }

    /* Drop the sand onto the next lower sand or dirt. */
    if (world.elementChunks[y + 1][x].type === 'air') {
      fallingSand.y = y + 1;
      world.elementChunks[y][x].type = 'air' as const;
      world.elementChunks[fallingSand.y][fallingSand.x].type = 'sand' as const;
      loosenNeighbors(x, y, world);
      return;
    }

    /* Tip over an edge? */
    let tipl = (x - 1 >= 0 && y + 2 < world.height && world.elementChunks[y][x - 1].type === 'air' && world.elementChunks[y + 1][x - 1].type === 'air' && world.elementChunks[y + 2][x - 1].type === 'air');
    let tipr = (x + 1 < world.width && y + 2 < world.height && world.elementChunks[y][x + 1].type === 'air' && world.elementChunks[y + 1][x + 1].type === 'air' && world.elementChunks[y + 2][x + 1].type === 'air');
    if (tipl || tipr) {
      console.log('tipping left/right', tipl, tipr)
      if (tipl && tipr) {
        if (Math.floor(Math.random() * 2) === 0) {
          tipl = false;
        } else {
          tipr = false;
        }

        if (tipl) {
          fallingSand.x = x - 1;
        } else {
          fallingSand.x = x + 1;
          fallingSand.y = y + 1;
          world.elementChunks[y][x].type = 'air';
          world.elementChunks[fallingSand.y][fallingSand.x].type = 'sand';
          loosenNeighbors(x, y, world);
          return;
        }
      }
    }

    /* Found the final resting place. */
    fallingSand.isActive = false;

    /* Compact sand into dirt. */
    let j = 0;
    for (let k = 0; y + 1 < world.height && world.elementChunks[y + 1][x].type === 'sand'; ++y, ++k) {
      j = k;
    }

    if (j >= config.compactSandDepth) {
      world.elementChunks[y][x].type = 'dirt';
    }
  });
}

function World({ width, height, elementChunks, fallingSands, maxFallingSandCount }: Props) {
  const [ants, setAnts] = useState(() => {
    return Array.from({ length: config.initialAntCount }, () => {
      // Put the ant at a random location along the x-axis that fits within the bounds of the world.
      const x = Math.round(Math.random() * 1000) % width;
      // Put the ant on the dirt.
      const y = height - (height * config.initialDirtPercent);
      console.log('ant default y', y);
  
      const groundLevelDirections = footFacingDirections.filter(({ footDirection }) => footDirection === 'south');
      const randomDirection = groundLevelDirections[Math.floor(Math.random() * groundLevelDirections.length)];
  
      return createAnt(x, y, 'wandering', randomDirection.facingDirection, randomDirection.footDirection);
    });
  });

  // TODO: This doesn't seem like the right approach because it uses RAF which means the simulation stops when inactive.
  useTick(() => {
    const world = { width, height, elementChunks, fallingSands, maxFallingSandCount };
    setAnts(moveAnts(ants, world));
    sandFall(world);
  });

  return (
    <>
      <Container interactiveChildren={false}>
        {ants.map(ant => {
          return (
            <Ant
              x={ant.x * config.gridSize}
              y={ant.y * config.gridSize}
              facingDirection={ant.facingDirection}
              footDirection={ant.footDirection}
            />
          );
        })}
      </Container>

      <Container interactiveChildren={false}>
        { /* NOTE: It's probably wrong to code this like this - performance */}
        {elementChunks.map((elementChunkRow, rowIndex) => elementChunkRow.map(({ type }, columnIndex) => {
          switch (type) {
            case 'dirt':
              return (
                <DirtChunk
                  x={columnIndex * config.gridSize}
                  y={rowIndex * config.gridSize}
                  width={config.gridSize}
                  height={config.gridSize}
                />
              );
            case 'sand':
              return (
                <SandChunk
                  x={columnIndex * config.gridSize}
                  y={rowIndex * config.gridSize}
                  width={config.gridSize}
                  height={config.gridSize}
                />
              );
            case 'air':
              break;
            default:
              throw new Error(`Unexpected elementChunk type: ${type}`);
          }
        }))}
      </Container>
    </>
  );
}

export default World;