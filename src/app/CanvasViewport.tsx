import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { BoundingBox2D, EPSILON, Polygon2D, Segment2D, Vector2D } from '../core/geom';
import type { Entity, Scene } from '../core/scene';
import { Viewport } from '../core/viewport';
import { pointerToScreen, zoomFactorForWheelDelta } from '../render/interaction';
import { DEFAULT_RENDER_STYLE, renderScene, type RenderStyle } from '../render';
import { snapPoint } from '../render/snapping';
import type { Tool } from './tool';

interface CanvasViewportProps {
  readonly scene: Scene;
  readonly tool: Tool;
  readonly onCommitEntity: (entity: Entity) => void;
  readonly style?: RenderStyle;
}

const EMPTY_SCENE_BOUNDS = new BoundingBox2D(-500, -500, 500, 500);
const SNAP_TOLERANCE_PX = 10;
const DRAFT_ID = '__draft__';

function rectangleFromCorners(start: Vector2D, end: Vector2D): Polygon2D | null {
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxX = Math.max(start.x, end.x);
  const maxY = Math.max(start.y, end.y);
  if (maxX - minX <= EPSILON || maxY - minY <= EPSILON) return null;
  return new Polygon2D([
    new Vector2D(minX, minY),
    new Vector2D(maxX, minY),
    new Vector2D(maxX, maxY),
    new Vector2D(minX, maxY),
  ]);
}

export function CanvasViewport({
  scene,
  tool,
  onCommitEntity,
  style = DEFAULT_RENDER_STYLE,
}: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ pointerId: number; point: Vector2D } | null>(null);
  const drawRef = useRef<{ pointerId: number; anchor: Vector2D } | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [draft, setDraft] = useState<Entity | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(([entry]) => {
      const cssWidth = entry.contentRect.width;
      const cssHeight = entry.contentRect.height;
      if (cssWidth <= 0 || cssHeight <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(cssWidth * dpr);
      const height = Math.round(cssHeight * dpr);
      if (width <= 0 || height <= 0) return;

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      setViewport(current => current
        ? current.resize(width, height)
        : Viewport.fitToBounds(scene.boundingBox() ?? EMPTY_SCENE_BOUNDS, width, height));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [scene]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !viewport) return;
    const renderedScene = draft ? scene.addEntity(draft).select([draft.id]) : scene;
    renderScene(context, renderedScene, viewport, style);
  }, [draft, scene, style, viewport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const pointerId = drawRef.current?.pointerId ?? dragRef.current?.pointerId;
    if (pointerId !== undefined && canvas?.hasPointerCapture(pointerId)) {
      canvas.releasePointerCapture(pointerId);
    }
    dragRef.current = null;
    drawRef.current = null;
    setDraft(null);
  }, [tool]);

  useEffect(() => {
    const cancelDraft = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || (!drawRef.current && !draft)) return;
      const pointerId = drawRef.current?.pointerId;
      const canvas = canvasRef.current;
      if (pointerId !== undefined && canvas?.hasPointerCapture(pointerId)) {
        canvas.releasePointerCapture(pointerId);
      }
      drawRef.current = null;
      setDraft(null);
    };
    window.addEventListener('keydown', cancelDraft);
    return () => window.removeEventListener('keydown', cancelDraft);
  }, [draft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const point = pointerToScreen(
        event.clientX,
        event.clientY,
        canvas.getBoundingClientRect(),
        window.devicePixelRatio || 1,
      );
      const factor = zoomFactorForWheelDelta(event.deltaY);
      setViewport(current => current ? current.zoomAt(point, factor) : current);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const screenPoint = (event: ReactPointerEvent<HTMLCanvasElement>) =>
    pointerToScreen(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
      window.devicePixelRatio || 1,
    );

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!viewport) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = screenPoint(event);
    if (tool === 'pan') {
      dragRef.current = { pointerId: event.pointerId, point };
      return;
    }
    const worldPoint = viewport.screenToWorld(point);
    const anchor = snapPoint(worldPoint, scene, SNAP_TOLERANCE_PX / viewport.scale).point;
    drawRef.current = { pointerId: event.pointerId, anchor };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!viewport) return;
    if (tool === 'pan') {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const point = screenPoint(event);
      const delta = point.sub(drag.point);
      dragRef.current = { pointerId: event.pointerId, point };
      setViewport(current => current ? current.pan(delta) : current);
      return;
    }

    const draw = drawRef.current;
    if (!draw || draw.pointerId !== event.pointerId) return;
    const worldPoint = viewport.screenToWorld(screenPoint(event));
    const end = snapPoint(worldPoint, scene, SNAP_TOLERANCE_PX / viewport.scale).point;
    const shape = tool === 'segment'
      ? new Segment2D(draw.anchor, end)
      : rectangleFromCorners(draw.anchor, end);
    if (shape) setDraft({ id: DRAFT_ID, shape });
  };

  const releasePointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (tool === 'pan') {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      releasePointer(event);
      dragRef.current = null;
      return;
    }

    const draw = drawRef.current;
    if (!viewport || !draw || draw.pointerId !== event.pointerId) return;
    releasePointer(event);
    const worldPoint = viewport.screenToWorld(screenPoint(event));
    const end = snapPoint(worldPoint, scene, SNAP_TOLERANCE_PX / viewport.scale).point;
    const shape = tool === 'segment'
      ? (draw.anchor.distanceTo(end) > EPSILON ? new Segment2D(draw.anchor, end) : null)
      : rectangleFromCorners(draw.anchor, end);
    if (shape) onCommitEntity({ id: crypto.randomUUID(), shape });
    drawRef.current = null;
    setDraft(null);
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    releasePointer(event);
    dragRef.current = null;
    drawRef.current = null;
    setDraft(null);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 0 }}>
      <canvas
        ref={canvasRef}
        aria-label="Vùng vẽ CAD"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ display: 'block', touchAction: 'none', cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
      />
    </div>
  );
}
