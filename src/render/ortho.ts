import { Vector2D } from '../core/geom';

export function applyOrtho(anchor: Vector2D, point: Vector2D): Vector2D {
  const deltaX = Math.abs(point.x - anchor.x);
  const deltaY = Math.abs(point.y - anchor.y);
  return deltaX >= deltaY
    ? new Vector2D(point.x, anchor.y)
    : new Vector2D(anchor.x, point.y);
}
