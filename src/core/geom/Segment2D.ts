import { EPSILON, finite } from './Constants';
import { Vector2D } from './Vector2D';
export type Intersection = { type: 'POINT'; point: Vector2D } | { type: 'COLINEAR_OVERLAP' | 'PARALLEL' | 'NONE'; point?: never };
export class Segment2D {
  constructor(public readonly start: Vector2D, public readonly end: Vector2D) { Object.freeze(this); }
  length(): number { return this.start.distanceTo(this.end); }
  direction(): Vector2D { return this.end.sub(this.start).normalize(); }
  normal(): Vector2D { return this.direction().normal(); }
  midpoint(): Vector2D { return this.pointAt(0.5); }
  pointAt(t: number): Vector2D { finite(t); return this.start.add(this.end.sub(this.start).scale(t)); }
  projectPoint(p: Vector2D): {point: Vector2D; t: number; isInside: boolean} {
    const d=this.end.sub(this.start);
    const t=this.length()<EPSILON ? 0 : p.sub(this.start).dot(d)/d.lengthSq();
    return {point:this.pointAt(t),t,isInside:t>=-EPSILON&&t<=1+EPSILON};
  }
  distanceToPoint(p: Vector2D): number { const {t}=this.projectPoint(p); return p.distanceTo(this.pointAt(Math.max(0,Math.min(1,t)))); }
  intersectWith(other: Segment2D): Intersection {
    const a=this.length(), b=other.length();
    if(a<EPSILON) return other.distanceToPoint(this.start)<=EPSILON ? {type:'POINT',point:this.start} : {type:'NONE'};
    if(b<EPSILON) return this.distanceToPoint(other.start)<=EPSILON ? {type:'POINT',point:other.start} : {type:'NONE'};
    const u=this.direction(),v=other.direction(),q=other.start.sub(this.start),cross=u.cross2D(v);
    // Angular parallelism uses machine precision, not a millimetre tolerance.
    if(Math.abs(cross)<=Number.EPSILON*16) {
      if(Math.abs(q.cross2D(u))>EPSILON) return {type:'PARALLEL'};
      const t0=q.dot(u),t1=other.end.sub(this.start).dot(u);
      const lo=Math.max(0,Math.min(t0,t1)),hi=Math.min(a,Math.max(t0,t1));
      if(hi<lo-EPSILON) return {type:'NONE'};
      if(hi-lo<=EPSILON) return {type:'POINT',point:this.start.add(u.scale(Math.max(0,Math.min(a,(lo+hi)/2))))};
      return {type:'COLINEAR_OVERLAP'};
    }
    const t=q.cross2D(v)/cross,s=q.cross2D(u)/cross;
    if(t < -EPSILON || t > a+EPSILON || s < -EPSILON || s > b+EPSILON) return {type:'NONE'};
    return {type:'POINT',point:this.start.add(u.scale(Math.max(0,Math.min(a,t))))};
  }
}
