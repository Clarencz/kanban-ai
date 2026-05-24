interface DependencyGraphProps {
  taskTitle: string;
  executions: Array<{
    id: number;
    executionOrder: number;
    status: string;
    agentId: number;
  }>;
  agentNames?: Record<number, string>;
}

const STATUS_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  pending:   { fill: "#374151", stroke: "#6b7280", text: "#d1d5db" },
  running:   { fill: "#1e3a5f", stroke: "#3b82f6", text: "#93c5fd" },
  completed: { fill: "#14532d", stroke: "#22c55e", text: "#86efac" },
  failed:    { fill: "#450a0a", stroke: "#ef4444", text: "#fca5a5" },
  retrying:  { fill: "#451a03", stroke: "#f59e0b", text: "#fde68a" },
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.pending;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 52;
const NODE_GAP = 60;
const ORIGIN_NODE_WIDTH = 120;
const PADDING_X = 24;
const PADDING_Y = 24;

export default function DependencyGraph({
  taskTitle,
  executions,
  agentNames,
}: DependencyGraphProps) {
  if (executions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          className="mb-3 opacity-30"
        >
          <circle cx="12" cy="24" r="6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="36" cy="24" r="6" stroke="currentColor" strokeWidth="1.5" />
          <line
            x1="18"
            y1="24"
            x2="30"
            y2="24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>
        <p className="text-sm">No execution chain yet</p>
        <p className="text-xs opacity-60 mt-1">
          Run agents to visualize the DAG
        </p>
      </div>
    );
  }

  const sorted = [...executions].sort(
    (a, b) => a.executionOrder - b.executionOrder,
  );

  const totalNodes = sorted.length;
  const svgWidth =
    PADDING_X * 2 +
    ORIGIN_NODE_WIDTH +
    NODE_GAP +
    totalNodes * NODE_WIDTH +
    (totalNodes - 1) * NODE_GAP;
  const svgHeight = PADDING_Y * 2 + NODE_HEIGHT;

  const originX = PADDING_X;
  const originY = PADDING_Y;
  const originCenterX = originX + ORIGIN_NODE_WIDTH / 2;
  const originCenterY = originY + NODE_HEIGHT / 2;

  function getNodeX(index: number) {
    return PADDING_X + ORIGIN_NODE_WIDTH + NODE_GAP + index * (NODE_WIDTH + NODE_GAP);
  }

  function truncateText(text: string, maxLength: number) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1) + "…";
  }

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="block"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
          </marker>
        </defs>

        {/* Origin node — Task */}
        <rect
          x={originX}
          y={originY}
          width={ORIGIN_NODE_WIDTH}
          height={NODE_HEIGHT}
          rx={10}
          fill="#1e1e2e"
          stroke="#6b7280"
          strokeWidth={1.5}
        />
        <text
          x={originCenterX}
          y={originCenterY - 6}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize={9}
          fontFamily="system-ui, sans-serif"
        >
          TASK
        </text>
        <text
          x={originCenterX}
          y={originCenterY + 8}
          textAnchor="middle"
          fill="#e5e7eb"
          fontSize={11}
          fontWeight={500}
          fontFamily="system-ui, sans-serif"
        >
          {truncateText(taskTitle, 14)}
        </text>

        {/* Execution nodes */}
        {sorted.map((exec, i) => {
          const x = getNodeX(i);
          const y = PADDING_Y;
          const centerX = x + NODE_WIDTH / 2;
          const centerY = y + NODE_HEIGHT / 2;
          const colors = getStatusColor(exec.status);
          const agentName =
            agentNames?.[exec.agentId] ?? `Agent #${exec.agentId}`;

          // Arrow from previous node
          const prevRightX =
            i === 0
              ? originX + ORIGIN_NODE_WIDTH
              : getNodeX(i - 1) + NODE_WIDTH;
          const prevCenterY = originCenterY;

          return (
            <g key={exec.id}>
              {/* Connecting arrow */}
              <line
                x1={prevRightX + 4}
                y1={prevCenterY}
                x2={x - 4}
                y2={centerY}
                stroke="#6b7280"
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
              />

              {/* Node */}
              <rect
                x={x}
                y={y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={10}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={1.5}
              />

              {/* Status indicator dot */}
              <circle cx={x + 14} cy={centerY} r={4} fill={colors.stroke}>
                {exec.status === "running" && (
                  <animate
                    attributeName="opacity"
                    values="1;0.3;1"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                )}
                {exec.status === "retrying" && (
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={`0 ${x + 14} ${centerY};360 ${x + 14} ${centerY}`}
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>

              {/* Agent name */}
              <text
                x={x + 26}
                y={centerY - 5}
                fill={colors.text}
                fontSize={11}
                fontWeight={500}
                fontFamily="system-ui, sans-serif"
              >
                {truncateText(agentName, 14)}
              </text>

              {/* Order label */}
              <text
                x={x + 26}
                y={centerY + 10}
                fill={colors.text}
                fontSize={9}
                opacity={0.7}
                fontFamily="system-ui, sans-serif"
              >
                Step {exec.executionOrder + 1} · {exec.status}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
