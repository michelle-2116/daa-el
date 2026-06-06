import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

// Custom Dot Renderer to highlight anomalies and rerouting events on the graph
const CustomizedDot = (props) => {
  const { cx, cy, payload } = props;

  if (payload.is_anomaly) {
    return (
      <circle cx={cx} cy={cy} r={3.5} fill="#EF4444" stroke="#FFFFFF" strokeWidth={1} />
    );
  }

  if (payload.is_reroute) {
    return (
      <circle cx={cx} cy={cy} r={3.5} fill="#F59E0B" stroke="#FFFFFF" strokeWidth={1} />
    );
  }

  return null; // Don't render dots for standard data points to keep chart clean
};

export default function TempChart({ history, threshold }) {
  // Pad history with default points if empty to make UI look nice
  const data = history && history.length > 0 ? history : [
    { time: "00:00", temp: 4.0, is_anomaly: false, is_reroute: false }
  ];

  return (
    <div className="h-full flex flex-col min-h-[180px]">
      <div className="flex items-center justify-between border-b border-brand-border pb-1 mb-2 select-none">
        <h2 className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-800">Thermal Log</h2>
        <div className="flex items-center space-x-3 text-[9px] font-mono">
          <div className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-danger"></span>
            <span className="text-slate-400 uppercase">Anomaly</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-warning"></span>
            <span className="text-slate-400 uppercase">Reroute</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full text-[10px] font-mono">
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" />
            <XAxis
              dataKey="time"
              stroke="#94A3B8"
              fontSize={9}
              tickLine={false}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={9}
              domain={[0, 'auto']}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E2E8F0",
                color: "#0F172A",
                borderRadius: "2px",
                fontSize: "10px",
                fontFamily: "monospace",
                boxShadow: "none",
                padding: "4px 8px"
              }}
            />
            <ReferenceLine
              y={threshold}
              stroke="#EF4444"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: `LIMIT (${threshold.toFixed(1)}C)`,
                fill: "#EF4444",
                fontSize: 8,
                position: "insideTopLeft",
                fontFamily: "monospace"
              }}
            />
            <Line
              type="monotone"
              dataKey="temp"
              stroke="#0284c7"
              strokeWidth={1.5}
              dot={<CustomizedDot />}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
