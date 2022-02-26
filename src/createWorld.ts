export type Element = 'dirt' | 'sand' | 'air';

// TODO: Feels weird that we have both "sand" as an element (and has an implicit x/y position)
// but then we track "FallingSands" separately.
export type FallingSand = {
  x: number;
  y: number;
}

function createWorld(width: number, height: number, dirtPercent: number) {
  const elements = Array.from({ length: height }, (_, rowIndex) => {
    return Array.from({ length: width }, () => rowIndex <= (height - (height * dirtPercent)) ? 'air' : 'dirt');
  });

  const fallingSands = [] as FallingSand[];

  return {
    width,
    height,
    elements,
    fallingSands,
  }
}

export default createWorld;