export type Element = {
  type: 'dirt' | 'sand' | 'air';
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

  const elements = Array.from({ length: height }, (_, columnIndex) => {
    return Array.from({ length: width }, (_, rowIndex) => {
      const type = columnIndex <= airTotalHeight ? 'air' : 'dirt';

      return {
        type,
        x: rowIndex,
        y: columnIndex,
      } as Element
    });
  });

  // TODO: idk, keeping this for now but feels like it should've been represented in elements
  const fallingSands = [] as FallingSand[];

  return {
    width,
    height,
    elements,
    fallingSands,
  }
}

export default createWorld;