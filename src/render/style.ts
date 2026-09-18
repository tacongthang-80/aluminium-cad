export interface RenderStyle {
  backgroundClear: boolean;
  gridColor: string;
  gridStepMm: number;
  gridLineWidthPx: number;
  entityColor: string;
  entityLineWidthPx: number;
  selectedColor: string;
  selectedLineWidthPx: number;
  maxGridLinesPerAxis: number;
}

export const DEFAULT_RENDER_STYLE: RenderStyle = Object.freeze({
  backgroundClear: true,
  gridColor: '#e5e7eb',
  gridStepMm: 100,
  gridLineWidthPx: 1,
  entityColor: '#1f2937',
  entityLineWidthPx: 1.5,
  selectedColor: '#2563eb',
  selectedLineWidthPx: 2.5,
  maxGridLinesPerAxis: 500,
});
