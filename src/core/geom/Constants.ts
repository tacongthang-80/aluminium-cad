/** Linear CAD tolerance in millimetres. */
export const EPSILON = 1e-4;
export const approxEqual = (a: number, b: number, eps = EPSILON): boolean => Math.abs(a-b) <= eps;
export const degToRad = (deg: number): number => deg * Math.PI / 180;
export const radToDeg = (rad: number): number => rad * 180 / Math.PI;
export function finite(...values: number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Coordinates and parameters must be finite');
}
