export type Element = 'dirt' | 'sand' | 'air';

export type World = {
  width: number;
  height: number;
  elements: Element[][];
  surfaceLevel: number;
}

function createWorld(width: number, height: number, dirtPercent: number): World {
  const surfaceLevel = height - (height * dirtPercent)

  const elements = Array.from({ length: height }, (_, rowIndex) => {
    return Array.from({ length: width }, () => {
      return rowIndex <= surfaceLevel ? 'air' : 'dirt';
    });
  });

  return {
    width,
    height,
    elements,
    surfaceLevel,
  }
}

export default createWorld;