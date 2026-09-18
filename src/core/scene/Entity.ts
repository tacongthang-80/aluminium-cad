import type { Polygon2D } from '../geom/Polygon2D';
import type { Polyline2D } from '../geom/Polyline2D';
import type { Segment2D } from '../geom/Segment2D';

export interface Entity {
  readonly id: string;
  readonly shape: Segment2D | Polygon2D | Polyline2D;
}
