import { describe, expect, it } from 'vitest';
import { Polygon2D, Polyline2D, Segment2D, Vector2D } from '../../src/core/geom';
import { Scene, type Entity } from '../../src/core/scene';
import { computeExtend } from '../../src/render/extend';

const target: Entity = {
  id: 'target',
  shape: new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
};
const boundary = (id: string, x: number): Entity => ({
  id,
  shape: new Segment2D(new Vector2D(x, -20), new Vector2D(x, 20)),
});

describe('computeExtend', () => {
  it('extends the end to the next crossing and preserves the start', () => {
    expect(computeExtend(target, new Vector2D(9, 0), new Scene([target, boundary('next', 20)]))).toEqual(
      new Segment2D(new Vector2D(0, 0), new Vector2D(20, 0)),
    );
  });

  it('extends the start backward and preserves the end', () => {
    expect(computeExtend(target, new Vector2D(1, 0), new Scene([target, boundary('previous', -10)]))).toEqual(
      new Segment2D(new Vector2D(-10, 0), new Vector2D(10, 0)),
    );
  });

  it('chooses the nearest boundary along the extension ray', () => {
    const scene = new Scene([target, boundary('far', 30), boundary('near', 20)]);
    expect(computeExtend(target, new Vector2D(9, 0), scene)).toEqual(
      new Segment2D(new Vector2D(0, 0), new Vector2D(20, 0)),
    );
  });

  it('returns null when no boundary lies along the chosen direction', () => {
    expect(computeExtend(target, new Vector2D(9, 0), new Scene([target, boundary('behind', -10)]))).toBeNull();
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
    expect(computeExtend(polygon, Vector2D.ZERO, scene)).toBeNull();
    expect(computeExtend(polyline, Vector2D.ZERO, scene)).toBeNull();
  });

  it('ignores a boundary already touching the selected endpoint', () => {
    expect(computeExtend(target, new Vector2D(9, 0), new Scene([target, boundary('touching', 10)]))).toBeNull();
  });
});
