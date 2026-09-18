import { BoundingBox2D } from '../geom/BoundingBox2D';
import { finite } from '../geom/Constants';
import { Matrix3x3 } from '../geom/Matrix3x3';
import { Vector2D } from '../geom/Vector2D';

export class Viewport {
  static readonly MIN_SCALE = 1e-4;
  static readonly MAX_SCALE = 1e3;

  constructor(
    public readonly screenWidth: number,
    public readonly screenHeight: number,
    public readonly scale = 1,
    public readonly worldCenter: Vector2D = Vector2D.ZERO,
  ) {
    finite(screenWidth, screenHeight, scale);
    if (screenWidth <= 0 || screenHeight <= 0) {
      throw new RangeError('Screen dimensions must be positive');
    }
    if (scale < Viewport.MIN_SCALE || scale > Viewport.MAX_SCALE) {
      throw new RangeError('Viewport scale is outside the supported range');
    }
    Object.freeze(this);
  }

  worldToScreenMatrix(): Matrix3x3 {
    return Matrix3x3.translation(this.screenWidth / 2, this.screenHeight / 2)
      .multiply(Matrix3x3.scaling(this.scale, -this.scale))
      .multiply(Matrix3x3.translation(-this.worldCenter.x, -this.worldCenter.y));
  }

  screenToWorldMatrix(): Matrix3x3 {
    return this.worldToScreenMatrix().inverse();
  }

  worldToScreen(point: Vector2D): Vector2D {
    return this.worldToScreenMatrix().transformPoint(point);
  }

  screenToWorld(point: Vector2D): Vector2D {
    return this.screenToWorldMatrix().transformPoint(point);
  }

  pan(screenDelta: Vector2D): Viewport {
    const screenCenter = new Vector2D(this.screenWidth / 2, this.screenHeight / 2);
    const nextWorldCenter = this.screenToWorld(screenCenter.sub(screenDelta));
    return new Viewport(this.screenWidth, this.screenHeight, this.scale, nextWorldCenter);
  }

  zoomAt(screenPoint: Vector2D, factor: number): Viewport {
    finite(factor);
    if (factor <= 0) throw new RangeError('Zoom factor must be positive');
    const anchor = this.screenToWorld(screenPoint);
    const nextScale = Math.max(Viewport.MIN_SCALE, Math.min(Viewport.MAX_SCALE, this.scale * factor));
    const scaled = new Viewport(this.screenWidth, this.screenHeight, nextScale, this.worldCenter);
    return scaled.pan(screenPoint.sub(scaled.worldToScreen(anchor)));
  }

  resize(screenWidth: number, screenHeight: number): Viewport {
    return new Viewport(screenWidth, screenHeight, this.scale, this.worldCenter);
  }

  static fitToBounds(
    bounds: BoundingBox2D,
    screenWidth: number,
    screenHeight: number,
    marginPx = 40,
  ): Viewport {
    finite(screenWidth, screenHeight, marginPx);
    const availableWidth = screenWidth - marginPx * 2;
    const availableHeight = screenHeight - marginPx * 2;
    if (screenWidth <= 0 || screenHeight <= 0 || marginPx < 0 || availableWidth <= 0 || availableHeight <= 0) {
      throw new RangeError('Screen dimensions and margin must leave a positive fitting area');
    }
    const fittedScale = bounds.width === 0 || bounds.height === 0
      ? 1
      : Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
    const scale = Math.max(Viewport.MIN_SCALE, Math.min(Viewport.MAX_SCALE, fittedScale));
    return new Viewport(screenWidth, screenHeight, scale, bounds.center());
  }
}
