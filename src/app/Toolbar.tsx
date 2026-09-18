import type { Tool } from './tool';

interface ToolbarProps {
  readonly activeTool: Tool;
  readonly onToolChange: (tool: Tool) => void;
}

const tools: ReadonlyArray<{ tool: Tool; label: string }> = [
  { tool: 'pan', label: 'Chọn / Di chuyển' },
  { tool: 'segment', label: 'Vẽ đoạn thẳng' },
  { tool: 'rectangle', label: 'Vẽ hình chữ nhật' },
];

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <div role="toolbar" aria-label="Công cụ vẽ" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {tools.map(({ tool, label }) => {
        const active = tool === activeTool;
        return (
          <button
            key={tool}
            type="button"
            aria-pressed={active}
            onClick={() => onToolChange(tool)}
            style={{
              minHeight: 34,
              padding: '6px 10px',
              border: `1px solid ${active ? '#1d4ed8' : '#94a3b8'}`,
              borderRadius: 4,
              background: active ? '#2563eb' : '#ffffff',
              color: active ? '#ffffff' : '#172033',
              font: '600 13px/20px Inter, ui-sans-serif, system-ui, sans-serif',
              letterSpacing: 0,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
