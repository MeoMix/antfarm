export type Element = 'dirt' | 'sand' | 'air';

function createWorld(width: number, height: number, dirtPercent: number) {
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