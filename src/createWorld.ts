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
}

function createWorld(width: number, height: number, dirtPercent: number): World {
  const surfaceLevel = height - (height * dirtPercent)

  const elements = Array.from({ length: height }, (_, rowIndex) => {
    return Array.from({ length: width }, () => {
      return rowIndex <= surfaceLevel ? 'air' : 'dirt';
    });
  });

  const fallingSands = [] as FallingSand[];

  return {
    width,
    height,
    elements,
    surfaceLevel,
    fallingSands,
  }
}

export default createWorld;