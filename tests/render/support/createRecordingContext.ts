import type { CanvasLike } from '../../../src/render';

export interface RecordedCall {
  readonly method: string;
  readonly args: ReadonlyArray<unknown>;
  readonly strokeStyle?: CanvasLike['strokeStyle'];
  readonly lineWidth?: number;
}

export interface RecordingContext extends CanvasLike {
  readonly calls: RecordedCall[];
}

export function createRecordingContext(): RecordingContext {
  const calls: RecordedCall[] = [];
  return {
    calls,
    strokeStyle: '#000000',
    lineWidth: 1,
    clearRect(...args) { calls.push({ method: 'clearRect', args }); },
    beginPath() { calls.push({ method: 'beginPath', args: [] }); },
    moveTo(...args) { calls.push({ method: 'moveTo', args }); },
    lineTo(...args) { calls.push({ method: 'lineTo', args }); },
    closePath() { calls.push({ method: 'closePath', args: [] }); },
    stroke() {
      calls.push({ method: 'stroke', args: [], strokeStyle: this.strokeStyle, lineWidth: this.lineWidth });
    },
  };
}
