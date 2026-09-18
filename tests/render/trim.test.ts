import { describe, expect, it } from 'vitest';
import { Polygon2D, Polyline2D, Segment2D, Vector2D } from '../../src/core/geom';
import { Scene, type Entity } from '../../src/core/scene';
import { computeTrim } from '../../src/render/trim';

const target: Entity = {
  id: 'target',
  shape: new Segment2D(new Vector2D(0, 0), new Vector2D(100, 0)),
};
const cutter = (id: string, x: number): Entity => ({
  id,
  shape: new Segment2D(new Vector2D(x, -20), new Vector2D(x, 20)),
});

describe('computeTrim', () => {
  it('trims the clicked side at a single crossing', () => {
    const scene = new Scene([target, cutter('cut', 40)]);
    expect(computeTrim(target, new Vector2D(80, 0), scene)).toEqual(
      new Segment2D(new Vector2D(0, 0), new Vector2D(40, 0)),
    );
    expect(computeTrim(target, new Vector2D(10, 0), scene)).toEqual(
      new Segment2D(new Vector2D(40, 0), new Vector2D(100, 0)),
    );
  });

  it('uses the intersection nearest to the click', () => {
    const scene = new Scene([target, cutter('right', 70), cutter('left', 25)]);
    expect(computeTrim(target, new Vector2D(50, 0), scene)).toEqual(
      new Segment2D(new Vector2D(70, 0), new Vector2D(100, 0)),
    );
  });

  it('returns null without a qualifying crossing', () => {
    const parallel: Entity = {
      id: 'parallel',
      shape: new Segment2D(new Vector2D(0, 10), new Vector2D(100, 10)),
    };
    expect(computeTrim(target, new Vector2D(50, 0), new Scene([target, parallel]))).toBeNull();
    expect(computeTrim(target, new Vector2D(50, 0), new Scene([target, cutter('endpoint', 0)]))).toBeNull();
  });

  it('returns null for polygon and polyline targets', () => {
    const polygon: Entity = {
      id: 'polygon',
      shape: new Polygon2D([
        new Vector2D(0, 0), new Vector2D(10, 0), new Vector2D(10, 10), new Vector2D(0, 10),
      ]),
    };
    const polyline: Entity = {
      id: 'polyline',
      shape: new Polyline2D([new Vector2D(0, 0), new Vector2D(10, 10)]),
    };
    const scene = new Scene([polygon, polyline]);
    expect(computeTrim(polygon, Vector2D.ZERO, scene)).toBeNull();
    expect(computeTrim(polyline, Vector2D.ZERO, scene)).toBeNull();
  });
});
