import { Polygon2D, Segment2D, type Vector2D } from '../core/geom';
import type { Entity, Scene } from '../core/scene';

export function sceneSegments(scene: Scene, excludeEntityId?: string): ReadonlyArray<Segment2D> {
  const segments: Segment2D[] = [];
  for (const entity of scene.entities) {
    if (entity.id === excludeEntityId) continue;
    if (entity.shape instanceof Segment2D) {
      segments.push(entity.shape);
      continue;
    }
    const closed = entity.shape instanceof Polygon2D;
    const edgeCount = closed ? entity.shape.vertices.length : entity.shape.vertices.length - 1;
    for (let index = 0; index < edgeCount; index++) {
      const next = closed ? (index + 1) % entity.shape.vertices.length : index + 1;
      segments.push(new Segment2D(entity.shape.vertices[index], entity.shape.vertices[next]));
    }
  }
  return segments;
}

export function findNearestSegmentEntity(
  worldPoint: Vector2D,
  scene: Scene,
  toleranceWorld: number,
): Entity | undefined {
  let nearest: Entity | undefined;
  let bestDistance = toleranceWorld;
  for (const entity of scene.entities) {
    if (!(entity.shape instanceof Segment2D)) continue;
    const distance = entity.shape.distanceToPoint(worldPoint);
    if (distance <= bestDistance) {
      nearest = entity;
      bestDistance = distance;
    }
  }
  return nearest;
}
