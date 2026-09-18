import { describe, expect, it } from 'vitest';
import { Vector2D } from '../../src/core/geom';
import { pointerToScreen, zoomFactorForWheelDelta } from '../../src/render/interaction';

describe('zoomFactorForWheelDelta', () => {
  it('uses fixed reciprocal zoom steps and treats zero as a genuine no-op', () => {
    expect(zoomFactorForWheelDelta(-120)).toBe(1.1);
    expect(zoomFactorForWheelDelta(-0.01)).toBe(1.1);
    expect(zoomFactorForWheelDelta(120)).toBeCloseTo(1 / 1.1, 12);
    expect(zoomFactorForWheelDelta(0.01)).toBeCloseTo(1 / 1.1, 12);
    expect(zoomFactorForWheelDelta(0)).toBe(1);
  });
});

describe('pointerToScreen', () => {
  it('subtracts canvas offset and converts CSS pixels to device pixels', () => {
    expect(pointerToScreen(125, 80, { left: 25, top: 30 }, 2)).toEqual(new Vector2D(200, 100));
    expect(pointerToScreen(10.5, 20.25, { left: 0, top: 0 }, 1)).toEqual(new Vector2D(10.5, 20.25));
    expect(pointerToScreen(42, 18, { left: 50, top: 20 }, 1.5)).toEqual(new Vector2D(-12, -3));
  });
});
