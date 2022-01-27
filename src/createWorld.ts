import type { Element } from './types';

export type ElementChunk = {
  type: Element;
  x: number;
  y: number;
  width: number;
  height: number;
}

function createWorld(width: number, height: number, dirtPercent: number) {
  const dirtTotalHeight = height * dirtPercent;

  const elementChunks = Array.from({ length: dirtTotalHeight }, (_, columnIndex) => {
    return Array.from({ length: width }, (_, rowIndex) => {
      return {
        type: 'dirt' as const,
        x: rowIndex,
        y: height - columnIndex,
        width: 1,
        height: 1,
      } as ElementChunk
    });
  });

  return {
    width,
    height,
    elementChunks,
  }
}

export default createWorld;