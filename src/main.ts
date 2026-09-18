import { Polygon2D, Vector2D } from './core/geom';
const rectangle = new Polygon2D([new Vector2D(0,0), new Vector2D(1200,0), new Vector2D(1200,2200), new Vector2D(0,2200)]);
document.querySelector('#result')!.textContent = JSON.stringify({ areaMm2: rectangle.area(), centroidMm: rectangle.centroid() }, null, 2);
