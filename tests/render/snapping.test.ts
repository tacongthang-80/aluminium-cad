import { describe, expect, it } from 'vitest';
import { Polygon2D, Polyline2D, Segment2D, Vector2D } from '../../src/core/geom';
import { Scene } from '../../src/core/scene';
import { snapPoint } from '../../src/render/snapping';

describe('snapPoint', () => {
  it('snaps to a segment endpoint', () => {
    const endpoint = new Vector2D(0, 0);
    const scene = new Scene([{ id: 'line', shape: new Segment2D(endpoint, new Vector2D(100, 0)) }]);

    expect(snapPoint(new Vector2D(-3, 4), scene, 5)).toEqual({ point: endpoint, snapped: true });
  });

  it('snaps to the projected point inside a segment', () => {
    const scene = new Scene([{
      id: 'line',
      shape: new Segment2D(new Vector2D(0, 0), new Vector2D(100, 0)),
    }]);

    expect(snapPoint(new Vector2D(45, 4), scene, 5)).toEqual({
      point: new Vector2D(45, 0),
      snapped: true,
    });
  });

  it('snaps to polygon vertices and edges', () => {
    const vertex = new Vector2D(0, 0);
    const scene = new Scene([{
      id: 'box',
      shape: new Polygon2D([
        vertex,
        new Vector2D(100, 0),
        new Vector2D(100, 100),
        new Vector2D(0, 100),
      ]),
    }]);

    expect(snapPoint(new Vector2D(-2, -3), scene, 5)).toEqual({ point: vertex, snapped: true });
    expect(snapPoint(new Vector2D(103, 40), scene, 5)).toEqual({
      point: new Vector2D(100, 40),
      snapped: true,
    });
  });

  it('snaps to polyline vertices and open-chain edges', () => {
    const vertex = new Vector2D(0, 0);
    const scene = new Scene([{
      id: 'path',
      shape: new Polyline2D([
        vertex,
        new Vector2D(100, 0),
        new Vector2D(100, 100),
      ]),
    }]);

    expect(snapPoint(new Vector2D(-2, -3), scene, 5)).toEqual({ point: vertex, snapped: true });
    expect(snapPoint(new Vector2D(45, 4), scene, 5)).toEqual({
      point: new Vector2D(45, 0),
      snapped: true,
    });
  });

  it('does not snap to a phantom closing edge on a polyline', () => {
    const query = new Vector2D(50, 50);
    const scene = new Scene([{
      id: 'open-path',
      shape: new Polyline2D([
        new Vector2D(0, 0),
        new Vector2D(0, 100),
        new Vector2D(100, 100),
      ]),
    }]);

    const result = snapPoint(query, scene, 2);
    expect(result).toEqual({ point: query, snapped: false });
    expect(result.point).toBe(query);
  });

  it('returns the exact input point when nothing is within tolerance', () => {
    const query = new Vector2D(50, 20);
    const scene = new Scene([{
      id: 'line',
      shape: new Segment2D(new Vector2D(0, 0), new Vector2D(100, 0)),
    }]);

    const result = snapPoint(query, scene, 10);
    expect(result).toEqual({ point: query, snapped: false });
    expect(result.point).toBe(query);
  });

  it('chooses the closest candidate across entities', () => {
    const farther = new Vector2D(10, 0);
    const nearer = new Vector2D(14, 0);
    const scene = new Scene([
      { id: 'farther', shape: new Segment2D(farther, new Vector2D(10, 20)) },
      { id: 'nearer', shape: new Segment2D(nearer, new Vector2D(14, 20)) },
    ]);

    expect(snapPoint(new Vector2D(13, -1), scene, 5)).toEqual({ point: nearer, snapped: true });
  });

  it('does not snap in an empty scene', () => {
    const query = new Vector2D(1, 2);
    expect(snapPoint(query, new Scene(), 100)).toEqual({ point: query, snapped: false });
  });
});
