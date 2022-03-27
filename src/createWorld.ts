
import createAnt from './createAnt';
import type { Ant } from './createAnt';

export type Element = 'dirt' | 'sand' | 'air';

// TODO: Feels weird that we have both "sand" as an element (and has an implicit x/y position)
// but then we track "FallingSands" separately.
export type FallingSand = {
  x: number;
  y: number;
}

export type World = {
  width: number;
  height: number;
  elements: Element[][];
  fallingSands: FallingSand[];
  surfaceLevel: number;
  ants: Readonly<Ant[]>,
}

function createWorld(width: number, height: number, dirtPercent: number, antCount: number): World {
  const surfaceLevel = Math.floor(height - (height * dirtPercent));

  const elements = Array.from({ length: height }, (_, rowIndex) => {
    return Array.from({ length: width }, () => {
      return rowIndex <= surfaceLevel ? 'air' : 'dirt';
    });
  });

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

    return createAnt(x, y, 'wandering', facing, 0);
  });

  const fallingSands = [] as FallingSand[];

  return {
    width,
    height,
    elements,
    surfaceLevel,
    fallingSands,
    ants,
  }
}

export default createWorld;