export type Point = { x: number; y: number };

export function add(pointA: Readonly<Point>, pointB: Readonly<Point>): Point {
  return {
    x: pointA.x + pointB.x,
    y: pointA.y + pointB.y,
  };
}