import type { Point } from './Point';
import type { Facing, Angle } from './createAnt';
import type { World, Element } from './createWorld';

// TODO: getDelta should probably not be coupled to 'facing'?
export function getDelta(facing: Facing, angle: Angle): Point {
  if (angle === 0 || angle === 180) {
    if (facing === 'right') {
      return { x: angle === 0 ? 1 : -1, y: 0 };
    } else {
      return { x: angle === 0 ? -1 : 1, y: 0 };
    }
  }

  return { x: 0, y: angle === 90 ? -1 : 1 };
}

/** Returns true if the given point falls within the bounds of the world */
export function isWithinBounds({ x, y }: Point, { width, height }: World) {
  return x >= 0 && x < width && y >= 0 && y < height;
}

// TODO: prefer this method not existing and always rely on an element swap - there shouldn't be destruction of elements?
export function updateElement(location: Point, element: Element, elements: World['elements']) {
  const index = elements.findIndex(element => element.location.x === location.x && element.location.y === location.y);

  if (index === -1) {
    throw new Error('updateElement expects to find an element');
  }

  elements[index] = { location: { x: location.x, y: location.y }, element };
}

export function swapElements(locationA: Point, locationB: Point, elements: World['elements']) {
  const elementA = getElementType(locationA, elements);
  const elementB = getElementType(locationB, elements);

  updateElement(locationA, elementB!, elements);
  updateElement(locationB, elementA!, elements);
}

/** Returns the type of element at a given position in the world or undefined if out of bounds */
function getElement(location: Point, elements: World['elements']) {
  return elements.find(element => element.location.x === location.x && element.location.y === location.y);
}

/** Returns the type of element at a given position in the world or undefined if out of bounds */
export function getElementType(location: Point, elements: World['elements']) {
  return getElement(location, elements)?.element;
}

function getAdjacentLocations(location: Point, radius: number) {
  const locations = [];

  for (let y = location.y + radius; y >= location.y - radius; --y) {
    for (let x = location.x - radius; x <= location.x + radius; ++x) {
      if (x !== location.x || y !== location.y) {
        locations.push({ x, y });
      }
    }
  }

  return locations;
}

export function loosenNeighbors(location: Point, world: World) {
  getAdjacentLocations(location, 2)
    .filter(({ x, y }) => getElementType({ x, y }, world.elements) === 'sand')
    .forEach(({ x, y }) => loosenOneSand({ x, y }, world));
}

export function loosenOneSand({ x, y }: Point, world: World) {
  /* Check if there's already loose sand at this location. */
  if (world.fallingSandLocations.find(fallingSandLocation => fallingSandLocation.x === x && fallingSandLocation.y === y)) {
    return;
  }

  world.fallingSandLocations.push({ x, y });
}
