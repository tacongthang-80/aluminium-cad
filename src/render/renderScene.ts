import { Polygon2D } from '../core/geom/Polygon2D';
import { Segment2D } from '../core/geom/Segment2D';
import { Vector2D } from '../core/geom/Vector2D';
import type { Entity, Scene } from '../core/scene';
import type { Viewport } from '../core/viewport';
import type { CanvasLike } from './CanvasLike';
import { DEFAULT_RENDER_STYLE, type RenderStyle } from './style';

function drawEntity(ctx: CanvasLike, entity: Entity, viewport: Viewport): void {
  ctx.beginPath();
  if (entity.shape instanceof Segment2D) {
    const start = viewport.worldToScreen(entity.shape.start);
    const end = viewport.worldToScreen(entity.shape.end);
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
  } else {
    const first = viewport.worldToScreen(entity.shape.vertices[0]);
    ctx.moveTo(first.x, first.y);
    for (const vertex of entity.shape.vertices.slice(1)) {
      const point = viewport.worldToScreen(vertex);
      ctx.lineTo(point.x, point.y);
    }
    if (entity.shape instanceof Polygon2D) ctx.closePath();
  }
  ctx.stroke();
}

export function renderScene(
  ctx: CanvasLike,
  scene: Scene,
  viewport: Viewport,
  style: RenderStyle = DEFAULT_RENDER_STYLE,
): void {
  if (style.backgroundClear) ctx.clearRect(0, 0, viewport.screenWidth, viewport.screenHeight);

  const firstCorner = viewport.screenToWorld(Vector2D.ZERO);
  const secondCorner = viewport.screenToWorld(new Vector2D(viewport.screenWidth, viewport.screenHeight));
  const minX = Math.min(firstCorner.x, secondCorner.x);
  const maxX = Math.max(firstCorner.x, secondCorner.x);
  const minY = Math.min(firstCorner.y, secondCorner.y);
  const maxY = Math.max(firstCorner.y, secondCorner.y);
  const firstX = Math.ceil(minX / style.gridStepMm);
  const lastX = Math.floor(maxX / style.gridStepMm);
  const firstY = Math.ceil(minY / style.gridStepMm);
  const lastY = Math.floor(maxY / style.gridStepMm);
  const xCount = Math.max(0, lastX - firstX + 1);
  const yCount = Math.max(0, lastY - firstY + 1);

  if (xCount <= style.maxGridLinesPerAxis && yCount <= style.maxGridLinesPerAxis) {
    ctx.strokeStyle = style.gridColor;
    ctx.lineWidth = style.gridLineWidthPx;
    for (let index = firstX; index <= lastX; index++) {
      const start = viewport.worldToScreen(new Vector2D(index * style.gridStepMm, minY));
      const end = viewport.worldToScreen(new Vector2D(index * style.gridStepMm, maxY));
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    for (let index = firstY; index <= lastY; index++) {
      const start = viewport.worldToScreen(new Vector2D(minX, index * style.gridStepMm));
      const end = viewport.worldToScreen(new Vector2D(maxX, index * style.gridStepMm));
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }

  const unselected = scene.entities.filter(entity => !scene.isSelected(entity.id));
  const selected = scene.entities.filter(entity => scene.isSelected(entity.id));
  for (const entity of [...unselected, ...selected]) {
    const isSelected = scene.isSelected(entity.id);
    ctx.strokeStyle = isSelected ? style.selectedColor : style.entityColor;
    ctx.lineWidth = isSelected ? style.selectedLineWidthPx : style.entityLineWidthPx;
    drawEntity(ctx, entity, viewport);
  }
}
