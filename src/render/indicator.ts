import { Polygon2D, Vector2D } from '../core/geom';

export function createSnapIndicator(center: Vector2D, radiusWorld: number): Polygon2D {
  return new Polygon2D(Array.from({ length: 8 }, (_, index) => {
    const angle = index * Math.PI / 4;
    return center.add(new Vector2D(
      Math.cos(angle) * radiusWorld,
      Math.sin(angle) * radiusWorld,
    ));
  }));
}
