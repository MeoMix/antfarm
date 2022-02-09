import type { Element } from './types';

export type ElementChunk = {
  type: Element;
  x: number;
  y: number;
}

export type FallingSand = {
  x: number;
  y: number;
  isActive: boolean;
}

function createWorld(width: number, height: number, dirtPercent: number) {
  const dirtTotalHeight = height * dirtPercent;
  const airTotalHeight = height - dirtTotalHeight;

  const elementChunks = Array.from({ length: height }, (_, columnIndex) => {
    return Array.from({ length: width }, (_, rowIndex) => {
      const type = columnIndex <= airTotalHeight ? 'air' : 'dirt';

      return {
        type,
        x: rowIndex,
        y: columnIndex,
      } as ElementChunk
    });
  });

  // TODO: idk, keeping this for now but feels like it should've been represented in elementChunks
  const fallingSands = [] as FallingSand[];

  return {
    width,
    height,
    elementChunks,
    fallingSands,
  }
}

export default createWorld;