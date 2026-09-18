import { describe, expect, it } from 'vitest';
import { BoundingBox2D, Polygon2D, Polyline2D, Segment2D, Vector2D } from '../../src/core/geom';
import { Scene, type Entity } from '../../src/core/scene';

const segment = (id: string, x1: number, y1: number, x2: number, y2: number): Entity => ({
  id,
  shape: new Segment2D(new Vector2D(x1, y1), new Vector2D(x2, y2)),
});

const polygon = (id: string): Entity => ({
  id,
  shape: new Polygon2D([
    new Vector2D(-4, -3),
    new Vector2D(8, -3),
    new Vector2D(8, 6),
    new Vector2D(-4, 6),
  ]),
});

const polyline = (id: string): Entity => ({
  id,
  shape: new Polyline2D([
    new Vector2D(-12, 3),
    new Vector2D(2, 18),
    new Vector2D(20, -11),
  ]),
});

describe('Scene construction and lookup', () => {
  it('preserves order, copies arrays, and exposes frozen state', () => {
    const entities = [segment('a', 0, 0, 1, 1), segment('b', 2, 2, 3, 3)];
    const selectedIds = ['b'];
    const scene = new Scene(entities, selectedIds);
    entities.reverse();
    selectedIds.length = 0;

    expect(scene.entities.map(entity => entity.id)).toEqual(['a', 'b']);
    expect(scene.selectedIds).toEqual(['b']);
    expect(scene.getEntity('a')).toBe(scene.entities[0]);
    expect(scene.getEntity('missing')).toBeUndefined();
    expect(scene.isSelected('b')).toBe(true);
    expect(scene.isSelected('a')).toBe(false);
    expect(Object.isFrozen(scene)).toBe(true);
    expect(Object.isFrozen(scene.entities)).toBe(true);
    expect(Object.isFrozen(scene.selectedIds)).toBe(true);
  });

  it('rejects duplicate entity ids and unknown selected ids', () => {
    const entity = segment('same', 0, 0, 1, 1);
    expect(() => new Scene([entity, segment('same', 2, 2, 3, 3)])).toThrow(RangeError);
    expect(() => new Scene([entity], ['missing'])).toThrow(RangeError);
  });
});

describe('Scene immutable transitions', () => {
  it('adds at the end without mutating the original and rejects duplicate ids', () => {
    const first = segment('first', 0, 0, 1, 1);
    const second = segment('second', 1, 1, 2, 2);
    const original = new Scene([first]);
    const added = original.addEntity(second);

    expect(added).not.toBe(original);
    expect(original.entities).toEqual([first]);
    expect(added.entities).toEqual([first, second]);
    expect(() => added.addEntity(segment('first', 5, 5, 6, 6))).toThrow(RangeError);
  });

  it('removes an entity and its selection without mutating the original', () => {
    const first = segment('first', 0, 0, 1, 1);
    const second = segment('second', 1, 1, 2, 2);
    const original = new Scene([first, second], ['first', 'second']);
    const removed = original.removeEntity('first');

    expect(removed).not.toBe(original);
    expect(original.entities).toEqual([first, second]);
    expect(original.selectedIds).toEqual(['first', 'second']);
    expect(removed.entities).toEqual([second]);
    expect(removed.selectedIds).toEqual(['second']);
    expect(() => original.removeEntity('missing')).toThrow(RangeError);
  });

  it('replaces and clears selection', () => {
    const scene = new Scene([
      segment('a', 0, 0, 1, 1),
      segment('b', 1, 1, 2, 2),
      segment('c', 2, 2, 3, 3),
    ], ['a']);
    const selected = scene.select(['b', 'c']);
    const cleared = selected.clearSelection();

    expect(selected).not.toBe(scene);
    expect(scene.selectedIds).toEqual(['a']);
    expect(selected.selectedIds).toEqual(['b', 'c']);
    expect(cleared).not.toBe(selected);
    expect(cleared.selectedIds).toEqual([]);
    expect(selected.select([]).selectedIds).toEqual([]);
    expect(() => scene.select(['missing'])).toThrow(RangeError);
  });
});

describe('Scene bounding boxes', () => {
  it('returns undefined for an empty scene', () => {
    expect(new Scene().boundingBox()).toBeUndefined();
  });

  it('returns exact bounds for a single segment', () => {
    expect(new Scene([segment('line', 7, -5, -2, 11)]).boundingBox()).toEqual(
      new BoundingBox2D(-2, -5, 7, 11),
    );
  });

  it('unions exact bounds across segment, polygon, and polyline entities', () => {
    const scene = new Scene([
      segment('line', -10, 12, 3, -8),
      polygon('panel'),
      segment('right', 5, 2, 15, 4),
      polyline('path'),
    ]);
    expect(scene.boundingBox()).toEqual(new BoundingBox2D(-12, -11, 20, 18));
  });

  it('matches a single polygon own bounds', () => {
    const entity = polygon('panel');
    expect(new Scene([entity]).boundingBox()).toEqual((entity.shape as Polygon2D).boundingBox());
  });

  it('matches a single polyline own bounds', () => {
    const entity = polyline('path');
    expect(new Scene([entity]).boundingBox()).toEqual((entity.shape as Polyline2D).boundingBox());
  });
});
