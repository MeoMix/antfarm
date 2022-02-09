import type { Direction } from "./types";

export type Behavior = 'wandering' | 'carrying';

export type Ant = {
  x: number;
  y: number;
  behavior: Behavior;
  facingDirection: Direction;
  footDirection: Direction;
  timer: number;
}

const BehaviorTimingFactors = {
  wandering: 4,
  carrying:  5,
}

export const getTimer = (behavior: Behavior) => BehaviorTimingFactors[behavior] + Math.floor((Math.random() * 3)) - 1;

function createAnt(x: number, y: number, behavior: Behavior, facingDirection: Direction, footDirection: Direction): Ant {
  return {
    x,
    y,
    behavior,
    facingDirection,
    footDirection,
    timer: getTimer(behavior),
  };
}

export default createAnt;