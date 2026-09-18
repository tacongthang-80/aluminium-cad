import { EPSILON, Segment2D, type Vector2D } from '../core/geom';
import type { Entity, Scene } from '../core/scene';
import { sceneSegments } from './pick';

const EXTENSION_DISTANCE_MM = 1_000_000;

export function computeExtend(target: Entity, clickWorldPoint: Vector2D, scene: Scene): Segment2D | null {
  if (!(target.shape instanceof Segment2D)) return null;
  const extendStart = clickWorldPoint.distanceTo(target.shape.start) <= clickWorldPoint.distanceTo(target.shape.end);
  const endpoint = extendStart ? target.shape.start : target.shape.end;
  const direction = target.shape.direction().scale(extendStart ? -1 : 1);
  const projected = new Segment2D(endpoint, endpoint.add(direction.scale(EXTENSION_DISTANCE_MM)));
  let nearest: { point: Vector2D; distance: number } | undefined;

  for (const boundary of sceneSegments(scene, target.id)) {
    const hit = projected.intersectWith(boundary);
    if (hit.type !== 'POINT') continue;
    const distance = endpoint.distanceTo(hit.point);
    if (distance <= EPSILON) continue;
    if (!nearest || distance < nearest.distance) nearest = { point: hit.point, distance };
  }

  if (!nearest) return null;
  return extendStart
    ? new Segment2D(nearest.point, target.shape.end)
    : new Segment2D(target.shape.start, nearest.point);
}
