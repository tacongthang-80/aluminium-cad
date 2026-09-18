import {expect,it} from 'vitest';
import {BoundingBox2D as B,EPSILON,Polyline2D as P,Vector2D as V} from '../../src/core/geom';

it('requires at least two vertices',()=>{expect(()=>new P([])).toThrow();expect(()=>new P([V.ZERO])).toThrow();});

it('rejects adjacent vertices that are repeated or too close',()=>{
  expect(()=>new P([V.ZERO,V.ZERO])).toThrow('Repeated or too-close adjacent vertices');
  expect(()=>new P([V.ZERO,new V(EPSILON/2,0),V.UNIT_X])).toThrow('Repeated or too-close adjacent vertices');
  expect(()=>new P([V.ZERO,new V(EPSILON,0)])).not.toThrow();
  expect(()=>new P([V.ZERO,V.UNIT_X])).not.toThrow();
});

it('computes the exact bounding box of a zigzag',()=>{
  const polyline=new P([new V(3,-4),new V(-7,8),new V(12,2),new V(0,-9)]);
  expect(polyline.boundingBox()).toEqual(new B(-7,-9,12,8));
});

it('sums the lengths of consecutive segments without closing the chain',()=>{
  const polyline=new P([new V(0,0),new V(3,0),new V(3,4),new V(8,4)]);
  expect(polyline.length()).toBe(12);
});

it('allows a self-intersecting open chain',()=>{
  expect(()=>new P([new V(0,0),new V(10,10),new V(0,10),new V(10,0)])).not.toThrow();
});

it('copies and freezes its vertices',()=>{
  const input=[V.ZERO,V.UNIT_X,new V(2,1)],polyline=new P(input);
  input.pop();
  expect(polyline.vertices).toHaveLength(3);
  expect(Object.isFrozen(polyline.vertices)).toBe(true);
  expect(Object.isFrozen(polyline)).toBe(true);
});
