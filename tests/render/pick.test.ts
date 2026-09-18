import { describe, expect, it } from 'vitest';
import { Polygon2D, Polyline2D, Segment2D, Vector2D } from '../../src/core/geom';
import { Scene } from '../../src/core/scene';
import { findNearestSegmentEntity, sceneSegments } from '../../src/render/pick';

const line = (id: string, start: Vector2D, end: Vector2D) => ({ id, shape: new Segment2D(start, end) });

describe('sceneSegments', () => {
  const segment = line('line', new Vector2D(-5, 0), new Vector2D(5, 0));
  const polygon = {
    id: 'box',
    shape: new Polygon2D([
      new Vector2D(0, 0), new Vector2D(10, 0), new Vector2D(10, 10), new Vector2D(0, 10),
    ]),
  };
  const polyline = {
    id: 'path',
    shape: new Polyline2D([new Vector2D(20, 0), new Vector2D(30, 5), new Vector2D(20, 10)]),
  };
  const scene = new Scene([segment, polygon, polyline]);

  it('decomposes segments, closed polygons, and open polylines', () => {
    const result = sceneSegments(scene);
    expect(result).toHaveLength(7);
    expect(result[0]).toBe(segment.shape);
    expect(result).toContainEqual(new Segment2D(new Vector2D(0, 10), new Vector2D(0, 0)));
    expect(result).toContainEqual(new Segment2D(new Vector2D(20, 0), new Vector2D(30, 5)));
    expect(result).not.toContainEqual(new Segment2D(new Vector2D(20, 10), new Vector2D(20, 0)));
  });

  it('excludes all segments belonging to the requested entity', () => {
    expect(sceneSegments(scene, 'box')).toEqual([
      segment.shape,
      new Segment2D(new Vector2D(20, 0), new Vector2D(30, 5)),
      new Segment2D(new Vector2D(30, 5), new Vector2D(20, 10)),
    ]);
  });
});

describe('findNearestSegmentEntity', () => {
  it('returns the closest Segment2D entity within tolerance', () => {
    const farther = line('farther', new Vector2D(0, 0), new Vector2D(20, 0));
    const nearer = line('nearer', new Vector2D(0, 3), new Vector2D(20, 3));
    expect(findNearestSegmentEntity(new Vector2D(10, 2.5), new Scene([farther, nearer]), 3)).toBe(nearer);
  });

  it('ignores non-segment entities even when they are closer', () => {
    const lineEntity = line('line', new Vector2D(0, 4), new Vector2D(20, 4));
    const path = {
      id: 'path',
      shape: new Polyline2D([new Vector2D(0, 0), new Vector2D(20, 0)]),
    };
    expect(findNearestSegmentEntity(new Vector2D(10, 0), new Scene([path, lineEntity]), 5)).toBe(lineEntity);
  });

  it('returns undefined when no segment qualifies or the scene is empty', () => {
    const entity = line('line', new Vector2D(0, 0), new Vector2D(10, 0));
    expect(findNearestSegmentEntity(new Vector2D(5, 10), new Scene([entity]), 2)).toBeUndefined();
    expect(findNearestSegmentEntity(Vector2D.ZERO, new Scene(), 100)).toBeUndefined();
  });
});
