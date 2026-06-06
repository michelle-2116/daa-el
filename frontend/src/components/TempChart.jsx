import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { Activity } from "lucide-react";

// Custom Dot Renderer to highlight anomalies and rerouting events on the graph
const CustomizedDot = (props) => {
  const { cx, cy, payload } = props;

  if (payload.is_anomaly) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={7} fill="#EF4444" fillOpacity={0.25} />
        <circle cx={cx} cy={cy} r={4} fill="#EF4444" stroke="#FFFFFF" strokeWidth={1.5} />
      </g>
    );
  }

  if (payload.is_reroute) {
    return (
      <g>
        {/* Render a small diamond for rerouting */}
        <path
          d={`M ${cx} ${cy - 6} L ${cx + 5} ${cy} L ${cx} ${cy + 6} L ${cx - 5} ${cy} Z`}
          fill="#4F46E5"
          stroke="#FFFFFF"
          strokeWidth={1.5}
        />
      </g>
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
    <div className="glass-card p-4 rounded-xl border border-brand-glassBorder shadow-md h-full flex flex-col min-h-[220px]">
      <div className="flex items-center justify-between border-b border-brand-glassBorder pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-brand-neonBlue" />
          <h2 className="font-bold text-xs uppercase tracking-wider text-brand-neonBlue">Real-time Thermal Telemetry</h2>
        </div>
        <div className="flex items-center space-x-4 text-[10px]">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-danger"></span>
            <span className="text-slate-500">Anomaly Point</span>
          </div>
          <div className="flex items-center space-x-1">
            {/* Diamond marker key */}
            <span className="w-2 h-2 rotate-45 bg-purple-600"></span>
            <span className="text-slate-500">Reroute Point</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full text-xs">
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="time"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke="#64748B"
              fontSize={10}
              domain={[0, 'auto']}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E2E8F0",
                color: "#0F172A",
                borderRadius: "6px",
                fontFamily: "sans-serif",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}
            />
            <ReferenceLine
              y={threshold}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Limit (${threshold}°C)`,
                fill: "#EF4444",
                fontSize: 9,
                position: "top"
              }}
            />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#tempGradient)"
              dot={<CustomizedDot />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
