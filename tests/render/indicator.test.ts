import { describe, expect, it } from 'vitest';
import { Vector2D } from '../../src/core/geom';
import { createSnapIndicator } from '../../src/render/indicator';

describe('createSnapIndicator', () => {
  it.each([
    { center: new Vector2D(0, 0), radius: 6 },
    { center: new Vector2D(-12.5, 37), radius: 0.25 },
  ])('creates a regular octagon around $center with radius $radius', ({ center, radius }) => {
    const indicator = createSnapIndicator(center, radius);

    expect(indicator.vertices).toHaveLength(8);
    for (const vertex of indicator.vertices) {
      expect(vertex.distanceTo(center)).toBeCloseTo(radius, 12);
    }
  });
});
