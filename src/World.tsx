import React, { useState } from 'react';
import { Container, useTick } from '@inlet/react-pixi';
import Ant from './Ant';
import config from './config';
import DirtChunk from './DirtChunk';
import createAnt, { getTimer } from './createAnt';
import type { Ant as AntModel } from './createAnt';
import type { Direction } from './types';

type Props = {
  width: number;
  height: number;
}

// TODO: This should probably stay 1 not be changed to 4.
function getDelta(direction: Direction) {
  switch (direction) {
    case 'left':
      return { x: -4, y: 0 };
    case 'right':
      return { x: 4, y: 0 };
    case 'up':
      return { x: 0, y: -4 };
    case 'down':
      return { x: 0, y: 4 };
  }
}

function move(ant: AntModel, worldWidth: number, worldHeight: number) {
  const delta = getDelta(ant.direction);

  console.log('delta', delta);

  const newX = ant.x + delta.x;
  const newY = ant.y + delta.y;

  console.log({ newX, newY, worldWidth, worldHeight });

  if (newX < 0 || newX >= worldWidth || newY < 0 || newY >= worldHeight) {
    // Hit an edge - need to turn.
    return turn(ant);
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

function turn(ant: AntModel) {
  // TODO: Do more than just turning around
  console.log('turning');

  if (ant.direction === 'right') {
    return { ...ant, direction: 'left' as const };
  }

  if (ant.direction === 'left') {
    return { ...ant, direction: 'right' as const };
  }

  return ant;
}

function wander(ant: AntModel, worldWidth: number, worldHeight: number) {
  console.log('wandering');
  // ant.timer = getTimer('wandering');
  const wanderingAnt = { ...ant, timer: getTimer('wandering') };
  return move(wanderingAnt, worldWidth, worldHeight);
}

function drop(ant: AntModel) {
  console.log('dropping');
  return ant;
}

function carry(ant: AntModel) {
  console.log('carrying');
  return ant;
}

function moveAnts(ants: AntModel[], worldWidth: number, worldHeight: number) {
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
        return wander(movingAnt, worldWidth, worldHeight);
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

function World({ width, height }: Props) {
  const dirtTotalHeight = height * config.initialDirtPercent;
  const dirtChunkWidth = 4;
  const dirtChunkHeight = 4;

  const [ants, setAnts] = useState(Array.from({ length: config.initialAntCount }, (_, antIndex) => createAnt(Math.random() * 1000 % width, 0, 'wandering')));

  useTick(() => {
    setAnts(moveAnts(ants, width, height));
  });

  return (
    <>
      <Container position={[0, height - dirtTotalHeight]} interactiveChildren={false}>
        {ants.map(ant => (<Ant {...ant} />))}
      </Container>

      <Container interactiveChildren={false}>
        { /* NOTE: It's probably wrong to code this like this - performance */}
        {Array.from({ length: dirtTotalHeight / dirtChunkHeight }, (_, columnIndex) => {
          return Array.from({ length: width / dirtChunkWidth }, (_, rowIndex) => {
            return (<DirtChunk
              width={dirtChunkWidth}
              height={dirtChunkHeight}
              x={rowIndex * dirtChunkWidth}
              y={height - (columnIndex * dirtChunkHeight)} />);
          });
        })}
      </Container>
    </>
  );
}

export default World;