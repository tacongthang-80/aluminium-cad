import { BoundingBox2D } from '../geom/BoundingBox2D';
import { Polygon2D } from '../geom/Polygon2D';
import { Segment2D } from '../geom/Segment2D';
import type { Entity } from './Entity';

function entityBounds(entity: Entity): BoundingBox2D {
  if (entity.shape instanceof Segment2D) {
    return new BoundingBox2D(
      Math.min(entity.shape.start.x, entity.shape.end.x),
      Math.min(entity.shape.start.y, entity.shape.end.y),
      Math.max(entity.shape.start.x, entity.shape.end.x),
      Math.max(entity.shape.start.y, entity.shape.end.y),
    );
  }
  return (entity.shape as Polygon2D).boundingBox();
}

function union(a: BoundingBox2D, b: BoundingBox2D): BoundingBox2D {
  return new BoundingBox2D(
    Math.min(a.minX, b.minX),
    Math.min(a.minY, b.minY),
    Math.max(a.maxX, b.maxX),
    Math.max(a.maxY, b.maxY),
  );
}

export class Scene {
  readonly entities: ReadonlyArray<Entity>;
  readonly selectedIds: ReadonlyArray<string>;

  constructor(entities: ReadonlyArray<Entity> = [], selectedIds: ReadonlyArray<string> = []) {
    const ids = new Set(entities.map(entity => entity.id));
    if (ids.size !== entities.length) throw new RangeError('Entity ids must be unique');
    if (selectedIds.some(id => !ids.has(id))) throw new RangeError('Selection references an unknown entity');
    this.entities = Object.freeze([...entities]);
    this.selectedIds = Object.freeze([...selectedIds]);
    Object.freeze(this);
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.find(entity => entity.id === id);
  }

  isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  addEntity(entity: Entity): Scene {
    if (this.getEntity(entity.id)) throw new RangeError(`Entity id already exists: ${entity.id}`);
    return new Scene([...this.entities, entity], this.selectedIds);
  }

  removeEntity(id: string): Scene {
    if (!this.getEntity(id)) throw new RangeError(`Unknown entity: ${id}`);
    return new Scene(
      this.entities.filter(entity => entity.id !== id),
      this.selectedIds.filter(selectedId => selectedId !== id),
    );
  }

  select(ids: ReadonlyArray<string>): Scene {
    return new Scene(this.entities, ids);
  }

  clearSelection(): Scene {
    return this.select([]);
  }

  boundingBox(): BoundingBox2D | undefined {
    const [first, ...rest] = this.entities;
    if (!first) return undefined;
    return rest.reduce((bounds, entity) => union(bounds, entityBounds(entity)), entityBounds(first));
  }
}
