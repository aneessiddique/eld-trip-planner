import React from "react";
import { Clock, MapPin, Fuel, Bed, Truck } from "lucide-react";

const STATUS_ROW = {
  OFF_DUTY: 0,
  SLEEPER: 1,
  DRIVING: 2,
  ON_DUTY: 3,
};

const STATUS_COLOR = {
  OFF_DUTY: "#a0aec0",
  SLEEPER: "#4a5568",
  DRIVING: "#2b6cb0",
  ON_DUTY: "#dd6b20",
};

const STATUS_LABEL = {
  OFF_DUTY: "Off Duty",
  SLEEPER: "Sleeper Berth",
  DRIVING: "Driving",
  ON_DUTY: "On Duty",
};

const STATUS_ICON = {
  OFF_DUTY: Clock,
  SLEEPER: Bed,
  DRIVING: Truck,
  ON_DUTY: MapPin,
};

const hourWidth = 32;
const svgWidth = hourWidth * 24 + 80;
const rowHeight = 28;

function getTimePosition(dateString) {
  const date = new Date(dateString);
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  return hours * hourWidth;
}

function LogSheetRenderer({ log }) {
  if (!log) {
    return (
      <div className="text-center text-slate-500 py-8">
        <div className="text-3xl mb-2">📊</div>
        <p className="font-medium">ELD Log Sheet</p>
        <p className="text-sm">Log sheet will appear after trip calculation</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{log.date}</h3>
          <p className="text-sm text-slate-500">Daily Log Sheet</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase tracking-widest">Total Hours</div>
          <div className="text-lg font-mono font-bold text-slate-800">24.0</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-400"></div>
            <span>Off Duty: {log.totals?.OFF_DUTY || 0}h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-600"></div>
            <span>Sleeper: {log.totals?.SLEEPER || 0}h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Driving: {log.totals?.DRIVING || 0}h</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>On Duty: {log.totals?.ON_DUTY || 0}h</span>
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto">
        <svg width={svgWidth} height={rowHeight * 4 + 40} className="border border-slate-200 rounded-lg">
          {/* Hour markers */}
          {[...Array(25)].map((_, index) => {
            const x = index * hourWidth + 60;
            const isMajor = index % 4 === 0;
            return (
              <g key={index}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={rowHeight * 4}
                  stroke={isMajor ? "#475569" : "#e2e8f0"}
                  strokeWidth={isMajor ? 2 : 1}
                />
                <text
                  x={x + 2}
                  y={rowHeight * 4 + 16}
                  fontSize="10"
                  fill="#64748b"
                  className="font-mono"
                >
                  {index.toString().padStart(2, '0')}
                </text>
              </g>
            );
          })}

          {/* Status rows */}
          {Object.entries(STATUS_ROW).map(([status, rowIndex]) => {
            const Icon = STATUS_ICON[status];
            const y = rowIndex * rowHeight + 16;
            return (
              <g key={status}>
                <rect
                  x={0}
                  y={rowIndex * rowHeight}
                  width={60}
                  height={rowHeight}
                  fill="#f8fafc"
                  stroke="#e2e8f0"
                />
                <foreignObject x={8} y={rowIndex * rowHeight + 4} width={16} height={16}>
                  <div className="flex items-center justify-center">
                    <Icon size={12} className="text-slate-600" />
                  </div>
                </foreignObject>
                <text x={30} y={y} fontSize="10" fill="#374151" className="font-medium">
                  {STATUS_LABEL[status]}
                </text>
                <line
                  x1={60}
                  y1={rowIndex * rowHeight + rowHeight - 1}
                  x2={svgWidth}
                  y2={rowIndex * rowHeight + rowHeight - 1}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Event overlays */}
          {log.entries?.map((entry, index) => {
            const x = 60 + getTimePosition(entry.start_time);
            const width = Math.max(2, entry.duration_hours * hourWidth);
            const y = STATUS_ROW[entry.status] * rowHeight + 2;
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={rowHeight - 4}
                  fill={STATUS_COLOR[entry.status] || "#718096"}
                  opacity="0.9"
                  rx="2"
                />
                <title>{`${entry.description} (${entry.duration_hours}h)`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      {log.remarks && log.remarks.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-widest">Remarks</h4>
          <ul className="space-y-2">
            {log.remarks.map((remark, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0"></div>
                {remark}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LogSheetRenderer;
