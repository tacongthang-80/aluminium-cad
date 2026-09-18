import { EPSILON, finite } from './Constants';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { BoundingBox2D } from './BoundingBox2D';
/** A simple, nondegenerate polygon without holes; either winding is accepted. */
export class Polygon2D {
  readonly vertices:ReadonlyArray<Vector2D>;
  constructor(vertices:ReadonlyArray<Vector2D>) {
    if(vertices.length<3) throw new RangeError('Polygon requires at least three vertices');
    this.vertices=Object.freeze([...vertices]);
    const edges=this.edges();
    if(edges.some(e=>e.length()<EPSILON)) throw new RangeError('Repeated or too-close adjacent vertices');
    if(Math.abs(this.signedArea())<=EPSILON*EPSILON) throw new RangeError('Degenerate polygon');
    for(let i=0;i<edges.length;i++) for(let j=i+1;j<edges.length;j++) {
      const hit=edges[i].intersectWith(edges[j]);
      const adjacent=j===i+1||(i===0&&j===edges.length-1);
      if(hit.type==='COLINEAR_OVERLAP'||(!adjacent&&hit.type==='POINT')) throw new RangeError('Polygon must be simple');
    }
    Object.freeze(this);
  }
  private edges():Segment2D[] { return this.vertices.map((p,i)=>new Segment2D(p,this.vertices[(i+1)%this.vertices.length])); }
  signedArea():number {
    const o=this.vertices[0]; let sum=0;
    for(let i=1;i<this.vertices.length-1;i++) sum+=this.vertices[i].sub(o).cross2D(this.vertices[i+1].sub(o));
    return sum/2;
  }
  area():number { return Math.abs(this.signedArea()); }
  centroid():Vector2D {
    const o=this.vertices[0]; let x=0,y=0;
    for(let i=1;i<this.vertices.length-1;i++) {
      const a=this.vertices[i].sub(o),b=this.vertices[i+1].sub(o),cross=a.cross2D(b);
      x+=(a.x+b.x)*cross; y+=(a.y+b.y)*cross;
    }
    return o.add(new Vector2D(x/(6*this.signedArea()),y/(6*this.signedArea())));
  }
  containsPoint(p:Vector2D):boolean {
    const edges=this.edges(); if(edges.some(e=>e.distanceToPoint(p)<=EPSILON)) return true;
    let inside=false;
    for(const {start:a,end:b} of edges) if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) inside=!inside;
    return inside;
  }
  boundingBox():BoundingBox2D {
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const p of this.vertices) {minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);}
    return new BoundingBox2D(minX,minY,maxX,maxY);
  }
  /** Miter offset. Positive expands regardless of winding. Topology changes throw. */
  offset(distance:number):Polygon2D {
    finite(distance); if(distance===0) return new Polygon2D(this.vertices);
    const sign=Math.sign(this.signedArea()),edges=this.edges();
    const moved=edges.map(e=>{const delta=e.normal().scale(-sign*distance);return new Segment2D(e.start.add(delta),e.end.add(delta));});
    const points=moved.map((curr,i)=>{
      const prev=moved[(i+moved.length-1)%moved.length],u=prev.direction(),v=curr.direction(),cross=u.cross2D(v);
      if(Math.abs(cross)<=Number.EPSILON*16) {
        if(u.dot(v)<0) throw new RangeError('Offset has a reversing edge');
        return curr.start;
      }
      return prev.start.add(u.scale(curr.start.sub(prev.start).cross2D(v)/cross));
    });
    for(let i=0;i<points.length;i++) if(points[(i+1)%points.length].sub(points[i]).dot(edges[i].direction())<=EPSILON) throw new RangeError('Offset collapses or changes polygon topology');
    const result=new Polygon2D(points);
    if(Math.sign(result.signedArea())!==sign) throw new RangeError('Offset changes winding');
    // Prevent inward offsets reappearing after passing across the original polygon.
    if(distance<0&&points.some(p=>!this.containsPoint(p)||edges.some(e=>e.distanceToPoint(p)<-distance-EPSILON))) throw new RangeError('Offset exceeds polygon clearance');
    return result;
  }
}
