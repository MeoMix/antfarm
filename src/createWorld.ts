import { uniqueId } from 'lodash';
import type { Point } from './Point';

import createAnt from './createAnt';
import type { Ant } from './createAnt';
import namesJson from './names.json';

export type ElementAssemblage = {
  id: string; // guid
  location: Point;
  element: Element;
  active: boolean;
};

export type Element = 'dirt' | 'sand' | 'air' | 'food';

export type World = {
  width: Readonly<number>;
  height: Readonly<number>;
  elements: Readonly<ElementAssemblage>[];
  surfaceLevel: Readonly<number>;
  ants: Readonly<Ant[]>,
}

function createWorld(width: number, height: number, dirtPercent: number, antCount: number): World {
  const surfaceLevel = Math.floor(height - (height * dirtPercent));

  const elements = Array.from({ length: height }, (_, rowIndex) => {
    return Array.from({ length: width }, (_, columnIndex) => {
      let element: Element = rowIndex <= surfaceLevel ? 'air' : 'dirt';
      let active = false;

      // TODO: write tests that test sand fall lol
      if (rowIndex === 0 && columnIndex === 0) {
        element = 'sand';
        active = true;
      }

      return {
        location: { x: columnIndex, y: rowIndex },
        element,
        active,
        id: uniqueId('element_'),
      } as const;
    });
  }).flat();

  // const testAnts = [
  //   createAnt(5, 5, 'wandering', 'left', 0),
  //   createAnt(10, 5, 'wandering', 'left', 90),
  //   createAnt(15, 5, 'wandering', 'left', 180),
  //   createAnt(20, 5, 'wandering', 'left', 270),

  //   createAnt(25, 5, 'wandering', 'right', 0),
  //   createAnt(30, 5, 'wandering', 'right', 90),
  //   createAnt(35, 5, 'wandering', 'right', 180),
  //   createAnt(40, 5, 'wandering', 'right', 270),
  // ];

  const ants = Array.from({ length: antCount }, () => {
    // Put the ant at a random location along the x-axis that fits within the bounds of the world.
    const x = Math.round(Math.random() * 1000) % width;
    // Put the ant on the dirt.
    const y = surfaceLevel;
    // Randomly position ant facing left or right
    const facing = Math.random() < 0.5 ? 'left' : 'right';
    const name = namesJson.names[Math.floor(Math.random() * namesJson.names.length)];

    return createAnt(x, y, 'wandering', facing, 0, name);
  });

  return {
    width,
    height,
    elements,
    surfaceLevel,
    ants,
  }
}

export default createWorld;
