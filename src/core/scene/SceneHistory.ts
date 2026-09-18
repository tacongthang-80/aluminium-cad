import { Scene } from './Scene';

export class SceneHistory {
  private readonly undoStack: ReadonlyArray<Scene>;
  private readonly redoStack: ReadonlyArray<Scene>;

  constructor(
    public readonly current: Scene = new Scene(),
    undoStack: ReadonlyArray<Scene> = [],
    redoStack: ReadonlyArray<Scene> = [],
  ) {
    this.undoStack = Object.freeze([...undoStack]);
    this.redoStack = Object.freeze([...redoStack]);
    Object.freeze(this);
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  execute(next: Scene): SceneHistory {
    return new SceneHistory(next, [...this.undoStack, this.current]);
  }

  undo(): SceneHistory {
    if (!this.canUndo) return this;
    return new SceneHistory(
      this.undoStack[this.undoStack.length - 1],
      this.undoStack.slice(0, -1),
      [...this.redoStack, this.current],
    );
  }

  redo(): SceneHistory {
    if (!this.canRedo) return this;
    return new SceneHistory(
      this.redoStack[this.redoStack.length - 1],
      [...this.undoStack, this.current],
      this.redoStack.slice(0, -1),
    );
  }
}
