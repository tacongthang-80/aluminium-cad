import { describe, expect, it } from 'vitest';
import { BoundingBox2D, EPSILON, Vector2D } from '../../src/core/geom';
import { Viewport } from '../../src/core/viewport';

const expectVectorClose = (actual: Vector2D, expected: Vector2D, digits = 10) => {
  expect(actual.x).toBeCloseTo(expected.x, digits);
  expect(actual.y).toBeCloseTo(expected.y, digits);
};

describe('Viewport transforms', () => {
  it('maps the world center to the screen center and flips the Y axis', () => {
    const viewport = new Viewport(800, 600, 2, new Vector2D(50, -30));
    expect(viewport.worldToScreen(viewport.worldCenter)).toEqual(new Vector2D(400, 300));
    expect(viewport.worldToScreen(new Vector2D(50, -20)).y).toBeLessThan(300);
  });

  it('round trips points and uses the same matrix transform', () => {
    const viewport = new Viewport(1024, 768, 3.25, new Vector2D(-125, 80));
    const points = [Vector2D.ZERO, new Vector2D(-125, 80), new Vector2D(600, -900), new Vector2D(-0.25, -17.5)];
    for (const point of points) {
      const screen = viewport.worldToScreen(point);
      expectVectorClose(viewport.screenToWorld(screen), point);
      expect(viewport.worldToScreen(point)).toEqual(viewport.worldToScreenMatrix().transformPoint(point));
    }
    const identity = viewport.worldToScreenMatrix().multiply(viewport.screenToWorldMatrix());
    identity.elements.forEach((value, index) => expect(value).toBeCloseTo(index % 4 === 0 ? 1 : 0, 10));
  });
});

describe('Viewport navigation', () => {
  it('pans so content follows a screen-space drag', () => {
    const viewport = new Viewport(900, 700, 2.5, new Vector2D(20, -40));
    const screenPoint = new Vector2D(175, 525);
    const delta = new Vector2D(83, -47);
    const worldPoint = viewport.screenToWorld(screenPoint);
    const panned = viewport.pan(delta);
    expectVectorClose(panned.worldToScreen(worldPoint), screenPoint.add(delta));
  });

  it('zooms at the cursor and clamps at both scale limits', () => {
    const cases = [
      { point: new Vector2D(400, 300), factor: 1.1 },
      { point: new Vector2D(75, 540), factor: 2.75 },
      { point: new Vector2D(790, 12), factor: 1 / 1.1 },
    ];
    for (const { point, factor } of cases) {
      const viewport = new Viewport(800, 600, 4, new Vector2D(-50, 25));
      const anchor = viewport.screenToWorld(point);
      const zoomed = viewport.zoomAt(point, factor);
      expectVectorClose(zoomed.worldToScreen(anchor), point);
      expect(zoomed.scale).toBeCloseTo(4 * factor, 12);
    }

    let maximum = new Viewport(800, 600);
    for (let i = 0; i < 20; i++) maximum = maximum.zoomAt(new Vector2D(123, 456), 10);
    expect(maximum.scale).toBe(Viewport.MAX_SCALE);
    const stillMaximum = maximum.zoomAt(new Vector2D(123, 456), 10);
    expect(stillMaximum).not.toBe(maximum);
    expect(stillMaximum.scale).toBe(Viewport.MAX_SCALE);

    let minimum = new Viewport(800, 600);
    for (let i = 0; i < 20; i++) minimum = minimum.zoomAt(new Vector2D(321, 54), 0.1);
    expect(minimum.scale).toBe(Viewport.MIN_SCALE);
    const stillMinimum = minimum.zoomAt(new Vector2D(321, 54), 0.1);
    expect(stillMinimum).not.toBe(minimum);
    expect(stillMinimum.scale).toBe(Viewport.MIN_SCALE);
  });

  it('resizes around the same world center', () => {
    const viewport = new Viewport(640, 480, 2, new Vector2D(30, 40));
    const resized = viewport.resize(1200, 900);
    expect(resized).not.toBe(viewport);
    expect(resized.screenWidth).toBe(1200);
    expect(resized.screenHeight).toBe(900);
    expect(resized.scale).toBe(viewport.scale);
    expect(resized.worldCenter).toBe(viewport.worldCenter);
    expect(resized.worldToScreen(viewport.worldCenter)).toEqual(new Vector2D(600, 450));
  });

  it('returns new frozen instances without mutating the source', () => {
    const viewport = new Viewport(800, 600, Viewport.MAX_SCALE, new Vector2D(10, 20));
    const snapshot = [viewport.screenWidth, viewport.screenHeight, viewport.scale, viewport.worldCenter];
    const results = [viewport.pan(Vector2D.ZERO), viewport.zoomAt(new Vector2D(400, 300), 2), viewport.resize(800, 600)];
    expect([viewport.screenWidth, viewport.screenHeight, viewport.scale, viewport.worldCenter]).toEqual(snapshot);
    for (const result of results) {
      expect(result).not.toBe(viewport);
      expect(Object.isFrozen(result)).toBe(true);
    }
  });
});

describe('Viewport fitting and validation', () => {
  it('fits every bounds corner inside the requested margin', () => {
    const bounds = new BoundingBox2D(-200, -50, 600, 350);
    const margin = 40;
    const viewport = Viewport.fitToBounds(bounds, 1000, 700, margin);
    expect(viewport.worldCenter).toEqual(bounds.center());
    for (const corner of [
      new Vector2D(bounds.minX, bounds.minY),
      new Vector2D(bounds.minX, bounds.maxY),
      new Vector2D(bounds.maxX, bounds.minY),
      new Vector2D(bounds.maxX, bounds.maxY),
    ]) {
      const screen = viewport.worldToScreen(corner);
      expect(screen.x).toBeGreaterThanOrEqual(margin - EPSILON);
      expect(screen.x).toBeLessThanOrEqual(1000 - margin + EPSILON);
      expect(screen.y).toBeGreaterThanOrEqual(margin - EPSILON);
      expect(screen.y).toBeLessThanOrEqual(700 - margin + EPSILON);
    }
  });

  it('uses a finite default scale for degenerate bounds and clamps fitted scales', () => {
    for (const bounds of [
      new BoundingBox2D(5, 5, 5, 5),
      new BoundingBox2D(0, 0, 0, 100),
      new BoundingBox2D(0, 0, 100, 0),
    ]) {
      const viewport = Viewport.fitToBounds(bounds, 800, 600);
      expect(viewport.scale).toBe(1);
      expect(Number.isFinite(viewport.worldCenter.x)).toBe(true);
      expect(Number.isFinite(viewport.worldCenter.y)).toBe(true);
    }
    expect(Viewport.fitToBounds(new BoundingBox2D(0, 0, 1e12, 1e12), 100, 100, 10).scale).toBe(Viewport.MIN_SCALE);
    expect(Viewport.fitToBounds(new BoundingBox2D(0, 0, 1e-6, 1e-6), 100, 100, 10).scale).toBe(Viewport.MAX_SCALE);
  });

  it('validates dimensions, scales, zoom factors, and fitting margins', () => {
    for (const dimensions of [[0, 100], [-1, 100], [100, 0], [100, -1], [Infinity, 100], [100, NaN]]) {
      expect(() => new Viewport(dimensions[0], dimensions[1])).toThrow(RangeError);
    }
    expect(() => new Viewport(100, 100, Viewport.MIN_SCALE / 2)).toThrow(RangeError);
    expect(() => new Viewport(100, 100, Viewport.MAX_SCALE * 2)).toThrow(RangeError);
    expect(() => new Viewport(100, 100).zoomAt(Vector2D.ZERO, 0)).toThrow(RangeError);
    expect(() => new Viewport(100, 100).zoomAt(Vector2D.ZERO, NaN)).toThrow(RangeError);
    const bounds = new BoundingBox2D(0, 0, 10, 10);
    expect(() => Viewport.fitToBounds(bounds, 100, 100, -1)).toThrow(RangeError);
    expect(() => Viewport.fitToBounds(bounds, 100, 100, 50)).toThrow(RangeError);
    expect(() => Viewport.fitToBounds(bounds, Infinity, 100)).toThrow(RangeError);
  });
});
