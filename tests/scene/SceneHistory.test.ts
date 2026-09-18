import { describe, expect, it } from 'vitest';
import { Segment2D, Vector2D } from '../../src/core/geom';
import { Scene, SceneHistory } from '../../src/core/scene';

const sceneWith = (id: string) => new Scene([{
  id,
  shape: new Segment2D(Vector2D.ZERO, new Vector2D(1, 1)),
}]);

describe('SceneHistory', () => {
  it('starts with an empty frozen scene and no available movement', () => {
    const history = new SceneHistory();
    expect(history.current).toEqual(new Scene());
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
    expect(Object.isFrozen(history)).toBe(true);
    expect(history.undo()).toBe(history);
    expect(history.redo()).toBe(history);
  });

  it('executes scenes and traverses the full history in both directions', () => {
    const initial = sceneWith('initial');
    const second = sceneWith('second');
    const third = sceneWith('third');
    const start = new SceneHistory(initial);
    const afterSecond = start.execute(second);
    const afterThird = afterSecond.execute(third);

    expect(afterThird.current).toBe(third);
    expect(afterThird.canUndo).toBe(true);
    expect(afterThird.canRedo).toBe(false);
    expect(start.current).toBe(initial);
    expect(start.canUndo).toBe(false);

    const undoOnce = afterThird.undo();
    const undoTwice = undoOnce.undo();
    expect(undoOnce.current).toBe(second);
    expect(undoTwice.current).toBe(initial);
    expect(undoTwice.canUndo).toBe(false);
    expect(undoTwice.canRedo).toBe(true);
    expect(undoTwice.undo()).toBe(undoTwice);

    const redoOnce = undoTwice.redo();
    const redoTwice = redoOnce.redo();
    expect(redoOnce.current).toBe(second);
    expect(redoTwice.current).toBe(third);
    expect(redoTwice.canUndo).toBe(true);
    expect(redoTwice.canRedo).toBe(false);
    expect(redoTwice.redo()).toBe(redoTwice);
  });

  it('clears redo when a new scene is executed after undo', () => {
    const first = sceneWith('first');
    const second = sceneWith('second');
    const replacement = sceneWith('replacement');
    const beforeBranch = new SceneHistory(first).execute(second).undo();
    expect(beforeBranch.canRedo).toBe(true);

    const branch = beforeBranch.execute(replacement);
    expect(branch.current).toBe(replacement);
    expect(branch.canRedo).toBe(false);
    expect(branch.undo().current).toBe(first);
  });

  it('returns new frozen histories without mutating source histories', () => {
    const initial = sceneWith('initial');
    const next = sceneWith('next');
    const original = new SceneHistory(initial);
    const executed = original.execute(next);
    const undone = executed.undo();
    const redone = undone.redo();

    expect(executed).not.toBe(original);
    expect(undone).not.toBe(executed);
    expect(redone).not.toBe(undone);
    expect(original.current).toBe(initial);
    expect(original.canUndo).toBe(false);
    expect(executed.current).toBe(next);
    expect(executed.canRedo).toBe(false);
    for (const history of [original, executed, undone, redone]) {
      expect(Object.isFrozen(history)).toBe(true);
    }
  });
});
