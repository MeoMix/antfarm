import { useState } from 'react';
import { Container, useTick } from '@inlet/react-pixi';
import Ant from './Ant';
import config from '../config';
import DirtChunk from './DirtChunk';
import createAnt, { getTimer } from '../createAnt';
import type { Ant as AntModel } from '../createAnt';
import type { Direction } from '../types';
import { directions } from '../types';
import { getOppositeDirection } from '../util';
import type { ElementChunk as ElementChunkModel, FallingSand as FallingSandModel } from '../createWorld';
import AirChunk from './AirChunk';
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

function getDelta(direction: Direction) {
  switch (direction) {
    case 'west':
      return { x: -1, y: 0 };
    case 'east':
      return { x: 1, y: 0 };
    case 'north':
      return { x: 0, y: -1 };
    case 'south':
      return { x: 0, y: 1 };
  }
}

function isLegalDirection(ant: AntModel, direction: Direction, world: WorldModel) {
  const delta = getDelta(direction);
  const newX = ant.x + delta.x;
  const newY = ant.y + delta.y;

  // Check that there is air ahead
  if (newX < 0 || newX >= world.width || newY < 0 || newY >= world.height || world.elementChunks[newY][newX].type !== 'air') {
    return false;
  }

  // TODO: I removed what appears to be excessive safeguards here, but perhaps I've misunderstood.
  // Check that there is solid footing
  if (world.elementChunks[newY + 1][newX].type === 'air') {
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
  for (let i = 0; i < world.fallingSands.length; ++i) {
    if (world.fallingSands[i].isActive && world.fallingSands[i].x === x && world.fallingSands[i].y === y) {
      return;
    }
  }

  /* Try to store the new sand in an old position. */
  for (let i = 0; i < world.fallingSands.length; ++i) {
    if (!world.fallingSands[i].isActive) {
      world.fallingSands[i].x = x;
      world.fallingSands[i].y = y;
      world.fallingSands[i].isActive = true;
      return;
    }
  }

  /* See if we need to expand to make room for the new sand. */
  if (world.fallingSands.length === world.maxFallingSandCount) {
    if (world.maxFallingSandCount === 0) {
      world.maxFallingSandCount = 32;
    } else {
      world.maxFallingSandCount *= 2;
    }
  }

  /* Add it. */
  world.fallingSands.push({ x, y, isActive: true });
}

function move(ant: AntModel, world: WorldModel) {
  const delta = getDelta(ant.facingDirection);

  console.log('delta', delta);

  const newX = ant.x + delta.x;
  const newY = ant.y + delta.y;

  console.log({ newX, newY, world });

  if (newX < 0 || newX >= world.width || newY < 0 || newY >= world.height) {
    // Hit an edge - need to turn.
    return turn(ant, world);
  }

  // TODO: should this be 51? :s
  const surface = 50;

  // Check if hitting dirt or sand and, if so, dig.
  if (world.elementChunks[newY][newX].type !== 'air') {
    /* Hit dirt or sand.  Dig? */
    // TODO: surface - maybe it should be 51?
    if (ant.behavior === 'wandering' && ant.y >= surface && (world.elementChunks[newY][newX].type === 'sand' || Math.random() < config.probabilities.concaveBelowDirtDig)) {
      /* Yes, try digging. */
      // TODO: second arg of (1) here is weird
      return dig(ant, false, world);
    } else {
      /* Nope, no digging.  Turn. */
      return turn(ant, world);
    }
  }

  /* We can move forward.  But first, check footing. */
  const footDirection = 'south' as const; // getOppositeDirection(ant.direction);
  const footDelta = getDelta(footDirection)
  const fx = newX + footDelta.x;
  const fy = newY + footDelta.y;
  if (fx >= 0 && fx < world.width && fy >= 0 && fy < world.height && world.elementChunks[fy][fx].type === 'air') {
    /* Whoops, we're over air.  Move into the air and turn towards the feet.  But first, see if we should drop. */
    let updatedAnt = ant;
    if (ant.behavior === 'carrying' && ant.y < surface && Math.random() < config.probabilities.convexAboveDirtDrop) {
      updatedAnt = drop(ant, world);
    }
    return { ...updatedAnt, x: fx, y: fy, facingDirection: footDirection };
  }

  return { ...ant, x: newX, y: newY };
}

function dig(ant: AntModel, isForcedSouth: boolean, world: WorldModel) {
  console.log('digging');
  const delta = getDelta(isForcedSouth ? 'south' : ant.facingDirection);

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

// TODO: old code has two different ways of turning legally which I haven't grasped just yet
function turn(ant: AntModel, world: WorldModel) {
  console.log('turning');

  const oppositeDirection = getOppositeDirection(ant.facingDirection);
  if (isLegalDirection(ant, oppositeDirection, world)) {
    console.log('turning around direction:', oppositeDirection);
    return { ...ant, facingDirection: oppositeDirection }
  }

  // Randomly turn in a valid different when unable to simply turn around.
  const okDirections = directions.filter(direction => direction !== ant.facingDirection && isLegalDirection(ant, direction, world));
  if (okDirections.length > 0) {
    const okDirection = okDirections[Math.floor(Math.random() * okDirections.length)];
    console.log('turning random, valid direction:', okDirection);
    return { ...ant, facingDirection: okDirection }
  }

  // No legal direction? Trapped! Drop sand and turn randomly in an attempt to dig out.
  let trappedAnt = ant;
  if (ant.behavior === 'carrying' && (world.elementChunks[ant.y][ant.x].type === 'air' || Math.random() < config.probabilities.sandExclusion)) {
    trappedAnt = drop(ant, world);
  }
  const randomDirection = directions[Math.floor(Math.random() * directions.length)];
  console.log('turning random direction:', randomDirection);
  return { ...trappedAnt, facingDirection: randomDirection }
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

    // TODO: What does ant.phase do here?
    // ants[a].phase = ( ants[a].phase + 1 ) % N_ALTPIXMAPS;

    switch (movingAnt.behavior) {
      case 'wandering':
        if (Math.random() < config.probabilities.randomDig) {
          return dig(ant, true, world);
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
  for (let i = 0; i < world.fallingSands.length; ++i) {
    if (world.fallingSands[i].isActive) {
      let x = world.fallingSands[i].x;
      let y = world.fallingSands[i].y;
      if (y + 1 >= world.height) {
        /* Hit bottom - done falling and no compaction possible. */
        world.fallingSands[i].isActive = false;
        continue;
      }

      /* Drop the sand onto the next lower sand or dirt. */
      if (world.elementChunks[y + 1][x].type === 'air') {
        world.fallingSands[i].y = y + 1;
        world.elementChunks[y][x].type = 'air' as const;
        world.elementChunks[world.fallingSands[i].y][world.fallingSands[i].x].type = 'sand' as const;
        loosenNeighbors(x, y, world);
        continue;
      }

      /* Tip over an edge? */
      let tipl = (x - 1 >= 0 && y + 2 < world.height && world.elementChunks[y][x - 1].type === 'air' && world.elementChunks[y + 1][x - 1].type === 'air' && world.elementChunks[y + 2][x - 1].type === 'air');
      let tipr = (x + 1 < world.width && y + 2 < world.height && world.elementChunks[y][x + 1].type === 'air' && world.elementChunks[y + 1][x + 1].type === 'air' && world.elementChunks[y + 2][x + 1].type === 'air');
      if (tipl || tipr) {
        if (tipl && tipr) {
          if (Math.floor(Math.random() * 2) === 0) {
            tipl = false;
          } else {
            tipr = false;
          }

          if (tipl) {
            world.fallingSands[i].x = x - 1;
          } else {
            world.fallingSands[i].x = x + 1;
            world.fallingSands[i].y = y + 1;
            world.elementChunks[y][x].type = 'air';
            world.elementChunks[world.fallingSands[i].y][world.fallingSands[i].x].type = 'sand';
            loosenNeighbors(x, y, world);
            continue;
          }
        }
      }

      /* Found the final resting place. */
      world.fallingSands[i].isActive = false;

      /* Compact sand into dirt. */
      let j = 0;
      for (let k = 0; y + 1 < world.height && world.elementChunks[y + 1][x].type === 'sand'; ++y, ++k) {
        j = k;
      }

      if (j >= config.compactSandDepth) {
        world.elementChunks[y][x].type = 'dirt';
      }
    }
  }
}

function World({ width, height, elementChunks, fallingSands, maxFallingSandCount }: Props) {
  const [ants, setAnts] = useState(Array.from({ length: config.initialAntCount }, () => {
    // Put the ant at a random location along the x-axis that fits within the bounds of the world.
    const x = Math.round(Math.random() * 1000) % width;
    // Put the ant on the dirt.
    const y = height - (height * config.initialDirtPercent);
    return createAnt(x, y, 'wandering');
  }));

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
              // return (
              //   <DirtChunk
              //     x={columnIndex * config.gridSize}
              //     y={rowIndex * config.gridSize}
              //     width={config.gridSize}
              //     height={config.gridSize}
              //   />
              // );
              break;
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
              // return (
              //   <AirChunk
              //     x={columnIndex * config.gridSize}
              //     y={rowIndex * config.gridSize}
              //     width={config.gridSize}
              //     height={config.gridSize}
              //   />
              // );
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