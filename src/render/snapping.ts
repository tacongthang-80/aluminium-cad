import { Polygon2D, Segment2D, type Vector2D } from '../core/geom';
import type { Scene } from '../core/scene';

export type SnapMode = 'endpoint' | 'midpoint' | 'nearest' | 'intersection' | 'perpendicular';

export interface SnapOptions {
  readonly modes: ReadonlySet<SnapMode>;
  readonly toleranceWorld: number;
  readonly referencePoint?: Vector2D;
}

export interface SnapResult {
  readonly point: Vector2D;
  readonly snapped: boolean;
  readonly mode?: SnapMode;
}

const PRIORITY: Record<SnapMode, number> = {
  endpoint: 0,
  intersection: 1,
  perpendicular: 2,
  midpoint: 3,
  nearest: 4,
};

export function snapPoint(worldPoint: Vector2D, scene: Scene, options: SnapOptions): SnapResult {
  let best: { point: Vector2D; mode: SnapMode; distance: number } | undefined;

  const consider = (point: Vector2D, mode: SnapMode) => {
    const distance = worldPoint.distanceTo(point);
    if (distance > options.toleranceWorld) return;
    const replacesNearest = mode !== 'nearest' && best?.mode === 'nearest';
    const sameCandidateClass = (mode === 'nearest') === (best?.mode === 'nearest');
    if (!best || replacesNearest || (sameCandidateClass && (
      distance < best.distance ||
      (distance === best.distance && PRIORITY[mode] < PRIORITY[best.mode])
    ))) {
      best = { point, mode, distance };
    }
  };

  for (const entity of scene.entities) {
    const edges: Segment2D[] = [];
    if (entity.shape instanceof Segment2D) {
      if (options.modes.has('endpoint')) {
        consider(entity.shape.start, 'endpoint');
        consider(entity.shape.end, 'endpoint');
      }
      edges.push(entity.shape);
    } else {
      if (options.modes.has('endpoint')) entity.shape.vertices.forEach(point => consider(point, 'endpoint'));
      const closed = entity.shape instanceof Polygon2D;
      const edgeCount = closed ? entity.shape.vertices.length : entity.shape.vertices.length - 1;
      for (let index = 0; index < edgeCount; index++) {
        const next = closed ? (index + 1) % entity.shape.vertices.length : index + 1;
        edges.push(new Segment2D(entity.shape.vertices[index], entity.shape.vertices[next]));
      }
    }

    for (const edge of edges) {
      if (options.modes.has('midpoint')) consider(edge.midpoint(), 'midpoint');
      if (options.modes.has('nearest')) {
        const projection = edge.projectPoint(worldPoint);
        if (projection.isInside) consider(projection.point, 'nearest');
      }
    }
  }

  return best
    ? { point: best.point, snapped: true, mode: best.mode }
    : { point: worldPoint, snapped: false };
}
