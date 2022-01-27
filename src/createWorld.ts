import type { Element } from './types';

export type ElementChunk = {
  type: Element;
  x: number;
  y: number;
  width: number;
  height: number;
}

// TODO: I don't think elementChunkSize should come into play here, maybe.
function createWorld(width: number, height: number, dirtPercent: number, elementChunkSize: number) {
  const dirtTotalHeight = height * dirtPercent;

  const elementChunks = Array.from({ length: dirtTotalHeight / elementChunkSize }, (_, columnIndex) => {
    return Array.from({ length: width / elementChunkSize }, (_, rowIndex) => {
      return {
        type: 'dirt' as const,
        x: rowIndex * elementChunkSize,
        y: height - (columnIndex * elementChunkSize),
        width: elementChunkSize,
        height: elementChunkSize,
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