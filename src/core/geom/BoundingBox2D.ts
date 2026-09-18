import { EPSILON, finite } from './Constants';
import { Vector2D } from './Vector2D';
export class BoundingBox2D {
  constructor(public readonly minX:number,public readonly minY:number,public readonly maxX:number,public readonly maxY:number) {
    finite(minX,minY,maxX,maxY); if(minX>maxX||minY>maxY) throw new RangeError('Invalid bounding box'); Object.freeze(this);
  }
  get width():number { return this.maxX-this.minX; }
  get height():number { return this.maxY-this.minY; }
  center():Vector2D { return new Vector2D(this.minX+this.width/2,this.minY+this.height/2); }
  containsPoint(p:Vector2D):boolean { return p.x>=this.minX-EPSILON&&p.x<=this.maxX+EPSILON&&p.y>=this.minY-EPSILON&&p.y<=this.maxY+EPSILON; }
  intersects(b:BoundingBox2D):boolean { return this.maxX+EPSILON>=b.minX&&b.maxX+EPSILON>=this.minX&&this.maxY+EPSILON>=b.minY&&b.maxY+EPSILON>=this.minY; }
  expandBy(margin:number):BoundingBox2D { finite(margin); return new BoundingBox2D(this.minX-margin,this.minY-margin,this.maxX+margin,this.maxY+margin); }
}
