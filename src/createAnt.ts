import type { Point } from './Point';

export type Behavior = 'wandering' | 'carrying';
export type Facing = 'left' | 'right';

export const angles = [0, 90, 180, 270] as const;
export type Angle = typeof angles[number];

/**
 * Rotation is a value from 0 to 3. A value of 1 is a 90 degree counter-clockwise rotation. Negative values are accepted.
 * Examples:
 *  getRotatedAngle(0, -1); // 270
 *  getRotatedAngle(0, 1); // 90
 */
export const getRotatedAngle = (angle: Angle, rotation: number): Angle => {
  const rotatedIndex = (angles.indexOf(angle) - rotation) % angles.length;
  return angles[rotatedIndex < 0 ? angles.length + rotatedIndex : rotatedIndex];
};

export type Ant = {
  // The location of the ants head - need to consider location + facing + width to determine body (assuming height: 1)
  location: Point;
  behavior: Behavior;
  facing: Facing,
  angle: Angle,
  timer: number;
  width: number;
  height: number;
}

const BehaviorTimingFactors = {
  wandering: 4,
  carrying:  5,
}

export const getTimer = (behavior: Behavior) => BehaviorTimingFactors[behavior] + Math.floor((Math.random() * 3)) - 1;

function createAnt(x: number, y: number, behavior: Behavior, facing: Facing, angle: Angle): Ant {
  return {
    location: { x, y },
    behavior,
    facing,
    angle,
    timer: getTimer(behavior),
    width: 1,
    height: 1,
  };
}

export default createAnt;