import { useState } from 'react';
import { Polygon2D, Vector2D } from '../core/geom';
import { Scene, SceneHistory } from '../core/scene';
import { CanvasViewport } from './CanvasViewport';
import { Toolbar } from './Toolbar';
import type { Tool } from './tool';

const initialScene = new Scene([
  {
    id: 'demo-frame',
    shape: new Polygon2D([
      new Vector2D(0, 0),
      new Vector2D(1200, 0),
      new Vector2D(1200, 2200),
      new Vector2D(0, 2200),
    ]),
  },
]);

export function App() {
  const [history, setHistory] = useState(() => new SceneHistory(initialScene));
  const [tool, setTool] = useState<Tool>('pan');
  const [orthoEnabled, setOrthoEnabled] = useState(false);

  return (
    <main style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <header style={{
        minHeight: 52,
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: '8px 12px',
        borderBottom: '1px solid #cbd5e1',
        background: '#ffffff',
        color: '#172033',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}>
        <strong style={{ fontSize: 16, lineHeight: '24px', letterSpacing: 0 }}>Aluminium CAD</strong>
        <Toolbar
          activeTool={tool}
          onToolChange={setTool}
          orthoEnabled={orthoEnabled}
          onOrthoToggle={() => setOrthoEnabled(enabled => !enabled)}
        />
      </header>
      <section style={{ flex: 1, minHeight: 0 }} aria-label="Bản vẽ">
        <CanvasViewport
          scene={history.current}
          tool={tool}
          orthoEnabled={orthoEnabled}
          onCommitEntity={entity => setHistory(current =>
            current.execute(current.current.addEntity(entity)))}
          onReplaceEntity={(id, shape) => setHistory(current =>
            current.execute(current.current.removeEntity(id).addEntity({ id, shape })))}
        />
      </section>
    </main>
  );
}
