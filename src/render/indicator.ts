import { Polygon2D, Segment2D, Vector2D } from '../core/geom';
import type { SnapMode } from './snapping';

function regularPolygon(
  center: Vector2D,
  radiusWorld: number,
  vertexCount: number,
  startAngle = 0,
): Polygon2D {
  return new Polygon2D(Array.from({ length: vertexCount }, (_, index) => {
    const angle = startAngle + index * Math.PI * 2 / vertexCount;
    return center.add(new Vector2D(
      Math.cos(angle) * radiusWorld,
      Math.sin(angle) * radiusWorld,
    ));
  }));
}

export function createSnapIndicator(
  center: Vector2D,
  radiusWorld: number,
  mode: SnapMode,
): ReadonlyArray<Segment2D | Polygon2D> {
  const offset = (x: number, y: number) => center.add(new Vector2D(x, y));

  switch (mode) {
    case 'endpoint':
      return [regularPolygon(center, radiusWorld, 4, Math.PI / 4)];
    case 'midpoint':
      return [regularPolygon(center, radiusWorld, 3, Math.PI / 2)];
    case 'nearest':
      return [regularPolygon(center, radiusWorld, 12)];
    case 'intersection':
      return [
        new Segment2D(offset(-radiusWorld, -radiusWorld), offset(radiusWorld, radiusWorld)),
        new Segment2D(offset(-radiusWorld, radiusWorld), offset(radiusWorld, -radiusWorld)),
      ];
    case 'perpendicular':
      return [
        new Segment2D(offset(-radiusWorld, radiusWorld / 2), offset(radiusWorld, radiusWorld / 2)),
        new Segment2D(offset(0, radiusWorld / 2), offset(0, -radiusWorld)),
      ];
  }
}
