import type { Polygon2D } from '../geom/Polygon2D';
import type { Segment2D } from '../geom/Segment2D';

export interface Entity {
  readonly id: string;
  readonly shape: Segment2D | Polygon2D;
}
