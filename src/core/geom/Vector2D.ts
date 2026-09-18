import { EPSILON, finite, approxEqual } from './Constants';
export class Vector2D {
  static readonly ZERO = new Vector2D(0,0);
  static readonly UNIT_X = new Vector2D(1,0);
  static readonly UNIT_Y = new Vector2D(0,1);
  constructor(public readonly x: number, public readonly y: number) { finite(x,y); Object.freeze(this); }
  add(v: Vector2D): Vector2D { return new Vector2D(this.x+v.x,this.y+v.y); }
  sub(v: Vector2D): Vector2D { return new Vector2D(this.x-v.x,this.y-v.y); }
  scale(factor: number): Vector2D { finite(factor); return new Vector2D(this.x*factor,this.y*factor); }
  length(): number { return Math.hypot(this.x,this.y); }
  lengthSq(): number { return this.dot(this); }
  normalize(): Vector2D { const n=this.length(); return n<EPSILON ? Vector2D.ZERO : this.scale(1/n); }
  dot(v: Vector2D): number { return this.x*v.x+this.y*v.y; }
  cross2D(v: Vector2D): number { return this.x*v.y-this.y*v.x; }
  normal(): Vector2D { return new Vector2D(-this.y,this.x).normalize(); }
  angle(): number { return Math.atan2(this.y,this.x); }
  /** Unsigned angle in [0, PI]. Zero-length directions are undefined. */
  angleTo(v: Vector2D): number {
    if(this.length()<EPSILON || v.length()<EPSILON) throw new RangeError('Angle requires nonzero vectors');
    return Math.atan2(Math.abs(this.normalize().cross2D(v.normalize())),this.normalize().dot(v.normalize()));
  }
  distanceTo(v: Vector2D): number { return this.sub(v).length(); }
  rotate(angleRad: number): Vector2D { finite(angleRad); const c=Math.cos(angleRad),s=Math.sin(angleRad); return new Vector2D(c*this.x-s*this.y,s*this.x+c*this.y); }
  equals(v: Vector2D, eps=EPSILON): boolean { return approxEqual(this.x,v.x,eps)&&approxEqual(this.y,v.y,eps); }
}
