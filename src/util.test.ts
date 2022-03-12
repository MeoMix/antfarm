import { moveAnts } from './util';
import createWorld from './createWorld';

describe('Util', () => {
  describe('moveAnts', () => {
    it('should decrement ant counter and no-op if timer has yet to reach 0', () => {
      const world = createWorld(16, 9, 2 / 3, 1);

      const updatedAnts = moveAnts(world);

      expect(updatedAnts[0]).toStrictEqual({ ...world.ants[0], timer: world.ants[0].timer - 1 });
    });
  });
});