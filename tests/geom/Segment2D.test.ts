import {describe,it,expect} from 'vitest';
import {Vector2D as V,Segment2D as S} from '../../src/core/geom';
const s=(x:number,y:number,a:number,b:number)=>new S(new V(x,y),new V(a,b));
describe('Segment2D',()=>{
 it('geometry and projection',()=>{const a=s(0,0,10,0);expect(a.length()).toBe(10);expect(a.direction()).toEqual(V.UNIT_X);expect(a.normal().equals(V.UNIT_Y)).toBe(true);expect(a.midpoint()).toEqual(new V(5,0));expect(a.pointAt(2)).toEqual(new V(20,0));expect(a.projectPoint(new V(5,3))).toEqual({point:new V(5,0),t:0.5,isInside:true});expect(a.projectPoint(new V(-2,3)).isInside).toBe(false);expect(a.projectPoint(new V(12,3)).isInside).toBe(false);expect(a.distanceToPoint(new V(5,3))).toBe(3);expect(a.distanceToPoint(new V(-4,3))).toBe(5);expect(a.distanceToPoint(new V(14,3))).toBe(5);});
 it.each([
 [s(0,0,10,10),s(0,10,10,0),'POINT'],[s(0,0,10,0),s(5,0,5,10),'POINT'],
 [s(0,0,10,0),s(0,1,10,1),'PARALLEL'],[s(0,0,10,0),s(5,0,15,0),'COLINEAR_OVERLAP'],
 [s(0,0,10,0),s(15,0,5,0),'COLINEAR_OVERLAP'],[s(0,0,10,0),s(10,0,20,0),'POINT'],
 [s(0,0,10,0),s(11,0,20,0),'NONE'],[s(0,0,10,0),s(20,-1,20,1),'NONE'],
 [s(0,0,10,0),s(-2,-1,-2,1),'NONE'],[s(0,0,10,0),s(5,2,5,3),'NONE'],
 [s(0,0,10,0),s(5,-3,5,-2),'NONE'],[s(0,0,0,0),s(-1,0,1,0),'POINT'],
 [s(0,1,0,1),s(-1,0,1,0),'NONE'],[s(-1,0,1,0),s(0,0,0,0),'POINT'],
 [s(-1,0,1,0),s(0,1,0,1),'NONE'],[s(0,0,0,0),s(0,0,0,0),'POINT']
 ])('intersection %#',(a,b,type)=>{expect(a.intersectWith(b).type).toBe(type);expect(b.intersectWith(a).type).toBe(type);});
 it('X coordinate and zero segment',()=>{expect(s(0,0,10,10).intersectWith(s(0,10,10,0))).toEqual({type:'POINT',point:new V(5,5)});const a=s(2,3,2,3);expect(a.projectPoint(V.ZERO)).toEqual({point:new V(2,3),t:0,isInside:true});expect(a.direction()).toBe(V.ZERO);expect(a.distanceToPoint(new V(2,5))).toBe(2);});
});
