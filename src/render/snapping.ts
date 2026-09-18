import { Polygon2D, Segment2D, type Vector2D } from '../core/geom';
import type { Scene } from '../core/scene';

export interface SnapResult {
  readonly point: Vector2D;
  readonly snapped: boolean;
}

export function snapPoint(
  worldPoint: Vector2D,
  scene: Scene,
  toleranceWorld: number,
): SnapResult {
  let bestPoint: Vector2D | undefined;
  let bestDistance = toleranceWorld;

  const consider = (candidate: Vector2D) => {
    const distance = worldPoint.distanceTo(candidate);
    if (distance <= bestDistance) {
      bestPoint = candidate;
      bestDistance = distance;
    }
  };

  const considerSegment = (segment: Segment2D) => {
    consider(segment.start);
    consider(segment.end);
    const projection = segment.projectPoint(worldPoint);
    if (projection.isInside) consider(projection.point);
  };

  for (const entity of scene.entities) {
    if (entity.shape instanceof Segment2D) {
      considerSegment(entity.shape);
      continue;
    }

    const polygon = entity.shape as Polygon2D;
    polygon.vertices.forEach(consider);
    for (let index = 0; index < polygon.vertices.length; index++) {
      considerSegment(new Segment2D(
        polygon.vertices[index],
        polygon.vertices[(index + 1) % polygon.vertices.length],
      ));
    }
  }

  return bestPoint
    ? { point: bestPoint, snapped: true }
    : { point: worldPoint, snapped: false };
}
