import { Vector2D } from '../core/geom';

const ZOOM_STEP = 1.1;

export function zoomFactorForWheelDelta(deltaY: number): number {
  if (deltaY === 0) return 1;
  return deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
}

export function pointerToScreen(
  clientX: number,
  clientY: number,
  canvasRect: { left: number; top: number },
  devicePixelRatio: number,
): Vector2D {
  return new Vector2D(
    (clientX - canvasRect.left) * devicePixelRatio,
    (clientY - canvasRect.top) * devicePixelRatio,
  );
}
