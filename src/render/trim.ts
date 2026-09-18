import { EPSILON, Segment2D, type Vector2D } from '../core/geom';
import type { Entity, Scene } from '../core/scene';
import { sceneSegments } from './pick';

export function computeTrim(target: Entity, clickWorldPoint: Vector2D, scene: Scene): Segment2D | null {
  if (!(target.shape instanceof Segment2D)) return null;
  const clickT = target.shape.projectPoint(clickWorldPoint).t;
  let nearest: { point: Vector2D; t: number; distance: number } | undefined;

  for (const boundary of sceneSegments(scene, target.id)) {
    const hit = target.shape.intersectWith(boundary);
    if (hit.type !== 'POINT') continue;
    const t = target.shape.projectPoint(hit.point).t;
    if (t <= EPSILON || t >= 1 - EPSILON) continue;
    const distance = Math.abs(t - clickT);
    if (!nearest || distance < nearest.distance) nearest = { point: hit.point, t, distance };
  }

  if (!nearest) return null;
  return clickT > nearest.t
    ? new Segment2D(target.shape.start, nearest.point)
    : new Segment2D(nearest.point, target.shape.end);
}
