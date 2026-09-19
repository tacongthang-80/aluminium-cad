import { EPSILON, Segment2D, type Vector2D } from '../core/geom';
import type { Entity, Scene } from '../core/scene';
import { sceneSegments } from './pick';

export function computeTrim(
  target: Entity,
  clickWorldPoint: Vector2D,
  scene: Scene,
): ReadonlyArray<Segment2D> | null {
  if (!(target.shape instanceof Segment2D)) return null;
  const clickT = target.shape.projectPoint(clickWorldPoint).t;
  const crossings: Array<{ point: Vector2D; t: number }> = [];

  for (const boundary of sceneSegments(scene, target.id)) {
    const hit = target.shape.intersectWith(boundary);
    if (hit.type !== 'POINT') continue;
    const t = target.shape.projectPoint(hit.point).t;
    if (t <= EPSILON || t >= 1 - EPSILON) continue;
    crossings.push({ point: hit.point, t });
  }

  if (crossings.length === 0) return null;

  let lower: { point: Vector2D; t: number } | undefined;
  let upper: { point: Vector2D; t: number } | undefined;
  for (const crossing of crossings) {
    if (crossing.t < clickT && (!lower || crossing.t > lower.t)) lower = crossing;
    if (crossing.t > clickT && (!upper || crossing.t < upper.t)) upper = crossing;
  }

  if (lower && upper) {
    return [
      new Segment2D(target.shape.start, lower.point),
      new Segment2D(upper.point, target.shape.end),
    ];
  }
  if (upper) return [new Segment2D(upper.point, target.shape.end)];
  if (lower) return [new Segment2D(target.shape.start, lower.point)];
  return null;
}
