import { Polygon2D, Vector2D } from '../core/geom';

export function App() {
  const rectangle = new Polygon2D([
    new Vector2D(0, 0),
    new Vector2D(1200, 0),
    new Vector2D(1200, 2200),
    new Vector2D(0, 2200),
  ]);
  const result = {
    areaMm2: rectangle.area(),
    centroidMm: rectangle.centroid(),
  };

  return <pre>{JSON.stringify(result, null, 2)}</pre>;
}
