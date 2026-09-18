import { EPSILON } from './Constants';
import { Vector2D } from './Vector2D';
import { BoundingBox2D } from './BoundingBox2D';
/** An open chain of two or more vertices; self-intersection is allowed. */
export class Polyline2D {
  readonly vertices:ReadonlyArray<Vector2D>;
  constructor(vertices:ReadonlyArray<Vector2D>) {
    if(vertices.length<2) throw new RangeError('Polyline requires at least two vertices');
    this.vertices=Object.freeze([...vertices]);
    for(let i=1;i<this.vertices.length;i++) if(this.vertices[i-1].distanceTo(this.vertices[i])<EPSILON) throw new RangeError('Repeated or too-close adjacent vertices');
    Object.freeze(this);
  }
  boundingBox():BoundingBox2D {
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const p of this.vertices) {minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);}
    return new BoundingBox2D(minX,minY,maxX,maxY);
  }
  length():number {
    let total=0;
    for(let i=1;i<this.vertices.length;i++) total+=this.vertices[i-1].distanceTo(this.vertices[i]);
    return total;
  }
}
