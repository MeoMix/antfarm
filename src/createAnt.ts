import type { Direction } from "./types";

export type Behavior = 'wandering' | 'carrying' | 'panic';

export type Ant = {
  x: number;
  y: number;
  behavior: Behavior;
  facingDirection: Direction;
  footDirection: Direction;
  timer: number;
  phase: number;
}

const BehaviorTimingFactors = {
  wandering: 4,
  carrying:  5,
  panic: 1,
}

export const getTimer = (behavior: Behavior) => BehaviorTimingFactors[behavior] + Math.floor((Math.random() * 3)) - 1;

function createAnt(x = 0, y = 0, behavior = 'wandering' as const, facingDirection: Direction, footDirection: Direction): Ant {
  return {
    x,
    y,
    behavior,
    facingDirection,
    footDirection,
    timer: getTimer(behavior),
    phase: 0,
  };
}

export default createAnt;