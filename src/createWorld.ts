export type Element = 'dirt' | 'sand' | 'air';

export type World = {
  width: number;
  height: number;
  elements: Element[][];
}

function createWorld(width: number, height: number, dirtPercent: number): World {
  const elements = Array.from({ length: height }, (_, rowIndex) => {
    return Array.from({ length: width }, () => {
      return rowIndex <= (height - (height * dirtPercent)) ? 'air' : 'dirt';
    });
  });

  return {
    width,
    height,
    elements,
  }
}

export default createWorld;