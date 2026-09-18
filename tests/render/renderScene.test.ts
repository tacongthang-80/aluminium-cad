import { describe, expect, it } from 'vitest';
import { Scene } from '../../src/core/scene';
import { Polygon2D, Segment2D, Vector2D } from '../../src/core/geom';
import { Viewport } from '../../src/core/viewport';
import { DEFAULT_RENDER_STYLE, renderScene } from '../../src/render';
import { createRecordingContext } from './support/createRecordingContext';

describe('renderScene surface clearing', () => {
  it('clears first by default and omits clearing when disabled', () => {
    const viewport = new Viewport(800, 600);
    const cleared = createRecordingContext();
    renderScene(cleared, new Scene(), viewport);
    expect(cleared.calls[0]).toEqual({ method: 'clearRect', args: [0, 0, 800, 600] });

    const preserved = createRecordingContext();
    renderScene(preserved, new Scene(), viewport, { ...DEFAULT_RENDER_STYLE, backgroundClear: false });
    expect(preserved.calls.some(call => call.method === 'clearRect')).toBe(false);
  });
});

describe('renderScene grid', () => {
  it('draws every visible world-space grid line at transformed screen coordinates', () => {
    const viewport = new Viewport(200, 100);
    const context = createRecordingContext();
    const style = { ...DEFAULT_RENDER_STYLE, gridStepMm: 50 };
    renderScene(context, new Scene(), viewport, style);

    const pathCalls = context.calls.filter(call => call.method === 'moveTo' || call.method === 'lineTo');
    const expected: Array<{ method: string; args: number[] }> = [];
    for (const x of [-100, -50, 0, 50, 100]) {
      const start = viewport.worldToScreen(new Vector2D(x, -50));
      const end = viewport.worldToScreen(new Vector2D(x, 50));
      expected.push({ method: 'moveTo', args: [start.x, start.y] });
      expected.push({ method: 'lineTo', args: [end.x, end.y] });
    }
    for (const y of [-50, 0, 50]) {
      const start = viewport.worldToScreen(new Vector2D(-100, y));
      const end = viewport.worldToScreen(new Vector2D(100, y));
      expected.push({ method: 'moveTo', args: [start.x, start.y] });
      expected.push({ method: 'lineTo', args: [end.x, end.y] });
    }
    expect(pathCalls).toEqual(expected);

    const strokes = context.calls.filter(call => call.method === 'stroke');
    expect(strokes).toHaveLength(8);
    for (const stroke of strokes) {
      expect(stroke.strokeStyle).toBe(style.gridColor);
      expect(stroke.lineWidth).toBe(style.gridLineWidthPx);
    }
  });

  it('skips the entire grid when either axis exceeds the safety cap', () => {
    const viewport = new Viewport(200, 100, Viewport.MIN_SCALE);
    const context = createRecordingContext();
    renderScene(context, new Scene(), viewport);
    expect(context.calls.filter(call => call.method === 'stroke')).toEqual([]);
    expect(context.calls.filter(call => call.method === 'moveTo' || call.method === 'lineTo')).toEqual([]);
  });
});

describe('renderScene entities', () => {
  const entityStyle = { ...DEFAULT_RENDER_STYLE, maxGridLinesPerAxis: 0 };

  it('draws a segment as an open transformed path with entity styling', () => {
    const viewport = new Viewport(300, 200, 2, new Vector2D(10, -5));
    const start = new Vector2D(-20, 30);
    const end = new Vector2D(40, -10);
    const context = createRecordingContext();
    renderScene(context, new Scene([{ id: 'line', shape: new Segment2D(start, end) }]), viewport, entityStyle);
    const screenStart = viewport.worldToScreen(start);
    const screenEnd = viewport.worldToScreen(end);

    expect(context.calls.slice(1)).toEqual([
      { method: 'beginPath', args: [] },
      { method: 'moveTo', args: [screenStart.x, screenStart.y] },
      { method: 'lineTo', args: [screenEnd.x, screenEnd.y] },
      {
        method: 'stroke', args: [], strokeStyle: entityStyle.entityColor,
        lineWidth: entityStyle.entityLineWidthPx,
      },
    ]);
  });

  it('draws every polygon vertex and closes the transformed path', () => {
    const viewport = new Viewport(400, 300, 1.5, new Vector2D(-10, 20));
    const vertices = [
      new Vector2D(-30, -20),
      new Vector2D(40, -20),
      new Vector2D(25, 45),
      new Vector2D(-15, 35),
    ];
    const context = createRecordingContext();
    renderScene(context, new Scene([{ id: 'panel', shape: new Polygon2D(vertices) }]), viewport, entityStyle);
    const screen = vertices.map(vertex => viewport.worldToScreen(vertex));

    expect(context.calls.slice(1)).toEqual([
      { method: 'beginPath', args: [] },
      { method: 'moveTo', args: [screen[0].x, screen[0].y] },
      { method: 'lineTo', args: [screen[1].x, screen[1].y] },
      { method: 'lineTo', args: [screen[2].x, screen[2].y] },
      { method: 'lineTo', args: [screen[3].x, screen[3].y] },
      { method: 'closePath', args: [] },
      {
        method: 'stroke', args: [], strokeStyle: entityStyle.entityColor,
        lineWidth: entityStyle.entityLineWidthPx,
      },
    ]);
  });

  it('draws unselected entities first and selected entities last with distinct styling', () => {
    const selected = { id: 'selected', shape: new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)) };
    const unselected = {
      id: 'plain',
      shape: new Polygon2D([
        new Vector2D(0, 0), new Vector2D(10, 0), new Vector2D(10, 10), new Vector2D(0, 10),
      ]),
    };
    const context = createRecordingContext();
    expect(() => renderScene(
      context,
      new Scene([selected, unselected], ['selected']),
      new Viewport(200, 200),
      entityStyle,
    )).not.toThrow();

    const strokes = context.calls
      .map((call, index) => ({ call, index }))
      .filter(entry => entry.call.method === 'stroke');
    expect(strokes).toHaveLength(2);
    expect(strokes[0].call.strokeStyle).toBe(entityStyle.entityColor);
    expect(strokes[0].call.lineWidth).toBe(entityStyle.entityLineWidthPx);
    expect(strokes[1].call.strokeStyle).toBe(entityStyle.selectedColor);
    expect(strokes[1].call.lineWidth).toBe(entityStyle.selectedLineWidthPx);
    expect(strokes[1].index).toBeGreaterThan(strokes[0].index);
  });
});
