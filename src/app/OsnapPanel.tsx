import type { SnapMode } from '../render/snapping';

interface OsnapPanelProps {
  readonly enabledModes: ReadonlySet<SnapMode>;
  readonly onToggle: (mode: SnapMode) => void;
}

const modes: ReadonlyArray<{ mode: SnapMode; label: string }> = [
  { mode: 'endpoint', label: 'Điểm cuối' },
  { mode: 'midpoint', label: 'Trung điểm' },
  { mode: 'nearest', label: 'Gần nhất' },
  { mode: 'intersection', label: 'Giao điểm' },
  { mode: 'perpendicular', label: 'Vuông góc' },
];

export function OsnapPanel({ enabledModes, onToggle }: OsnapPanelProps) {
  return (
    <fieldset style={{
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '6px 16px',
      margin: 0,
      padding: '7px 0 0',
      border: 0,
      borderTop: '1px solid #e2e8f0',
    }}>
      <legend style={{ padding: '0 8px 0 0', color: '#475569', fontSize: 12, fontWeight: 700 }}>
        OSNAP
      </legend>
      {modes.map(({ mode, label }) => (
        <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#172033' }}>
          <input
            type="checkbox"
            checked={enabledModes.has(mode)}
            onChange={() => onToggle(mode)}
            style={{ width: 15, height: 15, margin: 0, accentColor: '#2563eb' }}
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
