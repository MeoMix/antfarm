// TODO: Probably re-write this as 'gravity' not just sand-specific gravity.
import { World } from "../createWorld";
import { Point } from "../Point";
import { getElementType, loosenNeighbors, swapElements, updateElement } from "../util";

// TODO: more generic and move it out?
function getSandDepth(x: number, y: number, elements: World['elements']) {
  let sandDepth = 0;

  while (getElementType({ x, y: sandDepth + y }, elements) === 'sand') {
    sandDepth += 1;
  }

  return sandDepth;
}

// Note that in a crowded world ants may fall *with* sand that's falling. This is an unintentional feature because it's hilarious.
export function sandFall(world: World, compactSandDepth: number) {
  // Derive a map from active sand locations to updated sand locations which will be shown next frame.
  // If the location does not update then the active sand has come to rest and will cease being tracked.
  const fallingSandLocationMap = new Map<Point, Point>(world.fallingSandLocations.map(({ x, y }) => {
    // If there is air below the sand then continue falling down.
    const goMiddle = getElementType({ x, y: y + 1 }, world.elements) === 'air';
    // Otherwise, likely at rest, but potential for tipping off a precarious ledge.
    // Look for a column of air two units tall to either side of the sand and consider going in one of those directions.
    let goLeft = !goMiddle && getElementType({ x: x - 1, y }, world.elements) === 'air' && getElementType({ x: x - 1, y: y + 1 }, world.elements) === 'air';
    let goRight = !goMiddle && getElementType({ x: x + 1, y }, world.elements) === 'air' && getElementType({ x: x + 1, y: y + 1 }, world.elements) === 'air';
    if (goLeft && goRight) {
      // Flip a coin and choose a direction randomly to resolve ambiguity in fall direction.
      if (Math.random() < 0.5) {
        goLeft = false;
      } else {
        goRight = false;
      }
    }

    const xDelta = (goRight ? 1 : 0) + (goLeft ? -1 : 0);
    const yDelta = (goMiddle || goLeft || goRight ? 1 : 0);
    return [{ x, y }, { x: x + xDelta, y: y + yDelta }];
  }));

  // Create a separate map which omits tracked sand locations which were inactive this frame.
  const activeFallingSandLocationMap = new Map(
    Array.from(fallingSandLocationMap.entries())
      .filter(([oldSandLocation, newSandLocation]) => oldSandLocation.y !== newSandLocation.y)
  );

  // For all the sand locations which are active - swap the elements (sand/air) at the two locations.
  activeFallingSandLocationMap.forEach((newSandLocation, oldSandLocation) => {
    swapElements(oldSandLocation, newSandLocation, world.elements);
  });

  // Filter sand locations which became inactive from the list of tracked locations.
  world.fallingSandLocations = Array.from(activeFallingSandLocationMap.values());

  // As a final flair, consider compaction effects and cascading tumbling of sand.
  fallingSandLocationMap.forEach((newSandLocation, oldSandLocation) => {
    if (oldSandLocation.y === newSandLocation.y) {
      // At deep enough levels, sand finds itself crushed back into dirt.
      const sandDepth = getSandDepth(oldSandLocation.x, oldSandLocation.y + 1, world.elements);
      if (sandDepth >= compactSandDepth) {
        updateElement({ x: oldSandLocation.x, y: oldSandLocation.y + sandDepth }, 'dirt', world.elements);
      }
    } else {
      // Sand moved, leaving a gap of air, which may cause more sand to fall. Figure out
      // what is happening and do it cheaply by only considering updates around the active area.
      loosenNeighbors(newSandLocation, world)
    }
  });
}
