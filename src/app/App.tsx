import { Polygon2D, Vector2D } from '../core/geom';
import { Scene } from '../core/scene';
import { CanvasViewport } from './CanvasViewport';

const demoScene = new Scene([
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
  return (
    <main style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <header style={{
        height: 52,
        flex: '0 0 52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid #cbd5e1',
        background: '#ffffff',
        color: '#172033',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}>
        <strong style={{ fontSize: 16, lineHeight: '24px', letterSpacing: 0 }}>Aluminium CAD</strong>
        <span style={{ fontSize: 13, lineHeight: '20px', color: '#475569', letterSpacing: 0 }}>
          1200 x 2200 mm
        </span>
      </header>
      <section style={{ flex: 1, minHeight: 0 }} aria-label="Bản vẽ">
        <CanvasViewport scene={demoScene} />
      </section>
    </main>
  );
}
