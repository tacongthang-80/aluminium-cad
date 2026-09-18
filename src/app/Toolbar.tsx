import type { Tool } from './tool';

interface ToolbarProps {
  readonly activeTool: Tool;
  readonly onToolChange: (tool: Tool) => void;
  readonly orthoEnabled: boolean;
  readonly onOrthoToggle: () => void;
}

const tools: ReadonlyArray<{ tool: Tool; label: string }> = [
  { tool: 'pan', label: 'Chọn / Di chuyển' },
  { tool: 'segment', label: 'Vẽ đoạn thẳng' },
  { tool: 'rectangle', label: 'Vẽ hình chữ nhật' },
  { tool: 'trim', label: 'Cắt (Trim)' },
  { tool: 'extend', label: 'Kéo dài (Extend)' },
];

function buttonStyle(active: boolean) {
  return {
    minHeight: 34,
    padding: '6px 10px',
    border: `1px solid ${active ? '#1d4ed8' : '#94a3b8'}`,
    borderRadius: 4,
    background: active ? '#2563eb' : '#ffffff',
    color: active ? '#ffffff' : '#172033',
    font: '600 13px/20px Inter, ui-sans-serif, system-ui, sans-serif',
    letterSpacing: 0,
    cursor: 'pointer',
  } as const;
}

export function Toolbar({
  activeTool,
  onToolChange,
  orthoEnabled,
  onOrthoToggle,
}: ToolbarProps) {
  return (
    <div role="toolbar" aria-label="Công cụ vẽ" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tools.map(({ tool, label }) => {
          const active = tool === activeTool;
          return (
            <button
              key={tool}
              type="button"
              aria-pressed={active}
              onClick={() => onToolChange(tool)}
              style={buttonStyle(active)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden="true" style={{ width: 1, height: 24, background: '#cbd5e1' }} />
        <button
          type="button"
          aria-pressed={orthoEnabled}
          onClick={onOrthoToggle}
          style={buttonStyle(orthoEnabled)}
        >
          Ortho
        </button>
      </div>
    </div>
  );
}
