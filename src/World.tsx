import { useState } from 'react';
import { Container, useTick } from '@inlet/react-pixi';
import Ant from './Ant';
import config from './config';
import DirtChunk from './DirtChunk';
import createAnt, { getTimer } from './createAnt';
import type { Ant as AntModel } from './createAnt';
import type { Direction } from './types';
import { getOppositeDirection } from './util';
import type { ElementChunk as ElementChunkModel } from './createWorld';

type Props = {
  width: number;
  height: number;
  elementChunks: ElementChunkModel[][];
}

// TODO: intentionally keeping this separate from props until I can think more about architecture, don't want to unreasonably couple model to props
type WorldModel = { width: number; height: number; elementChunks: ElementChunkModel[][]; }

// TODO: This should probably stay 1 not be changed to 4.
function getDelta(direction: Direction) {
  switch (direction) {
    case 'left':
      return { x: -1, y: 0 };
    case 'right':
      return { x: 1, y: 0 };
    case 'up':
      return { x: 0, y: -1 };
    case 'down':
      return { x: 0, y: 1 };
  }
}

// TODO: This is broken because elementChunks knows gridSize is 4, but ants get placed on uneven grid locations.
function isLegalDirection(ant: AntModel, direction: Direction, world: WorldModel) {
  // TODO: to implement this I need to be able to look up world state at a given x/y coordinate

  const delta = getDelta(direction);
  const newX = ant.x + delta.x;
  const newY = ant.y + delta.y;

  console.log('newX/newY', newX, newY);

  // Check that there is air ahead
  if (newX < 0 || newX >= world.width || newY < 0 || newY >= world.height || world.elementChunks[newY / config.gridSize][newX / config.gridSize].type !== 'air' ) {
    return false;
  }

  // TODO: I removed what appears to be excessive safeguards here, but perhaps I've misunderstood.
  // Check that there is solid footing
  if (world.elementChunks[newY + 1][newX].type === 'air' ) {
    return false;
  }

  return true;
}

function move(ant: AntModel, world: WorldModel) {
  const delta = getDelta(ant.direction);

  console.log('delta', delta);

  const newX = ant.x + delta.x;
  const newY = ant.y + delta.y;

  console.log({ newX, newY, world });

  if (newX < 0 || newX >= world.width || newY < 0 || newY >= world.height) {
    // Hit an edge - need to turn.
    return turn(ant, world);
  }

  // Check if hitting dirt or sand and, if so, dig.

  // Can move, but double-check footing, TODO implement gravity
  // ant.x = newX;
  // ant.y = newY;

  return { ...ant, x: newX, y: newY };
}

function dig(ant: AntModel) {
  console.log('digging');
  return ant;
}

function turn(ant: AntModel, world: WorldModel) {
  console.log('turning');

  const oppositeDirection = getOppositeDirection(ant.direction);
  if (isLegalDirection(ant, oppositeDirection, world)){
    return { ...ant, direction: oppositeDirection }
  }

  // TODO: randomly turn another direction if it's not possible to turn around

  return ant;
}

function wander(ant: AntModel, world: WorldModel) {
  console.log('wandering');
  // ant.timer = getTimer('wandering');
  const wanderingAnt = { ...ant, timer: getTimer('wandering') };
  return move(wanderingAnt, world);
}

function drop(ant: AntModel) {
  console.log('dropping');
  return ant;
}

function carry(ant: AntModel) {
  console.log('carrying');
  return ant;
}

function moveAnts(ants: AntModel[], world: WorldModel) {
  return ants.map(ant => {
    const movingAnt = { ...ant, timer: ant.timer - 1 };

    if (movingAnt.timer > 0) {
      return movingAnt;
    }
    // ant.timer -= 1;

    // TODO: What does ant.phase do here?
    // ants[a].phase = ( ants[a].phase + 1 ) % N_ALTPIXMAPS;

    // TODO: implement 'gravity' and 'turning'

    switch (movingAnt.behavior) {
      case 'wandering':
        // const digRoll = Math.random() / 10;
        // const turnRoll = Math.random() / 10;
        // console.log({ digRoll, turnRoll });

        // if (digRoll < config.probabilities.randomDig) {
        //   dig(ant);
        // } else if (turnRoll < config.probabilities.randomTurn) {
        //   turn(ant);
        // } else {
        return wander(movingAnt, world);
        // }
      case 'carrying':
        const dropRoll = Math.random() % 1000;

        if (dropRoll < config.probabilities.randomDrop) {
          return drop(movingAnt);
        }

        return carry(movingAnt);
    }

    return movingAnt;
  });
}

function World({ width, height, elementChunks }: Props) {
  const [ants, setAnts] = useState(Array.from({ length: config.initialAntCount }, () => createAnt(Math.round(Math.random() * 1000) % width, 0, 'wandering')));

  // TODO: consider calculating dirtTotalHeight like this?
  // const dirtTotalHeight = elementChunks.filter(({ type, x }) => type === 'dirt' && x === 0).length;
  const dirtTotalHeight = height * config.initialDirtPercent;

  useTick(() => {
    setAnts(moveAnts(ants, { width, height, elementChunks }));
  });

  return (
    <>
      <Container position={[0, height - dirtTotalHeight]} interactiveChildren={false}>
        {ants.map(ant => (<Ant {...ant} />))}
      </Container>

      <Container interactiveChildren={false}>
        { /* NOTE: It's probably wrong to code this like this - performance */}
        {elementChunks.map(elementChunkRow => elementChunkRow.map(elementChunk => <DirtChunk {...elementChunk} />))}
      </Container>
    </>
  );
}

export default World;