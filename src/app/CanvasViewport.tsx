import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { BoundingBox2D, Vector2D } from '../core/geom';
import type { Scene } from '../core/scene';
import { Viewport } from '../core/viewport';
import { pointerToScreen, zoomFactorForWheelDelta } from '../render/interaction';
import { DEFAULT_RENDER_STYLE, renderScene, type RenderStyle } from '../render';

interface CanvasViewportProps {
  readonly scene: Scene;
  readonly style?: RenderStyle;
}

const EMPTY_SCENE_BOUNDS = new BoundingBox2D(-500, -500, 500, 500);

export function CanvasViewport({
  scene,
  style = DEFAULT_RENDER_STYLE,
}: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ pointerId: number; point: Vector2D } | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);

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
    if (context && viewport) renderScene(context, scene, viewport, style);
  }, [scene, style, viewport]);

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
    dragRef.current = { pointerId: event.pointerId, point: screenPoint(event) };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!viewport || !drag || drag.pointerId !== event.pointerId) return;
    const point = screenPoint(event);
    const delta = point.sub(drag.point);
    dragRef.current = { pointerId: event.pointerId, point };
    setViewport(current => current ? current.pan(delta) : current);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 0 }}>
      <canvas
        ref={canvasRef}
        aria-label="Vùng vẽ CAD"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        style={{ display: 'block', touchAction: 'none', cursor: 'grab' }}
      />
    </div>
  );
}
