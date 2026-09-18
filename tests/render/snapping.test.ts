import { describe, expect, it } from 'vitest';
import { Polygon2D, Polyline2D, Segment2D, Vector2D } from '../../src/core/geom';
import { Scene } from '../../src/core/scene';
import { snapPoint, type SnapMode } from '../../src/render/snapping';

const modes = (...values: SnapMode[]) => new Set(values);
const snap = (point: Vector2D, scene: Scene, enabled: SnapMode[], toleranceWorld = 5) =>
  snapPoint(point, scene, { modes: modes(...enabled), toleranceWorld });

describe('snapPoint OSNAP modes', () => {
  const segmentScene = new Scene([{
    id: 'line',
    shape: new Segment2D(new Vector2D(0, 0), new Vector2D(100, 0)),
  }]);

  it('endpoint mode snaps only to vertices', () => {
    const endpoint = new Vector2D(0, 0);
    expect(snap(new Vector2D(-3, 4), segmentScene, ['endpoint'])).toEqual({
      point: endpoint, snapped: true, mode: 'endpoint',
    });
    const interior = new Vector2D(45, 1);
    const result = snap(interior, segmentScene, ['endpoint'], 2);
    expect(result).toEqual({ point: interior, snapped: false });
    expect(result.point).toBe(interior);

    const polygonScene = new Scene([{
      id: 'box',
      shape: new Polygon2D([
        new Vector2D(0, 0), new Vector2D(10, 0), new Vector2D(10, 10), new Vector2D(0, 10),
      ]),
    }]);
    expect(snap(new Vector2D(9, 11), polygonScene, ['endpoint'])).toEqual({
      point: new Vector2D(10, 10), snapped: true, mode: 'endpoint',
    });
  });

  it('midpoint mode snaps to segment and polygon edge midpoints but not endpoints', () => {
    expect(snap(new Vector2D(49, 2), segmentScene, ['midpoint'])).toEqual({
      point: new Vector2D(50, 0), snapped: true, mode: 'midpoint',
    });
    const polygonScene = new Scene([{
      id: 'box',
      shape: new Polygon2D([
        new Vector2D(0, 0), new Vector2D(20, 0), new Vector2D(20, 10), new Vector2D(0, 10),
      ]),
    }]);
    expect(snap(new Vector2D(19, 5), polygonScene, ['midpoint'])).toEqual({
      point: new Vector2D(20, 5), snapped: true, mode: 'midpoint',
    });
    expect(snap(new Vector2D(0, 0.5), polygonScene, ['midpoint'], 2).snapped).toBe(false);
  });

  it('nearest mode snaps to the projected point inside an edge', () => {
    expect(snap(new Vector2D(45, 4), segmentScene, ['nearest'])).toEqual({
      point: new Vector2D(45, 0), snapped: true, mode: 'nearest',
    });
  });

  it('chooses the closest candidate across enabled modes and reports its mode', () => {
    expect(snap(new Vector2D(48, 3), segmentScene, ['endpoint', 'midpoint'], 60)).toEqual({
      point: new Vector2D(50, 0), snapped: true, mode: 'midpoint',
    });
    expect(snap(new Vector2D(48, 3), segmentScene, ['endpoint', 'midpoint', 'nearest'], 60)).toEqual({
      point: new Vector2D(48, 0), snapped: true, mode: 'nearest',
    });
  });

  it('never snaps when no modes are enabled', () => {
    const query = new Vector2D(0, 1);
    expect(snap(query, segmentScene, [], 100)).toEqual({ point: query, snapped: false });
  });

  it('treats intersection and perpendicular as inert placeholders', () => {
    const query = new Vector2D(0, 1);
    expect(() => snap(query, segmentScene, ['intersection', 'perpendicular'], 100)).not.toThrow();
    expect(snap(query, segmentScene, ['intersection', 'perpendicular'], 100)).toEqual({
      point: query, snapped: false,
    });
  });

  it('prefers endpoint over midpoint at exactly equal distance', () => {
    const scene = new Scene([{
      id: 'short',
      shape: new Segment2D(new Vector2D(0, 0), new Vector2D(2, 0)),
    }]);
    expect(snap(new Vector2D(0.5, 0), scene, ['midpoint', 'endpoint'], 1)).toEqual({
      point: new Vector2D(0, 0), snapped: true, mode: 'endpoint',
    });
  });

  it('supports open polyline edges without a phantom closing edge', () => {
    const scene = new Scene([{
      id: 'path',
      shape: new Polyline2D([
        new Vector2D(0, 0), new Vector2D(0, 100), new Vector2D(100, 100),
      ]),
    }]);
    expect(snap(new Vector2D(2, 45), scene, ['nearest'])).toEqual({
      point: new Vector2D(0, 45), snapped: true, mode: 'nearest',
    });
    const phantomQuery = new Vector2D(50, 50);
    const result = snap(phantomQuery, scene, ['nearest'], 2);
    expect(result).toEqual({ point: phantomQuery, snapped: false });
    expect(result.point).toBe(phantomQuery);
  });

  it('does not snap in an empty scene', () => {
    const query = new Vector2D(1, 2);
    expect(snap(query, new Scene(), ['endpoint', 'midpoint', 'nearest'], 100)).toEqual({
      point: query, snapped: false,
    });
  });
});
