import type { Point } from './Point';

import createAnt from './createAnt';
import type { Ant } from './createAnt';
import namesJson from './names.json';

export type ElementAssemblage = {
  // id: number;
  location: Point;
  element: Element;
};

export type Element = 'dirt' | 'sand' | 'air' | 'food';

export type World = {
  width: Readonly<number>;
  height: Readonly<number>;
  elements: Readonly<ElementAssemblage>[];
  fallingSandLocations: Readonly<Point>[];
  surfaceLevel: Readonly<number>;
  ants: Readonly<Ant[]>,
}

function createWorld(width: number, height: number, dirtPercent: number, antCount: number): World {
  const surfaceLevel = Math.floor(height - (height * dirtPercent));

  const elements = Array.from({ length: height }, (_, rowIndex) => {
    return Array.from({ length: width }, (_, columnIndex) => {
      const element = rowIndex <= surfaceLevel ? 'air' : 'dirt' as const;
      return { location: { x: columnIndex, y: rowIndex }, element } as const;
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

  const fallingSandLocations = [] as Point[];

  return {
    width,
    height,
    elements,
    surfaceLevel,
    fallingSandLocations,
    ants,
  }
}

export default createWorld;
