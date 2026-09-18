import { finite } from './Constants';
import { Vector2D } from './Vector2D';
/** Row-major affine matrices applied to column vectors. A.multiply(B) applies B first. */
export class Matrix3x3 {
  readonly elements: ReadonlyArray<number>;
  constructor(elements:number[]) {
    if(elements.length!==9) throw new RangeError('Expected nine matrix elements'); finite(...elements);
    if(elements[6]!==0||elements[7]!==0||elements[8]!==1) throw new RangeError('Expected affine matrix bottom row [0,0,1]');
    this.elements=Object.freeze([...elements]); Object.freeze(this);
  }
  static identity():Matrix3x3 { return new Matrix3x3([1,0,0,0,1,0,0,0,1]); }
  static translation(tx:number,ty:number):Matrix3x3 { return new Matrix3x3([1,0,tx,0,1,ty,0,0,1]); }
  static scaling(sx:number,sy:number):Matrix3x3 { return new Matrix3x3([sx,0,0,0,sy,0,0,0,1]); }
  static rotation(rad:number):Matrix3x3 { const c=Math.cos(rad),s=Math.sin(rad); return new Matrix3x3([c,-s,0,s,c,0,0,0,1]); }
  multiply(m:Matrix3x3):Matrix3x3 {
    const a=this.elements,b=m.elements,out=Array<number>(9).fill(0);
    for(let r=0;r<3;r++) for(let c=0;c<3;c++) for(let k=0;k<3;k++) out[r*3+c]+=a[r*3+k]*b[k*3+c];
    return new Matrix3x3(out);
  }
  transformPoint(p:Vector2D):Vector2D { const a=this.elements; return new Vector2D(a[0]*p.x+a[1]*p.y+a[2],a[3]*p.x+a[4]*p.y+a[5]); }
  inverse():Matrix3x3 {
    const [a,b,c,d,e,f]=this.elements,scale=Math.max(Math.abs(a),Math.abs(b),Math.abs(d),Math.abs(e));
    if(scale===0) throw new RangeError('Singular matrix');
    const aa=a/scale,bb=b/scale,dd=d/scale,ee=e/scale,det=aa*ee-bb*dd;
    if(Math.abs(det)<=Number.EPSILON*16) throw new RangeError('Singular or ill-conditioned matrix');
    const ia=ee/det/scale,ib=-bb/det/scale,id=-dd/det/scale,ie=aa/det/scale;
    return new Matrix3x3([ia,ib,-ia*c-ib*f,id,ie,-id*c-ie*f,0,0,1]);
  }
}
