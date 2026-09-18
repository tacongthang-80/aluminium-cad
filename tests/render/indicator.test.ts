import { describe, expect, it } from 'vitest';
import { Polygon2D, Segment2D, Vector2D } from '../../src/core/geom';
import { createSnapIndicator } from '../../src/render/indicator';

describe('createSnapIndicator', () => {
  const center = new Vector2D(10, 20);
  const radius = 6;

  it('creates a square for endpoint', () => {
    const shapes = createSnapIndicator(center, radius, 'endpoint');
    expect(shapes).toHaveLength(1);
    expect(shapes[0]).toBeInstanceOf(Polygon2D);
    expect((shapes[0] as Polygon2D).vertices).toHaveLength(4);
  });

  it('creates a triangle for midpoint', () => {
    const shapes = createSnapIndicator(center, radius, 'midpoint');
    expect(shapes).toHaveLength(1);
    expect(shapes[0]).toBeInstanceOf(Polygon2D);
    expect((shapes[0] as Polygon2D).vertices).toHaveLength(3);
  });

  it('creates a twelve-sided circle marker for nearest', () => {
    const shapes = createSnapIndicator(center, radius, 'nearest');
    expect(shapes).toHaveLength(1);
    const circle = shapes[0] as Polygon2D;
    expect(circle.vertices).toHaveLength(12);
    for (const vertex of circle.vertices) {
      expect(vertex.distanceTo(center)).toBeCloseTo(radius, 12);
    }
  });

  it('creates two crossing segments for intersection', () => {
    expect(createSnapIndicator(center, radius, 'intersection')).toEqual([
      new Segment2D(new Vector2D(4, 14), new Vector2D(16, 26)),
      new Segment2D(new Vector2D(4, 26), new Vector2D(16, 14)),
    ]);
  });

  it('creates a T from two segments for perpendicular', () => {
    expect(createSnapIndicator(center, radius, 'perpendicular')).toEqual([
      new Segment2D(new Vector2D(4, 23), new Vector2D(16, 23)),
      new Segment2D(new Vector2D(10, 23), new Vector2D(10, 14)),
    ]);
  });
});
