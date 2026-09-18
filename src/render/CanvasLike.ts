export interface CanvasLike {
  clearRect(x: number, y: number, width: number, height: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  stroke(): void;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
}
