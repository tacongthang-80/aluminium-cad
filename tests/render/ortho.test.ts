import { describe, expect, it } from 'vitest';
import { Vector2D } from '../../src/core/geom';
import { applyOrtho } from '../../src/render/ortho';

describe('applyOrtho', () => {
  const anchor = new Vector2D(10, 20);

  it('constrains a mostly horizontal point to the anchor y', () => {
    expect(applyOrtho(anchor, new Vector2D(50, 30))).toEqual(new Vector2D(50, 20));
  });

  it('constrains mostly vertical points to the anchor x', () => {
    expect(applyOrtho(anchor, new Vector2D(15, 70))).toEqual(new Vector2D(10, 70));
    expect(applyOrtho(anchor, new Vector2D(5, -40))).toEqual(new Vector2D(10, -40));
  });

  it('favors horizontal when the axis deltas are equal', () => {
    expect(applyOrtho(anchor, new Vector2D(30, 40))).toEqual(new Vector2D(30, 20));
  });

  it('returns an unchanged point when it equals the anchor', () => {
    expect(applyOrtho(anchor, anchor)).toEqual(anchor);
  });
});
